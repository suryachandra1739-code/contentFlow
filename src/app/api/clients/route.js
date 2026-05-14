// src/app/api/clients/route.js
import { createClientServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// GET /api/clients?clientId=...
export async function GET(request) {
  try {
    const supabase = await createClientServer();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    let query = supabase
      .from('clients')
      .select('*, created_by(id,email,role)')
      .order('created_at', { ascending: false });

    if (clientId) query = query.eq('id', clientId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error('Clients GET error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/clients
export async function POST(request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const {
      company_name,
      contact_name,
      email,
      avatar_color = '#161616'
    } = await request.json();

    const { data, error } = await supabase
      .from('clients')
      .insert({
        company_name,
        contact_name,
        email,
        avatar_color,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error('Clients POST error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
