'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import PlatformBadge from '@/components/PlatformBadge';
import { useToast } from '@/components/Toast';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [filter, setFilter] = useState('all');
  const addToast = useToast();

  useEffect(() => { fetch(`/api/projects/${id}`).then(r => r.json()).then(setProject); }, [id]);

  if (!project) return <div style={{padding:60,textAlign:'center',color:'var(--text-muted)'}}>Loading...</div>;

  const posts = project.posts || [];
  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter);

  const sendForReview = async (postId) => {
    await fetch(`/api/posts/${postId}/status`, { method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: 'pending' }) });
    addToast('Sent for review!', 'success');
    fetch(`/api/projects/${id}`).then(r => r.json()).then(setProject);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <Link href="/projects" style={{fontSize:13,color:'var(--text-muted)',display:'inline-flex',alignItems:'center',gap:4,marginBottom:8}}>← Back to Projects</Link>
        <div className="flex items-center gap-16">
          <div className="avatar avatar-lg" style={{background:project.clients?.avatar_color || '#161616'}}>{project.clients?.company_name?.[0] || '?'}</div>
          <div>
            <h1>{project.name}</h1>
            <p>{project.clients?.company_name || 'No client'} · {posts.length} posts</p>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        {['all','draft','pending','approved','revision','rejected'].map(s => (
          <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && ` (${posts.filter(p => p.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="content-grid">
        {filtered.map(post => (
          <div key={post.id} className="card post-card">
            <div className="post-card-media">
              {post.media_url ? (
                post.media_type === 'video' ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <video src={post.media_url} style={{ pointerEvents: 'none' }} />
                    <div className="play-overlay">
                      <div className="play-button-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img src={post.media_url} alt="" />
                )
              ) : (
                <div className={`fallback-gradient fallback-${post.platform}`}>
                  <span className="fallback-icon">
                    {post.platform === 'instagram' ? '📷' : post.platform === 'facebook' ? '📘' : '🎬'}
                  </span>
                  <span className="fallback-label">{post.platform}</span>
                </div>
              )}
            </div>
            <div className="card-body">
              <div className="post-card-header">
                <PlatformBadge platform={post.platform} />
                <StatusBadge status={post.status} />
              </div>
              <div className="post-card-caption">{post.caption || 'No caption yet'}</div>
              <div className="post-card-footer">
                <Link href={`/posts/${post.id}`} className="btn btn-secondary btn-sm">View Details</Link>
                {post.status === 'draft' && <button className="btn btn-primary btn-sm" onClick={() => sendForReview(post.id)}>Send for Review</button>}
                {post.review_token && post.status !== 'draft' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/review/${post.review_token}`); addToast('Review link copied!', 'success'); }}>🔗 Copy Link</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No posts found</h3>
          <p>Create a new post for this project</p>
          <Link href="/posts/new" className="btn btn-primary">+ New Post</Link>
        </div>
      )}
    </div>
  );
}
