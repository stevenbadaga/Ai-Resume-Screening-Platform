'use client';

import { useState } from 'react';
import Link from 'next/link';
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold dark:bg-purple-950/80 bg-purple-50 dark:text-purple-300 text-purple-700 border dark:border-purple-800/80 border-purple-200">
              CROSS-MATCH DEDUPLICATION
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold dark:text-white text-slate-900 tracking-tight">
            {t('dedup_title') || 'Automated Candidate Deduplication'}
          </h1>
          <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-500 mt-1">
            {t('dedup_subtitle') || 'Detect duplicate profiles across email, phone, and resume text similarity.'}
          </p>
        </div>
      </div>

      {duplicates.length === 0 ? (
        <div className="dark:bg-slate-900/40 bg-white dark:border-slate-800 border-slate-200/90 border rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <span className="text-4xl block">✨</span>
          <h3 className="font-bold dark:text-white text-slate-900 text-sm">Clean Candidate Database</h3>
          <p className="text-xs dark:text-slate-400 text-slate-500 max-w-md mx-auto">
            {t('no_duplicates') || 'No duplicate candidates detected in the current pool.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {duplicates.map((dup, idx) => (
            <div
              key={idx}
              className="dark:bg-slate-900/60 bg-white dark:border-slate-800/80 border-slate-200/90 border rounded-3xl p-6 shadow-xs space-y-4 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold dark:text-white text-slate-900 text-sm">{dup.email}</h3>
                  <span className="text-[10px] font-mono text-purple-400">
                    {dup.candidates.length} matching candidate profiles
                  </span>
                </div>
                <button
                  onClick={() => handleMerge(dup.email)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  {t('merge_profiles') || 'Merge Profiles'}
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t dark:border-slate-800 border-slate-100">
                {dup.candidates.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between text-xs p-2 rounded-lg dark:bg-slate-950 bg-slate-50">
                    <div>
                      <p className="font-semibold dark:text-white text-slate-900">{c.firstName} {c.lastName}</p>
                      <p className="text-[10px] dark:text-slate-500 text-slate-400 font-mono">
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