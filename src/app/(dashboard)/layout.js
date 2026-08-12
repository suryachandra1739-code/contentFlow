'use client';
import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-app-gradient">
      <Sidebar />
      {/* Main content — offset for desktop sidebar */}
      <main className="lg:pl-[272px] pb-28 lg:pb-10">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-6">
          <AnimatePresence mode="wait" initial={false}>
            <div key={pathname}>
              {children}
            </div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
