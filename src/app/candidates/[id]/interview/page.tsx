'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function ScheduleInterviewPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const appId = params?.id as string;

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scheduledAt, setScheduledAt] = useState('2026-08-25T10:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [meetingType, setMeetingType] = useState('Google Meet');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadApp() {
      try {
        const res = await fetch(`/api/candidates/${appId}/interview`);
        if (res.ok) {
          const data = await res.json();
          setApplication(data.application || null);
        }
      } catch (err) {
        console.error('Failed to load application', err);
      } finally {
        setLoading(false);
      }
    }
    if (appId) loadApp();
  }, [appId]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/candidates/${appId}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt,
          durationMinutes: Number(durationMinutes),
          meetingType
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/candidates/${appId}`);
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || t('interview_error'));
      }
    } catch (err: any) {
      setError(err.message || t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-8">
      <div>
        <Link
          href={`/candidates/${appId}`}
          className="text-xs text-slate-400 hover:text-white font-bold transition flex items-center gap-1.5 mb-2"
        >
          &larr; {t('interview_back')}
        </Link>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6 backdrop-blur-xl">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
            {t('interview_badge')}
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-2">
            {t('interview_title')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('interview_subtitle')}
          </p>
        </div>

        {success ? (
          <div className="p-6 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-2xl text-center space-y-2">
            <span className="text-3xl block">📅</span>
            <h2 className="text-base font-bold text-white">{t('interview_success_title')}</h2>
            <p className="text-xs text-emerald-300">
              {t('interview_success_desc')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSchedule} className="space-y-4 text-xs text-slate-300">
            {error && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 font-bold">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                {t('interview_datetime')}
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                  {t('interview_duration')}
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value={30}>{t('interview_30')}</option>
                  <option value={45}>{t('interview_45')}</option>
                  <option value={60}>{t('interview_60')}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                  {t('interview_platform')}
                </label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="Google Meet">{t('interview_google_meet')}</option>
                  <option value="Zoom">{t('interview_zoom')}</option>
                  <option value="In-Person">{t('interview_in_person')}</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              <span>📅</span>
              <span>{submitting ? t('interview_submitting') : t('interview_submit')}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}