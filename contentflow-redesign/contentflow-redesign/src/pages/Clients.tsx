import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, Plus, FolderKanban, Youtube, MailCheck, Trash2, Building2, User, Mail,
  Link2, FileUp, Send, Copy, Check, X, AlertTriangle, FolderOpen, Globe, Loader2,
} from 'lucide-react'
import { CLIENTS, type Client } from '@/lib/data'
import { GradAvatar, Modal, PageHeader, EmptyState, PlatformIcon } from '@/components/bits'

type Filter = 'all' | 'active' | 'pending'

/* ============ Invite modal — the full onboarding flow ============ */
type InvitePhase = 'form' | 'sending' | 'sent' | 'fallback'

function InviteModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const [phase, setPhase] = useState<InvitePhase>('form')
  const [contact, setContact] = useState(client.contact)
  const [email, setEmail] = useState(client.email)
  const [roadmap, setRoadmap] = useState('https://roadmap.contentflow.app/lumen-athletics')
  const [contract, setContract] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const inviteLink = `https://app.contentflow.co/invite/${client.id}-7f3a9c`

  const send = (fail = false) => {
    setPhase('sending')
    setTimeout(() => setPhase(fail ? 'fallback' : 'sent'), 1400)
  }

  return (
    <Modal open onClose={onClose} width={540}>
      {/* gradient accent bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--cyan)))' }} />

      <AnimatePresence mode="wait">
        {/* ---------------- FORM ---------------- */}
        {phase === 'form' && (
          <motion.div key="form" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="p-6">
            <h3 className="cf-display text-lg">Set up client portal</h3>
            <p className="text-xs mt-1 mb-5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Send a branded invite — the client sets a password and lands in their review portal.
            </p>

            {/* client context card */}
            <div className="flex items-center gap-3 rounded-xl p-3 mb-5" style={{ background: 'hsl(var(--surface-3) / .55)', border: '1px solid hsl(var(--border))' }}>
              <GradAvatar name={client.company} hue={client.hue} size={38} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold">{client.company}</div>
                <div className="text-[11px]" style={{ color: 'hsl(var(--faint-foreground))' }}>Workspace · created {client.createdAt}</div>
              </div>
              <span className="cf-badge" style={{ color: 'hsl(var(--st-pending))', background: 'hsl(var(--st-pending) / .12)', borderColor: 'hsl(var(--st-pending) / .3)' }}>
                <span className="dot" style={{ animation: 'cf-pulse-dot 1.8s infinite' }} /> Setup pending
              </span>
            </div>

            <div className="space-y-3.5">
              {[
                { icon: User, label: 'Contact name', value: contact, set: setContact, type: 'text' },
                { icon: Mail, label: 'Email address', value: email, set: setEmail, type: 'email' },
                { icon: Link2, label: 'Client roadmap URL', value: roadmap, set: setRoadmap, type: 'url' },
              ].map((f) => (
                <label key={f.label} className="block">
                  <span className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{f.label}</span>
                  <div className="relative">
                    <f.icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--faint-foreground))' }} />
                    <input type={f.type} value={f.value} onChange={(e) => f.set(e.target.value)} className="cf-input !pl-9.5" style={{ paddingLeft: 36 }} />
                  </div>
                </label>
              ))}

              {/* Contract upload */}
              <div>
                <span className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Contract PDF <span style={{ color: 'hsl(var(--faint-foreground))' }}>(optional)</span>
                </span>
                {contract ? (
                  <div className="flex items-center gap-2.5 cf-input !h-11">
                    <FileUp size={14} style={{ color: 'hsl(var(--st-approved))' }} />
                    <span className="text-xs flex-1 truncate">{contract}</span>
                    <button onClick={() => setContract(null)} className="cf-btn-ghost cf-btn cf-btn-sm !px-1.5"><X size={13} /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => setContract('MSA_ContentFlow_2026.pdf')}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); setContract(e.dataTransfer.files[0]?.name ?? 'contract.pdf') }}
                    className="w-full rounded-xl grid place-items-center py-6 transition-all"
                    style={{
                      border: `1.5px dashed hsl(var(--${dragOver ? 'primary' : 'border-strong'}))`,
                      background: dragOver ? 'hsl(var(--primary) / .08)' : 'hsl(var(--surface-1))',
                    }}
                  >
                    <FileUp size={18} style={{ color: 'hsl(var(--primary))' }} />
                    <span className="text-xs mt-2 font-medium">Drop PDF here or <span style={{ color: 'hsl(var(--primary))' }}>browse</span></span>
                    <span className="cf-mono text-[10px] mt-0.5" style={{ color: 'hsl(var(--faint-foreground))' }}>uploads to R2 · max 25 MB</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <button className="cf-btn cf-btn-primary flex-1" onClick={() => send(false)}>
                <Send size={14} /> Send setup invite
              </button>
              <button className="cf-btn cf-btn-secondary" onClick={() => send(true)} title="Simulate email delivery failure">
                Simulate failure
              </button>
            </div>
          </motion.div>
        )}

        {/* ---------------- SENDING ---------------- */}
        {phase === 'sending' && (
          <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 grid place-items-center text-center">
            <Loader2 size={28} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
            <p className="text-sm font-medium mt-4">Creating account &amp; sending invite…</p>
            <p className="cf-mono text-[10px] mt-1.5" style={{ color: 'hsl(var(--faint-foreground))' }}>POST /api/admin/invite → Supabase + Resend</p>
          </motion.div>
        )}

        {/* ---------------- SENT ---------------- */}
        {phase === 'sent' && (
          <motion.div key="sent" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: .1 }}
              className="mx-auto grid place-items-center rounded-full"
              style={{ width: 56, height: 56, background: 'hsl(var(--st-approved) / .14)', border: '1px solid hsl(var(--st-approved) / .35)', color: 'hsl(var(--st-approved))' }}
            >
              <MailCheck size={24} />
            </motion.div>
            <h3 className="cf-display text-lg mt-4">Invite sent</h3>
            <p className="text-xs mt-1.5 max-w-xs mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {contact} will receive a branded email at <strong style={{ color: 'hsl(var(--foreground))' }}>{email}</strong> with a
              password-setup link{contract ? ', the contract PDF,' : ''} and your roadmap.
            </p>
            <div className="rounded-xl p-3 mt-5 text-left space-y-1.5" style={{ background: 'hsl(var(--surface-3) / .5)', border: '1px solid hsl(var(--border))' }}>
              {['Welcome message & agency branding', 'Secure set-password link (24h expiry)', 'Client roadmap URL', contract ? 'Contract PDF attached' : 'No contract attached'].map((li) => (
                <div key={li} className="flex items-center gap-2 text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Check size={12} style={{ color: 'hsl(var(--st-approved))' }} /> {li}
                </div>
              ))}
            </div>
            <button className="cf-btn cf-btn-primary w-full mt-5" onClick={onClose}>Done</button>
          </motion.div>
        )}

        {/* ---------------- FALLBACK ---------------- */}
        {phase === 'fallback' && (
          <motion.div key="fallback" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="p-8">
            <div className="text-center">
              <div
                className="mx-auto grid place-items-center rounded-full"
                style={{ width: 56, height: 56, background: 'hsl(var(--st-pending) / .14)', border: '1px solid hsl(var(--st-pending) / .35)', color: 'hsl(var(--st-pending))' }}
              >
                <AlertTriangle size={24} />
              </div>
              <h3 className="cf-display text-lg mt-4">Email couldn't be delivered</h3>
              <p className="text-xs mt-1.5 max-w-sm mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
                The account was created, but Resend rejected the message. Share this manual invite link instead — it expires in 24 hours.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-5 rounded-xl p-1.5 pl-3.5" style={{ background: 'hsl(var(--surface-1))', border: '1px solid hsl(var(--border))' }}>
              <span className="cf-mono text-[11px] flex-1 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{inviteLink}</span>
              <button
                className="cf-btn cf-btn-primary cf-btn-sm shrink-0"
                onClick={() => { navigator.clipboard?.writeText(inviteLink).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1600) }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="cf-btn cf-btn-secondary flex-1" onClick={() => setPhase('form')}>Edit &amp; retry</button>
              <button className="cf-btn cf-btn-ghost flex-1" onClick={onClose}>Close</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

/* ============ Add workspace modal ============ */
function AddWorkspaceModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose} width={460}>
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--cyan)))' }} />
      <div className="p-6">
        <h3 className="cf-display text-lg">New client workspace</h3>
        <p className="text-xs mt-1 mb-5" style={{ color: 'hsl(var(--muted-foreground))' }}>A workspace groups a client's projects, posts and portal access.</p>
        <div className="space-y-3.5">
          {[
            { icon: Building2, label: 'Company name', ph: 'Acme Co.' },
            { icon: User, label: 'Contact name', ph: 'Jane Cooper' },
            { icon: Mail, label: 'Email address', ph: 'jane@acme.com' },
          ].map((f) => (
            <label key={f.label} className="block">
              <span className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{f.label}</span>
              <div className="relative">
                <f.icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--faint-foreground))' }} />
                <input placeholder={f.ph} className="cf-input" style={{ paddingLeft: 36 }} />
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-2 mt-6">
          <button className="cf-btn cf-btn-ghost flex-1" onClick={onClose}>Cancel</button>
          <button className="cf-btn cf-btn-primary flex-1" onClick={onClose}><Plus size={14} /> Create workspace</button>
        </div>
      </div>
    </Modal>
  )
}

