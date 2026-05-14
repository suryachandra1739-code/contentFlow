import { createClientServer } from '@/lib/supabase';
import InviteTeamModal from './InviteTeamModal';

export default async function TeamManagementPage() {
  const supabase = await createClientServer();
  
  // Fetch all users except clients
  const { data: teamMembers } = await supabase
    .from('users')
    .select('*')
    .in('role', ['admin', 'team'])
    .order('created_at', { ascending: false });

  // Fetch post counts
  const { data: posts } = await supabase.from('posts').select('created_by');
  
  const postCounts = posts?.reduce((acc, post) => {
    acc[post.created_by] = (acc[post.created_by] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--sans)' }}>Team Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage admin and team access.</p>
        </div>
        <InviteTeamModal />
      </div>

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
                  <tr key={member.id} style={{ borderBottom: '1px solid var(--border)' }} className="interactive-row">
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
    </div>
  );
}
