'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

// Define the types for our theme
export type Theme = 'light' | 'dark';
export type ThemeSetting = Theme | 'system';

// Define the shape of our context
interface ThemeContextType {
  themeSetting: ThemeSetting;
  setThemeSetting: (theme: ThemeSetting) => void;
  // 'theme' is the currently active, resolved theme ('light' or 'dark')
  theme: Theme;
}

// Create the context with an undefined initial value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// The ThemeProvider component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isBrowser = typeof window !== 'undefined';

  // State for the user's selected setting ('light', 'dark', or 'system')
  // It initializes from localStorage or defaults to 'system'
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>(() => {
    if (!isBrowser) return 'system';
    return (localStorage.getItem('theme') as ThemeSetting) || 'system';
  });

  // State for the actual, resolved theme ('light' or 'dark')
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() => {
    if (!isBrowser) return 'light';
    const setting = localStorage.getItem('theme') as ThemeSetting;
    if (setting === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return (setting as Theme) || 'light';
  });

  // This is the core logic. It runs whenever themeSetting changes.
  useEffect(() => {
    if (!isBrowser) return;

    let systemThemeListener: MediaQueryList | undefined;

    // A single function to determine and apply the correct theme
    const applyTheme = () => {
      const root = window.document.documentElement;
      const isSystem = themeSetting === 'system';

      // Determine the theme to apply
      const newTheme = isSystem
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : themeSetting;
      
      // Update the resolved theme state for the UI
      setResolvedTheme(newTheme);

      // Apply the theme class to the <html> element
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
    };

    // Apply the theme immediately
    applyTheme();

    // If the setting is 'system', we need to listen for OS-level changes
    if (themeSetting === 'system') {
      systemThemeListener = window.matchMedia('(prefers-color-scheme: dark)');
      systemThemeListener.addEventListener('change', applyTheme);
    }

    // The cleanup function is critical. It runs before the effect runs again,
    // or when the component unmounts. This guarantees we remove the listener
    // when the user switches away from the 'system' setting.
    return () => {
      if (systemThemeListener) {
        systemThemeListener.removeEventListener('change', applyTheme);
      }
    };
  }, [themeSetting, isBrowser]);

  // A wrapper function to set the theme and save it to localStorage
  const handleSetThemeSetting = (newSetting: ThemeSetting) => {
    if (isBrowser) {
      localStorage.setItem('theme', newSetting);
    }
    setThemeSetting(newSetting);
  };

  return (
    <ThemeContext.Provider value={{
      themeSetting,
      setThemeSetting: handleSetThemeSetting,
      theme: resolvedTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to easily access the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};