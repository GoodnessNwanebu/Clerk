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

export const useInstallGuide = () => {
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const shouldShowInstallGuide = (): boolean => {
    // Don't show if not on mobile
    if (!isMobile()) return false;
    
    // Don't show if already installed
    if (isPWAInstalled()) return false;
    
    // Get how many times we've shown it before
    const shownCount = parseInt(localStorage.getItem('installGuideShownCount') || '0');
    
    // Get when we last showed it
    const lastShown = localStorage.getItem('installGuideLastShown');
    
    // Don't show if shown recently (within 7 days)
    if (lastShown) {
      const daysSinceLastShown = (Date.now() - new Date(lastShown).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastShown < 7) return false;
    }
    
    // VARYING FREQUENCY: Show on specific occasions (1, 3, 5, 8, 12)
    const shouldShow = [1, 3, 5, 8, 12].includes(shownCount + 1);
    
    return shouldShow;
  };

  const handleShowInstallGuide = () => {
    const currentCount = parseInt(localStorage.getItem('installGuideShownCount') || '0');
    
    // Increment the count
    localStorage.setItem('installGuideShownCount', (currentCount + 1).toString());
    
    // Record when we showed it
    localStorage.setItem('installGuideLastShown', new Date().toISOString());
    
    // Show the modal
    setShowInstallGuide(true);
  };

  const handleCloseInstallGuide = () => {
    setShowInstallGuide(false);
  };

  const handleCompleteInstallGuide = () => {
    setShowInstallGuide(false);
    // Mark as completed
    localStorage.setItem('pwaTutorialCompleted', 'true');
  };

  // Debug function to see current state
  const debugInstallGuide = () => {
    const shownCount = parseInt(localStorage.getItem('installGuideShownCount') || '0');
    const lastShown = localStorage.getItem('installGuideLastShown');
    
    console.log('Install Guide Debug:', {
      shownCount,
      nextShow: shownCount + 1,
      shouldShow: [1, 3, 5, 8, 12].includes(shownCount + 1),
      lastShown,
      isInstalled: isPWAInstalled(),
      isMobile: isMobile()
    });
  };

  // Reset function for testing
  const resetInstallGuideCounters = () => {
    localStorage.removeItem('installGuideShownCount');
    localStorage.removeItem('installGuideLastShown');
    localStorage.removeItem('pwaTutorialCompleted');
    console.log('Install guide counters reset');
  };

  return {
    showInstallGuide,
    shouldShowInstallGuide,
    handleShowInstallGuide,
    handleCloseInstallGuide,
    handleCompleteInstallGuide,
    debugInstallGuide,
    resetInstallGuideCounters,
    isPWAInstalled,
    isMobile
  };
};
