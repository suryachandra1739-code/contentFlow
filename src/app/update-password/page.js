'use client';
import { useState, useEffect } from 'react';
import { createClientBrowser } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const addToast = useToast();
  const supabase = createClientBrowser();

  useEffect(() => {
    // Check if the user is actually authenticated from the invite/reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Sometimes the session takes a moment to be established from the URL hash
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) setIsReady(true);
        });
        
        // Timeout just in case they arrived without a valid token
        setTimeout(() => {
          if (!isReady) {
            // Not redirecting immediately just in case the hash is still processing
            setIsReady(true); 
          }
        }, 1500);

        return () => authListener.subscription.unsubscribe();
      } else {
        setIsReady(true);
      }
    };
    
    checkSession();
  }, [supabase.auth, isReady]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      addToast('Password should be at least 6 characters long', 'error');
      return;
    }
    
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      addToast(error.message, 'error');
      setLoading(false);
      return;
    }

    addToast('Password set successfully! Redirecting...', 'success');
    
    // Redirect logic: we can just push to '/' and middleware will handle team/client routing
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  if (!isReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Verifying access link...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 8, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20 }}>
            🔒
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 8 }}>Set your password</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Please create a new password to secure your account</p>
        </div>

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Saving...' : 'Save Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
