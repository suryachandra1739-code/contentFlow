import { createClientServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = await createClientServer();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const projectId = searchParams.get('projectId');
    
    let query = supabase.from('posts').select('*, clients(company_name), projects(name)').order('created_at', { ascending: false });

    if (clientId) query = query.eq('client_id', clientId);
    if (projectId) query = query.eq('project_id', projectId);

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

    const { data, error } = await supabase.from('posts').insert({
      caption,
      platform,
      media_url,
      media_key,
      media_type,
      media_size,
      thumbnail_url,
      project_id,
      client_id,
      status: status || 'draft',
      created_by: user.id
    }).select().single();

    if (error) throw error;

    // Audit log
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'post_created',
      entity_type: 'post',
      entity_id: data.id,
      client_id: client_id
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
