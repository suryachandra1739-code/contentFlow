import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client — reads unmasked social tokens from social_connections
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─────────────────────────────────────────────────────────────
// GET — Meta webhook verification handshake
// Meta calls: GET /api/instagram/webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
// We must echo back hub.challenge to confirm ownership
// ─────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'contentflow-verify';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Instagram Webhook] Verification successful');
    return new Response(challenge, { status: 200 });
  }

  console.warn('[Instagram Webhook] Verification failed — wrong token or mode');
  return new Response('Forbidden', { status: 403 });
}

// ─────────────────────────────────────────────────────────────
// POST — Receive Instagram comment / message events from Meta
// ─────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();

    // Meta sends a top-level "object" field
    if (body.object !== 'instagram' && body.object !== 'page') {
      return NextResponse.json({ status: 'ignored', reason: 'not instagram' });
    }

    const entries = body.entry || [];

    for (const entry of entries) {
      // Each entry has an "id" which is the Instagram Business Account ID (or Page ID)
      const igAccountId = entry.id;

      // ── Look up client by IG account ID ─────────────────────────────────────
      const { data: connection } = await serviceSupabase
        .from('social_connections')
        .select('client_id, page_access_token, ig_business_account_id')
        .eq('ig_business_account_id', igAccountId)
        .eq('platform', 'instagram')
        .eq('token_valid', true)
        .single();

      if (!connection) {
        console.warn(`[DM Bot] No connected client found for IG account ${igAccountId}`);
        continue;
      }

      const { client_id, page_access_token } = connection;

      // ── Load DM config from the project linked to this client ────────────────
      // Find the most recently updated project for this client that has dm_config set
      const { data: project } = await serviceSupabase
        .from('projects')
        .select('id, dm_config')
        .eq('client_id', client_id)
        .not('dm_config', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const dmConfig = project?.dm_config || {
        keywords: 'dm',
        message: "Hey {name}! 👋 Thanks for your interest! I've sent you the details you asked for.",
        links: '',
      };

      const keywords = (dmConfig.keywords || 'dm')
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(Boolean);

      // ── Process comment events ────────────────────────────────────────────────
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== 'comments') continue;
        const value = change.value;

        const commentText = (value.text || '').toLowerCase();
        const commenterId = value.from?.id;
        const commenterName = value.from?.username || 'there';
        const commentId = value.id;

        // Check if any trigger keyword is in the comment
        const triggered = keywords.some(kw => commentText.includes(kw));
        if (!triggered) continue;

        console.log(`[DM Bot] Triggered by comment "${value.text}" from @${commenterName}`);

        // Build DM message
        const linksText = (dmConfig.links || '')
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
          .map(l => `🔗 ${l}`)
          .join('\n');

        const dmText = (dmConfig.message || '')
          .replace('{name}', commenterName)
          .replace('{links}', linksText || '')
          .trim() || `Hey ${commenterName}! 👋 Thanks for your comment!${linksText ? '\n\n' + linksText : ''}`;

        // ── Send DM via Instagram Graph API ─────────────────────────────────
        await sendInstagramDM(commenterId, dmText, page_access_token);

        // ── Reply to the comment so others see a response ────────────────────
        await replyToComment(commentId, 'Sent you a DM! Check your inbox 📩', page_access_token);
      }

      // ── Process messaging events (direct messages received) ──────────────────
      const messaging = entry.messaging || [];
      for (const msg of messaging) {
        // Echo prevention — don't reply to our own messages
        if (msg.message?.is_echo) continue;

        const senderId = msg.sender?.id;
        const messageText = (msg.message?.text || '').toLowerCase();
        if (!senderId || !messageText) continue;

        const triggered = keywords.some(kw => messageText.includes(kw));
        if (!triggered) continue;

        const senderName = 'there';
        const linksText = (dmConfig.links || '')
          .split('\n').map(l => l.trim()).filter(Boolean).map(l => `🔗 ${l}`).join('\n');
        const replyText = (dmConfig.message || '')
          .replace('{name}', senderName)
          .replace('{links}', linksText || '').trim()
          || `Hey! 👋 Thanks for reaching out!${linksText ? '\n\n' + linksText : ''}`;

        await sendInstagramDM(senderId, replyText, page_access_token);
      }
    }

    // Always return 200 quickly so Meta doesn't retry
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[Instagram Webhook] Error:', error);
    // Return 200 anyway — Meta retries on non-200 which can cause duplicate DMs
    return NextResponse.json({ status: 'error', message: error.message });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function sendInstagramDM(recipientId, text, accessToken) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );
    const data = await res.json();
    if (data.error) {
      console.error('[DM Bot] DM send failed:', data.error.message);
    } else {
      console.log('[DM Bot] DM sent successfully to', recipientId);
    }
    return data;
  } catch (err) {
    console.error('[DM Bot] DM send exception:', err.message);
  }
}

async function replyToComment(commentId, text, accessToken) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${commentId}/replies?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: AbortSignal.timeout(10000),
      }
    );
    const data = await res.json();
    if (data.error) {
      console.error('[DM Bot] Comment reply failed:', data.error.message);
    }
    return data;
  } catch (err) {
    console.error('[DM Bot] Comment reply exception:', err.message);
  }
}
