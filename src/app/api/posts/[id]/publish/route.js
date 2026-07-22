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
    const platforms = body.platforms || { facebook: true, instagram: true, youtube: true };
    const isAutoPublish = body.auto === true;
    // youtubeType: 'short' (default, appends #Shorts) | 'video' (regular upload)
    const youtubeType = body.youtubeType || 'short';

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

    // 7. Publish to YouTube (Shorts or regular video, or Community Post for images)
    if (platforms.youtube) {
      const ytConn = connections.find(c => c.platform === 'youtube');
      if (!ytConn) {
        results.youtube = { success: false, error: 'No YouTube Channel connected' };
      } else {
        try {
          results.youtube = await publishToYoutube(ytConn, post, caption, serviceDb, youtubeType);
        } catch (err) {
          console.error('[YouTube] Publish error:', err);
          results.youtube = { success: false, error: err.message };
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

/**
 * Refreshes Google/YouTube Access Token if expired
 */
async function getFreshYoutubeToken(conn, supabase) {
  const updatedTime = new Date(conn.updated_at).getTime();
  const now = Date.now();
  
  // If token is less than 50 minutes old, reuse it
  if (now - updatedTime < 50 * 60 * 1000 && conn.page_access_token) {
    return conn.page_access_token;
  }

  if (!conn.refresh_token) {
    throw new Error('YouTube connection has no refresh token. Please reconnect the YouTube account.');
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      refresh_token: conn.refresh_token,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(10000),
  });

  const data = await tokenRes.json();
  if (data.error) {
    throw new Error(`Failed to refresh YouTube token: ${data.error_description || data.error}`);
  }

  const newAccessToken = data.access_token;
  
  // Update token in database
  await supabase
    .from('social_connections')
    .update({
      page_access_token: newAccessToken,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conn.id);

  return newAccessToken;
}

/**
 * Dispatch YouTube publish — routes to video upload or community post based on media type.
 * @param {string} youtubeType  'short' | 'video'
 */
async function publishToYoutube(conn, post, caption, supabase, youtubeType = 'short') {
  const accessToken = await getFreshYoutubeToken(conn, supabase);

  if (!post.media_url) {
    throw new Error('YouTube requires a media file. Please attach an image or video.');
  }

  // Images go via Community Posts; videos go via Data API upload
  if (post.media_type === 'image') {
    return publishYoutubeCommunityPost(accessToken, post, caption);
  }

  return uploadYoutubeVideo(accessToken, post, caption, youtubeType);
}

/**
 * Posts an image as a YouTube Community Post.
 * Requires the channel to have ≥500 subscribers.
 */
async function publishYoutubeCommunityPost(accessToken, post, caption) {
  const body = {
    snippet: {
      type: 'imagePost',
      text: caption,
      imageUrl: post.media_url,
    },
  };

  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/posts?part=snippet',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    }
  );

  const data = await res.json();
  console.log('[YouTube Community Post] Response:', JSON.stringify(data));

  if (data.error) {
    // 403 means channel not eligible (needs 500+ subscribers)
    if (res.status === 403) {
      throw new Error(
        'YouTube Community Posts require 500+ subscribers. Your channel is not yet eligible, or this feature is not enabled. ' +
        'You can still post videos — images cannot be uploaded as stand-alone YouTube videos.'
      );
    }
    throw new Error(data.error.message || 'YouTube Community Post failed');
  }

  return { success: true, post_id: data.id, type: 'community_post' };
}

/**
 * Uploads a video to YouTube using the Resumable Upload API (recommended for all video sizes).
 * Single-shot multipart uploads can be auto-removed by YouTube's integrity systems; the
 * resumable protocol is fully recognised by YouTube's pipeline and avoids this issue.
 * @param {string} youtubeType  'short' (adds #Shorts) | 'video' (regular)
 */
async function uploadYoutubeVideo(accessToken, post, caption, youtubeType) {
  // Build title — YouTube title limit is 100 chars
  const baseTitle = (post.title || post.caption || 'New Video').slice(0, youtubeType === 'short' ? 91 : 99);
  const videoTitle = youtubeType === 'short' ? `${baseTitle} #Shorts` : baseTitle;

  const metadata = {
    snippet: {
      title: videoTitle,
      description: caption || '',
      categoryId: '22', // People & Blogs
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false,
    },
  };

  // Fetch media from storage (Cloudflare R2)
  const mediaRes = await fetch(post.media_url, { signal: AbortSignal.timeout(120000) });
  if (!mediaRes.ok) {
    throw new Error(`Failed to fetch video from storage: ${mediaRes.status} ${mediaRes.statusText}`);
  }
  const mediaBuffer = await mediaRes.arrayBuffer();
  const contentType = mediaRes.headers.get('content-type') || 'video/mp4';
  const contentLength = mediaBuffer.byteLength;

  console.log(`[YouTube Resumable] Initiating upload for ${(contentLength / 1024 / 1024).toFixed(1)} MB as ${youtubeType}...`);

  // ── Step 1: Initiate the resumable upload session ────────────────────────────
  // POST with JSON metadata to get a session URI (Location header)
  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': contentType,
        'X-Upload-Content-Length': contentLength.toString(),
      },
      body: JSON.stringify(metadata),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!initRes.ok) {
    const errText = await initRes.text().catch(() => initRes.statusText);
    throw new Error(`YouTube resumable init failed (${initRes.status}): ${errText}`);
  }

  const uploadUri = initRes.headers.get('location');
  if (!uploadUri) {
    throw new Error('YouTube did not return a resumable upload URI');
  }

  console.log(`[YouTube Resumable] Session URI obtained. Uploading ${(contentLength / 1024 / 1024).toFixed(1)} MB...`);

  // ── Step 2: Upload the video bytes to the session URI ───────────────────────
  // Use a generous 8-minute timeout for large video uploads
  const uploadRes = await fetch(uploadUri, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': contentType,
      'Content-Length': contentLength.toString(),
    },
    body: mediaBuffer,
    signal: AbortSignal.timeout(480000), // 8-minute timeout
  });

  const uploadData = await uploadRes.json();
  console.log('[YouTube Resumable] Response:', JSON.stringify(uploadData).slice(0, 500));

  if (uploadData.error) {
    const detail = uploadData.error.errors?.[0]?.reason || uploadData.error.message || 'YouTube upload failed';
    throw new Error(`YouTube upload failed: ${detail}`);
  }

  const videoId = uploadData.id;
  return {
    success: true,
    post_id: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    type: youtubeType === 'short' ? 'short' : 'video',
  };
}
