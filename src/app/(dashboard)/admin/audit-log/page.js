import { createClientServer } from '@/lib/supabase-server';

export default async function AuditLogPage({ searchParams }) {
  const params = await searchParams;
  const supabase = await createClientServer();
  
  const filterAction = params.action || 'all';

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
    <PageTransition><div className="fade-in">
      <div className="audit-header-container">
        <div>
          <h1>Audit Log</h1>
          <p>System-wide chronological activity log.</p>
        </div>
        <form style={{ display: 'flex', gap: 12 }}>
          <select 
            className="form-select" 
            name="action"
            defaultValue={filterAction}
            style={{ width: 'auto' }}
          >
            <option value="all">All Actions</option>
            <option value="post">Posts</option>
            <option value="client">Clients</option>
            <option value="project">Projects</option>
            <option value="user">Users</option>
          </select>
          <button type="submit" className="btn btn-secondary">Filter</button>
        </form>
      </div>

      {/* Desktop view (table) */}
      <div className="card hide-on-mobile">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, textTransform: 'uppercase' }}>
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
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {log.user_name || 'System / Anonymous'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 15 }}>
                      <span className="badge" style={{ background: 'var(--bg-layer)' }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 15, color: 'var(--text-secondary)' }}>
                      {log.clients?.company_name || '—'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--mono)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile view (cards list) */}
      <div className="show-on-mobile">
        {logs?.length === 0 ? (
          <div className="empty-state">No audit logs found.</div>
        ) : (
          <div className="segmented-list">
            {logs?.map(log => (
              <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent)' }}></div>
                    <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>
                      {log.user_name || 'System / Anonymous'}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <span className="badge" style={{ background: 'var(--bg-layer)', textTransform: 'capitalize', fontSize: 13 }}>
                    {log.action}
                  </span>
                  {log.clients?.company_name && (
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      Client: <strong>{log.clients.company_name}</strong>
                    </span>
                  )}
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div style={{ 
                    marginTop: 8, 
                    padding: 8, 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: 6, 
                    fontSize: 13, 
                    fontFamily: 'var(--mono)', 
                    color: 'var(--text-muted)',
                    wordBreak: 'break-all',
                    maxHeight: 80,
                    overflowY: 'auto'
                  }}>
                    {JSON.stringify(log.metadata)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </PageTransition>
  );
}
