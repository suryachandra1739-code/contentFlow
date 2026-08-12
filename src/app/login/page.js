'use client';
import { useState, Suspense } from 'react';
import { createClientBrowser } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/bits';

/* Animated aurora-sky backdrop */
function Sky() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, hsl(240 20% 6%), hsl(250 25% 8%) 55%, hsl(240 15% 5%))' }} />
      {[
        { c: '246 90% 68%', size: 560, x: '12%', y: '18%', d: '26s', delay: '0s' },
        { c: '187 92% 55%', size: 440, x: '72%', y: '58%', d: '32s', delay: '-8s' },
        { c: '280 85% 60%', size: 380, x: '55%', y: '8%', d: '38s', delay: '-16s' },
      ].map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.size, height: b.size, left: b.x, top: b.y,
            background: `radial-gradient(circle, hsl(${b.c} / 0.22), transparent 65%)`,
            filter: 'blur(40px)',
            animation: `cf-drift ${b.d} ease-in-out infinite`,
            animationDelay: b.delay,
          }}
        />
      ))}
      {/* star field */}
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: i % 3 === 0 ? 2 : 1, height: i % 3 === 0 ? 2 : 1,
            left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`,
            opacity: 0.12 + (i % 5) * 0.08,
          }}
        />
      ))}
      {/* horizon glow */}
      <div className="absolute inset-x-0 bottom-0 h-64" style={{ background: 'linear-gradient(0deg, hsl(246 90% 68% / .10), transparent)' }} />
    </div>
  );
}

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
    <div className="relative min-h-screen grid place-items-center p-4 overflow-hidden">
      <Sky />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.9, 0.3, 1] }}
        className="relative w-full max-w-[400px]"
      >
        <div className="flex flex-col items-center mb-7">
          <Logo size={46} />
          <h1 className="cf-display text-[26px] mt-4">Welcome back</h1>
          <p className="text-[13px] mt-1" style={{ color: 'hsl(240 6% 62%)' }}>
            Sign in to your ContentFlow workspace
          </p>
        </div>

        {redirectMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 mb-4 text-xs font-medium"
            style={{ background: 'hsl(38 96% 60% / .12)', border: '1px solid hsl(38 96% 60% / .3)', color: 'hsl(38 96% 70%)' }}
          >
            <AlertCircle size={14} className="shrink-0" /> {redirectMessage}
          </motion.div>
        )}

        <div className="cf-glass rounded-2xl p-6 shadow-pop">
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'hsl(240 5% 50%)' }} />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@agency.com"
                className="cf-input !h-12 !rounded-full !pl-11"
                style={{ background: 'hsl(240 10% 8% / .7)' }}
              />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'hsl(240 5% 50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="cf-input !h-12 !rounded-full !pl-11 !pr-11"
                style={{ background: 'hsl(240 10% 8% / .7)' }}
              />
              <button
                type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'hsl(240 5% 50%)' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'hsl(240 6% 62%)' }}>
                <input type="checkbox" className="accent-[hsl(246_90%_68%)]" defaultChecked /> Remember me
              </label>
              <button
                type="button"
                className="text-xs font-medium transition-colors hover:brightness-125"
                style={{ color: 'hsl(246 90% 72%)' }}
                onClick={handleResetPassword}
                disabled={resetLoading}
              >
                {resetLoading ? 'Sending...' : 'Forgot password?'}
              </button>
            </div>

            <button type="submit" className="cf-btn cf-btn-primary cf-btn-lg w-full !rounded-full mt-1" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'} {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <div className="mt-5 text-center text-xs" style={{ color: 'hsl(240 5% 48%)' }}>
            Client with an invite?{' '}
            <button onClick={() => router.push('/client-portal')} className="font-medium hover:brightness-125" style={{ color: 'hsl(187 92% 60%)' }}>
              Open client portal →
            </button>
          </div>
        </div>

        <p className="cf-mono text-center text-[10px] mt-6" style={{ color: 'hsl(240 5% 40%)' }}>
          CONTENTFLOW · SECURE SSO &amp; MFA READY
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen grid place-items-center bg-background">
        <div style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
