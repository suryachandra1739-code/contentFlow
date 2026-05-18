'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ client_id: '', name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const addToast = useToast();

  const load = () => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([p, c]) => {
      setProjects(Array.isArray(p) ? p : []);
      setClients(Array.isArray(c) ? c : []);
      setLoading(false);
    }).catch(() => { setProjects([]); setClients([]); setLoading(false); });
  };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const result = await res.json();
    setShowModal(false);
    setForm({ client_id: '', name: '', description: '' });
    if (!result.error) {
      setProjects(prev => [result, ...prev]); // instantly update UI
      addToast('Project created', 'success');
      router.refresh();
    } else {
      addToast(result.error, 'error');
    }
  };

  const handleConfirmDelete = async (id) => {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.error) {
      addToast(result.error, 'error');
      setDeleteTarget(null);
      return;
    }
    addToast('Project deleted', 'success');
    setProjects(prev => prev.filter(p => p.id !== id));
    setDeleteTarget(null);
    router.refresh();
  };

  if (loading) return <div className="empty-state">Loading projects...</div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Projects</h1>
            <p>Manage your content projects</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>New project</button>
        </div>
      </div>

      <div className="content-grid">
        {projects.map(project => (
          <div className="card interactive-row" key={project.id} style={{position:'relative'}}>
            <Link href={`/projects/${project.id}`} style={{display:'block'}}>
              <div className="card-body">
                <div className="flex items-center gap-12 mb-16">
                  <div className="avatar" style={{background: project.clients?.avatar_color || '#161616'}}>{project.clients?.company_name?.[0] || '?'}</div>
                  <div>
                    <div style={{fontSize:15,fontWeight:600}}>{project.name}</div>
                    <div style={{fontSize:13,color:'var(--text-muted)'}}>{project.clients?.company_name || 'No client'}</div>
                  </div>
                </div>
                {project.description && <p style={{fontSize:14,color:'var(--text-secondary)',marginBottom:16,lineHeight:1.5}}>{project.description}</p>}
                <div style={{paddingTop:16,borderTop:'1px solid var(--border)'}}>
                  <span style={{fontSize:13,color:'var(--text-muted)'}}>{project.status || 'active'}</span>
                </div>
              </div>
            </Link>
            <button 
              className="btn-delete" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(project); }}
              title="Delete project"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 10
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="empty-state">
          No projects yet. Create your first project to start organizing content.
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New project</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)} style={{fontSize:20,color:'var(--text-muted)'}}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Client</label>
                  <select className="form-select" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required>
                    <option value="">Select a client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company_name} — {c.contact_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Project name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Summer Campaign" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief description..." rows={3} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="btn-icon" onClick={() => setDeleteTarget(null)} style={{ fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={() => handleConfirmDelete(deleteTarget.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
