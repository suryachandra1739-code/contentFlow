'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  FileStack, Hourglass, CheckCircle2, Database,
  Search, Plus, ArrowRight, Check, MessageSquare, UploadCloud, PenLine, UserPlus,
} from 'lucide-react';
import { StatusBadge, PlatformBadge, PlatformIcon, StatCard, PageHeader, SegTabs } from '@/components/bits';
import { createClientBrowser } from '@/lib/supabase';

// Dynamic import RecentActivity with ssr: false
const RecentActivity = dynamic(() => import('@/components/RecentActivity'), {
  ssr: false,
  loading: () => (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="cf-skeleton h-10 w-full" />
      ))}
    </div>
  )
});

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
  if (!createdAt) return { label: '7d left', color: 'hsl(var(--faint-foreground))', urgency: 'normal' };
  const expiry = new Date(new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000);
  const diffMs = expiry - Date.now();
  if (diffMs <= 0) return { label: 'Expired', color: 'hsl(var(--st-rejected))', urgency: 'critical' };

  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  let label = '';
  if (diffDays > 0) {
    label = `${diffDays}d ${diffHours}h`;
  } else {
    label = `${diffHours}h`;
  }

  if (diffMs < 24 * 60 * 60 * 1000) {
    return { label, color: 'hsl(var(--st-rejected))', urgency: 'critical' };
  } else if (diffMs < 3 * 24 * 60 * 60 * 1000) {
    return { label, color: 'hsl(var(--st-pending))', urgency: 'warning' };
  }
  return { label, color: 'hsl(var(--faint-foreground))', urgency: 'normal' };
};

