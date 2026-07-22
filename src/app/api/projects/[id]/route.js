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
      .select('role, client_id')
      .eq('id', user.id)
      .single();
    const role = profile?.role || 'team';
    const client_id = profile?.client_id;

    const { data: project, error } = await supabase
      .from('projects')
      .select('*, clients(company_name, contact_name, avatar_color)')
      .eq('id', id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Client role authorization: ensure the project belongs to the client's company
    if (role === 'client' && project.client_id !== client_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let postsQuery = supabase
      .from('posts')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (role === 'admin' || role === 'client') {
      // Admins and clients can see all posts under this project
    } else {
      // 'team' role
      postsQuery = postsQuery.eq('created_by', user.id);
    }

    const { data: posts } = await postsQuery;

    return NextResponse.json({ ...project, posts: posts || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/projects/[id]
 * Saves DM Bot config (keywords, message, links) into the project's dm_config JSONB column.
 * Only team/admin can call this — clients cannot modify project settings.
 */
export async function PATCH(request, { params }) {
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
    if (role === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = ['dm_config', 'name', 'description', 'status'];
    const update = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
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
