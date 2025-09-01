import { useState, useEffect } from 'react';

// Helper function to check if PWA is installed
const isPWAInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
};

// Helper function to check if user is on mobile
const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /mobile|android|iphone|ipad|ipod|blackberry|opera mini|iemobile/i.test(navigator.userAgent.toLowerCase());
};

export const useClerkingPWAInstall = () => {
  const [showInstallModal, setShowInstallModal] = useState(false);

  const shouldShowInstallModal = (): boolean => {
    // Don't show if not on mobile
    if (!isMobile()) return false;
    
    // Don't show if already installed
    if (isPWAInstalled()) return false;
    
    // Get how many times we've shown it before
    const timesShown = parseInt(localStorage.getItem('clerkingPWAInstallTimesShown') || '0');
    
    // Get when we last showed it (today's date as string)
    const lastShown = localStorage.getItem('clerkingPWAInstallLastShown');
    const today = new Date().toDateString();
    
    // Don't show if we've shown it today
    if (lastShown === today) return false;
    
    // Don't show if we've shown it 10 times already
    if (timesShown >= 10) return false;
    
    return true;
  };

  const handleShowInstallModal = () => {
    const currentTimesShown = parseInt(localStorage.getItem('clerkingPWAInstallTimesShown') || '0');
    const today = new Date().toDateString();
    
    // Increment the count
    localStorage.setItem('clerkingPWAInstallTimesShown', (currentTimesShown + 1).toString());
    
    // Record that we showed it today
    localStorage.setItem('clerkingPWAInstallLastShown', today);
    
    // Show the modal
    setShowInstallModal(true);
  };

  const handleCloseInstallModal = () => {
    setShowInstallModal(false);
  };

  const handleCompleteInstallModal = async () => {
    setShowInstallModal(false);
    
    // Mark as completed
    localStorage.setItem('pwaTutorialCompleted', 'true');
    
    // Track PWA installation in database
    try {
      await fetch('/api/pwa/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installSource: 'clerking-tutorial'
        })
      });
    } catch (error) {
      console.error('Failed to track PWA installation:', error);
    }
  };

  // Debug function to see current state
  const debugInstallModal = () => {
    const timesShown = parseInt(localStorage.getItem('clerkingPWAInstallTimesShown') || '0');
    const lastShown = localStorage.getItem('clerkingPWAInstallLastShown');
    const today = new Date().toDateString();
    
    console.log('Clerking PWA Install Debug:', {
      timesShown,
      lastShown,
      today,
      shouldShow: shouldShowInstallModal(),
      isInstalled: isPWAInstalled(),
      isMobile: isMobile()
    });
  };

  // Reset function for testing
  const resetInstallModalCounters = () => {
    localStorage.removeItem('clerkingPWAInstallTimesShown');
    localStorage.removeItem('clerkingPWAInstallLastShown');
    localStorage.removeItem('pwaTutorialCompleted');
    console.log('Clerking PWA install counters reset');
  };

  return {
    showInstallModal,
    shouldShowInstallModal,
    handleShowInstallModal,
    handleCloseInstallModal,
    handleCompleteInstallModal,
    debugInstallModal,
    resetInstallModalCounters,
    isPWAInstalled,
    isMobile
  };
};
