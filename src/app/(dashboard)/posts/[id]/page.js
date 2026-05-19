'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import PlatformBadge from '@/components/PlatformBadge';
import PlatformPreview from '@/components/PlatformPreview';
import { useToast } from '@/components/Toast';

export default function PostDetail() {
  const { id } = useParams();
  const addToast = useToast();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState('Creative Team');
  const [aspectRatio, setAspectRatio] = useState(null); // null = platform default

  const load = () => {
    fetch(`/api/posts/${id}`).then(r => r.json()).then(data => {
      if (data && !data.error) setPost(data);
    });
    fetch(`/api/posts/${id}/comments`).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setComments(data);
    });
  };
  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status) => {
    await fetch(`/api/posts/${id}/status`, { method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
    addToast(`Status updated to ${status}`, 'success');
    load();
  };

  const addCommentHandler = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await fetch(`/api/posts/${id}/comments`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content: comment, author_name: authorName, author_role: 'creator' }) });
    setComment('');
    addToast('Comment added', 'success');
    load();
  };

  const copyReviewLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/review/${post.review_token}`);
    addToast('Review link copied to clipboard!', 'success');
  };

  if (!post) return <div className="empty-state">Loading...</div>;

  const aspectOptions = [
    { key: null, label: 'Original' },
    { key: 'portrait', label: 'Portrait', ratio: '9:16' },
    { key: 'landscape', label: 'Landscape', ratio: '16:9' },
    { key: 'square', label: 'Square', ratio: '1:1' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <Link href={`/projects/${post.project_id}`} style={{fontSize:13,fontFamily:'var(--sans)',color:'var(--text-secondary)',display:'inline-flex',alignItems:'center',gap:4,marginBottom:8}}>← {post.projects?.name || 'Project'}</Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <PlatformBadge platform={post.platform} />
            <StatusBadge status={post.status} />
          </div>
          <div className="flex gap-8">
            {post.status === 'draft' && <button className="btn btn-primary btn-sm" onClick={() => updateStatus('pending')}>Send for review</button>}
            <button className="btn btn-secondary btn-sm" onClick={copyReviewLink}>Copy review link</button>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32,alignItems:'start'}}>
        <div>
          <div className="card" style={{marginBottom:24}}>
            <div className="card-body">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
                <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)',margin:0}}>Platform preview</h2>
                <div style={{display:'flex',gap:'4px',padding:'3px',background:'var(--bg-layer)',borderRadius:'var(--radius-pill)',border:'1px solid var(--border)',flexWrap:'wrap'}}>
                  {aspectOptions.map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => setAspectRatio(opt.key)}
                      style={{
                        padding:'5px 10px',
                        fontSize:'11px',
                        fontFamily:'var(--sans)',
                        fontWeight:500,
                        borderRadius:'var(--radius-pill)',
                        border:'none',
                        background: aspectRatio === opt.key ? 'var(--bg-card)' : 'transparent',
                        color: aspectRatio === opt.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                        boxShadow: aspectRatio === opt.key ? '0 1px 3px rgba(0,0,0,0.25)' : 'none',
                        cursor:'pointer',
                        transition:'all 0.15s ease',
                      }}
                    >
                      {opt.label}{opt.ratio ? ` (${opt.ratio})` : ''}
                    </button>
                  ))}
                </div>
              </div>
              <PlatformPreview platform={post.platform} caption={post.caption} hashtags={post.hashtags} mediaUrl={post.media_url} mediaType={post.media_type} aspectRatio={aspectRatio} />
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)',marginBottom:4}}>Status actions</h2>
              <p style={{fontSize:13,fontFamily:'var(--sans)',color:'var(--text-secondary)',marginBottom:16}}>Update the approval status</p>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button className="btn btn-secondary btn-sm" onClick={() => updateStatus('draft')}>Draft</button>
                <button className="btn btn-sm" style={{background:'var(--amber-soft)',color:'var(--amber)',border:'none',borderRadius:'var(--radius-sm)',fontWeight:500}} onClick={() => updateStatus('pending')}>Pending</button>
                <button className="btn btn-sm" style={{background:'var(--green-soft)',color:'var(--green)',border:'none',borderRadius:'var(--radius-sm)',fontWeight:500}} onClick={() => updateStatus('approved')}>Approve</button>
                <button className="btn btn-sm" style={{background:'var(--cyan-soft)',color:'var(--cyan)',border:'none',borderRadius:'var(--radius-sm)',fontWeight:500}} onClick={() => updateStatus('revision')}>Revision</button>
                <button className="btn btn-sm" style={{background:'var(--red-soft)',color:'var(--red)',border:'none',borderRadius:'var(--radius-sm)',fontWeight:500}} onClick={() => updateStatus('rejected')}>Reject</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{marginBottom:24}}>
            <div className="card-body">
              <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)',marginBottom:16}}>Comments ({comments.length})</h2>
              <div className="comment-list">
                {comments.map(c => (
                  <div className="comment-item" key={c.id} style={{display:'flex',gap:12,marginBottom:16}}>
                    <div className="comment-avatar avatar" style={{width:28,height:28,fontSize:11,background:'var(--bg-input)'}}>{c.users?.name?.[0] || '?'}</div>
                    <div className="comment-bubble" style={{background:'var(--bg-input)',padding:'10px 14px',borderRadius:'var(--radius-sm)',flex:1,border:'1px solid var(--border)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:4}}>
                        <div>
                          <span className="comment-author" style={{fontWeight:600,fontSize:13}}>{c.users?.name || 'Team'}</span>
                        </div>
                        <div className="comment-time" style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--text-muted)'}}>{new Date(c.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                      <div className="comment-text" style={{fontSize:13,color:'var(--text-primary)'}}>{c.content}</div>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && <p className="empty-state" style={{padding:'20px 0'}}>No comments yet</p>}
              </div>
              <form onSubmit={addCommentHandler} className="comment-form" style={{marginTop:20,display:'flex',gap:8}}>
                <input className="form-input" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." style={{flex:1}} />
                <button type="submit" className="btn btn-primary btn-sm">Send</button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)',marginBottom:16}}>Activity</h2>
              <div className="timeline" style={{display:'flex',flexDirection:'column',gap:16}}>
                {post.activity?.map((item, i) => {
                  const details = item.details ? JSON.parse(item.details) : {};
                  const labels = { created: 'Post created', status_change: `Status changed to ${details.status}`, comment: `Comment added`, edited: 'Post edited' };
                  return (
                    <div className="timeline-item" key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:13}}>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div className={`timeline-dot`} style={{width:6,height:6,borderRadius:'50%',background:'var(--text-muted)'}}></div>
                        <div className="timeline-content" style={{color:'var(--text-secondary)'}}>{labels[item.action] || item.action}</div>
                      </div>
                      <div className="timeline-time" style={{fontFamily:'var(--mono)',color:'var(--text-muted)',fontSize:11}}>{new Date(item.created_at).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
