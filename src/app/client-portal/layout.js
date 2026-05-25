'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClientBrowser } from '@/lib/supabase';
import NotificationBell from '@/components/NotificationBell';
import ClaudeLogo from '@/components/ClaudeLogo';

export default function ClientPortalLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientBrowser();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('users').select('name, client_id').eq('id', user.id).single();
        if (data && data.client_id) {
          const { data: client } = await supabase.from('clients').select('company_name').eq('id', data.client_id).single();
          setProfile({ ...data, company_name: client?.company_name });
        } else {
          setProfile(data);
        }
      }
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ClaudeLogo size={32} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>ContentFlow</span>
          </div>

          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>
            {profile?.company_name || 'Loading...'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <NotificationBell role="client" />
            <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{profile?.name}</span>
            <button onClick={handleLogout} className="btn btn-sm" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Log out
            </button>
          </div>
        </div>

        <nav style={{ maxWidth: 1200, margin: '20px auto 0', display: 'flex', gap: 24 }}>
          <Link 
            href="/client-portal" 
            style={{ 
              paddingBottom: 12, 
              fontSize: 14, 
              fontWeight: 500,
              color: pathname === '/client-portal' ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: pathname === '/client-portal' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            Overview
          </Link>
          <Link 
            href="/client-portal/history" 
            style={{ 
              paddingBottom: 12, 
              fontSize: 14, 
              fontWeight: 500,
              color: pathname === '/client-portal/history' ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: pathname === '/client-portal/history' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            History
          </Link>
          <Link 
            href="/client-portal/activity" 
            style={{ 
              paddingBottom: 12, 
              fontSize: 14, 
              fontWeight: 500,
              color: pathname === '/client-portal/activity' ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: pathname === '/client-portal/activity' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            Activity
          </Link>
        </nav>
      </header>

      <main style={{ flex: 1, padding: '32px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
