import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface PWATutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type BrowserType = 'chrome-android' | 'chrome-ios' | 'safari' | 'other';

const detectBrowserAndDevice = (): BrowserType => {
  if (typeof window === 'undefined') return 'other';
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check if it's mobile
  const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|opera mini|iemobile/i.test(userAgent);
  
  // If it's not mobile, return 'other' (desktop - tutorial shouldn't show)
  if (!isMobile) {
    return 'other';
  }
  
  // Check if it's iOS
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  
  // Check if it's Chrome (including Chromium-based browsers like Edge)
  // Chrome on iOS uses 'CriOS' in user agent, not 'chrome'
  const isChrome = (userAgent.includes('chrome') || userAgent.includes('crios')) && !userAgent.includes('edg');
  const isEdge = userAgent.includes('edg');
  
  // Check if it's Safari (but not Chrome or Edge)
  const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('crios') && !userAgent.includes('edg');
  
  if (isChrome || isEdge) {
    return isIOS ? 'chrome-ios' : 'chrome-android';
  } else if (isSafari) {
    return 'safari';
  } else {
    return 'chrome-android'; // Default fallback
  }
};

const ChromeAndroidTutorial: React.FC = () => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
        <Icon name="chrome" size={32} className="text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Install ClerkSmart</h3>
    </div>
    
    <div className="space-y-4">
      <div className="flex items-start space-x-3">
        <div className="w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">1</div>
        <div>
          <p className="text-slate-700 dark:text-slate-300">Tap the three-dot menu (⋮) in the top-right corner</p>
        </div>
      </div>
      
      <div className="flex items-start space-x-3">
        <div className="w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">2</div>
        <div>
          <p className="text-slate-700 dark:text-slate-300">Select "Add to Home screen"</p>
        </div>
      </div>
      
      <div className="flex items-start space-x-3">
        <div className="w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">3</div>
        <div>
          <p className="text-slate-700 dark:text-slate-300">Tap "Add" to install</p>
        </div>
      </div>
    </div>
  </div>
);

const ChromeIOSTutorial: React.FC = () => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
        <Icon name="chrome" size={32} className="text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Install ClerkSmart</h3>
    </div>
    
    <div className="space-y-4">
      <div className="flex items-start space-x-3">
        <div className="w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">1</div>
        <div>
          <p className="text-slate-700 dark:text-slate-300">Tap the share button in the top-right corner</p>
        </div>
      </div>
      
      <div className="flex items-start space-x-3">
        <div className="w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">2</div>
        <div>
          <p className="text-slate-700 dark:text-slate-300">Scroll down and select "Add to Home Screen"</p>
        </div>
      </div>
      
      <div className="flex items-start space-x-3">
        <div className="w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">3</div>
        <div>
          <p className="text-slate-700 dark:text-slate-300">Tap "Add" to install</p>
        </div>
      </div>
    </div>
  </div>
);

const SafariTutorial: React.FC = () => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
        <Icon name="compass" size={32} className="text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Install ClerkSmart</h3>
    </div>
    
    <div className="space-y-4">
      <div className="flex items-start space-x-3">
        <div className="w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">1</div>
        <div>
          <p className="text-slate-700 dark:text-slate-300">Tap the share button in the bottom toolbar</p>
        </div>
      </div>
      
      <div className="flex items-start space-x-3">
        <div className="w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">2</div>
        <div>
          <p className="text-slate-700 dark:text-slate-300">Select "Add to Home Screen"</p>
        </div>
      </div>
      
      <div className="flex items-start space-x-3">
        <div className="w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">3</div>
        <div>
          <p className="text-slate-700 dark:text-slate-300">Tap "Add" to install</p>
        </div>
      </div>
    </div>
  </div>
);

const PWATutorialModal: React.FC<PWATutorialModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [browserType] = useState(detectBrowserAndDevice());

  const handleComplete = () => {
    // Save that tutorial has been completed
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwaTutorialCompleted', 'true');
    }
    onComplete();
  };

  const handleClose = () => {
    // Save that tutorial has been dismissed (but not completed)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwaTutorialLastShown', new Date().toISOString());
    }
    onClose();
  };

  if (!isOpen) return null;

  const getTutorialContent = () => {
    switch (browserType) {
      case 'chrome-android':
        return <ChromeAndroidTutorial />;
      case 'chrome-ios':
        return <ChromeIOSTutorial />;
      case 'safari':
        return <SafariTutorial />;
      default:
        // Don't show tutorial on desktop
        return null;
    }
  };

  // Don't show modal if it's desktop (no content available)
  if (browserType === 'other') return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        {getTutorialContent()}
        
        <div className="flex space-x-3 mt-8">
          <button
            onClick={handleClose}
            className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg font-semibold text-white hover:scale-105 transform transition-transform"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWATutorialModal;
