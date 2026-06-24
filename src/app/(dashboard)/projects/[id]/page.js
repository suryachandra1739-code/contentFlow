'use client';
import PageTransition from '@/components/PageTransition';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import { createClientBrowser } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 28, delay: i * 0.06 }
  }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: '📷', color: '#E1306C' },
  { key: 'facebook', label: 'Facebook', icon: '📘', color: '#1877F2' },
  { key: 'twitter', label: 'Twitter / X', icon: '🐦', color: '#1DA1F2' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0A66C2' },
];

function getConfig(projectId) {
  if (typeof window === 'undefined') return {};
  const key = `cf-project-automation-${projectId}`;
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}
function saveConfig(cfg, projectId) {
  const key = `cf-project-automation-${projectId}`;
  localStorage.setItem(key, JSON.stringify(cfg));
}

const parsePostCaption = (caption) => {
  if (!caption) return { title: 'Untitled', description: '' };
  if (caption.startsWith('Title: ')) {
    const doubleNewline = caption.indexOf('\n\n');
    if (doubleNewline !== -1) {
      return { title: caption.substring(7, doubleNewline), description: caption.substring(doubleNewline + 2) };
    }
    const singleNewline = caption.indexOf('\n');
    if (singleNewline !== -1) {
      return { title: caption.substring(7, singleNewline), description: caption.substring(singleNewline + 1) };
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
  let label = diffDays > 0 ? `${diffDays}d ${diffHours}h left` : `${diffHours}h left`;
  if (diffMs < 24 * 60 * 60 * 1000) return { label, color: 'var(--red)', bg: 'rgba(229,72,77,0.15)' };
  else if (diffMs < 3 * 24 * 60 * 60 * 1000) return { label, color: 'var(--amber)', bg: 'rgba(245,166,35,0.12)' };
  return { label, color: 'var(--text-muted)', bg: 'transparent' };
};

// Reusable Date formatter for high performance inside loop rendering
const activityLogDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default function ProjectDetail() {
  const { id } = useParams();
  const router = useRouter();
  const addToast = useToast();
  const supabase = createClientBrowser();
  
  const [project, setProject] = useState(null);
  const [userRole, setUserRole] = useState('team');
  const [activeTab, setActiveTab] = useState('posts');
  const [filter, setFilter] = useState('all');
  
  const [socialConnections, setSocialConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Automation state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [dmWebhookUrl, setDmWebhookUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [dmConnectionStatus, setDmConnectionStatus] = useState('idle');
  const [platforms, setPlatforms] = useState({ instagram: true, facebook: true, twitter: false, linkedin: false, youtube: false });
  const [postForm, setPostForm] = useState({ caption: '', hashtags: '', imageUrl: '' });
  const [dmConfig, setDmConfig] = useState({ keywords: 'dm, link, free', message: '', links: '' });
  const [activityLog, setActivityLog] = useState([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
        if (profile?.role) setUserRole(profile.role);
      }
    }
    loadUser();
    
    fetch(`/api/projects/${id}`).then(r => r.json()).then(async data => {
      setProject(data);
      if (data && data.client_id) {
        setLoadingConnections(true);
        try {
          const res = await fetch(`/api/social-connections?clientId=${data.client_id}`);
          const scData = await res.json();
          setSocialConnections(Array.isArray(scData) ? scData : []);
        } catch {}
        setLoadingConnections(false);
      }
    });

    // Load config
    const cfg = getConfig(id);
    setWebhookUrl(cfg.webhookUrl || '');
    setDmWebhookUrl(cfg.dmWebhookUrl || '');
    if (cfg.platforms) setPlatforms(cfg.platforms);
    if (cfg.dmConfig) setDmConfig(cfg.dmConfig);
    setActivityLog(cfg.activityLog || []);
  }, [id]);

  const saveAll = () => {
    saveConfig({ webhookUrl, dmWebhookUrl, platforms, dmConfig, activityLog }, id);
    addToast('Automation configuration saved for this project', 'success');
  };

  const testConnection = async (url, setter) => {
    if (!url) { addToast('Enter a webhook URL first', 'error'); return; }
    setter('testing');
    try {
      const res = await fetch('/api/automations/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-connection', webhookUrl: url }),
      });
      const data = await res.json();
      setter(data.connected ? 'connected' : 'error');
      addToast(data.connected ? 'Connected to n8n!' : 'Connection failed', data.connected ? 'success' : 'error');
    } catch {
      setter('error');
      addToast('Connection failed', 'error');
    }
  };

  const handlePublish = async () => {
    if (!webhookUrl) { addToast('Configure your n8n webhook URL first', 'error'); return; }
    if (!postForm.caption) { addToast('Write a caption first', 'error'); return; }
    setPublishing(true);
    try {
      const res = await fetch('/api/automations/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, ...postForm, platforms, clientId: project?.client_id || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        const entry = { id: Date.now(), type: 'publish', caption: postForm.caption.slice(0, 50), platforms: Object.keys(platforms).filter(k => platforms[k]), time: new Date().toISOString() };
        const newLog = [entry, ...activityLog].slice(0, 20);
        saveConfig({ webhookUrl, dmWebhookUrl, platforms, dmConfig, activityLog: newLog }, id);
        setActivityLog(newLog);
        setPostForm({ caption: '', hashtags: '', imageUrl: '' });
        addToast('Published to all platforms!', 'success');
      } else {
        addToast(data.error || 'Publishing failed', 'error');
      }
    } catch (e) {
      addToast(e.message || 'Publishing failed', 'error');
    }
    setPublishing(false);
  };

  if (!project) return <div style={{padding:60,textAlign:'center',color:'var(--text-muted)'}}>Loading...</div>;

  const posts = project.posts || [];
  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter);
  const fbConnection = socialConnections.find(c => c.platform === 'facebook');
  const igConnection = socialConnections.find(c => c.platform === 'instagram');

  const sendForReview = async (postId) => {
    await fetch(`/api/posts/${postId}/status`, { method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: 'pending' }) });
    addToast('Sent for review!', 'success');
    fetch(`/api/projects/${id}`).then(r => r.json()).then(setProject);
  };

  const statusDot = (s) => ({
    idle: { bg: 'var(--text-muted)', label: 'Not connected' },
    testing: { bg: 'var(--amber)', label: 'Testing...' },
    connected: { bg: 'var(--green)', label: 'Connected' },
    error: { bg: 'var(--red)', label: 'Failed' },
  }[s] || { bg: 'var(--text-muted)', label: 'Unknown' });

  const tabs = [
    { key: 'posts', label: 'Posts', icon: '📝' },
    { key: 'posting', label: 'Posting', icon: '🚀' },
    { key: 'dmbot', label: 'DM Bot', icon: '💬' },
    { key: 'activity', label: 'Activity', icon: '📊' },
  ];

  return (
    <PageTransition><div className="fade-in">
      <div className="page-header">
        <Link href="/projects" style={{fontSize:13,color:'var(--text-muted)',display:'inline-flex',alignItems:'center',gap:4,marginBottom:8}}>← Back to Projects</Link>
        <div className="flex items-center justify-between flex-wrap gap-16">
          <div className="flex items-center gap-16">
            <div className="avatar avatar-lg" style={{ background: project.clients?.avatar_color && project.clients.avatar_color !== '#161616' ? project.clients.avatar_color : 'var(--accent-soft)', color: project.clients?.avatar_color && project.clients.avatar_color !== '#161616' ? '#ffffff' : 'var(--accent)', fontWeight: 700 }}>
              {project.clients?.company_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1>{project.name}</h1>
              <p>{project.clients?.company_name || 'No client'} · {posts.length} posts</p>
            </div>
          </div>
          {/* Social Connections Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {loadingConnections ? (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="auto-spinner" /> Accounts...</span>
            ) : socialConnections.length > 0 ? (
              <>
                {fbConnection && <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: 'rgba(24, 119, 242, 0.1)', color: '#1877F2', fontWeight: 500 }}>📘 {fbConnection.page_name}</span>}
                {igConnection && <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: 'rgba(225, 48, 108, 0.1)', color: '#E1306C', fontWeight: 500 }}>📷 @{igConnection.ig_username}</span>}
              </>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>⚠️ No accounts connected</span>
            )}
            {(activeTab === 'posting' || activeTab === 'dmbot') && (
               <button className="btn btn-primary" onClick={saveAll} style={{ fontSize: 13, padding: '8px 16px', marginLeft: 8 }}>Save Config</button>
            )}
          </div>
        </div>
      </div>

      <div className="auto-tab-bar" style={{ marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.key} className={`auto-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            <span style={{ fontSize: 15 }}>{t.icon}</span>
            <span>{t.label}</span>
            {activeTab === t.key && <motion.div className="auto-tab-indicator" layoutId="auto-tab-active-project" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'posts' && (
          <motion.div key="posts" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
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
                  <div key={post.id} className="flight-card flight-card--split" onClick={(e) => { if (!e.target.closest('.flight-card__actions') && !e.target.closest('a') && !e.target.closest('button')) { router.push(`/posts/${post.id}`); } }}>
                    <div className="flight-card__image-container">
                      {post.media_url ? (
                        post.media_type === 'video' ? (
                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <video className="flight-card__image" src={post.media_url} preload="metadata" playsInline muted style={{ pointerEvents: 'none' }} />
                            <div className="play-overlay"><div className="play-button-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div></div>
                          </div>
                        ) : (
                          <img className="flight-card__image" src={post.media_url} alt="" loading="lazy" />
                        )
                      ) : (
                        <div className={`flight-card__image fallback-gradient fallback-${post.platform}`}>
                          <span className="fallback-icon">{({ instagram: '📷', facebook: '📘', shorts: '🎬', linkedin: '💼', youtube: '▶️' })[post.platform] || '📷'}</span>
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
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85em', lineHeight: '1.4', margin: '0 0 1.25rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.8em' }}>
                          {descriptionText}
                        </p>
                      </div>
                      
                      <div className="flight-card__actions">
                        <Link href={`/posts/${post.id}`} className="flight-card__search-btn" style={{ textDecoration: 'none' }}>View Details</Link>
                        {userRole !== 'client' && post.status === 'draft' && (
                          <button className="flight-card__favorite-btn" onClick={() => sendForReview(post.id)} title="Send for Review" style={{ color: 'var(--accent)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                          </button>
                        )}
                        {userRole !== 'client' && post.review_token && post.status !== 'draft' && (
                          <button className="flight-card__favorite-btn" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/review/${post.review_token}`); addToast('Review link copied!', 'success'); }} title="Copy Link" style={{ color: 'var(--accent)' }}>
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
                {userRole !== 'client' && (
                  <>
                    <p>Create a new post for this project</p>
                    <Link href="/posts/new" className="btn btn-primary">+ New Post</Link>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── SOCIAL PUBLISHER TAB ─── */}
        {activeTab === 'posting' && (
          <motion.div key="posting" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--sans)' }}>n8n Webhook URL</h2>
                  <div className="auto-status-pill" style={{ '--dot-color': statusDot(connectionStatus).bg }}>
                    <span className="auto-status-dot" />
                    <span>{statusDot(connectionStatus).label}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" placeholder="https://your-n8n.example.com/webhook/social-publish" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} style={{ flex: 1 }} />
                  <button className="btn btn-secondary" onClick={() => testConnection(webhookUrl, setConnectionStatus)} style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {connectionStatus === 'testing' ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>
            </div>

            <div className="auto-grid-2">
              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 16 }}>Platforms</h2>
                  <div className="auto-platform-grid">
                    {PLATFORMS.map(p => (
                      <button key={p.key} className={`auto-platform-card ${platforms[p.key] ? 'active' : ''}`} onClick={() => setPlatforms(prev => ({ ...prev, [p.key]: !prev[p.key] }))} style={{ '--platform-color': p.color }}>
                        <span style={{ fontSize: 24 }}>{p.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</span>
                        <div className="auto-platform-toggle"><div className="auto-platform-toggle-dot" /></div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 16 }}>Quick Publish</h2>
                  <div className="form-group">
                    <label className="form-label">Caption</label>
                    <textarea className="form-textarea" rows={3} placeholder="Write your post caption..." value={postForm.caption} onChange={e => setPostForm({ ...postForm, caption: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hashtags</label>
                    <input className="form-input" placeholder="#marketing #growth #social" value={postForm.hashtags} onChange={e => setPostForm({ ...postForm, hashtags: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Image URL (optional)</label>
                    <input className="form-input" placeholder="https://example.com/image.jpg" value={postForm.imageUrl} onChange={e => setPostForm({ ...postForm, imageUrl: e.target.value })} />
                  </div>
                  <button className="btn btn-primary" onClick={handlePublish} disabled={publishing} style={{ width: '100%', marginTop: 8, padding: '12px 20px', fontSize: 14 }}>
                    {publishing ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span className="auto-spinner" /> Publishing...</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>🚀 Publish to {Object.values(platforms).filter(Boolean).length} platforms</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--sans)' }}>n8n Workflow Template</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Download and import this into your n8n instance</p>
                </div>
                <a href="/workflows/social-publisher.json" download className="btn btn-secondary" style={{ fontSize: 13, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download Workflow
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── INSTAGRAM DM BOT TAB ─── */}
        {activeTab === 'dmbot' && (
          <motion.div key="dmbot" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--sans)' }}>DM Bot Webhook URL</h2>
                  <div className="auto-status-pill" style={{ '--dot-color': statusDot(dmConnectionStatus).bg }}>
                    <span className="auto-status-dot" />
                    <span>{statusDot(dmConnectionStatus).label}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" placeholder="https://your-n8n.example.com/webhook/instagram-webhook" value={dmWebhookUrl} onChange={e => setDmWebhookUrl(e.target.value)} style={{ flex: 1 }} />
                  <button className="btn btn-secondary" onClick={() => testConnection(dmWebhookUrl, setDmConnectionStatus)} style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {dmConnectionStatus === 'testing' ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>
            </div>

            <div className="auto-info-banner" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>💡</div>
              <div>
                <strong style={{ fontSize: 13 }}>How it works</strong>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                  When someone comments a keyword (like &quot;dm&quot;) on an Instagram post in this project, n8n detects it via Meta Webhooks and auto-sends them a DM. Individual posts can also override these settings.
                </p>
              </div>
            </div>

            <div className="auto-grid-2">
              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 16 }}>Trigger Keywords</h2>
                  <div className="form-group">
                    <label className="form-label">Keywords (comma separated)</label>
                    <input className="form-input" placeholder="dm, link, free, guide" value={dmConfig.keywords} onChange={e => setDmConfig({ ...dmConfig, keywords: e.target.value })} />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>When a comment contains any of these words, the DM is triggered</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Links &amp; PDFs (one per line)</label>
                    <textarea className="form-textarea" rows={4} placeholder={"https://your-website.com/guide\nhttps://your-website.com/pricing.pdf"} value={dmConfig.links} onChange={e => setDmConfig({ ...dmConfig, links: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 16 }}>DM Message Template</h2>
                  <div className="form-group">
                    <label className="form-label">Auto-reply message</label>
                    <textarea className="form-textarea" rows={6} placeholder={"Hey {name}! 👋\n\nThanks for your interest! Here are the resources:\n\n🔗 {links}\n\nFeel free to reply if you have questions!"} value={dmConfig.message} onChange={e => setDmConfig({ ...dmConfig, message: e.target.value })} />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Use {'{name}'} for commenter name.</p>
                  </div>

                  <div className="auto-dm-preview">
                    <div className="auto-dm-preview-header">
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700 }}>IG</div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>DM Preview</span>
                    </div>
                    <div className="auto-dm-bubble">
                      {dmConfig.message || 'Hey {name}! 👋 Thanks for your interest! Here are the resources you requested...'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-body">
                <h3 style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 12 }}>⚠️ Meta API Requirements</h3>
                <div className="auto-requirements-grid">
                  {[
                    { icon: '✅', text: 'Instagram Business or Creator account' },
                    { icon: '✅', text: 'Linked to a Facebook Page' },
                    { icon: '✅', text: 'Meta Developer App created' },
                    { icon: '⏳', text: 'instagram_manage_messages permission (needs App Review — ~20 days)' },
                    { icon: '✅', text: 'HTTPS domain for webhook (Cloudflare Tunnel works)' },
                  ].map((req, i) => (
                    <div key={i} className="auto-requirement-item">
                      <span>{req.icon}</span>
                      <span style={{ fontSize: 13 }}>{req.text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <a href="/workflows/instagram-dm-bot.json" download className="btn btn-secondary" style={{ fontSize: 13, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download Workflow
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── ACTIVITY TAB ─── */}
        {activeTab === 'activity' && (
          <motion.div key="activity" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <div className="card">
              <div className="card-body">
                <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 16 }}>Recent Activity</h2>
                {activityLog.length === 0 ? (
                  <div className="empty-state" style={{ padding: '48px 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No automated posts yet.</p>
                  </div>
                ) : (
                  <motion.div className="segmented-list" variants={stagger} initial="hidden" animate="visible">
                    {activityLog.map((entry, i) => (
                      <motion.div key={entry.id} variants={fadeUp} custom={i} className="segmented-list-item" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--green)', flexShrink: 0 }} />
                          <div className="truncate">
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 14 }}>
                              {entry.type === 'publish' ? '🚀 Published' : '💬 DM Sent'}
                            </span>
                            <span style={{ color: 'var(--text-muted)', margin: '0 8px', opacity: 0.4 }}>/</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{entry.caption}...</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {entry.platforms?.map(p => <span key={p} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 500 }}>{p}</span>)}
                          <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                            {activityLogDateFormatter.format(new Date(entry.time))}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div></PageTransition>
  );
}
