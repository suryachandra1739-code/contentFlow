import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'team';

    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');

    // Fetch posts: scope to user if not admin
    let postsQuery = supabase.from('posts').select('status, platform, client_id, media_size, clients(company_name)');
    if (role === 'admin') {
      if (authorId) {
        postsQuery = postsQuery.eq('created_by', authorId);
      }
    } else {
      postsQuery = postsQuery.eq('created_by', user.id);
    }
    const { data: posts } = await postsQuery;

    const total = posts?.length || 0;
    const byStatus = {};
    const byPlatform = {};

    posts?.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
    });

    const approved = byStatus['approved'] || 0;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    // Calculate total storage used from media_size
    const storageUsedBytes = posts?.reduce((sum, p) => sum + (p.media_size || 0), 0) || 0;

    // Fetch recent audit log entries as "recent activity" — scope to user if not admin
    let activityQuery = supabase
      .from('audit_log')
      .select('*')
      .in('entity_type', ['post', 'client', 'project'])
      .order('created_at', { ascending: false })
      .limit(15);

    if (role === 'admin') {
      if (authorId) {
        activityQuery = activityQuery.eq('user_id', authorId);
      }
    } else {
      activityQuery = activityQuery.eq('user_id', user.id);
    }
    const { data: recentActivity } = await activityQuery;

    return NextResponse.json({ total, byStatus, byPlatform, approvalRate, storageUsedBytes, recentActivity: recentActivity || [] });
  } catch (error) {
    return NextResponse.json({ total: 0, byStatus: {}, byPlatform: {}, approvalRate: 0, storageUsedBytes: 0, recentActivity: [] });
  }
}
