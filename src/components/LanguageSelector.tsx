'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SupportedLanguage } from '@/lib/i18n/translations';

const LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' }
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg dark:hover:bg-slate-800 hover:bg-slate-100 border dark:border-slate-800 border-slate-200 text-xs font-mono dark:text-slate-300 text-slate-700 transition"
        title="Switch Language"
      >
        <span>{currentLang.flag}</span>
        <span className="font-semibold uppercase text-[10px]">{currentLang.code}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-40 dark:bg-[#0B0F19] bg-white dark:border-slate-800 border-slate-200 border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 p-1 text-xs">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              role="menuitem"
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                language === lang.code
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'dark:hover:bg-slate-900 hover:bg-slate-100 dark:text-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </div>
              {language === lang.code && <span className="text-[10px]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}