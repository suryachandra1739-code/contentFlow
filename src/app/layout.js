import './globals.css';
import { Outfit, Space_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider } from '@/lib/theme';

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
    <html lang="en" className={`dark ${outfit.variable} ${spaceMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        <meta name="google-site-verification" content="googlea102a176fd73c4cc" />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
