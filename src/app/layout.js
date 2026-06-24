import './globals.css';
import { Outfit, Space_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/Toast';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata = {
  title: 'ContentFlow — Client Approval Platform',
  description: 'Streamlined content approval for social media teams. Review, approve, and manage posts for Instagram, Facebook, and YouTube Shorts.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${spaceMono.variable}`}>
      <head>
        <meta name="color-scheme" content="light dark" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --bg-base: #21201d;
            --bg-card: #2b2a27;
            --sidebar-w: 240px;
            --border: rgba(255, 255, 255, 0.08);
            --text-primary: #e8e4dc;
          }
          body.light, html[data-theme="light"] body {
            --bg-base: #fafafa;
            --bg-card: #ffffff;
            --border: #e5e7eb;
            --text-primary: #111827;
          }
          @media (prefers-color-scheme: light) {
            :root:not([data-theme="dark"]) body {
              --bg-base: #fafafa;
              --bg-card: #ffffff;
              --border: #e5e7eb;
              --text-primary: #111827;
            }
          }
          body {
            background-color: var(--bg-base);
            color: var(--text-primary);
            margin: 0;
            font-family: var(--sans), system-ui, -apple-system, sans-serif;
          }
          .app-layout {
            display: flex;
            min-height: 100vh;
          }
          .sidebar {
            position: fixed;
            left: 16px;
            top: 16px;
            bottom: 16px;
            width: var(--sidebar-w);
            background-color: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 24px;
            z-index: 100;
          }
          .main-content {
            flex: 1;
            margin-left: var(--sidebar-w);
            padding: 40px;
          }
          @media (min-width: 769px) {
            .main-content {
              margin-left: calc(var(--sidebar-w) + 32px) !important;
            }
          }
          .page-header {
            margin-bottom: 28px;
            position: relative;
          }
          .page-header h1 {
            font-size: 44px;
            font-weight: 800;
            background: var(--h1-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.035em;
            line-height: 1.05;
            margin: 0;
          }
          .page-header p {
            color: var(--text-secondary);
            font-size: 16px;
            margin-top: 8px;
            font-weight: 400;
            letter-spacing: -0.01em;
          }
          @keyframes pageFadeUp {
            0% { opacity: 0; transform: translateY(8px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .page-transition-enter {
            animation: pageFadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            will-change: transform, opacity;
            width: 100%;
          }
        `}} />
      </head>
      <body>
        <div className="noise-overlay" />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

