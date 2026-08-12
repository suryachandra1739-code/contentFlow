'use client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Camera, Globe, Video, Briefcase,
  Moon, Sun,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';

/* ── Platform & Status metadata ── */
export const PLATFORM_META = {
  instagram: { label: 'Instagram', color: '#E1306C' },
  facebook: { label: 'Facebook', color: '#1877F2' },
  youtube: { label: 'YouTube', color: '#FF0033' },
  shorts: { label: 'YouTube Shorts', color: '#FF0033' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2' },
};

export const STATUS_META = {
  draft: { label: 'Draft', var: '--st-draft' },
  pending: { label: 'Pending', var: '--st-pending' },
  approved: { label: 'Approved', var: '--st-approved' },
  published: { label: 'Published', var: '--st-published' },
  revision: { label: 'Revision', var: '--st-revision' },
  rejected: { label: 'Rejected', var: '--st-rejected' },
};

/* ── Logo ── */
export function Logo({ size = 30 }) {
  return (
    <div
      className="grid place-items-center rounded-[9px] shrink-0"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, hsl(246 90% 68%), hsl(187 92% 55%))',
        boxShadow: '0 4px 14px -4px hsl(246 90% 68% / .6)',
      }}
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
        <path d="M4 17V7l8 5 8-5v10l-8-5-8 5z" fill="white" fillOpacity="0.95" />
      </svg>
    </div>
  );
}

/* ── Gradient avatar (hash-seeded) ── */
export function GradAvatar({ name, hue, size = 40 }) {
  const initials = name ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  return (
    <div
      className="grid place-items-center rounded-xl font-semibold text-white shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 75% 55%), hsl(${(hue + 60) % 360} 80% 45%))`,
      }}
    >
      {initials}
    </div>
  );
}

/* ── Platform icons & badges ── */
const PLATFORM_ICONS = {
  instagram: Camera, facebook: Globe, youtube: Video, shorts: Video, linkedin: Briefcase,
};

export function PlatformIcon({ platform, size = 14 }) {
  const Icon = PLATFORM_ICONS[platform] || Instagram;
  const meta = PLATFORM_META[platform] || PLATFORM_META.instagram;
  return <Icon size={size} style={{ color: meta.color }} />;
}

export function PlatformBadge({ platform, label = false }) {
  const meta = PLATFORM_META[platform] || PLATFORM_META.instagram;
  return (
    <span className="cf-badge" style={{ color: meta.color, background: `${meta.color}14`, borderColor: `${meta.color}30` }}>
      <PlatformIcon platform={platform} size={12} />
      {label && meta.label}
    </span>
  );
}

export function PlatformStack({ platforms }) {
  if (!platforms || !Array.isArray(platforms)) return null;
  return (
    <div className="flex -space-x-1">
      {platforms.map((p) => (
        <span
          key={p}
          className="grid place-items-center rounded-full border"
          style={{
            width: 22, height: 22,
            background: 'hsl(var(--surface-3))',
            borderColor: 'hsl(var(--border))',
          }}
          title={PLATFORM_META[p]?.label || p}
        >
          <PlatformIcon platform={p} size={11} />
        </span>
      ))}
    </div>
  );
}

/* ── Status badge ── */
export function StatusBadge({ status, pulse = false }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  return (
    <span
      className="cf-badge"
      style={{
        color: `hsl(var(${meta.var}))`,
        background: `hsl(var(${meta.var}) / 0.12)`,
        borderColor: `hsl(var(${meta.var}) / 0.28)`,
      }}
    >
      <span className="dot" style={pulse ? { animation: 'cf-pulse-dot 1.8s ease-in-out infinite' } : undefined} />
      {meta.label}
    </span>
  );
}

/* ── Stat card ── */
export function StatCard({ icon: Icon, label, value, sub, tone, progress }) {
  return (
    <div className="cf-card cf-card-hover p-4 sm:p-5 anim-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</div>
          <div className="cf-display mt-1.5 text-[26px] leading-none">{value}</div>
        </div>
        <div
          className="grid place-items-center rounded-[10px]"
          style={{ width: 34, height: 34, color: `hsl(${tone})`, background: `hsl(${tone} / 0.12)`, border: `1px solid hsl(${tone} / 0.22)` }}
        >
          <Icon size={16} />
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--surface-3))' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--cyan)))' }}
          />
        </div>
      )}
      {sub && <div className="mt-2 text-[11px]" style={{ color: 'hsl(var(--faint-foreground))' }}>{sub}</div>}
    </div>
  );
}

/* ── Modal ── */
export function Modal({ open, onClose, children, width = 520 }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'hsl(240 30% 2% / 0.6)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full cf-glass rounded-2xl shadow-pop max-h-[88vh] overflow-y-auto scrollbar-thin"
            style={{ maxWidth: width }}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.22, ease: [0.22, 0.9, 0.3, 1] }}
          >
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 z-10 grid place-items-center rounded-lg transition-colors"
              style={{ width: 28, height: 28, color: 'hsl(var(--muted-foreground))' }}
            >
              <X size={15} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Empty state ── */
export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="cf-card grid place-items-center text-center px-6 py-14 anim-fade-in">
      <div
        className="grid place-items-center rounded-2xl mb-4"
        style={{ width: 52, height: 52, background: 'hsl(var(--surface-3))', color: 'hsl(var(--faint-foreground))', border: '1px solid hsl(var(--border))' }}
      >
        <Icon size={22} />
      </div>
      <div className="font-semibold text-[15px]">{title}</div>
      <div className="mt-1 text-[13px] max-w-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{body}</div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── Theme toggle (animated switch) ── */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative rounded-full transition-colors"
      style={{ width: 44, height: 24, background: 'hsl(var(--surface-3))', border: '1px solid hsl(var(--border-strong))' }}
    >
      <motion.span
        className="absolute top-[2px] grid place-items-center rounded-full"
        style={{
          width: 18, height: 18,
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--cyan)))',
          color: 'white',
        }}
        animate={{ left: dark ? 3 : 21 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      >
        {dark ? <Moon size={10} /> : <Sun size={10} />}
      </motion.span>
    </button>
  );
}

/* ── Segmented tabs with sliding pill ── */
export function SegTabs({ options, value, onChange }) {
  return (
    <div
      className="inline-flex items-center gap-0.5 p-0.5 rounded-[10px] overflow-x-auto scrollbar-thin max-w-full"
      style={{ background: 'hsl(var(--surface-1))', border: '1px solid hsl(var(--border))' }}
    >
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} className={`cf-seg ${value === o.id ? 'active' : ''}`}>
          {value === o.id && (
            <motion.span
              layoutId="seg-pill"
              className="absolute inset-0 rounded-lg"
              style={{ background: 'hsl(var(--surface-3))', border: '1px solid hsl(var(--border-strong))' }}
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
          <span className="relative z-10">{o.label}</span>
          {o.count !== undefined && (
            <span className="relative z-10 ml-1.5 cf-mono text-[10px]" style={{ color: 'hsl(var(--faint-foreground))' }}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Page header ── */
export function PageHeader({ title, sub, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="cf-display text-[22px] sm:text-[26px] leading-tight">{title}</h1>
        {sub && <p className="mt-1 text-[13px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
