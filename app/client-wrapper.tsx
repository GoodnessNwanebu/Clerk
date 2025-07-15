'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Branded loading screen component
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center px-4">
    <div className="text-center mb-8">
      <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-teal-400 to-emerald-500 text-transparent bg-clip-text mb-3">
        ClerkSmart
      </h1>
      <p className="text-slate-600 dark:text-slate-400">Preparing your experience...</p>
    </div>
    
    {/* Animated progress bar */}
    <div className="w-full max-w-md bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full animate-loading-progress"></div>
    </div>
  </div>
);

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user has completed onboarding
    const hasOnboarded = typeof window !== 'undefined' ? localStorage.getItem('hasOnboarded') : null;
    
    // Don't redirect if user is already on the onboarding page
    if (pathname === '/onboarding') {
      setIsLoading(false);
      return;
    }
    
    // Don't redirect for API routes or special Next.js pages
    if (pathname.startsWith('/api/') || pathname.startsWith('/_')) {
      setIsLoading(false);
      return;
    }
    
    // Redirect new users to onboarding with minimal delay
    if (!hasOnboarded) {
      // Use a minimal timeout to allow the initial render to complete
      // This makes the transition feel smoother
      setTimeout(() => {
        router.push('/onboarding');
      }, 50);
    } else {
      setIsLoading(false);
    }
  }, [pathname, router]);
  
  // Show branded loading screen while determining if redirect is needed
  if (isLoading && pathname !== '/onboarding') {
    return <LoadingScreen />;
  }

  return <>{children}</>;
} 