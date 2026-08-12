import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  try {
    const { token } = await params;
    const supabase = await createClientServer();

    const { data: post, error } = await supabase
      .from('posts')
      .select('*, projects(name), clients(company_name)')
      .eq('review_token', token)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Invalid review link' }, { status: 404 });
    }

    const { data: comments } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', post.id)
      .eq('is_internal', false)
      .order('created_at', { ascending: true });

    return NextResponse.json({ ...post, comments: comments || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const supabase = await createClientServer();

    const { data: post } = await supabase
      .from('posts')
      .select('*')
      .eq('review_token', token)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Invalid review link' }, { status: 404 });
    }

    const body = await request.json();

    if (body.action === 'comment') {
      const { data: comment, error } = await supabase.from('comments').insert({
        post_id: post.id,
        content: body.content,
        is_internal: false,
      }).select().single();

      if (error) throw error;
      return NextResponse.json(comment);
    }

    if (body.action === 'status' && ['approved', 'revision', 'rejected'].includes(body.status)) {
      const updateData = { status: body.status };
      if (body.status === 'approved') updateData.approved_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', post.id)
        .select()
        .single();

      if (error) throw error;

      const { data: clientData } = await supabase
        .from('clients')
        .select('company_name')
        .eq('id', post.client_id)
        .single();
      const clientName = clientData?.company_name ? `Client (${clientData.company_name})` : 'Client (Anonymous)';

      await supabase.from('audit_log').insert({
        action: `post_${body.status}`,
        entity_type: 'post',
        entity_id: post.id,
        client_id: post.client_id,
        user_name: clientName,
        metadata: { token_used: true },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
