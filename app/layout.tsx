import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '../context/AppContext';
import { ThemeProvider } from '../context/ThemeContext';
import './globals.css';
import ClientWrapper from './client-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClerkSmart',
  description: 'The intelligent clinical reasoning simulator',
  manifest: '/manifest.json',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'msapplication-tap-highlight': 'no',
    'theme-color': '#14b8a6',
    'msapplication-TileColor': '#14b8a6',
    'apple-mobile-web-app-title': 'ClerkSmart',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ClerkSmart',
  },
};

export const viewport: Viewport = {
  themeColor: '#14b8a6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var isSystem = theme === 'system' || !theme;
                  var isDark = isSystem 
                    ? window.matchMedia('(prefers-color-scheme: dark)').matches
                    : theme === 'dark';
                  document.documentElement.classList.add(isDark ? 'dark' : 'light');
                } catch (e) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ClerkSmart" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#14b8a6" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AppProvider>
            <ClientWrapper>{children}</ClientWrapper>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 