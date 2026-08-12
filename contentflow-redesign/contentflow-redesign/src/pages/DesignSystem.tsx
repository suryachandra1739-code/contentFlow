import { useState } from 'react'
import {
  Check, Copy, Plus, Search, Bell, ChevronDown, Trash2, Send, Inbox, AlertTriangle,
  Instagram, Facebook, Youtube, Linkedin, Loader2,
} from 'lucide-react'
import { Modal, StatusBadge, PlatformBadge, GradAvatar, ThemeToggle, EmptyState } from '@/components/bits'
import { useTheme } from '@/lib/theme'

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="cf-card p-6 anim-fade-up">
      <h2 className="font-semibold text-[15px]">{title}</h2>
      {note && <p className="text-xs mt-1 mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>{note}</p>}
      {!note && <div className="mb-4" />}
      {children}
    </section>
  )
}

const SWATCHES = [
  ['--background', 'Background'], ['--surface-1', 'Surface 1'], ['--surface-2', 'Surface 2 · card'], ['--surface-3', 'Surface 3 · hover'],
  ['--foreground', 'Text primary'], ['--muted-foreground', 'Text secondary'], ['--faint-foreground', 'Text faint'],
  ['--primary', 'Primary · iris'], ['--cyan', 'Cyan accent'],
  ['--st-pending', 'Pending'], ['--st-approved', 'Approved'], ['--st-published', 'Published'],
  ['--st-revision', 'Revision'], ['--st-rejected', 'Rejected'], ['--st-draft', 'Draft'],
  ['--border', 'Border'], ['--border-strong', 'Border strong'],
]

