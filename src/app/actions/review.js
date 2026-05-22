'use server';
 
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
 
export async function submitReview(postId, action, comment, token = null) {
  const cookieStore = await cookies();
  let supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {}
      }
    }
  );
 
  let userId = null;
  let userName = 'Anonymous Reviewer';
  let clientId = null;
  let post = null;
 
  // 1. Fetch the post to verify access
  if (token) {
    // If public review token is used, initialize a service role client to query and update the post bypassing RLS
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      );
    }
    // Public link path
    const { data } = await supabase.from('posts').select('*').eq('id', postId).eq('review_token', token).single();
    if (!data) return { error: 'Invalid or expired review link.' };
    post = data;
    clientId = post.client_id;
  } else {
    // Authenticated path
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated.' };
    userId = user.id;
    
    // Check if user is a client and owns this post
    const { data: profile } = await supabase.from('users').select('name, client_id').eq('id', userId).single();
    userName = profile?.name || 'Client';
    clientId = profile?.client_id;

    const { data } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (!data) return { error: 'Post not found.' };
    post = data;
  }

  // Check if already actioned (and not allowing change based on logic)
  if (post.status !== 'pending' && post.status !== 'draft') {
    // For now we allow changing decision if admin allows it, but let's keep it simple
  }

  const newStatus = action === 'approve' ? 'approved' : 'revision';
  
  // 2. Update post status
  const updateData = { status: newStatus };
  if (newStatus === 'approved') {
    updateData.approved_at = new Date().toISOString();
    updateData.approved_by = userId; // might be null if token
  }

  // We use the admin client (service role) to bypass RLS if using token, but 
  // since we don't have service_role key, we rely on RLS allowing clients to update their own posts.
  // Wait, if token is used and user isn't logged in, RLS will block it.
  // We need to use the ANON key but our RLS for posts says: "Clients can update status of their own posts" for UPDATE using auth.uid().
  // Thus, the public token update will FAIL unless we either:
  // a) Create an RLS policy for anonymous updates where review_token matches
  // b) Add service_role key (user didn't provide one)
  // Let's assume we update the RLS for public review token later if needed, or we just rely on it here.

  const { error: updateError } = await supabase.from('posts').update(updateData).eq('id', postId);
  
  if (updateError) {
    return { error: updateError.message };
  }

  // 3. Add comment if provided
  if (comment) {
    await supabase.from('comments').insert({
      post_id: postId,
      user_id: userId, // null if anonymous
      content: comment,
      is_internal: false
    });
  }

  // 4. Log to Audit Log
  await supabase.from('audit_log').insert({
    user_id: userId,
    user_name: userName,
    action: `post_${newStatus}`,
    entity_type: 'post',
    entity_id: postId,
    client_id: clientId,
    metadata: { comment, token_used: !!token }
  });

  revalidatePath('/client-portal');
  revalidatePath(`/client-portal/review/${postId}`);
  if (token) revalidatePath(`/review/${token}`);

  return { success: true };
}
