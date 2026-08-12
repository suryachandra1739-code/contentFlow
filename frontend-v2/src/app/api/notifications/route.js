import { createClientServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile/role
    const { data: profile } = await supabase
      .from('users')
      .select('role, client_id')
      .eq('id', user.id)
      .single();
    
    const role = profile?.role || 'team';
    const clientId = profile?.client_id;

    let query = supabase
      .from('comments')
      .select('*, posts(id, caption, client_id, projects(name)), users(name, role)')
      .order('created_at', { ascending: false })
      .limit(20);

    // Apply visibility rules
    if (role === 'client') {
      // Clients only see comments on their own client posts, and never internal comments
      if (!clientId) {
        return NextResponse.json([]);
      }
      query = query
        .eq('is_internal', false)
        .eq('posts.client_id', clientId);
    } else {
      // Team members see all comments, but we filter out comments they made themselves
      // (handled in the client-side component to allow showing all activity if wanted)
    }

    const { data: comments, error } = await query;
    if (error) throw error;

    // Filter out comments where post relation is null (due to client_id filter on join in Supabase)
    const filteredComments = (comments || []).filter(c => c.posts !== null);

    return NextResponse.json(filteredComments);
  } catch (error) {
    console.error('Notifications Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
