'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/Toast';

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
        showToast(t('success') || 'Data export downloaded', 'success', 'GDPR Export');
      } else {
        showToast(t('error') || 'Failed to export data', 'error');
      }
    } catch {
      showToast(t('error') || 'Failed to export data', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleRequestErasure = async () => {
    if (!confirm(t('erasure_warning') || 'Are you sure? This action is permanent and irreversible.')) {
      return;
    }
    setErasing(true);
    try {
      const res = await fetch('/api/privacy/erasure', { method: 'POST' });
      if (res.ok) {
        showToast(t('success') || 'Erasure request queued', 'success', 'Right to be Forgotten');
        window.location.href = '/auth/signin';
      } else {
        showToast(t('error') || 'Failed to submit erasure request', 'error');
      }
    } catch {
      showToast(t('error') || 'Failed to submit erasure request', 'error');
    } finally {
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
        <div className="dark:bg-[#0B0F19] bg-white dark:border-slate-800 border-slate-200 border rounded-2xl p-5 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-lg">
            📥
          </div>
          <div>
            <h3 className="font-bold dark:text-white text-slate-900 text-sm">Data Portability (Art. 20)</h3>
            <p className="text-xs dark:text-slate-400 text-slate-500 mt-1 leading-relaxed">
              Download a complete JSON archive of your personal profile, submitted resumes, screening runs, and evaluation metrics.
            </p>
          </div>
          <button
            onClick={handleExportData}
            disabled={downloading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-xs"
          >
            {downloading ? (t('loading') || 'Exporting...') : (t('btn_export_data') || 'Export My Profile Data (JSON)')}
          </button>
        </div>

        <div className="dark:bg-[#0B0F19] bg-white dark:border-slate-800 border-slate-200 border rounded-2xl p-5 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center text-lg">
            🗑️
          </div>
          <div>
            <h3 className="font-bold dark:text-white text-slate-900 text-sm">Right to be Forgotten (Art. 17)</h3>
            <p className="text-xs dark:text-slate-400 text-slate-500 mt-1 leading-relaxed">
              Permanently erase your candidate profile, OCR text indices, and submitted scorecards from all databases.
            </p>
          </div>
          <button
            onClick={handleRequestErasure}
            disabled={erasing}
            className="w-full py-2 dark:bg-rose-950/80 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-300 border dark:border-rose-800 border-rose-200 rounded-lg text-xs font-semibold transition"
          >
            {erasing ? (t('loading') || 'Processing...') : (t('btn_request_erasure') || 'Execute Right to be Forgotten (Erase Account)')}
          </button>
        </div>
      </div>
    </div>
  );
}