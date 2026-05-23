import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://content-flow-eight-mu.vercel.app';

function rewriteActionLink(actionLink, nextPath = '/update-password') {
  try {
    const url = new URL(actionLink);
    const tokenHash = url.searchParams.get('token') || url.searchParams.get('token_hash');
    const linkType = url.searchParams.get('type');

    if (tokenHash && linkType) {
      return `${SITE_URL}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(linkType)}&next=${encodeURIComponent(nextPath)}`;
    }
    return actionLink;
  } catch (err) {
    console.error('Error rewriting action link:', err);
    return actionLink;
  }
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is required to reset passwords.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify if user exists in auth
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('List users error:', listError);
      return NextResponse.json({ error: 'Failed to verify user existence' }, { status: 500 });
    }

    const existingUser = listData?.users?.find(u => u.email === email);
    if (!existingUser) {
      // Return success anyway to prevent email enumeration, but don't do anything
      return NextResponse.json({ success: true, message: 'Password reset link sent if account exists' });
    }

    const redirectTo = `${SITE_URL}/auth/confirm?next=/update-password`;

    const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: { redirectTo },
    });

    if (recoveryError) {
      console.error('Recovery link error:', recoveryError);
      return NextResponse.json({ error: recoveryError.message }, { status: 400 });
    }

    const rawActionLink = recoveryData?.properties?.action_link;
    const directLink = rawActionLink ? rewriteActionLink(rawActionLink) : null;

    let emailSent = false;
    if (directLink && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'ContentFlow <onboarding@resend.dev>',
          to: [email],
          subject: 'Reset Your Password — ContentFlow',
          html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="460" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background:#161616;padding:28px 32px;">
          <span style="color:#ffffff;font-size:18px;font-weight:600;">📦 ContentFlow</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:22px;color:#111;">Reset your password</h1>
          <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">Click the button below to set a new password for your account.</p>
          <a href="${directLink}" style="display:inline-block;background:#e5484d;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
            Reset Password →
          </a>
          <p style="margin:24px 0 0;color:#999;font-size:12px;line-height:1.5;">
            This link will expire in 24 hours. If you didn't request this reset, you can safely ignore this email.
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

    return NextResponse.json({
      success: true,
      emailSent,
    });
  } catch (err) {
    console.error('Reset Password Error:', err);
    return NextResponse.json({ error: 'Internal server error during reset password' }, { status: 500 });
  }
}
