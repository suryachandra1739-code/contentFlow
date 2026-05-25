'use client';
import { useState, Suspense } from 'react';
import { createClientBrowser } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';

import ClaudeLogo from '@/components/ClaudeLogo';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectMessage = searchParams.get('message');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const addToast = useToast();
  const supabase = createClientBrowser();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      addToast(error.message, 'error');
      setLoading(false);
      return;
    }

    addToast('Logged in successfully', 'success');
    router.push('/'); // Middleware will handle further routing based on role
  };

  const handleResetPassword = async () => {
    if (!email) {
      addToast('Please enter your email first', 'error');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        addToast('Password reset link sent!', 'success');
      }
    } catch (err) {
      addToast('Failed to request password reset link', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="login-split-container">
      {/* Sky Clouds Background (Login Page Only) */}
      <div className="sky-cloud sky-cloud-1"></div>
      <div className="sky-cloud sky-cloud-2"></div>
      <div className="sky-cloud sky-cloud-3"></div>

      {/* Stacked Pills Form Container */}
      <form onSubmit={handleLogin} className="showcase-pills-stack" style={{ width: '100%', padding: '0 20px', boxSizing: 'border-box' }}>

        {/* Mockup Header Info */}
        <div style={{ textAlign: 'center', marginBottom: '16px', zIndex: 10 }}>
          <ClaudeLogo size={44} circleColor="rgba(218, 119, 86, 0.15)" iconColor="#da7756" style={{ margin: '0 auto 12px', border: '1px solid rgba(218, 119, 86, 0.3)', backdropFilter: 'blur(8px)' }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1e3a6c', margin: '0 0 4px 0', fontFamily: 'var(--sans)' }}>Sign in to workspace</h1>
          <p style={{ color: 'rgba(30, 58, 108, 0.75)', fontSize: 13, margin: 0, fontWeight: 500 }}>Welcome back to ContentFlow</p>
        </div>

        {redirectMessage && (
          <div style={{ zIndex: 10, padding: '10px 20px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '100px', fontSize: 12, color: '#b45309', fontWeight: 600, textAlign: 'center', maxWidth: '320px', backdropFilter: 'blur(8px)' }}>
            {redirectMessage}
          </div>
        )}

        {/* Row 1: Email Input */}
        <div className="pill-row" style={{ width: '100%', maxWidth: '380px', justifyContent: 'center' }}>
          <input
            type="email"
            className="pill-glassmorphic-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Email Address"
            style={{ width: '100%', maxWidth: '100%' }}
          />
        </div>

        {/* Row 2: Password Input & Show/Hide Toggle */}
        <div className="pill-row" style={{ width: '100%', maxWidth: '380px', justifyContent: 'center', gap: '12px' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            className="pill-solid-white-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Password"
            style={{ flex: 1, letterSpacing: showPassword ? 'normal' : '0.12em', paddingRight: '20px', minWidth: 0, width: 'auto' }}
          />
          <button
            type="button"
            className="pill-floating-icon"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{ border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1e3a6c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1e3a6c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
        </div>

        {/* Row 3: Submit Button */}
        <div className="pill-row" style={{ width: '100%', maxWidth: '380px', justifyContent: 'center' }}>
          <button type="submit" className="pill-native-backend-btn" disabled={loading} style={{ width: '100%', maxWidth: '100%' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        {/* Row 4: Forgot Password Button */}
        <div className="pill-row" style={{ width: '100%', maxWidth: '380px', justifyContent: 'center', marginTop: '4px' }}>
          <button
            type="button"
            className="pill-glassmorphic-btn"
            onClick={handleResetPassword}
            disabled={resetLoading}
            style={{ padding: '12px 24px', fontSize: '14px', background: 'transparent', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            {resetLoading ? 'Sending...' : 'Forgot password?'}
          </button>
        </div>

      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
