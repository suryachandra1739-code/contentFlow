import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import {
  FileStack, Hourglass, CheckCircle2, HardDrive, Search, Plus, ChevronLeft, ChevronRight,
  ArrowRight, Check, MessageSquare, UploadCloud, PencilLine, UserPlus, Timer, Inbox,
} from 'lucide-react'
import { POSTS, CLIENTS, ACTIVITY, clientById, type PostStatus } from '@/lib/data'
import { StatCard, StatusBadge, PlatformStack, GradAvatar, SegTabs, PageHeader, EmptyState } from '@/components/bits'

const ACT_ICONS: Record<string, typeof Check> = {
  check: Check, message: MessageSquare, upload: UploadCloud, edit: PencilLine, plus: Plus, user: UserPlus,
}
const ACT_TONES: Record<string, string> = {
  approved: '--st-approved', comment: '--st-revision', published: '--st-published',
  revision: '--st-pending', new: '--primary', client: '--cyan',
}

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Draft' },
  { id: 'rejected', label: 'Rejected' },
]

const PAGE_SIZE = 8

export default function Dashboard() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900) // skeleton demo
    return () => clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    return POSTS.filter((p) => {
      if (tab !== 'all' && p.status !== tab) return false
      if (clientFilter !== 'all' && p.clientId !== clientFilter) return false
      if (query) {
        const q = query.toLowerCase()
        return p.caption.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.project.toLowerCase().includes(q)
      }
      return true
    })
  }, [query, tab, clientFilter])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pagePosts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pending = POSTS.filter((p) => p.status === 'pending')

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: POSTS.length }
    for (const t of STATUS_TABS.slice(1)) c[t.id] = POSTS.filter((p) => p.status === (t.id as PostStatus)).length
    return c
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="cf-skeleton h-9 w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="cf-skeleton h-[104px]" />)}
        </div>
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="cf-skeleton h-72 lg:col-span-3" />
          <div className="cf-skeleton h-72 lg:col-span-2" />
        </div>
        <div className="cf-skeleton h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good afternoon, Dana"
        sub="5 posts are waiting for client review across 4 workspaces."
        actions={
          <Link to="/posts/new" className="cf-btn cf-btn-primary"><Plus size={15} /> New Post</Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
        <StatCard icon={FileStack} label="Total posts" value="128" sub="+14 this month" tone="246 90% 68%" />
        <StatCard icon={Hourglass} label="Awaiting review" value="5" sub="2 due within 48h" tone="38 96% 60%" />
        <StatCard icon={CheckCircle2} label="Approved" value="43" sub="Approval rate 86%" tone="160 84% 45%" />
        <StatCard icon={HardDrive} label="Cloud storage" value="38.2 GB" sub="of 100 GB" tone="187 92% 55%" progress={38} />
      </div>

      {/* Pending + Activity */}
      <div className="grid lg:grid-cols-5 gap-4">
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="cf-card lg:col-span-3 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <h2 className="font-semibold text-[15px]">Pending approvals</h2>
            <span className="cf-badge" style={{ color: 'hsl(var(--st-pending))', background: 'hsl(var(--st-pending) / .12)', borderColor: 'hsl(var(--st-pending) / .3)' }}>
              <span className="dot" style={{ animation: 'cf-pulse-dot 1.8s infinite' }} /> {pending.length} waiting
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
            {pending.slice(0, 5).map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                onClick={() => navigate(`/posts/${p.id}`)}
                className="w-full flex items-center gap-3.5 px-5 py-3 text-left transition-colors hover:bg-[hsl(var(--surface-3)/0.45)]"
              >
                <span className="text-2xl leading-none">{['🌅', '🎬', '✨', '🥾', '🎨'][i % 5]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{p.title}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--faint-foreground))' }}>
                    {clientById(p.clientId).company} · {p.project}
                  </div>
                </div>
                <PlatformStack platforms={p.platforms} />
                <ArrowRight size={14} style={{ color: 'hsl(var(--faint-foreground))' }} />
              </motion.button>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="cf-card lg:col-span-2 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <h2 className="font-semibold text-[15px]">Recent activity</h2>
            <span className="flex items-center gap-1.5 text-[10px] cf-mono" style={{ color: 'hsl(var(--st-approved))' }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'hsl(var(--st-approved))', animation: 'cf-pulse-dot 2s infinite' }} /> LIVE
            </span>
          </div>
          <div className="px-5 py-4">
            <div className="relative space-y-4 before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-px" style={{}}>
              <div className="absolute left-[13px] top-2 bottom-2 w-px" style={{ background: 'hsl(var(--border))' }} />
              {ACTIVITY.map((a, i) => {
                const Icon = ACT_ICONS[a.icon] ?? Check
                const tone = ACT_TONES[a.tone] ?? '--primary'
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 + i * 0.06 }}
                    className="relative flex gap-3"
                  >
                    <span
                      className="relative z-10 grid place-items-center rounded-full shrink-0"
                      style={{ width: 27, height: 27, color: `hsl(var(${tone}))`, background: `hsl(var(${tone}) / .14)`, border: `1px solid hsl(var(${tone}) / .3)` }}
                    >
                      <Icon size={12} />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-xs leading-snug">{a.text}</p>
                      <p className="cf-mono text-[10px] mt-0.5" style={{ color: 'hsl(var(--faint-foreground))' }}>{a.time}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.section>
      </div>

      {/* All posts */}
      <motion.section
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
        className="cf-card overflow-hidden"
      >
        <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <h2 className="font-semibold text-[15px] mr-auto">All posts</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--faint-foreground))' }} />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder="Search captions, projects…"
              className="cf-input !h-8 !pl-8.5 !text-xs w-52"
              style={{ paddingLeft: 32 }}
            />
          </div>
          <select
            value={clientFilter}
            onChange={(e) => { setClientFilter(e.target.value); setPage(1) }}
            className="cf-input !h-8 !text-xs !w-auto pr-8 cursor-pointer"
          >
            <option value="all">All clients</option>
            {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
          </select>
        </div>

        <div className="px-5 py-3 overflow-x-auto" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <SegTabs
            options={STATUS_TABS.map((t) => ({ ...t, count: counts[t.id] }))}
            value={tab}
            onChange={(id) => { setTab(id); setPage(1) }}
          />
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="cf-table w-full min-w-[820px]">
            <thead>
              <tr>
                <th>Platform</th><th>Caption</th><th>Project</th><th>Client</th><th>Status</th><th>Auto-deletes</th><th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {pagePosts.map((p) => (
                <tr key={p.id} className="cursor-pointer" onClick={() => navigate(`/posts/${p.id}`)}>
                  <td><PlatformStack platforms={p.platforms} /></td>
                  <td className="max-w-[260px]">
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="text-[11px] truncate mt-0.5" style={{ color: 'hsl(var(--faint-foreground))' }}>{p.caption}</div>
                  </td>
                  <td style={{ color: 'hsl(var(--muted-foreground))' }}>{p.project}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <GradAvatar name={clientById(p.clientId).company} hue={clientById(p.clientId).hue} size={22} />
                      <span className="text-xs">{clientById(p.clientId).company}</span>
                    </div>
                  </td>
                  <td><StatusBadge status={p.status} pulse={p.status === 'pending'} /></td>
                  <td>
                    {p.autoDelete ? (
                      <span className="cf-mono text-[11px] flex items-center gap-1" style={{ color: 'hsl(var(--st-pending))' }}>
                        <Timer size={11} /> {p.autoDelete}
                      </span>
                    ) : (
                      <span className="cf-mono text-[11px]" style={{ color: 'hsl(var(--faint-foreground))' }}>—</span>
                    )}
                  </td>
                  <td className="cf-mono text-[11px]" style={{ color: 'hsl(var(--faint-foreground))' }}>{p.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
          {pagePosts.map((p) => (
            <button key={p.id} onClick={() => navigate(`/posts/${p.id}`)} className="w-full text-left px-4 py-3.5 space-y-2 active:bg-[hsl(var(--surface-3)/0.5)]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[13px] truncate">{p.title}</span>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-xs line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.caption}</p>
              <div className="flex items-center justify-between">
                <PlatformStack platforms={p.platforms} />
                <span className="cf-mono text-[10px]" style={{ color: 'hsl(var(--faint-foreground))' }}>
                  {clientById(p.clientId).company} · {p.updatedAt}
                </span>
              </div>
            </button>
          ))}
        </div>

        {pagePosts.length === 0 && (
          <div className="p-6">
            <EmptyState icon={Inbox} title="No posts match" body="Try a different search term, status filter, or client." />
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <span className="cf-mono text-[11px]" style={{ color: 'hsl(var(--faint-foreground))' }}>
            {filtered.length} posts · page {page}/{pages}
          </span>
          <div className="flex items-center gap-1.5">
            <button className="cf-btn cf-btn-secondary cf-btn-sm" disabled={page === 1} onClick={() => setPage((v) => v - 1)}>
              <ChevronLeft size={13} /> Prev
            </button>
            <button className="cf-btn cf-btn-secondary cf-btn-sm" disabled={page === pages} onClick={() => setPage((v) => v + 1)}>
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
