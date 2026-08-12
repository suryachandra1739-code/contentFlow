import { motion } from 'framer-motion'
import { FileStack, Percent, Hourglass, Flame } from 'lucide-react'
import { POSTS } from '@/lib/data'
import { StatCard, PageHeader } from '@/components/bits'

const byStatus = [
  { label: 'Draft', value: 12, tone: '--st-draft' },
  { label: 'Pending', value: 5, tone: '--st-pending' },
  { label: 'Approved', value: 43, tone: '--st-approved' },
  { label: 'Revision', value: 7, tone: '--st-revision' },
  { label: 'Rejected', value: 3, tone: '--st-rejected' },
]

const byPlatform = [
  { label: 'Instagram', value: 52, color: '#E1306C' },
  { label: 'Facebook', value: 31, color: '#1877F2' },
  { label: 'Shorts', value: 24, color: '#FF0033' },
  { label: 'LinkedIn', value: 15, color: '#0A66C2' },
  { label: 'YouTube', value: 6, color: '#FF0033' },
]

function HBar({ label, value, max, color, delay }: { label: string; value: number; max: number; color: string; delay: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 sm:w-24 text-xs text-right shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
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
  )
}

export default function Analytics() {
  const total = POSTS.length * 10 + 8 // display-scale mock
  return (
    <div>
      <PageHeader title="Analytics" sub="Approval velocity and workload across every workspace." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger mb-6">
        <StatCard icon={FileStack} label="Total posts" value={String(total)} sub="+14 this month" tone="246 90% 68%" />
        <StatCard icon={Percent} label="Approval rate" value="86%" sub="+4 pts vs July" tone="160 84% 45%" />
        <StatCard icon={Hourglass} label="Awaiting review" value="5" sub="median wait 9.2h" tone="38 96% 60%" />
        <StatCard icon={Flame} label="Need attention" value="3" sub="revision requested" tone="0 84% 64%" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="cf-card p-5 anim-fade-up">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-[15px]">Posts by status</h2>
            <span className="cf-mono text-[10px]" style={{ color: 'hsl(var(--faint-foreground))' }}>LAST 90 DAYS</span>
          </div>
          <div className="space-y-3.5">
            {byStatus.map((s, i) => (
              <HBar key={s.label} label={s.label} value={s.value} max={43} color={`hsl(var(${s.tone}))`} delay={i * 0.08} />
            ))}
          </div>
        </section>

        <section className="cf-card p-5 anim-fade-up" style={{ animationDelay: '.08s' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-[15px]">Posts by platform</h2>
            <span className="cf-mono text-[10px]" style={{ color: 'hsl(var(--faint-foreground))' }}>LAST 90 DAYS</span>
          </div>
          <div className="space-y-3.5">
            {byPlatform.map((s, i) => (
              <HBar key={s.label} label={s.label} value={s.value} max={52} color={s.color} delay={i * 0.08} />
            ))}
          </div>
        </section>
      </div>

      {/* insight strip */}
      <motion.section
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="cf-card mt-4 p-5 flex flex-wrap items-center gap-4"
        style={{ background: 'linear-gradient(120deg, hsl(var(--primary) / .08), hsl(var(--cyan) / .05))', border: '1px solid hsl(var(--primary) / .25)' }}
      >
        <div className="grid place-items-center rounded-xl shrink-0" style={{ width: 40, height: 40, background: 'hsl(var(--primary) / .16)', color: 'hsl(var(--primary))' }}>
          <Percent size={18} />
        </div>
        <div className="flex-1 min-w-[220px]">
          <div className="text-[13px] font-semibold">Lumen Athletics approves 3.2× faster than average</div>
          <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Median time-to-approval is 2.1h for Lumen vs 6.8h across all clients. Consider them for same-day publish SLAs.
          </div>
        </div>
      </motion.section>
    </div>
  )
}
