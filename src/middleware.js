import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // If public route, just return
  if (path.startsWith('/review/') || path.startsWith('/api/')) {
    return supabaseResponse;
  }

  // Handle unauthenticated users
  if (!user && path !== '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Handle authenticated users routing
  if (user) {
    // Get user role from public.users table
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'team'; // default fallback

    // If on login page, redirect based on role
    if (path === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = role === 'client' ? '/client-portal' : '/';
      return NextResponse.redirect(url);
    }

    // Protect client portal
    if (path.startsWith('/client-portal') && role !== 'client') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Protect admin/team dashboard from clients
    if (!path.startsWith('/client-portal') && role === 'client' && path !== '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/client-portal';
      return NextResponse.redirect(url);
    }

    // Protect admin specific routes
    if (path.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
