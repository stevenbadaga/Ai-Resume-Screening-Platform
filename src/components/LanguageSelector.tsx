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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-mono text-[var(--foreground)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
        title="Switch Language"
      >
        <span className="text-sm">{currentLang.flag}</span>
        <span className="font-bold uppercase text-[10.5px] tracking-wider">{currentLang.code}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 glass-card rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 p-1.5 text-xs">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              role="menuitem"
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                language === lang.code
                  ? 'bg-[var(--grad-accent)] text-white font-bold shadow-md shadow-indigo-500/20'
                  : 'hover:bg-[var(--surface-muted)] text-[var(--foreground)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">{lang.flag}</span>
                <span className="font-medium">{lang.label}</span>
              </div>
              {language === lang.code && <span className="text-[11px] font-bold">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}