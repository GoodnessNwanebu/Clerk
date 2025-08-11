'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

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

  const LOG_PREFIX = '[ThemeContext]';
  const logDebug = (...args: unknown[]) => console.debug(LOG_PREFIX, ...args);
  const logInfo = (...args: unknown[]) => console.info(LOG_PREFIX, ...args);
  const logWarn = (...args: unknown[]) => console.warn(LOG_PREFIX, ...args);
  const logError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);

  logInfo('ThemeProvider render start', { isBrowser });

  // State for the user's selected setting ('light', 'dark', or 'system')
  // It initializes from localStorage or defaults to 'system'
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>(() => {
    if (!isBrowser) {
      logDebug('Initializing themeSetting on server-like environment; defaulting to "system"');
      return 'system';
    }
    try {
      const stored = localStorage.getItem('theme') as ThemeSetting | null;
      logDebug('Initializing themeSetting from localStorage', { stored });
      return stored || 'system';
    } catch (error) {
      logError('Error reading theme from localStorage; defaulting to "system"', error);
      return 'system';
    }
  });

  // State for the actual, resolved theme ('light' or 'dark')
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() => {
    if (!isBrowser) {
      logDebug('Initializing resolvedTheme on server-like environment; defaulting to "light"');
      return 'light';
    }
    try {
      const setting = localStorage.getItem('theme') as ThemeSetting | null;
      const isSystem = setting === 'system' || setting == null;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const computed = isSystem ? (prefersDark ? 'dark' : 'light') : (setting as Theme);
      logDebug('Initializing resolvedTheme', { setting, isSystem, prefersDark, computed });
      return computed || 'light';
    } catch (error) {
      logError('Error computing initial resolvedTheme; defaulting to "light"', error);
      return 'light';
    }
  });

  // This is the core logic. It runs whenever themeSetting changes.
  useEffect(() => {
    if (!isBrowser) {
      logDebug('Effect skipped: not in browser environment');
      return;
    }

    logInfo('Effect run: applying theme due to dependency change', { themeSetting });

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
      const before = Array.from(root.classList.values());
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
      const after = Array.from(root.classList.values());

      logInfo('applyTheme executed', {
        themeSetting,
        isSystem,
        newTheme,
        classListBefore: before,
        classListAfter: after,
      });
    };

    // Apply the theme immediately
    applyTheme();
    logDebug('Initial theme applied');

    // If the setting is 'system', we need to listen for OS-level changes
    if (themeSetting === 'system') {
      systemThemeListener = window.matchMedia('(prefers-color-scheme: dark)');
      try {
        systemThemeListener.addEventListener('change', applyTheme);
        logInfo('Added system color-scheme change listener');
      } catch (error) {
        logWarn('Failed to add system color-scheme change listener', error);
      }
    }

    // The cleanup function is critical. It runs before the effect runs again,
    // or when the component unmounts. This guarantees we remove the listener
    // when the user switches away from the 'system' setting.
    return () => {
      if (systemThemeListener) {
        try {
          systemThemeListener.removeEventListener('change', applyTheme);
          logInfo('Removed system color-scheme change listener');
        } catch (error) {
          logWarn('Failed to remove system color-scheme change listener', error);
        }
      }
      logDebug('Effect cleanup complete');
    };
  }, [themeSetting, isBrowser]);

  // A wrapper function to set the theme and save it to localStorage
  const handleSetThemeSetting = (newSetting: ThemeSetting) => {
    logInfo('handleSetThemeSetting called', { from: themeSetting, to: newSetting });
    if (isBrowser) {
      try {
        if (newSetting === 'system') {
          localStorage.removeItem('theme');
          logDebug('Removed theme from localStorage (using system)');
        } else {
          localStorage.setItem('theme', newSetting);
          logDebug('Wrote theme to localStorage', { newSetting });
        }
      } catch (error) {
        logError('Failed to write theme to localStorage', error);
      }
    } else {
      logWarn('Attempted to set theme in non-browser environment');
    }
    setThemeSetting(newSetting);
  };

  logDebug('ThemeProvider render end', { themeSetting, resolvedTheme });

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
  // Intentionally verbose logging for diagnostics
  try {
    console.debug('[ThemeContext]', 'useTheme hook called', {
      themeSetting: context.themeSetting,
      theme: context.theme,
    });
  } catch {
    // no-op
  }
  return context;
};