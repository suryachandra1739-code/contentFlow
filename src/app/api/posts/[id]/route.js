import { createClientServer } from '@/lib/supabase-server';
import { r2Client, BUCKET_NAME } from '@/lib/r2';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = profile?.role || 'team';

    const { data, error } = await supabase.from('posts').select('*, clients(company_name), projects(name)').eq('id', id).single();
    if (error) throw error;

    if (role !== 'admin' && data.created_by !== user.id) {
      return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
    }

    // Fetch activity (audit logs)
    const { data: activity } = await supabase
      .from('audit_log')
      .select('*')
      .eq('entity_type', 'post')
      .eq('entity_id', id)
      .order('created_at', { ascending: false });

    data.activity = activity || [];

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    // Fetch user role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = profile?.role || 'team';

    // Fetch post to check creator and media details for version history
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('created_by, media_url, media_type, caption, client_id')
      .eq('id', id)
      .single();
    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (role !== 'admin' && post.created_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    // Whitelist only known post columns to prevent Supabase errors
    const allowedFields = ['caption', 'media_url', 'media_type', 'media_key', 'media_size', 'platform', 'thumbnail_url', 'status', 'scheduled_date'];
    const updateData = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }
    
    const { data, error } = await supabase.from('posts').update(updateData).eq('id', id).select().single();
    if (error) throw error;

    // Determine what changed for version history
    const isMediaChanged = body.media_url && body.media_url !== post.media_url;
    const isCaptionChanged = body.caption !== undefined && body.caption !== post.caption;

    const { data: uProfile } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();
    const userName = uProfile?.name || user.email || 'Team Member';

    await supabase.from('audit_log').insert({
      user_id: user.id,
      user_name: userName,
      action: 'post_updated',
      entity_type: 'post',
      entity_id: id,
      client_id: data.client_id,
      metadata: {
        is_media_changed: isMediaChanged,
        previous_media_url: isMediaChanged ? post.media_url : null,
        previous_media_type: isMediaChanged ? post.media_type : null,
        previous_caption: isCaptionChanged ? post.caption : null
      }
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch the post to get the media_key and creator
    const { data: post, error: fetchError } = await supabase.from('posts').select('media_key, client_id, created_by').eq('id', id).single();
    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
    }

    // Check role and ownership
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = profile?.role || 'team';

    if (role !== 'admin' && post.created_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Delete the R2 file first
    if (post.media_key) {
      try {
        await r2Client.send(new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: post.media_key,
        }));
      } catch (r2Error) {
        console.error('Failed to delete from R2:', r2Error);
        // If R2 delete fails, log error and do not delete from Supabase
        await supabase.from('audit_log').insert({
          user_id: user?.id,
          action: 'r2_delete_failed',
          entity_type: 'post',
          entity_id: id,
          client_id: post.client_id,
          metadata: { error: r2Error.message, media_key: post.media_key }
        });
        return NextResponse.json({ error: 'Failed to delete media from R2 storage. Post was not deleted.' }, { status: 500 });
      }
    }

    // 3. Delete the Supabase record
    const { error: deleteError } = await supabase.from('posts').delete().eq('id', id);
    if (deleteError) throw deleteError;

    // Log deletion
    let userName = 'Team Member';
    if (user) {
      const { data: uProfile } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
      userName = uProfile?.name || user.email || 'Team Member';
    }

    await supabase.from('audit_log').insert({
      user_id: user?.id,
      user_name: userName,
      action: 'post_deleted',
      entity_type: 'post',
      entity_id: id,
      client_id: post.client_id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
