import { createClientServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

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

    let finalClientId = client_id;
    if (!finalClientId && project_id) {
      const { data: proj } = await supabase
        .from('projects')
        .select('client_id')
        .eq('id', project_id)
        .single();
      if (proj?.client_id) {
        finalClientId = proj.client_id;
      }
    }

    const insertData = {
      caption,
      platform,
      media_url,
      media_key,
      media_type,
      media_size,
      thumbnail_url,
      project_id,
      client_id: finalClientId,
      status: status || 'draft',
      created_by: user.id
    };

    const { data, error } = await supabase.from('posts').insert(insertData).select();

    if (error) {
      console.error('Posts POST insert error:', error);
      throw error;
    }

    let postRow = null;
    if (data && data.length > 0) {
      postRow = data[0];
    } else {
      console.warn('Insert succeeded but no data returned due to RLS. Constructing fallback response.');
      postRow = {
        id: uuidv4(),
        ...insertData,
        created_at: new Date().toISOString()
      };
    }

    // Audit log
    try {
      if (postRow.id && !postRow.id.toString().includes('-')) {
        await supabase.from('audit_log').insert({
          user_id: user.id,
          action: 'post_created',
          entity_type: 'post',
          entity_id: postRow.id,
          client_id: client_id
        });
      }
    } catch (err) {}

    return NextResponse.json(postRow);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
