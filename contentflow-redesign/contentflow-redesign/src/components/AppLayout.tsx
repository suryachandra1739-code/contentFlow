import { useState, type ReactNode } from 'react'
import { NavLink, Link, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, FolderKanban, SquarePen, Users, BarChart3, Share2,
  ShieldCheck, ScrollText, Bell, Plus, Menu, LogOut, Check, MessageSquare, UploadCloud, Search,
} from 'lucide-react'
import { Logo, ThemeToggle } from '@/components/bits'

const NAV = [
  {
    section: 'Main',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/projects', label: 'Projects', icon: FolderKanban },
      { to: '/posts/new', label: 'New Post', icon: SquarePen },
    ],
  },
  {
    section: 'Manage',
    items: [
      { to: '/clients', label: 'Clients', icon: Users },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/social', label: 'Social Accounts', icon: Share2 },
    ],
  },
  {
    section: 'Admin',
    items: [
      { to: '/design-system', label: 'Design System', icon: ShieldCheck },
      { to: '/audit', label: 'Audit Log', icon: ScrollText },
    ],
  },
]

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const notes = [
    { icon: Check, tone: '--st-approved', text: 'Maya Chen approved “Glow Ritual Tutorial”', time: '12m' },
    { icon: MessageSquare, tone: '--st-revision', text: 'New comment on “SPF Myth-Busting Carousel”', time: '40m' },
    { icon: UploadCloud, tone: '--st-published', text: '“Studio Reel — August” published', time: '1h' },
  ]
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid place-items-center rounded-[10px] transition-colors hover:bg-[hsl(var(--surface-3))]"
        style={{ width: 34, height: 34, color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
        aria-label="Notifications"
      >
        <Bell size={15} />
        <span
          className="absolute -top-1 -right-1 grid place-items-center rounded-full cf-mono text-[9px] font-bold text-white"
          style={{ width: 15, height: 15, background: 'hsl(var(--primary))', boxShadow: '0 0 0 2px hsl(var(--sidebar-background))' }}
        >
          3
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 top-11 z-40 w-[300px] cf-glass rounded-xl shadow-pop overflow-hidden"
            >
              <div className="px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                Notifications
                <span className="cf-mono text-[10px] font-normal" style={{ color: 'hsl(var(--faint-foreground))' }}>3 unread</span>
              </div>
              {notes.map((n) => (
                <div key={n.text} className="flex gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-[hsl(var(--surface-3)/0.5)]">
                  <span className="grid place-items-center rounded-lg shrink-0" style={{ width: 26, height: 26, color: `hsl(var(${n.tone}))`, background: `hsl(var(${n.tone}) / .12)` }}>
                    <n.icon size={12} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs leading-snug">{n.text}</div>
                    <div className="cf-mono text-[10px] mt-0.5" style={{ color: 'hsl(var(--faint-foreground))' }}>{n.time} ago</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <Logo />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[15px] leading-tight tracking-tight">ContentFlow</div>
          <div className="text-[10px] font-medium" style={{ color: 'hsl(var(--faint-foreground))' }}>Approval Platform</div>
        </div>
        <NotificationBell />
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3 space-y-5">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--faint-foreground))' }}>
              {group.section}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) => `cf-navitem ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={15} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 space-y-2" style={{ borderTop: '1px solid hsl(var(--sidebar-border))' }}>
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Theme</span>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2.5 rounded-[10px] px-2 py-2" style={{ background: 'hsl(var(--surface-3) / .5)' }}>
          <div className="grid place-items-center rounded-full text-[11px] font-bold text-white shrink-0" style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)' }}>DK</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold truncate">Dana Kowalski</div>
            <div className="text-[10px]" style={{ color: 'hsl(var(--faint-foreground))' }}>Agency Admin</div>
          </div>
          <button className="cf-btn-ghost cf-btn cf-btn-sm !px-1.5" title="Sign out"><LogOut size={13} /></button>
        </div>
      </div>
    </div>
  )
}

const MOBILE_TABS = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/analytics', label: 'Stats', icon: BarChart3 },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-app-gradient">
      {/* Desktop floating sidebar */}
      <aside
        className="hidden lg:flex fixed z-40 flex-col rounded-2xl cf-glass"
        style={{ top: 16, left: 16, bottom: 16, width: 240 }}
      >
        <SidebarBody />
      </aside>

      {/* Main content */}
      <main className="lg:pl-[272px] pb-28 lg:pb-10">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 cf-glass flex items-center gap-2.5 px-4 py-3" style={{ borderRadius: 0 }}>
          <Logo size={26} />
          <span className="font-bold text-[15px] tracking-tight flex-1">ContentFlow</span>
          <button className="grid place-items-center rounded-lg" style={{ width: 32, height: 32, border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }} aria-label="Search">
            <Search size={14} />
          </button>
          <NotificationBell />
        </div>

        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-6">{children}</div>
      </main>

      {/* Mobile bottom nav — floating pill */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 z-40 flex items-center gap-1">
        <nav className="cf-glass rounded-2xl shadow-pop flex items-center flex-1 px-1.5 py-1.5">
          {MOBILE_TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-[10px] font-medium transition-colors ${
                  isActive ? '' : 'opacity-60'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                background: isActive ? 'hsl(var(--primary) / 0.12)' : 'transparent',
              })}
            >
              <t.icon size={17} />
              {t.label}
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-[10px] font-medium opacity-60"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <Menu size={17} />
            More
          </button>
        </nav>
        {/* FAB */}
        <button
          onClick={() => navigate('/posts/new')}
          className="grid place-items-center rounded-2xl text-white shrink-0 transition-transform active:scale-95"
          style={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--cyan)))',
            boxShadow: '0 8px 24px -6px hsl(var(--primary) / 0.6)',
          }}
          aria-label="New post"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Mobile "More" slide-out */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0" style={{ background: 'hsl(240 30% 2% / .55)', backdropFilter: 'blur(4px)' }} onClick={() => setMoreOpen(false)} />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="absolute left-0 top-0 bottom-0 w-[280px] cf-glass"
              style={{ borderRadius: 0 }}
            >
              <SidebarBody onNavigate={() => setMoreOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo banner */}
      <Link
        to="/login"
        className="hidden lg:block fixed bottom-5 right-5 z-40 cf-mono text-[10px] px-2.5 py-1.5 rounded-lg transition-colors hover:border-[hsl(var(--border-strong))]"
        style={{ background: 'hsl(var(--surface-2))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--faint-foreground))' }}
      >
        mockup · view login →
      </Link>
    </div>
  )
}
