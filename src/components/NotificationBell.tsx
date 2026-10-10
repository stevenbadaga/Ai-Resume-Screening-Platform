'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.notifications || [];
          setNotifications(list);
          setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : list.filter((n: any) => !n.isRead).length);
        }
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { notificationId: id } : { markAll: true })
      });
      if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
        title={t('notifications')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 bg-indigo-600 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center shadow-md shadow-indigo-500/40 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 glass-card rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
          <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-bold text-[var(--foreground)]">{t('notifications')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead()}
                className="text-[10px] text-[var(--accent)] hover:underline font-bold"
              >
                {t('notifications_mark_all_read')}
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border)]/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[var(--muted)] font-medium">
                {t('notifications_empty')}
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={`p-3 transition cursor-pointer ${
                    !n.isRead ? 'dark:bg-indigo-950/20 bg-indigo-50/50' : 'dark:hover:bg-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold dark:text-slate-200 text-slate-800 leading-tight">{n.title}</p>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] dark:text-slate-400 text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => setIsOpen(false)}
                      className="inline-block text-[10px] text-indigo-500 hover:underline font-semibold mt-1"
                    >
                      {t('view_details') || 'View Details'} &rarr;
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}