export default function DesignSystem() {
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const { theme } = useTheme()

  const fireToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200) }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
        <div>
          <h1 className="cf-display text-[26px]">Design system <span className="cf-gradient-text">Meridian</span></h1>
          <p className="text-[13px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            ContentFlow's component language — dark-first, 4px grid, Outfit + Space Mono. Viewing: <strong className="cf-mono">{theme}</strong> mode.
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Color */}
      <Section title="Color palette" note="All tokens are CSS custom properties — swap .dark/.light classes to theme the entire app.">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SWATCHES.map(([v, label]) => (
            <div key={v} className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
              <div className="h-12" style={{ background: `hsl(var(${v}))` }} />
              <div className="px-2.5 py-2" style={{ background: 'hsl(var(--surface-1))' }}>
                <div className="text-[11px] font-medium truncate">{label}</div>
                <div className="cf-mono text-[9px]" style={{ color: 'hsl(var(--faint-foreground))' }}>{v}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography scale" note="Outfit for UI & display · Space Mono for data, timers and metadata.">
        <div className="space-y-3">
          {[
            ['Display / 26 · 700 · -0.03em', 'cf-display text-[26px]', 'Approvals, beautifully boring'],
            ['Title / 20 · 700', 'cf-display text-[20px]', 'Q3 Product Launch'],
            ['Body / 13 · 400', 'text-[13px]', 'The quick brown fox approves the post before noon.'],
            ['Caption / 12 · 500', 'text-xs font-medium', 'Secondary information and labels'],
            ['Mono / 11 · 400', 'cf-mono text-[11px]', 'AUTO-DELETES IN 6D 4H · 12:04 UTC'],
          ].map(([label, cls, sample]) => (
            <div key={label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 pb-3" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              <span className="cf-mono text-[10px] w-56 shrink-0" style={{ color: 'hsl(var(--faint-foreground))' }}>{label}</span>
              <span className={cls}>{sample}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons" note="Primary (gradient glow) · Secondary · Ghost · Danger — sm / md / lg.">
        <div className="flex flex-wrap items-center gap-2.5">
          <button className="cf-btn cf-btn-primary"><Plus size={14} /> Primary</button>
          <button className="cf-btn cf-btn-secondary">Secondary</button>
          <button className="cf-btn cf-btn-ghost">Ghost</button>
          <button className="cf-btn cf-btn-danger"><Trash2 size={14} /> Danger</button>
          <button className="cf-btn cf-btn-primary" disabled><Loader2 size={14} className="animate-spin" /> Loading</button>
          <button className="cf-btn cf-btn-primary cf-btn-sm">Small</button>
          <button className="cf-btn cf-btn-primary cf-btn-lg"><Send size={15} /> Large</button>
        </div>
      </Section>

      {/* Inputs */}
      <Section title="Inputs" note="1px border → primary ring on focus (3px soft halo).">
        <div className="grid sm:grid-cols-2 gap-3 max-w-xl">
          <input className="cf-input" placeholder="Default input" />
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--faint-foreground))' }} />
            <input className="cf-input" style={{ paddingLeft: 32 }} placeholder="Icon-prefixed" />
          </div>
          <textarea className="cf-input" rows={3} placeholder="Textarea" />
          <div className="relative">
            <select className="cf-input appearance-none cursor-pointer">
              <option>Dropdown select</option><option>Option two</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'hsl(var(--faint-foreground))' }} />
          </div>
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badges" note="Status pills carry a 5px dot; pending pulses. Platform badges use brand hues at 8–14% alpha.">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="pending" pulse /><StatusBadge status="approved" /><StatusBadge status="published" />
          <StatusBadge status="draft" /><StatusBadge status="revision" /><StatusBadge status="rejected" />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <PlatformBadge platform="instagram" label /><PlatformBadge platform="facebook" label />
          <PlatformBadge platform="youtube" label /><PlatformBadge platform="linkedin" label />
        </div>
      </Section>

      {/* Cards + avatars */}
      <Section title="Cards & avatars" note="Cards lift 2px on hover with a strengthened border; avatars hash-seed their gradient from the company name.">
        <div className="flex flex-wrap items-center gap-4">
          <div className="cf-card cf-card-hover p-4 w-44">
            <div className="text-xs font-semibold">Hover card</div>
            <div className="cf-mono text-[10px] mt-1" style={{ color: 'hsl(var(--faint-foreground))' }}>translateY(-2px)</div>
          </div>
          <div className="flex items-center gap-2.5">
            <GradAvatar name="Lumen Athletics" hue={262} />
            <GradAvatar name="Northwind Coffee" hue={24} />
            <GradAvatar name="Halcyon Skincare" hue={187} />
            <GradAvatar name="Studio Kessler" hue={320} />
          </div>
        </div>
      </Section>

      {/* Feedback */}
      <Section title="Modals, toasts & skeletons" note="Modals scale in from 96% with a blurred scrim; toasts slide up bottom-right.">
        <div className="flex flex-wrap gap-2.5">
          <button className="cf-btn cf-btn-secondary" onClick={() => setModalOpen(true)}>Open modal</button>
          <button className="cf-btn cf-btn-secondary" onClick={() => fireToast('Invite sent to maya@lumenathletics.co')}>Success toast</button>
          <button className="cf-btn cf-btn-secondary" onClick={() => fireToast('Email delivery failed — copy link instead')}>Error toast</button>
        </div>
        <div className="space-y-2 mt-4 max-w-sm">
          <div className="cf-skeleton h-4 w-3/4" />
          <div className="cf-skeleton h-4 w-1/2" />
          <div className="cf-skeleton h-4 w-2/3" />
        </div>
      </Section>

      {/* Empty & error states */}
      <Section title="Empty & error states">
        <div className="grid sm:grid-cols-2 gap-4">
          <EmptyState icon={Inbox} title="Nothing pending" body="When clients finish reviewing, their queue looks like this." />
          <EmptyState icon={AlertTriangle} title="Couldn't load posts" body="Check your connection — we'll retry automatically in 30s." action={<button className="cf-btn cf-btn-secondary cf-btn-sm">Retry now</button>} />
        </div>
      </Section>

      {/* Icons + motion */}
      <Section title="Icons & motion" note="Lucide at 14–16px, 1.5px stroke. Easing: cubic-bezier(.22,.9,.3,1); 150–250ms micro, 400ms page transitions; stagger 50ms per item.">
        <div className="flex flex-wrap gap-4 items-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {[Search, Bell, Plus, Check, Send, Trash2, Instagram, Facebook, Youtube, Linkedin].map((I, i) => (
            <I key={i} size={16} />
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 cf-mono text-[10px]" style={{ color: 'hsl(var(--faint-foreground))' }}>
          <Copy size={11} /> spacing: 4px grid · radius 12px cards / 10px controls · shadows via --shadow-card / --shadow-pop
        </div>
      </Section>

      {/* demo modal + toast */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} width={420}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--cyan)))' }} />
        <div className="p-6">
          <h3 className="cf-display text-lg">Modal spec</h3>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Glass surface (--popover @ 72% + 16px blur), 16px radius, gradient accent bar for branded flows,
            scale .96 → 1 with 220ms spring-out easing. Scrim: 60% black + 6px blur.
          </p>
          <button className="cf-btn cf-btn-primary w-full mt-5" onClick={() => setModalOpen(false)}><Check size={14} /> Got it</button>
        </div>
      </Modal>

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 cf-glass rounded-xl shadow-pop px-4 py-3 flex items-center gap-2.5 anim-scale-in"
          style={{ maxWidth: 320 }}
        >
          <Check size={15} style={{ color: 'hsl(var(--st-approved))' }} />
          <span className="text-xs font-medium">{toast}</span>
        </div>
      )}
    </div>
  )
}
