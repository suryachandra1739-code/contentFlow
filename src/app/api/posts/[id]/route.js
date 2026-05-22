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

    // Fetch post to check creator
    const { data: post, error: fetchError } = await supabase.from('posts').select('created_by').eq('id', id).single();
    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (role !== 'admin' && post.created_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { data, error } = await supabase.from('posts').update(body).eq('id', id).select().single();
    if (error) throw error;

    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'post_updated',
      entity_type: 'post',
      entity_id: id,
      client_id: data.client_id
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
    await supabase.from('audit_log').insert({
      user_id: user?.id,
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
