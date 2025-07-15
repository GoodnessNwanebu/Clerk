'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, ThemeSetting } from '../types';

interface ThemeContextType {
  themeSetting: ThemeSetting;
  setThemeSetting: (theme: ThemeSetting) => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isBrowser = typeof window !== 'undefined';
  
  // Initialize with default values - these will be updated immediately in useEffect
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>('system');
  const [theme, setTheme] = useState<Theme>('light');

  // Initialize theme from localStorage on mount
  useEffect(() => {
    if (!isBrowser) return;
    
    // Get saved theme preference from localStorage
    const savedTheme = localStorage.getItem('theme') as ThemeSetting | null;
    
    // If we have a valid saved theme, use it
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
      setThemeSetting(savedTheme);
    }
  }, [isBrowser]);

  // Apply theme changes
  useEffect(() => {
    if (!isBrowser) return;
    
    const root = window.document.documentElement;
    const isDark =
      themeSetting === 'dark' ||
      (themeSetting === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    const currentTheme = isDark ? 'dark' : 'light';
    setTheme(currentTheme);

    root.classList.remove('light', 'dark');
    root.classList.add(currentTheme);
    localStorage.setItem('theme', themeSetting);
  }, [themeSetting, isBrowser]);

  // Listen for system theme changes
  useEffect(() => {
    if (!isBrowser) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (themeSetting === 'system') {
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        setTheme(newTheme);
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeSetting, isBrowser]);

  return (
    <ThemeContext.Provider value={{ 
      themeSetting, 
      setThemeSetting, 
      theme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};