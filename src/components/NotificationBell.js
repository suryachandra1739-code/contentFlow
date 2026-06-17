'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClientBrowser } from '@/lib/supabase';

export default function NotificationBell({ role = 'team' }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const supabase = createClientBrowser();

  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    getSession();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (Array.isArray(data)) {
        // Filter out comments made by the current user
        const othersComments = data.filter(c => c.user_id !== userId);
        setNotifications(othersComments);

        // Calculate unread count using localStorage timestamp
        const lastRead = localStorage.getItem(`cf-notif-read-${role}`) || '0';
        const unread = othersComments.filter(c => new Date(c.created_at).getTime() > Number(lastRead));
        setUnreadCount(unread.length);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (userId) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 15000); // Poll every 15 seconds
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Mark all as read
      const now = Date.now().toString();
      localStorage.setItem(`cf-notif-read-${role}`, now);
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = (postId) => {
    setIsOpen(false);
    router.push(`/posts/${postId}`);
  };

  const parseCaption = (captionText) => {
    if (!captionText) return { title: 'Untitled Post' };
    const titleMatch = captionText.match(/Title:\s*(.*)/i);
    if (titleMatch && titleMatch[1]) {
      return { title: titleMatch[1].trim() };
    }
    return { title: captionText.split('\n')[0].substring(0, 40) || 'Untitled Post' };
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          position: 'relative',
          transition: 'all 0.2s',
        }}
        className="nav-btn-hover"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            background: 'var(--red)',
            borderRadius: '50%',
            boxShadow: '0 0 8px var(--red)',
            animation: 'pulse 1.5s infinite'
          }} />
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: role === 'client' ? 0 : 'auto',
          left: role === 'client' ? 'auto' : 0,
          marginTop: 8,
          width: 320,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          zIndex: 9999,
          overflow: 'hidden'
        }} className="fade-in">
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--text-primary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Notifications</span>
            {unreadCount > 0 && <span style={{ fontSize: 11, background: 'var(--red-soft)', color: 'var(--red)', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>{unreadCount} new</span>}
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                🔔 No new messages or changes
              </div>
            ) : (
              notifications.map((notif) => {
                const parsed = parseCaption(notif.posts?.caption);
                return (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.post_id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-hover)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'start'
                    }}
                    className="notif-item-hover"
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: notif.users?.role === 'client' ? 'var(--amber-soft)' : 'var(--accent-soft)',
                      color: notif.users?.role === 'client' ? 'var(--amber)' : 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {(notif.users?.name || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        <strong>{notif.users?.name || 'Someone'}</strong> commented on <strong>{parsed.title}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        "{notif.content}"
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--mono)' }}>
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
