'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from '@/components/ui/StatusBadge';
import PlatformBadge from '@/components/ui/PlatformBadge';
import { createClientBrowser } from '@/lib/supabase';

/* ── Helpers ────────────────────────────────────────────────────── */
const parseCaption = (caption) => {
  if (!caption) return { title: 'Untitled', body: '' };
  if (caption.startsWith('Title: ')) {
    const nl2 = caption.indexOf('\n\n');
    if (nl2 !== -1) return { title: caption.slice(7, nl2), body: caption.slice(nl2 + 2) };
    const nl  = caption.indexOf('\n');
    if (nl  !== -1) return { title: caption.slice(7, nl),  body: caption.slice(nl + 1) };
    return { title: caption.slice(7), body: '' };
  }
  return { title: caption.slice(0, 60) + (caption.length > 60 ? '…' : ''), body: caption };
};

const STATUS_OPTIONS = ['all', 'draft', 'pending', 'approved', 'revision', 'rejected'];

const STAT_CONFIGS = [
  { key: 'total',    label: 'Total Posts',     color: 'var(--accent)',  icon: '□' },
  { key: 'pending',  label: 'In Review',        color: 'var(--amber)',   icon: '◎' },
  { key: 'approved', label: 'Approved',          color: 'var(--green)',   icon: '✓' },
  { key: 'revision', label: 'Need Revision',     color: 'var(--sky)',     icon: '↻' },
];

const fadeUp = {
  hidden:  { opacity: 0, y: 12 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, type: 'spring', stiffness: 280, damping: 26 } }),
};

/* ── Skeleton ───────────────────────────────────────────────────── */
function StatSkeleton() {
  return (
    <div className="stat-card">
      <div className="skeleton skeleton-circle" style={{ width: 36, height: 36 }} />
      <div className="skeleton skeleton-title" style={{ width: '40%', height: 32, marginTop: 4 }} />
      <div className="skeleton skeleton-text" style={{ width: '60%', height: 13 }} />
    </div>
  );
}
function PostCardSkeleton() {
  return (
    <div className="post-card" style={{ pointerEvents: 'none' }}>
      <div className="skeleton" style={{ height: 180 }} />
      <div className="post-card-body">
        <div className="skeleton skeleton-title" style={{ width: '75%' }} />
        <div className="skeleton skeleton-text" style={{ width: '50%', marginTop: 6 }} />
        <div className="skeleton skeleton-text" style={{ width: '30%', marginTop: 4 }} />
      </div>
    </div>
  );
}

