import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, Check, Clock, FileEdit, XCircle, Send, Trash2, Pencil, RefreshCw,
  MessageSquare, Instagram, Facebook, Youtube, Linkedin, Sparkles, CornerDownRight,
} from 'lucide-react'
import { POSTS, COMMENTS, clientById, type Platform, type PostStatus } from '@/lib/data'
import { StatusBadge, PlatformBadge, Modal, GradAvatar } from '@/components/bits'
import PlatformPreview, { type Aspect } from '@/components/PlatformPreview'

const STATUS_ACTIONS: { id: PostStatus; label: string; icon: typeof Check; tone: string }[] = [
  { id: 'approved', label: 'Approve', icon: Check, tone: '--st-approved' },
  { id: 'pending', label: 'Pending', icon: Clock, tone: '--st-pending' },
  { id: 'draft', label: 'Draft', icon: FileEdit, tone: '--st-draft' },
  { id: 'rejected', label: 'Reject', icon: XCircle, tone: '--st-rejected' },
]

const PUBLISH_TARGETS: { id: Platform; label: string; icon: typeof Instagram; color: string; account: string }[] = [
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: '#1877F2', account: '@lumenathletics' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C', account: '@lumen.athletics' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2', account: 'Lumen Athletics Inc.' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF0033', account: 'Lumen TV' },
]

