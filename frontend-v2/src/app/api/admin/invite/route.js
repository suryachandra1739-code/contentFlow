import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://content-flow-eight-mu.vercel.app';

/**
 * Rewrite Supabase's hosted actionLink into a direct link to our /auth/confirm route.
 * 
 * Supabase generateLink() returns URLs like:
 *   https://<project>.supabase.co/auth/v1/verify?token=xxx&type=invite&redirect_to=...
 * 
 * These go through Supabase's hosted redirect, which can fail if:
 *   - The redirect URL isn't in the project's allowed list
 *   - PKCE exchange fails due to cookie/session issues
 * 
 * Instead, we extract the token_hash and type and build a direct URL to our
 * own /auth/confirm route, which calls verifyOtp() server-side.
 */
function rewriteActionLink(actionLink, nextPath = '/update-password') {
  try {
    const url = new URL(actionLink);
    const tokenHash = url.searchParams.get('token') || url.searchParams.get('token_hash');
    const linkType = url.searchParams.get('type');

    if (tokenHash && linkType) {
      return `${SITE_URL}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(linkType)}&next=${encodeURIComponent(nextPath)}`;
    }
    console.warn('Could not parse actionLink, using original:', actionLink);
    return actionLink;
  } catch (err) {
    console.error('Error rewriting action link:', err);
    return actionLink;
  }
}

export async function POST(request) {
  try {
    const { email, role, name, client_id, contractUrl, contractName, roadmapUrl } = await request.json();

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

    const redirectTo = `${SITE_URL}/auth/confirm?next=/update-password`;

    let userId;
    let rawActionLink;
    let isExistingUser = false;

    // --- Step 1: Generate the invite/recovery link ---
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        data: { 
          role, 
          name,
          contract_url: contractUrl || '',
          contract_name: contractName || '',
          roadmap_url: roadmapUrl || 'https://greymatterx.io/hemvedh/day-32?fbclid=PAVERFWASCRaFleHRuA2FlbQIxMABzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAae_DKePFp1_l2tPV3shETWq66KGb2U0g9UkPcAL-1wxg-Zx0JExs8iFQZzEYQ_aem_eCHTAzeXo97I5cpwhfyHzg'
        },
        redirectTo: redirectTo,
      },
    });

    if (inviteError) {
      if (
        inviteError.message.toLowerCase().includes('already registered') ||
        inviteError.message.toLowerCase().includes('already exists') ||
        inviteError.message.toLowerCase().includes('duplicate')
      ) {
        isExistingUser = true;

        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData?.users?.find(u => u.email === email);

        if (!existingUser) {
          return NextResponse.json({ error: 'Could not find the existing user account.' }, { status: 400 });
        }

        userId = existingUser.id;

        // Update metadata
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { 
            name, 
            role,
            contract_url: contractUrl || '',
            contract_name: contractName || '',
            roadmap_url: roadmapUrl || 'https://greymatterx.io/hemvedh/day-32?fbclid=PAVERFWASCRaFleHRuA2FlbQIxMABzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAae_DKePFp1_l2tPV3shETWq66KGb2U0g9UkPcAL-1wxg-Zx0JExs8iFQZzEYQ_aem_eCHTAzeXo97I5cpwhfyHzg'
          },
        });

        const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: { redirectTo },
        });

        if (recoveryError) {
          console.error('Recovery link error:', recoveryError);
          return NextResponse.json({ error: recoveryError.message }, { status: 400 });
        }

        rawActionLink = recoveryData?.properties?.action_link;
      } else {
        console.error('Invite error:', inviteError);
        return NextResponse.json({ error: inviteError.message }, { status: 400 });
      }
    } else {
      userId = inviteData.user.id;
      rawActionLink = inviteData.properties?.action_link;
    }

    // --- Step 1b: Rewrite actionLink to bypass Supabase's hosted redirect ---
    const directLink = rawActionLink ? rewriteActionLink(rawActionLink) : null;
    console.log('[Invite] Direct link for', email, '→', directLink ? 'OK' : 'MISSING');

    // --- Step 2: Upsert user in public.users ---
    const userRow = { id: userId, email, name, role, is_active: true };
    if (role === 'client' && client_id) userRow.client_id = client_id;

    const { error: upsertError } = await supabaseAdmin.from('users').upsert(userRow);
    if (upsertError) console.error('User upsert error:', upsertError);

    // --- Step 3: Send email via Resend ---
    let emailSent = false;
    if (directLink && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const portalType = role === 'client' ? 'Client Portal' : 'Dashboard';
        const subject = isExistingUser
          ? `Set your password — ContentFlow ${portalType}`
          : `You've been invited to ContentFlow ${portalType}`;

        const roleLabel = role === 'client' ? 'Client' : role === 'admin' ? 'Administrator' : 'Team Member';
        const headline = isExistingUser ? 'Set your new password' : `Welcome to ContentFlow, ${name}!`;
        const body = isExistingUser
          ? 'A password reset has been requested for your account. Click the button below to set a new password.'
          : `You've been invited to join ContentFlow as a <strong>${roleLabel}</strong>. Click the button below to set your password and get started.`;

        const emailPayload = {
          from: 'ContentFlow <onboarding@resend.dev>',
          to: [email],
          subject,
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
          <h1 style="margin:0 0 8px;font-size:22px;color:#111;">${headline}</h1>
          <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">${body}</p>
          
          ${contractUrl ? `
          <div style="margin: 0 0 24px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px;">
            <strong style="color: #1e293b; display: block; margin-bottom: 4px;">📝 Client Agreement Attached</strong>
            <span style="color: #64748b;">We have attached <strong>${contractName || 'your services contract'}</strong> to this email. You can also view and sign it directly on the onboarding page.</span>
          </div>
          ` : ''}

          ${roadmapUrl ? `
          <div style="margin: 0 0 24px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 13px;">
            <strong style="color: #15803d; display: block; margin-bottom: 4px;">🚀 Custom AI Growth Roadmap</strong>
            <span style="color: #166534;">We have prepared a custom growth roadmap for your business. <a href="${roadmapUrl}" style="color: #15803d; text-decoration: underline; font-weight: 600;">Click here to preview the strategy sheet</a>.</span>
          </div>
          ` : ''}

          <a href="${directLink}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:12px;">
            Set Your Password & Onboard →
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
        };

        if (contractUrl) {
          emailPayload.attachments = [
            {
              filename: contractName || 'Client_Agreement.pdf',
              path: contractUrl,
            }
          ];
        }

        const { data: emailData, error: emailError } = await resend.emails.send(emailPayload);

        if (emailError) {
          console.error('Resend email error:', emailError);
        } else {
          emailSent = true;
          console.log('[Invite] Email sent via Resend, id:', emailData?.id);
        }
      } catch (emailErr) {
        console.error('Resend send error:', emailErr);
      }
    }

    // --- Step 4: Return success ---
    return NextResponse.json({
      success: true,
      userId,
      emailSent,
      inviteLink: emailSent ? '' : (directLink || ''),
      isExistingUser,
    });
  } catch (error) {
    console.error('Invite Error:', error);
    return NextResponse.json({ error: 'Internal server error during invite' }, { status: 500 });
  }
}
