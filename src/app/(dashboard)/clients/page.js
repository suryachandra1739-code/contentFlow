'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '' });
  const addToast = useToast();

  const load = () => { fetch('/api/clients').then(r => r.json()).then(setClients); };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowModal(false);
    setForm({ name: '', email: '', company: '' });
    addToast('Client added!', 'success');
    load();
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div><h1>Clients</h1><p>Manage your client contacts</p></div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add client</button>
        </div>
      </div>
      
      {clients.length === 0 ? (
        <div className="empty-state">
          No clients yet. Add your first client to get started.
        </div>
      ) : (
        <div className="content-grid">
          {clients.map(c => (
            <div className="card" key={c.id}>
              <div className="card-body">
                <div className="flex items-center gap-16">
                  <div className="avatar avatar-lg" style={{ background: c.avatar_color, width: 40, height: 40, fontSize: 16 }}>{c.name?.[0]}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.company}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{c.email}</div>
                  </div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
                  {c.project_count} project{c.project_count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add client</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)} style={{ fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
