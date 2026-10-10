'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ActiveTheme = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  theme: ActiveTheme; // Active computed theme ('light' | 'dark') for backward compatibility
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: ActiveTheme) => void; // Legacy setter alias
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  theme: 'light',
  setMode: () => {},
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ActiveTheme>('light');
  const [mounted, setMounted] = useState(false);

  const applyThemeToDOM = useCallback((targetTheme: ActiveTheme) => {
    const root = document.documentElement;
    if (targetTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, []);

  const updateTheme = useCallback(
    (selectedMode: ThemeMode) => {
      let active: ActiveTheme = 'light';
      if (selectedMode === 'system') {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        active = isSystemDark ? 'dark' : 'light';
      } else {
        active = selectedMode;
      }
      setResolvedTheme(active);
      applyThemeToDOM(active);
    },
    [applyThemeToDOM]
  );

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem('recruitai-theme-mode') as ThemeMode | null;
    const legacySavedTheme = localStorage.getItem('recruitai-theme') as ActiveTheme | null;

    let initialMode: ThemeMode = 'system';
    if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
      initialMode = savedMode;
    } else if (legacySavedTheme && ['light', 'dark'].includes(legacySavedTheme)) {
      initialMode = legacySavedTheme;
    }

    setModeState(initialMode);
    updateTheme(initialMode);

    // System theme change listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentStoredMode = (localStorage.getItem('recruitai-theme-mode') as ThemeMode) || initialMode;
      if (currentStoredMode === 'system') {
        updateTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [updateTheme]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('recruitai-theme-mode', newMode);
    localStorage.setItem('recruitai-theme', newMode === 'system' ? resolvedTheme : newMode);
    updateTheme(newMode);
  };

  const setTheme = (newTheme: ActiveTheme) => {
    setMode(newTheme);
  };

  const toggleTheme = () => {
    // Cycle between Light -> Dark -> System -> Light
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setMode(nextMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, theme: resolvedTheme, setMode, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div className="flex items-center bg-[var(--surface-muted)] border border-[var(--border)] p-0.5 rounded-lg text-xs font-semibold select-none">
      <button
        onClick={() => setMode('light')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
          mode === 'light'
            ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs font-bold'
            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
        }`}
        title="Light Mode"
        aria-label="Light Mode"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span className="hidden lg:inline text-[11px]">Light</span>
      </button>

      <button
        onClick={() => setMode('dark')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
          mode === 'dark'
            ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs font-bold'
            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
        }`}
        title="Dark Mode (Aurora Cyber)"
        aria-label="Dark Mode"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <span className="hidden lg:inline text-[11px]">Dark</span>
      </button>

      <button
        onClick={() => setMode('system')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
          mode === 'system'
            ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs font-bold'
            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
        }`}
        title="System Auto Mode"
        aria-label="System Mode"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="hidden lg:inline text-[11px]">Auto</span>
      </button>
    </div>
  );
}