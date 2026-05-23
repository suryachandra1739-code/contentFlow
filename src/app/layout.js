import './globals.css';

import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: 'ContentFlow — Client Approval Platform',
  description: 'Streamlined content approval for social media teams. Review, approve, and manage posts for Instagram, Facebook, and YouTube Shorts.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <div className="bg-grid-glow">
          <div className="glow-orb orb-1"></div>
        </div>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
