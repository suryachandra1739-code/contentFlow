'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/analytics').then(r => r.json()).then(setData); }, []);

  if (!data) return <div className="fade-in empty-state">Loading analytics...</div>;

  const statusColors = { draft: '#888888', pending: 'var(--amber)', approved: 'var(--green)', revision: 'var(--cyan)', rejected: 'var(--red)' };
  const maxStatus = Math.max(...Object.values(data.byStatus || {}), 1);
  const maxPlatform = Math.max(...Object.values(data.byPlatform || {}), 1);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Insights and data across your content workflow.</p>
      </div>

      <div className="stats-grid">
        <Link href="/" className="stat-card slide-up stagger-1" style={{display:'block',textDecoration:'none'}}>
          <div className="stat-card-value">{data.total}</div>
          <div className="stat-card-label">Total posts</div>
        </Link>
        <Link href="/" className="stat-card slide-up stagger-2" style={{display:'block',textDecoration:'none'}}>
          <div className="stat-card-value">{data.approvalRate}%</div>
          <div className="stat-card-label">Approval rate</div>
        </Link>
        <Link href="/" className="stat-card slide-up stagger-3" style={{display:'block',textDecoration:'none'}}>
          <div className="stat-card-value">{data.byStatus?.pending || 0}</div>
          <div className="stat-card-label">Awaiting review</div>
        </Link>
        <Link href="/" className="stat-card slide-up stagger-4" style={{display:'block',textDecoration:'none'}}>
          <div className="stat-card-value">{(data.byStatus?.revision || 0) + (data.byStatus?.rejected || 0)}</div>
          <div className="stat-card-label">Need attention</div>
        </Link>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <div className="card">
          <div className="card-body">
            <h2 style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 24 }}>By status</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.entries(data.byStatus || {}).map(([status, count]) => (
                <div key={status}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontFamily: 'var(--sans)', fontWeight: 500, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{status}</span>
                    <span style={{ fontSize: 14, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-layer)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / maxStatus) * 100}%`, background: statusColors[status] || 'var(--text-secondary)', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h2 style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 24 }}>By platform</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.entries(data.byPlatform || {}).map(([platform, count]) => (
                <div key={platform}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontFamily: 'var(--sans)', fontWeight: 500, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {platform}
                    </span>
                    <span style={{ fontSize: 14, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-layer)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / maxPlatform) * 100}%`, background: 'var(--accent)', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
