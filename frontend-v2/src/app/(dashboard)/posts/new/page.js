'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import PlatformBadge from '@/components/ui/PlatformBadge';
import PlatformPreview from '@/components/features/PlatformPreview';

const PLATFORMS = [
  { v: 'instagram', l: 'Instagram' },
  { v: 'facebook', l: 'Facebook' },
  { v: 'youtube', l: 'YouTube' },
  { v: 'shorts', l: 'Shorts' },
  { v: 'linkedin', l: 'LinkedIn' },
  { v: 'twitter', l: 'Twitter/X' },
];

const STEPS = ['Context', 'Content', 'Preview'];

export default function NewPostPage() {
  const router = useRouter();
  const addToast = useToast();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(0);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clientId, setClientId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    project_id: '', platform: [], caption: '', hashtags: '',
    media_url: '', media_type: 'image', media_key: '',
    media_size: 0, scheduled_date: '', thumbnail_url: 'original',
  });
  const [title, setTitle] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ]).then(([c, p]) => {
      setClients(Array.isArray(c) ? c : []);
      setProjects(Array.isArray(p) ? p : []);
    }).catch(() => {});
  }, []);

  const filteredProjects = clientId
    ? projects.filter(p => p.client_id === clientId)
    : projects;

  const togglePlatform = (v) => {
    setForm(f => ({
      ...f,
      platform: f.platform.includes(v) ? f.platform.filter(p => p !== v) : [...f.platform, v],
    }));
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) { addToast('File exceeds 500MB limit', 'error'); return; }
    setUploading(true); setUploadProgress(0);
    try {
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, clientId: clientId || 'upload', projectId: form.project_id || 'unknown' }),
      });
      const presign = await presignRes.json();
      if (presign.error) { addToast(presign.error, 'error'); setUploading(false); return; }

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presign.presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
      });

      setForm(f => ({ ...f, media_url: presign.publicUrl, media_type: presign.mediaType, media_key: presign.key, media_size: file.size }));
      addToast('File uploaded successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Upload failed', 'error');
    }
    setUploading(false); setUploadProgress(0);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const finalCaption = title ? `Title: ${title}\n\n${form.caption}` : form.caption;
    let lastPost = null;
    for (const plat of form.platform) {
      const res = await fetch('/api/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, platform: plat, caption: finalCaption }),
      });
      lastPost = await res.json();
    }
    setSubmitting(false);
    addToast(`Post created for ${form.platform.length} platform${form.platform.length > 1 ? 's' : ''}`, 'success');
    if (lastPost?.id) router.push(`/posts/${lastPost.id}`);
  };

  const canProceed = [
    form.project_id && form.platform.length > 0,
    true, // step 2 always progressable
    true,
  ];

  return (
    <div className="page-content page-enter" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--s-8)' }}>
        <h1 className="page-title">New Post</h1>
        <p className="page-subtitle">Create content for review and approval.</p>
      </div>

      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((label, i) => (
          <div key={i} className="step-item">
            <div className={`step-num ${i < step ? 'step-num-done' : i === step ? 'step-num-active' : 'step-num-inactive'}`}>
              {i < step ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : i + 1}
            </div>
            <span className={`step-label${i === step ? ' step-label-active' : ''}`}>{label}</span>
            {i < STEPS.length - 1 && <div className={`step-connector${i < step ? ' step-connector-done' : ''}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Context */}
      {step === 0 && (
        <div className="card" style={{ animation: 'slideUp 0.3s var(--ease-out)' }}>
          <div className="card-header">
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Select context</h2>
            <span className="caption">Where should this post go?</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Client</label>
                <select className="form-select" value={clientId} onChange={e => { setClientId(e.target.value); setForm(f => ({ ...f, project_id: '' })); }}>
                  <option value="">Choose a client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Project</label>
                <select className="form-select" value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} disabled={!clientId}>
                  <option value="">{clientId ? 'Choose a project…' : 'Select a client first'}</option>
                  {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {clientId && filteredProjects.length === 0 && (
                  <span className="form-hint" style={{ color: 'var(--amber)' }}>No projects for this client yet.</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Platforms</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
                {PLATFORMS.map(({ v, l }) => {
                  const selected = form.platform.includes(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => togglePlatform(v)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)',
                        padding: '8px 14px', borderRadius: 'var(--r-sm)',
                        border: selected ? '1px solid var(--accent-border)' : '1px solid var(--border-2)',
                        background: selected ? 'var(--accent-subtle)' : 'var(--bg-3)',
                        color: selected ? 'var(--accent)' : 'var(--text-1)',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        transition: 'all var(--dur-fast)',
                      }}
                    >
                      {selected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      <PlatformBadge platform={v} showLabel={false} size="sm" />
                      {l}
                    </button>
                  );
                })}
              </div>
              {form.platform.length > 0 && (
                <span className="form-hint" style={{ color: 'var(--accent)' }}>
                  {form.platform.length} platform{form.platform.length > 1 ? 's' : ''} selected — one post per platform
                </span>
              )}
            </div>
          </div>
          <div className="card-footer" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" disabled={!canProceed[0]} onClick={() => setStep(1)}>
              Continue
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Content */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--s-6)', animation: 'slideUp 0.3s var(--ease-out)' }}>
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Content details</h2>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
              {/* Upload */}
              <div className="form-group">
                <label className="form-label">Media</label>
                {form.media_url ? (
                  <div style={{ position: 'relative' }}>
                    {form.media_type === 'video' ? (
                      <video src={form.media_url} controls style={{ width: '100%', borderRadius: 'var(--r-md)', maxHeight: 280 }} />
                    ) : (
                      <img src={form.media_url} alt="" style={{ width: '100%', borderRadius: 'var(--r-md)', maxHeight: 280, objectFit: 'cover' }} />
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: 'var(--s-2)' }}
                      onClick={() => setForm(f => ({ ...f, media_url: '', media_type: 'image', media_key: '', media_size: 0 }))}
                    >
                      Replace media
                    </button>
                  </div>
                ) : (
                  <div
                    className={`upload-zone${isDragOver ? ' drag-over' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFileUpload(e.dataTransfer.files[0]); }}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files[0])} />
                    <div className="upload-zone-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-0)', marginBottom: 4 }}>
                        {uploading ? `Uploading… ${uploadProgress}%` : 'Drop file here or click to browse'}
                      </div>
                      <div className="caption">Images and videos up to 500MB</div>
                    </div>
                    {uploading && (
                      <div className="progress-bar" style={{ width: '100%', maxWidth: 260 }}>
                        <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Aspect ratio */}
              <div className="form-group">
                <label className="form-label">Aspect Ratio</label>
                <div style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
                  {[{ v: 'original', l: 'Original' }, { v: 'portrait', l: '9:16' }, { v: 'landscape', l: '16:9' }, { v: 'square', l: '1:1' }].map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      className={`btn btn-sm ${form.thumbnail_url === opt.v ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setForm(f => ({ ...f, thumbnail_url: opt.v }))}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Post Title <span style={{ color: 'var(--text-3)' }}>(optional)</span></label>
                <input className="form-input" placeholder="Title for list view only…" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s-2)' }}>
                  <label className="form-label" style={{ margin: 0 }}>Caption</label>
                  <span className="caption">{form.caption.length} chars</span>
                </div>
                <textarea className="form-textarea" rows={5} placeholder="Write your caption…" value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Hashtags <span style={{ color: 'var(--text-3)' }}>(optional)</span></label>
                <input className="form-input" placeholder="#summer #brand #vibes" value={form.hashtags} onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Date <span style={{ color: 'var(--text-3)' }}>(optional)</span></label>
                <input type="datetime-local" className="form-input" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-secondary" onClick={() => setStep(0)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
              </button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Preview
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          {/* Live preview panel */}
          <div style={{ position: 'sticky', top: 'var(--s-4)' }}>
            <div className="label" style={{ marginBottom: 'var(--s-3)' }}>Live Preview</div>
            <PlatformPreview
              platform={form.platform[0] || 'instagram'}
              caption={form.caption}
              hashtags={form.hashtags}
              mediaUrl={form.media_url}
              mediaType={form.media_type}
              aspectRatio={form.thumbnail_url}
            />
          </div>
        </div>
      )}

      {/* Step 2: Preview & Publish */}
      {step === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--s-6)', animation: 'slideUp 0.3s var(--ease-out)' }}>
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Ready to publish</h2>
              <span className="caption">Review and create your draft</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
              <div className="card" style={{ background: 'var(--bg-1)' }}>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
                  {[
                    { label: 'Platforms', value: form.platform.join(', ') || '—' },
                    { label: 'Caption', value: form.caption ? form.caption.slice(0, 120) + (form.caption.length > 120 ? '…' : '') : '—' },
                    { label: 'Media', value: form.media_url ? '✓ Uploaded' : 'None' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', gap: 'var(--s-4)' }}>
                      <span className="label" style={{ width: 80, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', padding: 'var(--s-4)', display: 'flex', gap: 'var(--s-3)' }}>
                <div style={{ color: 'var(--accent)', marginTop: 2 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6, margin: 0 }}>
                  Your post will be saved as a <strong style={{ color: 'var(--text-0)' }}>draft</strong>. Send it for client review from the post detail page.
                </p>
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Edit
              </button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Creating…' : `Create ${form.platform.length} Post${form.platform.length > 1 ? 's' : ''}`}
                {!submitting && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>}
              </button>
            </div>
          </div>

          <div style={{ position: 'sticky', top: 'var(--s-4)' }}>
            <div className="label" style={{ marginBottom: 'var(--s-3)' }}>Preview</div>
            <PlatformPreview
              platform={form.platform[0] || 'instagram'}
              caption={form.caption}
              hashtags={form.hashtags}
              mediaUrl={form.media_url}
              mediaType={form.media_type}
              aspectRatio={form.thumbnail_url}
            />
          </div>
        </div>
      )}
    </div>
  );
}
