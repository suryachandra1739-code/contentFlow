'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ company_name: '', contact_name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const addToast = useToast();
  const router = useRouter();

  const load = () => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClients(data);
        } else {
          console.error('Clients API error:', data);
          setClients([]);
        }
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
    console.log('CLIENT ADD RESULT:', result);
    if (result.error) {
      addToast(result.error, 'error');
      return;
    }
    setShowModal(false);
    setForm({ company_name: '', contact_name: '', email: '' });
    addToast('Client added!', 'success');
    setClients(prev => [result, ...prev]); // instantly update UI
    router.refresh(); // invalidate Next.js router cache for Vercel
  };

  const handleConfirmDelete = async (id) => {
    const res = await fetch(`/api/clients?clientId=${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.error) {
      addToast(result.error, 'error');
      setDeleteTarget(null);
      return;
    }
    addToast('Client deleted', 'success');
    setClients(prev => prev.filter(c => c.id !== id));
    setDeleteTarget(null);
    router.refresh();
  };

  if (loading) return <div className="fade-in empty-state">Loading clients...</div>;

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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-16">
                    <div className="avatar avatar-lg" style={{ background: c.avatar_color || '#161616', width: 40, height: 40, fontSize: 16 }}>{c.company_name?.[0]}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{c.company_name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.contact_name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{c.email}</div>
                    </div>
                  </div>
                  <button className="btn-delete" onClick={() => setDeleteTarget(c)} title="Delete client">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
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
                  <label className="form-label">Company name</label>
                  <input className="form-input" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required placeholder="e.g. Acme Corp" />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact name</label>
                  <input className="form-input" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="e.g. Alice Smith" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="alice@acme.com" />
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

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="btn-icon" onClick={() => setDeleteTarget(null)} style={{ fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Are you sure you want to delete <strong>{deleteTarget.company_name}</strong>? This action cannot be undone.
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
