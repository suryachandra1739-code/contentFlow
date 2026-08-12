import { type ReactNode } from 'react'
import { NavLink, Link } from 'react-router'
import { Bell, LogOut, LayoutGrid, History, Activity } from 'lucide-react'
import { Logo, ThemeToggle, GradAvatar } from '@/components/bits'

const TABS = [
  { to: '/client-portal', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/client-portal/history', label: 'History', icon: History },
  { to: '/client-portal/activity', label: 'Activity', icon: Activity },
]

/* Client portal — separate shell: top nav, no sidebar */
export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-app-gradient">
      <header className="sticky top-0 z-40 cf-glass" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }}>
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/client-portal" className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-bold text-[15px] tracking-tight hidden sm:block">ContentFlow</span>
          </Link>

          <span
            className="cf-badge ml-1 hidden md:inline-flex"
            style={{ color: 'hsl(var(--cyan))', background: 'hsl(var(--cyan) / .1)', borderColor: 'hsl(var(--cyan) / .25)' }}
          >
            <GradAvatar name="Lumen Athletics" hue={262} size={16} />
            Lumen Athletics
          </span>

          <nav className="flex items-center gap-1 mx-auto">
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `cf-btn cf-btn-sm ${isActive ? '' : 'cf-btn-ghost'}`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: 'hsl(var(--primary) / 0.14)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.3)' }
                    : undefined
                }
              >
                <t.icon size={13} />
                <span className="hidden sm:inline">{t.label}</span>
              </NavLink>
            ))}
          </nav>

          <button className="relative grid place-items-center rounded-[10px]" style={{ width: 34, height: 34, border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }} aria-label="Notifications">
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: 'hsl(var(--st-pending))' }} />
          </button>
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-2">
            <div className="grid place-items-center rounded-full text-[11px] font-bold text-white" style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>MC</div>
            <span className="text-xs font-medium hidden xl:block">Maya Chen</span>
          </div>
          <Link to="/login" className="cf-btn cf-btn-ghost cf-btn-sm !px-1.5" title="Log out"><LogOut size={14} /></Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-4 sm:px-6 py-6">{children}</main>
    </div>
  )
}
