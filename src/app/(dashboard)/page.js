'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import PlatformBadge from '@/components/PlatformBadge';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const postsTableRef = useRef(null);

  // High-end volume tracking filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics').then(r => r.json()),
      fetch('/api/posts').then(r => r.json()),
    ]).then(([analytics, allPosts]) => {
      setData(analytics);
      if (allPosts && allPosts.error) {
        console.error('Error fetching posts:', allPosts.error);
        setPosts([]);
      } else {
        setPosts(Array.isArray(allPosts) ? allPosts : []);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="fade-in empty-state">Loading dashboard...</div>;

  const pendingPosts = posts.filter(p => p.status === 'pending');

  // Filter & Paginate logic
  const filteredPosts = posts.filter(post => {
    const clientName = post.clients?.company_name || '';
    const projectName = post.projects?.name || '';
    const matchesSearch = searchQuery === '' || 
      post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesClient = clientFilter === 'all' || clientName === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage) || 1;
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Extract unique clients for filter selector
  const uniqueClients = Array.from(new Set(posts.map(p => p.clients?.company_name).filter(Boolean)));

  const renderPostThumbnail = (post) => {
    if (post.media_url) {
      if (post.media_type === 'video') {
        return (
          <div style={{ width: 80, height: 60, position: 'relative', borderRadius: 6, overflow: 'hidden', backgroundColor: '#000', flexShrink: 0 }}>
            <video src={post.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#fff' }}><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        );
      }
      return (
        <div style={{ width: 80, height: 60, borderRadius: 6, overflow: 'hidden', backgroundColor: '#000', flexShrink: 0 }}>
          <img src={post.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      );
    }

    const gradClass = post.platform === 'instagram' 
      ? 'fallback-instagram' 
      : post.platform === 'facebook' 
      ? 'fallback-facebook' 
      : 'fallback-shorts';
    
    const platformEmoji = post.platform === 'instagram' ? '📷' : post.platform === 'facebook' ? '📘' : '🎬';

    return (
      <div className={`fallback-gradient ${gradClass}`} style={{ width: 80, height: 60, borderRadius: 6, flexShrink: 0, padding: 0 }}>
        <span style={{ fontSize: 18, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>{platformEmoji}</span>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your content approval workflow.</p>
      </div>



      <div className="stats-grid">
        <div className="stat-card" style={{cursor:'pointer'}} onClick={() => { setStatusFilter('all'); setCurrentPage(1); postsTableRef.current?.scrollIntoView({behavior:'smooth',block:'start'}); }}>
          <div className="stat-card-value">{data.total}</div>
          <div className="stat-card-label">Total posts</div>
        </div>
        <div className="stat-card" style={{cursor:'pointer'}} onClick={() => { setStatusFilter('pending'); setCurrentPage(1); postsTableRef.current?.scrollIntoView({behavior:'smooth',block:'start'}); }}>
          <div className="stat-card-value">{data.byStatus.pending || 0}</div>
          <div className="stat-card-label">Awaiting review</div>
        </div>
        <div className="stat-card" style={{cursor:'pointer'}} onClick={() => { setStatusFilter('approved'); setCurrentPage(1); postsTableRef.current?.scrollIntoView({behavior:'smooth',block:'start'}); }}>
          <div className="stat-card-value">{data.byStatus.approved || 0}</div>
          <div className="stat-card-label">Approved</div>
        </div>
        {(() => {
          const usedBytes = data.storageUsedBytes || 0;
          const limitBytes = 10 * 1024 * 1024 * 1024; // 10 GB free tier
          const pct = Math.min((usedBytes / limitBytes) * 100, 100);
          const formatSize = (bytes) => {
            if (bytes < 1024) return `${bytes} B`;
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
            if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
          };
          const barColor = pct > 90 ? 'var(--accent)' : pct > 70 ? 'var(--amber)' : 'var(--green)';
          return (
            <div className="stat-card">
              <div className="stat-card-value" style={{fontSize:20}}>{formatSize(usedBytes)}</div>
              <div style={{width:'100%',height:4,background:'var(--border)',borderRadius:2,marginTop:8,marginBottom:6,overflow:'hidden'}}>
                <div style={{width:`${pct}%`,height:'100%',background:barColor,borderRadius:2,transition:'width 0.5s ease'}}></div>
              </div>
              <div className="stat-card-label" style={{display:'flex',justifyContent:'space-between'}}>
                <span>Cloud storage</span>
                <span style={{fontFamily:'var(--mono)',fontSize:11}}>{pct.toFixed(1)}% of 10 GB</span>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="dashboard-content-grid">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-16">
              <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)'}}>Pending approvals</h2>
              <span className="badge badge-pending">{pendingPosts.length}</span>
            </div>
            {pendingPosts.length === 0 ? (
              <div className="empty-state" style={{padding:'40px 0'}}>No pending posts to review</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column'}}>
                {pendingPosts.slice(0, 5).map(post => (
                  <Link href={`/posts/${post.id}`} key={post.id} className="interactive-row" style={{display:'flex',alignItems:'center',gap:16,padding:'12px 0'}}>
                    {renderPostThumbnail(post)}
                    <div style={{flex:1,minWidth:0}}>
                      <div className="truncate" style={{fontSize:14,fontWeight:500,color:'var(--text-primary)'}}>{post.caption || 'Untitled post'}</div>
                      <div style={{fontSize:12,fontFamily:'var(--sans)',color:'var(--text-muted)',marginTop:2}}>
                        <PlatformBadge platform={post.platform} />
                        <span style={{opacity:0.4, margin:'0 4px'}}>·</span>
                        {post.clients?.company_name}
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)',marginBottom:20}}>Recent activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.recentActivity?.slice(0, 8).map((item, i) => {
                const actionLabels = {
                  post_created: 'Post created',
                  post_approved: 'Post approved',
                  post_revision: 'Revision requested',
                  post_rejected: 'Post rejected',
                  post_updated: 'Post updated',
                  post_deleted: 'Post deleted',
                  post_status_pending: 'Sent for review',
                  post_status_approved: 'Post approved',
                  post_status_rejected: 'Post rejected',
                  post_status_revision: 'Revision requested',
                  client_created: 'Client created',
                  client_deleted: 'Client deleted',
                  project_created: 'Project created',
                  project_deleted: 'Project deleted',
                };
                const dotColors = {
                  post_created: 'var(--accent)',
                  post_approved: 'var(--green)',
                  post_revision: 'var(--amber)',
                  post_rejected: 'var(--accent)',
                  post_updated: 'var(--cyan)',
                  post_status_pending: 'var(--amber)',
                  post_status_approved: 'var(--green)',
                  post_status_rejected: 'var(--accent)',
                  post_status_revision: 'var(--cyan)',
                  client_created: 'var(--text-muted)',
                  client_deleted: 'var(--accent)',
                  project_created: 'var(--text-muted)',
                  project_deleted: 'var(--accent)',
                };

                // Build the navigation link based on entity type
                const getActivityLink = () => {
                  if (item.entity_type === 'post' && item.entity_id) return `/posts/${item.entity_id}`;
                  if (item.entity_type === 'client') return `/clients`;
                  if (item.entity_type === 'project' && item.entity_id) return `/projects/${item.entity_id}`;
                  return null;
                };
                const activityLink = getActivityLink();

                const content = (
                  <div key={item.id || i} className="interactive-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', cursor: activityLink ? 'pointer' : 'default' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColors[item.action] || 'var(--accent)', flexShrink: 0 }}></div>
                      <div className="truncate" style={{ fontSize: '13px', fontFamily: 'var(--sans)', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.user_name || 'System'}</strong> <span style={{ opacity: 0.3, margin: '0 4px' }}>/</span> {actionLabels[item.action] || item.action}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '16px' }}>
                      <div style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontWeight: 400 }}>
                        {new Date(item.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {activityLink && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>}
                    </div>
                  </div>
                );

                return activityLink ? <Link href={activityLink} key={item.id || i} style={{textDecoration:'none',color:'inherit'}}>{content}</Link> : content;
              })}
              {(!data.recentActivity || data.recentActivity.length === 0) && (
                <div className="empty-state" style={{padding:'40px 0'}}>No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card" ref={postsTableRef} style={{marginTop:32, scrollMarginTop: '24px'}}>
        <div className="card-body">
          <div className="flex items-center justify-between mb-16">
            <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)'}}>All posts</h2>
            <Link href="/posts/new" className="btn btn-primary btn-sm">New post</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', padding: '12px 16px', background: 'var(--bg-layer)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type="text" 
                placeholder="Search captions, projects..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="form-input"
              />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
                {['all', 'pending', 'approved', 'draft', 'rejected'].map(status => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontFamily: 'var(--sans)',
                      fontWeight: 500,
                      borderRadius: 'var(--radius-pill)',
                      border: '1px solid transparent',
                      background: statusFilter === status ? 'var(--bg-card)' : 'transparent',
                      color: statusFilter === status ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: statusFilter === status ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {uniqueClients.length > 0 && (
                <select
                  value={clientFilter}
                  onChange={e => { setClientFilter(e.target.value); setCurrentPage(1); }}
                  className="form-select"
                  style={{ width: 'auto' }}
                >
                  <option value="all">All clients</option>
                  {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Caption</th>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPosts.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--sans)', color: 'var(--text-muted)' }}>
                      No matching posts found
                    </td>
                  </tr>
                ) : (
                  paginatedPosts.map(post => (
                    <tr key={post.id} style={{cursor:'pointer'}} onClick={() => window.location.href = `/posts/${post.id}`}>
                      <td><PlatformBadge platform={post.platform} /></td>
                      <td><span className="truncate" style={{maxWidth:240,display:'inline-block',fontFamily:'var(--sans)',fontWeight:400, color:'var(--text-primary)'}}>{post.caption?.substring(0,50) || 'Untitled'}...</span></td>
                      <td style={{fontFamily:'var(--sans)',fontSize:14,color:'var(--text-secondary)'}}>{post.projects?.name}</td>
                      <td>
                        <div className="flex items-center gap-8" style={{fontFamily:'var(--sans)',fontSize:14}}>
                          <div className="avatar avatar-sm">{post.clients?.company_name?.[0]}</div>
                          {post.clients?.company_name}
                        </div>
                      </td>
                      <td><StatusBadge status={post.status} /></td>
                      <td style={{fontFamily:'var(--mono)',color:'var(--text-muted)',fontSize:12}}>{new Date(post.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination summary & controller */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div>
              Showing <strong style={{color:'var(--text-primary)', fontWeight:500}}>{filteredPosts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> to <strong style={{color:'var(--text-primary)', fontWeight:500}}>{Math.min(currentPage * itemsPerPage, filteredPosts.length)}</strong> of <strong style={{color:'var(--text-primary)', fontWeight:500}}>{filteredPosts.length}</strong> results
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="btn btn-secondary btn-sm"
                  style={{ opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="btn btn-secondary btn-sm"
                  style={{ opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
