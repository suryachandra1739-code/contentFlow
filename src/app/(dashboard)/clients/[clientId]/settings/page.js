'use client';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import PageTransition from '@/components/PageTransition';

export default function ClientSettingsPage() {
  const { clientId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const addToast = useToast();

  const [client, setClient] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [disconnectTarget, setDisconnectTarget] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Handle OAuth redirect query params
  useEffect(() => {
    const connected = searchParams.get('connected');
    const accounts = searchParams.get('accounts');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (connected === 'true') {
      addToast(accounts ? `Connected: ${decodeURIComponent(accounts)}` : 'Social accounts connected successfully!', 'success');
      window.history.replaceState({}, '', `/clients/${clientId}/settings`);
    } else if (error) {
      addToast(message ? decodeURIComponent(message) : `OAuth error: ${error}`, 'error');
      window.history.replaceState({}, '', `/clients/${clientId}/settings`);
    }
  }, [searchParams, clientId, addToast]);

  // Load client info + connections
  useEffect(() => {
    async function load() {
      try {
        const [clientRes, connRes] = await Promise.all([
          fetch(`/api/clients?clientId=${clientId}`),
          fetch(`/api/social-connections?clientId=${clientId}`),
        ]);
        const clientData = await clientRes.json();
        const connData = await connRes.json();

        if (Array.isArray(clientData) && clientData.length > 0) {
          setClient(clientData[0]);
        } else if (clientData && !clientData.error) {
          setClient(clientData);
        }
        setConnections(Array.isArray(connData) ? connData : []);
      } catch (err) {
        console.error('Failed to load settings:', err);
        addToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clientId, addToast]);

  const handleConnect = () => {
    window.location.href = `/api/auth/instagram?clientId=${clientId}`;
  };

  const handleVerify = async (connectionId) => {
    setVerifyingId(connectionId);
    try {
      const res = await fetch('/api/social-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', connectionId }),
      });
      const result = await res.json();
      if (result.valid) {
        addToast('Token is valid ✓', 'success');
        setConnections(prev => prev.map(c =>
          c.id === connectionId ? { ...c, token_valid: true, last_verified_at: result.last_verified_at } : c
        ));
      } else {
        addToast(`Token invalid: ${result.details?.error || 'Verification failed'}`, 'error');
        setConnections(prev => prev.map(c =>
          c.id === connectionId ? { ...c, token_valid: false, last_verified_at: result.last_verified_at } : c
        ));
      }
    } catch {
      addToast('Verification request failed', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;
    setDisconnecting(true);
    try {
      const res = await fetch(`/api/social-connections?id=${disconnectTarget.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.error) {
        addToast(result.error, 'error');
      } else {
        addToast(`${disconnectTarget.platform === 'instagram' ? 'Instagram' : 'Facebook'} disconnected`, 'success');
        setConnections(prev => prev.filter(c => c.id !== disconnectTarget.id));
      }
    } catch {
      addToast('Failed to disconnect', 'error');
    } finally {
      setDisconnecting(false);
      setDisconnectTarget(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const PlatformIcon = ({ platform, size = 20 }) => {
    if (platform === 'instagram') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="fade-in empty-state" style={{ padding: 60 }}>Loading settings...</div>
      </PageTransition>
    );
  }

  const companyName = client?.company_name || 'Client';
  const initial = companyName[0]?.toUpperCase() || 'C';
  const hash = companyName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const gradients = [
    'linear-gradient(135deg, #4f46e5, #3730a3)',
    'linear-gradient(135deg, #2563eb, #1d4ed8)',
    'linear-gradient(135deg, #7c3aed, #5b21b6)',
    'linear-gradient(135deg, #db2777, #9d174d)',
    'linear-gradient(135deg, #0ea5e9, #0369a1)',
    'linear-gradient(135deg, #0d9488, #115e59)',
  ];
  const avatarGrad = gradients[hash % gradients.length];

  const fbConn = connections.find(c => c.platform === 'facebook');
  const igConn = connections.find(c => c.platform === 'instagram');
  const hasConnections = connections.length > 0;

  return (
    <PageTransition>
      <div className="fade-in" style={{ position: 'relative', maxWidth: 860, margin: '0 auto' }}>

        {/* Background glows */}
        <div style={{ position: 'absolute', top: -100, left: '20%', width: 260, height: 260, background: 'rgba(37, 99, 235, 0.06)', filter: 'blur(100px)', pointerEvents: 'none', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -80, right: '10%', width: 300, height: 300, background: 'rgba(224, 92, 54, 0.04)', filter: 'blur(120px)', pointerEvents: 'none', borderRadius: '50%' }} />

        <style>{`
          .settings-card {
            background: var(--bg-card-glass);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 24px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .conn-card {
            background: var(--bg-layer);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 20px;
            transition: all 0.3s ease;
          }
          .conn-card:hover {
            border-color: rgba(255,255,255,0.12);
          }
          .conn-btn {
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid var(--border);
            background: rgba(255,255,255,0.03);
            color: var(--text-secondary);
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .conn-btn:hover {
            background: rgba(255,255,255,0.06);
            color: var(--text-primary);
          }
          .conn-btn-danger:hover {
            background: rgba(229, 72, 77, 0.1);
            border-color: rgba(229, 72, 77, 0.3);
            color: #e5484d;
          }
          .connect-cta {
            background: linear-gradient(135deg, #1877f2, #0d65d9);
            color: #fff;
            border: none;
            padding: 14px 28px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 16px rgba(24, 119, 242, 0.3);
          }
          .connect-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(24, 119, 242, 0.4);
          }
          .health-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            border-radius: 99px;
            font-size: 11px;
            font-weight: 600;
          }
          .health-valid {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
          }
          .health-invalid {
            background: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
          }
        `}</style>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, fontSize: 13, color: 'var(--text-secondary)' }}>
          <span onClick={() => router.push('/clients')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--text-primary)'} onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
            Partners Directory
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{companyName}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Settings</span>
        </div>

        {/* Client Header Card */}
        <div className="settings-card" style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            backgroundImage: avatarGrad, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', flexShrink: 0,
          }}>{initial}</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{companyName}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Social account connections & publishing settings
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: hasConnections ? '#10b981' : '#f59e0b',
              boxShadow: hasConnections ? '0 0 10px #10b981' : '0 0 10px #f59e0b',
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: hasConnections ? '#10b981' : '#f59e0b' }}>
              {hasConnections ? `${connections.length} Connected` : 'Not Connected'}
            </span>
          </div>
        </div>

        {/* Connected Accounts Section */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Connected Accounts</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Manage social media connections for automated publishing
              </p>
            </div>
          </div>

          {hasConnections ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {connections.map(conn => (
                <div className="conn-card" key={conn.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Platform Icon + Profile Picture */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {conn.profile_picture_url ? (
                        <img
                          src={conn.profile_picture_url}
                          alt={conn.page_name || conn.ig_username || ''}
                          style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--border)' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: conn.platform === 'instagram'
                            ? 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)'
                            : 'linear-gradient(135deg, #1877f2, #0d65d9)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                        }}>
                          <PlatformIcon platform={conn.platform} size={22} />
                        </div>
                      )}
                      {/* Small platform badge overlay */}
                      <div style={{
                        position: 'absolute', bottom: -4, right: -4,
                        width: 20, height: 20, borderRadius: 6,
                        background: conn.platform === 'instagram'
                          ? 'linear-gradient(135deg, #833AB4, #FD1D1D)'
                          : '#1877f2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--bg-layer)', color: '#fff',
                      }}>
                        <PlatformIcon platform={conn.platform} size={10} />
                      </div>
                    </div>

                    {/* Connection Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {conn.platform === 'instagram' && conn.ig_username ? `@${conn.ig_username}` : conn.page_name || 'Facebook Page'}
                        </span>
                        <span className={`health-badge ${conn.token_valid ? 'health-valid' : 'health-invalid'}`}>
                          {conn.token_valid ? '✓ Active' : '⚠ Expired'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                        {conn.platform === 'instagram' ? 'Instagram Business' : 'Facebook Page'}
                        {conn.page_id && <span> · ID: {conn.page_id}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Last verified: {formatDate(conn.last_verified_at)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        className="conn-btn"
                        onClick={() => handleVerify(conn.id)}
                        disabled={verifyingId === conn.id}
                      >
                        {verifyingId === conn.id ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                            Checking...
                          </span>
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            Verify
                          </>
                        )}
                      </button>
                      <button
                        className="conn-btn conn-btn-danger"
                        onClick={() => setDisconnectTarget(conn)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="settings-card" style={{
              textAlign: 'center', padding: '48px 24px',
              border: '1px dashed var(--border)',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
                background: 'rgba(24, 119, 242, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1877f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                No Social Accounts Connected
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.5 }}>
                Connect {companyName}&apos;s Facebook Page and Instagram Business account to enable automated post publishing.
              </p>
              <button className="connect-cta" onClick={handleConnect}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                Connect Instagram &amp; Facebook
              </button>
            </div>
          )}
        </div>

        {/* Connect Another / Reconnect Button (shown when already connected) */}
        {hasConnections && (
          <div className="settings-card" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap',
          }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Reconnect or Update</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Re-authorize to refresh tokens or connect a different Page
              </p>
            </div>
            <button className="connect-cta" onClick={handleConnect} style={{ padding: '10px 20px', fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Re-authorize Meta
            </button>
          </div>
        )}

        {/* Spinner keyframe */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {/* Disconnect Confirmation Modal */}
        {disconnectTarget && (
          <div className="modal-overlay" onClick={() => setDisconnectTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{
              maxWidth: 420, background: 'rgba(30,41,59,0.95)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
            }}>
              <div className="modal-header">
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Disconnect Account</h2>
                <button className="btn-icon" onClick={() => setDisconnectTarget(null)} style={{ fontSize: 20, color: 'var(--text-secondary)' }}>✕</button>
              </div>
              <div className="modal-body" style={{ padding: '20px 24px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                  Are you sure you want to disconnect <strong style={{ color: 'var(--text-primary)' }}>
                  {disconnectTarget.platform === 'instagram' && disconnectTarget.ig_username
                    ? `@${disconnectTarget.ig_username}`
                    : disconnectTarget.page_name || 'this account'}
                  </strong>? Automated publishing to this account will stop immediately.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDisconnectTarget(null)} disabled={disconnecting} style={{ fontWeight: 600 }}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDisconnect} disabled={disconnecting} style={{ fontWeight: 600 }}>
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
