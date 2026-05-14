'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import PlatformBadge from '@/components/PlatformBadge';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your content approval workflow.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-value">{data.total}</div>
          <div className="stat-card-label">Total posts</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{data.byStatus.pending || 0}</div>
          <div className="stat-card-label">Awaiting review</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{data.byStatus.approved || 0}</div>
          <div className="stat-card-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{data.approvalRate}%</div>
          <div className="stat-card-label">Approval rate</div>
        </div>
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
                    <PlatformBadge platform={post.platform} />
                    <div style={{flex:1,minWidth:0}}>
                      <div className="truncate" style={{fontSize:14,fontWeight:500,color:'var(--text-primary)'}}>{post.caption || 'Untitled post'}</div>
                      <div style={{fontSize:13,fontFamily:'var(--sans)',color:'var(--text-muted)',marginTop:2}}>{post.projects?.name} <span style={{opacity:0.4}}>·</span> {post.clients?.company_name}</div>
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
                  client_created: 'Client created',
                  project_created: 'Project created',
                };
                const dotColors = {
                  post_created: 'var(--accent)',
                  post_approved: 'var(--green)',
                  post_revision: 'var(--amber)',
                  post_rejected: 'var(--accent)',
                  post_updated: 'var(--cyan)',
                  client_created: 'var(--text-muted)',
                  project_created: 'var(--text-muted)',
                };
                return (
                  <div key={item.id || i} className="interactive-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColors[item.action] || 'var(--accent)', flexShrink: 0 }}></div>
                      <div className="truncate" style={{ fontSize: '13px', fontFamily: 'var(--sans)', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.user_name || 'System'}</strong> <span style={{ opacity: 0.3, margin: '0 4px' }}>/</span> {actionLabels[item.action] || item.action}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontWeight: 400, flexShrink: 0, marginLeft: '16px' }}>
                      {new Date(item.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
              {(!data.recentActivity || data.recentActivity.length === 0) && (
                <div className="empty-state" style={{padding:'40px 0'}}>No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:32}}>
        <div className="card-body">
          <div className="flex items-center justify-between mb-16">
            <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)'}}>All posts</h2>
            <Link href="/posts/new" className="btn btn-primary btn-sm">New post</Link>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '12px 16px', background: 'var(--bg-layer)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '180px' }}>
              <input 
                type="text" 
                placeholder="Search captions, projects..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="form-input"
              />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
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
