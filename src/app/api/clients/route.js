import { createClientServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClientServer();
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
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

    const { data, error } = await supabase.from('clients').insert({
      ...body,
      created_by: user?.id
    }).select().single();
    if (error) throw error;

    await supabase.from('audit_log').insert({
      user_id: user?.id,
      action: 'client_created',
      entity_type: 'client',
      entity_id: data.id,
      client_id: data.id
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
