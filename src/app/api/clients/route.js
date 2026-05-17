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
      .select('*')
      .order('created_at', { ascending: false });

    if (clientId) query = query.eq('id', clientId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
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

    const body = await request.json();

    // Accept both frontend field names and DB field names
    const company_name = body.company_name || body.company || body.name || '';
    const contact_name = body.contact_name || body.name || '';
    const email = body.email || '';
    const avatar_color = body.avatar_color || '#161616';

    if (!company_name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

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

    // Audit log
    await supabase.from('audit_log').insert({
      user_id: user.id,
      user_name: user.email,
      action: 'client_created',
      entity_type: 'client',
      entity_id: data.id,
    }).catch(() => {}); // Don't fail if audit log fails

    return NextResponse.json(data);
  } catch (e) {
    console.error('Clients POST error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
