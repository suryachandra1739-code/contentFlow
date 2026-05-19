import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClientServer();
    const { data: posts } = await supabase.from('posts').select('status, platform, client_id, media_size, clients(company_name)');

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

    // Fetch recent audit log entries as "recent activity" — only content-related actions
    const { data: recentActivity } = await supabase
      .from('audit_log')
      .select('*')
      .in('entity_type', ['post', 'client', 'project'])
      .order('created_at', { ascending: false })
      .limit(15);

    return NextResponse.json({ total, byStatus, byPlatform, approvalRate, storageUsedBytes, recentActivity: recentActivity || [] });
  } catch (error) {
    return NextResponse.json({ total: 0, byStatus: {}, byPlatform: {}, approvalRate: 0, storageUsedBytes: 0, recentActivity: [] });
  }
}
