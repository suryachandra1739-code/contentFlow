'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import { createClientBrowser } from '@/lib/supabase';

function ProjectsContent() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ client_id: '', name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState('team');
  const addToast = useToast();
  const searchParams = useSearchParams();
  const clientFilter = searchParams.get('clientId');
  const supabase = createClientBrowser();

  const load = useCallback(() => {
    const url = clientFilter ? `/api/projects?clientId=${clientFilter}` : '/api/projects';
    Promise.all([
      fetch(url).then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([p, c]) => {
      setProjects(Array.isArray(p) ? p : []);
      setClients(Array.isArray(c) ? c : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [clientFilter]);

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('users').select('role').eq('id', user.id).single()
        .then(({ data }) => { if (data?.role) setUserRole(data.role); });
    });
  }, [clientFilter]);

  const createProject = async () => {
    if (!form.name.trim()) { addToast('Project name is required', 'error'); return; }
    setSaving(true);
    const res = await fetch('/api/projects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) { addToast(data.error, 'error'); return; }
    addToast('Project created', 'success');
    setShowModal(false);
    setForm({ client_id: '', name: '', description: '' });
    load();
  };

  const deleteProject = async () => {
    const res = await fetch(`/api/projects/${deleteTarget.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.error) { addToast(data.error, 'error'); } else {
      addToast('Project deleted', 'success');
      setProjects(p => p.filter(x => x.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  return (
    <div className="page-content page-enter">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--s-8)', flexWrap: 'wrap', gap: 'var(--s-4)' }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Organize content by project for each client.</p>
        </div>
        {userRole !== 'client' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="post-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card" style={{ height: 140 }}>
              <div className="card-body">
                <div className="skeleton skeleton-title" style={{ width: '60%', marginBottom: 8 }} />
                <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: 16 }} />
                <div className="skeleton skeleton-text" style={{ width: '80%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="empty-title">No projects yet</div>
          <div className="empty-text">Create a project to organize posts for a client.</div>
          {userRole !== 'client' && <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>}
        </div>
      ) : (
        <div className="post-grid">
          {projects.map(project => {
            const client = clients.find(c => c.id === project.client_id);
            return (
              <Link key={project.id} href={`/projects/${project.id}`} className="card card-hover card-accent-hover" style={{ textDecoration: 'none', display: 'block' }}>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--r-sm)',
                      background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                      </svg>
                    </div>
                    {userRole !== 'client' && (
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        style={{ color: 'var(--text-3)' }}
                        onClick={e => { e.preventDefault(); setDeleteTarget(project); }}
                        title="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-0)', marginBottom: 4 }}>{project.name}</div>
                    {project.description && (
                      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {project.description}
                      </div>
                    )}
                  </div>
                  {client && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: 'var(--s-3)', borderTop: '1px solid var(--border-0)' }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        background: client.avatar_color || 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: '#fff',
                      }}>
                        {client.company_name?.slice(0,2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{client.company_name}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="New Project"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={createProject} disabled={saving}>
              {saving ? 'Creating…' : 'Create Project'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
          <div className="form-group">
            <label className="form-label">Client</label>
            <select className="form-select" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
              <option value="">Select a client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input className="form-input" placeholder="e.g. Q4 Social Campaign" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description <span style={{ color: 'var(--text-3)' }}>(optional)</span></label>
            <textarea className="form-textarea" rows={3} placeholder="Brief description of this project…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Project"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={deleteProject}>Delete Project</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-1)', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text-0)' }}>{deleteTarget?.name}</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="page-content"><div className="page-title">Projects</div></div>}>
      <ProjectsContent />
    </Suspense>
  );
}
