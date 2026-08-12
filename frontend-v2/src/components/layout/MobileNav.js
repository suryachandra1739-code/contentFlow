'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Home', exact: true, icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { href: '/projects', label: 'Projects', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )},
  { href: '/posts/new', label: 'New Post', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )},
  { href: '/analytics', label: 'Analytics', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )},
];

export default function MobileNav({ role }) {
  const pathname = usePathname();
  const isActive = (href, exact) =>
    exact ? pathname === href : (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const items = role === 'client'
    ? NAV.filter(n => n.label !== 'New Post')
    : NAV;

  return (
    <nav className="mobile-nav mobile-only">
      {items.map(({ href, label, icon, exact }) => (
        <Link
          key={href}
          href={href}
          className={`mobile-nav-item${isActive(href, exact) ? ' active' : ''}`}
        >
          {icon}
          {label}
        </Link>
      ))}
    </nav>
  );
}
