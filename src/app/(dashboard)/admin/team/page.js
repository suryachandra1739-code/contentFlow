'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import InviteTeamModal from './InviteTeamModal';
import { useToast } from '@/components/Toast';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [postCounts, setPostCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const addToast = useToast();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'team' });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTeam = () => {
    fetch('/api/admin/team')
      .then(r => r.json())
      .then(data => {
        setTeamMembers(data.teamMembers || []);
        setPostCounts(data.postCounts || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  useEffect(() => {
    if (editTarget) {
      setEditForm({
        name: editTarget.name || '',
        email: editTarget.email || '',
        role: editTarget.role || 'team'
      });
    }
  }, [editTarget]);

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editTarget.id,
          name: editForm.name,
          email: editForm.email,
          role: editForm.role
        })
      });
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        addToast('Team member updated successfully!', 'success');
        setEditTarget(null);
        fetchTeam();
      }
    } catch (err) {
      addToast('Failed to update team member', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/team?userId=${deleteTarget.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        addToast('Team member deleted successfully!', 'success');
        setDeleteTarget(null);
        fetchTeam();
      }
    } catch (err) {
      addToast('Failed to delete team member', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <div className="fade-in empty-state">Loading team...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--sans)' }}>Team Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage admin and team access.</p>
        </div>
        <InviteTeamModal onInviteSuccess={fetchTeam} />
      </div>

      {isMobile ? (
        /* Mobile: Card Layout */
        <div className="segmented-list">
          {teamMembers?.map(member => (
            <div className="mobile-team-card" key={member.id}>
              <div className="mobile-team-header">
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{member.name || 'Pending Invite'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge" style={{ background: member.role === 'admin' ? 'rgba(229,72,77,0.1)' : 'var(--bg-layer)', color: member.role === 'admin' ? 'var(--red)' : 'var(--text-primary)', fontSize: 10 }}>
                    {member.role.toUpperCase()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: member.is_active ? 'var(--green)' : 'var(--text-muted)' }}>
                    <span style={{ width: 5, height: 5, borderRadius: 3, background: member.is_active ? 'var(--green)' : 'var(--text-muted)' }} />
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="mobile-team-stats" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 12, color: 'var(--text-muted)', fontSize: 12 }}>
                  <span>
                    Posts:{' '}
                    <Link 
                      href={`/?authorId=${member.id}`} 
                      style={{ 
                        color: 'var(--accent)', 
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      {postCounts[member.id] || 0}
                    </Link>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    onClick={() => setEditTarget(member)}
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-danger" 
                    onClick={() => setDeleteTarget(member)}
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(!teamMembers || teamMembers.length === 0) && (
            <div className="empty-state">No team members found.</div>
          )}
        </div>
      ) : (
        /* Desktop: Table Layout */
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 24px', fontWeight: 500 }}>Name</th>
                    <th style={{ padding: '16px 24px', fontWeight: 500 }}>Role</th>
                    <th style={{ padding: '16px 24px', fontWeight: 500 }}>Status</th>
                    <th style={{ padding: '16px 24px', fontWeight: 500 }}>Posts Created</th>
                    <th style={{ padding: '16px 24px', fontWeight: 500 }}>Joined</th>
                    <th style={{ padding: '16px 24px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers?.map(member => (
                    <tr key={member.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{member.name || 'Pending Invite'}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{member.email}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span className={`badge`} style={{ background: member.role === 'admin' ? 'rgba(229,72,77,0.1)' : 'var(--bg-layer)', color: member.role === 'admin' ? 'var(--red)' : 'var(--text-primary)' }}>
                          {member.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: member.is_active ? 'var(--green)' : 'var(--text-muted)' }}>
                          <span style={{ width: 6, height: 6, borderRadius: 3, background: member.is_active ? 'var(--green)' : 'var(--text-muted)' }} />
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 14, fontFamily: 'var(--mono)' }}>
                        <Link 
                          href={`/?authorId=${member.id}`} 
                          className="hover-underline"
                          style={{ 
                            color: 'var(--accent)', 
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          {postCounts[member.id] || 0}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                        </Link>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button 
                            className="btn btn-sm btn-secondary" 
                            onClick={() => setEditTarget(member)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={() => setDeleteTarget(member)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Edit Team Member</h2>
              <button className="btn-icon" onClick={() => setEditTarget(null)} style={{ fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    className="form-input" 
                    value={editForm.name} 
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                    required 
                    placeholder="Jane Doe" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    className="form-input" 
                    type="email" 
                    value={editForm.email} 
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })} 
                    required 
                    placeholder="jane@company.com" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select 
                    className="form-select" 
                    value={editForm.role} 
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })} 
                    required
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-layer)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                  >
                    <option value="team">Team Member</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditTarget(null)} disabled={editLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
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
                Are you sure you want to delete <strong>{deleteTarget.name || deleteTarget.email}</strong>? This will revoke their access to the workspace.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
