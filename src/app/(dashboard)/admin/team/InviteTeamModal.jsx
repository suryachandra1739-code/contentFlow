'use client';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function InviteTeamModal({ onInviteSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
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
      
      addToast('Invitation sent successfully!', 'success');
      if (result.inviteLink) {
        setGeneratedLink(result.inviteLink);
      } else {
        setIsOpen(false);
      }
      if (onInviteSuccess) onInviteSuccess();
    } catch (err) {
      addToast(err.message || 'Failed to send invite', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    addToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setIsOpen(false);
    setGeneratedLink('');
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        Invite Team Member
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content fade-in" style={{ maxWidth: 440 }}>
            {generatedLink ? (
              /* Success Screen with Copy Link option */
              <div>
                <div className="modal-header">
                  <h2>Invite Link Generated</h2>
                  <button className="btn-icon" onClick={handleClose}>✕</button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ textAlign: 'center', margin: '8px 0' }}>
                    <span style={{ fontSize: 40 }}>✉️</span>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 12, color: 'var(--text-primary)' }}>Invitation link is ready!</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                      We attempted to email the invite. If the user didn't receive it, or if you prefer to invite them directly, you can copy the link below.
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
                        onClick={handleCopy}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={handleClose}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Initial Form Screen */
              <div>
                <div className="modal-header">
                  <h2>Invite Team Member</h2>
                  <button className="btn-icon" onClick={() => setIsOpen(false)}>✕</button>
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
                    <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)} disabled={loading}>Cancel</button>
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
