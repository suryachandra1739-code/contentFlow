import { createClientServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = await createClientServer();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    let query = supabase.from('projects').select('*, clients(company_name)').order('created_at', { ascending: false });
    if (clientId) query = query.eq('client_id', clientId);

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
    const body = await request.json();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.from('projects').insert({
      ...body,
      created_by: user?.id
    }).select().single();
    if (error) throw error;

    await supabase.from('audit_log').insert({
      user_id: user?.id,
      action: 'project_created',
      entity_type: 'project',
      entity_id: data.id,
      client_id: data.client_id
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
