'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, translations, TranslationDictionary } from './translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: keyof TranslationDictionary | string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => ((translations?.en as any)?.[key] || String(key || ''))
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('recruitai_lang') as SupportedLanguage;
      if (saved && ['en', 'fr', 'es', 'de', 'rw'].includes(saved)) {
        setLanguageState(saved);
      }
    } catch {
      // Ignore localStorage errors in restricted browser contexts
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('recruitai_lang', lang);
    } catch {
      // Ignore
    }
  };

  const t = (key: keyof TranslationDictionary | string): string => {
    if (!key) return '';
    const currentDict = (translations && translations[language]) ? translations[language] : translations.en;
    const fallbackDict = translations?.en || {};
    return (currentDict as any)?.[key] || (fallbackDict as any)?.[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}