'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import StatusBadge from '@/components/StatusBadge';
import PlatformBadge from '@/components/PlatformBadge';
import PageTransition from '@/components/PageTransition';
import { createClientBrowser } from '@/lib/supabase';

// Dynamic import RecentActivity with ssr: false and skeleton loading
const RecentActivity = dynamic(() => import('@/components/RecentActivity'), {
  ssr: false,
  loading: () => (
    <div className="segmented-list" style={{ pointerEvents: 'none' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="segmented-list-item" style={{ justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div className="skeleton-circle skeleton-shimmer" style={{ width: '6px', height: '6px' }}></div>
            <div className="skeleton-line skeleton-shimmer medium" style={{ flex: 1 }}></div>
          </div>
          <div className="skeleton-line skeleton-shimmer short" style={{ width: '80px' }}></div>
        </div>
      ))}
    </div>
  )
});

// ── Shared animation variants ──────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 10 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 28, delay: i * 0.05 }
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariant = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 26 }
  },
};

const rowVariant = {
  hidden:  { opacity: 0, x: -8 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30, delay: i * 0.035 }
  }),
};

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

const shortDateFormatter = new Intl.DateTimeFormat(undefined);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renderActivity, setRenderActivity] = useState(false);
  const isMobile = useIsMobile();
  const postsTableRef = useRef(null);

  // High-end volume tracking filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [authorFilter, setAuthorFilter] = useState('all');
  const [allClientsList, setAllClientsList] = useState([]);
  const [userRole, setUserRole] = useState('team');
  const [clientCompany, setClientCompany] = useState('');

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
    
    async function loadUser() {
      const supabase = createClientBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role, client_id')
          .eq('id', user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
          if (profile.role === 'client' && profile.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('company_name')
              .eq('id', profile.client_id)
              .single();
            if (client) {
              setClientCompany(client.company_name);
              setClientFilter(client.company_name);
            }
          }
        }
      }
    }
    loadUser();
    fetchDashboardData(authorId);

    // Stagger hydration of Recent Activity component to avoid startup thread freezing
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => setRenderActivity(true));
      } else {
        setTimeout(() => setRenderActivity(true), 200);
      }
    }
  }, []);

  const clearAuthorFilter = () => {
    setAuthorFilter('all');
    const url = new URL(window.location.href);
    url.searchParams.delete('authorId');
    window.history.pushState({}, '', url);
    fetchDashboardData('all');
  };

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
          <div style={{ width: 80, height: 60, position: 'relative', borderRadius: 6, overflow: 'hidden', backgroundColor: 'transparent', flexShrink: 0, border: '1px solid rgba(0,0,0,0.08)' }}>
            <video src={post.media_url} preload="metadata" playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#fff' }}><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        );
      }
      return (
        <div style={{ width: 80, height: 60, borderRadius: 6, overflow: 'hidden', backgroundColor: 'transparent', flexShrink: 0, border: '1px solid rgba(0,0,0,0.08)' }}>
          <img src={post.media_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      );
    }

    const gradClassMap = {
      instagram: 'fallback-instagram',
      facebook: 'fallback-facebook',
      shorts: 'fallback-shorts',
      linkedin: 'fallback-linkedin',
      youtube: 'fallback-youtube'
    };
    const gradClass = gradClassMap[post.platform] || 'fallback-shorts';

    const emojiMap = { instagram: '📷', facebook: '📘', shorts: '🎬', linkedin: '💼', youtube: '▶️' };
    const platformEmoji = emojiMap[post.platform] || '📷';

    return (
      <div className={`fallback-gradient ${gradClass}`} style={{ width: 80, height: 60, borderRadius: 6, flexShrink: 0, padding: 0, border: '1px solid rgba(0,0,0,0.08)' }}>
        <span style={{ fontSize: 18, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>{platformEmoji}</span>
      </div>
    );
  };

  return (
    <PageTransition>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1>Dashboard</h1>
        <p>Overview of your content approval workflow.</p>
      </motion.div>

      <div style={{ position: 'relative' }}>
        <div className="dashboard-glow-blob"></div>
        <motion.div
          className="stats-grid"
          style={{ position: 'relative', zIndex: 1 }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {loading || !data ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="stat-card skeleton-card" style={{ pointerEvents: 'none' }}>
                  <div className="skeleton-line skeleton-shimmer title short" style={{ height: '32px', marginBottom: '12px' }}></div>
                  <div className="skeleton-line skeleton-shimmer medium" style={{ height: '16px' }}></div>
                </div>
              ))}
            </>
          ) : (
            <>
              <motion.div
                variants={cardVariant}
                whileHover={{ y: -6, scale: 1.012, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                whileTap={{ scale: 0.98 }}
                className="stat-card"
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => { setStatusFilter('all'); setCurrentPage(1); postsTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              >
                <svg style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-muted)', opacity: 1 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                <div className="stat-card-value">{data.total}</div>
                <div className="stat-card-label">Total posts</div>
              </motion.div>
              <motion.div
                variants={cardVariant}
                whileHover={{ y: -6, scale: 1.012, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                whileTap={{ scale: 0.98 }}
                className="stat-card"
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => { setStatusFilter('pending'); setCurrentPage(1); postsTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              >
                <svg style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-muted)', opacity: 1 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <div className="stat-card-value">{data.byStatus.pending || 0}</div>
                <div className="stat-card-label">Awaiting review</div>
              </motion.div>
              <motion.div
                variants={cardVariant}
                whileHover={{ y: -6, scale: 1.012, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                whileTap={{ scale: 0.98 }}
                className="stat-card"
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => { setStatusFilter('approved'); setCurrentPage(1); postsTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              >
                <svg style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-muted)', opacity: 1 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <div className="stat-card-value">{data.byStatus.approved || 0}</div>
                <div className="stat-card-label">Approved</div>
              </motion.div>
              {userRole !== 'client' && (() => {
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
                  <div className="stat-card cloud-storage-card">
                    <svg className="cloud-storage-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
                    <div className="stat-card-value cloud-storage-value">{formatSize(usedBytes)}</div>
                    <div className="cloud-storage-bar-container">
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 2, transition: 'width 0.5s ease' }}></div>
                    </div>
                    <div className="stat-card-label cloud-storage-label-container">
                      <span className="cloud-storage-title">Cloud storage</span>
                      <span className="cloud-storage-pct">{pct.toFixed(1)}% of 10 GB</span>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </motion.div>
      </div>

      <motion.div
        className="dashboard-content-grid"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariant} className="card">
          <div className="card-body">
            <div className="flex items-baseline justify-between mb-20">
              <h2 style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--sans)' }}>Pending approvals</h2>
              {loading ? (
                <div className="skeleton-circle skeleton-shimmer" style={{ width: '24px', height: '24px' }}></div>
              ) : (
                <span className="badge badge-pending">{pendingPosts.length}</span>
              )}
            </div>
            {loading ? (
              <div className="segmented-list">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="segmented-list-item" style={{ gap: '16px', pointerEvents: 'none' }}>
                    <div className="skeleton-rect skeleton-shimmer" style={{ width: '80px', height: '60px' }}></div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="skeleton-line skeleton-shimmer medium"></div>
                      <div className="skeleton-line skeleton-shimmer short"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingPosts.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>No pending posts to review</div>
            ) : (
              <motion.div
                className="segmented-list"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {pendingPosts.slice(0, 5).map((post, i) => (
                  <motion.div key={post.id} variants={fadeUp} custom={i}>
                    <Link href={`/posts/${post.id}`} className="segmented-list-item">
                      {renderPostThumbnail(post)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="truncate" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{post.caption || 'Untitled post'}</div>
                        <div style={{ fontSize: 12, fontFamily: 'var(--sans)', color: 'var(--text-muted)', marginTop: 2 }}>
                          <PlatformBadge platform={post.platform} />
                          <span style={{ opacity: 0.4, margin: '0 4px' }}>·</span>
                          {post.clients?.company_name}
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div variants={cardVariant} className="card">
          <div className="card-body">
            <h2 style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 20 }}>Recent activity</h2>
            {renderActivity ? (
              <RecentActivity recentActivity={data?.recentActivity} loading={loading} />
            ) : (
              <div className="segmented-list" style={{ pointerEvents: 'none' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="segmented-list-item" style={{ justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div className="skeleton-circle skeleton-shimmer" style={{ width: '6px', height: '6px' }}></div>
                      <div className="skeleton-line skeleton-shimmer medium" style={{ flex: 1 }}></div>
                    </div>
                    <div className="skeleton-line skeleton-shimmer short" style={{ width: '80px' }}></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        custom={3}
        initial="hidden"
        animate="visible"
        className="card"
        ref={postsTableRef}
        style={{ marginTop: 32, scrollMarginTop: '24px' }}
      >
        <div className="card-body">
          <div className="flex items-center justify-between mb-16">
            <h2 style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--sans)' }}>All posts</h2>
            {userRole !== 'client' && <Link href="/posts/new" className="btn btn-primary btn-sm">New post</Link>}
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
                  {['all', 'pending', 'approved', 'published', 'draft', 'rejected'].map(status => {
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
              {userRole !== 'client' && uniqueClients.length > 0 && (
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
              {loading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="mobile-post-card" style={{ gap: '16px', pointerEvents: 'none' }}>
                      <div className="skeleton-rect skeleton-shimmer" style={{ width: '80px', height: '60px' }}></div>
                      <div className="mobile-post-card-info" style={{ gap: '8px', display: 'flex', flexDirection: 'column' }}>
                        <div className="skeleton-line skeleton-shimmer medium"></div>
                        <div className="skeleton-line skeleton-shimmer short"></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : paginatedPosts.length === 0 ? (
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
                          {({ instagram: '📷', facebook: '📘', shorts: '🎬', linkedin: '💼', youtube: '▶️' })[post.platform] || '📷'}
                        </div>
                      )}
                    </div>
                    <div className="mobile-post-card-info">
                      <div className="mobile-post-card-title" style={{ fontWeight: 600 }}>{parsePostCaption(post.caption).title}</div>
                      <div className="mobile-post-card-meta">
                        <PlatformBadge platform={post.platform} />
                        <StatusBadge status={post.status} />
                        <span>{post.clients?.company_name}</span>
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
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
                    {userRole !== 'client' && <th>Client</th>}
                    <th>Status</th>
                    <th>Auto-Deletes</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} style={{ pointerEvents: 'none' }}>
                        <td><div className="skeleton-rect skeleton-shimmer" style={{ width: '80px', height: '24px' }}></div></td>
                        <td><div className="skeleton-line skeleton-shimmer medium"></div></td>
                        <td><div className="skeleton-line skeleton-shimmer short"></div></td>
                        {userRole !== 'client' && <td><div className="skeleton-line skeleton-shimmer short"></div></td>}
                        <td><div className="skeleton-rect skeleton-shimmer" style={{ width: '70px', height: '24px' }}></div></td>
                        <td><div className="skeleton-line skeleton-shimmer short"></div></td>
                        <td><div className="skeleton-line skeleton-shimmer short" style={{ width: '80px' }}></div></td>
                      </tr>
                    ))
                  ) : paginatedPosts.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--sans)', color: 'var(--text-muted)' }}>
                        No matching posts found
                      </td>
                    </tr>
                  ) : (
                    paginatedPosts.map(post => (
                      <tr key={post.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/posts/${post.id}`}>
                        <td><PlatformBadge platform={post.platform} /></td>
                        <td>
                          <div style={{ fontFamily: 'var(--sans)', fontWeight: 500, color: 'var(--text-primary)', fontSize: 15 }}>{parsePostCaption(post.caption).title}</div>
                        </td>
                        <td style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-secondary)' }}>{post.projects?.name}</td>
                        {userRole !== 'client' && (
                          <td>
                            <div className="flex items-center gap-8" style={{ fontFamily: 'var(--sans)', fontSize: 15 }}>
                              <div className="avatar avatar-sm">{post.clients?.company_name?.[0]}</div>
                              {post.clients?.company_name}
                            </div>
                          </td>
                        )}
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
                                fontSize: '13px',
                                fontWeight: 500,
                                color: details.color,
                                backgroundColor: details.bg
                              }}>
                                ⏰ {details.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontSize: 13 }}>{shortDateFormatter.format(new Date(post.updated_at))}</td>
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
              Showing <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{filteredPosts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> to <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{Math.min(currentPage * itemsPerPage, filteredPosts.length)}</strong> of <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{filteredPosts.length}</strong> results
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
      </motion.div>
    </PageTransition>
  );
}
