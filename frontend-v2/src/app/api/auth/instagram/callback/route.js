import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Use service role for DB writes (bypasses RLS)
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * GET /api/auth/instagram/callback?code=xxx&state=xxx
 * 
 * Meta OAuth callback. Does 5 things in sequence:
 * 1. Validates CSRF state
 * 2. Exchanges code → short-lived user token
 * 3. Exchanges short-lived → long-lived user token
 * 4. Gets user's Pages + Page Access Tokens
 * 5. For each Page, checks for linked Instagram Business Account
 * 6. Upserts into social_connections
 * 7. Redirects to client settings page
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle user declining authorization
  if (errorParam) {
    console.error('OAuth denied:', errorParam, errorDescription);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    return NextResponse.redirect(`${siteUrl}/clients?error=oauth_denied&message=${encodeURIComponent(errorDescription || 'Authorization was denied')}`);
  }

  if (!code || !stateParam) {
    return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 });
  }

  try {
    // ─────────────────────────────────────────────
    // 1. Validate CSRF state
    // ─────────────────────────────────────────────
    const cookieStore = await cookies();
    const savedState = cookieStore.get('meta_oauth_state')?.value;

    let statePayload;
    try {
      statePayload = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
    } catch {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    if (!savedState || savedState !== statePayload.random) {
      return NextResponse.json({ error: 'CSRF validation failed. Please try again.' }, { status: 403 });
    }

    // Clear the state cookie
    cookieStore.delete('meta_oauth_state');

    const { clientId, userId } = statePayload;
    const META_APP_ID = process.env.META_APP_ID;
    const META_APP_SECRET = process.env.META_APP_SECRET;
    const REDIRECT_URI = process.env.META_OAUTH_REDIRECT_URI;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

    // ─────────────────────────────────────────────
    // 2. Exchange code → short-lived user token
    // ─────────────────────────────────────────────
    const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', META_APP_ID);
    tokenUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    tokenUrl.searchParams.set('client_secret', META_APP_SECRET);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData.error);
      return NextResponse.redirect(`${siteUrl}/clients/${clientId}/settings?error=token_exchange&message=${encodeURIComponent(tokenData.error.message || 'Token exchange failed')}`);
    }

    const shortLivedToken = tokenData.access_token;

    // ─────────────────────────────────────────────
    // 3. Exchange short-lived → long-lived user token
    // ─────────────────────────────────────────────
    const longLivedUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', META_APP_ID);
    longLivedUrl.searchParams.set('client_secret', META_APP_SECRET);
    longLivedUrl.searchParams.set('fb_exchange_token', shortLivedToken);

    const longLivedRes = await fetch(longLivedUrl.toString());
    const longLivedData = await longLivedRes.json();

    if (longLivedData.error) {
      console.error('Long-lived token error:', longLivedData.error);
      return NextResponse.redirect(`${siteUrl}/clients/${clientId}/settings?error=token_exchange&message=${encodeURIComponent(longLivedData.error.message || 'Long-lived token exchange failed')}`);
    }

    const longLivedUserToken = longLivedData.access_token;

    // ─────────────────────────────────────────────
    // 4. Get user info + Pages + Page Access Tokens
    // ─────────────────────────────────────────────
    // Get user info first
    const userInfoRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${longLivedUserToken}`);
    const userInfo = await userInfoRes.json();
    const metaUserId = userInfo.id;

    // Get Pages with their permanent Page Access Tokens
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,picture&access_token=${longLivedUserToken}`
    );
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.redirect(`${siteUrl}/clients/${clientId}/settings?error=no_pages&message=${encodeURIComponent('No Facebook Pages found. Make sure you have admin access to at least one Facebook Page.')}`);
    }

    const supabase = getServiceSupabase();
    const connectedAccounts = [];

    // Process each page
    for (const page of pagesData.data) {
      // ─────────────────────────────────────────────
      // 5. For each Page, check for linked Instagram Business Account
      // ─────────────────────────────────────────────
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account{id,username,profile_picture_url}&access_token=${page.access_token}`
      );
      const igData = await igRes.json();

      const igAccount = igData.instagram_business_account;

      // ─────────────────────────────────────────────
      // 6. Upsert into social_connections
      // ─────────────────────────────────────────────

      // Upsert Facebook connection
      const fbUpsert = {
        client_id: clientId,
        platform: 'facebook',
        meta_user_id: metaUserId,
        page_id: page.id,
        page_name: page.name,
        page_access_token: page.access_token,
        profile_picture_url: page.picture?.data?.url || null,
        token_valid: true,
        last_verified_at: new Date().toISOString(),
        connected_by: userId,
        updated_at: new Date().toISOString(),
      };

      const { error: fbError } = await supabase
        .from('social_connections')
        .upsert(fbUpsert, { onConflict: 'client_id,platform' });

      if (fbError) {
        console.error('Facebook upsert error:', fbError);
      } else {
        connectedAccounts.push(`Facebook Page: ${page.name}`);
      }

      // Upsert Instagram connection (if linked)
      if (igAccount) {
        const igUpsert = {
          client_id: clientId,
          platform: 'instagram',
          meta_user_id: metaUserId,
          page_id: page.id, // Instagram uses the Page's token
          page_name: page.name,
          page_access_token: page.access_token, // Same Page Access Token
          ig_business_account_id: igAccount.id,
          ig_username: igAccount.username,
          profile_picture_url: igAccount.profile_picture_url || null,
          token_valid: true,
          last_verified_at: new Date().toISOString(),
          connected_by: userId,
          updated_at: new Date().toISOString(),
        };

        const { error: igError } = await supabase
          .from('social_connections')
          .upsert(igUpsert, { onConflict: 'client_id,platform' });

        if (igError) {
          console.error('Instagram upsert error:', igError);
        } else {
          connectedAccounts.push(`Instagram: @${igAccount.username}`);
        }
      }

      // Only process the first page (most common case — single Page per client)
      // If multi-page support is needed later, remove this break
      break;
    }

    // ─────────────────────────────────────────────
    // 7. Redirect to client settings page
    // ─────────────────────────────────────────────
    const successMessage = encodeURIComponent(connectedAccounts.join(', '));
    return NextResponse.redirect(
      `${siteUrl}/clients/${clientId}/settings?connected=true&accounts=${successMessage}`
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    return NextResponse.redirect(`${siteUrl}/clients?error=oauth_failed&message=${encodeURIComponent(error.message || 'OAuth failed')}`);
  }
}
