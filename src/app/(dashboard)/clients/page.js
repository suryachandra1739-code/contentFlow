'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Users, Briefcase, Mail, UserPlus, ArrowRight,
  Trash2, FolderKanban, Link2, FileText, Upload, Copy, Check,
  Video, ExternalLink, X, AlertTriangle,
} from 'lucide-react';
import { PageHeader, StatCard, Modal, SegTabs, GradAvatar, EmptyState } from '@/components/bits';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [inviteTarget, setInviteTarget] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const [inviteForm, setInviteForm] = useState({
    name: '', email: '', contractUrl: '', contractName: '',
    roadmapUrl: 'https://greymatterx.io/hemvedh/day-32?fbclid=PAVERFWASCRaFleHRuA2FlbQIxMABzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAae_DKePFp1_l2tPV3shETWq66KGb2U0g9UkPcAL-1wxg-Zx0JExs8iFQZzEYQ_aem_eCHTAzeXo97I5cpwhfyHzg'
  });

  const [form, setForm] = useState({ company_name: '', contact_name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const addToast = useToast();
  const router = useRouter();

  const load = () => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) { setClients(data); }
        else { console.error('Clients API error:', data); setClients([]); }
        setLoading(false);
      })
      .catch(() => { setClients([]); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    if (result.error) { addToast(result.error, 'error'); return; }
    setShowModal(false);
    setForm({ company_name: '', contact_name: '', email: '' });
    addToast('Client workspace created!', 'success');
    setClients(prev => [result, ...prev]);
    router.refresh();
  };

  const handleConfirmDelete = async (id) => {
    const res = await fetch(`/api/clients?clientId=${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.error) { addToast(result.error, 'error'); setDeleteTarget(null); return; }
    addToast('Client workspace deleted', 'success');
    setClients(prev => prev.filter(c => c.id !== id));
    setDeleteTarget(null);
    router.refresh();
  };

  const handleInviteClient = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email, name: inviteForm.name, role: 'client',
          client_id: inviteTarget.id, contractUrl: inviteForm.contractUrl,
          contractName: inviteForm.contractName, roadmapUrl: inviteForm.roadmapUrl,
        }),
      });
      const result = await res.json();
      if (result.error) {
        addToast(result.error, 'error');
      } else if (result.emailSent) {
        addToast(`Invitation email sent to ${inviteForm.email}!`, 'success');
        closeInviteModal();
      } else if (result.inviteLink) {
        addToast('Email delivery failed. Copy the link below to share manually.', 'error');
        setGeneratedLink(result.inviteLink);
      } else {
        addToast('Invitation created successfully!', 'success');
        closeInviteModal();
      }
    } catch (err) {
      addToast('Failed to send invite', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    addToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const closeInviteModal = () => {
    setInviteTarget(null);
    setInviteForm({
      name: '', email: '', contractUrl: '', contractName: '',
      roadmapUrl: 'https://greymatterx.io/hemvedh/day-32?fbclid=PAVERFWASCRaFleHRuA2FlbQIxMABzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAae_DKePFp1_l2tPV3shETWq66KGb2U0g9UkPcAL-1wxg-Zx0JExs8iFQZzEYQ_aem_eCHTAzeXo97I5cpwhfyHzg'
    });
    setGeneratedLink('');
  };

  const totalWorkspaces = clients.length;
  const activePortals = clients.filter(c => c.email).length;
  const pendingOnboarding = clients.length - activePortals;

  const filteredClients = clients.filter(c => {
    const matchesSearch =
      c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === 'active') return matchesSearch && c.email;
    if (activeFilter === 'pending') return matchesSearch && !c.email;
    return matchesSearch;
  });

  const filterOptions = [
    { id: 'all', label: 'All Clients', count: totalWorkspaces },
    { id: 'active', label: 'Active', count: activePortals },
    { id: 'pending', label: 'Pending', count: pendingOnboarding },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Partners Directory" sub="Loading workspaces..." />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 stagger mb-6">
          {[...Array(3)].map((_, i) => <div key={i} className="cf-card p-5"><div className="cf-skeleton h-7 w-20 mb-3" /><div className="cf-skeleton h-4 w-28" /></div>)}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {[...Array(6)].map((_, i) => <div key={i} className="cf-skeleton h-56 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Partners Directory"
        sub={`${totalWorkspaces} workspaces · Configure, audit, and onboard client portals`}
        actions={
          <button className="cf-btn cf-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Workspace
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 stagger mb-6">
        <StatCard icon={Briefcase} label="Managed Platforms" value={String(totalWorkspaces)} tone="246 90% 68%" />
        <StatCard icon={Users} label="Active Client Portals" value={String(activePortals)} tone="210 96% 62%" />
        <StatCard icon={UserPlus} label="Setup Links Pending" value={String(pendingOnboarding)} tone="38 96% 60%" />
      </div>

      {/* Search & Filters */}
      <div className="cf-card p-3 mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--faint-foreground))' }} />
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search partner, contact, or email..."
            className="cf-input !h-9" style={{ paddingLeft: 32 }}
          />
        </div>
        <SegTabs options={filterOptions} value={activeFilter} onChange={setActiveFilter} />
      </div>

      {/* Grid */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No workspaces found"
          body="Try adjusting your filters or add a new workspace to get started."
          action={<button className="cf-btn cf-btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> Add Workspace</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filteredClients.map(c => {
            const isPortalActive = !!c.email;
            const hash = c.company_name?.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 0;
            const hue = (hash * 37) % 360;

            return (
              <motion.div key={c.id} whileHover={{ y: -3 }} className="cf-card cf-card-hover p-5 anim-fade-up flex flex-col">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="cursor-pointer" onClick={() => router.push(`/projects?clientId=${c.id}`)}>
                    <GradAvatar name={c.company_name} hue={hue} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px] truncate cursor-pointer hover:text-[hsl(var(--primary))] transition-colors" onClick={() => router.push(`/projects?clientId=${c.id}`)}>
                      {c.company_name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{
                        background: isPortalActive ? 'hsl(var(--st-approved))' : 'hsl(var(--st-pending))',
                        boxShadow: isPortalActive ? '0 0 6px hsl(var(--st-approved) / .6)' : '0 0 6px hsl(var(--st-pending) / .6)',
                      }} />
                      <span className="text-[11px] font-medium" style={{ color: isPortalActive ? 'hsl(var(--st-approved))' : 'hsl(var(--st-pending))' }}>
                        {isPortalActive ? 'Active' : 'Setup Pending'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setDeleteTarget(c)} className="cf-btn cf-btn-ghost cf-btn-sm !px-1.5" title="Delete workspace">
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Metadata */}
                <div className="flex-1 rounded-xl p-3 space-y-2 text-xs mb-4" style={{ background: 'hsl(var(--surface-1))', border: '1px solid hsl(var(--border))' }}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>Contact:</span>
                    <span className="font-medium">{c.contact_name || 'Not assigned'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>Email:</span>
                    <span className="font-medium truncate">{c.email || 'No portal email'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>Created:</span>
                    <span className="font-medium">{c.created_at ? new Date(c.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <button className="cf-btn cf-btn-secondary cf-btn-sm text-[11px]" onClick={() => router.push(`/projects?clientId=${c.id}`)}>
                    <FolderKanban size={12} /> Projects
                  </button>
                  <button
                    className="cf-btn cf-btn-sm text-[11px]"
                    style={{ background: 'hsl(0 84% 64% / .10)', color: 'hsl(0 84% 68%)', border: '1px solid hsl(0 84% 64% / .25)' }}
                    onClick={() => router.push(`/clients/${c.id}/settings`)}
                    title="Connect YouTube, Instagram & Facebook"
                  >
                    <Video size={12} /> Socials
                  </button>
                  <button
                    className="cf-btn cf-btn-sm text-[11px]"
                    style={{ background: 'hsl(var(--primary) / .10)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / .25)' }}
                    onClick={() => {
                      setInviteTarget(c);
                      setInviteForm({
                        name: c.contact_name || '', email: c.email || '', contractUrl: '', contractName: '',
                        roadmapUrl: 'https://greymatterx.io/hemvedh/day-32?fbclid=PAVERFWASCRaFleHRuA2FlbQIxMABzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAae_DKePFp1_l2tPV3shETWq66KGb2U0g9UkPcAL-1wxg-Zx0JExs8iFQZzEYQ_aem_eCHTAzeXo97I5cpwhfyHzg'
                      });
                    }}
                    title="Configure & send portal login invite"
                  >
                    <Mail size={12} /> {isPortalActive ? 'Update' : 'Portal'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ ADD WORKSPACE MODAL ═══ */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid place-items-center rounded-xl" style={{ width: 40, height: 40, background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--cyan)))', color: 'white' }}>
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="cf-display text-lg">Add Partner Workspace</h2>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Create a new client workspace for collaboration</p>
            </div>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 block" style={{ color: 'hsl(var(--faint-foreground))' }}>Company Name</label>
              <div className="relative">
                <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--faint-foreground))' }} />
                <input className="cf-input !pl-10" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required placeholder="e.g. Acme Corp" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 block" style={{ color: 'hsl(var(--faint-foreground))' }}>Contact Name</label>
              <div className="relative">
                <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--faint-foreground))' }} />
                <input className="cf-input !pl-10" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="e.g. Alice Smith" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 block" style={{ color: 'hsl(var(--faint-foreground))' }}>Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--faint-foreground))' }} />
                <input className="cf-input !pl-10" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="alice@acme.com" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              <button type="button" className="cf-btn cf-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="cf-btn cf-btn-primary">Add Partner</button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ═══ DELETE CONFIRMATION ═══ */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} width={400}>
        <div className="p-6 text-center">
          <div className="mx-auto grid place-items-center rounded-2xl mb-4" style={{ width: 52, height: 52, background: 'hsl(var(--destructive) / .12)', color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / .3)' }}>
            <AlertTriangle size={22} />
          </div>
          <h2 className="cf-display text-lg">Confirm Deletion</h2>
          <p className="text-[13px] mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Are you sure you want to delete <strong>{deleteTarget?.company_name}</strong>? This action will disable their workspace access and cannot be undone.
          </p>
          <div className="flex gap-2 mt-5 justify-center">
            <button className="cf-btn cf-btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="cf-btn cf-btn-danger" onClick={() => handleConfirmDelete(deleteTarget.id)}>Delete</button>
          </div>
        </div>
      </Modal>

      {/* ═══ INVITE CLIENT MODAL ═══ */}
      <Modal open={!!inviteTarget} onClose={closeInviteModal} width={480}>
        {generatedLink ? (
          /* Fallback: email delivery failed, show link to copy */
          <div className="p-6">
            <div className="text-center mb-5">
              <div className="mx-auto grid place-items-center rounded-2xl mb-3" style={{ width: 52, height: 52, background: 'hsl(var(--primary) / .12)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / .3)' }}>
                <Copy size={22} />
              </div>
              <h2 className="cf-display text-lg">Copy Invite Link</h2>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                We couldn&apos;t deliver the automated email. Share this link directly:
              </p>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 block" style={{ color: 'hsl(var(--faint-foreground))' }}>Direct Onboarding Link</label>
              <div className="flex gap-2">
                <input readOnly className="cf-input cf-mono text-[11px]" value={generatedLink} onClick={e => e.target.select()} />
                <button className="cf-btn cf-btn-primary shrink-0" onClick={handleCopyLink}>
                  {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
            </div>
            <button className="cf-btn cf-btn-secondary w-full mt-4" onClick={closeInviteModal}>Done</button>
          </div>
        ) : (
          /* Initial Invite Form */
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="grid place-items-center rounded-xl" style={{ width: 40, height: 40, background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--cyan)))', color: 'white' }}>
                <Mail size={18} />
              </div>
              <div>
                <h2 className="cf-display text-lg">Setup Client Portal</h2>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>for {inviteTarget?.company_name}</p>
              </div>
            </div>
            <form onSubmit={handleInviteClient} className="space-y-4">
              <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'hsl(var(--surface-1))', border: '1px solid hsl(var(--border))' }}>
                <GradAvatar name={inviteTarget?.company_name} hue={(inviteTarget?.company_name?.split('').reduce((a,c) => a+c.charCodeAt(0),0)||0)*37%360} size={32} />
                <div>
                  <div className="text-[13px] font-semibold">{inviteTarget?.company_name}</div>
                  <div className="text-[11px]" style={{ color: 'hsl(var(--faint-foreground))' }}>Configure workspace onboarding parameters</div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 block" style={{ color: 'hsl(var(--faint-foreground))' }}>Contact name</label>
                <input className="cf-input" value={inviteForm.name} onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })} required placeholder="e.g. Alice Smith" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 block" style={{ color: 'hsl(var(--faint-foreground))' }}>Email address</label>
                <input className="cf-input" type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} required placeholder="alice@acme.com" />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 block" style={{ color: 'hsl(var(--faint-foreground))' }}>Client Roadmap & Resource Link</label>
                <input type="url" className="cf-input text-[13px]" value={inviteForm.roadmapUrl} onChange={e => setInviteForm({ ...inviteForm, roadmapUrl: e.target.value })} required placeholder="Roadmap URL" />
                <p className="text-[11px] mt-1.5" style={{ color: 'hsl(var(--faint-foreground))' }}>
                  Links clients to automated growth roadmaps. Defaults to GreyMatterX launch roadmap.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 block" style={{ color: 'hsl(var(--faint-foreground))' }}>Contract PDF Attachment (Optional)</label>
                <div className="rounded-xl p-4" style={{ border: '1px dashed hsl(var(--border-strong))', background: 'hsl(var(--surface-1))' }}>
                  {inviteForm.contractUrl ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <FileText size={18} style={{ color: 'hsl(var(--muted-foreground))' }} />
                        <div>
                          <div className="text-[13px] font-medium break-all">{inviteForm.contractName || 'contract.pdf'}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--st-approved))' }}>Uploaded successfully</div>
                        </div>
                      </div>
                      <button type="button" className="cf-btn cf-btn-ghost cf-btn-sm !px-1.5" onClick={() => setInviteForm({ ...inviteForm, contractUrl: '', contractName: '' })}>
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="application/pdf"
                        id="contract-pdf-upload"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          if (file.type !== 'application/pdf') { addToast('Please upload a PDF file only', 'error'); return; }
                          if (file.size > 10 * 1024 * 1024) { addToast('Contract PDF must be less than 10MB', 'error'); return; }

                          setInviteForm(prev => ({ ...prev, contractName: 'Uploading...' }));
                          try {
                            const presignRes = await fetch('/api/upload/presign', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ filename: file.name, contentType: file.type, clientId: inviteTarget.id || 'contracts' })
                            });
                            const presignData = await presignRes.json();
                            if (presignData.error) throw new Error(presignData.error);

                            const uploadRes = await fetch(presignData.presignedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
                            if (!uploadRes.ok) throw new Error('Upload to storage failed');

                            setInviteForm(prev => ({ ...prev, contractUrl: presignData.publicUrl, contractName: file.name }));
                            addToast('Contract PDF uploaded successfully!', 'success');
                          } catch (err) {
                            console.error(err);
                            setInviteForm(prev => ({ ...prev, contractUrl: '', contractName: '' }));
                            addToast('Failed to upload contract PDF', 'error');
                          }
                        }}
                      />
                      <label htmlFor="contract-pdf-upload" className="flex flex-col items-center gap-2 cursor-pointer py-2">
                        <Upload size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
                        <span className="text-[13px] font-medium">
                          {inviteForm.contractName === 'Uploading...' ? 'Uploading contract...' : 'Upload Contract PDF'}
                        </span>
                        <span className="text-[11px]" style={{ color: 'hsl(var(--faint-foreground))' }}>Direct-to-storage PDF upload (Max 10MB)</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                <button type="button" className="cf-btn cf-btn-secondary" onClick={closeInviteModal} disabled={inviteLoading}>Cancel</button>
                <button type="submit" className="cf-btn cf-btn-primary" disabled={inviteLoading}>
                  {inviteLoading ? 'Sending...' : 'Send Setup Invite'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
