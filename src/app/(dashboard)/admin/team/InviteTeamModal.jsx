'use client';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function InviteTeamModal({ onInviteSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
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
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      if (result.emailSent) {
        addToast(`Invitation email sent to ${email}!`, 'success');
        setIsOpen(false);
        e.target.reset();
      } else if (result.inviteLink) {
        // Email failed — show the link for manual sharing
        addToast('Email delivery failed. Copy the link below to share manually.', 'error');
        setInviteLink(result.inviteLink);
      } else {
        addToast('Invitation created successfully!', 'success');
        setIsOpen(false);
        e.target.reset();
      }

      if (onInviteSuccess) onInviteSuccess();
    } catch (err) {
      addToast(err.message || 'Failed to send invite', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    addToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setIsOpen(false);
    setInviteLink('');
    setCopied(false);
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        Invite Team Member
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            {inviteLink ? (
              /* Fallback: email failed, show link to copy */
              <div>
                <div className="modal-header">
                  <h2>Copy Invite Link</h2>
                  <button className="btn-icon" onClick={handleClose} style={{ fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
                </div>
                <div className="modal-body">
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 36 }}>📋</span>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                      We couldn't deliver the email. Share this link directly with the team member:
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text" readOnly className="form-input"
                      value={inviteLink}
                      style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--bg-layer)' }}
                      onClick={e => e.target.select()}
                    />
                    <button type="button" className="btn btn-primary" onClick={handleCopy} style={{ whiteSpace: 'nowrap' }}>
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={handleClose}>Done</button>
                </div>
              </div>
            ) : (
              /* Main invite form */
              <div>
                <div className="modal-header">
                  <h2>Invite Team Member</h2>
                  <button className="btn-icon" onClick={handleClose} style={{ fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
                </div>
                <form onSubmit={handleInvite}>
                  <div className="modal-body">
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
                      <select name="role" className="form-select" required style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-layer)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                        <option value="team">Team Member</option>
                        <option value="admin">Administrator</option>
                      </select>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                        Admins have full access to billing, client management, and team settings.
                      </p>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Sending...' : 'Send Invite'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
