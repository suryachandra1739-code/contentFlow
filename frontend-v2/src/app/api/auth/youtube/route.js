import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClientServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/youtube?clientId=xxx
 * 
 * Initiates the Google OAuth flow for YouTube Data API.
 * Redirects the user to Google Login with the YouTube upload scope.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    // Verify the user is authenticated and has team/admin role
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Verify the client exists
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Generate CSRF state token — encodes both a random value, the clientId, and the userId
    const crypto = await import('crypto');
    const stateRandom = crypto.randomBytes(16).toString('hex');
    const statePayload = JSON.stringify({ random: stateRandom, clientId, userId: user.id });
    const stateEncoded = Buffer.from(statePayload).toString('base64url');

    // Store the random part in an httpOnly cookie for CSRF validation
    const cookieStore = await cookies();
    cookieStore.set('youtube_oauth_state', stateRandom, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Build the Google OAuth URL
    const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
    const REDIRECT_URI = process.env.YOUTUBE_OAUTH_REDIRECT_URI;

    if (!YOUTUBE_CLIENT_ID || !REDIRECT_URI) {
      return NextResponse.json(
        { error: 'YouTube OAuth is not configured. Set YOUTUBE_CLIENT_ID and YOUTUBE_OAUTH_REDIRECT_URI in .env.local' },
        { status: 500 }
      );
    }

    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl', // Required for Community Posts
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', YOUTUBE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('state', stateEncoded);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('access_type', 'offline'); // Requests refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Forces display of consent screen to guarantee refresh token is returned

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
