'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface DeliveryRow {
  id: string;
  recipient: string;
  template: string;
  deliveryState: string;
  failureInfo?: string | null;
  createdAt: string | Date;
}

function friendlyTemplateLabel(template: string): string {
  return template.replace(/_/g, ' ').toLowerCase();
}

function formatWhen(value: string | Date): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EmailDeliveryClient({
  deliveries,
  total,
}: {
  deliveries: DeliveryRow[];
  total: number;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState<string>('ALL');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  // §6.9: failed notifications must be retried safely where appropriate.
  // The retry records its own Communication row with the real outcome.
  const handleRetry = async (communicationId: string) => {
    setRetryingId(communicationId);
    setRetryMessage(null);
    try {
      const res = await fetch('/api/notifications/retry-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communicationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRetryMessage(t('email_retry_ok'));
        router.refresh();
      } else {
        setRetryMessage(t('email_retry_failed').replace('{detail}', data.detail || data.error || 'unknown error'));
      }
    } catch {
      setRetryMessage(t('email_retry_network'));
    } finally {
      setRetryingId(null);
    }
  };

  const templates = Array.from(new Set(deliveries.map((d) => d.template))).sort();
  const filtered =
    templateFilter === 'ALL' ? deliveries : deliveries.filter((d) => d.template === templateFilter);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b dark:border-slate-800/80 border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              {t('email_title')}
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold dark:bg-teal-950/50 bg-teal-50 dark:text-teal-300 text-teal-700 border dark:border-teal-800/60 border-teal-200">
              {t('email_ops_badge')}
            </span>
          </div>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            {t('email_subtitle')}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="self-start px-3 py-1.5 dark:bg-slate-900 bg-white dark:hover:bg-slate-800 hover:bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg text-xs font-semibold dark:text-slate-200 text-slate-700 transition"
        >
          {t('email_back')}
        </Link>
      </div>

      {retryMessage && (
        <div className="rounded-lg px-3 py-2 text-xs dark:bg-teal-950/40 bg-teal-50 dark:text-teal-300 text-teal-700 border dark:border-teal-800/60 border-teal-200">
          {retryMessage}
        </div>
      )}

      {deliveries.length === 0 ? (
        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-8 text-center space-y-2">
          <span className="text-3xl block">✅</span>
          <h2 className="text-sm font-bold dark:text-white text-slate-900">{t('email_empty_title')}</h2>
          <p className="text-xs dark:text-slate-400 text-slate-500">
            {t('email_empty_desc')}
          </p>
        </div>
      ) : (
        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold dark:text-white text-slate-900 uppercase tracking-wider">
              {t('email_failed_heading').replace('{total}', String(total))}
            </h2>
            {templates.length > 1 && (
              <select
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
                className="text-xs dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 border rounded-lg px-2 py-1.5 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">{t('email_all_templates')}</option>
                {templates.map((tpl) => (
                  <option key={tpl} value={tpl}>
                    {friendlyTemplateLabel(tpl)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs dark:text-slate-300 text-slate-700">
              <thead className="dark:bg-slate-900/60 bg-slate-50 dark:text-slate-400 text-slate-500 font-mono uppercase text-[10px] dark:border-slate-800 border-slate-200 border-b">
                <tr>
                  <th className="p-2.5">{t('email_col_when')}</th>
                  <th className="p-2.5">{t('email_col_recipient')}</th>
                  <th className="p-2.5">{t('email_col_template')}</th>
                  <th className="p-2.5 text-right">{t('email_col_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800/60 divide-slate-100">
                {filtered.map((row) => (
                  <RowFragment
                    key={row.id}
                    row={row}
                    expanded={expandedId === row.id}
                    onToggle={() => setExpandedId(expandedId === row.id ? null : row.id)}
                    onRetry={() => handleRetry(row.id)}
                    retrying={retryingId === row.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RowFragment({
  row,
  expanded,
  onToggle,
  onRetry,
  retrying,
}: {
  row: DeliveryRow;
  expanded: boolean;
  onToggle: () => void;
  onRetry: () => void;
  retrying: boolean;
}) {
  const { t } = useLanguage();
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer dark:hover:bg-slate-900/50 hover:bg-slate-50 transition"
      >
        <td className="p-2.5 font-mono text-[11px] dark:text-slate-400 text-slate-500 whitespace-nowrap">
          {formatWhen(row.createdAt)}
        </td>
        <td className="p-2.5 font-mono text-[11px] break-all">{row.recipient}</td>
        <td className="p-2.5 text-[11px] capitalize">{friendlyTemplateLabel(row.template)}</td>
        <td className="p-2.5 text-right whitespace-nowrap">
          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-800/60">
            {t('email_status_failed')}
          </span>
          <span className="ml-1 text-[10px] text-slate-400">
            {expanded ? t('email_hide_error') : t('email_show_error')}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={4} className="px-2.5 pb-3">
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 font-mono text-[10px] text-rose-200/90 break-all whitespace-pre-wrap">
              {row.failureInfo || t('email_no_detail')}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              disabled={retrying}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold dark:bg-teal-600 bg-teal-500 text-white hover:opacity-90 disabled:opacity-50"
            >
              {retrying ? t('email_retrying') : t('btn_retry_delivery')}
            </button>
          </td>
        </tr>
      )}
    </>
  );
}