/* ── Post card ──────────────────────────────────────────────────── */
function PostCard({ post, index }) {
  const { title } = parseCaption(post.caption);
  const platforms = post.platform ? post.platform.split(',').map(p => p.trim()) : [];
  const date = new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible">
      <Link href={`/posts/${post.id}`} className="post-card card-hover card-accent-hover">
        <div className="post-card-media">
          {post.media_url ? (
            post.media_type === 'video' ? (
              <video src={post.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
            ) : (
              <img src={post.media_url} alt={title} loading="lazy" />
            )
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, var(--bg-3) 0%, var(--bg-4) 100%)`,
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border-3)" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          )}
          <div className="post-card-media-overlay">
            <div className="flex gap-1">
              {platforms.slice(0, 3).map(p => (
                <PlatformBadge key={p} platform={p} showLabel={false} size="sm" />
              ))}
              {platforms.length > 3 && (
                <span className="badge badge-draft" style={{ fontSize: 10, padding: '2px 5px' }}>
                  +{platforms.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="post-card-body">
          <div className="post-card-title">{title}</div>
          <div className="post-card-meta">
            <span>{post.client_name || 'No client'}</span>
            {post.client_name && post.project_name && <span style={{ color: 'var(--border-3)' }}>·</span>}
            {post.project_name && <span className="truncate">{post.project_name}</span>}
          </div>
        </div>
        <div className="post-card-footer">
          <StatusBadge status={post.status} size="sm" />
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{date}</span>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Post list item ─────────────────────────────────────────────── */
function PostListItem({ post, index }) {
  const { title } = parseCaption(post.caption);
  const platforms = post.platform ? post.platform.split(',').map(p => p.trim()) : [];
  const date = new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible">
      <Link href={`/posts/${post.id}`} className="post-list-item">
        <div className="post-list-thumb">
          {post.media_url ? (
            <img src={post.media_url} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--bg-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            </div>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-0)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          <div className="flex items-center gap-2">
            {platforms.slice(0, 2).map(p => <PlatformBadge key={p} platform={p} showLabel={false} size="sm" />)}
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{post.client_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', display: 'none' }} className="desktop-date">{date}</span>
          <StatusBadge status={post.status} size="sm" />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Main Dashboard ─────────────────────────────────────────────── */
export default function DashboardPage() {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [userRole, setUserRole] = useState('team');
  const supabase = createClientBrowser();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [postsData, analyticsData] = await Promise.all([
        fetch('/api/posts').then(r => r.json()),
        fetch('/api/analytics').then(r => r.json()),
      ]);
      setPosts(Array.isArray(postsData) ? postsData : []);
      if (analyticsData && !analyticsData.error) setStats(analyticsData);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('users').select('role').eq('id', user.id).single()
          .then(({ data }) => { if (data?.role) setUserRole(data.role); });
      }
    });
  }, []);

  const filtered = posts.filter(p => {
    const matchStatus = status === 'all' || p.status === status;
    const { title } = parseCaption(p.caption);
    const matchSearch = !search || title.toLowerCase().includes(search.toLowerCase())
      || (p.client_name || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statValues = {
    total:    stats?.total_posts || posts.length,
    pending:  stats?.by_status?.find(s => s.status === 'pending')?.count || posts.filter(p => p.status === 'pending').length,
    approved: stats?.by_status?.find(s => s.status === 'approved')?.count || posts.filter(p => p.status === 'approved').length,
    revision: stats?.by_status?.find(s => s.status === 'revision')?.count || posts.filter(p => p.status === 'revision').length,
  };

  return (
    <div className="page-content page-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--s-8)', flexWrap: 'wrap', gap: 'var(--s-4)' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Manage and track all your content in one place.</p>
        </div>
        {userRole !== 'client' && (
          <Link href="/posts/new" className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Post
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 'var(--s-8)' }}>
        {STAT_CONFIGS.map((sc, i) => (
          loading ? <StatSkeleton key={sc.key} /> : (
            <motion.div
              key={sc.key}
              className="stat-card"
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <div className="stat-card-icon" style={{ background: `${sc.color}18`, color: sc.color }}>
                <span style={{ fontSize: 16 }}>{sc.icon}</span>
              </div>
              <div className="stat-card-value">{statValues[sc.key]}</div>
              <div className="stat-card-label">{sc.label}</div>
            </motion.div>
          )
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-tabs">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              className={`filter-tab${status === s ? ' active' : ''}`}
              onClick={() => setStatus(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && !loading && (
                <span style={{ marginLeft: 4, opacity: 0.6 }}>
                  {posts.filter(p => p.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="search-box" style={{ marginLeft: 'auto' }}>
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            placeholder="Search posts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="view-toggle">
          <button
            className={`view-toggle-btn${view === 'grid' ? ' active' : ''}`}
            onClick={() => setView('grid')}
            title="Grid view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button
            className={`view-toggle-btn${view === 'list' ? ' active' : ''}`}
            onClick={() => setView('list')}
            title="List view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        view === 'grid' ? (
          <div className="post-grid">
            {[...Array(6)].map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="card">
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ padding: 'var(--s-3) var(--s-4)', borderBottom: '1px solid var(--border-0)', display: 'flex', gap: 'var(--s-4)', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 48, height: 36, borderRadius: 'var(--r-xs)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: 6 }} />
                  <div className="skeleton skeleton-text" style={{ width: '30%', height: 12 }} />
                </div>
                <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 'var(--r-full)' }} />
              </div>
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="empty-title">
            {search ? `No posts matching "${search}"` : status !== 'all' ? `No ${status} posts` : 'No posts yet'}
          </div>
          <div className="empty-text">
            {userRole !== 'client' ? 'Create your first post to get started.' : 'Your team will share posts for review here.'}
          </div>
          {userRole !== 'client' && !search && status === 'all' && (
            <Link href="/posts/new" className="btn btn-primary">Create Post</Link>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="post-grid">
          {filtered.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
        </div>
      ) : (
        <div className="card">
          <div className="post-list">
            {filtered.map((post, i) => <PostListItem key={post.id} post={post} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
