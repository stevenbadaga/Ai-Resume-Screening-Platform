'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { roleCapabilities } from '@/lib/roleAccess';
import { buildPageUrl } from '@/lib/pagination';

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface JobFilters {
  q: string;
  status: string;
  department: string;
  departments: string[];
}

export interface MyApplicationInfo {
  applicationId: string;
  status: string;
  stage: string;
  score: number | null;
  appliedAt: string;
}

interface Props {
  initialJobs: any[];
  userRole?: string;
  pagination?: PaginationInfo;
  filters?: JobFilters;
  myApplications?: Record<string, MyApplicationInfo>;
  hasSavedResume?: boolean;
  isAuthenticated?: boolean;
  permissions?: string[];
}

const STATUS_OPTIONS = ['DRAFT', 'REVIEW', 'OPEN', 'CLOSED', 'ARCHIVED'];

export default function JobsClient({ initialJobs, userRole = 'Candidate', pagination, filters, myApplications: initialMyApplications, hasSavedResume: initialHasSavedResume, isAuthenticated = true, permissions = [] }: Props) {
  const [jobs, setJobs] = useState<any[]>(initialJobs);
  const [myApplications, setMyApplications] = useState<Record<string, MyApplicationInfo>>(initialMyApplications ?? {});
  const [hasSavedResume, setHasSavedResume] = useState<boolean>(initialHasSavedResume ?? false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewJob, setPreviewJob] = useState<any>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  // §6.2: requisitions carry location, employment type, and an application window.
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [closesAt, setClosesAt] = useState('');
  const [criteria, setCriteria] = useState<{ category: string; description: string; isRequired: boolean; weight: number; threshold: string; evidenceRules: string }[]>([
    { category: 'Technical Architecture', description: 'Full-Stack TypeScript & React Architecture', isRequired: true, weight: 4, threshold: '', evidenceRules: '' },
    { category: 'Data & Backend', description: 'Database Optimization & Prisma PostgreSQL', isRequired: false, weight: 3, threshold: '', evidenceRules: '' },
    { category: 'System Design', description: 'Distributed Queues & Async Processing (BullMQ/Redis)', isRequired: false, weight: 3, threshold: '', evidenceRules: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const { t } = useLanguage();

  const isStaff = permissions.includes('jobs:manage') || roleCapabilities.canManageJobs(userRole);

  // One-click apply (candidates with a saved CV on their profile): the
  // application re-enters the standard intake pipeline with the stored
  // document — no form filling, no re-upload.
  const handleOneClickApply = async (job: any) => {
    if (applyingJobId) return;
    setApplyingJobId(job.id);
    try {
      const fd = new FormData();
      fd.append('jobId', job.id);
      fd.append('useProfileResume', 'true');
      fd.append('consentGiven', 'true');
      fd.append('consentToDataProcessing', 'true');
      const res = await fetch('/api/jobs/apply', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to submit application');
      setMyApplications((prev) => ({
        ...prev,
        [job.id]: {
          applicationId: data.applicationId,
          status: 'NEW',
          stage: 'NEW',
          score: null,
          appliedAt: new Date().toISOString(),
        },
      }));
      showToast(t('toast_applied_saved_cv').replace('{title}', job.title), 'success', t('toast_one_click_title'));
    } catch (err: any) {
      showToast(err.message || t('toast_one_click_failed'), 'error');
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleAddCriteria = () => {
    setCriteria([...criteria, { category: 'Core Skill', description: '', isRequired: false, weight: 3, threshold: '', evidenceRules: '' }]);
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
      showToast(t('toast_title_desc_required'), 'error');
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
          location: location.trim() || undefined,
          employmentType: employmentType || undefined,
          closesAt: closesAt ? new Date(closesAt).toISOString() : undefined,
          criteria: criteria
            .filter((c) => c.description.trim().length > 0)
            .map((c) => ({
              category: c.category,
              description: c.description,
              name: c.description,
              isRequired: c.isRequired,
              weight: c.weight,
              // §6.2: minimum threshold + acceptable evidence per criterion.
              threshold: c.threshold?.trim() || undefined,
              evidenceRules: c.evidenceRules?.trim() || undefined
            }))
        })
      });

      if (res.ok) {
        const result = await res.json();
        if (!result.job) {
          showToast(t('toast_incomplete_response'), 'error');
          return;
        }
        setJobs((currentJobs) => [result.job, ...currentJobs]);
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        showToast(t('toast_requisition_published').replace('{title}', title), 'success', t('toast_requisition_created_title'));
      } else {
        const result = await res.json().catch(() => null);
        showToast(result?.error || t('toast_create_failed'), 'error');
      }
    } catch (err) {
      showToast(t('toast_network_create'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openRubricPreview = (job: any) => {
    setPreviewJob(job);
    setPreviewModalOpen(true);
  };

  // ── Rubric edit (§6.2: changes to an approved rubric create a NEW version) ──
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [editCriteria, setEditCriteria] = useState<{ category: string; description: string; isRequired: boolean; weight: number; threshold: string; evidenceRules: string }[]>([]);
  const [editChangeReason, setEditChangeReason] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const openRubricEdit = (job: any) => {
    const rubric = job.rubrics?.[0];
    if (!rubric) {
      showToast(t('toast_no_rubric'), 'error');
      return;
    }
    setEditingJob(job);
    setEditCriteria(
      (rubric.criteria || []).map((c: any) => ({
        category: c.category || '',
        description: c.description || c.name || '',
        isRequired: Boolean(c.isRequired),
        weight: c.weight || 1,
        threshold: c.threshold || '',
        evidenceRules: c.evidenceRules || '',
      }))
    );
    setEditChangeReason('');
    setEditModalOpen(true);
  };

  const handleEditCriteriaChange = (index: number, field: string, value: any) => {
    const updated = [...editCriteria];
    updated[index] = { ...updated[index], [field]: value };
    setEditCriteria(updated);
  };

  const submitRubricEdit = async () => {
    if (!editingJob) return;
    const rubricId = editingJob.rubrics?.[0]?.id;
    const isApproved = editingJob.rubrics?.[0]?.status === 'APPROVED';
    const cleanedCriteria = editCriteria.filter((c) => c.description.trim().length > 0);

    if (cleanedCriteria.length === 0) {
      showToast(t('toast_rubric_min_one'), 'error');
      return;
    }
    if (isApproved && !editChangeReason.trim()) {
      showToast(t('toast_reason_required'), 'error');
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${editingJob.id}/rubric`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rubricId,
          changeReason: editChangeReason.trim() || undefined,
          criteria: cleanedCriteria,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(data?.error || t('toast_rubric_update_failed'), 'error');
        return;
      }
      setJobs((current) =>
        current.map((j) =>
          j.id === editingJob.id
            ? { ...j, rubrics: [data.rubric, ...(j.rubrics || []).filter((r: any) => r.id !== data.rubric.id)] }
            : j
        )
      );
      setEditModalOpen(false);
      showToast(
        data.supersededRubricId
          ? t('toast_rubric_new_draft')
          : t('toast_rubric_updated'),
        'success',
        t('toast_rubric_saved_title')
      );
    } catch {
      showToast(t('toast_rubric_network'), 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Jobs are created as DRAFT and only become visible to applicants once the
  // rubric is APPROVED (the approval flips the requisition to OPEN). This
  // drives the rubric state machine (DRAFT → REVIEW → APPROVED) from the UI.
  const handlePublishJob = async (job: any) => {
    if (publishingId) return;
    const rubricId = job.rubrics?.[0]?.id;
    if (!rubricId) {
      showToast(t('toast_no_rubric_approve'), 'error');
      return;
    }
    setPublishingId(job.id);
    try {
      const steps = job.status === 'DRAFT' ? ['REVIEW', 'APPROVED'] : ['APPROVED'];
      for (const newStatus of steps) {
        const res = await fetch(`/api/jobs/${job.id}/rubric`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rubricId, newStatus, changeReason: 'Published for applicant visibility' })
        });
        if (!res.ok) {
          const result = await res.json().catch(() => null);
          showToast(result?.error || t('toast_publish_failed').replace('{status}', newStatus), 'error');
          return;
        }
      }
      setJobs((current) => current.map((j) => (j.id === job.id ? { ...j, status: 'OPEN' } : j)));
      showToast(t('toast_requisition_visible').replace('{title}', job.title), 'success', t('toast_requisition_published_title'));
    } catch (err) {
      showToast(t('toast_network_publish'), 'error');
    } finally {
      setPublishingId(null);
    }
  };

  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const handleDuplicateJob = async (job: any) => {
    if (duplicatingId) return;
    setDuplicatingId(job.id);
    try {
      const res = await fetch(`/api/jobs/${job.id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setJobs((current) => [data.job, ...current]);
        showToast(t('toast_requisition_duplicated').replace('{title}', data.job.title), 'success', t('toast_requisition_cloned_title'));
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error || t('toast_duplicate_failed'), 'error');
      }
    } catch {
      showToast(t('toast_network_duplicate'), 'error');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleCloseJob = async (job: any) => {
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' }),
      });
      if (res.ok) {
        setJobs((current) => current.map((j) => (j.id === job.id ? { ...j, status: 'CLOSED' } : j)));
        showToast(t('toast_requisition_closed').replace('{title}', job.title), 'success', t('toast_requisition_closed_title'));
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error || t('toast_close_failed'), 'error');
      }
    } catch {
      showToast(t('toast_network_close'), 'error');
    }
  };

  const handleArchiveJob = async (job: any) => {
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });
      if (res.ok) {
        setJobs((current) => current.map((j) => (j.id === job.id ? { ...j, status: 'ARCHIVED' } : j)));
        showToast(t('toast_requisition_archived') || `${job.title} archived`, 'success', t('toast_requisition_archived_title') || 'Requisition Archived');
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error || t('toast_archive_failed') || 'Failed to archive requisition', 'error');
      }
    } catch {
      showToast(t('toast_network_archive') || 'Network error archiving requisition', 'error');
    }
  };

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="h-page">{t('jobs_title')}</h1>
            <span className="chip chip-accent">
              {pagination ? pagination.total : jobs.length} {t('active_requisitions_badge')}
            </span>
          </div>
          <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] mt-0.5">
            {t('jobs_subtitle')}
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary self-start sm:self-auto"
          >
            <span aria-hidden="true">+</span>
            <span>{t('btn_create_job')}</span>
          </button>
        )}
      </div>

      {/* Server-side filter bar (§6.2/§9 performance) */}
      {filters && (
        <form
          action="/jobs"
          method="get"
          className="flex flex-wrap items-center gap-2"
        >
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder={isStaff ? t('jobs_search_placeholder') : 'Search open roles by title or keyword...'}
            className="field !w-64"
            aria-label={t('aria_search_requisitions')}
          />
          {isStaff && (
            <select
              name="status"
              defaultValue={filters.status}
              className="field !w-auto font-medium"
              aria-label={t('aria_filter_status')}
            >
              <option value="ALL">{t('filter_all_statuses')}</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          <select
            name="department"
            defaultValue={filters.department}
            className="field !w-auto font-medium"
            aria-label={t('aria_filter_department')}
          >
            <option value="ALL">{t('all_departments')}</option>
            {filters.departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button
            type="submit"
            className="btn btn-primary"
          >
            {t('btn_apply_filters')}
          </button>
          {(filters.q || filters.status !== 'ALL' || filters.department !== 'ALL') && (
            <Link
              href="/jobs"
              className="btn btn-secondary"
            >
              {t('btn_clear')}
            </Link>
          )}
        </form>
      )}

      {/* Requisitions Grid */}
      {jobs.length === 0 ? (
        <div className="panel p-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-ring)] flex items-center justify-center mx-auto text-[var(--accent)]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_60%,transparent)]">{t('no_jobs_found')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const criteriaList = job.rubrics?.[0]?.criteria || [];
            const totalWeight = criteriaList.reduce((sum: number, c: any) => sum + (c.weight || 1), 0);

            return (
              <article
                key={job.id}
                className="panel panel-hover p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {job.organization?.name && (
                        <span className="chip chip-accent">
                          {job.organization.name}
                        </span>
                      )}
                      <span className="chip">{job.department}</span>
                    </div>
                    <span
                      className={`chip shrink-0 ${job.status === 'OPEN'
                          ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                          : job.status === 'DRAFT'
                            ? 'text-amber-600 dark:text-amber-400 border-amber-500/40'
                            : job.status === 'CLOSED'
                              ? 'text-[var(--coral)] border-[color-mix(in_srgb,var(--coral)_40%,transparent)]'
                              : ''
                        }`}
                    >
                      ● {(job.status || 'DRAFT').toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[var(--foreground)] tracking-tight">
                      {job.title}
                    </h3>
                    <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] line-clamp-2 mt-1 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  {criteriaList.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
                        <span>{t('scored_criteria')} ({criteriaList.length})</span>
                        <span className="flex items-center gap-2">
                          {isStaff && (
                            <button
                              onClick={() => openRubricEdit(job)}
                              className="text-[var(--accent)] hover:underline flex items-center gap-0.5"
                            >
                              {t('edit_rubric')}
                            </button>
                          )}
                          <button
                            onClick={() => openRubricPreview(job)}
                            className="text-[var(--accent)] hover:underline flex items-center gap-0.5"
                          >
                            {t('rubric_preview')}
                          </button>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {criteriaList.slice(0, 3).map((crit: any) => (
                          <span key={crit.id} className="chip">
                            {crit.description || crit.name} (w:{crit.weight})
                          </span>
                        ))}
                        {criteriaList.length > 3 && (
                          <span className="text-[9px] font-mono text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] self-center">
                            {t('criteria_more').replace('{count}', String(criteriaList.length - 3))}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
                    {job._count?.applications || job.applications?.length || 0} {t('applicants')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isStaff ? (
                      /* Staff actions: manage requisition, view pipeline candidates, duplicate, publish, close, archive. NO apply buttons. */
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {job.status === 'OPEN' && (
                          <Link
                            href={`/candidates?jobId=${job.id}`}
                            className="btn btn-secondary !px-2 !py-1 !text-[11px]"
                            title="View applicants in pipeline"
                          >
                            {t('pipeline_title') || 'View Candidates'} &rarr;
                          </Link>
                        )}
                        <button
                          onClick={() => handleDuplicateJob(job)}
                          disabled={duplicatingId === job.id}
                          title={t('aria_duplicate_requisition')}
                          className="btn btn-secondary !px-2 !py-1 !text-[11px]"
                        >
                          {duplicatingId === job.id ? t('btn_cloning') : t('btn_copy')}
                        </button>
                        {(job.status === 'DRAFT' || job.status === 'REVIEW') && (
                          <button
                            onClick={() => handlePublishJob(job)}
                            disabled={publishingId === job.id}
                            className="btn btn-primary !px-2.5 !py-1 !text-[11px]"
                          >
                            {publishingId === job.id ? t('btn_publishing') : t('btn_publish')}
                          </button>
                        )}
                        {job.status === 'OPEN' && (
                          <button
                            onClick={() => handleCloseJob(job)}
                            title={t('aria_close_requisition')}
                            className="btn btn-danger !px-2 !py-1 !text-[11px]"
                          >
                            {t('btn_close')}
                          </button>
                        )}
                        {job.status === 'CLOSED' && (
                          <button
                            onClick={() => handleArchiveJob(job)}
                            title="Archive requisition"
                            className="btn btn-secondary !px-2 !py-1 !text-[11px]"
                          >
                            {t('btn_archive') || 'Archive'}
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Candidate & public visitor actions: apply, view applied status */
                      <>
                        {myApplications[job.id] ? (
                          <span className="flex items-center gap-1.5">
                            <span className="chip text-emerald-600 dark:text-emerald-400 border-emerald-500/40" title={`Applied ${new Date(myApplications[job.id].appliedAt).toLocaleDateString()}`}>
                              {t('chip_applied')}
                            </span>
                            {myApplications[job.id].score !== null && (
                              <span className="chip chip-accent" title={t('aria_latest_score')}>
                                {t('chip_match_pct').replace('{score}', String(Math.round(myApplications[job.id].score!)))}
                              </span>
                            )}
                          </span>
                        ) : !isAuthenticated && job.status === 'OPEN' ? (
                          <Link
                            href={`/auth/signin?callbackUrl=${encodeURIComponent(`/jobs/${job.id}/apply`)}`}
                            className="btn btn-primary !px-2.5 !py-1 !text-[11px]"
                          >
                            Sign in to apply &rarr;
                          </Link>
                        ) : job.status === 'OPEN' && hasSavedResume ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleOneClickApply(job)}
                              disabled={applyingJobId === job.id}
                              title={t('aria_apply_instant')}
                              className="btn btn-primary !px-2.5 !py-1 !text-[11px] inline-flex items-center gap-1 shadow-sm font-semibold"
                            >
                              <span>{applyingJobId === job.id ? t('btn_applying') : t('btn_one_click_apply').replace(/^⚡\s*/, '')}</span>
                            </button>
                            <Link
                              href={`/jobs/${job.id}/apply`}
                              className="btn btn-secondary !px-2.5 !py-1 !text-[11px] inline-flex items-center gap-1 hover:border-[var(--accent)] font-medium"
                              title="Apply with a tailored or different resume"
                            >
                              <span>{t('apply_role') || 'Apply with Custom CV'} &rarr;</span>
                            </Link>
                          </div>
                        ) : job.status === 'OPEN' ? (
                          <Link
                            href={`/jobs/${job.id}/apply`}
                            className="btn btn-primary !px-2.5 !py-1 !text-[11px]"
                          >
                            {t('apply_role')} &rarr;
                          </Link>
                        ) : (
                          <span className="chip" aria-disabled="true">{t('status_closed')}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* RUBRIC EDIT MODAL (§6.2: approved rubrics version on change) */}
      {editModalOpen && editingJob && (
        <div className="fixed inset-0 bg-[color-mix(in_srgb,var(--background)_55%,transparent)] backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel p-5 max-w-lg w-full space-y-3.5 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--foreground)]">
                {t('edit_rubric_title').replace('{title}', editingJob.title)}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] hover:text-[var(--foreground)] text-sm leading-none" aria-label={t('aria_close_dialog')}>&times;</button>
            </div>

            {editingJob.rubrics?.[0]?.status === 'APPROVED' && (
              <p className="rounded-md border border-[color-mix(in_srgb,var(--amber)_35%,transparent)] bg-[color-mix(in_srgb,var(--amber)_10%,transparent)] text-[var(--amber)] px-3 py-2 leading-relaxed">
                {t('rubric_approved_warning')}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--foreground)]">{t('criteria_count').replace('{count}', String(editCriteria.length))}</span>
                <button
                  type="button"
                  onClick={() => setEditCriteria([...editCriteria, { category: '', description: '', isRequired: false, weight: 1, threshold: '', evidenceRules: '' }])}
                  className="text-[10px] text-[var(--accent)] hover:underline font-semibold"
                >
                  {t('add_criterion')}
                </button>
              </div>
              {editCriteria.map((crit, idx) => (
                <div key={idx} className="space-y-1.5 rounded-lg border border-[var(--border)] p-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={crit.category}
                      onChange={(e) => handleEditCriteriaChange(idx, 'category', e.target.value)}
                      placeholder={t('criterion_category')}
                      className="field !w-40 !py-1 !px-2.5 !text-[11px]"
                    />
                    <input
                      type="text"
                      value={crit.description}
                      onChange={(e) => handleEditCriteriaChange(idx, 'description', e.target.value)}
                      placeholder={t('criterion_description')}
                      className="flex-1 field !py-1 !px-2.5 !text-[11px]"
                    />
                    <select
                      value={crit.isRequired ? 'REQUIRED' : 'PREFERRED'}
                      onChange={(e) => handleEditCriteriaChange(idx, 'isRequired', e.target.value === 'REQUIRED')}
                      className="field !w-auto !py-1 !px-1.5 !text-[10px] font-mono text-[var(--accent)]"
                    >
                      <option value="REQUIRED">{t('criterion_required')}</option>
                      <option value="PREFERRED">{t('criterion_preferred')}</option>
                    </select>
                    <select
                      value={crit.weight}
                      onChange={(e) => handleEditCriteriaChange(idx, 'weight', Number(e.target.value))}
                      className="field !w-auto !py-1 !px-2 font-mono"
                    >
                      {[1, 2, 3, 4, 5].map((w) => (
                        <option key={w} value={w}>w:{w}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setEditCriteria(editCriteria.filter((_, i) => i !== idx))}
                      className="text-[var(--coral)] hover:opacity-75 p-1 text-sm leading-none" aria-label={t('aria_remove_criterion')}
                    >
                      &times;
                    </button>
                  </div>
                  {/* §6.2: minimum threshold + acceptable evidence per criterion */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={crit.threshold}
                      onChange={(e) => handleEditCriteriaChange(idx, 'threshold', e.target.value)}
                      placeholder={t('criterion_threshold')}
                      className="flex-1 field !py-1 !px-2.5 !text-[11px]"
                    />
                    <input
                      type="text"
                      value={crit.evidenceRules}
                      onChange={(e) => handleEditCriteriaChange(idx, 'evidenceRules', e.target.value)}
                      placeholder={t('criterion_evidence')}
                      className="flex-[2] field !py-1 !px-2.5 !text-[11px]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label htmlFor="edit-change-reason" className="block field-label">
                {editingJob.rubrics?.[0]?.status === 'APPROVED' ? `${t('change_reason_label')} *` : t('change_reason_optional')}
              </label>
              <textarea
                id="edit-change-reason"
                rows={2}
                value={editChangeReason}
                onChange={(e) => setEditChangeReason(e.target.value)}
                placeholder={t('change_reason_placeholder')}
                className="w-full field leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="btn btn-secondary"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={submitRubricEdit}
                disabled={editSubmitting}
                className="btn btn-primary disabled:opacity-60"
              >
                {editSubmitting ? t('loading') : t('save_rubric')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RUBRIC PREVIEW MODAL */}
      {previewModalOpen && previewJob && (
        <div className="fixed inset-0 bg-[color-mix(in_srgb,var(--background)_55%,transparent)] backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel p-5 max-w-lg w-full space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">{t('rubric_preview_title')}</h3>
                <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{previewJob.title} &bull; {previewJob.department}</p>
              </div>
              <button onClick={() => setPreviewModalOpen(false)} className="text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] hover:text-[var(--foreground)] text-sm leading-none" aria-label="Close dialog">&times;</button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3">
                <p className="text-[11px] font-semibold text-[var(--foreground)]">{t('rubric_scoring_formula')}</p>
                <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] mt-0.5">
                  {t('rubric_preview_subtitle')}
                </p>
              </div>

              <div className="space-y-2">
                {(previewJob.rubrics?.[0]?.criteria || []).map((crit: any, idx: number) => (
                  <div
                    key={crit.id || idx}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="text-[9px] font-mono uppercase font-bold text-[var(--accent)]">
                        {crit.category || 'General Criterion'}
                      </span>
                      <p className="text-xs font-semibold text-[var(--foreground)] mt-0.5">
                        {crit.description || crit.name}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="chip chip-accent">
                        {t('create_job_weight_label')}: {crit.weight || 3}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="btn btn-secondary !text-xs"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Server-side pagination (§9 performance) */}
      {pagination && pagination.totalPages > 1 && (
        <PaginationControls pagination={pagination} />
      )}

      {/* CREATE JOB MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[color-mix(in_srgb,var(--background)_55%,transparent)] backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel p-5 max-w-lg w-full space-y-3.5 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--foreground)]">{t('create_job_modal_title')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] hover:text-[var(--foreground)] text-sm leading-none" aria-label={t('aria_close_dialog')}>&times;</button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3">
              <div>
                <label className="block field-label">{t('create_job_title_label')} *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('title_placeholder')}
                  className="w-full field"
                />
              </div>

              <div>
                <label className="block field-label">{t('create_job_dept_label')} *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full field"
                >
                  <option value="Engineering">{t('dept_engineering')}</option>
                  <option value="Product">{t('dept_product')}</option>
                  <option value="Data & AI">{t('dept_data_ai')}</option>
                  <option value="Sales">{t('dept_sales')}</option>
                  <option value="Operations">{t('dept_operations')}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block field-label">{t('location_label')}</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('location_placeholder')}
                    className="w-full field"
                  />
                </div>
                <div>
                  <label className="block field-label">{t('employment_type_label')}</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full field"
                  >
                    <option value="Full-time">{t('employment_full_time')}</option>
                    <option value="Part-time">{t('employment_part_time')}</option>
                    <option value="Contract">{t('employment_contract')}</option>
                    <option value="Internship">{t('employment_internship')}</option>
                  </select>
                </div>
              </div>

              <div>                  <label className="block field-label">{t('closes_at_label')}</label>
                <input
                  type="date"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                  className="w-full field"
                />
              </div>

              <div>
                <label className="block field-label">{t('create_job_desc_label')} *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('desc_placeholder')}
                  className="w-full field leading-relaxed"
                ></textarea>
              </div>

              {/* Rubric Criteria Builder */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--foreground)]">
                    {t('create_job_criteria_heading')} ({criteria.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCriteria}
                    className="text-[10px] text-[var(--accent)] hover:underline font-semibold"
                  >
                    {t('create_job_add_criteria')}
                  </button>
                </div>

                <div className="space-y-1.5">
                  {criteria.map((crit, idx) => (
                    <div key={idx} className="space-y-1.5 rounded-lg border border-[var(--border)] p-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={crit.category}
                          onChange={(e) => handleCriteriaChange(idx, 'category', e.target.value)}
                          placeholder={t('create_job_category_label')}
                          className="w-24 field !py-1 !px-2 !text-[11px] font-mono"
                        />
                        <input
                          type="text"
                          value={crit.description}
                          onChange={(e) => handleCriteriaChange(idx, 'description', e.target.value)}
                          placeholder={t('criterion_example')}
                          className="flex-1 field !py-1 !px-2.5 !text-[11px] text-xs"
                        />
                        <select
                          value={crit.isRequired ? 'REQUIRED' : 'PREFERRED'}
                          onChange={(e) => handleCriteriaChange(idx, 'isRequired', e.target.value === 'REQUIRED')}
                          className="field !w-auto !py-1 !px-1.5 !text-[10px] font-mono text-[var(--accent)]"
                        >
                          <option value="REQUIRED">{t('criterion_required')}</option>
                          <option value="PREFERRED">{t('criterion_preferred')}</option>
                        </select>
                        <select
                          value={crit.weight}
                          onChange={(e) => handleCriteriaChange(idx, 'weight', Number(e.target.value))}
                          className="field !w-auto !py-1 !px-2 font-mono !text-xs"
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
                          className="text-[var(--coral)] hover:opacity-75 p-1 text-xs" aria-label={t('aria_remove_criterion')}
                        >
                          ✕
                        </button>
                      </div>
                      {/* §6.2: minimum threshold + acceptable evidence per criterion */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={crit.threshold}
                          onChange={(e) => handleCriteriaChange(idx, 'threshold', e.target.value)}
                          placeholder={t('criterion_threshold')}
                          className="flex-1 field !py-1 !px-2.5 !text-[11px]"
                        />
                        <input
                          type="text"
                          value={crit.evidenceRules}
                          onChange={(e) => handleCriteriaChange(idx, 'evidenceRules', e.target.value)}
                          placeholder={t('criterion_evidence')}
                          className="flex-[2] field !py-1 !px-2.5 !text-[11px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
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
/**
 * Pagination controls for the jobs board — server-side paging over the
 * filtered requisition set (§9 performance), preserving filter params.
 */
function PaginationControls({ pagination }: { pagination: PaginationInfo }) {
  const current = Object.fromEntries(
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).entries()
      : []
  );
  const go = (page: number) => {
    if (typeof window === 'undefined') return;
    window.location.href = buildPageUrl('/jobs', current, { page });
  };

  return (
    <nav className="flex items-center justify-between gap-2 pt-2" aria-label="Jobs pagination">
      <span className="text-[11px] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
        {((pagination.page - 1) * pagination.pageSize) + 1}–
        {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => go(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className="btn btn-secondary !px-2.5 !py-1 disabled:opacity-40"
        >
          ← Prev
        </button>
        <span className="text-[11px] font-mono text-[color-mix(in_srgb,var(--foreground)_60%,transparent)]">
          {pagination.page} / {pagination.totalPages}
        </span>
        <button
          onClick={() => go(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          className="btn btn-secondary !px-2.5 !py-1 disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </nav>
  );
}
