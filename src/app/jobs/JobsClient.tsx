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
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewJob, setPreviewJob] = useState<any>(null);

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<{ category: string; description: string; isRequired: boolean; weight: number }[]>([
    { category: 'Technical Architecture', description: 'Full-Stack TypeScript & React Architecture', isRequired: true, weight: 4 },
    { category: 'Data & Backend', description: 'Database Optimization & Prisma PostgreSQL', isRequired: false, weight: 3 },
    { category: 'System Design', description: 'Distributed Queues & Async Processing (BullMQ/Redis)', isRequired: false, weight: 3 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const { t } = useLanguage();

  const isStaff = ['Admin', 'Recruiter', 'HiringManager'].includes(userRole);

  const handleAddCriteria = () => {
    setCriteria([...criteria, { category: 'Core Skill', description: '', isRequired: false, weight: 3 }]);
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
          criteria: criteria
            .filter((c) => c.description.trim().length > 0)
            .map((c) => ({
              category: c.category,
              description: c.description,
              name: c.description,
              isRequired: c.isRequired,
              weight: c.weight
            }))
        })
      });

      if (res.ok) {
        const result = await res.json();
        if (!result.job) {
          showToast('The server returned an incomplete requisition response', 'error');
          return;
        }
        setJobs((currentJobs) => [result.job, ...currentJobs]);
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        showToast(`Job Requisition "${title}" published live`, 'success', 'Requisition Created');
      } else {
        const result = await res.json().catch(() => null);
        showToast(result?.error || 'Failed to create job requisition', 'error');
      }
    } catch (err) {
      showToast('Network error while creating requisition', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openRubricPreview = (job: any) => {
    setPreviewJob(job);
    setPreviewModalOpen(true);
  };

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b dark:border-slate-800/80 border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              {t('jobs_title')}
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold dark:bg-teal-950/60 bg-teal-50 dark:text-teal-300 text-teal-800 border dark:border-teal-800/50 border-teal-200">
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
            className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1 shadow-xs self-start sm:self-auto dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            <span>+</span>
            <span>{t('btn_create_job')}</span>
          </button>
        )}
      </div>

      {/* Requisitions Grid */}
      {jobs.length === 0 ? (
        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-8 text-center space-y-2">
          <p className="text-xs dark:text-slate-400 text-slate-500">{t('no_jobs_found')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const criteriaList = job.rubrics?.[0]?.criteria || [];
            const totalWeight = criteriaList.reduce((sum: number, c: any) => sum + (c.weight || 1), 0);

            return (
              <div
                key={job.id}
                className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-teal-500/50 transition shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {job.organization?.name && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                          🏢 {job.organization.name}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium dark:bg-slate-900 bg-slate-100 dark:text-slate-300 text-slate-700 border dark:border-slate-800 border-slate-200">
                        {job.department}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold shrink-0">● ACTIVE</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm dark:text-white text-slate-900 tracking-tight">
                      {job.title}
                    </h3>
                    <p className="text-xs dark:text-slate-400 text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  {criteriaList.length > 0 && (
                    <div className="pt-2 border-t dark:border-slate-800/60 border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono font-semibold dark:text-slate-400 text-slate-500">
                        <span>{t('scored_criteria')} ({criteriaList.length})</span>
                        <button
                          onClick={() => openRubricPreview(job)}
                          className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
                        >
                          🔍 Preview Rubric
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {criteriaList.slice(0, 3).map((crit: any) => (
                          <span
                            key={crit.id}
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono dark:bg-slate-900 bg-slate-100 dark:text-slate-300 text-slate-700 border dark:border-slate-800 border-slate-200"
                          >
                            {crit.description || crit.name} (w:{crit.weight})
                          </span>
                        ))}
                        {criteriaList.length > 3 && (
                          <span className="text-[9px] font-mono text-slate-400 self-center">
                            +{criteriaList.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t dark:border-slate-800/60 border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] dark:text-slate-400 text-slate-500 font-mono">
                    {job._count?.applications || job.applications?.length || 0} applicants
                  </span>
                  <Link
                    href={`/jobs/${job.id}/apply`}
                    className="px-3 py-1 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    {t('apply_role')} &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RUBRIC PREVIEW MODAL */}
      {previewModalOpen && previewJob && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-[#17242B] bg-[#FFFDF8] dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800 border-slate-100">
              <div>
                <h3 className="text-sm font-bold dark:text-white text-slate-900">{t('rubric_preview_title')}</h3>
                <p className="text-[10px] dark:text-slate-400 text-slate-500">{previewJob.title} &bull; {previewJob.department}</p>
              </div>
              <button onClick={() => setPreviewModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div className="p-3 dark:bg-[#0F171D] bg-slate-50 rounded-xl border dark:border-[#30424A]/40 border-slate-200">
                <p className="text-[11px] font-semibold dark:text-slate-300 text-slate-700">{t('rubric_scoring_formula')}</p>
                <p className="text-[10px] dark:text-slate-400 text-slate-500 mt-0.5">
                  {t('rubric_preview_subtitle')}
                </p>
              </div>

              <div className="space-y-2">
                {(previewJob.rubrics?.[0]?.criteria || []).map((crit: any, idx: number) => (
                  <div
                    key={crit.id || idx}
                    className="p-3 dark:bg-[#0F171D] bg-slate-50 rounded-xl border dark:border-[#30424A]/40 border-slate-200 flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="text-[9px] font-mono uppercase font-bold text-teal-600 dark:text-teal-400">
                        {crit.category || 'General Criterion'}
                      </span>
                      <p className="text-xs font-semibold dark:text-slate-200 text-slate-800 mt-0.5">
                        {crit.description || crit.name}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold dark:bg-teal-950 bg-teal-50 dark:text-teal-300 text-teal-700 border dark:border-teal-800 border-teal-200">
                        {t('create_job_weight_label')}: {crit.weight || 3}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t dark:border-slate-800 border-slate-100">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-3.5 py-1.5 dark:bg-slate-800 bg-slate-100 rounded-lg font-medium text-xs dark:text-slate-200 text-slate-700"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE JOB MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-[#17242B] bg-[#FFFDF8] dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800 border-slate-100">
              <h3 className="text-sm font-bold dark:text-white text-slate-900">{t('create_job_modal_title')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3">
              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">{t('create_job_title_label')} *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Architect"
                  className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">{t('create_job_dept_label')} *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-teal-500"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product & Design</option>
                  <option value="Data & AI">Data & AI</option>
                  <option value="Sales">Sales & Marketing</option>
                  <option value="Operations">Operations & HR</option>
                </select>
              </div>

              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">{t('create_job_desc_label')} *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Responsibilities, stack requirements, and qualifications..."
                  className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg p-2.5 leading-relaxed focus:outline-none focus:border-teal-500"
                ></textarea>
              </div>

              {/* Rubric Criteria Builder */}
              <div className="space-y-2 pt-2 border-t dark:border-slate-800 border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold dark:text-slate-300 text-slate-700">
                    {t('create_job_criteria_heading')} ({criteria.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCriteria}
                    className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                  >
                    {t('create_job_add_criteria')}
                  </button>
                </div>

                <div className="space-y-1.5">
                  {criteria.map((crit, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={crit.category}
                        onChange={(e) => handleCriteriaChange(idx, 'category', e.target.value)}
                        placeholder={t('create_job_category_label')}
                        className="w-24 dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-md px-2 py-1 text-[11px] font-mono"
                      />
                      <input
                        type="text"
                        value={crit.description}
                        onChange={(e) => handleCriteriaChange(idx, 'description', e.target.value)}
                        placeholder="e.g. Distributed Systems (Go/Rust)"
                        className="flex-1 dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-md px-2.5 py-1 text-xs"
                      />
                      <select
                        value={crit.isRequired ? 'REQUIRED' : 'PREFERRED'}
                        onChange={(e) => handleCriteriaChange(idx, 'isRequired', e.target.value === 'REQUIRED')}
                        className="dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-md px-1.5 py-1 text-[10px] font-mono text-teal-600 dark:text-teal-400"
                      >
                        <option value="REQUIRED">Required</option>
                        <option value="PREFERRED">Preferred</option>
                      </select>
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
                        className="text-rose-400 hover:text-rose-300 p-1 text-xs"
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
                  className="px-3 py-1.5 dark:bg-slate-800 bg-slate-100 rounded-lg font-medium text-xs"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold rounded-lg shadow-xs text-xs"
                >
                  {submitting ? t('loading') : t('create_job_submit_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}