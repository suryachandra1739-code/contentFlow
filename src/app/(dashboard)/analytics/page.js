'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileStack, Percent, Hourglass, Flame } from 'lucide-react';
import { StatCard, PageHeader, PLATFORM_META } from '@/components/bits';

const STATUS_COLORS = {
  draft: 'hsl(var(--st-draft))',
  pending: 'hsl(var(--st-pending))',
  approved: 'hsl(var(--st-approved))',
  published: 'hsl(var(--st-published))',
  revision: 'hsl(var(--st-revision))',
  rejected: 'hsl(var(--st-rejected))',
};

function HBar({ label, value, max, color, delay }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 sm:w-24 text-xs text-right shrink-0 capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
      <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ background: 'hsl(var(--surface-1))' }}>
        <motion.div
          className="h-full rounded-lg"
          style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.9, delay, ease: [0.22, 0.9, 0.3, 1] }}
        />
      </div>
      <span className="cf-mono text-xs w-8 shrink-0" style={{ color: 'hsl(var(--faint-foreground))' }}>{value}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/analytics').then(r => r.json()).then(setData); }, []);

  if (!data) {
    return (
      <div>
        <PageHeader title="Analytics" sub="Loading insights..." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="cf-card p-5"><div className="cf-skeleton h-7 w-16 mb-3" /><div className="cf-skeleton h-4 w-24" /></div>)}
        </div>
      </div>
    );
  }

  const maxStatus = Math.max(...Object.values(data.byStatus || {}), 1);
  const maxPlatform = Math.max(...Object.values(data.byPlatform || {}), 1);
  const needAttention = (data.byStatus?.revision || 0) + (data.byStatus?.rejected || 0);

  return (
    <div>
      <PageHeader title="Analytics" sub="Approval velocity and workload across every workspace." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger mb-6">
        <StatCard icon={FileStack} label="Total posts" value={String(data.total)} tone="246 90% 68%" />
        <StatCard icon={Percent} label="Approval rate" value={`${data.approvalRate}%`} tone="160 84% 45%" />
        <StatCard icon={Hourglass} label="Awaiting review" value={String(data.byStatus?.pending || 0)} tone="38 96% 60%" />
        <StatCard icon={Flame} label="Need attention" value={String(needAttention)} sub="revision + rejected" tone="0 84% 64%" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="cf-card p-5 anim-fade-up">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-[15px]">Posts by status</h2>
            <span className="cf-mono text-[10px]" style={{ color: 'hsl(var(--faint-foreground))' }}>ALL TIME</span>
          </div>
          <div className="space-y-3.5">
            {Object.entries(data.byStatus || {}).map(([status, count], i) => (
              <HBar key={status} label={status} value={count} max={maxStatus} color={STATUS_COLORS[status] || 'hsl(var(--muted-foreground))'} delay={i * 0.08} />
            ))}
          </div>
        </section>

        <section className="cf-card p-5 anim-fade-up" style={{ animationDelay: '.08s' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-[15px]">Posts by platform</h2>
            <span className="cf-mono text-[10px]" style={{ color: 'hsl(var(--faint-foreground))' }}>ALL TIME</span>
          </div>
          <div className="space-y-3.5">
            {Object.entries(data.byPlatform || {}).map(([platform, count], i) => (
              <HBar
                key={platform}
                label={platform}
                value={count}
                max={maxPlatform}
                color={PLATFORM_META[platform]?.color || 'hsl(var(--primary))'}
                delay={i * 0.08}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
