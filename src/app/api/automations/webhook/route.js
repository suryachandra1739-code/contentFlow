import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client to read real (unmasked) tokens from social_connections
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { webhookUrl, caption, hashtags, imageUrl, platforms, clientId } = body;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'n8n webhook URL is required' }, { status: 400 });
    }

    // Build per-client credentials if clientId is provided
    let credentials = null;
    let clientName = null;

    if (clientId) {
      try {
        // Fetch social connections for this client (unmasked tokens via service role)
        const { data: connections } = await serviceSupabase
          .from('social_connections')
          .select('*')
          .eq('client_id', clientId)
          .eq('token_valid', true);

        if (connections && connections.length > 0) {
          const fbConn = connections.find(c => c.platform === 'facebook');
          const igConn = connections.find(c => c.platform === 'instagram');

          credentials = {
            facebook: fbConn ? {
              page_id: fbConn.page_id,
              page_name: fbConn.page_name,
              page_access_token: fbConn.page_access_token,
            } : null,
            instagram: igConn ? {
              ig_business_account_id: igConn.ig_business_account_id,
              ig_username: igConn.ig_username,
              page_access_token: igConn.page_access_token,
            } : null,
          };
        }

        // Fetch client name for logging context
        const { data: client } = await serviceSupabase
          .from('clients')
          .select('company_name')
          .eq('id', clientId)
          .single();

        if (client) clientName = client.company_name;
      } catch (err) {
        console.error('Failed to fetch client credentials:', err);
        // Continue without credentials — n8n will use its own configured credentials
      }
    }

    // Forward the post data to the n8n webhook
    const n8nPayload = {
      caption: caption || '',
      hashtags: hashtags || '',
      image_url: imageUrl || '',
      platforms: platforms || { instagram: true, facebook: true, twitter: false, linkedin: false, youtube: false },
      // Per-client credentials (null if no clientId or no connections found)
      credentials: credentials,
      client_id: clientId || null,
      client_name: clientName || null,
      timestamp: new Date().toISOString(),
      source: 'contentflow'
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload),
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json({ 
        error: `n8n webhook returned ${response.status}`, 
        details: errorText 
      }, { status: 502 });
    }

    let result;
    try {
      result = await response.json();
    } catch {
      result = { success: true, message: 'Webhook accepted' };
    }

    return NextResponse.json({ 
      success: true, 
      result,
      clientId: clientId || null,
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return NextResponse.json({ error: 'n8n webhook timed out. Is your n8n instance running?' }, { status: 504 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Test webhook connectivity
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const webhookUrl = searchParams.get('url');

  if (!webhookUrl) {
    return NextResponse.json({ error: 'Webhook URL required' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(webhookUrl, {
      method: 'HEAD',
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (response && (response.ok || response.status === 405)) {
      // 405 = Method Not Allowed is expected for HEAD on webhook endpoints
      return NextResponse.json({ connected: true, status: response.status });
    }

    return NextResponse.json({ connected: false, status: response?.status || 0 });
  } catch {
    return NextResponse.json({ connected: false, error: 'Connection failed' });
  }
}
