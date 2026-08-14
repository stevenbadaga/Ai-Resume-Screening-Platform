'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JobApplyPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadJob() {
      try {
        const res = await fetch(`/api/jobs`);
        if (res.ok) {
          const jobs = await res.json();
          const match = jobs.find((j: any) => j.id === jobId);
          setJob(match || null);
        }
      } catch (err) {
        console.error('Failed to load job details', err);
      } finally {
        setLoading(false);
      }
    }
    if (jobId) loadJob();
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      setError('Please upload your resume file (PDF, DOCX, or TXT)');
      return;
    }
    if (!consentGiven) {
      setError('You must agree to the data processing consent to submit');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('jobId', jobId);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('consentGiven', 'true');
      formData.append('resume', resumeFile);

      const res = await fetch('/api/jobs/apply', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Application submission failed');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
        <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center backdrop-blur-xl animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            Thank you, <strong className="text-white">{firstName}</strong>. Your application for{' '}
            <span className="text-indigo-400 font-semibold">{job?.title || 'this position'}</span> has been received.
          </p>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
              Automated AI Pipeline
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our automated AI evaluation worker is currently parsing and scoring your resume criteria against the rubric. You will be contacted regarding next steps.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/jobs"
              className="flex-1 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/30 text-center"
            >
              Explore More Jobs
            </Link>
            <Link
              href="/dashboard/my-applications"
              className="flex-1 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition border border-slate-700 text-center"
            >
              Track Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition mb-6"
        >
          &larr; Back to Job Feed
        </Link>

        {/* Job Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider inline-block mb-3">
            {job?.department || 'Engineering'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{job?.title || 'Open Position'}</h1>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">{job?.description}</p>

          {job?.rubrics?.[0]?.criteria && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Core Requirements Evaluated by AI:
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.rubrics[0].criteria.map((c: any) => (
                  <span
                    key={c.id}
                    className="text-xs bg-slate-800/80 text-slate-300 px-3 py-1 rounded-lg border border-slate-700/60"
                  >
                    • {c.description || c.category} (Weight: {c.weight}/5)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Application Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white mb-6">Submit Your Application</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center gap-3">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Jean-Luc"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Habimana"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Resume Upload Box */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Upload Resume (PDF, DOCX, TXT) *
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center transition bg-slate-950/60 relative">
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setResumeFile(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="pointer-events-none">
                  {resumeFile ? (
                    <div className="flex items-center justify-center gap-3 text-indigo-400">
                      <span className="text-2xl">📄</span>
                      <span className="text-sm font-semibold">{resumeFile.name}</span>
                      <span className="text-xs text-slate-500 font-mono">
                        ({(resumeFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-2">📤</div>
                      <p className="text-sm font-medium text-slate-300">Click or drag & drop your resume file</p>
                      <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, and TXT format up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
              <input
                type="checkbox"
                id="consent"
                required
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
              />
              <label htmlFor="consent" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
                I hereby consent to the automated processing of my resume and application data by RecruitAI in accordance with GDPR/CCPA privacy standards for candidate evaluation.
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-base transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>Submitting Application & Processing AI Screening...</span>
                </>
              ) : (
                <span>Submit In-App Application &rarr;</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}