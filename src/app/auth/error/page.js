'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Something went wrong with authentication.';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '420px', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, background: 'rgba(229,72,77,0.1)', borderRadius: 12, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
          ⚠️
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--sans)', marginBottom: 12, color: 'var(--text-primary)' }}>
          Authentication Error
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          {message}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/login" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}>
            Go to Login
          </Link>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            If you continue to have issues, contact your administrator for a new invite link.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
