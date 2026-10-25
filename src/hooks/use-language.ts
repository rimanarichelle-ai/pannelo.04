'use client';

import { useSyncExternalStore, useCallback, useEffect } from 'react';
import { TRANSLATIONS, type Language, type Translations } from '@/lib/translations';

let memoryLangFallback: Language | null = null;

function applyLanguageToDocument(lang: Language) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('pannello-lang-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('pannello-lang-change', callback);
  };
}

function getSnapshot(): Language {
  if (typeof window === 'undefined') return 'fr';
  try {
    const stored = localStorage.getItem('pannello_lang');
    if (stored === 'fr' || stored === 'en') return stored;
  } catch {
    if (memoryLangFallback) return memoryLangFallback;
  }
  return memoryLangFallback ?? 'fr';
}

function getServerSnapshot(): Language {
  return 'fr';
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    applyLanguageToDocument(language);
  }, [language]);

  const setLanguage = useCallback((newLang: Language) => {
    memoryLangFallback = newLang;
    try {
      localStorage.setItem('pannello_lang', newLang);
    } catch {
      // Restricted WebView or Private Browsing: memoryLangFallback preserves session state
    }
    applyLanguageToDocument(newLang);
    window.dispatchEvent(new Event('pannello-lang-change'));
  }, []);

  const toggleLanguage = useCallback(() => {
    const nextLang: Language = language === 'fr' ? 'en' : 'fr';
    setLanguage(nextLang);
  }, [language, setLanguage]);

  const t: Translations = TRANSLATIONS[language] || TRANSLATIONS.fr;

  return {
    language,
    setLanguage,
    toggleLanguage,
    t,
  };
}
