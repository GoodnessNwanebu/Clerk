import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { ThemeSetting } from '../../types';
import { Icon } from '../Icon';
import { CountrySelect } from '../CountrySelect';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useInstallGuide } from '../../hooks/useInstallGuide';
import PWATutorialModal from './PWATutorialModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { themeSetting, setThemeSetting, theme } = useTheme();
  const { userCountry, setUserCountry } = useAppContext();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(userCountry);
  const { data: session, status } = useSession();
  
  // Install guide hook
  const {
    showInstallGuide,
    handleShowInstallGuide,
    handleCloseInstallGuide,
    handleCompleteInstallGuide,
    isPWAInstalled,
    isMobile
  } = useInstallGuide();

  // Update local state when userCountry changes
  useEffect(() => {
    setSelectedCountry(userCountry);
  }, [userCountry]);

  // Close modal with Escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) return null;

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setUserCountry(country);
  };

  const handleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm " 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-slate-900 dark:text-white w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 id="settings-title" className="text-xl font-bold">Settings</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close settings"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        
        {/* Account Section */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-2">
            <Icon name="user" size={20} className="text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Account</h3>
          </div>
          
          {status === 'loading' ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
            </div>
          ) : session ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                {session.user?.image && (
                  <img 
                    src={session.user.image} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {session.user?.name || 'User'}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {session.user?.email}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <Icon name="log-out" size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sign in to save your progress and access your case history across devices.
              </p>
              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-lg transition-colors"
              >
                <Icon name="chrome" size={16} />
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme Section */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Appearance</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon 
                name={theme === 'dark' ? 'moon' : themeSetting === 'system' ? 'monitor' : 'sun'} 
                size={20} 
                className="text-slate-600 dark:text-slate-400" 
              />
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Theme</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {themeSetting === 'system' ? 'Use Device' : `Always ${theme}`}
                </div>
              </div>
            </div>
            <div className="flex bg-slate-200 dark:bg-slate-600 rounded-lg p-1">
              <button
                onClick={() => setThemeSetting('light')}
                className={`p-2 rounded-md transition-all duration-200 flex items-center justify-center ${
                  themeSetting === 'light' 
                    ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Light theme"
              >
                <Icon name="sun" size={16} />
              </button>
              <button
                onClick={() => setThemeSetting('dark')}
                className={`p-2 rounded-md transition-all duration-200 flex items-center justify-center ${
                  themeSetting === 'dark' 
                    ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Dark theme"
              >
                <Icon name="moon" size={16} />
              </button>
              <button
                onClick={() => setThemeSetting('system')}
                className={`p-2 rounded-md transition-all duration-200 flex items-center justify-center ${
                  themeSetting === 'system' 
                    ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="System theme"
              >
                <Icon name="monitor" size={16} />
              </button>
            </div>
          </div>
          

        </div>

        {/* Location Section */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-2">
            <Icon name="globe" size={20} className="text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Location</h3>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your location helps us create culturally relevant patients with appropriate names and medical contexts.
          </p>
          
          <div className="w-full">
            <CountrySelect
              value={selectedCountry || ''}
              onChange={handleCountrySelect}
              placeholder="Choose your country..."
            />
          </div>
          
          {/* Current Location Display */}
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon 
                  name="map-pin" 
                  size={16} 
                  className="text-teal-500" 
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Current location:
                </span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {selectedCountry || 'Not set'}
              </span>
            </div>
          </div>
        </div>

        {/* App Installation Section */}
        {isMobile() && (
          <div className="space-y-4 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">App Installation</h3>
            </div>
            
            {isPWAInstalled() ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Icon name="check-circle" size={20} className="text-green-600 dark:text-green-400" />
                  <span className="text-green-800 dark:text-green-200 font-medium">
                    ClerkSmart is installed on your device
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Install ClerkSmart for quick access and offline functionality.
                </p>
                
                <button
                  onClick={handleShowInstallGuide}
                  className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Icon name="download" size={16} />
                  <span>Show Installation Guide</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Changes are saved automatically and apply to new cases.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
              This app uses a shared API for demonstration purposes with daily usage limits.
            </p>
          </div>
        </div>
      </div>
      
      {/* Install Guide Modal */}
      <PWATutorialModal
        isOpen={showInstallGuide}
        onClose={handleCloseInstallGuide}
        onComplete={handleCompleteInstallGuide}
      />
    </div>
  );
};