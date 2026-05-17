'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ client_id: '', name: '', description: '' });
  const [loading, setLoading] = useState(true);

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
    await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowModal(false);
    setForm({ client_id: '', name: '', description: '' });
    load();
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
          <Link href={`/projects/${project.id}`} key={project.id} className="card interactive-row" style={{display:'block'}}>
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
    </div>
  );
}
