import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export const usePWAInstallation = () => {
  const { data: session } = useSession();
  const [isInstalled, setIsInstalled] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // Check if PWA is installed
  const checkPWAInstallation = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches;
  };

  // Track PWA installation in database
  const trackPWAInstallation = async (installSource: string = 'auto-detected') => {
    if (!session?.user?.email || isTracking) return;

    try {
      setIsTracking(true);
      
      const response = await fetch('/api/pwa/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installSource
        })
      });

      if (response.ok) {
        console.log('PWA installation tracked successfully');
      }
    } catch (error) {
      console.error('Failed to track PWA installation:', error);
    } finally {
      setIsTracking(false);
    }
  };

  useEffect(() => {
    const checkInstallation = () => {
      const installed = checkPWAInstallation();
      setIsInstalled(installed);
      
      // If PWA is installed and user is authenticated, track it
      if (installed && session?.user?.email) {
        // Check if we've already tracked this installation
        const tracked = localStorage.getItem('pwaInstallationTracked');
        if (!tracked) {
          trackPWAInstallation('auto-detected');
          localStorage.setItem('pwaInstallationTracked', 'true');
        }
      }
    };

    // Check on mount
    checkInstallation();

    // Listen for display mode changes (when PWA is installed)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        if (session?.user?.email) {
          trackPWAInstallation('auto-detected');
          localStorage.setItem('pwaInstallationTracked', 'true');
        }
      } else {
        setIsInstalled(false);
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [session?.user?.email]);

  return {
    isInstalled,
    isTracking,
    trackPWAInstallation
  };
};
