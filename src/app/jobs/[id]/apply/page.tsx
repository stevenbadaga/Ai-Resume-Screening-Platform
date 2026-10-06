'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface JobInfo {
  id: string;
  title: string;
  department: string;
  location?: string | null;
  employmentType?: string | null;
  description?: string | null;
  organization?: { name: string } | null;
}

export default function ApplyJobPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();

  const [job, setJob] = useState<JobInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobMissing, setJobMissing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [consentGiven, setConsentGiven] = useState(true);
  // Saved CV (one-click apply): offered when the candidate has a CV on their
  // profile — the application then reuses it instead of a per-form upload.
  const [savedResume, setSavedResume] = useState<{ name: string; size: number | null } | null>(null);
  const [useSavedCv, setUseSavedCv] = useState(false);

  const userRole = (session?.user as any)?.role || 'Candidate';
  const isInternalStaff = ['Admin', 'Recruiter', 'HiringManager', 'Interviewer', 'ComplianceAuditor', 'Auditor'].includes(userRole);

  useEffect(() => {
    if (session?.user) {
      if (session.user.name) {
        const parts = session.user.name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
      if (session.user.email) {
        setEmail(session.user.email);
      }
    }
  }, [session]);

  // Load the candidate's saved CV (if any) so the form can offer one-click
  // submission straight from their profile.
  useEffect(() => {
    async function fetchSavedResume() {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) return;
        const data = await res.json();
        const saved = data?.profile?.candidate?.savedResume;
        if (saved?.name) {
          setSavedResume({ name: saved.name, size: saved.size ?? null });
          setUseSavedCv(true);
        }
      } catch {
        // Profile fetch is best-effort; the form still works without it.
      }
    }
    if ((session?.user as any)?.role === 'Candidate') fetchSavedResume();
  }, [session]);

  // Fetch the exact requisition from the URL — never guess from a list, so a
  // stale link can't silently submit to a different job than the one shown.
  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${params?.id}`);
        if (!res.ok) {
          setJobMissing(true);
          return;
        }
        const data = await res.json();
        setJob(data.job || null);
      } catch (err) {
        console.error('Failed to load job', err);
        setJobMissing(true);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [params?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const usingSavedCv = useSavedCv && Boolean(savedResume);
    if (!usingSavedCv && !resumeFile) {
      setError(t('apply_error_no_cv'));
      return;
    }
    if (!consentGiven) {
      setError(t('apply_error_no_consent'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('jobId', (job?.id || params?.id) as string);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('consentGiven', String(consentGiven));
      formData.append('consentToDataProcessing', String(consentGiven));
      if (usingSavedCv) {
        formData.append('useProfileResume', 'true');
      } else {
        formData.append('resume', resumeFile!);
      }

      const res = await fetch('/api/jobs/apply', {
        method: 'POST',
        body: formData
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/my-applications');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setResumeFile(dropped);
  }, []);

  const breadcrumb = (
    <Link
      href="/jobs"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] hover:text-[var(--accent)] transition"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {t('nav_jobs') || 'Back to Job Requisitions'}
    </Link>
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10 space-y-4" aria-busy="true" aria-live="polite">
        {breadcrumb}
        <div className="panel p-8 space-y-3">
          <div className="h-4 w-1/3 rounded bg-[var(--accent-soft)] animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-[var(--accent-soft)] animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-[var(--accent-soft)] animate-pulse" />
        </div>
      </div>
    );
  }

  if (jobMissing || !job) {
    return (
      <div className="max-w-2xl mx-auto py-10 space-y-4">
        {breadcrumb}
        <div className="panel p-10 text-center space-y-3">
          <span className="text-3xl block" aria-hidden="true">🧭</span>
          <h1 className="h-page">{t('apply_job_missing_title')}</h1>
          <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] max-w-md mx-auto leading-relaxed">
            {t('apply_job_missing_desc')}
          </p>
          <div className="pt-2">
            <Link href="/jobs" className="btn btn-primary">{t('apply_browse_open')}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-5">
      {breadcrumb}

      <div className="panel p-6 sm:p-9 space-y-6">
        <div className="space-y-2">
          <span className="chip chip-accent">{t('apply_official_badge')}</span>
          <h1 className="h-page leading-snug">
            {t('apply_role')}: {job.title}
          </h1>
          <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] font-mono">
            {job.department}
            {job.location ? ` · ${job.location}` : ''}
            {job.employmentType ? ` · ${job.employmentType}` : ''}
            {job.organization?.name ? ` · ${job.organization.name}` : ''}
          </p>
          {job.description && (
            <p className="text-xs leading-relaxed text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] pt-1 line-clamp-4">
              {job.description}
            </p>
          )}
        </div>

        {/* Internal staff see guidance instead of the application form */}
        {isInternalStaff ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-6 space-y-3 text-center">
            <span className="text-3xl block" aria-hidden="true">🏢</span>
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              {t('apply_staff_title')} ({userRole})
            </h2>
            <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] max-w-md mx-auto leading-relaxed">
              {t('apply_staff_desc')}
            </p>
            <div className="pt-2">
              <Link href="/candidates" className="btn btn-primary">
                {t('pipeline_title')} &rarr;
              </Link>
            </div>
          </div>
        ) : success ? (
          <div
            role="status"
            className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[var(--accent-soft)] p-6 text-center space-y-2"
          >
            <span className="text-3xl block" aria-hidden="true">✨</span>
            <h2 className="text-base font-bold text-[var(--foreground)]">
              {t('success')}
            </h2>
            <p className="text-xs text-[var(--accent)]">
              {t('apply_redirecting')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-[color-mix(in_srgb,var(--coral)_40%,transparent)] bg-[color-mix(in_srgb,var(--coral)_10%,transparent)] p-3.5 text-xs font-semibold text-[var(--coral)] leading-relaxed"
              >
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="field-label">
                  {t('first_name')} <span aria-hidden="true">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean-Luc"
                  className="field"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="field-label">
                  {t('last_name')} <span aria-hidden="true">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Habimana"
                  className="field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="field-label">
                  {t('email_addr')} <span aria-hidden="true">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jeanluc@example.com"
                  className="field"
                />
              </div>

              <div>
                <label htmlFor="phone" className="field-label">
                  {t('phone_number')}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+250 788 123 456"
                  className="field"
                />
              </div>
            </div>

            {/* Resume source: saved CV or fresh upload */}
            {savedResume && (
              <fieldset className="space-y-2">
                <legend className="field-label">{t('apply_cv_document')}</legend>
                <label className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition ${
                  useSavedCv ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] hover:border-[var(--accent)]'
                }`}>
                  <input
                    type="radio"
                    name="cv-source"
                    checked={useSavedCv}
                    onChange={() => setUseSavedCv(true)}
                    className="w-4 h-4 accent-[var(--accent)]"
                  />
                  <span className="text-xl" aria-hidden="true">📄</span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-[var(--foreground)] truncate">
                      {t('apply_use_saved_cv')} — {savedResume.name}
                    </span>
                    <span className="block text-[11px] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
                      {t('apply_from_profile')}
                    </span>
                  </span>
                </label>
                <label className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition ${
                  !useSavedCv ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] hover:border-[var(--accent)]'
                }`}>
                  <input
                    type="radio"
                    name="cv-source"
                    checked={!useSavedCv}
                    onChange={() => setUseSavedCv(false)}
                    className="w-4 h-4 accent-[var(--accent)]"
                  />
                  <span className="text-xl" aria-hidden="true">📎</span>
                  <span className="text-xs font-bold text-[var(--foreground)]">
                    {t('apply_upload_different')}
                  </span>
                </label>
              </fieldset>
            )}

            {/* Resume upload — click or drag-and-drop (hidden when using saved CV) */}
            {!useSavedCv && (
            <div>
              <span className="field-label" id="resume-label">
                {t('upload_resume')} <span aria-hidden="true">*</span>
              </span>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
                  dragOver
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border)] hover:border-[var(--accent)]'
                }`}
              >
                <input
                  type="file"
                  id="resumeFile"
                  name="resume"
                  accept=".pdf,.docx,.txt,.md"
                  required={!useSavedCv}
                  onChange={(e) => {
                    if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
                  }}
                  className="sr-only"
                  aria-labelledby="resume-label"
                />
                <label
                  htmlFor="resumeFile"
                  className="cursor-pointer block space-y-1.5"
                >
                  <span className="text-2xl block" aria-hidden="true">📄</span>
                  <p className="text-xs font-bold text-[var(--foreground)]">
                    {resumeFile
                      ? resumeFile.name
                      : t('apply_click_or_drop')}
                  </p>
                  {resumeFile && (
                    <p className="text-[11px] text-[var(--accent)] font-mono">
                      {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                  {!resumeFile && (
                    <p className="text-[11px] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
                      {t('apply_file_hint')}
                    </p>
                  )}
                </label>
              </div>
            </div>
            )}

            {/* GDPR consent */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="consent"
                name="consent"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[var(--accent)]"
              />
              <label
                htmlFor="consent"
                className="text-[11px] leading-relaxed text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] cursor-pointer"
              >
                {t('gdpr_consent')}
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full !py-3"
            >
              {submitting
                ? t('loading')
                : t('submit_application')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
