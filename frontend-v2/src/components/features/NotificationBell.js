'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function NotificationBell({ role = 'team' }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data.slice(0, 8));
          setUnread(data.filter(n => !n.read).length);
        }
      }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="notif-btn" onClick={() => setOpen(o => !o)} aria-label="Notifications">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && <span className="notif-dot" />}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span style={{ fontSize: 14, fontWeight: 700 }}>Notifications</span>
            {unread > 0 && (
              <span className="badge badge-pending" style={{ fontSize: 11 }}>{unread} new</span>
            )}
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 'var(--s-6)', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                No notifications yet
              </div>
            ) : notifications.map((n, i) => (
              <Link
                key={n.id || i}
                href={n.post_id ? `/posts/${n.post_id}` : '#'}
                style={{ display: 'block', textDecoration: 'none' }}
                onClick={() => setOpen(false)}
              >
                <div style={{
                  display: 'flex', gap: 'var(--s-3)', padding: 'var(--s-3) var(--s-4)',
                  borderBottom: '1px solid var(--border-0)',
                  transition: 'background var(--dur-fast)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--accent-subtle)',
                    border: '1px solid var(--accent-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, flexShrink: 0,
                  }}>💬</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-0)', lineHeight: 1.4, marginBottom: 2 }}>
                      <strong style={{ fontWeight: 600 }}>
                        {n.author_name || n.user_email?.split('@')[0] || 'Someone'}
                      </strong> commented on a post
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
