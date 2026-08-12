import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * GET /api/auth/youtube/callback?code=xxx&state=xxx
 * 
 * Google/YouTube OAuth callback. Performs the following steps:
 * 1. Validates CSRF state cookie.
 * 2. Exchanges auth code for access & refresh tokens.
 * 3. Retrieves YouTube Channel details (ID, Title, Thumbnail) using YouTube Data API.
 * 4. Upserts details into the social_connections table.
 * 5. Redirects to client settings.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const errorParam = searchParams.get('error');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  if (errorParam) {
    console.error('YouTube OAuth denied:', errorParam);
    return NextResponse.redirect(`${siteUrl}/clients?error=oauth_denied&message=${encodeURIComponent(errorParam || 'YouTube authorization denied')}`);
  }

  if (!code || !stateParam) {
    return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 });
  }

  try {
    // 1. Validate state parameter
    let statePayload;
    try {
      statePayload = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
    } catch {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    const { clientId, userId } = statePayload || {};
    if (!clientId) {
      return NextResponse.json({ error: 'Invalid OAuth state payload' }, { status: 400 });
    }

    // Read CSRF cookie before validating
    const cookieStore = await cookies();
    const savedState = cookieStore.get('youtube_oauth_state')?.value;

    if (savedState && savedState !== statePayload.random) {
      return NextResponse.json({ error: 'CSRF validation mismatch. Please try again.' }, { status: 403 });
    }

    const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
    const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
    const REDIRECT_URI = process.env.YOUTUBE_OAUTH_REDIRECT_URI;

    // 2. Exchange code for access & refresh tokens
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('Google token exchange error:', tokenData.error, tokenData.error_description);
      return NextResponse.redirect(`${siteUrl}/clients/${clientId}/settings?error=token_exchange&message=${encodeURIComponent(tokenData.error_description || 'Google token exchange failed')}`);
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token; // Offline access token

    // 3. Fetch YouTube Channel details
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const channelData = await channelRes.json();

    if (channelData.error) {
      console.error('YouTube channel fetch error:', channelData.error);
      return NextResponse.redirect(`${siteUrl}/clients/${clientId}/settings?error=channel_fetch&message=${encodeURIComponent(channelData.error.message || 'Failed to fetch YouTube channel details')}`);
    }

    const channel = channelData.items?.[0];
    if (!channel) {
      return NextResponse.redirect(`${siteUrl}/clients/${clientId}/settings?error=no_channel&message=${encodeURIComponent('No YouTube Channel found for this Google account.')}`);
    }

    const channelId = channel.id;
    const channelTitle = channel.snippet.title;
    const profilePictureUrl = channel.snippet.thumbnails?.default?.url || null;

    // 4. Upsert into social_connections
    const supabase = getServiceSupabase();

    const youtubeUpsert = {
      client_id: clientId,
      platform: 'youtube',
      page_id: channelId,
      page_name: channelTitle,
      page_access_token: accessToken,
      profile_picture_url: profilePictureUrl,
      token_valid: true,
      last_verified_at: new Date().toISOString(),
      connected_by: userId || null,
      updated_at: new Date().toISOString(),
    };

    // If Google returned a refresh token (typically on first consent), store it.
    // If not returned (subsequent logins), keep the existing refresh token.
    if (refreshToken) {
      youtubeUpsert.refresh_token = refreshToken;
    }

    // Attempt upsert. Since client_id + platform is unique, this will update the existing entry.
    const { error: upsertError } = await supabase
      .from('social_connections')
      .upsert(youtubeUpsert, { onConflict: 'client_id,platform' });

    if (upsertError) {
      console.error('YouTube upsert error:', upsertError);
      return NextResponse.redirect(`${siteUrl}/clients/${clientId}/settings?error=db_error&message=${encodeURIComponent(upsertError.message || 'Failed to save connection to database')}`);
    }

    // 5. Redirect back to client settings page
    return NextResponse.redirect(
      `${siteUrl}/clients/${clientId}/settings?connected=true&accounts=${encodeURIComponent(`YouTube: ${channelTitle}`)}`
    );

  } catch (error) {
    console.error('YouTube OAuth callback error:', error);
    return NextResponse.redirect(`${siteUrl}/clients?error=oauth_failed&message=${encodeURIComponent(error.message || 'OAuth failed')}`);
  }
}
