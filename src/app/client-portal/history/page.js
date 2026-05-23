import { createClientServer } from '@/lib/supabase-server';
import Link from 'next/link';

export default async function ClientPortalHistory({ searchParams }) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  const filter = searchParams.filter || 'all';
  const sort = searchParams.sort || 'newest';

  let query = supabase
    .from('posts')
    .select('*, projects(name)')
    .eq('client_id', profile.client_id);

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data: posts } = await query;

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-24">
        <h1 style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--sans)' }}>Post History</h1>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            className="form-select" 
            defaultValue={filter}
            onChange={`window.location.href='?filter='+this.value+'&sort=${sort}'`}
            style={{ width: 'auto' }}
          >
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="revision">Revision</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select 
            className="form-select" 
            defaultValue={sort}
            onChange={`window.location.href='?filter=${filter}&sort='+this.value`}
            style={{ width: 'auto' }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {posts?.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 0' }}>No posts found</div>
          ) : (
            <div className="table-wrapper">
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 24px', fontWeight: 500 }}>Media</th>
                    <th style={{ padding: '16px 24px', fontWeight: 500 }}>Caption</th>
                    <th style={{ padding: '16px 24px', fontWeight: 500 }}>Platform</th>
                    <th style={{ padding: '16px 24px', fontWeight: 500 }}>Status</th>
                    <th style={{ padding: '16px 24px', fontWeight: 500 }}>Date</th>
                    <th style={{ padding: '16px 24px', fontWeight: 500 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => (
                    <tr key={post.id} style={{ borderBottom: '1px solid var(--border)' }} className="interactive-row">
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 6, background: '#000', overflow: 'hidden' }}>
                          {post.media_type === 'video' ? (
                            <video src={post.media_url} preload="none" playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <img src={post.media_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--text-primary)', maxWidth: 300 }} className="truncate">
                        {post.caption || 'Untitled'}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 13, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                        {post.platform}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span className={`badge badge-${post.status}`}>{post.status}</span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                        {new Date(post.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <Link href={`/client-portal/review/${post.id}`} className="btn btn-secondary btn-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
