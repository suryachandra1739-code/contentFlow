import { createClientServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Service role client to read real tokens (bypasses RLS masking)
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * POST /api/posts/[id]/publish
 * body: { platforms: { facebook: true, instagram: true } }
 *
 * Publishes an approved post to the selected platforms via Meta Graph API.
 * Only team/admin can call this. Post must be in 'approved' status.
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const platforms = body.platforms || { facebook: true, instagram: true };
    const isAutoPublish = body.auto === true;

    let supabase;
    let userName = 'Auto-Publish System';
    let userId = null;

    if (isAutoPublish) {
      // Auto-publish from server actions (review.js / status route) — use service role
      supabase = getServiceSupabase();
    } else {
      // Manual publish from UI — require user auth
      supabase = await createClientServer();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

      const { data: profile } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', user.id)
        .single();

      const role = profile?.role || 'team';
      if (role === 'client') {
        return NextResponse.json({ error: 'Only team members can publish posts' }, { status: 403 });
      }
      userName = profile?.name || user.email || 'Team Member';
      userId = user.id;
    }

    // 2. Get post — must be approved
    const serviceDb = getServiceSupabase();
    const { data: post, error: postError } = await serviceDb
      .from('posts')
      .select('*, clients(company_name)')
      .eq('id', id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.status !== 'approved') {
      return NextResponse.json({ error: `Cannot publish — post status is "${post.status}". Only approved posts can be published.` }, { status: 400 });
    }

    if (!post.client_id) {
      return NextResponse.json({ error: 'Post has no associated client' }, { status: 400 });
    }

    // 3. Fetch social connections (using service role to get real tokens)
    const { data: connections, error: connError } = await serviceDb
      .from('social_connections')
      .select('*')
      .eq('client_id', post.client_id)
      .eq('token_valid', true);

    if (connError || !connections || connections.length === 0) {
      return NextResponse.json({
        error: 'No connected social accounts found for this client. Connect accounts in Client Settings first.',
      }, { status: 400 });
    }

    // Build caption
    const caption = [post.caption, post.hashtags].filter(Boolean).join('\n\n');
    const results = {};

    // 5. Publish to Facebook
    if (platforms.facebook) {
      const fbConn = connections.find(c => c.platform === 'facebook');
      if (!fbConn) {
        results.facebook = { success: false, error: 'No Facebook Page connected' };
      } else {
        try {
          results.facebook = await publishToFacebook(fbConn, post, caption);
        } catch (err) {
          results.facebook = { success: false, error: err.message };
        }
      }
    }

    // 6. Publish to Instagram
    if (platforms.instagram) {
      const igConn = connections.find(c => c.platform === 'instagram');
      if (!igConn) {
        results.instagram = { success: false, error: 'No Instagram Business account connected' };
      } else {
        try {
          results.instagram = await publishToInstagram(igConn, post, caption);
        } catch (err) {
          results.instagram = { success: false, error: err.message };
        }
      }
    }

    // 7. If at least one platform succeeded, update status to 'published'
    const anySuccess = Object.values(results).some(r => r.success);

    if (anySuccess) {
      await serviceDb
        .from('posts')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', id);
    }

    // 8. Log to audit
    await serviceDb.from('audit_log').insert({
      user_id: userId,
      user_name: userName,
      action: anySuccess ? 'post_published' : 'post_publish_failed',
      entity_type: 'post',
      entity_id: id,
      client_id: post.client_id,
      metadata: {
        platforms: results,
        published_to: Object.entries(results)
          .filter(([, r]) => r.success)
          .map(([p]) => p),
      },
    });

    return NextResponse.json({
      success: anySuccess,
      results,
      status: anySuccess ? 'published' : 'failed',
    });

  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Publish to Facebook Page
 * Uses Page Access Token to post a photo or link post
 */
async function publishToFacebook(conn, post, caption) {
  const pageId = conn.page_id;
  const token = conn.page_access_token;

  if (post.media_url && post.media_type === 'image') {
    // Photo post
    const url = `https://graph.facebook.com/v21.0/${pageId}/photos`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: post.media_url,
        message: caption,
        access_token: token,
      }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Facebook photo post failed');
    return { success: true, post_id: data.id || data.post_id };
  }

  if (post.media_url && post.media_type === 'video') {
    // Video post — use feed endpoint with link
    const url = `https://graph.facebook.com/v21.0/${pageId}/videos`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_url: post.media_url,
        description: caption,
        access_token: token,
      }),
      signal: AbortSignal.timeout(60000),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Facebook video post failed');
    return { success: true, post_id: data.id };
  }

  // Text-only post
  const url = `https://graph.facebook.com/v21.0/${pageId}/feed`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: caption,
      access_token: token,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Facebook text post failed');
  return { success: true, post_id: data.id };
}

/**
 * Publish to Instagram Business Account
 * Two-step: Create media container → Publish container
 * Instagram requires a publicly accessible image URL
 */
async function publishToInstagram(conn, post, caption) {
  const igId = conn.ig_business_account_id;
  const token = conn.page_access_token;

  if (!igId) throw new Error('No Instagram Business Account ID found');
  if (!post.media_url) throw new Error('Instagram requires an image or video to post');

  // Step 1: Create media container
  const containerPayload = {
    caption,
    access_token: token,
  };

  if (post.media_type === 'video') {
    containerPayload.media_type = 'VIDEO';
    containerPayload.video_url = post.media_url;
  } else {
    containerPayload.image_url = post.media_url;
  }

  const containerRes = await fetch(`https://graph.facebook.com/v21.0/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(containerPayload),
    signal: AbortSignal.timeout(30000),
  });
  const containerData = await containerRes.json();

  if (containerData.error) {
    throw new Error(containerData.error.message || 'Instagram container creation failed');
  }

  const containerId = containerData.id;

  // For video, we need to wait for processing
  if (post.media_type === 'video') {
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2s = 60s max wait
    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(
        `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${token}`
      );
      const statusData = await statusRes.json();
      if (statusData.status_code === 'FINISHED') break;
      if (statusData.status_code === 'ERROR') {
        throw new Error('Instagram video processing failed');
      }
      attempts++;
    }
    if (attempts >= maxAttempts) {
      throw new Error('Instagram video processing timed out');
    }
  }

  // Step 2: Publish the container
  const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: token,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const publishData = await publishRes.json();

  if (publishData.error) {
    throw new Error(publishData.error.message || 'Instagram publish failed');
  }

  return { success: true, post_id: publishData.id };
}
