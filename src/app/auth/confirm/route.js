import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

/**
 * /auth/confirm — Server-side route that handles ALL Supabase email link callbacks.
 * 
 * Supabase email links redirect here with one of:
 *   ?code=xxx           (PKCE flow)
 *   ?token_hash=xxx&type=invite|recovery|signup  (token_hash flow)
 *   ?error=xxx          (Supabase error)
 * 
 * After verifying, we set session cookies and redirect to the final destination.
 */
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/update-password';
  const errorParam = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // If Supabase sent an error directly
  if (errorParam) {
    console.error('Auth confirm error from Supabase:', errorParam, errorDescription);
    const errorMsg = encodeURIComponent(errorDescription || errorParam || 'Authentication failed');
    return NextResponse.redirect(new URL(`/auth/error?message=${errorMsg}`, request.url));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (err) {
            // Ignored — middleware handles session refresh
          }
        },
      },
    }
  );

  // --- Handle PKCE code exchange ---
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    console.error('Code exchange error:', error);
    const msg = encodeURIComponent(error.message || 'Your invite link has expired or is invalid.');
    return NextResponse.redirect(new URL(`/auth/error?message=${msg}`, request.url));
  }

  // --- Handle token_hash verification (invite, recovery, signup, email_change) ---
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    console.error('OTP verification error:', error);

    // Specific error handling
    const errMsg = error.message?.toLowerCase() || '';
    if (errMsg.includes('expired') || errMsg.includes('invalid')) {
      const msg = encodeURIComponent('This invite link has expired. Please ask your admin to send a new one.');
      return NextResponse.redirect(new URL(`/auth/error?message=${msg}`, request.url));
    }

    const msg = encodeURIComponent(error.message || 'Authentication failed. Please try again.');
    return NextResponse.redirect(new URL(`/auth/error?message=${msg}`, request.url));
  }

  // --- No valid auth params — redirect to error ---
  return NextResponse.redirect(new URL('/auth/error?message=Invalid+authentication+link.+Please+request+a+new+invite.', request.url));
}
