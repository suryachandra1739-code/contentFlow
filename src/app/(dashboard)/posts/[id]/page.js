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
  const [aspectRatio, setAspectRatio] = useState('original');

  // Local editing states
  const [editCaption, setEditCaption] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [newMedia, setNewMedia] = useState({ media_url: '', media_type: 'image', media_key: '', media_size: 0 });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  const load = () => {
    fetch(`/api/posts/${id}`).then(r => r.json()).then(data => {
      if (data && !data.error) {
        setPost(data);
        setAspectRatio(data.thumbnail_url || 'original');
        if (!hasPrefilled) {
          setEditCaption(data.caption || '');
          setEditHashtags(data.hashtags || '');
          setHasPrefilled(true);
        }
      }
    });
    fetch(`/api/posts/${id}/comments`).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setComments(data);
    });
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE) { addToast('File exceeds 500MB limit', 'error'); return; }

    setUploading(true);
    setUploadProgress(0);

    try {
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          clientId: 'upload',
          projectId: post?.project_id || 'unknown',
        }),
      });
      const presignData = await presignRes.json();
      if (presignData.error) { addToast(presignData.error, 'error'); setUploading(false); return; }

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignData.presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(file);
      });

      setNewMedia({
        media_url: presignData.publicUrl,
        media_type: presignData.mediaType,
        media_key: presignData.key,
        media_size: file.size,
      });
      addToast('New media uploaded!', 'success');
    } catch (err) {
      console.error('Upload error:', err);
      addToast(err.message || 'Upload failed', 'error');
    }
    setUploading(false);
    setUploadProgress(0);
  };

  const saveChanges = async () => {
    const payload = {
      caption: editCaption,
      hashtags: editHashtags,
    };
    if (newMedia.media_url) {
      payload.media_url = newMedia.media_url;
      payload.media_type = newMedia.media_type;
      payload.media_key = newMedia.media_key;
      payload.media_size = newMedia.media_size;
    }

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      addToast('Post details updated successfully!', 'success');
      setNewMedia({ media_url: '', media_type: 'image', media_key: '', media_size: 0 });
      
      // Fetch latest data to force full UI update
      fetch(`/api/posts/${id}`).then(r => r.json()).then(latest => {
        if (latest && !latest.error) {
          setPost(latest);
          setAspectRatio(latest.thumbnail_url || 'original');
          setEditCaption(latest.caption || '');
          setEditHashtags(latest.hashtags || '');
        }
      });
    } catch (err) {
      addToast(err.message || 'Failed to update post details', 'error');
    }
  };
  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [id]);

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
    { key: 'original', label: 'Original' },
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

          <div className="card" style={{marginTop:24}}>
            <div className="card-body">
              <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)',marginBottom:4}}>Edit post details</h2>
              <p style={{fontSize:13,fontFamily:'var(--sans)',color:'var(--text-secondary)',marginBottom:20}}>
                Replace the post image/video or update caption and hashtag contents.
              </p>

              {/* Media Replacement Upload Zone */}
              <div className="form-group" style={{marginBottom:16}}>
                <label className="form-label" style={{fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-secondary)'}}>Media Asset</label>
                
                {newMedia.media_url ? (
                  <div style={{position:'relative', padding:'8px', background:'var(--bg-layer)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', gap:12}}>
                    {newMedia.media_type === 'video' ? (
                      <video src={newMedia.media_url} style={{width:48,height:48,borderRadius:'var(--radius-sm)',objectFit:'cover'}} />
                    ) : (
                      <img src={newMedia.media_url} alt="Uploaded thumbnail" style={{width:48,height:48,borderRadius:'var(--radius-sm)',objectFit:'cover'}} />
                    )}
                    <div style={{flex:1}}>
                      <div style={{fontSize:13, fontWeight:500, color:'var(--text-primary)'}}>New media loaded</div>
                      <div style={{fontSize:11, color:'var(--text-muted)'}}>Ready to save</div>
                    </div>
                    <button className="btn btn-secondary btn-xs" style={{padding:'4px 8px', fontSize:11}} onClick={() => setNewMedia({media_url:'',media_type:'image',media_key:'',media_size:0})}>Remove</button>
                  </div>
                ) : (
                  <label style={{
                    display:'flex',
                    flexDirection:'column',
                    alignItems:'center',
                    justifyContent:'center',
                    padding:'20px 16px',
                    border:'1px dashed var(--border)',
                    borderRadius:'var(--radius)',
                    cursor: uploading ? 'default' : 'pointer',
                    backgroundColor:'var(--bg-layer)',
                    transition:'all 0.2s'
                  }}>
                    {!uploading && <input type="file" accept="image/*,video/*" onChange={handleUpload} style={{display:'none'}} />}
                    <div style={{fontSize:20,marginBottom:4}}>{uploading ? '⏳' : '📁'}</div>
                    <div style={{fontSize:13,color:'var(--text-primary)',fontWeight:500}}>
                      {uploading ? `Uploading… ${uploadProgress}%` : 'Replace image / video'}
                    </div>
                    <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>Click to select a new file</div>
                    {uploading && (
                      <div style={{width:'100%',marginTop:12,background:'var(--border)',borderRadius:99,height:4}}>
                        <div style={{width:`${uploadProgress}%`,height:'100%',background:'var(--accent)',borderRadius:99,transition:'width 0.2s'}} />
                      </div>
                    )}
                  </label>
                )}
              </div>

              {/* Caption field */}
              <div className="form-group" style={{marginBottom:16}}>
                <label className="form-label" style={{fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-secondary)'}}>Caption</label>
                <textarea 
                  className="form-textarea" 
                  value={editCaption} 
                  onChange={e => setEditCaption(e.target.value)} 
                  placeholder="Write post caption..." 
                  rows={4}
                  style={{width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'8px 12px', fontSize:13, color:'var(--text-primary)', fontFamily:'var(--sans)'}}
                />
              </div>

              {/* Hashtags field */}
              <div className="form-group" style={{marginBottom:20}}>
                <label className="form-label" style={{fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-secondary)'}}>Hashtags</label>
                <input 
                  className="form-input" 
                  value={editHashtags} 
                  onChange={e => setEditHashtags(e.target.value)} 
                  placeholder="#brand, #marketing" 
                  style={{width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'8px 12px', fontSize:13, color:'var(--text-primary)', fontFamily:'var(--sans)'}}
                />
              </div>

              {/* Actions */}
              <div style={{display:'flex', justifyContent:'flex-end'}}>
                <button 
                  className="btn btn-primary" 
                  disabled={uploading} 
                  onClick={saveChanges}
                  style={{
                    padding:'8px 20px',
                    borderRadius:'var(--radius-pill)',
                    fontWeight:600,
                    fontSize:13,
                    background:'linear-gradient(135deg, var(--accent) 0%, #c12d32 100%)',
                    color:'#fff',
                    border:'none',
                    cursor: uploading ? 'default' : 'pointer'
                  }}
                >
                  Save Changes
                </button>
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
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.users?.name || 'Team')}&radius=50`} 
                      alt={c.users?.name || 'Team'} 
                      style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',flexShrink:0}} 
                    />
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
