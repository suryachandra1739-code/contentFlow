import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, role, name } = await request.json();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is required to send invites. Please add it to your .env.local file.' }, { status: 500 });
    }

    // We must use the service role key to bypass RLS and create auth users
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Send invite email via Supabase Auth
    const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role, name } // This puts it in raw_user_meta_data
    });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    // 2. Add to public.users table (Supabase often handles this via triggers, but we can do it explicitly)
    // Actually, if we do it explicitly:
    await supabaseAdmin.from('users').upsert({
      id: authData.user.id,
      email: email,
      name: name,
      role: role,
      is_active: true
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invite Error:', error);
    return NextResponse.json({ error: 'Internal server error during invite' }, { status: 500 });
  }
}
