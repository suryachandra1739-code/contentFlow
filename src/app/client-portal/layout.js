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
    <div style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(ellipse at bottom, #0f172a, #020617)', 
      color: 'var(--text-primary)',
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'var(--sans)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      
      {/* Background ambient light gradients */}
      <div style={{ position: 'absolute', top: 0, left: '20%', width: 400, height: 400, background: 'rgba(37,99,235,0.06)', filter: 'blur(130px)', pointerEvents: 'none', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 500, height: 500, background: 'rgba(16,185,129,0.03)', filter: 'blur(160px)', pointerEvents: 'none', borderRadius: '50%' }} />

      <header style={{ 
        background: 'rgba(15, 23, 42, 0.65)', 
        backdropFilter: 'blur(16px)', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
        padding: '16px 24px', 
        position: 'sticky', 
        top: 0, 
        zIndex: 10 
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ClaudeLogo size={32} />
            <span style={{ 
              fontWeight: 800, 
              fontSize: 17, 
              letterSpacing: '-0.02em', 
              background: 'linear-gradient(135deg, #ffffff, rgba(255,255,255,0.7))', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}>
              ContentFlow
            </span>
          </div>

          <div style={{ 
            fontSize: 12, 
            fontWeight: 700, 
            color: 'var(--accent)', 
            background: 'rgba(37,99,235,0.08)', 
            padding: '6px 14px', 
            borderRadius: 99,
            border: '1px solid rgba(37,99,235,0.15)',
            boxShadow: '0 0 15px rgba(37,99,235,0.08)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            🏢 {profile?.company_name || 'WORKSPACE'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <NotificationBell role="client" />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hide-on-mobile">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{profile?.name}</span>
            </div>

            <button 
              onClick={handleLogout} 
              style={{ 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.08)', 
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                padding: '7px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Log out
            </button>
          </div>
        </div>

        <nav style={{ maxWidth: 1200, margin: '20px auto 0', display: 'flex', gap: 24 }}>
          <Link 
            href="/client-portal" 
            style={{ 
              paddingBottom: 10, 
              fontSize: 14, 
              fontWeight: 600,
              color: pathname === '/client-portal' ? '#fff' : 'var(--text-secondary)',
              borderBottom: pathname === '/client-portal' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s ease',
              textDecoration: 'none'
            }}
          >
            Overview
          </Link>
          <Link 
            href="/client-portal/history" 
            style={{ 
              paddingBottom: 10, 
              fontSize: 14, 
              fontWeight: 600,
              color: pathname === '/client-portal/history' ? '#fff' : 'var(--text-secondary)',
              borderBottom: pathname === '/client-portal/history' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s ease',
              textDecoration: 'none'
            }}
          >
            History
          </Link>
          <Link 
            href="/client-portal/activity" 
            style={{ 
              paddingBottom: 10, 
              fontSize: 14, 
              fontWeight: 600,
              color: pathname === '/client-portal/activity' ? '#fff' : 'var(--text-secondary)',
              borderBottom: pathname === '/client-portal/activity' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s ease',
              textDecoration: 'none'
            }}
          >
            Activity
          </Link>
        </nav>
      </header>

      <main style={{ flex: 1, padding: '36px 24px', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
