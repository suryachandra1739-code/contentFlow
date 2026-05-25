import Sidebar from '@/components/Sidebar';
import GlassOrbBackground from '@/components/GlassOrbBackground';

export default function DashboardLayout({ children }) {
  return (
    <div className="app-layout">
      <GlassOrbBackground />
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
