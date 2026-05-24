import { createClientServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { r2Client, BUCKET_NAME } from '@/lib/r2';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

async function cleanExpiredPosts(supabase) {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Fetch expired posts
    const { data: expiredPosts, error: fetchError } = await supabase
      .from('posts')
      .select('id, media_key')
      .lt('created_at', oneWeekAgo);

    if (fetchError) throw fetchError;

    if (expiredPosts && expiredPosts.length > 0) {
      const expiredIds = expiredPosts.map(p => p.id);

      // 1. Delete R2 files
      for (const post of expiredPosts) {
        if (post.media_key) {
          try {
            await r2Client.send(new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: post.media_key,
            }));
          } catch (r2Err) {
            console.error('R2 auto-deletion failed for:', post.media_key, r2Err);
          }
        }
      }

      // 2. Delete comments of these posts
      await supabase.from('comments').delete().in('post_id', expiredIds);

      // 3. Delete from public.posts
      await supabase.from('posts').delete().in('id', expiredIds);

      console.log(`Successfully auto-deleted ${expiredIds.length} expired posts.`);
    }
  } catch (err) {
    console.error('Error during auto-cleanup:', err);
  }
}

export async function GET(request) {
  try {
    const supabase = await createClientServer();
    
    // Run automated cleanup of expired posts (older than 7 days)
    await cleanExpiredPosts(supabase);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch user role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = profile?.role || 'team';

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const projectId = searchParams.get('projectId');
    const authorId = searchParams.get('authorId');
    
    let query = supabase
      .from('posts')
      .select('*, clients(company_name), projects(name), users:created_by(name)')
      .order('created_at', { ascending: false });

    if (clientId) query = query.eq('client_id', clientId);
    if (projectId) query = query.eq('project_id', projectId);

    if (role === 'admin') {
      if (authorId) query = query.eq('created_by', authorId);
    } else {
      query = query.eq('created_by', user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { caption, platform, media_url, media_key, media_type, media_size, thumbnail_url, project_id, client_id, status } = body;

    let finalClientId = client_id;
    if (!finalClientId && project_id) {
      const { data: proj } = await supabase
        .from('projects')
        .select('client_id')
        .eq('id', project_id)
        .single();
      if (proj?.client_id) {
        finalClientId = proj.client_id;
      }
    }

    const insertData = {
      caption,
      platform,
      media_url,
      media_key,
      media_type,
      media_size,
      thumbnail_url,
      project_id,
      client_id: finalClientId,
      status: status || 'draft',
      created_by: user.id
    };

    const { data, error } = await supabase.from('posts').insert(insertData).select();

    if (error) {
      console.error('Posts POST insert error:', error);
      throw error;
    }

    let postRow = null;
    if (data && data.length > 0) {
      postRow = data[0];
    } else {
      console.warn('Insert succeeded but no data returned due to RLS. Constructing fallback response.');
      postRow = {
        id: uuidv4(),
        ...insertData,
        created_at: new Date().toISOString()
      };
    }

    // Audit log
    try {
      const { data: uProfile } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
      const userName = uProfile?.name || user.email || 'Team Member';

      await supabase.from('audit_log').insert({
        user_id: user.id,
        user_name: userName,
        action: 'post_created',
        entity_type: 'post',
        entity_id: postRow.id,
        client_id: finalClientId || postRow.client_id
      });
    } catch (err) {
      console.error('Audit log insertion failed:', err);
    }

    return NextResponse.json(postRow);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
