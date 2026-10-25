'use client';

import { useSyncExternalStore, useCallback, useEffect } from 'react';

export type Theme = 'dark' | 'light';

let sessionTheme: Theme = 'light';

function applyThemeToDocument(newTheme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (newTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#0a0a0d' : '#ffffff');
  }
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('pannello-theme-change', callback);
  return () => {
    window.removeEventListener('pannello-theme-change', callback);
  };
}

function getSnapshot(): Theme {
  return sessionTheme;
}

function getServerSnapshot(): Theme {
  return 'light';
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = sessionTheme === 'dark' ? 'light' : 'dark';
    sessionTheme = nextTheme;
    applyThemeToDocument(nextTheme);
    window.dispatchEvent(new Event('pannello-theme-change'));
  }, []);

  return { theme, toggleTheme, mounted: true };
}
