import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClientServer();

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*, users(name)')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(comments || []);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClientServer();

    if (!body.content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data: comment, error } = await supabase.from('comments').insert({
      post_id: id,
      user_id: user?.id,
      content: body.content,
      is_internal: body.is_internal || false,
    }).select('*, users(name)').single();

    if (error) throw error;
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
