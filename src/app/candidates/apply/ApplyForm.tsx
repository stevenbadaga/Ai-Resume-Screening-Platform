/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function ApplyForm({ jobs }: { jobs: { id: string, title: string }[] }) {
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setStatus({ text: t('apply_legacy_status_uploading'), error: false });

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('apply_legacy_upload_failed'));
      }

      setStatus({ text: t('apply_legacy_status_success'), error: false });
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setStatus({ text: err.message || t('apply_legacy_upload_failed'), error: true });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <h1 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{t('apply_legacy_title')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        {t('apply_legacy_desc')}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('apply_legacy_select')}</label>
          <select name="jobId" className="input-field" required>
            <option value="">{t('apply_legacy_choose')}</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('apply_legacy_first_name')}</label>
          <input name="firstName" className="input-field" required placeholder="Jane" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('apply_legacy_last_name')}</label>
          <input name="lastName" className="input-field" required placeholder="Doe" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('apply_legacy_email')}</label>
          <input name="email" type="email" className="input-field" required placeholder="jane.doe@example.com" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('apply_legacy_resume')}</label>
          <input name="resume" type="file" accept=".pdf,.docx" className="input-field" required style={{ padding: '0.5rem' }} />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <input name="consent" type="checkbox" required />
          {t('apply_legacy_consent')}
        </label>

        <button type="submit" className="btn-primary" disabled={isUploading || jobs.length === 0} style={{ marginTop: '1rem' }}>
          {isUploading ? t('apply_legacy_uploading') : t('apply_legacy_title')}
        </button>
      </form>

      {status && (
        <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: status.error ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: status.error ? 'var(--accent)' : 'var(--secondary)' }}>
          {status.text}
        </div>
      )}
    </>
  );
}
