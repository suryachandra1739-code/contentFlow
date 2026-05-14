import { createClientServer } from '@/lib/supabase-server';

export default async function ClientPortalActivity() {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  const { data: activities } = await supabase
    .from('audit_log')
    .select('*')
    .eq('client_id', profile.client_id)
    .order('created_at', { ascending: false });

  const getActionDetails = (action) => {
    switch (action) {
      case 'post_created': return { icon: '📝', text: 'New post submitted for review' };
      case 'post_approved': return { icon: '✅', text: 'Post approved' };
      case 'post_revision': return { icon: '↩️', text: 'Revision requested' };
      case 'post_rejected': return { icon: '❌', text: 'Post rejected' };
      case 'comment_added': return { icon: '💬', text: 'Comment added' };
      default: return { icon: '📌', text: action };
    }
  };

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 24 }}>Activity Log</h1>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {activities?.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 0' }}>No recent activity</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activities.map((activity, index) => {
                const details = getActionDetails(activity.action);
                const isLast = index === activities.length - 1;
                
                return (
                  <div key={activity.id} style={{ display: 'flex', gap: 16, padding: '24px', borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--bg-layer)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      {details.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>{activity.user_name || 'Anonymous'}</span> {details.text.toLowerCase()}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                      {activity.metadata?.comment && (
                        <div style={{ marginTop: 8, padding: '12px', background: 'var(--bg-layer)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          "{activity.metadata.comment}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
