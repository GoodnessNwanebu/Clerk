import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { ThemeSetting } from '../types';
import { Icon } from './Icon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COUNTRIES = [
  'United States',
  'United Kingdom', 
  'Canada',
  'Australia',
  'India',
  'Nigeria',
  'Germany',
  'France',
  'Japan',
  'Brazil',
  'Jordan'
];

const ThemeOption: React.FC<{ 
  label: string; 
  description: string;
  value: ThemeSetting; 
  current: ThemeSetting; 
  onClick: (value: ThemeSetting) => void;
  icon: string;
}> = ({ label, description, value, current, onClick, icon }) => {
  const isActive = current === value;
  
  return (
    <button
      onClick={() => onClick(value)}
      className={`w-full text-left p-4 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
        isActive 
          ? 'bg-teal-500 text-white shadow-lg' 
          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
      }`}
      role="radio"
      aria-checked={isActive}
    >
      <Icon 
        name={icon} 
        size={20} 
        className={isActive ? 'text-white' : 'text-teal-500'} 
      />
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        <div className={`text-sm ${isActive ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'}`}>
          {description}
        </div>
      </div>
      {isActive && (
        <Icon name="check" size={20} className="text-white" />
      )}
    </button>
  );
};

const CountryOption: React.FC<{
  country: string;
  current: string | null;
  onClick: (country: string) => void;
}> = ({ country, current, onClick }) => {
  const isActive = current === country;
  
  return (
    <button
      onClick={() => onClick(country)}
      className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center justify-between ${
        isActive 
          ? 'bg-teal-500 text-white shadow-lg' 
          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
      }`}
    >
      <span className="font-medium">{country}</span>
      {isActive && (
        <Icon name="check" size={16} className="text-white" />
      )}
    </button>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { themeSetting, setThemeSetting, theme } = useTheme();
  const { userCountry, setUserCountry } = useAppContext();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(userCountry);

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

  const getCurrentThemeDescription = () => {
    if (themeSetting === 'system') {
      return `Following system (currently ${theme})`;
    }
    return `Always ${theme}`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
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
        
        {/* Theme Section */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-2">
            <Icon name="sun" size={20} className="text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Appearance</h3>
          </div>
          
          <div className="space-y-3" role="radiogroup" aria-labelledby="theme-group-label">
            <ThemeOption 
              label="Light" 
              description="Always use light theme"
              value="light" 
              current={themeSetting} 
              onClick={setThemeSetting}
              icon="sun" 
            />
            <ThemeOption 
              label="Dark" 
              description="Always use dark theme"
              value="dark" 
              current={themeSetting} 
              onClick={setThemeSetting}
              icon="moon" 
            />
            <ThemeOption 
              label="System" 
              description="Follow system preference"
              value="system" 
              current={themeSetting} 
              onClick={setThemeSetting}
              icon="monitor" 
            />
          </div>
          
          {/* Current Theme Display */}
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon 
                  name={theme === 'dark' ? 'moon' : 'sun'} 
                  size={16} 
                  className="text-teal-500" 
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Current theme:
                </span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {getCurrentThemeDescription()}
              </span>
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
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {COUNTRIES.map((country) => (
              <CountryOption
                key={country}
                country={country}
                current={selectedCountry}
                onClick={handleCountrySelect}
              />
            ))}
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
    </div>
  );
};