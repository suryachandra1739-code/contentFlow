import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://content-flow-eight-mu.vercel.app';

export async function POST(request) {
  try {
    const { email, role, name, client_id } = await request.json();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is required to send invites.' }, { status: 500 });
    }

    if (!email || !role || !name) {
      return NextResponse.json({ error: 'Email, name, and role are required' }, { status: 400 });
    }

    if (role === 'client' && !client_id) {
      return NextResponse.json({ error: 'client_id is required when inviting a client user' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Redirect destination after Supabase verifies the token
    const redirectTo = `${SITE_URL}/auth/confirm?next=/update-password`;

    let userId;
    let actionLink;
    let isExistingUser = false;

    // --- Step 1: Generate the invite/recovery link ---
    // Using generateLink instead of inviteUserByEmail so we control
    // email delivery via Resend and avoid Supabase's built-in email
    // rate limits and deliverability issues.
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        data: { role, name },
        redirectTo: redirectTo,
      },
    });

    if (inviteError) {
      // User already exists — generate a recovery link instead
      if (
        inviteError.message.toLowerCase().includes('already registered') ||
        inviteError.message.toLowerCase().includes('already exists') ||
        inviteError.message.toLowerCase().includes('duplicate')
      ) {
        isExistingUser = true;

        // Find the existing user
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData?.users?.find(u => u.email === email);

        if (!existingUser) {
          return NextResponse.json({ error: 'Could not find the existing user account.' }, { status: 400 });
        }

        userId = existingUser.id;

        // Generate a recovery (password reset) link — ONE link only, no invalidation
        const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: redirectTo,
          },
        });

        if (recoveryError) {
          console.error('Recovery link error:', recoveryError);
          return NextResponse.json({ error: recoveryError.message }, { status: 400 });
        }

        actionLink = recoveryData?.properties?.action_link;
      } else {
        console.error('Invite error:', inviteError);
        return NextResponse.json({ error: inviteError.message }, { status: 400 });
      }
    } else {
      userId = inviteData.user.id;
      actionLink = inviteData.properties?.action_link;
    }

    // --- Step 2: Upsert the user record in our public.users table ---
    const userRow = {
      id: userId,
      email: email,
      name: name,
      role: role,
      is_active: true,
    };

    if (role === 'client' && client_id) {
      userRow.client_id = client_id;
    }

    const { error: upsertError } = await supabaseAdmin.from('users').upsert(userRow);
    if (upsertError) {
      console.error('User upsert error:', upsertError);
    }

    // --- Step 3: Send the invite email via Resend ---
    let emailSent = false;
    if (actionLink && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const portalType = role === 'client' ? 'Client Portal' : 'Dashboard';
        const subject = isExistingUser
          ? `Set your password — ContentFlow ${portalType}`
          : `You've been invited to ContentFlow ${portalType}`;

        const { error: emailError } = await resend.emails.send({
          from: 'ContentFlow <onboarding@resend.dev>',
          to: [email],
          subject: subject,
          html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="460" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background:#161616;padding:28px 32px;">
          <span style="color:#ffffff;font-size:18px;font-weight:600;">📦 ContentFlow</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:22px;color:#111;">
            ${isExistingUser ? 'Set your new password' : `Welcome to ContentFlow, ${name}!`}
          </h1>
          <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
            ${isExistingUser
              ? 'A password reset has been requested for your account. Click the button below to set a new password.'
              : `You've been invited to join ContentFlow as a <strong>${role === 'client' ? 'Client' : role === 'admin' ? 'Administrator' : 'Team Member'}</strong>. Click the button below to set your password and get started.`
            }
          </p>
          <a href="${actionLink}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
            Set Your Password →
          </a>
          <p style="margin:24px 0 0;color:#999;font-size:12px;line-height:1.5;">
            This link will expire in 24 hours. If you didn't expect this email, you can safely ignore it.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #eee;">
          <p style="margin:0;color:#999;font-size:11px;">ContentFlow — Content Approval Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
        });

        if (emailError) {
          console.error('Resend email error:', emailError);
        } else {
          emailSent = true;
        }
      } catch (emailErr) {
        console.error('Resend send error:', emailErr);
      }
    }

    // --- Step 4: Return success ---
    // If Resend failed or isn't configured, return the link so admin can share manually
    return NextResponse.json({
      success: true,
      userId: userId,
      emailSent: emailSent,
      // Only return link if email wasn't sent (fallback for admin to copy)
      inviteLink: emailSent ? '' : (actionLink || ''),
      isExistingUser: isExistingUser,
    });
  } catch (error) {
    console.error('Invite Error:', error);
    return NextResponse.json({ error: 'Internal server error during invite' }, { status: 500 });
  }
}
