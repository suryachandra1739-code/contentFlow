'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import StatusBadge from '@/components/StatusBadge';
import PlatformBadge from '@/components/PlatformBadge';

const MotionLink = motion.create ? motion.create(Link) : motion(Link);

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

const parsePostCaption = (caption) => {
  if (!caption) return { title: 'Untitled', description: '' };
  if (caption.startsWith('Title: ')) {
    const doubleNewline = caption.indexOf('\n\n');
    if (doubleNewline !== -1) {
      return {
        title: caption.substring(7, doubleNewline),
        description: caption.substring(doubleNewline + 2)
      };
    }
    const singleNewline = caption.indexOf('\n');
    if (singleNewline !== -1) {
      return {
        title: caption.substring(7, singleNewline),
        description: caption.substring(singleNewline + 1)
      };
    }
  }
  return { title: caption.substring(0, 40) + (caption.length > 40 ? '...' : ''), description: caption };
};

const getExpiryDetails = (createdAt) => {
  if (!createdAt) return { label: '7d left', color: 'var(--text-muted)', bg: 'transparent' };
  const expiry = new Date(new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000);
  const diffMs = expiry - Date.now();
  if (diffMs <= 0) return { label: 'Expired', color: 'var(--red)', bg: 'rgba(229,72,77,0.1)' };
  
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  let label = '';
  if (diffDays > 0) {
    label = `${diffDays}d ${diffHours}h left`;
  } else {
    label = `${diffHours}h left`;
  }

  if (diffMs < 24 * 60 * 60 * 1000) {
    return { label, color: 'var(--red)', bg: 'rgba(229,72,77,0.15)' };
  } else if (diffMs < 3 * 24 * 60 * 60 * 1000) {
    return { label, color: 'var(--amber)', bg: 'rgba(245,166,35,0.12)' };
  }
  return { label, color: 'var(--text-muted)', bg: 'transparent' };
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const isMobile = useIsMobile();
  const postsTableRef = useRef(null);

  // High-end volume tracking filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [authorFilter, setAuthorFilter] = useState('all');
  const [allClientsList, setAllClientsList] = useState([]);

  const fetchDashboardData = (authorId) => {
    setLoading(true);
    const apiQuery = authorId && authorId !== 'all' ? `?authorId=${authorId}` : '';
    Promise.all([
      fetch(`/api/analytics${apiQuery}`).then(r => r.json()),
      fetch(`/api/posts${apiQuery}`).then(r => r.json()),
      fetch(`/api/clients`).then(r => r.json()),
    ]).then(([analytics, allPosts, clientsData]) => {
      setData(analytics);
      if (allPosts && allPosts.error) {
        console.error('Error fetching posts:', allPosts.error);
        setPosts([]);
      } else {
        setPosts(Array.isArray(allPosts) ? allPosts : []);
      }
      setAllClientsList(Array.isArray(clientsData) ? clientsData : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authorId = urlParams.get('authorId') || 'all';
    setAuthorFilter(authorId);
    fetchDashboardData(authorId);
  }, []);

  const clearAuthorFilter = () => {
    setAuthorFilter('all');
    const url = new URL(window.location.href);
    url.searchParams.delete('authorId');
    window.history.pushState({}, '', url);
    fetchDashboardData('all');
  };

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
  const uniqueClients = Array.from(new Set([
    ...allClientsList.map(c => c.company_name),
    ...posts.map(p => p.clients?.company_name)
  ].filter(Boolean)));

  const renderPostThumbnail = (post) => {
    if (post.media_url) {
      if (post.media_type === 'video') {
        return (
          <div style={{ width: 80, height: 60, position: 'relative', borderRadius: 6, overflow: 'hidden', backgroundColor: '#000', flexShrink: 0, border: '1px solid rgba(0,0,0,0.08)' }}>
            <video src={post.media_url} preload="metadata" playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#fff' }}><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        );
      }
      return (
        <div style={{ width: 80, height: 60, borderRadius: 6, overflow: 'hidden', backgroundColor: '#000', flexShrink: 0, border: '1px solid rgba(0,0,0,0.08)' }}>
          <img src={post.media_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
      <div className={`fallback-gradient ${gradClass}`} style={{ width: 80, height: 60, borderRadius: 6, flexShrink: 0, padding: 0, border: '1px solid rgba(0,0,0,0.08)' }}>
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

      <div style={{ position: 'relative' }}>
        <div className="dashboard-glow-blob"></div>
        <div className="stats-grid" style={{ position: 'relative', zIndex: 1 }}>
          <div className="stat-card" style={{cursor:'pointer', position: 'relative'}} onClick={() => { setStatusFilter('all'); setCurrentPage(1); postsTableRef.current?.scrollIntoView({behavior:'smooth',block:'start'}); }}>
          <svg style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-muted)', opacity: 1 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <div className="stat-card-value">{data.total}</div>
          <div className="stat-card-label">Total posts</div>
        </div>
        <div className="stat-card" style={{cursor:'pointer', position: 'relative'}} onClick={() => { setStatusFilter('pending'); setCurrentPage(1); postsTableRef.current?.scrollIntoView({behavior:'smooth',block:'start'}); }}>
          <svg style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-muted)', opacity: 1 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <div className="stat-card-value">{data.byStatus.pending || 0}</div>
          <div className="stat-card-label">Awaiting review</div>
        </div>
        <div className="stat-card" style={{cursor:'pointer', position: 'relative'}} onClick={() => { setStatusFilter('approved'); setCurrentPage(1); postsTableRef.current?.scrollIntoView({behavior:'smooth',block:'start'}); }}>
          <svg style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-muted)', opacity: 1 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
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
            <div className="stat-card" style={{position: 'relative'}}>
              <svg style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-muted)', opacity: 1 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
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
              <div className="segmented-list">
                {pendingPosts.slice(0, 5).map(post => (
                  <Link href={`/posts/${post.id}`} key={post.id} className="segmented-list-item">
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
            <div className="segmented-list">
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

                const innerContent = (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColors[item.action] || 'var(--accent)', flexShrink: 0 }}></div>
                      <div className="truncate" style={{ fontSize: '13px', fontFamily: 'var(--sans)', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.user_name || 'System'}</strong> <span style={{ opacity: 0.3, margin: '0 12px' }}>/</span> {actionLabels[item.action] || item.action}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: 'auto' }}>
                      <div style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontWeight: 400 }}>
                        {new Date(item.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {activityLink && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>}
                    </div>
                  </>
                );

                if (activityLink) {
                  return (
                    <Link href={activityLink} key={item.id || i} className="segmented-list-item" style={{ justifyContent: 'space-between', textDecoration: 'none' }}>
                      {innerContent}
                    </Link>
                  );
                } else {
                  return (
                    <div key={item.id || i} className="segmented-list-item" style={{ justifyContent: 'space-between' }}>
                      {innerContent}
                    </div>
                  );
                }
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

          {/* Search & Filter Bar */}
          <div className="posts-filter-bar">
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type="text" 
                placeholder="Search captions, projects..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="form-input"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
                {authorFilter !== 'all' && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    padding: '5px 12px', 
                    background: 'rgba(229,72,77,0.1)', 
                    color: 'var(--accent)', 
                    border: '1px solid rgba(229,72,77,0.2)',
                    borderRadius: 'var(--radius-pill)', 
                    fontSize: '12px', 
                    fontWeight: 500 
                  }}>
                    <span>Author: <strong>{posts.find(p => p.created_by === authorFilter)?.users?.name || 'Team Member'}</strong></span>
                    <button 
                      onClick={clearAuthorFilter} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--accent)', 
                        cursor: 'pointer', 
                        padding: '0 2px', 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      aria-label="Clear author filter"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2, position: 'relative' }}>
                  {['all', 'pending', 'approved', 'draft', 'rejected'].map(status => {
                    const isSelected = statusFilter === status;
                    return (
                      <button
                        key={status}
                        onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                        style={{
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontFamily: 'var(--sans)',
                          fontWeight: 500,
                          borderRadius: 'var(--radius-pill)',
                          border: 'none',
                          background: 'transparent',
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          whiteSpace: 'nowrap',
                          position: 'relative'
                        }}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="active-status-tab"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'var(--bg-card)',
                              borderRadius: '9999px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                              border: '1px solid rgba(0,0,0,0.06)',
                              zIndex: 0
                            }}
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span style={{ position: 'relative', zIndex: 1 }}>{status}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {uniqueClients.length > 0 && (
                <select
                  value={clientFilter}
                  onChange={e => { setClientFilter(e.target.value); setCurrentPage(1); }}
                  className="form-select"
                  style={{ width: 'auto', minWidth: 120 }}
                >
                  <option value="all">All clients</option>
                  {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Desktop: Table | Mobile: Card List */}
          {isMobile ? (
            <div className="segmented-list">
              {paginatedPosts.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 0' }}>No matching posts found</div>
              ) : (
                paginatedPosts.map(post => (
                  <Link href={`/posts/${post.id}`} key={post.id} className="mobile-post-card">
                    <div className="mobile-post-card-thumb">
                      {post.media_url ? (
                        post.media_type === 'video' ? (
                          <video src={post.media_url} preload="metadata" playsInline muted />
                        ) : (
                          <img src={post.media_url} alt="" loading="lazy" />
                        )
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-layer)', fontSize: 18 }}>
                          {post.platform === 'instagram' ? '📷' : post.platform === 'facebook' ? '📘' : '🎬'}
                        </div>
                      )}
                    </div>
                    <div className="mobile-post-card-info">
                      <div className="mobile-post-card-title" style={{fontWeight:600}}>{parsePostCaption(post.caption).title}</div>
                      {parsePostCaption(post.caption).description && (
                        <div style={{fontSize:12, color:'var(--text-secondary)', marginBottom:4}} className="truncate">
                          {parsePostCaption(post.caption).description}
                        </div>
                      )}
                      <div className="mobile-post-card-meta">
                        <PlatformBadge platform={post.platform} />
                        <StatusBadge status={post.status} />
                        <span>{post.clients?.company_name}</span>
                        {(() => {
                          const details = getExpiryDetails(post.created_at);
                          return (
                            <span style={{ color: details.color, fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 500 }}>
                              ⏰ {details.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
                  </Link>
                ))
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Caption</th>
                    <th>Project</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Auto-Deletes</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPosts.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--sans)', color: 'var(--text-muted)' }}>
                        No matching posts found
                      </td>
                    </tr>
                  ) : (
                    paginatedPosts.map(post => (
                      <tr key={post.id} style={{cursor:'pointer'}} onClick={() => window.location.href = `/posts/${post.id}`}>
                        <td><PlatformBadge platform={post.platform} /></td>
                        <td>
                          <div style={{fontFamily:'var(--sans)',fontWeight:500, color:'var(--text-primary)'}}>{parsePostCaption(post.caption).title}</div>
                          {parsePostCaption(post.caption).description && (
                            <div className="truncate" style={{maxWidth:240, fontSize:12, color:'var(--text-muted)'}}>{parsePostCaption(post.caption).description}</div>
                          )}
                        </td>
                        <td style={{fontFamily:'var(--sans)',fontSize:14,color:'var(--text-secondary)'}}>{post.projects?.name}</td>
                        <td>
                          <div className="flex items-center gap-8" style={{fontFamily:'var(--sans)',fontSize:14}}>
                            <div className="avatar avatar-sm">{post.clients?.company_name?.[0]}</div>
                            {post.clients?.company_name}
                          </div>
                        </td>
                        <td><StatusBadge status={post.status} /></td>
                        <td>
                          {(() => {
                            const details = getExpiryDetails(post.created_at);
                            return (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: details.bg !== 'transparent' ? '4px 8px' : '0',
                                borderRadius: 'var(--radius-pill)',
                                fontSize: '11px',
                                fontWeight: 500,
                                color: details.color,
                                backgroundColor: details.bg
                              }}>
                                ⏰ {details.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--text-muted)',fontSize:12}}>{new Date(post.updated_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className={isMobile ? 'mobile-pagination' : ''} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--text-secondary)' }}>
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
