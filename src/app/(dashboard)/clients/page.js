'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [inviteTarget, setInviteTarget] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '' });
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

  const handleInviteClient = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email,
          name: inviteForm.name,
          role: 'client',
          client_id: inviteTarget.id,
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
    setInviteForm({ name: '', email: '' });
    setGeneratedLink('');
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
            <div className="client-card" key={c.id}>
              <div className="card-body">
                <div className="client-card-header">
                  <div className="avatar avatar-lg" style={{ background: c.avatar_color || '#161616', width: 40, height: 40, fontSize: 16 }}>{c.company_name?.[0]}</div>
                  <div className="client-card-info">
                    <div className="client-company">{c.company_name}</div>
                    <div className="client-contact">{c.contact_name}</div>
                    <div className="client-email">{c.email}</div>
                  </div>
                </div>
                <div className="client-card-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => { setInviteTarget(c); setInviteForm({ name: c.contact_name || '', email: c.email || '' }); }}
                    title="Send portal login invite"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Invite Login
                  </button>
                  <button className="btn-delete" onClick={() => setDeleteTarget(c)} title="Delete client">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
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

      {/* Delete Confirmation Modal */}
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

      {/* Invite Client Login Modal */}
      {inviteTarget && (
        <div className="modal-overlay" onClick={closeInviteModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            {generatedLink ? (
              /* Fallback: email delivery failed, show link to copy */
              <div>
                <div className="modal-header">
                  <h2>Copy Invite Link</h2>
                  <button className="btn-icon" onClick={closeInviteModal} style={{ fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ textAlign: 'center', margin: '8px 0' }}>
                    <span style={{ fontSize: 36 }}>📋</span>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                      We couldn't deliver the email. Share this link directly with the client:
                    </p>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Direct Invite Link</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input 
                        type="text" 
                        readOnly 
                        className="form-input" 
                        value={generatedLink} 
                        style={{ fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--bg-layer)' }} 
                        onClick={e => e.target.select()}
                      />
                      <button 
                        type="button" 
                        className="btn btn-primary" 
                        onClick={handleCopyLink}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={closeInviteModal}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Initial Form Screen */
              <div>
                <div className="modal-header">
                  <h2>Invite Client Login</h2>
                  <button className="btn-icon" onClick={closeInviteModal} style={{ fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
                </div>
                <form onSubmit={handleInviteClient}>
                  <div className="modal-body">
                    <div style={{ padding: '12px 16px', background: 'var(--bg-layer)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar" style={{ background: inviteTarget.avatar_color || '#161616', width: 32, height: 32, fontSize: 13, flexShrink: 0 }}>{inviteTarget.company_name?.[0]}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{inviteTarget.company_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Portal access for this client</div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact name</label>
                      <input className="form-input" value={inviteForm.name} onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })} required placeholder="e.g. Alice Smith" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email address</label>
                      <input className="form-input" type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} required placeholder="alice@acme.com" />
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                        They will receive an email invitation to set their password and access the client portal.
                      </p>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeInviteModal} disabled={inviteLoading}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={inviteLoading}>
                      {inviteLoading ? 'Sending...' : 'Send Invite'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
