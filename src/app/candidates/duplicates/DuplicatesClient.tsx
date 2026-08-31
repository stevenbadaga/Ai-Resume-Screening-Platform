'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/Toast';

interface DuplicatesClientProps {
  duplicates: any[];
}

export default function DuplicatesClient({ duplicates: initialDuplicates }: DuplicatesClientProps) {
  const [duplicates, setDuplicates] = useState(initialDuplicates);
  const { t } = useLanguage();
  const { showToast } = useToast();

  const handleMerge = (email: string) => {
    setDuplicates((prev) => prev.filter((d) => d.email !== email));
    showToast(`Merged duplicate candidate records for ${email}`, 'success', 'Deduplication Complete');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold dark:bg-teal-950/80 bg-teal-50 dark:text-teal-300 text-teal-700 border dark:border-teal-800/80 border-teal-200">
              {t('duplicates_potential_matches')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold dark:text-white text-slate-900 tracking-tight">
            {t('duplicates_title')}
          </h1>
          <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-500 mt-1">
            {t('duplicates_subtitle')}
          </p>
        </div>
      </div>

      {duplicates.length === 0 ? (
        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <span className="text-4xl block">✨</span>
          <h3 className="font-bold dark:text-white text-slate-900 text-sm">{t('duplicates_no_found')}</h3>
          <p className="text-xs dark:text-slate-400 text-slate-500 max-w-md mx-auto">
            {t('duplicates_subtitle')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {duplicates.map((dup, idx) => (
            <div
              key={idx}
              className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-6 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold dark:text-white text-slate-900 text-sm">{dup.email}</h3>
                  <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400">
                    {dup.candidates.length} matching candidate profiles
                  </span>
                </div>
                <button
                  onClick={() => handleMerge(dup.email)}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  {t('duplicates_merge_btn')}
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t dark:border-slate-800 border-slate-100">
                {dup.candidates.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg dark:bg-[#0F171D] bg-slate-50 dark:border-[#30424A]/40 border-slate-200 border">
                    <div>
                      <p className="font-semibold dark:text-white text-slate-900">{c.firstName} {c.lastName}</p>
                      <p className="text-[10px] dark:text-slate-400 text-slate-500 font-mono">
                        {c.applications?.length || 0} applications submitted
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}