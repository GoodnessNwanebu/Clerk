import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '../context/AppContext';
import { ThemeProvider } from '../context/ThemeContext';
import './globals.css';
import ClientWrapper from './client-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClerkSmart',
  description: 'The intelligent clinical reasoning simulator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Get the user's theme preference
                  const storedTheme = localStorage.getItem('theme');
                  
                  // Remove any existing theme classes
                  document.documentElement.classList.remove('light', 'dark');
                  
                  // Priority order:
                  // 1. User explicit choice (light/dark)
                  // 2. System preference (if user chose 'system' or no preference)
                  // 3. Light mode (fallback)
                  
                  let effectiveTheme;
                  if (storedTheme === 'light' || storedTheme === 'dark') {
                    effectiveTheme = storedTheme;
                  } else {
                    // Either 'system' or no stored preference
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    effectiveTheme = prefersDark ? 'dark' : 'light';
                  }
                  
                  document.documentElement.classList.add(effectiveTheme);
                } catch (e) {
                  // Fallback to light theme if localStorage is unavailable
                  document.documentElement.classList.add('light');
                  console.error('Error applying theme:', e);
                }
              })();
            `,
          }}
        />
        <ThemeProvider>
          <AppProvider>
            <ClientWrapper>
              {children}
            </ClientWrapper>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 