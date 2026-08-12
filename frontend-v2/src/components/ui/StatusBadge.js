/* Status badge — maps post.status to styled pill */
export default function StatusBadge({ status, size = 'md' }) {
  const map = {
    draft:    { label: 'Draft',    cls: 'badge-draft' },
    pending:  { label: 'In Review', cls: 'badge-pending' },
    approved: { label: 'Approved',  cls: 'badge-approved' },
    revision: { label: 'Revision',  cls: 'badge-revision' },
    rejected: { label: 'Rejected',  cls: 'badge-rejected' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'badge-draft' };

  const dotColor = {
    draft:    'var(--text-3)',
    pending:  'var(--amber)',
    approved: 'var(--green)',
    revision: 'var(--sky)',
    rejected: 'var(--red)',
  }[status] || 'var(--text-3)';

  return (
    <span className={`badge ${cls}`} style={size === 'sm' ? { fontSize: 10, padding: '2px 6px' } : {}}>
      <span className="badge-dot" style={{ backgroundColor: dotColor }} />
      {label}
    </span>
  );
}
