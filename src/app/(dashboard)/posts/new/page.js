'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlatformPreview from '@/components/PlatformPreview';
import PlatformBadge from '@/components/PlatformBadge';
import { useToast } from '@/components/Toast';

export default function NewPost() {
  const router = useRouter();
  const addToast = useToast();
  const [projects, setProjects] = useState([]);
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState({ project_id: '', platform: '', caption: '', hashtags: '', media_url: '', media_type: 'image', media_key: '', media_size: 0, scheduled_date: '', thumbnail_url: 'original' });

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(data => {
      setProjects(Array.isArray(data) ? data : []);
    }).catch(() => setProjects([]));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE) { addToast('File exceeds 500MB limit', 'error'); return; }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL from our API (tiny request, no file bytes)
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          clientId: 'upload',
          projectId: form.project_id || 'unknown',
        }),
      });
      const presignData = await presignRes.json();
      if (presignData.error) { addToast(presignData.error, 'error'); setUploading(false); return; }

      // Step 2: Upload directly from browser to R2 using the presigned URL
      // Use XMLHttpRequest for real upload progress tracking
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

      setForm(f => ({
        ...f,
        media_url: presignData.publicUrl,
        media_type: presignData.mediaType,
        media_key: presignData.key,
        media_size: file.size,
      }));
      addToast('File uploaded!', 'success');
    } catch (err) {
      console.error('Upload error:', err);
      addToast(err.message || 'Upload failed', 'error');
    }
    setUploading(false);
    setUploadProgress(0);
  };

  const handleSubmit = async () => {
    const res = await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const post = await res.json();
    addToast('Post created!', 'success');
    router.push(`/posts/${post.id}`);
  };

  return (
    <div className="fade-in" style={{maxWidth:900,margin:'0 auto'}}>
      <div className="page-header">
        <h1>Create new post</h1>
        <p>Step {step} of 3</p>
        <div style={{display:'flex',gap:4,marginTop:12}}>
          {[1,2,3].map(s => (
            <div key={s} style={{flex:1,height:4,borderRadius:2,background:s <= step ? 'var(--accent)' : 'var(--border)',transition:'all 0.3s ease'}} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="card slide-up">
          <div className="card-body">
            <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)',marginBottom:20}}>Select project & platform</h2>
            <div className="form-group">
              <label className="form-label">Project</label>
              <select className="form-select" value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}>
                <option value="">Choose a project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.clients?.company_name || 'No client'}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Platform</label>
              <div style={{display:'flex',gap:12}}>
                {[{v:'instagram',l:'Instagram'},{v:'facebook',l:'Facebook'},{v:'shorts',l:'Shorts'}].map(p => (
                  <button key={p.v} className={`btn ${form.platform === p.v ? 'btn-primary' : 'btn-secondary'}`} style={{padding:'12px 24px',fontSize:14, display:'inline-flex', alignItems:'center', gap:8}} onClick={() => setForm({...form, platform: p.v})}>
                    <PlatformBadge platform={p.v} /> {p.l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:24}}>
              <button className="btn btn-primary" disabled={!form.project_id || !form.platform} onClick={() => setStep(2)}>Next</button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid-2 slide-up" style={{alignItems:'start', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px'}}>
          <div className="card">
            <div className="card-body">
              <h2 style={{fontSize:16,fontWeight:600,fontFamily:'var(--sans)',marginBottom:20}}>Content details</h2>
              <div className="form-group">
                <label className="form-label">Media</label>
                {form.media_url ? (
                  <div style={{position:'relative'}}>
                    {form.media_type === 'video' ? <video src={form.media_url} controls style={{width:'100%',borderRadius:'var(--radius)'}} /> : <img src={form.media_url} alt="" style={{width:'100%',borderRadius:'var(--radius)'}} />}
                    <button className="btn btn-secondary btn-sm" style={{marginTop:8}} onClick={() => setForm({...form, media_url: '', media_type: 'image'})}>Remove</button>
                  </div>
                ) : (
                  <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px',border:'1px dashed var(--border)',borderRadius:'var(--radius)',cursor: uploading ? 'default' : 'pointer',backgroundColor:'var(--bg-layer)'}}>
                    {!uploading && <input type="file" accept="image/*,video/*" onChange={handleUpload} style={{display:'none'}} />}
                    <div style={{fontSize:24,marginBottom:8}}>{uploading ? '⏳' : '📁'}</div>
                    <div style={{fontSize:14,color:'var(--text-primary)',fontWeight:500}}>
                      {uploading ? `Uploading… ${uploadProgress}%` : 'Click to upload media'}
                    </div>
                    <div style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>Supports images and videos (up to 500MB)</div>
                    {uploading && (
                      <div style={{width:'100%',marginTop:16,background:'var(--border)',borderRadius:99,height:4}}>
                        <div style={{width:`${uploadProgress}%`,height:'100%',background:'var(--accent)',borderRadius:99,transition:'width 0.2s'}} />
                      </div>
                    )}
                  </label>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Aspect Ratio</label>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {[
                    { key: 'original', label: 'Original' },
                    { key: 'portrait', label: 'Portrait (9:16)' },
                    { key: 'landscape', label: 'Landscape (16:9)' },
                    { key: 'square', label: 'Square (1:1)' }
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`btn ${form.thumbnail_url === opt.key ? 'btn-primary' : 'btn-secondary'}`}
                      style={{padding:'8px 12px', fontSize:13}}
                      onClick={() => setForm({...form, thumbnail_url: opt.key})}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Caption</label>
                <textarea className="form-textarea" value={form.caption} onChange={e => setForm({...form, caption: e.target.value})} placeholder="Write your caption..." rows={5} />
              </div>
              <div className="form-group">
                <label className="form-label">Hashtags</label>
                <input className="form-input" value={form.hashtags} onChange={e => setForm({...form, hashtags: e.target.value})} placeholder="#summer, #vibes, #brand" />
              </div>
              <div className="form-group">
                <label className="form-label">Scheduled date (optional)</label>
                <input type="datetime-local" className="form-input" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} />
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:24}}>
                <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>Preview</button>
              </div>
            </div>
          </div>
          <div>
            <h3 style={{fontSize:14,fontWeight:600,fontFamily:'var(--sans)',color:'var(--text-muted)',marginBottom:12}}>Live preview</h3>
            <PlatformPreview platform={form.platform} caption={form.caption} hashtags={form.hashtags} mediaUrl={form.media_url} mediaType={form.media_type} aspectRatio={form.thumbnail_url} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="slide-up" style={{textAlign:'center'}}>
          <div style={{maxWidth:400,margin:'0 auto',marginBottom:32}}>
            <PlatformPreview platform={form.platform} caption={form.caption} hashtags={form.hashtags} mediaUrl={form.media_url} mediaType={form.media_type} aspectRatio={form.thumbnail_url} />
          </div>
          <div className="card" style={{maxWidth:500,margin:'0 auto'}}>
            <div className="card-body">
              <h2 style={{fontSize:18,fontWeight:600,fontFamily:'var(--sans)',marginBottom:8}}>Ready to create?</h2>
              <p style={{color:'var(--text-secondary)',fontSize:14,marginBottom:24}}>Your post will be saved as a draft. You can send it for review from the project page.</p>
              <div style={{display:'flex',gap:12,justifyContent:'center'}}>
                <button className="btn btn-secondary" onClick={() => setStep(2)}>Edit</button>
                <button className="btn btn-primary" onClick={handleSubmit}>Create post</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
