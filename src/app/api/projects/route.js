import { createClientServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// GET /api/projects?projectId=...&clientId=...
export async function GET(request) {
  try {
    const supabase = await createClientServer();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const clientId = searchParams.get('clientId');

    let query = supabase
      .from('projects')
      .select('*, clients(company_name, contact_name, avatar_color)')
      .order('created_at', { ascending: false });

    if (projectId) query = query.eq('id', projectId);
    if (clientId) query = query.eq('client_id', clientId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
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

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const insertData = {
      name,
      description,
      client_id: client_id || null,
      status,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(insertData)
      .select('*, clients(company_name, contact_name, avatar_color)');

    if (error) {
      console.error('Projects POST insert error:', error);
      throw error;
    }

    let projectRow = null;
    if (data && data.length > 0) {
      projectRow = data[0];
    } else {
      console.warn('Insert succeeded but no data returned due to RLS. Constructing fallback response.');
      projectRow = {
        id: uuidv4(),
        ...insertData,
        created_at: new Date().toISOString()
      };
    }

    // Audit log
    try {
      if (projectRow.id && !projectRow.id.toString().includes('-')) {
        await supabase.from('audit_log').insert({
          user_id: user.id,
          user_name: user.email,
          action: 'project_created',
          entity_type: 'project',
          entity_id: projectRow.id,
          client_id: client_id || null,
        });
      }
    } catch (err) {}

    return NextResponse.json(projectRow);
  } catch (e) {
    console.error('Projects POST error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
