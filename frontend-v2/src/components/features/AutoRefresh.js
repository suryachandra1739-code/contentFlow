'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientBrowser } from '@/lib/supabase';

export default function AutoRefresh({ postId }) {
  const router = useRouter();
  const supabase = createClientBrowser();

  useEffect(() => {
    if (!postId) return;
    const ch1 = supabase.channel(`v2-comments-${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, () => router.refresh())
      .subscribe();
    const ch2 = supabase.channel(`v2-post-${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `id=eq.${postId}` }, () => router.refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [postId, router, supabase]);

  return null;
}
