import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Check, UploadCloud, Instagram, Facebook, Youtube, Linkedin, Send, Hash,
} from 'lucide-react'
import { CLIENTS, type Platform } from '@/lib/data'
import { GradAvatar, PageHeader } from '@/components/bits'
import PlatformPreview, { type Aspect } from '@/components/PlatformPreview'

const PLATFORMS: { id: Platform; label: string; icon: typeof Instagram; color: string }[] = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: '#1877F2' },
  { id: 'youtube', label: 'YouTube Shorts', icon: Youtube, color: '#FF0033' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
]

const PROJECTS: Record<string, string[]> = {
  c1: ['Q3 Product Launch', 'Community', 'Always-On Content'],
  c2: ['Video Series', 'Seasonal Menu'],
  c3: ['Always-On Content', 'Education'],
  c4: ['Community', 'Education'],
  c5: ['Thought Leadership', 'PR & Comms'],
  c6: ['Brand Awareness'],
}

const ASPECTS: { id: Aspect; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: '1:1', label: 'Square 1:1' },
  { id: '9:16', label: 'Portrait 9:16' },
  { id: '16:9', label: 'Landscape 16:9' },
]

export default function NewPost() {
  const [step, setStep] = useState(1)
  const [clientId, setClientId] = useState<string | null>(null)
  const [project, setProject] = useState<string | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>(['instagram'])
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [tags, setTags] = useState('')
  const [aspect, setAspect] = useState<Aspect>('original')
  const [uploaded, setUploaded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const client = CLIENTS.find((c) => c.id === clientId)
  const projects = useMemo(() => (clientId ? PROJECTS[clientId] ?? [] : []), [clientId])

  const fakeUpload = () => {
    if (uploaded) return
    setProgress(0)
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(t); setUploaded(true); return 100 }
        return p + 4
      })
    }, 60)
  }

  const togglePlatform = (p: Platform) =>
    setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto pt-16 text-center">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="mx-auto grid place-items-center rounded-full"
          style={{ width: 64, height: 64, background: 'hsl(var(--st-approved) / .14)', border: '1px solid hsl(var(--st-approved) / .4)', color: 'hsl(var(--st-approved))' }}
        >
          <Check size={28} />
        </motion.div>
        <h1 className="cf-display text-2xl mt-5">Post sent for review</h1>
        <p className="text-[13px] mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
          “{title || 'Untitled post'}” is now pending approval from {client?.company}. They'll get a notification in their portal.
        </p>
        <div className="flex gap-2 justify-center mt-6">
          <button className="cf-btn cf-btn-secondary" onClick={() => navigate('/')}>Back to dashboard</button>
          <button className="cf-btn cf-btn-primary" onClick={() => navigate('/posts/p1')}>View post</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Create post" sub="Draft content, attach media, and route it to a client for approval." />

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-7">
        {['Client & project', 'Content & media', 'Preview & submit'].map((label, i) => {
          const n = i + 1
          const active = step === n
          const done = step > n
          return (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <span
                className="grid place-items-center rounded-full text-[11px] font-bold shrink-0 transition-all"
                style={{
                  width: 24, height: 24,
                  background: done ? 'hsl(var(--st-approved))' : active ? 'hsl(var(--primary))' : 'hsl(var(--surface-3))',
                  color: done || active ? 'white' : 'hsl(var(--faint-foreground))',
                  boxShadow: active ? '0 0 0 4px hsl(var(--primary) / .2)' : 'none',
                }}
              >
                {done ? <Check size={12} /> : n}
              </span>
              <span className={`text-xs font-medium hidden sm:block ${active ? '' : 'opacity-50'}`}>{label}</span>
              {i < 2 && <div className="flex-1 h-px mx-2" style={{ background: done ? 'hsl(var(--st-approved) / .5)' : 'hsl(var(--border))' }} />}
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ------- form column ------- */}
        <div className="cf-card p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="space-y-5">
                <div>
                  <span className="block text-xs font-semibold mb-2">Client</span>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {CLIENTS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setClientId(c.id); setProject(null) }}
                        className="flex items-center gap-2.5 rounded-xl p-2.5 text-left transition-all"
                        style={{
                          border: `1px solid ${clientId === c.id ? 'hsl(var(--primary) / .6)' : 'hsl(var(--border))'}`,
                          background: clientId === c.id ? 'hsl(var(--primary) / .1)' : 'hsl(var(--surface-1))',
                          boxShadow: clientId === c.id ? '0 0 0 3px hsl(var(--primary) / .12)' : 'none',
                        }}
                      >
                        <GradAvatar name={c.company} hue={c.hue} size={28} />
                        <span className="text-xs font-medium truncate">{c.company}</span>
                        {clientId === c.id && <Check size={13} className="ml-auto shrink-0" style={{ color: 'hsl(var(--primary))' }} />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-semibold mb-2">Project</span>
                  {!clientId ? (
                    <p className="text-xs py-3 px-3.5 rounded-xl" style={{ color: 'hsl(var(--faint-foreground))', background: 'hsl(var(--surface-1))', border: '1px dashed hsl(var(--border-strong))' }}>
                      Select a client first — projects load per workspace.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {projects.map((p) => (
                        <button
                          key={p}
                          onClick={() => setProject(p)}
                          className="cf-btn cf-btn-sm transition-all"
                          style={
                            project === p
                              ? { background: 'hsl(var(--primary) / .14)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / .4)' }
                              : { background: 'hsl(var(--surface-1))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }
                          }
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <button className="cf-btn cf-btn-primary" disabled={!clientId || !project} onClick={() => setStep(2)}>
                    Continue <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="space-y-5">
                <div>
                  <span className="block text-xs font-semibold mb-2">Platforms</span>
                  <div className="grid grid-cols-2 gap-2">
                    {PLATFORMS.map((p) => {
                      const on = platforms.includes(p.id)
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePlatform(p.id)}
                          className="flex items-center gap-2.5 rounded-xl p-3 transition-all"
                          style={{
                            border: `1px solid ${on ? p.color + '66' : 'hsl(var(--border))'}`,
                            background: on ? p.color + '14' : 'hsl(var(--surface-1))',
                          }}
                        >
                          <p.icon size={16} style={{ color: p.color }} />
                          <span className="text-xs font-medium">{p.label}</span>
                          <span
                            className="ml-auto w-4 h-4 rounded-full grid place-items-center transition-all"
                            style={{ background: on ? p.color : 'transparent', border: `1.5px solid ${on ? p.color : 'hsl(var(--border-strong))'}` }}
                          >
                            {on && <Check size={10} className="text-white" />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <label className="block">
                  <span className="block text-xs font-semibold mb-1.5">Post title</span>
                  <input className="cf-input" placeholder="Internal title — clients never see this" value={title} onChange={(e) => setTitle(e.target.value)} />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold mb-1.5">Caption</span>
                  <textarea className="cf-input" rows={4} placeholder="Write the caption…" value={caption} onChange={(e) => setCaption(e.target.value)} />
                  <span className="cf-mono text-[10px] mt-1 block text-right" style={{ color: 'hsl(var(--faint-foreground))' }}>{caption.length} / 2,200</span>
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold mb-1.5">Hashtags</span>
                  <div className="relative">
                    <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--faint-foreground))' }} />
                    <input className="cf-input" style={{ paddingLeft: 34 }} placeholder="#launch #newdrop" value={tags} onChange={(e) => setTags(e.target.value)} />
                  </div>
                </label>

                {/* media upload */}
                <div>
                  <span className="block text-xs font-semibold mb-1.5">Media</span>
                  {uploaded ? (
                    <div className="flex items-center gap-3 rounded-xl p-3" style={{ border: '1px solid hsl(var(--st-approved) / .35)', background: 'hsl(var(--st-approved) / .07)' }}>
                      <Check size={16} style={{ color: 'hsl(var(--st-approved))' }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">atlas-teaser-hero.mp4</div>
                        <div className="cf-mono text-[10px]" style={{ color: 'hsl(var(--faint-foreground))' }}>84.2 MB · uploaded to R2</div>
                      </div>
                      <button className="cf-btn cf-btn-ghost cf-btn-sm" onClick={() => { setUploaded(false); setProgress(0) }}>Replace</button>
                    </div>
                  ) : progress > 0 ? (
                    <div className="rounded-xl p-4" style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--surface-1))' }}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="font-medium">atlas-teaser-hero.mp4</span>
                        <span className="cf-mono" style={{ color: 'hsl(var(--primary))' }}>{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--surface-3))' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--cyan)))' }} />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={fakeUpload}
                      className="w-full rounded-xl grid place-items-center py-8 transition-all hover:border-[hsl(var(--primary)/.5)]"
                      style={{ border: '1.5px dashed hsl(var(--border-strong))', background: 'hsl(var(--surface-1))' }}
                    >
                      <UploadCloud size={20} style={{ color: 'hsl(var(--primary))' }} />
                      <span className="text-xs font-medium mt-2">Drop media or <span style={{ color: 'hsl(var(--primary))' }}>browse files</span></span>
                      <span className="cf-mono text-[10px] mt-1" style={{ color: 'hsl(var(--faint-foreground))' }}>images & video · up to 500 MB · direct-to-R2</span>
                    </button>
                  )}
                </div>

                <div>
                  <span className="block text-xs font-semibold mb-2">Aspect ratio</span>
                  <div className="flex flex-wrap gap-2">
                    {ASPECTS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAspect(a.id)}
                        className="cf-btn cf-btn-sm"
                        style={
                          aspect === a.id
                            ? { background: 'hsl(var(--primary) / .14)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / .4)' }
                            : { background: 'hsl(var(--surface-1))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }
                        }
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button className="cf-btn cf-btn-ghost" onClick={() => setStep(1)}><ArrowLeft size={14} /> Back</button>
                  <button className="cf-btn cf-btn-primary" disabled={platforms.length === 0 || !caption} onClick={() => setStep(3)}>
                    Preview <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="space-y-5">
                <div className="rounded-xl p-4 space-y-2.5" style={{ background: 'hsl(var(--surface-1))', border: '1px solid hsl(var(--border))' }}>
                  {[
                    ['Client', client?.company ?? '—'],
                    ['Project', project ?? '—'],
                    ['Platforms', platforms.map((p) => PLATFORMS.find((x) => x.id === p)?.label).join(', ')],
                    ['Title', title || 'Untitled post'],
                    ['Aspect', ASPECTS.find((a) => a.id === aspect)?.label ?? 'Original'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex text-xs">
                      <span className="w-20 shrink-0" style={{ color: 'hsl(var(--faint-foreground))' }}>{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Submitting sets the post to <strong style={{ color: 'hsl(var(--st-pending))' }}>pending</strong> and notifies the client's portal.
                </p>
                <div className="flex justify-between pt-1">
                  <button className="cf-btn cf-btn-ghost" onClick={() => setStep(2)}><ArrowLeft size={14} /> Back</button>
                  <button className="cf-btn cf-btn-primary" onClick={() => setSubmitted(true)}>
                    <Send size={14} /> Submit for review
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ------- live preview column ------- */}
        <div className="lg:sticky lg:top-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--faint-foreground))' }}>Live preview</span>
            <div className="flex gap-1">
              {platforms.slice(0, 4).map((p) => {
                const meta = PLATFORMS.find((x) => x.id === p)!
                return <meta.icon key={p} size={14} style={{ color: meta.color }} />
              })}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={platforms[0] ?? 'none'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {platforms.length > 0 ? (
                <PlatformPreview
                  platform={platforms[0]}
                  caption={caption ? caption + (tags ? `\n${tags}` : '') : ''}
                  author={client?.company ?? 'Your Client'}
                  seed={clientId ? clientId.charCodeAt(1) * 7 : 42}
                  aspect={aspect}
                  video={platforms[0] === 'youtube'}
                />
              ) : (
                <div className="cf-card grid place-items-center py-20 text-center">
                  <p className="text-xs" style={{ color: 'hsl(var(--faint-foreground))' }}>Pick a platform to see the live mockup.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
