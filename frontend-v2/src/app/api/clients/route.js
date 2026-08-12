import { createClientServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Prevent Vercel from caching this route's responses
export const dynamic = 'force-dynamic';

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

    const insertData = {
      company_name,
      contact_name,
      email,
      avatar_color,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from('clients')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Clients POST insert error:', error);
      throw error;
    }

    let clientRow = null;
    if (data && data.length > 0) {
      clientRow = data[0];
    } else {
      // Fallback if RLS select policy hides the row during the insert transaction
      console.warn('Insert succeeded but no data returned due to RLS. Constructing fallback response.');
      clientRow = {
        id: uuidv4(), // Fallback temporary UUID
        ...insertData,
        created_at: new Date().toISOString()
      };
    }

    // Audit log
    try {
      if (clientRow.id && !clientRow.id.toString().includes('-')) {
        await supabase.from('audit_log').insert({
          user_id: user.id,
          user_name: user.email,
          action: 'client_created',
          entity_type: 'client',
          entity_id: clientRow.id,
        });
      }
    } catch (err) {} // Don't fail if audit log fails

    return NextResponse.json(clientRow);
  } catch (e) {
    console.error('Clients POST error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/clients?clientId=...
export async function DELETE(request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) {
      // Check for foreign key constraint violation
      if (error.code === '23503') {
        return NextResponse.json({ error: 'Cannot delete this client because they have associated projects. Please delete the projects first.' }, { status: 400 });
      }
      throw error;
    }

    // Audit log
    try {
      await supabase.from('audit_log').insert({
        user_id: user.id,
        user_name: user.email,
        action: 'client_deleted',
        entity_type: 'client',
        entity_id: clientId,
      });
    } catch (err) {}

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Clients DELETE error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
