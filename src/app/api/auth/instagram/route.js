import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClientServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/instagram?clientId=xxx
 * 
 * Initiates the Meta OAuth flow. Redirects the user to Facebook Login
 * with the required scopes for Page + Instagram publishing.
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

    // Generate CSRF state token — encodes both a random value and the clientId
    const crypto = await import('crypto');
    const stateRandom = crypto.randomBytes(16).toString('hex');
    const statePayload = JSON.stringify({ random: stateRandom, clientId, userId: user.id });
    const stateEncoded = Buffer.from(statePayload).toString('base64url');

    // Store the random part in an httpOnly cookie for CSRF validation
    const cookieStore = await cookies();
    cookieStore.set('meta_oauth_state', stateRandom, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Build the Facebook OAuth URL
    const META_APP_ID = process.env.META_APP_ID;
    const REDIRECT_URI = process.env.META_OAUTH_REDIRECT_URI;

    if (!META_APP_ID || !REDIRECT_URI) {
      return NextResponse.json(
        { error: 'Meta OAuth is not configured. Set META_APP_ID and META_OAUTH_REDIRECT_URI in .env.local' },
        { status: 500 }
      );
    }

    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'business_management',
      'instagram_basic',
      'instagram_content_publish',
    ].join(',');

    const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
    authUrl.searchParams.set('client_id', META_APP_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('state', stateEncoded);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('response_type', 'code');

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
