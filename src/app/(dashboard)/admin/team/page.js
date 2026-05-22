'use client';
import { useState, useEffect } from 'react';
import InviteTeamModal from './InviteTeamModal';

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

  useEffect(() => {
    fetch('/api/admin/team')
      .then(r => r.json())
      .then(data => {
        setTeamMembers(data.teamMembers || []);
        setPostCounts(data.postCounts || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="fade-in empty-state">Loading team...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--sans)' }}>Team Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage admin and team access.</p>
        </div>
        <InviteTeamModal />
      </div>

      {isMobile ? (
        /* Mobile: Card Layout */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              <div className="mobile-team-stats">
                <span>Posts: <strong>{postCounts[member.id] || 0}</strong></span>
                <span>Joined: <strong>{new Date(member.created_at).toLocaleDateString()}</strong></span>
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
                      <td style={{ padding: '16px 24px', fontSize: 14, fontFamily: 'var(--mono)', color: 'var(--text-primary)' }}>
                        {postCounts[member.id] || 0}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button className="btn btn-sm" style={{ background: 'transparent', border: '1px solid var(--border)' }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
