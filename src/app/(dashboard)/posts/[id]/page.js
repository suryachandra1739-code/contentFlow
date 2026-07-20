'use client';
import PageTransition from '@/components/PageTransition';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import PlatformBadge from '@/components/PlatformBadge';
import PlatformPreview from '@/components/PlatformPreview';
import { useToast } from '@/components/Toast';
import { createClientBrowser } from '@/lib/supabase';

const timelineDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

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

  // Publish states
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishPlatforms, setPublishPlatforms] = useState({ facebook: true, instagram: true, linkedin: false, youtube: false });
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [newMedia, setNewMedia] = useState({ media_url: '', media_type: 'image', media_key: '', media_size: 0 });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  // DM Override states
  const [useCustomDm, setUseCustomDm] = useState(false);
  const [customDmConfig, setCustomDmConfig] = useState({ keywords: '', message: '', links: '' });

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

    // Load DM override config
    if (typeof window !== 'undefined') {
      try {
        const dmKey = `cf-post-dm-${id}`;
        const stored = JSON.parse(localStorage.getItem(dmKey));
        if (stored && stored.useCustomDm) {
          setUseCustomDm(true);
          setCustomDmConfig(stored.customDmConfig || { keywords: '', message: '', links: '' });
        }
      } catch (e) {}
    }
  };

  const saveDmOverride = (enabled, config) => {
    setUseCustomDm(enabled);
    setCustomDmConfig(config);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`cf-post-dm-${id}`, JSON.stringify({ useCustomDm: enabled, customDmConfig: config }));
      addToast('DM Bot settings saved', 'success');
    }
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
  const [userRole, setUserRole] = useState('team');
  const supabase = createClientBrowser();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role) {
          setUserRole(profile.role);
        }
      }
    }
    loadUser();
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

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/posts/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: publishPlatforms })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      let msg = 'Published successfully!';
      if (data.results) {
         const fb = data.results.facebook;
         const ig = data.results.instagram;
         const yt = data.results.youtube;
         const parts = [];
         if (fb) parts.push(`FB: ${fb.success ? '✓' : fb.error}`);
         if (ig) parts.push(`IG: ${ig.success ? '✓' : ig.error}`);
         if (yt) parts.push(`YouTube: ${yt.success ? '✓' : yt.error}`);
         if (parts.length > 0) {
            msg = parts.join(' • ');
         }
      }
      addToast(msg, Object.values(data.results || {}).some(r => r.success) ? 'success' : 'error');
      setShowPublishModal(false);
      load();
    } catch (err) {
      addToast(err.message || 'Publish failed', 'error');
    } finally {
      setPublishing(false);
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
          {userRole !== 'client' && (
            <div className="flex gap-8" style={{flexWrap:'wrap'}}>
              {post.status === 'approved' && (
                <button 
                  className="btn btn-sm" 
                  style={{background:'var(--accent)',color:'#fff',border:'none',fontWeight:600}}
                  onClick={() => setShowPublishModal(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Publish to Social
                </button>
              )}
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
          )}
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

          {userRole !== 'client' && (
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
          )}

          {userRole !== 'client' && post?.platform === 'instagram' && (
            <div className="card" style={{marginBottom:24}}>
              <div className="card-body">
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
                  <div>
                    <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)',margin:0}}>DM Bot Override</h2>
                    <p style={{fontSize:13,fontFamily:'var(--sans)',color:'var(--text-secondary)',marginTop:4}}>Set custom auto-reply logic for this specific post</p>
                  </div>
                  <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                    <span style={{fontSize:13, fontWeight:500, color: useCustomDm ? 'var(--text-primary)' : 'var(--text-muted)'}}>Custom</span>
                    <input type="checkbox" style={{width:16,height:16}} checked={useCustomDm} onChange={e => saveDmOverride(e.target.checked, customDmConfig)} />
                  </label>
                </div>
                
                {useCustomDm ? (
                  <div style={{background:'var(--bg-layer)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:16}}>
                    <div className="form-group" style={{marginBottom:16}}>
                      <label className="form-label" style={{fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-secondary)'}}>Trigger Keywords</label>
                      <input 
                        className="form-input" 
                        value={customDmConfig.keywords} 
                        onChange={e => setCustomDmConfig({...customDmConfig, keywords: e.target.value})} 
                        onBlur={() => saveDmOverride(useCustomDm, customDmConfig)}
                        placeholder="dm, guide, free" 
                        style={{width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'8px 12px', fontSize:13}}
                      />
                    </div>
                    <div className="form-group" style={{marginBottom:16}}>
                      <label className="form-label" style={{fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-secondary)'}}>Resources / Links (one per line)</label>
                      <textarea 
                        className="form-textarea" 
                        value={customDmConfig.links} 
                        onChange={e => setCustomDmConfig({...customDmConfig, links: e.target.value})} 
                        onBlur={() => saveDmOverride(useCustomDm, customDmConfig)}
                        placeholder="https://example.com" 
                        rows={2}
                        style={{width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'8px 12px', fontSize:13}}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-secondary)'}}>Auto-Reply Template</label>
                      <textarea 
                        className="form-textarea" 
                        value={customDmConfig.message} 
                        onChange={e => setCustomDmConfig({...customDmConfig, message: e.target.value})} 
                        onBlur={() => saveDmOverride(useCustomDm, customDmConfig)}
                        placeholder="Hey {name}! Here are your resources: {links}" 
                        rows={4}
                        style={{width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'8px 12px', fontSize:13}}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{fontSize:13, color:'var(--text-secondary)', padding:'12px 16px', background:'var(--bg-layer)', borderRadius:'var(--radius-sm)', border:'1px dashed var(--border)'}}>
                    Currently inheriting the default DM Bot settings from the <strong>{post.projects?.name}</strong> project.
                  </div>
                )}
              </div>
            </div>
          )}

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
                      <div className="timeline-time" style={{fontFamily:'var(--mono)',color:'var(--text-muted)',fontSize:11}}>{timelineDateFormatter.format(new Date(item.created_at))}</div>
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

      {/* Publish Modal */}
      {showPublishModal && (
        <div style={{
          position:'fixed', inset:0, zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)'
        }} onClick={() => !publishing && setShowPublishModal(false)}>
          <div style={{
            background:'var(--bg-card)', border:'1px solid var(--border)',
            borderRadius:'var(--radius)', padding:32, maxWidth:400, width:'90%',
            boxShadow:'0 20px 60px rgba(0,0,0,0.3)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{fontSize:18,fontWeight:700,fontFamily:'var(--sans)',color:'var(--text-primary)',marginBottom:8}}>Publish to Social</h3>
            <p style={{fontSize:13,fontFamily:'var(--sans)',color:'var(--text-secondary)',marginBottom:20,lineHeight:1.5}}>
              Select the platforms you want to publish this post to. Make sure {post.clients?.company_name} has connected their accounts.
            </p>
            
            <div style={{display:'flex', flexDirection:'column', gap:12, marginBottom:24}}>
              <label style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:12, background:'var(--bg-layer)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)'}}>
                <input 
                  type="checkbox" 
                  checked={publishPlatforms.facebook} 
                  onChange={e => setPublishPlatforms(prev => ({...prev, facebook: e.target.checked}))}
                  style={{width: 16, height: 16}}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <span style={{fontSize:14, fontWeight:500}}>Facebook Page</span>
              </label>
              
              <label style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:12, background:'var(--bg-layer)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)'}}>
                <input 
                  type="checkbox" 
                  checked={publishPlatforms.instagram} 
                  onChange={e => setPublishPlatforms(prev => ({...prev, instagram: e.target.checked}))}
                  style={{width: 16, height: 16}}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="url(#ig-grad)"><defs><linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433" /><stop offset="25%" stopColor="#e6683c" /><stop offset="50%" stopColor="#dc2743" /><stop offset="75%" stopColor="#cc2366" /><stop offset="100%" stopColor="#bc1888" /></linearGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                <span style={{fontSize:14, fontWeight:500}}>Instagram Business</span>
              </label>

              <label style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:12, background:'var(--bg-layer)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)'}}>
                <input 
                  type="checkbox" 
                  checked={publishPlatforms.linkedin} 
                  onChange={e => setPublishPlatforms(prev => ({...prev, linkedin: e.target.checked}))}
                  style={{width: 16, height: 16}}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                <span style={{fontSize:14, fontWeight:500}}>LinkedIn Page</span>
              </label>

              <label style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:12, background:'var(--bg-layer)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)'}}>
                <input 
                  type="checkbox" 
                  checked={publishPlatforms.youtube} 
                  onChange={e => setPublishPlatforms(prev => ({...prev, youtube: e.target.checked}))}
                  style={{width: 16, height: 16}}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                <span style={{fontSize:14, fontWeight:500}}>YouTube Channel</span>
              </label>
            </div>

            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setShowPublishModal(false)}
                disabled={publishing}
              >
                Cancel
              </button>
              <button 
                className="btn btn-sm btn-primary" 
                style={{fontWeight:600,opacity:publishing?0.6:1, display:'flex', alignItems:'center', gap:6}}
                onClick={handlePublish}
                disabled={publishing || (!publishPlatforms.facebook && !publishPlatforms.instagram && !publishPlatforms.linkedin && !publishPlatforms.youtube)}
              >
                {publishing ? 'Publishing...' : 'Publish Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </PageTransition>
  );
}
