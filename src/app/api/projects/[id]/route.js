import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClientServer();

    const { data: project, error } = await supabase
      .from('projects')
      .select('*, clients(company_name, contact_name, avatar_color)')
      .eq('id', id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ ...project, posts: posts || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClientServer();
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
