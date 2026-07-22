'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const activityDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function ActivitySkeleton() {
  return (
    <div className="segmented-list" style={{ pointerEvents: 'none' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="segmented-list-item" style={{ justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div className="skeleton-circle skeleton-shimmer" style={{ width: '6px', height: '6px' }}></div>
            <div className="skeleton-line skeleton-shimmer medium" style={{ flex: 1 }}></div>
          </div>
          <div className="skeleton-line skeleton-shimmer short" style={{ width: '80px' }}></div>
        </div>
      ))}
    </div>
  );
}

export default function RecentActivity({ recentActivity, loading }) {
  const [deferredRecentActivity, setDeferredRecentActivity] = useState([]);

  useEffect(() => {
    if (recentActivity) {
      const deferTask = () => {
        if (typeof window !== 'undefined' && 'scheduler' in window && window.scheduler.yield) {
          window.scheduler.yield().then(() => {
            setDeferredRecentActivity(recentActivity);
          });
        } else if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          window.requestIdleCallback(() => {
            setDeferredRecentActivity(recentActivity);
          });
        } else {
          setTimeout(() => {
            setDeferredRecentActivity(recentActivity);
          }, 50);
        }
      };
      deferTask();
    } else {
      setDeferredRecentActivity([]);
    }
  }, [recentActivity]);

  if (loading) {
    return <ActivitySkeleton />;
  }

  if (!recentActivity || recentActivity.length === 0) {
    return <div className="empty-state" style={{ padding: '40px 0' }}>No recent activity</div>;
  }

  if (deferredRecentActivity.length === 0) {
    return <ActivitySkeleton />;
  }

  const actionLabels = {
    post_created: 'Post created',
    post_approved: 'Post approved',
    post_revision: 'Revision requested',
    post_rejected: 'Post rejected',
    post_updated: 'Post updated',
    post_deleted: 'Post deleted',
    post_published: 'Post published',
    post_publish_failed: 'Publish failed',
    post_status_pending: 'Sent for review',
    post_status_approved: 'Post approved',
    post_status_rejected: 'Post rejected',
    post_status_revision: 'Revision requested',
    client_created: 'Client created',
    client_deleted: 'Client deleted',
    project_created: 'Project created',
    project_deleted: 'Project deleted',
  };

  const dotColors = {
    post_created: 'var(--accent)',
    post_approved: 'var(--green)',
    post_revision: 'var(--amber)',
    post_rejected: 'var(--accent)',
    post_updated: 'var(--cyan)',
    post_published: 'var(--green)',
    post_publish_failed: 'var(--accent)',
    post_status_pending: 'var(--amber)',
    post_status_approved: 'var(--green)',
    post_status_rejected: 'var(--accent)',
    post_status_revision: 'var(--cyan)',
    client_created: 'var(--text-muted)',
    client_deleted: 'var(--accent)',
    project_created: 'var(--text-muted)',
    project_deleted: 'var(--accent)',
  };

  return (
    <div className="segmented-list">
      {deferredRecentActivity.slice(0, 8).map((item, i) => {
        const getActivityLink = () => {
          if (item.entity_type === 'post' && item.entity_id) return `/posts/${item.entity_id}`;
          if (item.entity_type === 'client') return `/clients`;
          if (item.entity_type === 'project' && item.entity_id) return `/projects/${item.entity_id}`;
          return null;
        };
        const activityLink = getActivityLink();

        const innerContent = (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColors[item.action] || 'var(--accent)', flexShrink: 0 }}></div>
              <div className="truncate" style={{ fontSize: '15px', fontFamily: 'var(--sans)', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.user_name || 'System'}</strong> <span style={{ opacity: 0.3, margin: '0 12px' }}>/</span> {actionLabels[item.action] || item.action}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: 'auto' }}>
              <div style={{ fontSize: '14px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontWeight: 400 }}>
                {activityDateFormatter.format(new Date(item.created_at))}
              </div>
              {activityLink && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>}
            </div>
          </>
        );

        if (activityLink) {
          return (
            <Link href={activityLink} key={item.id || i} className="segmented-list-item" style={{ justifyContent: 'space-between', textDecoration: 'none' }}>
              {innerContent}
            </Link>
          );
        } else {
          return (
            <div key={item.id || i} className="segmented-list-item" style={{ justifyContent: 'space-between' }}>
              {innerContent}
            </div>
          );
        }
      })}
    </div>
  );
}
