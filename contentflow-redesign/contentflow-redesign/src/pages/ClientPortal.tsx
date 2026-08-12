import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { FileStack, Hourglass, CheckCircle2, MessageSquareWarning, ArrowRight, Check, MessageSquare, UploadCloud } from 'lucide-react'
import { POSTS, ACTIVITY, clientById } from '@/lib/data'
import { StatCard, StatusBadge, PlatformStack, PageHeader } from '@/components/bits'

/* Posts belonging to the signed-in client (mock: Lumen Athletics = c1) */
const MINE = POSTS.filter((p) => p.clientId === 'c1')

export function ClientOverview() {
  const pending = MINE.filter((p) => p.status === 'pending')
  return (
    <div>
      <PageHeader title="Welcome back, Maya" sub="2 posts are waiting for your review." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger mb-7">
        <StatCard icon={FileStack} label="Total posts" value={String(MINE.length * 8)} sub="across 3 projects" tone="246 90% 68%" />
        <StatCard icon={Hourglass} label="Awaiting your review" value={String(pending.length)} sub="oldest: 2 days" tone="38 96% 60%" />
        <StatCard icon={CheckCircle2} label="Approved by you" value="19" sub="this quarter" tone="160 84% 45%" />
        <StatCard icon={MessageSquareWarning} label="Revision requested" value="2" sub="agency notified" tone="187 92% 55%" />
      </div>

      <h2 className="font-semibold text-[15px] mb-3">Pending your review</h2>
      <div className="grid sm:grid-cols-2 gap-4 stagger">
        {pending.map((p) => (
          <motion.div key={p.id} whileHover={{ y: -3 }} className="cf-card cf-card-hover overflow-hidden">
            <div className="h-36 relative overflow-hidden">
              <img src={`https://picsum.photos/seed/cf${p.media.seed}/640/360`} alt="" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, hsl(240 11% 4% / .75), transparent 55%)' }} />
              <div className="absolute bottom-2.5 left-3"><PlatformStack platforms={p.platforms} /></div>
              <div className="absolute bottom-2.5 right-3"><StatusBadge status={p.status} pulse /></div>
            </div>
            <div className="p-4">
              <div className="font-semibold text-[14px]">{p.title}</div>
              <p className="text-xs mt-1 line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.caption}</p>
              <div className="flex items-center justify-between mt-3.5">
                <span className="cf-mono text-[10px]" style={{ color: 'hsl(var(--faint-foreground))' }}>{p.project} · {p.updatedAt}</span>
                <Link to={`/client-portal/review/${p.id}`} className="cf-btn cf-btn-primary cf-btn-sm">
                  Review <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function ClientHistory() {
  const done = MINE.filter((p) => p.status !== 'pending')
  return (
    <div>
      <PageHeader title="History" sub="Everything you've already reviewed." />
      <div className="cf-card overflow-hidden">
        {done.map((p, i) => (
          <Link
            key={p.id}
            to={`/client-portal/review/${p.id}`}
            className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-[hsl(var(--surface-3)/0.45)]"
            style={{ borderTop: i === 0 ? 'none' : '1px solid hsl(var(--border))' }}
          >
            <PlatformStack platforms={p.platforms} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{p.title}</div>
              <div className="cf-mono text-[10px] mt-0.5" style={{ color: 'hsl(var(--faint-foreground))' }}>{p.project} · {p.updatedAt}</div>
            </div>
            <StatusBadge status={p.status} />
            <ArrowRight size={14} style={{ color: 'hsl(var(--faint-foreground))' }} />
          </Link>
        ))}
      </div>
    </div>
  )
}

export function ClientActivity() {
  const icons: Record<string, typeof Check> = { check: Check, message: MessageSquare, upload: UploadCloud }
  return (
    <div>
      <PageHeader title="Activity" sub="A timeline of everything happening on your content." />
      <div className="cf-card p-5 max-w-2xl">
        <div className="relative space-y-5">
          <div className="absolute left-[13px] top-2 bottom-2 w-px" style={{ background: 'hsl(var(--border))' }} />
          {ACTIVITY.slice(0, 5).map((a) => {
            const Icon = icons[a.icon] ?? Check
            return (
              <div key={a.id} className="relative flex gap-3">
                <span className="relative z-10 grid place-items-center rounded-full shrink-0" style={{ width: 27, height: 27, background: 'hsl(var(--primary) / .12)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / .3)' }}>
                  <Icon size={12} />
                </span>
                <div className="pt-0.5">
                  <p className="text-xs">{a.text}</p>
                  <p className="cf-mono text-[10px] mt-0.5" style={{ color: 'hsl(var(--faint-foreground))' }}>{a.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------- Review screen (approve / reject / request revision) ---------- */
import { useParams, useNavigate } from 'react-router'
import { useState } from 'react'
import { ArrowLeft, ThumbsUp, ThumbsDown, PencilLine, Send } from 'lucide-react'
import PlatformPreview from '@/components/PlatformPreview'
import { PlatformBadge } from '@/components/bits'

export function ClientReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const post = POSTS.find((p) => p.id === id) ?? MINE[0]
  const client = clientById(post.clientId)
  const [decision, setDecision] = useState<null | 'approved' | 'rejected' | 'revision'>(null)
  const [note, setNote] = useState('')

  if (decision) {
    const meta = {
      approved: { label: 'Post approved', body: 'The agency has been notified and can now schedule or publish this post.', tone: '--st-approved' },
      rejected: { label: 'Post rejected', body: 'The agency has been notified. This post will not be published.', tone: '--st-rejected' },
      revision: { label: 'Revision requested', body: 'Your feedback was sent to the agency — expect an updated draft soon.', tone: '--st-revision' },
    }[decision]
    return (
      <div className="max-w-md mx-auto pt-14 text-center">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="mx-auto grid place-items-center rounded-full"
          style={{ width: 64, height: 64, background: `hsl(var(${meta.tone}) / .14)`, border: `1px solid hsl(var(${meta.tone}) / .4)`, color: `hsl(var(${meta.tone}))` }}
        >
          {decision === 'approved' ? <ThumbsUp size={26} /> : decision === 'rejected' ? <ThumbsDown size={26} /> : <PencilLine size={26} />}
        </motion.div>
        <h1 className="cf-display text-2xl mt-5">{meta.label}</h1>
        <p className="text-[13px] mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{meta.body}</p>
        <button className="cf-btn cf-btn-primary mt-6" onClick={() => navigate('/client-portal')}>Back to overview</button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="cf-btn cf-btn-ghost cf-btn-sm mb-4"><ArrowLeft size={14} /> Back</button>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <PlatformPreview platform={post.platforms[0]} caption={post.caption} author={client.company} seed={post.media.seed} video={post.media.kind === 'video'} />
        <div className="space-y-4">
          <div className="cf-card p-5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {post.platforms.map((p) => <PlatformBadge key={p} platform={p} label />)}
              <span className="cf-mono text-[10px] ml-auto" style={{ color: 'hsl(var(--faint-foreground))' }}>{post.updatedAt}</span>
            </div>
            <h1 className="cf-display text-lg">{post.title}</h1>
            <p className="text-[13px] mt-2 leading-relaxed" style={{ color: 'hsl(var(--foreground) / .85)' }}>{post.caption}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.hashtags.map((t) => (
                <span key={t} className="cf-badge" style={{ color: 'hsl(var(--cyan))', background: 'hsl(var(--cyan) / .08)', borderColor: 'hsl(var(--cyan) / .2)' }}>{t}</span>
              ))}
            </div>
          </div>

          <div className="cf-card p-5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--faint-foreground))' }}>Your decision</span>
            <textarea
              className="cf-input mt-3" rows={3}
              placeholder="Add a note for the agency (optional)…"
              value={note} onChange={(e) => setNote(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <button className="cf-btn" onClick={() => setDecision('approved')} style={{ background: 'hsl(var(--st-approved) / .16)', color: 'hsl(var(--st-approved))', border: '1px solid hsl(var(--st-approved) / .4)' }}>
                <ThumbsUp size={14} /> Approve
              </button>
              <button className="cf-btn" onClick={() => setDecision('revision')} style={{ background: 'hsl(var(--st-revision) / .14)', color: 'hsl(var(--st-revision))', border: '1px solid hsl(var(--st-revision) / .4)' }}>
                <PencilLine size={14} /> Revise
              </button>
              <button className="cf-btn" onClick={() => setDecision('rejected')} style={{ background: 'hsl(var(--st-rejected) / .14)', color: 'hsl(var(--st-rejected))', border: '1px solid hsl(var(--st-rejected) / .4)' }}>
                <ThumbsDown size={14} /> Reject
              </button>
            </div>
            <p className="flex items-center gap-1.5 cf-mono text-[10px] mt-3" style={{ color: 'hsl(var(--faint-foreground))' }}>
              <Send size={10} /> The agency is notified instantly, whatever you choose.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
