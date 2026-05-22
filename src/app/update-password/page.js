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
  const router = useRouter();
  const addToast = useToast();
  const supabase = createClientBrowser();

  const checkSession = useCallback(async () => {
    try {
      // 1. First check if we already have a session (set by /auth/confirm route)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus('ready');
        return;
      }

      // 2. Listen for auth state changes (handles hash fragment tokens from implicit flow)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || event === 'TOKEN_REFRESHED') {
          if (session) {
            setStatus('ready');
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Verifying your access link...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // --- No session / expired link ---
  if (status === 'no-session') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, background: 'rgba(229,72,77,0.1)', borderRadius: 10, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 8 }}>Link Expired or Invalid</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            This password link has expired or has already been used. Please ask your administrator to send a new invite.
          </p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => router.push('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // --- Success state ---
  if (status === 'success') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, background: 'rgba(46,160,67,0.1)', borderRadius: 10, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✅</div>
          <h1 style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 8 }}>Password Set!</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Redirecting you to your dashboard...</p>
        </div>
      </div>
    );
  }

  // --- Password form ---
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 8, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20 }}>
            🔒
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 8 }}>Set your password</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Create a password to secure your account</p>
        </div>

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: 6 }}>New Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Minimum 6 characters"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: 6 }}>Confirm Password</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter your password"
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Saving...' : 'Save Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
