import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, role, name, client_id } = await request.json();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is required to send invites. Please add it to your .env.local file.' }, { status: 500 });
    }

    if (!email || !role || !name) {
      return NextResponse.json({ error: 'Email, name, and role are required' }, { status: 400 });
    }

    if (role === 'client' && !client_id) {
      return NextResponse.json({ error: 'client_id is required when inviting a client user' }, { status: 400 });
    }

    // We must use the service role key to bypass RLS and create auth users
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Construct the redirect URL dynamically using the request's origin
    const requestUrl = new URL(request.url);
    const redirectTo = `${requestUrl.origin}/update-password`;

    // 1. Send invite email via Supabase Auth
    const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role, name }, // This puts it in raw_user_meta_data
      redirectTo: redirectTo
    });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    // 2. Add to public.users table with role and optional client_id
    const userRow = {
      id: authData.user.id,
      email: email,
      name: name,
      role: role,
      is_active: true,
    };

    // Link client users to their client record
    if (role === 'client' && client_id) {
      userRow.client_id = client_id;
    }

    await supabaseAdmin.from('users').upsert(userRow);

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (error) {
    console.error('Invite Error:', error);
    return NextResponse.json({ error: 'Internal server error during invite' }, { status: 500 });
  }
}