/* ============ Delete confirm modal ============ */
function DeleteModal({ client, onClose }: { client: Client; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} width={420}>
      <div className="p-6 text-center">
        <div className="mx-auto grid place-items-center rounded-full" style={{ width: 48, height: 48, background: 'hsl(var(--destructive) / .12)', border: '1px solid hsl(var(--destructive) / .3)', color: 'hsl(var(--destructive))' }}>
          <Trash2 size={20} />
        </div>
        <h3 className="cf-display text-lg mt-4">Delete {client.company}?</h3>
        <p className="text-xs mt-1.5 max-w-xs mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
          This removes the workspace, its projects, and scheduled posts. Published media stays in R2. This can't be undone.
        </p>
        <div className="flex gap-2 mt-6">
          <button className="cf-btn cf-btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="cf-btn cf-btn-danger flex-1" onClick={onClose}><Trash2 size={14} /> Delete workspace</button>
        </div>
      </div>
    </Modal>
  )
}

/* ============ Page ============ */
export default function Clients() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [inviteFor, setInviteFor] = useState<Client | null>(null)
  const [deleteFor, setDeleteFor] = useState<Client | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const list = useMemo(() => CLIENTS.filter((c) => {
    if (filter === 'active' && c.portal !== 'active') return false
    if (filter === 'pending' && c.portal !== 'pending') return false
    if (query) {
      const q = query.toLowerCase()
      return c.company.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    }
    return true
  }), [query, filter])

  const metric = (label: string, value: string, tone: string) => (
    <div className="cf-card cf-card-hover px-4 py-3.5 anim-fade-up">
      <div className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</div>
      <div className="cf-display text-[22px] mt-1" style={{ color: `hsl(${tone})` }}>{value}</div>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Clients & partners"
        sub="Workspaces, portals and social connections for every account you manage."
        actions={<button className="cf-btn cf-btn-primary" onClick={() => setAddOpen(true)}><Plus size={15} /> New workspace</button>}
      />

      <div className="grid grid-cols-3 gap-3 sm:gap-4 stagger mb-6">
        {metric('Managed platforms', '14', '246 90% 68%')}
        {metric('Active client portals', '4', '160 84% 45%')}
        {metric('Setup links pending', '2', '38 96% 60%')}
      </div>

      {/* search + filter pills */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--faint-foreground))' }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, contact, email…" className="cf-input !h-9" style={{ paddingLeft: 32 }} />
        </div>
        <div className="flex gap-1.5">
          {([['all', 'All'], ['active', 'Active portals'], ['pending', 'Pending onboarding']] as [Filter, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className="cf-btn cf-btn-sm transition-all"
              style={
                filter === id
                  ? { background: 'hsl(var(--primary) / .14)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / .35)' }
                  : { background: 'hsl(var(--surface-2))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* cards grid */}
      {list.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No workspaces found"
          body="Try another search, or create a new client workspace to get started."
          action={<button className="cf-btn cf-btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> New workspace</button>}
        />
      ) : (
        <div className="grid gap-4 stagger" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {list.map((c) => (
            <div key={c.id} className="cf-card cf-card-hover p-5 group relative">
              <button
                onClick={() => setDeleteFor(c)}
                className="absolute top-4 right-4 grid place-items-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ width: 28, height: 28, color: 'hsl(var(--faint-foreground))', border: '1px solid hsl(var(--border))' }}
                title="Delete workspace"
              >
                <Trash2 size={13} />
              </button>

              <div className="flex items-center gap-3">
                <GradAvatar name={c.company} hue={c.hue} size={44} />
                <div className="min-w-0">
                  <div className="font-semibold text-[15px] truncate">{c.company}</div>
                  {c.portal === 'active' ? (
                    <span className="cf-badge mt-1" style={{ color: 'hsl(var(--st-approved))', background: 'hsl(var(--st-approved) / .12)', borderColor: 'hsl(var(--st-approved) / .3)' }}>
                      <span className="dot" /> Active workspace
                    </span>
                  ) : (
                    <span className="cf-badge mt-1" style={{ color: 'hsl(var(--st-pending))', background: 'hsl(var(--st-pending) / .12)', borderColor: 'hsl(var(--st-pending) / .3)' }}>
                      <span className="dot" style={{ animation: 'cf-pulse-dot 1.8s infinite' }} /> Setup pending
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-xl px-3.5 py-3 mt-4 space-y-1.5" style={{ background: 'hsl(var(--surface-3) / .45)', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center gap-2 text-xs"><User size={12} style={{ color: 'hsl(var(--faint-foreground))' }} /> {c.contact}</div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}><Mail size={12} style={{ color: 'hsl(var(--faint-foreground))' }} /> {c.email}</div>
                <div className="flex items-center gap-2 cf-mono text-[10px]" style={{ color: 'hsl(var(--faint-foreground))' }}><Globe size={11} /> since {c.createdAt}</div>
              </div>

              <div className="flex items-center gap-1.5 mt-4">
                <button className="cf-btn cf-btn-secondary cf-btn-sm flex-1"><FolderKanban size={13} /> Projects</button>
                <button className="cf-btn cf-btn-secondary cf-btn-sm flex-1"><Youtube size={13} /> Socials</button>
                <button className="cf-btn cf-btn-primary cf-btn-sm flex-1" onClick={() => setInviteFor(c)}>
                  <Send size={13} /> {c.portal === 'active' ? 'Re-invite' : 'Setup portal'}
                </button>
              </div>

              <div className="flex items-center gap-1.5 mt-3.5 pt-3.5" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                <span className="text-[10px] mr-1" style={{ color: 'hsl(var(--faint-foreground))' }}>CONNECTED</span>
                {c.platforms.map((p) => <PlatformIcon key={p} platform={p} size={13} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {inviteFor && <InviteModal client={inviteFor} onClose={() => setInviteFor(null)} />}
      {deleteFor && <DeleteModal client={deleteFor} onClose={() => setDeleteFor(null)} />}
      {addOpen && <AddWorkspaceModal onClose={() => setAddOpen(false)} />}
    </div>
  )
}
