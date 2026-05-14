import { createClientServer } from '@/lib/supabase-server';
import Link from 'next/link';

export default async function ClientPortalOverview() {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch client profile
  const { data: profile } = await supabase
    .from('users')
    .select('name, client_id')
    .eq('id', user.id)
    .single();

  // Fetch stats and pending posts for this client
  const { data: posts } = await supabase
    .from('posts')
    .select('*, projects(name)')
    .eq('client_id', profile.client_id)
    .order('created_at', { ascending: false });

  const pendingPosts = posts?.filter(p => p.status === 'pending') || [];
  
  const stats = {
    total: posts?.length || 0,
    pending: pendingPosts.length,
    approved: posts?.filter(p => p.status === 'approved').length || 0,
    revision: posts?.filter(p => p.status === 'revision').length || 0,
  };

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 24 }}>
        Hello {profile?.name?.split(' ')[0] || 'there'},
      </h1>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="card">
          <div className="card-body" style={{ padding: '20px' }}>
            <div style={{ fontSize: 28, fontFamily: 'var(--mono)', fontWeight: 600 }}>{stats.total}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total posts submitted</div>
          </div>
        </div>
        <div className="card" style={{ borderTop: '2px solid var(--amber)' }}>
          <div className="card-body" style={{ padding: '20px' }}>
            <div style={{ fontSize: 28, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--amber)' }}>{stats.pending}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Awaiting your review</div>
          </div>
        </div>
        <div className="card" style={{ borderTop: '2px solid var(--green)' }}>
          <div className="card-body" style={{ padding: '20px' }}>
            <div style={{ fontSize: 28, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--green)' }}>{stats.approved}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Approved by you</div>
          </div>
        </div>
        <div className="card" style={{ borderTop: '2px solid var(--cyan)' }}>
          <div className="card-body" style={{ padding: '20px' }}>
            <div style={{ fontSize: 28, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--cyan)' }}>{stats.revision}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Revision requested</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 16 }}>Pending review</h2>
          
          {pendingPosts.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              You're all caught up ✓
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingPosts.map(post => (
                <div key={post.id} className="interactive-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-layer)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: '#000', overflow: 'hidden' }}>
                      {post.media_type === 'video' ? (
                        <video src={post.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={post.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>{post.caption?.substring(0, 60) || 'Untitled post'}...</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        <span style={{ textTransform: 'capitalize' }}>{post.platform}</span> • {post.projects?.name} • {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Link href={`/client-portal/review/${post.id}`} className="btn btn-primary" style={{ padding: '8px 24px' }}>
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
