'use client';
import PageTransition from '@/components/PageTransition';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [inviteTarget, setInviteTarget] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'pending'
  
  const [inviteForm, setInviteForm] = useState({ 
    name: '', 
    email: '', 
    contractUrl: '', 
    contractName: '',
    roadmapUrl: 'https://greymatterx.io/hemvedh/day-32?fbclid=PAVERFWASCRaFleHRuA2FlbQIxMABzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAae_DKePFp1_l2tPV3shETWq66KGb2U0g9UkPcAL-1wxg-Zx0JExs8iFQZzEYQ_aem_eCHTAzeXo97I5cpwhfyHzg'
  });
  
  const [form, setForm] = useState({ company_name: '', contact_name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const addToast = useToast();
  const router = useRouter();

  const load = () => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClients(data);
        } else {
          console.error('Clients API error:', data);
          setClients([]);
        }
        setLoading(false);
      })
      .catch(() => { setClients([]); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    if (result.error) {
      addToast(result.error, 'error');
      return;
    }
    setShowModal(false);
    setForm({ company_name: '', contact_name: '', email: '' });
    addToast('Client workspace created!', 'success');
    setClients(prev => [result, ...prev]);
    router.refresh();
  };

  const handleConfirmDelete = async (id) => {
    const res = await fetch(`/api/clients?clientId=${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.error) {
      addToast(result.error, 'error');
      setDeleteTarget(null);
      return;
    }
    addToast('Client workspace deleted', 'success');
    setClients(prev => prev.filter(c => c.id !== id));
    setDeleteTarget(null);
    router.refresh();
  };

  const handleInviteClient = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email,
          name: inviteForm.name,
          role: 'client',
          client_id: inviteTarget.id,
          contractUrl: inviteForm.contractUrl,
          contractName: inviteForm.contractName,
          roadmapUrl: inviteForm.roadmapUrl,
        }),
      });
      const result = await res.json();
      if (result.error) {
        addToast(result.error, 'error');
      } else if (result.emailSent) {
        addToast(`Invitation email sent to ${inviteForm.email}!`, 'success');
        closeInviteModal();
      } else if (result.inviteLink) {
        addToast('Email delivery failed. Copy the link below to share manually.', 'error');
        setGeneratedLink(result.inviteLink);
      } else {
        addToast('Invitation created successfully!', 'success');
        closeInviteModal();
      }
    } catch (err) {
      addToast('Failed to send invite', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    addToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const closeInviteModal = () => {
    setInviteTarget(null);
    setInviteForm({ 
      name: '', 
      email: '', 
      contractUrl: '', 
      contractName: '',
      roadmapUrl: 'https://greymatterx.io/hemvedh/day-32?fbclid=PAVERFWASCRaFleHRuA2FlbQIxMABzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAae_DKePFp1_l2tPV3shETWq66KGb2U0g9UkPcAL-1wxg-Zx0JExs8iFQZzEYQ_aem_eCHTAzeXo97I5cpwhfyHzg'
    });
    setGeneratedLink('');
  };

  // Dynamic Metrics
  const totalWorkspaces = clients.length;
  const activePortals = clients.filter(c => c.email).length; // Simulated active user portals
  const pendingOnboarding = clients.length - activePortals;

  // Filter & Search Logic
  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'active') {
      return matchesSearch && c.email;
    } else if (activeFilter === 'pending') {
      return matchesSearch && !c.email;
    }
    return matchesSearch;
  });

  if (loading) return <div className="fade-in empty-state">Loading client workspaces...</div>;

  return (
    <PageTransition>
      <div className="fade-in" style={{ position: 'relative' }}>
        
        {/* Background glowing gradients */}
        <div style={{ position: 'absolute', top: -120, left: '15%', width: 280, height: 280, background: 'rgba(37, 99, 235, 0.08)', filter: 'blur(100px)', pointerEvents: 'none', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -100, right: '5%', width: 360, height: 360, background: 'rgba(16, 185, 129, 0.04)', filter: 'blur(120px)', pointerEvents: 'none', borderRadius: '50%' }} />

        {/* CSS Overrides for Premium Design */}
        <style>{`
          .workspace-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 24px;
            margin-top: 28px;
          }
          .workspace-card {
            background: var(--bg-card-glass);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 24px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 220px;
            box-shadow: var(--shadow-sm);
          }
          .workspace-card:hover {
            transform: translateY(-5px);
            border-color: rgba(37, 99, 235, 0.3);
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.1), 0 0 20px rgba(37, 99, 235, 0.05);
          }
          .workspace-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
            opacity: 0;
            transition: opacity 0.3s;
          }
          .workspace-card:hover::before {
            opacity: 1;
            background: linear-gradient(90deg, transparent, var(--accent), transparent);
          }
          .stat-glow-card {
            background: var(--bg-card-glass);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 20px 24px;
            position: relative;
            overflow: hidden;
            box-shadow: var(--shadow-sm);
          }
          .stat-glow-card::after {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            filter: blur(40px);
            opacity: 0.12;
            pointer-events: none;
          }
          .stat-blue::after { background: var(--accent); }
          .stat-green::after { background: #3b82f6; }
          .stat-amber::after { background: #f59e0b; }
          
          .search-pill-btn {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            color: var(--text-secondary);
            font-size: 13px;
            font-weight: 500;
            padding: 8px 16px;
            border-radius: 99px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .search-pill-btn:hover {
            background: rgba(255, 255, 255, 0.06);
            color: var(--text-primary);
          }
          .search-pill-btn.active {
            background: var(--accent);
            border-color: var(--accent);
            color: #fff;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
          }
        `}</style>

        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Partners Directory</h1>
                <span style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)', fontSize: 13, fontWeight: 600, padding: '4px 10px', borderRadius: 99 }}>
                  {totalWorkspaces} Total
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Configure secure workspaces, audit contract agreements, and review onboarding progress</p>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowModal(true)} 
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, borderRadius: 10 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Workspace
            </button>
          </div>
        </div>

        {/* Dashboard Mini metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
          
          <div className="stat-glow-card stat-blue">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Managed Platforms</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>{totalWorkspaces}</div>
            <div style={{ width: '100%', height: 3, background: 'var(--accent)', borderRadius: 2, marginTop: 12, opacity: 0.6 }} />
          </div>

          <div className="stat-glow-card stat-green">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Client Portals</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6', marginTop: 8 }}>{activePortals}</div>
            <div style={{ width: '100%', height: 3, background: '#3b82f6', borderRadius: 2, marginTop: 12, opacity: 0.6 }} />
          </div>

          <div className="stat-glow-card stat-amber">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Setup Links Pending</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b', marginTop: 8 }}>{pendingOnboarding}</div>
            <div style={{ width: '100%', height: 3, background: '#f59e0b', borderRadius: 2, marginTop: 12, opacity: 0.6 }} />
          </div>

        </div>

        {/* Search & Filter Pill Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', background: 'var(--bg-card-glass)', border: '1px solid var(--border)', borderRadius: 16, padding: 12, marginBottom: 24 }}>
          
          {/* Custom Glassmorphic Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <svg 
              width="15" 
              height="15" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Search partner, contact name, or email..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 38px',
                background: 'var(--bg-layer)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.2s'
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`search-pill-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
              All Clients
            </button>
            <button className={`search-pill-btn ${activeFilter === 'active' ? 'active' : ''}`} onClick={() => setActiveFilter('active')}>
              Active Portals
            </button>
            <button className={`search-pill-btn ${activeFilter === 'pending' ? 'active' : ''}`} onClick={() => setActiveFilter('pending')}>
              Pending Onboarding
            </button>
          </div>

        </div>
        
        {/* Dynamic Empty State */}
        {filteredClients.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 24px', background: 'var(--bg-card-glass)', border: '1px dashed var(--border)', borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', marginBottom: 16 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>No workspaces found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4, textAlign: 'center', maxWidth: 320 }}>
              Try adjusting your filters, searching for a different keyword, or add a new workspace to get started.
            </p>
          </div>
        ) : (
          
          /* Clients Workspace Cards Grid */
          <div className="workspace-grid">
            {filteredClients.map(c => {
              const isPortalActive = !!c.email;
              
              // Generate highly bespoke avatar gradient based on initials/ID
              const hash = c.company_name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
              const gradients = [
                'linear-gradient(135deg, #4f46e5, #3730a3)', // Indigo
                'linear-gradient(135deg, #2563eb, #1d4ed8)', // Blue
                'linear-gradient(135deg, #7c3aed, #5b21b6)', // Violet
                'linear-gradient(135deg, #db2777, #9d174d)', // Pink
                'linear-gradient(135deg, #0ea5e9, #0369a1)', // Sky
                'linear-gradient(135deg, #0d9488, #115e59)'  // Teal
              ];
              const gradIndex = hash % gradients.length;
              const avatarGrad = c.avatar_color && c.avatar_color !== '#161616' 
                ? c.avatar_color 
                : gradients[gradIndex];

              return (
                <div className="workspace-card" key={c.id}>
                  
                  {/* Top Header Section */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                    <div 
                      style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => router.push(`/projects?clientId=${c.id}`)}
                      title="View Projects"
                    >
                      <img src="/default-avatar.jpg" alt={c.company_name} style={{ width: 44, height: 44, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{c.company_name}</div>
                        
                        {/* Status Badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <span style={{ 
                            width: 6, 
                            height: 6, 
                            borderRadius: '50%', 
                            background: isPortalActive ? '#3b82f6' : '#f59e0b',
                            boxShadow: isPortalActive ? '0 0 8px #3b82f6' : '0 0 8px #f59e0b'
                          }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: isPortalActive ? '#3b82f6' : '#f59e0b' }}>
                            {isPortalActive ? 'Active Workspace' : 'Setup Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Delete Trash Button */}
                    <button 
                      className="btn-delete" 
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }} 
                      title="Delete workspace"
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>

                  {/* Card Metadata / Body */}
                  <div style={{ background: 'var(--bg-layer)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, margin: '8px 0 20px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Contact:</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.contact_name || 'Not assigned'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{c.email || 'No portal email'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Created:</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'}
                      </span>
                    </div>

                  </div>

                  {/* Card Action CTAs Footer */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => router.push(`/projects?clientId=${c.id}`)}
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 8, 
                        fontSize: 12,
                        padding: '10px 14px',
                        borderRadius: 8,
                        fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      Projects
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => router.push(`/clients/${c.id}/settings`)}
                      title="Connect YouTube, Instagram & Facebook accounts"
                      style={{ 
                        flex: 1,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 6, 
                        fontSize: 12,
                        padding: '10px 14px',
                        borderRadius: 8,
                        fontWeight: 600,
                        border: '1px solid rgba(255, 0, 0, 0.25)',
                        background: 'rgba(255, 0, 0, 0.06)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      Connect YouTube / Socials
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => { 
                        setInviteTarget(c); 
                        setInviteForm({ 
                          name: c.contact_name || '', 
                          email: c.email || '', 
                          contractUrl: '', 
                          contractName: '',
                          roadmapUrl: 'https://greymatterx.io/hemvedh/day-32?fbclid=PAVERFWASCRaFleHRuA2FlbQIxMABzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAae_DKePFp1_l2tPV3shETWq66KGb2U0g9UkPcAL-1wxg-Zx0JExs8iFQZzEYQ_aem_eCHTAzeXo97I5cpwhfyHzg'
                        }); 
                      }}
                      title="Configure & send portal login invite"
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 8, 
                        fontSize: 12,
                        padding: '10px 14px',
                        borderRadius: 8,
                        fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      {isPortalActive ? 'Update' : 'Setup Portal'}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Add Workspace Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, maxWidth: 520, overflow: 'hidden' }}>
              {/* Gradient accent top bar */}
              <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #3b82f6, #06b6d4)', borderRadius: '20px 20px 0 0' }} />
              
              <div className="modal-header" style={{ padding: '24px 28px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(79, 70, 229, 0.3)',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', margin: 0, color: 'var(--text-primary)' }}>Add Partner Workspace</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0', lineHeight: 1.4 }}>Create a new client workspace for collaboration</p>
                  </div>
                </div>
                <button className="btn-icon" onClick={() => setShowModal(false)} style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                  color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', fontSize: 14
                }}>✕</button>
              </div>

              <form onSubmit={handleCreate}>
                <div className="modal-body" style={{ padding: '24px 28px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Company Name Field */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 8 }}>Company Name</label>
                      <div style={{ position: 'relative' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                        </svg>
                        <input className="form-input" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required placeholder="e.g. Acme Corp" style={{
                          background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 12, padding: '12px 16px 12px 42px', fontSize: 14,
                          transition: 'all 0.2s', width: '100%'
                        }} />
                      </div>
                    </div>
                    
                    {/* Contact Name Field */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 8 }}>Contact Name</label>
                      <div style={{ position: 'relative' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        <input className="form-input" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="e.g. Alice Smith" style={{
                          background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 12, padding: '12px 16px 12px 42px', fontSize: 14,
                          transition: 'all 0.2s', width: '100%'
                        }} />
                      </div>
                    </div>
                    
                    {/* Email Field */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 8 }}>Email Address</label>
                      <div style={{ position: 'relative' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="alice@acme.com" style={{
                          background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 12, padding: '12px 16px 12px 42px', fontSize: 14,
                          transition: 'all 0.2s', width: '100%'
                        }} />
                      </div>
                    </div>

                  </div>
                </div>

                <div className="modal-footer" style={{
                  padding: '16px 28px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(15,23,42,0.4)', display: 'flex', justifyContent: 'flex-end', gap: 12
                }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{
                    fontWeight: 600, padding: '10px 24px', borderRadius: 10, fontSize: 14
                  }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{
                    fontWeight: 600, padding: '10px 28px', borderRadius: 10, fontSize: 14,
                    background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
                    border: 'none', boxShadow: '0 4px 16px rgba(79, 70, 229, 0.3)'
                  }}>Add Partner</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, background: 'rgba(30,41,59,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}>
              <div className="modal-header">
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Confirm Deletion</h2>
                <button className="btn-icon" onClick={() => setDeleteTarget(null)} style={{ fontSize: 20, color: 'var(--text-secondary)' }}>✕</button>
              </div>
              <div className="modal-body" style={{ padding: '20px 24px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
                  Are you sure you want to delete <strong>{deleteTarget.company_name}</strong>? This action will disable their workspace access and cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)} style={{ fontWeight: 600 }}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={() => handleConfirmDelete(deleteTarget.id)} style={{ fontWeight: 600 }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Client Login Modal */}
        {inviteTarget && (
          <div className="modal-overlay" onClick={closeInviteModal}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460, background: 'rgba(30,41,59,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}>
              {generatedLink ? (
                /* Fallback: email delivery failed, show link to copy */
                <div>
                  <div className="modal-header">
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>Copy Invite Link</h2>
                    <button className="btn-icon" onClick={closeInviteModal} style={{ fontSize: 20, color: 'var(--text-secondary)' }}>✕</button>
                  </div>
                  <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ textAlign: 'center', margin: '8px 0' }}>
                      <span style={{ fontSize: 36 }}>📋</span>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                        We couldn't deliver the automated email. Share this link directly with the client:
                      </p>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Direct Onboarding Link</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input 
                          type="text" 
                          readOnly 
                          className="form-input" 
                          value={generatedLink} 
                          style={{ fontFamily: 'var(--mono)', fontSize: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)' }} 
                          onClick={e => e.target.select()}
                        />
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          onClick={handleCopyLink}
                          style={{ whiteSpace: 'nowrap', fontWeight: 600 }}
                        >
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" style={{ width: '100%', fontWeight: 600 }} onClick={closeInviteModal}>
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Initial Form Screen */
                <div>
                  <div className="modal-header">
                    <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Setup Client Portal</h2>
                    <button className="btn-icon" onClick={closeInviteModal} style={{ fontSize: 20, color: 'var(--text-secondary)' }}>✕</button>
                  </div>
                  <form onSubmit={handleInviteClient}>
                    <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                      
                      <div style={{ padding: '12px 16px', background: 'rgba(15,23,42,0.5)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src="/default-avatar.jpg" alt={inviteTarget.company_name} style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{inviteTarget.company_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Configure workspace onboarding parameters</div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Contact name</label>
                        <input className="form-input" value={inviteForm.name} onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })} required placeholder="e.g. Alice Smith" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Email address</label>
                        <input className="form-input" type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} required placeholder="alice@acme.com" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>

                      <div className="form-group" style={{ marginTop: 20 }}>
                        <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Client Roadmap & Resource Link</label>
                        <input 
                          type="url"
                          className="form-input" 
                          value={inviteForm.roadmapUrl} 
                          onChange={e => setInviteForm({ ...inviteForm, roadmapUrl: e.target.value })} 
                          required
                          placeholder="Roadmap URL" 
                          style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13 }}
                        />
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                          Links clients to automated growth roadmaps. Defaults to GreyMatterX launch roadmap.
                        </p>
                      </div>

                      <div className="form-group" style={{ marginTop: 20 }}>
                        <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Contract PDF Attachment (Optional)</label>
                        
                        <div style={{ 
                          border: '1px dashed rgba(255,255,255,0.15)', 
                          borderRadius: 12, 
                          padding: '16px', 
                          background: 'rgba(15,23,42,0.4)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                          position: 'relative'
                        }}>
                          {inviteForm.contractUrl ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                                    {inviteForm.contractName || 'contract.pdf'}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    Uploaded successfully
                                  </div>
                                </div>
                              </div>
                              <button 
                                type="button" 
                                className="btn-icon" 
                                onClick={() => setInviteForm({ ...inviteForm, contractUrl: '', contractName: '' })}
                                style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div>
                              <input 
                                type="file" 
                                accept="application/pdf"
                                id="contract-pdf-upload"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  if (file.type !== 'application/pdf') {
                                    addToast('Please upload a PDF file only', 'error');
                                    return;
                                  }
                                  if (file.size > 10 * 1024 * 1024) {
                                    addToast('Contract PDF must be less than 10MB', 'error');
                                    return;
                                  }
                                  
                                  setInviteForm(prev => ({ ...prev, contractName: 'Uploading...' }));
                                  try {
                                    const presignRes = await fetch('/api/upload/presign', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        filename: file.name,
                                        contentType: file.type,
                                        clientId: inviteTarget.id || 'contracts',
                                      })
                                    });
                                    const presignData = await presignRes.json();
                                    if (presignData.error) throw new Error(presignData.error);
                                    
                                    const uploadRes = await fetch(presignData.presignedUrl, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': file.type },
                                      body: file
                                    });
                                    if (!uploadRes.ok) throw new Error('Upload to storage failed');
                                    
                                    setInviteForm(prev => ({
                                      ...prev,
                                      contractUrl: presignData.publicUrl,
                                      contractName: file.name
                                    }));
                                    addToast('Contract PDF uploaded successfully!', 'success');
                                  } catch (err) {
                                    console.error(err);
                                    setInviteForm(prev => ({ ...prev, contractUrl: '', contractName: '' }));
                                    addToast('Failed to upload contract PDF', 'error');
                                  }
                                }}
                              />
                              <label 
                                htmlFor="contract-pdf-upload" 
                                style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  cursor: 'pointer',
                                  padding: '12px 8px',
                                  gap: 6
                                }}
                              >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', marginBottom: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {inviteForm.contractName === 'Uploading...' ? 'Uploading contract...' : 'Upload Contract PDF'}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                  Direct-to-storage PDF upload (Max 10MB)
                                </span>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={closeInviteModal} disabled={inviteLoading} style={{ fontWeight: 600 }}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={inviteLoading} style={{ fontWeight: 600 }}>
                        {inviteLoading ? 'Sending...' : 'Send Setup Invite'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
