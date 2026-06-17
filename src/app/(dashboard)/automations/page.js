'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import { useToast } from '@/components/Toast';
import SetupGuidePage from './setup/page';

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

function getConfig() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem('cf-automation-config') || '{}'); } catch { return {}; }
}
function saveConfig(cfg) {
  localStorage.setItem('cf-automation-config', JSON.stringify(cfg));
}

export default function AutomationsPage() {
  const addToast = useToast();
  const [activeTab, setActiveTab] = useState('publisher');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [dmWebhookUrl, setDmWebhookUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [dmConnectionStatus, setDmConnectionStatus] = useState('idle');
  const [platforms, setPlatforms] = useState({ instagram: true, facebook: true, twitter: false, linkedin: false });
  const [postForm, setPostForm] = useState({ caption: '', hashtags: '', imageUrl: '' });
  const [dmConfig, setDmConfig] = useState({ keywords: 'dm, link, free', message: '', links: '' });
  const [publishing, setPublishing] = useState(false);
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    const cfg = getConfig();
    if (cfg.webhookUrl) setWebhookUrl(cfg.webhookUrl);
    if (cfg.dmWebhookUrl) setDmWebhookUrl(cfg.dmWebhookUrl);
    if (cfg.platforms) setPlatforms(cfg.platforms);
    if (cfg.dmConfig) setDmConfig(cfg.dmConfig);
    if (cfg.activityLog) setActivityLog(cfg.activityLog);
  }, []);

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

  const saveAll = () => {
    saveConfig({ webhookUrl, dmWebhookUrl, platforms, dmConfig, activityLog });
    addToast('Configuration saved', 'success');
  };

  const handlePublish = async () => {
    if (!webhookUrl) { addToast('Configure your n8n webhook URL first', 'error'); return; }
    if (!postForm.caption) { addToast('Write a caption first', 'error'); return; }
    setPublishing(true);
    try {
      const res = await fetch('/api/automations/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, ...postForm, platforms }),
      });
      const data = await res.json();
      if (data.success) {
        const entry = { id: Date.now(), type: 'publish', caption: postForm.caption.slice(0, 50), platforms: Object.keys(platforms).filter(k => platforms[k]), time: new Date().toISOString() };
        const newLog = [entry, ...activityLog].slice(0, 20);
        setActivityLog(newLog);
        saveConfig({ webhookUrl, dmWebhookUrl, platforms, dmConfig, activityLog: newLog });
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

  const statusDot = (s) => ({
    idle: { bg: 'var(--text-muted)', label: 'Not connected' },
    testing: { bg: 'var(--amber)', label: 'Testing...' },
    connected: { bg: 'var(--green)', label: 'Connected' },
    error: { bg: 'var(--red)', label: 'Failed' },
  }[s] || { bg: 'var(--text-muted)', label: 'Unknown' });

  const tabs = [
    { key: 'publisher', label: 'Social Publisher', icon: '🚀' },
    { key: 'dmbot', label: 'Instagram DM Bot', icon: '💬' },
    { key: 'setup', label: 'Setup Guide', icon: '📖' },
    { key: 'activity', label: 'Activity', icon: '📊' },
  ];

  return (
    <PageTransition><div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <motion.div className="page-header" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Automations</h1>
            <p>Manage your n8n-powered social media workflows</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setActiveTab('setup')} style={{ fontSize: 13, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
              Setup Guide
            </button>
            <button className="btn btn-primary" onClick={saveAll} style={{ fontSize: 13, padding: '8px 16px' }}>Save Config</button>
          </div>
        </div>
      </motion.div>

      {/* Tab Bar */}
      <motion.div className="auto-tab-bar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {tabs.map(t => (
          <button key={t.key} className={`auto-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            <span style={{ fontSize: 15 }}>{t.icon}</span>
            <span>{t.label}</span>
            {activeTab === t.key && <motion.div className="auto-tab-indicator" layoutId="auto-tab-active" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ─── SOCIAL PUBLISHER TAB ─── */}
        {activeTab === 'publisher' && (
          <motion.div key="publisher" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {/* Webhook Config */}
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
              {/* Platform Toggles */}
              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 16 }}>Platforms</h2>
                  <div className="auto-platform-grid">
                    {PLATFORMS.map(p => (
                      <button key={p.key} className={`auto-platform-card ${platforms[p.key] ? 'active' : ''}`} onClick={() => setPlatforms(prev => ({ ...prev, [p.key]: !prev[p.key] }))} style={{ '--platform-color': p.color }}>
                        <span style={{ fontSize: 24 }}>{p.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</span>
                        <div className="auto-platform-toggle">
                          <div className="auto-platform-toggle-dot" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Post Form */}
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span className="auto-spinner" /> Publishing...
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        🚀 Publish to {Object.values(platforms).filter(Boolean).length} platforms
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Workflow Download */}
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
            {/* DM Webhook Config */}
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

            {/* DM Bot Info Banner */}
            <div className="auto-info-banner" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>💡</div>
              <div>
                <strong style={{ fontSize: 13 }}>How it works</strong>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                  When someone comments a keyword (like &quot;dm&quot;) on your Instagram post, n8n detects it via Meta Webhooks and auto-sends them a DM with your links and PDFs. Works like ManyChat — but free and self-hosted.
                </p>
              </div>
            </div>

            <div className="auto-grid-2">
              {/* Keywords Config */}
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
                    <textarea className="form-textarea" rows={4} placeholder={"https://your-website.com/guide\nhttps://your-website.com/pricing.pdf\nhttps://calendly.com/your-link"} value={dmConfig.links} onChange={e => setDmConfig({ ...dmConfig, links: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* DM Message Template */}
              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 16 }}>DM Message Template</h2>
                  <div className="form-group">
                    <label className="form-label">Auto-reply message</label>
                    <textarea className="form-textarea" rows={6} placeholder={"Hey {name}! 👋\n\nThanks for your interest! Here are the resources:\n\n🔗 {links}\n\nFeel free to reply if you have questions!"} value={dmConfig.message} onChange={e => setDmConfig({ ...dmConfig, message: e.target.value })} />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Use {'{name}'} for commenter name. Configure the actual template in n8n workflow.</p>
                  </div>

                  {/* DM Preview */}
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

            {/* Meta Requirements Banner */}
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
                  <button className="btn btn-primary" onClick={() => setActiveTab('setup')} style={{ fontSize: 13, padding: '8px 16px' }}>View Setup Guide →</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── SETUP GUIDE TAB ─── */}
        {activeTab === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <SetupGuidePage embedded={true} />
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
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No automated posts yet. Use the Social Publisher to get started.</p>
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
                            {new Date(entry.time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
