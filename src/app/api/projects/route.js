// src/app/api/projects/route.js
import { createClientServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// GET /api/projects?projectId=...
export async function GET(request) {
  try {
    const supabase = await createClientServer();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let query = supabase
      .from('projects')
      .select('*, client_id, created_by(id,email,role)')
      .order('created_at', { ascending: false });

    if (projectId) query = query.eq('id', projectId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error('Projects GET error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/projects
export async function POST(request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const {
      name,
      description = '',
      client_id,
      status = 'active'
    } = await request.json();

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        client_id,
        status,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error('Projects POST error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
