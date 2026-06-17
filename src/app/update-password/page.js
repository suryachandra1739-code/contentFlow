'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClientBrowser } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('checking'); // 'checking' | 'ready' | 'no-session' | 'success'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userMetadata, setUserMetadata] = useState(null);
  const [acceptedContract, setAcceptedContract] = useState(false);
  const [activeTab, setActiveTab] = useState('roadmap'); // 'roadmap' | 'contract'
  
  const router = useRouter();
  const addToast = useToast();
  const supabase = createClientBrowser();

  const checkSession = useCallback(async () => {
    try {
      // 1. First check if we already have a session (set by /auth/confirm route)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus('ready');
        setUserMetadata(session.user?.user_metadata || {});
        return;
      }

      // 2. Listen for auth state changes (handles hash fragment tokens from implicit flow)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || event === 'TOKEN_REFRESHED') {
          if (session) {
            setStatus('ready');
            setUserMetadata(session.user?.user_metadata || {});
          }
        }
      });

      // 3. Check URL for code parameter (PKCE fallback — in case user lands here directly)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          setStatus('ready');
          // Clean URL
          window.history.replaceState({}, '', '/update-password');
          return;
        }
        console.error('Client-side code exchange failed:', error);
      }

      // 4. Give hash-based auth a moment to process, then show error
      setTimeout(() => {
        setStatus(prev => prev === 'checking' ? 'no-session' : prev);
      }, 2500);

      return () => subscription.unsubscribe();
    } catch (err) {
      console.error('Session check error:', err);
      setStatus('no-session');
    }
  }, [supabase.auth]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    if (userMetadata?.contract_url && !acceptedContract) {
      addToast('Please review and accept the services contract terms to proceed', 'error');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      addToast(error.message, 'error');
      setLoading(false);
      return;
    }

    setStatus('success');
    addToast('Password set successfully! Redirecting...', 'success');

    // Redirect — middleware will route based on role
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  // --- Loading state ---
  if (status === 'checking') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #0f172a, #020617)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500 }}>Configuring your secure workspace...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // --- No session / expired link ---
  if (status === 'no-session') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #0f172a, #020617)', padding: '24px' }}>
        <div className="card fade-in" style={{ width: '100%', maxWidth: '440px', padding: '40px 32px', textAlign: 'center', background: 'rgba(30,41,59,0.5)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
          <div style={{ width: 56, height: 56, background: 'rgba(239,68,68,0.1)', borderRadius: 14, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Invite Expired or Invalid</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
            This secure onboarding link has expired or has already been used. Please reach out to your administrator to issue a new portal invite.
          </p>
          <button className="btn btn-primary" style={{ width: '100%', height: 42, fontWeight: 600 }} onClick={() => router.push('/login')}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // --- Success state ---
  if (status === 'success') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #0f172a, #020617)' }}>
        <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px 32px', textAlign: 'center', background: 'rgba(30,41,59,0.5)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
          <div style={{ width: 56, height: 56, background: 'rgba(16,185,129,0.1)', borderRadius: 14, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Password Configured!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Preparing your digital workspace dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if we have special onboarding items
  const contractUrl = userMetadata?.contract_url || '';
  const contractName = userMetadata?.contract_name || 'Client_Agreement.pdf';
  const roadmapUrl = userMetadata?.roadmap_url || 'https://greymatterx.io/hemvedh/day-32?fbclid=PAVERFWASCRaFleHRuA2FlbQIxMABzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAae_DKePFp1_l2tPV3shETWq66KGb2U0g9UkPcAL-1wxg-Zx0JExs8iFQZzEYQ_aem_eCHTAzeXo97I5cpwhfyHzg';
  const clientName = userMetadata?.name || 'Valued Client';

  // --- Password form & Premium Onboarding Portal ---
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(ellipse at bottom, #0f172a, #020617)',
      padding: '40px 24px',
      color: 'var(--text-primary)'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '1120px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: 32,
        alignItems: 'stretch'
      }}>
        
        {/* LEFT COLUMN: Create Password Form */}
        <div className="card fade-in" style={{ 
          padding: '40px 32px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          background: 'rgba(30, 41, 59, 0.45)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ 
              width: 52, 
              height: 52, 
              background: 'linear-gradient(135deg, var(--accent), #3b82f6)', 
              borderRadius: 14, 
              margin: '0 auto 16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#fff', 
              fontSize: 24,
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)'
            }}>
              🔒
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>Set Account Password</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Hello {clientName}, create a secure password to activate your portal.</p>
          </div>

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  style={{ width: '100%', paddingRight: '40px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter your password"
                  minLength={6}
                  style={{ width: '100%', paddingRight: '40px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {contractUrl && (
              <div style={{ marginTop: 8, padding: '14px', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <input 
                  type="checkbox" 
                  id="consent-checkbox"
                  checked={acceptedContract}
                  onChange={e => setAcceptedContract(e.target.checked)}
                  style={{ marginTop: 3, cursor: 'pointer' }}
                />
                <label htmlFor="consent-checkbox" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}>
                  I review and accept the terms outlined in the <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Services Contract</span>.
                </label>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', height: 44, fontSize: 15, fontWeight: 600, marginTop: 12 }} 
              disabled={loading || (contractUrl && !acceptedContract)}
            >
              {loading ? 'Creating Account...' : 'Activate & Enter Workspace'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Onboarding Hub & Growth Roadmap */}
        <div className="card fade-in" style={{ 
          padding: '40px 32px', 
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)'
        }}>
          {/* Header tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24, paddingBottom: 2, gap: 16 }}>
            <button 
              onClick={() => setActiveTab('roadmap')}
              style={{ 
                background: 'none', 
                border: 'none', 
                borderBottom: activeTab === 'roadmap' ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === 'roadmap' ? 'var(--text-primary)' : 'var(--text-secondary)',
                padding: '8px 4px', 
                fontSize: 15, 
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🚀 Growth Roadmap
            </button>
            {contractUrl && (
              <button 
                onClick={() => setActiveTab('contract')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  borderBottom: activeTab === 'contract' ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeTab === 'contract' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  padding: '8px 4px', 
                  fontSize: 15, 
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📄 Service Contract
              </button>
            )}
          </div>

          {activeTab === 'roadmap' ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Your AI Automation & Growth Strategy</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 24 }}>
                  In partnership with GreyMatterX, we utilize advanced AI automation systems to optimize your workflow and drive digital growth. Here is your structured launch roadmap:
                </p>
              </div>

              {/* Animated roadmap steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, marginBottom: 24 }}>
                
                {/* Step 1 */}
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(37,99,235,0.1)', border: '2px solid var(--accent)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      1
                    </div>
                    <div style={{ width: 2, flex: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                  </div>
                  <div style={{ paddingBottom: 8 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>CRM Integration & Tasks Automation</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Leverage customized AI systems to sync operations, eliminate repetitive administrative tasks, score prospects, and reduce operational costs.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.15)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      2
                    </div>
                    <div style={{ width: 2, flex: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                  </div>
                  <div style={{ paddingBottom: 8 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>High-Conversion Platform & Development</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Create modern, mobile-responsive layouts loaded with speed optimization and organic SEO properties to convert web traffic into sales.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.15)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      3
                    </div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Growth Marketing & Social Acceleration</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Scale your company brand with target marketing tools, organic social media growth, automatic advertising campaigns, and interactive reporting charts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Roadmap Actions */}
              <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Full AI-Growth Strategy Sheet</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Unlock detailed roadmaps, automations list & growth timelines.</div>
                </div>
                <a 
                  href={roadmapUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary" 
                  style={{ 
                    whiteSpace: 'nowrap', 
                    fontSize: 12, 
                    padding: '8px 14px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    fontWeight: 600,
                    textDecoration: 'none',
                    borderColor: 'rgba(255,255,255,0.1)'
                  }}
                >
                  Launch Strategy ↗
                </a>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Service Agreement & Contract</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
                  Please review the formal partnership agreement below. You can download a copy for your records or review it directly on this screen.
                </p>
              </div>

              {/* Embedded Document Viewer Box */}
              <div style={{ 
                flex: 1, 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                borderRadius: 12, 
                background: 'rgba(0,0,0,0.2)', 
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '260px',
                marginBottom: 20
              }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📄</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--mono)', wordBreak: 'break-all' }}>{contractName}</span>
                  </div>
                  <a 
                    href={contractUrl} 
                    download={contractName}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    📥 Download
                  </a>
                </div>
                
                {/* Embed PDF content */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                  <div style={{ maxWidth: 300 }}>
                    <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>📋</span>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Ready for Onboarding Review</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 16 }}>
                      Review this formal client contract by downloading or opening in a new tab.
                    </p>
                    <a 
                      href={contractUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ fontSize: 12, display: 'inline-flex', padding: '6px 16px', textDecoration: 'none' }}
                    >
                      Open Document in New Tab ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* Consent alert */}
              <div style={{ padding: '14px 16px', background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Ensure you review all agreement sections. You must check the acceptance box on the left password card to activate your account.
                </span>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
