'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Props {
  initialJobs: any[];
  userRole?: string;
}

export default function JobsClient({ initialJobs, userRole = 'Candidate' }: Props) {
  const [jobs, setJobs] = useState<any[]>(initialJobs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<{ name: string; weight: number }[]>([
    { name: 'Full-Stack TypeScript & React Architecture', weight: 4 },
    { name: 'Database Optimization & Prisma PostgreSQL', weight: 3 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const { t } = useLanguage();

  const isStaff = ['Admin', 'Recruiter', 'HiringManager'].includes(userRole);

  const handleAddCriteria = () => {
    setCriteria([...criteria, { name: '', weight: 3 }]);
  };

  const handleRemoveCriteria = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleCriteriaChange = (index: number, field: string, value: any) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      showToast('Title and description are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          department,
          description,
          criteria: criteria.filter((c) => c.name.trim().length > 0)
        })
      });

      if (res.ok) {
        const newJob = await res.json();
        setJobs([newJob, ...jobs]);
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        showToast(`Job Requisition "${title}" published live`, 'success', 'Requisition Created');
      } else {
        showToast('Failed to create job requisition', 'error');
      }
    } catch (err) {
      showToast('Network error while creating requisition', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b dark:border-slate-800/80 border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              {t('jobs_title')}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-emerald-950/60 bg-emerald-50 dark:text-emerald-300 text-emerald-800 border dark:border-emerald-800/50 border-emerald-200">
              {jobs.length} {t('active_requisitions_badge')}
            </span>
          </div>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            {t('jobs_subtitle')}
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1 shadow-xs self-start sm:self-auto"
          >
            <span>+</span>
            <span>{t('btn_create_job')}</span>
          </button>
        )}
      </div>

      {/* Requisitions Grid */}
      {jobs.length === 0 ? (
        <div className="dark:bg-[#0B0F19] bg-white dark:border-slate-800/80 border-slate-200 border rounded-xl p-8 text-center space-y-2">
          <p className="text-xs dark:text-slate-400 text-slate-500">{t('no_jobs_found')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {jobs.map((job) => {
            const rubrics = job.rubrics || [];
            const activeRubric = rubrics[0];
            const criteriaList = activeRubric?.criteria || [];

            return (
              <div
                key={job.id}
                className="dark:bg-[#0B0F19] bg-white dark:border-slate-800/80 border-slate-200 border rounded-xl p-4.5 flex flex-col justify-between space-y-3 hover:border-indigo-500/40 transition shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium dark:bg-slate-900 bg-slate-100 dark:text-slate-300 text-slate-700 border dark:border-slate-800 border-slate-200">
                      {job.department}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold">● ACTIVE</span>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold dark:text-white text-slate-900 leading-tight">
                      {job.title}
                    </h2>
                    <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  {criteriaList.length > 0 && (
                    <div className="pt-2 border-t dark:border-slate-800/60 border-slate-100 space-y-1.5">
                      <span className="text-[10px] uppercase font-mono font-semibold dark:text-slate-400 text-slate-500">
                        {t('scored_criteria')} ({criteriaList.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {criteriaList.slice(0, 3).map((crit: any) => (
                          <span
                            key={crit.id}
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono dark:bg-slate-900 bg-slate-100 dark:text-slate-300 text-slate-700 border dark:border-slate-800 border-slate-200"
                          >
                            {crit.name} (w:{crit.weight})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t dark:border-slate-800/60 border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] dark:text-slate-500 text-slate-400 font-mono">
                    {job.applications?.length || 0} applicants
                  </span>
                  <Link
                    href={`/jobs/${job.id}/apply`}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    {t('apply_role')} &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE JOB MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-[#0B0F19] bg-white dark:border-slate-800 border-slate-200 border rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800 border-slate-100">
              <h3 className="text-sm font-bold dark:text-white text-slate-900">{t('btn_create_job')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3">
              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">Position Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Architect"
                  className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">Department *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product & Design</option>
                  <option value="Data & AI">Data & AI</option>
                  <option value="Sales">Sales & Marketing</option>
                  <option value="Operations">Operations & HR</option>
                </select>
              </div>

              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">Job Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Responsibilities, stack requirements, and qualifications..."
                  className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg p-2.5 leading-relaxed"
                ></textarea>
              </div>

              {/* Rubric Criteria Builder */}
              <div className="space-y-2 pt-2 border-t dark:border-slate-800 border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold dark:text-slate-300 text-slate-700">
                    Weighted AI Criteria ({criteria.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCriteria}
                    className="text-[10px] text-indigo-500 hover:underline font-semibold"
                  >
                    + Add Criterion
                  </button>
                </div>

                <div className="space-y-1.5">
                  {criteria.map((crit, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={crit.name}
                        onChange={(e) => handleCriteriaChange(idx, 'name', e.target.value)}
                        placeholder="e.g. Distributed Systems (Go/Rust)"
                        className="flex-1 dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-md px-2.5 py-1 text-xs"
                      />
                      <select
                        value={crit.weight}
                        onChange={(e) => handleCriteriaChange(idx, 'weight', Number(e.target.value))}
                        className="dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
                      >
                        <option value={1}>w:1</option>
                        <option value={2}>w:2</option>
                        <option value={3}>w:3</option>
                        <option value={4}>w:4</option>
                        <option value={5}>w:5</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveCriteria(idx)}
                        className="text-rose-400 p-1 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800 border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 dark:bg-slate-800 bg-slate-100 rounded-lg font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {submitting ? t('loading') : t('confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}