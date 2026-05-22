import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

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

    const { data: project, error } = await supabase
      .from('projects')
      .select('*, clients(company_name, contact_name, avatar_color)')
      .eq('id', id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let postsQuery = supabase
      .from('posts')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (role !== 'admin') {
      postsQuery = postsQuery.eq('created_by', user.id);
    }

    const { data: posts } = await postsQuery;

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
