'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClientBrowser } from '@/lib/supabase';
import NotificationBell from '@/components/features/NotificationBell';
import CommandPalette from '@/components/features/CommandPalette';

const NAV_MAIN = [
  { href: '/', label: 'Dashboard', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/>
      <rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>
    </svg>
  ), exact: true },
  { href: '/projects', label: 'Projects', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )},
  { href: '/posts/new', label: 'New Post', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ), hideForClient: true },
];

const NAV_MANAGE = [
  { href: '/clients', label: 'Clients', hideForClient: true, icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )},
  { href: '/analytics', label: 'Analytics', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )},
  { href: '/automations/setup', label: 'Automations', hideForClient: true, icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/>
    </svg>
  )},
];

const NAV_ADMIN = [
  { href: '/admin/team', label: 'Team', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
      <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  )},
  { href: '/admin/audit-log', label: 'Audit Log', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )},
];

export default function Sidebar({ user, profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState('dark');
  const [cmdOpen, setCmdOpen] = useState(false);
  const supabase = createClientBrowser();

  const role = profile?.role || 'team';
  const initials = (profile?.name || user?.email || 'U').slice(0, 2).toUpperCase();

  useEffect(() => {
    const saved = localStorage.getItem('cf-theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('cf-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const isActive = (href, exact = false) =>
    exact ? pathname === href : (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const renderNavItem = ({ href, label, icon, exact, hideForClient }) => {
    if (hideForClient && role === 'client') return null;
    const active = isActive(href, exact);
    return (
      <Link
        key={href}
        href={href}
        className={`nav-item${active ? ' active' : ''}`}
      >
        <span className="nav-item-icon">{icon}</span>
        {label}
      </Link>
    );
  };

  return (
    <>
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div>
            <div className="sidebar-brand-name">ContentFlow</div>
          </div>
          <span className="sidebar-brand-tag">v2</span>
        </div>

        {/* Search / Command */}
        <button
          className="nav-item"
          style={{ marginBottom: 'var(--s-4)', color: 'var(--text-2)', background: 'var(--bg-3)', border: '1px solid var(--border-1)' }}
          onClick={() => setCmdOpen(true)}
        >
          <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span style={{ flex: 1, fontSize: 13, color: 'var(--text-3)' }}>Search...</span>
          <span style={{
            fontSize: 10, fontFamily: 'var(--font-mono)',
            background: 'var(--bg-4)', border: '1px solid var(--border-2)',
            padding: '1px 5px', borderRadius: 'var(--r-xs)', color: 'var(--text-3)'
          }}>⌘K</span>
        </button>

        {/* Main nav */}
        <div className="nav-section">
          <div className="nav-label">Main</div>
          {NAV_MAIN.map(renderNavItem)}
        </div>

        <div className="nav-section">
          <div className="nav-label">Manage</div>
          {NAV_MANAGE.map(renderNavItem)}
        </div>

        {role === 'admin' && (
          <div className="nav-section">
            <div className="nav-label">Admin</div>
            {NAV_ADMIN.map(renderNavItem)}
          </div>
        )}

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            <div className={`toggle-pill ${theme === 'dark' ? 'on' : 'off'}`}>
              <div className="toggle-knob" />
            </div>
          </button>

          <div className="divider" style={{ margin: 'var(--s-2) 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--s-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
              <div className="user-avatar">{initials}</div>
              <div className="user-info">
                <div className="user-name truncate" style={{ maxWidth: 100 }}>
                  {profile?.name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="user-role">{role}</div>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm btn-icon"
              onClick={signOut}
              title="Sign out"
              style={{ color: 'var(--text-2)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} role={role} />
    </>
  );
}
