'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SupportedLanguage } from '@/lib/i18n/translations';

const LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        closeDropdown();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeDropdown]);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Select language"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-mono text-[var(--foreground)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 active:scale-95"
        title={`Language: ${currentLang.label}`}
      >
        <span className="text-sm" aria-hidden="true">{currentLang.flag}</span>
        <span className="font-bold uppercase text-[10.5px] tracking-wider">{currentLang.code}</span>
        <svg
          className={`w-3 h-3 text-[var(--muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-48 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 shadow-2xl backdrop-blur-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 p-1.5 text-xs"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)] mb-1">
            Choose Language
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                role="menuitem"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-[var(--accent)] text-white font-bold shadow-sm'
                    : 'hover:bg-[var(--surface-muted)] text-[var(--foreground)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base" aria-hidden="true">{lang.flag}</span>
                  <span className="font-medium">{lang.label}</span>
                </div>
                {isSelected && (
                  <span className="text-xs font-bold" aria-hidden="true">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
