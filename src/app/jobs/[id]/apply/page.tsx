'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function ApplyJobPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [consentGiven, setConsentGiven] = useState(true);

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

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs`);
        if (res.ok) {
          const jobs = await res.json();
          const target = jobs.find((j: any) => j.id === params.id);
          setJob(target || jobs[0]);
        }
      } catch (err) {
        console.error('Failed to load job', err);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      setError('Please attach your CV / Resume document.');
      return;
    }
    if (!consentGiven) {
      setError('Please provide GDPR consent for automated AI screening.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('jobId', (job?.id || params.id) as string);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('resume', resumeFile);

      const res = await fetch('/api/applications/apply', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
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

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-8">
      <div>
        <Link
          href="/jobs"
          className="text-xs text-slate-400 hover:text-white font-bold transition flex items-center gap-1.5 mb-2"
        >
          &larr; {t('nav_jobs') || 'Back to Job Requisitions'}
        </Link>
      </div>

      <div className="dark:bg-slate-900/60 bg-white dark:border-slate-800/80 border-slate-200/90 border rounded-3xl p-6 sm:p-10 shadow-xs space-y-6 backdrop-blur-xl">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold dark:bg-indigo-950/80 bg-blue-50 dark:text-indigo-300 text-blue-700 border dark:border-indigo-800/80 border-blue-200">
            OFFICIAL APPLICATION
          </span>
          <h1 className="text-2xl font-extrabold dark:text-white text-slate-900 tracking-tight mt-2">
            {t('apply_role') || 'Apply for'}: {job?.title || 'Open Position'}
          </h1>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-1">
            {job?.department || 'Engineering'} &bull; Workspace Application
          </p>
        </div>

        {/* If user is an internal staff employee */}
        {isInternalStaff ? (
          <div className="p-6 dark:bg-slate-950/80 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-2xl space-y-4 text-center">
            <span className="text-3xl block">🏢</span>
            <h2 className="text-sm font-bold dark:text-white text-slate-900">
              Logged in as Hiring Team Member ({userRole})
            </h2>
            <p className="text-xs dark:text-slate-400 text-slate-500 max-w-md mx-auto leading-relaxed">
              You are currently authenticated as an internal employee. Internal hiring staff review candidate applications rather than applying for open requisitions.
            </p>
            <div className="pt-2 flex items-center justify-center">
              <Link
                href="/candidates"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-500/20"
              >
                {t('pipeline_title') || 'Review Applicant Pipeline'} &rarr;
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="p-6 dark:bg-emerald-950/80 bg-emerald-50 dark:border-emerald-800 border-emerald-200 border rounded-2xl text-emerald-300 text-center space-y-2">
            <span className="text-3xl block">✨</span>
            <h2 className="text-base font-bold dark:text-white text-slate-900">{t('success') || 'Application Submitted Successfully!'}</h2>
            <p className="text-xs text-emerald-600 dark:text-emerald-300">
              Redirecting to your candidate tracking portal...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs dark:text-slate-300 text-slate-700">
            {error && (
              <div className="p-3 dark:bg-rose-950/80 bg-rose-50 dark:border-rose-800 border-rose-200 border rounded-xl text-rose-600 dark:text-rose-300 font-bold">
                ⚠️ {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block dark:text-slate-400 text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                  {t('first_name') || 'First Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean-Luc"
                  className="w-full dark:bg-slate-950/80 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-xl px-4 py-2.5 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block dark:text-slate-400 text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                  {t('last_name') || 'Last Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Habimana"
                  className="w-full dark:bg-slate-950/80 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-xl px-4 py-2.5 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block dark:text-slate-400 text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                  {t('email_addr') || 'Email Address'} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jeanluc@example.com"
                  className="w-full dark:bg-slate-950/80 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-xl px-4 py-2.5 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block dark:text-slate-400 text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                  {t('phone_number') || 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+250 788 123 456"
                  className="w-full dark:bg-slate-950/80 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-xl px-4 py-2.5 dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Resume Upload Dropzone */}
            <div>
              <label className="block dark:text-slate-400 text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                {t('upload_resume') || 'Resume Document (PDF, DOCX, TXT)'} *
              </label>
              <div className="border-2 border-dashed dark:border-slate-800 border-slate-200 hover:border-indigo-500 dark:bg-slate-950/80 bg-slate-50 rounded-2xl p-6 text-center cursor-pointer transition">
                <input
                  type="file"
                  id="resumeFile"
                  accept=".pdf,.docx,.txt"
                  required
                  onChange={(e) => {
                    if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
                  }}
                  className="hidden"
                />
                <label htmlFor="resumeFile" className="cursor-pointer block space-y-2">
                  <span className="text-3xl block">📄</span>
                  <p className="text-xs font-bold dark:text-slate-200 text-slate-700">
                    {resumeFile ? resumeFile.name : 'Click to select or drag and drop your CV file'}
                  </p>
                  <p className="text-[11px] text-slate-500">PDF, DOCX, TXT (Max 10MB)</p>
                </label>
              </div>
            </div>

            {/* GDPR Consent */}
            <div className="flex items-start gap-2.5 pt-2">
              <input
                type="checkbox"
                id="consent"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="consent" className="dark:text-slate-400 text-slate-500 text-[11px] leading-relaxed cursor-pointer">
                {t('gdpr_consent') || 'I agree to allow processing of my resume under GDPR data privacy policies.'}
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              <span>{submitting ? (t('loading') || 'Submitting...') : (t('submit_application') || 'Submit Application')}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}