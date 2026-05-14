'use client';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function InviteTeamModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const addToast = useToast();

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const role = formData.get('role');
    const name = formData.get('name');

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, name }),
      });
      
      if (!res.ok) throw new Error((await res.json()).error);
      
      addToast('Invitation sent successfully!', 'success');
      setIsOpen(false);
    } catch (err) {
      addToast(err.message || 'Failed to send invite', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        Invite Team Member
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content fade-in" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Invite Team Member</h2>
              <button className="btn-icon" onClick={() => setIsOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input name="name" type="text" className="form-input" required placeholder="Jane Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input name="email" type="email" className="form-input" required placeholder="jane@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select name="role" className="form-select" required>
                  <option value="team">Team Member</option>
                  <option value="admin">Administrator</option>
                </select>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Admins have full access to billing, client management, and team settings.
                </p>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
