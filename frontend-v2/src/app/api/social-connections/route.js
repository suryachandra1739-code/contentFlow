import { createClientServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/social-connections?clientId=xxx
 * 
 * Lists all social connections for a given client.
 */
export async function GET(request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('social_connections')
      .select('*')
      .eq('client_id', clientId)
      .order('platform', { ascending: true });

    if (error) throw error;

    // Don't expose raw tokens to the frontend — mask them
    const safeData = (data || []).map(conn => ({
      ...conn,
      page_access_token: conn.page_access_token
        ? `${conn.page_access_token.substring(0, 10)}...${conn.page_access_token.slice(-4)}`
        : null,
      refresh_token: conn.refresh_token
        ? `${conn.refresh_token.substring(0, 5)}...${conn.refresh_token.slice(-4)}`
        : null,
    }));

    return NextResponse.json(safeData);
  } catch (e) {
    console.error('Social connections GET error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/social-connections?id=xxx
 * 
 * Disconnects (deletes) a social connection.
 */
export async function DELETE(request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('social_connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Social connections DELETE error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/social-connections
 * body: { action: 'verify', connectionId: 'xxx' }
 * 
 * Verifies that a stored token is still valid by calling the Meta Graph API.
 */
export async function POST(request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const body = await request.json();
    const { action, connectionId } = body;

    if (action !== 'verify') {
      return NextResponse.json({ error: 'Unknown action. Use "verify".' }, { status: 400 });
    }

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId is required' }, { status: 400 });
    }

    // Fetch the connection (including the real token for verification)
    const { data: connection, error: fetchError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (fetchError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Call API to verify the token based on platform
    let tokenValid = false;
    let verifyResult = {};

    if (connection.platform === 'youtube') {
      try {
        let accessToken = connection.page_access_token;
        
        const checkChannel = async (token) => {
          const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(10000)
          });
          return res.json();
        };

        let channelData = await checkChannel(accessToken);

        if (channelData.error && connection.refresh_token) {
          // Token might be expired, try to refresh it
          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.YOUTUBE_CLIENT_ID,
              client_secret: process.env.YOUTUBE_CLIENT_SECRET,
              refresh_token: connection.refresh_token,
              grant_type: 'refresh_token',
            }),
            signal: AbortSignal.timeout(10000)
          });
          const refreshData = await tokenRes.json();
          if (refreshData.access_token) {
            accessToken = refreshData.access_token;
            // Update database with refreshed token
            await supabase
              .from('social_connections')
              .update({
                page_access_token: accessToken,
                updated_at: new Date().toISOString(),
              })
              .eq('id', connectionId);
            
            // Retry fetch
            channelData = await checkChannel(accessToken);
          }
        }

        const channel = channelData.items?.[0];
        if (channel && !channelData.error) {
          tokenValid = true;
          verifyResult = { name: channel.snippet.title, id: channel.id };
        } else {
          verifyResult = { error: channelData.error?.message || 'YouTube token validation failed' };
        }
      } catch (verifyError) {
        verifyResult = { error: verifyError.message || 'Network error during verification' };
      }
    } else {
      try {
        const verifyUrl = `https://graph.facebook.com/v21.0/me?access_token=${connection.page_access_token}`;
        const verifyRes = await fetch(verifyUrl, { signal: AbortSignal.timeout(10000) });
        const verifyData = await verifyRes.json();

        if (verifyData.id && !verifyData.error) {
          tokenValid = true;
          verifyResult = { name: verifyData.name, id: verifyData.id };
        } else {
          verifyResult = { error: verifyData.error?.message || 'Token validation failed' };
        }
      } catch (verifyError) {
        verifyResult = { error: verifyError.message || 'Network error during verification' };
      }
    }

    // Update the connection's token health
    const { error: updateError } = await supabase
      .from('social_connections')
      .update({
        token_valid: tokenValid,
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    if (updateError) {
      console.error('Failed to update token status:', updateError);
    }

    return NextResponse.json({
      valid: tokenValid,
      last_verified_at: new Date().toISOString(),
      details: verifyResult,
    });
  } catch (e) {
    console.error('Social connections POST error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
