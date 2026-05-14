import { createBrowserClient } from '@supabase/ssr';

// Client-side Supabase client — safe for 'use client' components
export const createClientBrowser = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};
