'use client';
import PageTransition from '@/components/PageTransition';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import PlatformBadge from '@/components/PlatformBadge';
import PlatformPreview from '@/components/PlatformPreview';
import { useToast } from '@/components/Toast';

export default function PostDetail() {
  const { id } = useParams();
  const addToast = useToast();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState('Creative Team');
  const [aspectRatio, setAspectRatio] = useState('original');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusTransition, setStatusTransition] = useState(null);

  // Local editing states
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [newMedia, setNewMedia] = useState({ media_url: '', media_type: 'image', media_key: '', media_size: 0 });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  const parseCaption = (rawCaption) => {
    if (!rawCaption) return { title: '', description: '' };
    if (rawCaption.startsWith('Title: ')) {
      const doubleNewline = rawCaption.indexOf('\n\n');
      if (doubleNewline !== -1) {
        return {
          title: rawCaption.substring(7, doubleNewline),
          description: rawCaption.substring(doubleNewline + 2)
        };
      }
      const singleNewline = rawCaption.indexOf('\n');
      if (singleNewline !== -1) {
        return {
          title: rawCaption.substring(7, singleNewline),
          description: rawCaption.substring(singleNewline + 1)
        };
      }
    }
    return { title: '', description: rawCaption };
  };

  const load = () => {
    fetch(`/api/posts/${id}`).then(r => r.json()).then(data => {
      if (data && !data.error) {
        setPost(data);
        setAspectRatio(data.thumbnail_url || 'original');
        if (!hasPrefilled) {
          const parsed = parseCaption(data.caption || '');
          setEditTitle(parsed.title);
          setEditCaption(parsed.description);
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
      // Try presigned URL upload first (direct to R2, bypasses Vercel limits)
      let uploadSuccess = false;
      let presignData = null;

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
        presignData = await presignRes.json();
        
        if (!presignData.error && presignData.presignedUrl) {
          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', presignData.presignedUrl);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.upload.onprogress = (ev) => {
              if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve();
              else reject(new Error(`Direct upload failed: ${xhr.status}`));
            };
            xhr.onerror = () => reject(new Error('CORS or network error during direct upload'));
            xhr.send(file);
          });
          uploadSuccess = true;
        }
      } catch (directErr) {
        console.warn('Presigned upload failed, falling back to server upload:', directErr.message);
      }

      // Fallback: upload through our server API
      if (!uploadSuccess) {
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('clientId', 'upload');
        formData.append('projectId', post?.project_id || 'unknown');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.error) throw new Error(uploadData.error);

        presignData = {
          publicUrl: uploadData.url,
          mediaType: uploadData.type,
          key: uploadData.key,
        };
        setUploadProgress(100);
      }

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
    const finalCaption = editTitle ? `Title: ${editTitle}\n\n${editCaption}` : editCaption;
    const payload = {
      caption: finalCaption,
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
          const parsed = parseCaption(latest.caption || '');
          setEditTitle(parsed.title);
          setEditCaption(parsed.description);
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
    setStatusTransition(status);
    await fetch(`/api/posts/${id}/status`, { method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
    addToast(`Status updated to ${status}`, 'success');
    load();
    // Keep highlight for 2 seconds to give visual feedback
    setTimeout(() => setStatusTransition(null), 2000);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      addToast('Post deleted successfully', 'success');
      router.push('/');
    } catch (err) {
      addToast(err.message || 'Failed to delete post', 'error');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
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
    <PageTransition><div className="fade-in">
      <div className="page-header">
        <Link href={`/projects/${post.project_id}`} style={{fontSize:13,fontFamily:'var(--sans)',color:'var(--text-secondary)',display:'inline-flex',alignItems:'center',gap:4,marginBottom:8}}>← {post.projects?.name || 'Project'}</Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12" style={{ flexWrap: 'wrap' }}>
            <PlatformBadge platform={post.platform} />
            <StatusBadge status={post.status} />
            {(() => {
              const created = new Date(post.created_at);
              const expiry = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
              const diffMs = expiry - Date.now();
              
              if (diffMs > 0) {
                const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
                const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                const label = diffDays > 0 ? `${diffDays}d ${diffHours}h remaining` : `${diffHours}h remaining`;
                const isUrgent = diffMs < 24 * 60 * 60 * 1000;
                
                return (
                  <span style={{
                    fontSize: 12,
                    fontFamily: 'var(--sans)',
                    color: isUrgent ? 'var(--red)' : 'var(--text-muted)',
                    backgroundColor: isUrgent ? 'rgba(229,72,77,0.1)' : 'rgba(255,255,255,0.05)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontWeight: 500
                  }}>
                    ⏰ Auto-deletes in {label}
                  </span>
                );
              }
              return null;
            })()}
          </div>
          <div className="flex gap-8" style={{flexWrap:'wrap'}}>
            {post.status === 'draft' && <button className="btn btn-primary btn-sm" onClick={() => updateStatus('pending')}>Send for review</button>}
            <button className="btn btn-secondary btn-sm" onClick={copyReviewLink}>Copy review link</button>
            <button 
              className="btn btn-sm" 
              style={{background:'var(--red-soft)',color:'var(--red)',border:'1px solid rgba(229,72,77,0.2)',fontWeight:500}}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:32,alignItems:'start'}}>
        {/* Left Column */}
        <div>
          <div className="card" style={{marginBottom:24}}>
            <div className="card-body">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
                <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)',margin:0}}>Platform preview</h2>
              </div>
              <PlatformPreview platform={post.platform} caption={post.caption} hashtags={post.hashtags} mediaUrl={post.media_url} mediaType={post.media_type} aspectRatio={aspectRatio} />
            </div>
          </div>

          {/* Previous Media Version History */}
          {post.activity && post.activity.filter(item => item.action === 'post_updated' && item.metadata?.previous_media_url).length > 0 && (
            <div className="card" style={{marginBottom:24}}>
              <div className="card-body">
                <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)',marginBottom:4}}>Version History</h2>
                <p style={{fontSize:13,fontFamily:'var(--sans)',color:'var(--text-secondary)',marginBottom:16}}>
                  Hover over a previous version and click Preview to load it. Click Save Changes to restore it.
                </p>
                <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                  {post.activity.filter(item => item.action === 'post_updated' && item.metadata?.previous_media_url).map((ver, idx) => (
                    <div key={idx} style={{width:100,display:'flex',flexDirection:'column',gap:4}}>
                      <div 
                        style={{
                          width:100,
                          height:75,
                          borderRadius:'var(--radius-sm)',
                          overflow:'hidden',
                          background:'#000',
                          border:'1px solid var(--border)',
                          position:'relative'
                        }}
                      >
                        {ver.metadata.previous_media_type === 'video' ? (
                          <video src={ver.metadata.previous_media_url} preload="metadata" playsInline muted style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        ) : (
                          <img src={ver.metadata.previous_media_url} alt="" loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        )}
                        <div 
                          className="version-preview-overlay"
                          style={{
                            position:'absolute',
                            inset:0,
                            background:'rgba(0,0,0,0.5)',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            opacity:0,
                            transition:'opacity 0.2s',
                            cursor:'pointer',
                            color:'#fff',
                            fontSize:11,
                            fontWeight:600
                          }}
                          onClick={() => {
                            setNewMedia({
                              media_url: ver.metadata.previous_media_url,
                              media_type: ver.metadata.previous_media_type || 'image',
                              media_key: '',
                              media_size: 0
                            });
                            addToast("Loaded historical media into preview! Click Save Changes to restore it.", "success");
                          }}
                        >
                          Preview
                        </div>
                      </div>
                      <div style={{fontSize:11,color:'var(--text-muted)',textAlign:'center',fontFamily:'var(--sans)'}}>
                        {new Date(ver.created_at).toLocaleDateString([], {month:'short',day:'numeric'})}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-body">
              <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)',marginBottom:4}}>Status actions</h2>
              <p style={{fontSize:13,fontFamily:'var(--sans)',color:'var(--text-secondary)',marginBottom:16}}>Update the approval status</p>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {[
                  { status: 'draft', label: 'Draft', bg: 'var(--bg-input)', color: 'var(--text-secondary)', activeBg: 'var(--border)', activeColor: 'var(--text-primary)' },
                  { status: 'pending', label: 'Pending', bg: 'var(--amber-soft)', color: 'var(--amber)', activeBg: 'var(--amber)', activeColor: '#fff' },
                  { status: 'approved', label: 'Approve', bg: 'var(--green-soft)', color: 'var(--green)', activeBg: 'var(--green)', activeColor: '#fff' },
                  { status: 'revision', label: 'Revision', bg: 'var(--cyan-soft)', color: 'var(--cyan)', activeBg: 'var(--cyan)', activeColor: '#fff' },
                  { status: 'rejected', label: 'Reject', bg: 'var(--red-soft)', color: 'var(--red)', activeBg: 'var(--red)', activeColor: '#fff' },
                ].map(item => {
                  const isActive = post.status === item.status;
                  const isTransitioning = statusTransition === item.status;
                  return (
                    <button 
                      key={item.status}
                      className="btn btn-sm" 
                      style={{
                        background: isActive ? item.activeBg : item.bg,
                        color: isActive ? item.activeColor : item.color,
                        border: isActive ? `2px solid ${item.color}` : 'none',
                        borderRadius:'var(--radius-sm)',
                        fontWeight: isActive ? 700 : 500,
                        transform: isTransitioning ? 'scale(1.08)' : 'scale(1)',
                        transition: 'all 0.3s ease',
                        boxShadow: isActive ? `0 2px 8px ${item.color}40` : 'none',
                      }} 
                      onClick={() => updateStatus(item.status)}
                    >
                      {isActive && '✓ '}{item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className="card" style={{marginBottom:24}}>
            <div className="card-body">
              <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)',marginBottom:16}}>Comments ({comments.length})</h2>
              <div className="comment-list">
                {comments.map(c => {
                  const getRoleDetails = (role) => {
                    const normalized = (role || 'client').toLowerCase();
                    if (normalized === 'admin') {
                      return {
                        label: 'Admin',
                        color: 'var(--red)',
                        bg: 'rgba(229,72,77,0.15)',
                        borderColor: '#e5484d',
                      };
                    } else if (normalized === 'team') {
                      return {
                        label: 'Team',
                        color: '#8b5cf6',
                        bg: 'rgba(139,92,246,0.15)',
                        borderColor: '#8b5cf6',
                      };
                    } else {
                      return {
                        label: 'Client',
                        color: '#3b82f6',
                        bg: 'rgba(59,130,246,0.15)',
                        borderColor: '#3b82f6',
                      };
                    }
                  };
                  const roleInfo = getRoleDetails(c.users?.role);

                  return (
                    <div className="comment-item" key={c.id} style={{display:'flex',gap:12,marginBottom:16}}>
                      <img 
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.users?.name || 'Team')}&radius=50`} 
                        alt={c.users?.name || 'Team'} 
                        style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',flexShrink:0, border:`2px solid ${roleInfo.borderColor}`, padding:1}} 
                      />
                      <div className="comment-bubble" style={{background:'var(--bg-input)',padding:'10px 14px',borderRadius:'var(--radius-sm)',flex:1,border:'1px solid var(--border)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:4}}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <span className="comment-author" style={{fontWeight:600,fontSize:13}}>{c.users?.name || 'Team'}</span>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                              color: roleInfo.color,
                              background: roleInfo.bg
                            }}>{roleInfo.label}</span>
                          </div>
                          <div className="comment-time" style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--text-muted)'}}>{new Date(c.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                        </div>
                        <div className="comment-text" style={{fontSize:13,color:'var(--text-primary)'}}>{c.content}</div>
                      </div>
                    </div>
                  );
                })}
                {comments.length === 0 && <p className="empty-state" style={{padding:'20px 0'}}>No comments yet</p>}
              </div>
              <form onSubmit={addCommentHandler} className="comment-form" style={{marginTop:20,display:'flex',gap:8}}>
                <input className="form-input" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." style={{flex:1}} />
                <button type="submit" className="btn btn-primary btn-sm">Send</button>
              </form>
            </div>
          </div>

          <div className="card" style={{marginBottom:24}}>
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
                      <video src={newMedia.media_url} preload="metadata" playsInline muted style={{width:48,height:48,borderRadius:'var(--radius-sm)',objectFit:'cover'}} />
                    ) : (
                      <img src={newMedia.media_url} alt="Uploaded thumbnail" loading="lazy" style={{width:48,height:48,borderRadius:'var(--radius-sm)',objectFit:'cover'}} />
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

              {/* Title field */}
              <div className="form-group" style={{marginBottom:16}}>
                <label className="form-label" style={{fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-secondary)'}}>Post Title</label>
                <input 
                  type="text"
                  className="form-input" 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)} 
                  placeholder="Enter post title (visible in list view only)..." 
                  style={{width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'8px 12px', fontSize:13, color:'var(--text-primary)', fontFamily:'var(--sans)'}}
                />
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

          <div className="card">
            <div className="card-body">
              <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)',marginBottom:16}}>Activity</h2>
              <div className="timeline" style={{display:'flex',flexDirection:'column',gap:16}}>
                {post.activity?.map((item, i) => {
                  const actor = item.user_name || 'System';
                  let label = item.action;
                  let dotColor = 'var(--text-muted)';
                  
                  if (item.action === 'post_created') {
                    label = `Post created by ${actor}`;
                    dotColor = 'var(--accent)';
                  } else if (item.action.startsWith('post_status_')) {
                    const statusVal = item.action.replace('post_status_', '');
                    label = `Status updated to ${statusVal} by ${actor}`;
                    if (statusVal === 'approved') dotColor = 'var(--green)';
                    else if (statusVal === 'revision') dotColor = 'var(--amber)';
                    else if (statusVal === 'rejected') dotColor = 'var(--red)';
                  } else if (item.action === 'post_updated') {
                    const hasMedia = item.metadata?.is_media_changed || item.metadata?.previous_media_url;
                    label = hasMedia ? `Media replaced by ${actor}` : `Details edited by ${actor}`;
                    dotColor = 'var(--cyan)';
                  } else if (item.action === 'post_approved') {
                    label = `Approved by ${actor}`;
                    dotColor = 'var(--green)';
                  } else if (item.action === 'post_revision') {
                    label = `Revision requested by ${actor}`;
                    dotColor = 'var(--amber)';
                  } else if (item.action === 'post_rejected') {
                    label = `Rejected by ${actor}`;
                    dotColor = 'var(--red)';
                  } else if (item.action === 'comment_added') {
                    label = `Comment added by ${actor}`;
                  }

                  return (
                    <div className="timeline-item" key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:13}}>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div className="timeline-dot" style={{width:8,height:8,borderRadius:'50%',background:dotColor,boxShadow:dotColor !== 'var(--text-muted)' ? `0 0 8px ${dotColor}` : 'none',flexShrink:0,flexGrow:0}}></div>
                        <div className="timeline-content" style={{color:'var(--text-primary)', fontWeight:500}}>{label}</div>
                      </div>
                      <div className="timeline-time" style={{fontFamily:'var(--mono)',color:'var(--text-muted)',fontSize:11}}>{new Date(item.created_at).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  );
                })}
                {(!post.activity || post.activity.length === 0) && <p className="empty-state" style={{padding:'20px 0'}}>No activity logged yet</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position:'fixed', inset:0, zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)'
        }} onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div style={{
            background:'var(--bg-card)', border:'1px solid var(--border)',
            borderRadius:'var(--radius)', padding:32, maxWidth:400, width:'90%',
            boxShadow:'0 20px 60px rgba(0,0,0,0.3)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{fontSize:32, marginBottom:12, textAlign:'center'}}>🗑️</div>
            <h3 style={{fontSize:18,fontWeight:700,fontFamily:'var(--sans)',textAlign:'center',color:'var(--text-primary)',marginBottom:8}}>Delete this post?</h3>
            <p style={{fontSize:13,fontFamily:'var(--sans)',color:'var(--text-secondary)',textAlign:'center',marginBottom:24,lineHeight:1.5}}>
              This action cannot be undone. The media file will also be removed from cloud storage.
            </p>
            <div style={{display:'flex',gap:8,justifyContent:'center'}}>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-sm" 
                style={{background:'var(--red)',color:'#fff',border:'none',fontWeight:600,opacity:deleting?0.6:1}}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </PageTransition>
  );
}
