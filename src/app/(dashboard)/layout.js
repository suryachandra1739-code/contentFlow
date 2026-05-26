'use client';
import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import GlassOrbBackground from '@/components/GlassOrbBackground';
import MobileGestureWrapper from '@/components/MobileGestureWrapper';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  return (
    <div className="app-layout">
      <GlassOrbBackground />
      <MobileGestureWrapper>
        <Sidebar />
        <main className="main-content">
          <AnimatePresence mode="wait" initial={false}>
            <div key={pathname}>
              {children}
            </div>
          </AnimatePresence>
        </main>
      </MobileGestureWrapper>
    </div>
  );
}
