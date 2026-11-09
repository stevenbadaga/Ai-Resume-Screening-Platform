'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/Toast';
import { signOut } from 'next-auth/react';
import PrivacyRequestForm from './PrivacyRequestForm';

export default function PrivacyClient() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [erasing, setErasing] = useState(false);

  const handleExportData = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/privacy/export');
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my_recruitai_data_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(t('success'), 'success', t('privacy_portability_toast_title'));
      } else {
        const errorData = await res.json().catch(() => null);
        showToast(errorData?.error || t('privacy_export_failed'), 'error');
      }
    } catch {
      showToast(t('privacy_export_failed'), 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleRequestErasure = async () => {
    if (!confirm(t('erasure_warning'))) {
      return;
    }
    setErasing(true);
    try {
      const res = await fetch('/api/privacy/erasure', { method: 'POST' });
      if (res.ok) {
        showToast(t('privacy_erasure_success'), 'success', t('privacy_erasure_toast_title'));
        setTimeout(() => {
          signOut({ callbackUrl: '/auth/signin' });
        }, 1200);
      } else {
        const errorData = await res.json().catch(() => null);
        showToast(errorData?.error || t('privacy_erasure_failed'), 'error');
        setErasing(false);
      }
    } catch {
      showToast(t('privacy_erasure_failed'), 'error');
      setErasing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-2 border-b dark:border-slate-800 border-slate-200">
        <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
          {t('privacy_title') || 'GDPR Data Privacy & User Rights'}
        </h1>
        <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
          {t('privacy_subtitle') || 'Self-service data export and Right to be Forgotten account erasure controls.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Data Portability (Art. 20) */}
        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold dark:text-white text-slate-900 text-sm">{t('privacy_portability_title')}</h3>
              <p className="text-xs dark:text-slate-400 text-slate-600 mt-1 leading-relaxed">
                {t('privacy_portability_desc')}
              </p>
            </div>
          </div>
          <button
            onClick={handleExportData}
            disabled={downloading}
            className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{downloading ? (t('loading')) : (t('btn_export_data'))}</span>
          </button>
        </div>

        {/* Right to be Forgotten (Art. 17) */}
        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold dark:text-white text-slate-900 text-sm">{t('privacy_erasure_title')}</h3>
              <p className="text-xs dark:text-slate-400 text-slate-600 mt-1 leading-relaxed">
                {t('privacy_erasure_desc')}
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestErasure}
            disabled={erasing}
            className="w-full py-2.5 dark:bg-rose-950/80 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-300 border dark:border-rose-800 border-rose-200 disabled:opacity-50 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>{erasing ? (t('loading')) : (t('btn_request_erasure'))}</span>
          </button>
        </div>
      </div>

      {/* §6.11: tracked correction / access / withdrawal requests routed to staff */}
      <PrivacyRequestForm />
    </div>
  );
}