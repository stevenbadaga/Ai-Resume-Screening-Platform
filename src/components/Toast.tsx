'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {}
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'dark:bg-slate-900/95 bg-white border-emerald-500/50 text-emerald-600 dark:text-emerald-400';
      case 'error':
        return 'dark:bg-slate-900/95 bg-white border-rose-500/50 text-rose-600 dark:text-rose-400';
      case 'warning':
        return 'dark:bg-slate-900/95 bg-white border-amber-500/50 text-amber-600 dark:text-amber-400';
      case 'info':
      default:
        return 'dark:bg-slate-900/95 bg-white border-indigo-500/50 text-indigo-600 dark:text-indigo-400';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto border rounded-2xl p-4 shadow-2xl backdrop-blur-2xl flex items-start gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200 transition ${getToastColors(
              toast.type
            )}`}
          >
            <span className="text-base font-bold shrink-0">{getToastIcon(toast.type)}</span>
            <div className="flex-1 text-xs">
              {toast.title && <h5 className="font-bold dark:text-white text-slate-900 mb-0.5">{toast.title}</h5>}
              <p className="dark:text-slate-200 text-slate-700 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}