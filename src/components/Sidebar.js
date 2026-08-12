'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, SquarePen, Users, BarChart3, Share2,
  ScrollText, Bell, Plus, Menu, LogOut, Check, MessageSquare, UploadCloud, Search,
} from 'lucide-react';
import { createClientBrowser } from '@/lib/supabase';
import { Logo, ThemeToggle } from '@/components/bits';

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const supabase = createClientBrowser();

  useEffect(() => {
    async function fetchNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setNotifications(data);
    }
    fetchNotifications();
  }, []);

  const iconMap = { approved: Check, comment: MessageSquare, published: UploadCloud };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid place-items-center rounded-[10px] transition-colors hover:bg-[hsl(var(--surface-3))]"
        style={{ width: 34, height: 34, color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
        aria-label="Notifications"
      >
        <Bell size={15} />
        {notifications.length > 0 && (
          <span
            className="absolute -top-1 -right-1 grid place-items-center rounded-full cf-mono text-[9px] font-bold text-white"
            style={{ width: 15, height: 15, background: 'hsl(var(--primary))', boxShadow: '0 0 0 2px hsl(var(--sidebar-background))' }}
          >
            {notifications.length}
          </span>
        )}
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
                <span className="cf-mono text-[10px] font-normal" style={{ color: 'hsl(var(--faint-foreground))' }}>{notifications.length} unread</span>
              </div>
              {notifications.length === 0 ? (
                <div className="px-3.5 py-6 text-center text-xs" style={{ color: 'hsl(var(--faint-foreground))' }}>No new notifications</div>
              ) : (
                notifications.map((n) => {
                  const Icon = iconMap[n.type] || Check;
                  return (
                    <div key={n.id} className="flex gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-[hsl(var(--surface-3)/0.5)]">
                      <span className="grid place-items-center rounded-lg shrink-0" style={{ width: 26, height: 26, color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / .12)' }}>
                        <Icon size={12} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs leading-snug">{n.message || 'Notification'}</div>
                        <div className="cf-mono text-[10px] mt-0.5" style={{ color: 'hsl(var(--faint-foreground))' }}>
                          {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarBody({ userRole, userName, onNavigate, onSignOut }) {
  const pathname = usePathname();

  const NAV = [
    {
      section: 'Main',
      items: [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { href: '/projects', label: 'Projects', icon: FolderKanban },
        ...(userRole !== 'client' ? [{ href: '/posts/new', label: 'New Post', icon: SquarePen }] : []),
      ],
    },
    {
      section: 'Manage',
      items: [
        ...(userRole !== 'client' ? [{ href: '/clients', label: 'Clients', icon: Users }] : []),
        { href: '/analytics', label: 'Analytics', icon: BarChart3 },
        ...(userRole !== 'client' ? [{ href: '/clients', label: 'Social Accounts', icon: Share2 }] : []),
      ],
    },
    ...(userRole === 'admin' ? [{
      section: 'Admin',
      items: [
        { href: '/admin/team', label: 'Team', icon: Users },
        { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
      ],
    }] : []),
  ];

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const initials = userName ? userName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : 'CF';

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
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={onNavigate}
                  className={`cf-navitem ${isActive(item) ? 'active' : ''}`}
                >
                  <item.icon size={15} />
                  {item.label}
                </Link>
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
          <div className="grid place-items-center rounded-full text-[11px] font-bold text-white shrink-0" style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)' }}>{initials}</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold truncate">{userName || 'User'}</div>
            <div className="text-[10px]" style={{ color: 'hsl(var(--faint-foreground))' }}>{userRole === 'admin' ? 'Agency Admin' : userRole === 'client' ? 'Client' : 'Team Member'}</div>
          </div>
          <button className="cf-btn-ghost cf-btn cf-btn-sm !px-1.5" title="Sign out" onClick={onSignOut}><LogOut size={13} /></button>
        </div>
      </div>
    </div>
  );
}

const MOBILE_TABS = [
  { href: '/', label: 'Home', icon: LayoutDashboard, exact: true },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/analytics', label: 'Stats', icon: BarChart3 },
];

export default function Sidebar({ onOpenNewPost }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [userRole, setUserRole] = useState('team');
  const [userName, setUserName] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientBrowser();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role, name')
          .eq('id', user.id)
          .single();
        if (profile) {
          setUserRole(profile.role || 'team');
          setUserName(profile.name || user.email || '');
        }
      }
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Desktop floating sidebar */}
      <aside
        className="hidden lg:flex fixed z-40 flex-col rounded-2xl cf-glass"
        style={{ top: 16, left: 16, bottom: 16, width: 240 }}
      >
        <SidebarBody userRole={userRole} userName={userName} onSignOut={handleSignOut} />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 cf-glass flex items-center gap-2.5 px-4 py-3" style={{ borderRadius: 0 }}>
        <Logo size={26} />
        <span className="font-bold text-[15px] tracking-tight flex-1">ContentFlow</span>
        <button className="grid place-items-center rounded-lg" style={{ width: 32, height: 32, border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }} aria-label="Search">
          <Search size={14} />
        </button>
        <NotificationBell />
      </div>

      {/* Mobile bottom nav — floating pill */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 z-40 flex items-center gap-1">
        <nav className="cf-glass rounded-2xl shadow-pop flex items-center flex-1 px-1.5 py-1.5">
          {MOBILE_TABS.filter(t => !(t.href === '/clients' && userRole === 'client')).map((t) => {
            const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-[10px] font-medium transition-colors ${active ? '' : 'opacity-60'}`}
                style={{
                  color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  background: active ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                }}
              >
                <t.icon size={17} />
                {t.label}
              </Link>
            );
          })}
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
        {userRole !== 'client' && (
          <Link
            href="/posts/new"
            className="grid place-items-center rounded-2xl text-white shrink-0 transition-transform active:scale-95"
            style={{
              width: 52, height: 52,
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--cyan)))',
              boxShadow: '0 8px 24px -6px hsl(var(--primary) / 0.6)',
            }}
            aria-label="New post"
          >
            <Plus size={22} />
          </Link>
        )}
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
              <SidebarBody userRole={userRole} userName={userName} onNavigate={() => setMoreOpen(false)} onSignOut={handleSignOut} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