const ASPECTS: { id: Aspect; label: string }[] = [
  { id: 'original', label: 'Original' }, { id: '1:1', label: '1:1' }, { id: '9:16', label: '9:16' }, { id: '16:9', label: '16:9' },
]

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const post = POSTS.find((p) => p.id === id) ?? POSTS[0]
  const client = clientById(post.clientId)

  const [status, setStatus] = useState<PostStatus>(post.status)
  const [statusFlash, setStatusFlash] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(post.title)
  const [caption, setCaption] = useState(post.caption)
  const [aspect, setAspect] = useState<Aspect>('original')
  const [previewPlatform, setPreviewPlatform] = useState<Platform>(post.platforms[0])
  const [publishOpen, setPublishOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [targets, setTargets] = useState<Platform[]>(['instagram', 'facebook'])
  const [ytType, setYtType] = useState<'short' | 'video'>('short')
  const [publishState, setPublishState] = useState<'pick' | 'publishing' | 'done'>('pick')
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState(COMMENTS)
  const [dmOpen, setDmOpen] = useState(false)

  const changeStatus = (s: PostStatus) => {
    setStatus(s)
    setStatusFlash(true)
    setTimeout(() => setStatusFlash(false), 900)
  }

  const doPublish = () => {
    setPublishState('publishing')
    setTimeout(() => setPublishState('done'), 1600)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* header row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="cf-btn cf-btn-ghost cf-btn-sm !px-2"><ArrowLeft size={15} /></button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="cf-display text-[20px] sm:text-[24px] truncate">{title}</h1>
            <motion.span
              key={status + String(statusFlash)}
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <StatusBadge status={status} pulse={status === 'pending'} />
            </motion.span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {post.project} · by {post.author} · updated {post.updatedAt}
          </p>
        </div>
        <button className="cf-btn cf-btn-secondary" onClick={() => setPublishOpen(true)}><Send size={14} /> Publish</button>
        <button className="cf-btn cf-btn-danger !px-2.5" onClick={() => setDeleteOpen(true)} title="Delete post"><Trash2 size={14} /></button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* ------ preview column ------ */}
        <div className="lg:col-span-2 lg:sticky lg:top-6">
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {post.platforms.map((p) => (
              <button
                key={p}
                onClick={() => setPreviewPlatform(p)}
                className="transition-all rounded-full"
                style={{ opacity: previewPlatform === p ? 1 : 0.45, transform: previewPlatform === p ? 'scale(1.05)' : 'none' }}
              >
                <PlatformBadge platform={p} label />
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={previewPlatform + aspect} initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: .18 }}>
              <PlatformPreview platform={previewPlatform} caption={caption} author={client.company} seed={post.media.seed} aspect={aspect} video={post.media.kind === 'video'} />
            </motion.div>
          </AnimatePresence>
          <div className="flex gap-1.5 mt-3 justify-center">
            {ASPECTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAspect(a.id)}
                className="cf-btn cf-btn-sm cf-mono !text-[10px]"
                style={
                  aspect === a.id
                    ? { background: 'hsl(var(--primary) / .14)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / .4)' }
                    : { background: 'hsl(var(--surface-2))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }
                }
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* ------ details column ------ */}
        <div className="lg:col-span-3 space-y-5">
          {/* client + info */}
          <section className="cf-card p-5">
            <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              <GradAvatar name={client.company} hue={client.hue} size={36} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold">{client.company}</div>
                <div className="text-[11px]" style={{ color: 'hsl(var(--faint-foreground))' }}>{client.contact} · {post.project}</div>
              </div>
              {post.autoDelete && (
                <span className="cf-badge" style={{ color: 'hsl(var(--st-pending))', background: 'hsl(var(--st-pending) / .1)', borderColor: 'hsl(var(--st-pending) / .3)' }}>
                  Auto-deletes in {post.autoDelete}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--faint-foreground))' }}>Content</span>
              <button className="cf-btn cf-btn-ghost cf-btn-sm" onClick={() => setEditing((v) => !v)}>
                <Pencil size={12} /> {editing ? 'Done' : 'Edit'}
              </button>
            </div>

            {editing ? (
              <div className="space-y-3 anim-fade-in">
                <input className="cf-input" value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea className="cf-input" rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} />
                <input className="cf-input" defaultValue={post.hashtags.join(' ')} />
                <button className="cf-btn cf-btn-secondary cf-btn-sm w-full"><RefreshCw size={13} /> Replace media</button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] leading-relaxed" style={{ color: 'hsl(var(--foreground) / .9)' }}>{caption}</p>
                <div className="flex flex-wrap gap-1.5">
                  {post.hashtags.map((t) => (
                    <span key={t} className="cf-badge" style={{ color: 'hsl(var(--cyan))', background: 'hsl(var(--cyan) / .08)', borderColor: 'hsl(var(--cyan) / .2)' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* status actions */}
          <section className="cf-card p-5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--faint-foreground))' }}>Set status</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {STATUS_ACTIONS.map((a) => {
                const on = status === a.id
                return (
                  <button
                    key={a.id}
                    onClick={() => changeStatus(a.id)}
                    className="cf-btn transition-all"
                    style={
                      on
                        ? { background: `hsl(var(${a.tone}) / .16)`, color: `hsl(var(${a.tone}))`, border: `1px solid hsl(var(${a.tone}) / .45)` }
                        : { background: 'hsl(var(--surface-1))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }
                    }
                  >
                    <a.icon size={14} /> {a.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* DM override */}
          <section className="cf-card overflow-hidden">
            <button className="w-full flex items-center gap-2.5 px-5 py-4" onClick={() => setDmOpen((v) => !v)}>
              <Sparkles size={15} style={{ color: 'hsl(var(--primary))' }} />
              <span className="text-[13px] font-semibold flex-1 text-left">Auto-DM override</span>
              <span className="cf-badge" style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--surface-3))', borderColor: 'hsl(var(--border))' }}>
                {dmOpen ? 'Configured' : 'Optional'}
              </span>
            </button>
            <AnimatePresence>
              {dmOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-5 pb-5 space-y-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                    <p className="text-[11px] pt-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      When someone comments a trigger keyword on this post, send this DM automatically.
                    </p>
                    <input className="cf-input" placeholder="Trigger keywords — e.g. PRICE, LINK, GUIDE" defaultValue="ATLAS, DROP" />
                    <textarea className="cf-input" rows={3} placeholder="DM message…" defaultValue="Thanks for your interest in the Atlas Collection! Here's the early-access link: " />
                    <input className="cf-input" placeholder="Link URL" defaultValue="https://lumenathletics.co/atlas-early" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* comments */}
          <section className="cf-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--faint-foreground))' }}>
                Comments · {comments.length}
              </span>
            </div>
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div
                    className="grid place-items-center rounded-full text-[10px] font-bold text-white shrink-0"
                    style={{
                      width: 30, height: 30,
                      background: c.role === 'client' ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
                    }}
                  >
                    {c.author.split(' ').map((w) => w[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0 rounded-xl px-3.5 py-2.5" style={{ background: 'hsl(var(--surface-1))', border: '1px solid hsl(var(--border))' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{c.author}</span>
                      <span
                        className="cf-badge !h-[18px] !text-[9px]"
                        style={
                          c.role === 'client'
                            ? { color: 'hsl(var(--st-pending))', background: 'hsl(var(--st-pending) / .12)' }
                            : { color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / .12)' }
                        }
                      >
                        {c.role === 'client' ? 'Client' : 'Team'}
                      </span>
                      <span className="cf-mono text-[10px] ml-auto" style={{ color: 'hsl(var(--faint-foreground))' }}>{c.time}</span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'hsl(var(--foreground) / .85)' }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <CornerDownRight size={15} className="mt-2.5 shrink-0" style={{ color: 'hsl(var(--faint-foreground))' }} />
              <textarea
                className="cf-input flex-1" rows={2} placeholder="Add a comment…"
                value={comment} onChange={(e) => setComment(e.target.value)}
              />
              <button
                className="cf-btn cf-btn-primary self-end"
                disabled={!comment.trim()}
                onClick={() => {
                  setComments((c) => [...c, { id: `cm${Date.now()}`, author: 'Dana K.', role: 'team', time: 'now', text: comment }])
                  setComment('')
                }}
              >
                <Send size={13} />
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* ------- publish modal ------- */}
      <Modal open={publishOpen} onClose={() => { setPublishOpen(false); setPublishState('pick') }} width={500}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--cyan)))' }} />
        <div className="p-6">
          {publishState === 'pick' && (
            <>
              <h3 className="cf-display text-lg">Publish post</h3>
              <p className="text-xs mt-1 mb-5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Connected accounts for {client.company}. Publishing is immediate — no re-review.
              </p>
              <div className="space-y-2">
                {PUBLISH_TARGETS.map((t) => {
                  const on = targets.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTargets((cur) => (on ? cur.filter((x) => x !== t.id) : [...cur, t.id]))}
                      className="w-full flex items-center gap-3 rounded-xl p-3 transition-all"
                      style={{ border: `1px solid ${on ? t.color + '66' : 'hsl(var(--border))'}`, background: on ? t.color + '10' : 'hsl(var(--surface-1))' }}
                    >
                      <t.icon size={17} style={{ color: t.color }} />
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-[13px] font-medium">{t.label}</div>
                        <div className="text-[11px]" style={{ color: 'hsl(var(--faint-foreground))' }}>{t.account}</div>
                      </div>
                      {t.id === 'youtube' && on && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          {(['short', 'video'] as const).map((k) => (
                            <button
                              key={k}
                              onClick={() => setYtType(k)}
                              className="cf-btn cf-btn-sm !h-6 !text-[10px] cf-mono"
                              style={
                                ytType === k
                                  ? { background: '#FF003322', color: '#FF5566', border: '1px solid #FF003355' }
                                  : { background: 'transparent', color: 'hsl(var(--faint-foreground))', border: '1px solid hsl(var(--border))' }
                              }
                            >
                              {k === 'short' ? 'Short' : 'Video'}
                            </button>
                          ))}
                        </div>
                      )}
                      <span
                        className="w-4.5 h-4.5 rounded-full grid place-items-center shrink-0"
                        style={{ width: 18, height: 18, background: on ? t.color : 'transparent', border: `1.5px solid ${on ? t.color : 'hsl(var(--border-strong))'}` }}
                      >
                        {on && <Check size={11} className="text-white" />}
                      </span>
                    </button>
                  )
                })}
              </div>
              <button className="cf-btn cf-btn-primary w-full mt-5" disabled={targets.length === 0} onClick={doPublish}>
                <Send size={14} /> Publish to {targets.length} platform{targets.length === 1 ? '' : 's'}
              </button>
            </>
          )}

          {publishState === 'publishing' && (
            <div className="py-8 grid place-items-center text-center">
              <motion.div
                className="rounded-full"
                style={{ width: 44, height: 44, border: '3px solid hsl(var(--surface-3))', borderTopColor: 'hsl(var(--primary))' }}
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
              />
              <p className="text-sm font-medium mt-4">Publishing…</p>
              <p className="cf-mono text-[10px] mt-1" style={{ color: 'hsl(var(--faint-foreground))' }}>posting via connected social APIs</p>
            </div>
          )}

          {publishState === 'done' && (
            <div className="py-2">
              <h3 className="cf-display text-lg mb-4">Publish results</h3>
              <div className="space-y-2">
                {targets.map((t, i) => {
                  const meta = PUBLISH_TARGETS.find((x) => x.id === t)!
                  const ok = i !== targets.length - 1 || targets.length === 1 // last one "fails" for demo when multiple
                  return (
                    <motion.div
                      key={t}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}
                      className="flex items-center gap-3 rounded-xl p-3"
                      style={{
                        border: `1px solid hsl(var(--st-${ok ? 'approved' : 'rejected'}) / .35)`,
                        background: `hsl(var(--st-${ok ? 'approved' : 'rejected'}) / .07)`,
                      }}
                    >
                      <meta.icon size={16} style={{ color: meta.color }} />
                      <span className="text-[13px] font-medium flex-1">{meta.label}</span>
                      {ok ? (
                        <span className="cf-badge" style={{ color: 'hsl(var(--st-approved))', background: 'hsl(var(--st-approved) / .12)' }}><Check size={11} /> Live</span>
                      ) : (
                        <span className="cf-badge" style={{ color: 'hsl(var(--st-rejected))', background: 'hsl(var(--st-rejected) / .12)' }}><XCircle size={11} /> Token expired</span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
              <div className="flex gap-2 mt-5">
                <button className="cf-btn cf-btn-secondary flex-1" onClick={() => setPublishState('pick')}>Retry failed</button>
                <button className="cf-btn cf-btn-primary flex-1" onClick={() => { setPublishOpen(false); setPublishState('pick'); changeStatus('published') }}>Done</button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ------- delete modal ------- */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} width={420}>
        <div className="p-6 text-center">
          <div className="mx-auto grid place-items-center rounded-full" style={{ width: 48, height: 48, background: 'hsl(var(--destructive) / .12)', border: '1px solid hsl(var(--destructive) / .3)', color: 'hsl(var(--destructive))' }}>
            <Trash2 size={20} />
          </div>
          <h3 className="cf-display text-lg mt-4">Delete this post?</h3>
          <p className="text-xs mt-1.5 max-w-xs mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
            “{post.title}” and its media in R2 will be permanently removed. This can't be undone.
          </p>
          <div className="flex gap-2 mt-6">
            <button className="cf-btn cf-btn-secondary flex-1" onClick={() => setDeleteOpen(false)}>Cancel</button>
            <button className="cf-btn cf-btn-danger flex-1" onClick={() => navigate('/')}><Trash2 size={14} /> Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
