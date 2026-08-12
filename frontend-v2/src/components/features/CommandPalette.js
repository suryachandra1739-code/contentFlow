'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const ITEMS = [
  { label: 'Dashboard', href: '/', icon: '⊞', section: 'Navigate' },
  { label: 'Projects', href: '/projects', icon: '📁', section: 'Navigate' },
  { label: 'Create New Post', href: '/posts/new', icon: '✏️', section: 'Navigate' },
  { label: 'Clients', href: '/clients', icon: '👥', section: 'Navigate' },
  { label: 'Analytics', href: '/analytics', icon: '📊', section: 'Navigate' },
  { label: 'Automations', href: '/automations/setup', icon: '⚡', section: 'Navigate' },
  { label: 'Team Members', href: '/admin/team', icon: '🛡️', section: 'Admin' },
  { label: 'Audit Log', href: '/admin/audit-log', icon: '📋', section: 'Admin' },
];

export default function CommandPalette({ open, onClose, role }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = ITEMS.filter(item => {
    if (role === 'client' && ['Create New Post','Clients','Automations','Team Members','Audit Log'].includes(item.label)) return false;
    if (role !== 'admin' && item.section === 'Admin') return false;
    return item.label.toLowerCase().includes(query.toLowerCase());
  });

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) {
      router.push(filtered[selected].href);
      onClose();
    }
    if (e.key === 'Escape') onClose();
  };

  if (!open) return null;

  const sections = [...new Set(filtered.map(i => i.section))];

  return (
    <div className="cmd-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmd-palette" onKeyDown={handleKey}>
        <div className="cmd-input-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Jump to..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
          />
          <span style={{
            fontSize: 11, fontFamily: 'var(--font-mono)',
            background: 'var(--bg-4)', border: '1px solid var(--border-2)',
            padding: '2px 7px', borderRadius: 'var(--r-xs)', color: 'var(--text-3)'
          }}>ESC</span>
        </div>
        <div className="cmd-results">
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--s-8)', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
              No results for "{query}"
            </div>
          )}
          {sections.map(sec => {
            const items = filtered.filter(i => i.section === sec);
            if (!items.length) return null;
            let globalIdx = 0;
            return (
              <div key={sec}>
                <div className="cmd-section-label">{sec}</div>
                {items.map((item) => {
                  const idx = filtered.indexOf(item);
                  return (
                    <div
                      key={item.href}
                      className={`cmd-item${idx === selected ? ' selected' : ''}`}
                      onClick={() => { router.push(item.href); onClose(); }}
                      onMouseEnter={() => setSelected(idx)}
                    >
                      <div className="cmd-item-icon">
                        <span style={{ fontSize: 14 }}>{item.icon}</span>
                      </div>
                      <div className="cmd-item-text">
                        <div className="cmd-item-name">{item.label}</div>
                      </div>
                      {idx === selected && (
                        <span className="cmd-item-kbd">↵</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="cmd-footer">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}
