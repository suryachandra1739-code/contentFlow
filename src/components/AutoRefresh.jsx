'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientBrowser } from '@/lib/supabase';

export default function AutoRefresh({ postId }) {
  const router = useRouter();
  const supabase = createClientBrowser();

  useEffect(() => {
    if (!postId) return;

    // Subscribe to changes on the comments table for this post
    const commentsChannel = supabase
      .channel(`realtime-comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    // Subscribe to changes on this specific post
    const postChannel = supabase
      .channel(`realtime-post-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${postId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(postChannel);
    };
  }, [postId, router, supabase]);

  return null;
}
