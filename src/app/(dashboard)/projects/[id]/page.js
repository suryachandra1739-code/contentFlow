'use client';
import PageTransition from '@/components/PageTransition';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import PlatformBadge from '@/components/PlatformBadge';
import { useToast } from '@/components/Toast';

const parsePostCaption = (caption) => {
  if (!caption) return { title: 'Untitled', description: '' };
  if (caption.startsWith('Title: ')) {
    const doubleNewline = caption.indexOf('\n\n');
    if (doubleNewline !== -1) {
      return {
        title: caption.substring(7, doubleNewline),
        description: caption.substring(doubleNewline + 2)
      };
    }
    const singleNewline = caption.indexOf('\n');
    if (singleNewline !== -1) {
      return {
        title: caption.substring(7, singleNewline),
        description: caption.substring(singleNewline + 1)
      };
    }
  }
  return { title: caption.substring(0, 40) + (caption.length > 40 ? '...' : ''), description: caption };
};

const getExpiryDetails = (createdAt) => {
  if (!createdAt) return { label: '7d left', color: 'var(--text-muted)', bg: 'transparent' };
  const expiry = new Date(new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000);
  const diffMs = expiry - Date.now();
  if (diffMs <= 0) return { label: 'Expired', color: 'var(--red)', bg: 'rgba(229,72,77,0.1)' };
  
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  let label = '';
  if (diffDays > 0) {
    label = `${diffDays}d ${diffHours}h left`;
  } else {
    label = `${diffHours}h left`;
  }

  if (diffMs < 24 * 60 * 60 * 1000) {
    return { label, color: 'var(--red)', bg: 'rgba(229,72,77,0.15)' };
  } else if (diffMs < 3 * 24 * 60 * 60 * 1000) {
    return { label, color: 'var(--amber)', bg: 'rgba(245,166,35,0.12)' };
  }
  return { label, color: 'var(--text-muted)', bg: 'transparent' };
};

export default function ProjectDetail() {
  const { id } = useParams();
  const router = useRouter();
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
    <PageTransition><div className="fade-in">
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
        {filtered.map(post => {
          const titleText = parsePostCaption(post.caption).title || 'Untitled Post';
          const descriptionText = parsePostCaption(post.caption).description || 'No caption provided.';
          const expiryDetails = getExpiryDetails(post.created_at);

          return (
            <div 
              key={post.id} 
              className="flight-card flight-card--split"
              onClick={(e) => {
                if (!e.target.closest('.flight-card__actions') && !e.target.closest('a') && !e.target.closest('button')) {
                  router.push(`/posts/${post.id}`);
                }
              }}
            >
              <div className="flight-card__image-container">
                {post.media_url ? (
                  post.media_type === 'video' ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <video 
                        className="flight-card__image" 
                        src={post.media_url} 
                        preload="metadata" 
                        playsInline 
                        muted 
                        style={{ pointerEvents: 'none' }} 
                      />
                      <div className="play-overlay">
                        <div className="play-button-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img className="flight-card__image" src={post.media_url} alt="" loading="lazy" />
                  )
                ) : (
                  <div className={`flight-card__image fallback-gradient fallback-${post.platform}`}>
                    <span className="fallback-icon">
                      {post.platform === 'instagram' ? '📷' : post.platform === 'facebook' ? '📘' : '🎬'}
                    </span>
                    <span className="fallback-label">{post.platform}</span>
                  </div>
                )}
              </div>
              <div className="flight-card__content">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px', marginBottom: '8px' }}>
                    <h2 className="flight-card__title" style={{ margin: 0 }}>{titleText}</h2>
                    <StatusBadge status={post.status} />
                  </div>
                  <div className="flight-card__details">
                    <div className="flight-card__detail-item">
                      <span style={{ color: expiryDetails.color, fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        ⏰ <strong>{expiryDetails.label}</strong>
                      </span>
                    </div>
                  </div>
                  <p style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '0.85em', 
                    lineHeight: '1.4',
                    margin: '0 0 1.25rem 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '2.8em'
                  }}>
                    {descriptionText}
                  </p>
                </div>
                
                <div className="flight-card__actions">
                  <Link 
                    href={`/posts/${post.id}`} 
                    className="flight-card__search-btn" 
                    style={{ textDecoration: 'none' }}
                  >
                    View Details
                  </Link>
                  {post.status === 'draft' && (
                    <button 
                      className="flight-card__favorite-btn" 
                      onClick={() => sendForReview(post.id)}
                      title="Send for Review"
                      style={{ color: 'var(--accent)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    </button>
                  )}
                  {post.review_token && post.status !== 'draft' && (
                    <button 
                      className="flight-card__favorite-btn" 
                      onClick={() => { 
                        navigator.clipboard.writeText(`${window.location.origin}/review/${post.review_token}`); 
                        addToast('Review link copied!', 'success'); 
                      }}
                      title="Copy Link"
                      style={{ color: 'var(--accent)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
  </PageTransition>
  );
}
