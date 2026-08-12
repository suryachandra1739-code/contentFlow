import { createClientServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

export default async function DashboardLayout({ children }) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('name, role, client_id')
    .eq('id', user.id)
    .single();

  return (
    <div className="app-shell">
      <Sidebar user={user} profile={profile} />
      <div className="main-area">
        {children}
      </div>
      <MobileNav role={profile?.role} />
    </div>
  );
}
