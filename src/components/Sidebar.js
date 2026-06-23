'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClientBrowser } from '@/lib/supabase';
import NotificationBell from './NotificationBell';

import ClaudeLogo from './ClaudeLogo';

export default function Sidebar({ onOpenNewPost }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [userRole, setUserRole] = useState('team');
  const supabase = createClientBrowser();

  useEffect(() => {
    const savedTheme = localStorage.getItem('contentflow-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.classList.toggle('light', savedTheme === 'light');

    async function getRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role) {
          setUserRole(profile.role);
        }
      }
    }
    getRole();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('contentflow-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.body.classList.toggle('light', nextTheme === 'light');
  };

  const isActive = (path) => pathname === path || (path !== '/' && pathname.startsWith(path));

  const closeSidebar = () => setIsOpen(false);

  // Derive page title from pathname for the mobile header
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/projects')) return 'Projects';
    if (pathname.startsWith('/posts/new')) return 'New Post';
    if (pathname.startsWith('/posts')) return 'Post';
    if (pathname.startsWith('/clients')) return 'Clients';
    if (pathname.startsWith('/analytics')) return 'Analytics';
    if (pathname.startsWith('/admin/team')) return 'Team';
    if (pathname.startsWith('/admin/audit-log')) return 'Audit Log';
    if (pathname.startsWith('/automations/setup')) return 'Setup Guide';
    if (pathname.startsWith('/automations')) return 'Automations';
    return 'ContentFlow';
  };

  return (
    <>
      {/* Mobile Header Bar — full-width frosted bar with logo + title + notification bell */}
      <div className="mobile-toggle-btn">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ClaudeLogo size={28} />
          <span className="mobile-header-title" style={{ fontWeight: 700, letterSpacing: '-0.2px' }}>ContentFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          <NotificationBell role="team" />
        </div>
      </div>

      {/* Glassmorphic Mobile Backdrop Overlay */}
      {isOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

      {/* Floating Bottom Nav Bar for Mobile */}
      <div className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-pill">
          <Link href="/" className={`mobile-bottom-nav-item ${pathname === '/' ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <span>Overview</span>
          </Link>
          
          <Link href="/projects" className={`mobile-bottom-nav-item ${pathname.startsWith('/projects') ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Projects</span>
          </Link>

          {userRole !== 'client' && (
            <Link href="/clients" className={`mobile-bottom-nav-item ${pathname.startsWith('/clients') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <span>Clients</span>
            </Link>
          )}

          <button onClick={() => setIsOpen(true)} className={`mobile-bottom-nav-item ${isOpen ? 'active' : ''}`} style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
              <circle cx="5" cy="12" r="1.5" />
            </svg>
            <span>More</span>
          </button>
        </div>

        {userRole !== 'client' && (
          <Link 
            href="/posts/new" 
            className="mobile-bottom-fab"
            onClick={(e) => {
              if (onOpenNewPost && window.innerWidth <= 768) {
                e.preventDefault();
                onOpenNewPost();
              }
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Link>
        )}
      </div>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
        {/* Close button — positioned top-right inside sidebar, separate from logo */}
        <button
          className="sidebar-close-btn"
          onClick={closeSidebar}
          aria-label="Close navigation menu"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ClaudeLogo size={36} />
            <div>
              <h1>ContentFlow</h1>
              <span>Approval Platform</span>
            </div>
          </div>
          <div className="hide-on-mobile">
            <NotificationBell role="team" />
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">Main</div>
          <Link href="/" onClick={closeSidebar} className={`nav-item ${isActive('/') && pathname === '/' ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            Dashboard
          </Link>
          <Link href="/projects" onClick={closeSidebar} className={`nav-item ${isActive('/projects') ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
            Projects
          </Link>
          {userRole !== 'client' && (
            <Link href="/posts/new" onClick={closeSidebar} className={`nav-item ${isActive('/posts/new') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
              New Post
            </Link>
          )}

          <div className="sidebar-section">Manage</div>
          {userRole !== 'client' && (
            <Link href="/clients" onClick={closeSidebar} className={`nav-item ${isActive('/clients') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              Clients
            </Link>
          )}
          <Link href="/analytics" onClick={closeSidebar} className={`nav-item ${isActive('/analytics') ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
            Analytics
          </Link>


          {userRole === 'admin' && (
            <>
              <div className="sidebar-section">Admin</div>
              <Link href="/admin/team" onClick={closeSidebar} className={`nav-item ${isActive('/admin/team') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                Team
              </Link>
              <Link href="/admin/audit-log" onClick={closeSidebar} className={`nav-item ${isActive('/admin/audit-log') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                Audit Log
              </Link>
            </>
          )}

          <div
            className="nav-item"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onClick={toggleTheme}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
              <span>Dark Mode</span>
            </div>
            <div style={{
              width: 32,
              height: 18,
              borderRadius: 99,
              background: theme === 'dark' ? 'var(--accent)' : 'rgba(120, 120, 128, 0.32)',
              position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0
            }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: 3,
                left: theme === 'dark' ? 17 : 3,
                transition: 'left 0.2s',
              }} />
            </div>
          </div>

          <div
            className="nav-item"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, color: 'var(--text-muted)' }}
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Sign Out</span>
          </div>
        </nav>
      </aside>
    </>
  );
}