const shortDateFormatter = new Intl.DateTimeFormat(undefined);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renderActivity, setRenderActivity] = useState(false);
  const isMobile = useIsMobile();
  const postsTableRef = useRef(null);

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

  const uniqueClients = Array.from(new Set([
    ...allClientsList.map(c => c.company_name),
    ...posts.map(p => p.clients?.company_name)
  ].filter(Boolean)));

  const statusOptions = [
    { id: 'all', label: 'All', count: posts.length },
    { id: 'pending', label: 'Pending', count: posts.filter(p => p.status === 'pending').length },
    { id: 'approved', label: 'Approved', count: posts.filter(p => p.status === 'approved').length },
    { id: 'published', label: 'Published', count: posts.filter(p => p.status === 'published').length },
    { id: 'draft', label: 'Draft', count: posts.filter(p => p.status === 'draft').length },
    { id: 'rejected', label: 'Rejected', count: posts.filter(p => p.status === 'rejected').length },
  ];

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        sub="Overview of your content approval workflow."
        actions={userRole !== 'client' && <Link href="/posts/new" className="cf-btn cf-btn-primary"><Plus size={15} /> New post</Link>}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger mb-6">
        {loading || !data ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="cf-card p-5">
                <div className="cf-skeleton h-7 w-16 mb-3" />
                <div className="cf-skeleton h-4 w-24" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="cursor-pointer" onClick={() => { setStatusFilter('all'); setCurrentPage(1); postsTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <StatCard icon={FileStack} label="Total posts" value={String(data.total)} sub={`${posts.length} loaded`} tone="246 90% 68%" />
            </div>
            <div className="cursor-pointer" onClick={() => { setStatusFilter('pending'); setCurrentPage(1); postsTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <StatCard icon={Hourglass} label="Awaiting review" value={String(data.byStatus?.pending || 0)} sub="need attention" tone="38 96% 60%" />
            </div>
            <div className="cursor-pointer" onClick={() => { setStatusFilter('approved'); setCurrentPage(1); postsTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <StatCard icon={CheckCircle2} label="Approved" value={String(data.byStatus?.approved || 0)} sub="ready to publish" tone="160 84% 45%" />
            </div>
            {userRole !== 'client' && (() => {
              const usedBytes = data.storageUsedBytes || 0;
              const limitBytes = 10 * 1024 * 1024 * 1024;
              const pct = Math.min((usedBytes / limitBytes) * 100, 100);
              return (
                <StatCard icon={Database} label="Cloud storage" value={formatSize(usedBytes)} sub={`${pct.toFixed(1)}% of 10 GB`} tone="210 96% 62%" progress={pct} />
              );
            })()}
          </>
        )}
      </div>

      {/* Two-column: Pending + Activity */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Pending approvals */}
        <div className="cf-card p-5 anim-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[15px]">Pending approvals</h2>
            {!loading && (
              <span className="cf-badge" style={{ color: 'hsl(var(--st-pending))', background: 'hsl(var(--st-pending) / .12)', borderColor: 'hsl(var(--st-pending) / .3)' }}>
                {pendingPosts.length}
              </span>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="cf-skeleton h-14 w-full" />)}
            </div>
          ) : pendingPosts.length === 0 ? (
            <div className="text-center py-10 text-xs" style={{ color: 'hsl(var(--faint-foreground))' }}>No pending posts to review</div>
          ) : (
            <div className="space-y-1">
              {pendingPosts.slice(0, 5).map((post) => (
                <Link
                  href={`/posts/${post.id}`}
                  key={post.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-[hsl(var(--surface-3)/0.5)]"
                >
                  {post.media_url ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid hsl(var(--border))' }}>
                      {post.media_type === 'video' ? (
                        <video src={post.media_url} preload="metadata" playsInline muted className="w-full h-full object-cover" />
                      ) : (
                        <img src={post.media_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg grid place-items-center shrink-0" style={{ background: 'hsl(var(--surface-3))', border: '1px solid hsl(var(--border))' }}>
                      <PlatformIcon platform={post.platform} size={16} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{parsePostCaption(post.caption).title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <PlatformBadge platform={post.platform} />
                      <span className="cf-mono text-[10px]" style={{ color: 'hsl(var(--faint-foreground))' }}>{post.clients?.company_name}</span>
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'hsl(var(--faint-foreground))' }} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="cf-card p-5 anim-fade-up" style={{ animationDelay: '.08s' }}>
          <h2 className="font-semibold text-[15px] mb-4">Recent activity</h2>
          {renderActivity ? (
            <RecentActivity recentActivity={data?.recentActivity} loading={loading} />
          ) : (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="cf-skeleton h-10 w-full" />)}
            </div>
          )}
        </div>
      </div>

      {/* All posts table */}
      <div className="cf-card p-5 anim-fade-up" ref={postsTableRef} style={{ scrollMarginTop: '24px', animationDelay: '.16s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[15px]">All posts</h2>
          {userRole !== 'client' && <Link href="/posts/new" className="cf-btn cf-btn-primary cf-btn-sm"><Plus size={13} /> New post</Link>}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--faint-foreground))' }} />
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search captions, projects..."
              className="cf-input !h-9"
              style={{ paddingLeft: 32 }}
            />
          </div>
          {authorFilter !== 'all' && (
            <div className="flex items-center gap-1.5 cf-badge" style={{ color: 'hsl(var(--st-rejected))', background: 'hsl(var(--st-rejected) / .12)', borderColor: 'hsl(var(--st-rejected) / .3)' }}>
              Author: {posts.find(p => p.created_by === authorFilter)?.users?.name || 'Team Member'}
              <button onClick={clearAuthorFilter} className="ml-1 hover:opacity-70">✕</button>
            </div>
          )}
          {userRole !== 'client' && uniqueClients.length > 0 && (
            <select
              value={clientFilter}
              onChange={e => { setClientFilter(e.target.value); setCurrentPage(1); }}
              className="cf-input !w-auto !h-9"
              style={{ minWidth: 120 }}
            >
              <option value="all">All clients</option>
              {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        {/* Status tabs */}
        <div className="mb-4">
          <SegTabs
            options={statusOptions}
            value={statusFilter}
            onChange={(id) => { setStatusFilter(id); setCurrentPage(1); }}
          />
        </div>

        {/* Table / Mobile cards */}
        {isMobile ? (
          <div className="space-y-1">
            {loading ? (
              [...Array(3)].map((_, i) => <div key={i} className="cf-skeleton h-16 w-full" />)
            ) : paginatedPosts.length === 0 ? (
              <div className="text-center py-10 text-xs" style={{ color: 'hsl(var(--faint-foreground))' }}>No matching posts found</div>
            ) : (
              paginatedPosts.map(post => (
                <Link
                  href={`/posts/${post.id}`}
                  key={post.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors hover:bg-[hsl(var(--surface-3)/0.5)]"
                >
                  {post.media_url ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid hsl(var(--border))' }}>
                      {post.media_type === 'video' ? (
                        <video src={post.media_url} preload="metadata" playsInline muted className="w-full h-full object-cover" />
                      ) : (
                        <img src={post.media_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg grid place-items-center shrink-0" style={{ background: 'hsl(var(--surface-3))', border: '1px solid hsl(var(--border))' }}>
                      <PlatformIcon platform={post.platform} size={18} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{parsePostCaption(post.caption).title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <PlatformBadge platform={post.platform} />
                      <StatusBadge status={post.status} />
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'hsl(var(--faint-foreground))' }} />
                </Link>
              ))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="cf-table w-full">
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
                    <tr key={i}>
                      <td><div className="cf-skeleton h-5 w-16" /></td>
                      <td><div className="cf-skeleton h-5 w-40" /></td>
                      <td><div className="cf-skeleton h-5 w-24" /></td>
                      {userRole !== 'client' && <td><div className="cf-skeleton h-5 w-24" /></td>}
                      <td><div className="cf-skeleton h-5 w-16" /></td>
                      <td><div className="cf-skeleton h-5 w-16" /></td>
                      <td><div className="cf-skeleton h-5 w-20" /></td>
                    </tr>
                  ))
                ) : paginatedPosts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-xs" style={{ color: 'hsl(var(--faint-foreground))' }}>
                      No matching posts found
                    </td>
                  </tr>
                ) : (
                  paginatedPosts.map(post => (
                    <tr key={post.id} className="cursor-pointer" onClick={() => window.location.href = `/posts/${post.id}`}>
                      <td><PlatformBadge platform={post.platform} /></td>
                      <td>
                        <div className="text-[13px] font-medium max-w-[240px] truncate">{parsePostCaption(post.caption).title}</div>
                      </td>
                      <td className="text-[13px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{post.projects?.name}</td>
                      {userRole !== 'client' && (
                        <td>
                          <div className="flex items-center gap-2 text-[13px]">
                            <div className="w-5 h-5 rounded-full grid place-items-center text-[9px] font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)' }}>
                              {post.clients?.company_name?.[0] || '?'}
                            </div>
                            {post.clients?.company_name}
                          </div>
                        </td>
                      )}
                      <td><StatusBadge status={post.status} /></td>
                      <td>
                        {(() => {
                          const details = getExpiryDetails(post.created_at);
                          return (
                            <span className="cf-mono text-[11px]" style={{ color: details.color }}>
                              ⏰ {details.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="cf-mono text-[11px]" style={{ color: 'hsl(var(--faint-foreground))' }}>
                        {shortDateFormatter.format(new Date(post.updated_at))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 text-[13px]" style={{ borderTop: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
          <div>
            Showing <strong className="text-foreground">{filteredPosts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong className="text-foreground">{Math.min(currentPage * itemsPerPage, filteredPosts.length)}</strong> of{' '}
            <strong className="text-foreground">{filteredPosts.length}</strong> results
          </div>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="cf-btn cf-btn-secondary cf-btn-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="cf-btn cf-btn-secondary cf-btn-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
