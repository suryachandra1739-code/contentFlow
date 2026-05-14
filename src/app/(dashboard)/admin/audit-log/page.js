import { createClientServer } from '@/lib/supabase-server';

export default async function AuditLogPage({ searchParams }) {
  const supabase = await createClientServer();
  
  const filterAction = searchParams.action || 'all';

  let query = supabase
    .from('audit_log')
    .select('*, clients(company_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (filterAction !== 'all') {
    query = query.like('action', `%${filterAction}%`);
  }

  const { data: logs } = await query;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--sans)' }}>Audit Log</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>System-wide chronological activity log.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            className="form-select" 
            defaultValue={filterAction}
            onChange={`window.location.href='?action='+this.value`}
            style={{ width: 'auto' }}
          >
            <option value="all">All Actions</option>
            <option value="post">Posts</option>
            <option value="client">Clients</option>
            <option value="project">Projects</option>
            <option value="user">Users</option>
          </select>
          <button className="btn btn-secondary">Export CSV</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Date & Time</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>User</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Action</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Client Context</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs?.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs found.</td>
                  </tr>
                )}
                {logs?.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }} className="interactive-row">
                    <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {log.user_name || 'System / Anonymous'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 13 }}>
                      <span className="badge" style={{ background: 'var(--bg-layer)' }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {log.clients?.company_name || '—'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
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
