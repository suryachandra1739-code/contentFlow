'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { motion } from 'framer-motion';
import { Plus, Trash2, FolderKanban, ArrowRight, AlertTriangle, X } from 'lucide-react';
import { PageHeader, Modal, GradAvatar, EmptyState } from '@/components/bits';
import { createClientBrowser } from '@/lib/supabase';

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div>
        <PageHeader title="Projects" sub="Loading projects..." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {[...Array(6)].map((_, i) => <div key={i} className="cf-skeleton h-48 w-full rounded-2xl" />)}
        </div>
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}

function ProjectsContent() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ client_id: '', name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFilter = searchParams.get('clientId');
  const addToast = useToast();

  const [userRole, setUserRole] = useState('team');
  const supabase = createClientBrowser();

  const load = () => {
    const projectsUrl = clientIdFilter ? `/api/projects?clientId=${clientIdFilter}` : '/api/projects';
    Promise.all([
      fetch(projectsUrl).then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([p, c]) => {
      setProjects(Array.isArray(p) ? p : []);
      setClients(Array.isArray(c) ? c : []);
      setLoading(false);
    }).catch(() => { setProjects([]); setClients([]); setLoading(false); });
  };

  useEffect(() => {
    if (clientIdFilter) {
      setForm(prev => ({ ...prev, client_id: clientIdFilter }));
    } else {
      setForm(prev => ({ ...prev, client_id: '' }));
    }
  }, [clientIdFilter]);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role) {
          setUserRole(profile.role);
        }
      }
    }
    loadUser();
    load();
  }, [clientIdFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const result = await res.json();
    setShowModal(false);
    setForm({ client_id: clientIdFilter || '', name: '', description: '' });
    if (!result.error) {
      setProjects(prev => [result, ...prev]);
      addToast('Project created', 'success');
      router.refresh();
    } else {
      addToast(result.error, 'error');
    }
  };

  const handleConfirmDelete = async (id) => {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.error) { addToast(result.error, 'error'); setDeleteTarget(null); return; }
    addToast('Project deleted', 'success');
    setProjects(prev => prev.filter(p => p.id !== id));
    setDeleteTarget(null);
    router.refresh();
  };

  const filteredClient = clientIdFilter && clients.find(c => c.id === clientIdFilter);

  return (
    <div>
      <PageHeader
        title="Projects"
        sub="Manage your content projects"
        actions={
          <div className="flex items-center gap-2">
            {clientIdFilter && filteredClient && (
              <div className="cf-badge" style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / .12)', borderColor: 'hsl(var(--primary) / .3)' }}>
                Client: {filteredClient.company_name}
                <button onClick={() => router.push('/projects')} className="ml-1 hover:opacity-70">✕</button>
              </div>
            )}
            {!loading && userRole !== 'client' && (
              <button className="cf-btn cf-btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={15} /> New project
              </button>
            )}
          </div>
        }
      />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {[...Array(6)].map((_, i) => <div key={i} className="cf-skeleton h-48 w-full rounded-2xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          body="Create your first project to start organizing content."
          action={userRole !== 'client' && <button className="cf-btn cf-btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> New project</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {projects.map(project => {
            const hash = project.clients?.company_name?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0;
            const hue = (hash * 37) % 360;

            return (
              <motion.div key={project.id} whileHover={{ y: -3 }} className="cf-card cf-card-hover relative anim-fade-up overflow-hidden">
                <Link href={`/projects/${project.id}`} className="block p-5" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <GradAvatar name={project.clients?.company_name} hue={hue} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold truncate">{project.name}</div>
                      <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{project.clients?.company_name || 'No client'}</div>
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-[13px] line-clamp-2 mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>{project.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                    <span className="cf-badge capitalize" style={{ color: 'hsl(var(--st-approved))', background: 'hsl(var(--st-approved) / .12)', borderColor: 'hsl(var(--st-approved) / .3)' }}>
                      {project.status || 'active'}
                    </span>
                    <ArrowRight size={14} style={{ color: 'hsl(var(--faint-foreground))' }} />
                  </div>
                </Link>
                {userRole !== 'client' && (
                  <button
                    className="absolute top-3 right-3 cf-btn cf-btn-ghost cf-btn-sm !px-1.5"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(project); }}
                    title="Delete project"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <h2 className="cf-display text-lg mb-4">New project</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 block" style={{ color: 'hsl(var(--faint-foreground))' }}>Client</label>
              <select className="cf-input" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} required>
                <option value="">Select a client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name} — {c.contact_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 block" style={{ color: 'hsl(var(--faint-foreground))' }}>Project name</label>
              <input className="cf-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Summer Campaign" required />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 block" style={{ color: 'hsl(var(--faint-foreground))' }}>Description</label>
              <textarea className="cf-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              <button type="button" className="cf-btn cf-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="cf-btn cf-btn-primary">Create project</button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} width={400}>
        <div className="p-6 text-center">
          <div className="mx-auto grid place-items-center rounded-2xl mb-4" style={{ width: 52, height: 52, background: 'hsl(var(--destructive) / .12)', color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / .3)' }}>
            <AlertTriangle size={22} />
          </div>
          <h2 className="cf-display text-lg">Confirm Deletion</h2>
          <p className="text-[13px] mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-2 mt-5 justify-center">
            <button className="cf-btn cf-btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="cf-btn cf-btn-danger" onClick={() => handleConfirmDelete(deleteTarget.id)}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
