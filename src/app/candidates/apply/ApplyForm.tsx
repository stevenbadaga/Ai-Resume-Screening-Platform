/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function ApplyForm({ jobs, candidateProfile }: { jobs: { id: string, title: string }[]; candidateProfile?: { firstName?: string; lastName?: string; email?: string; phone?: string; savedCv?: { name: string; size: number; uploadedAt: string } | null } | null }) {
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);
  const [usingSavedCv, setUsingSavedCv] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Personalization: pre-fill form with saved profile data for returning applicants
  const prefillFirstName = candidateProfile?.firstName || '';
  const prefillLastName = candidateProfile?.lastName || '';
  const prefillEmail = candidateProfile?.email || '';
  const prefillPhone = candidateProfile?.phone || '';
  const savedCv = candidateProfile?.savedCv;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    // Pre-flight check file size: 5MB limit (§6.4)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File exceeds 5MB limit. Please upload a smaller PDF or DOCX resume.');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }
    // Pre-flight check format
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      setFileError('Invalid file format. Only .pdf and .docx resumes are supported.');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    if (usingSavedCv) setUsingSavedCv(false);
  };

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
      {/* Personalized header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>
          {prefillEmail ? t('apply_personalized_title') : t('apply_legacy_title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {prefillEmail ? t('apply_personalized_desc') : t('apply_legacy_desc')}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('apply_legacy_select')}</label>
          <select name="jobId" className="input-field" required>
            <option value="">{t('apply_legacy_choose')}</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
        </div>

        {/* Personalized name fields with pre-filled values */}
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('apply_legacy_first_name')}</label>
            <input 
              name="firstName" 
              className="input-field" 
              required 
              placeholder="Jane" 
              defaultValue={prefillFirstName}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('apply_legacy_last_name')}</label>
            <input 
              name="lastName" 
              className="input-field" 
              required 
              placeholder="Doe" 
              defaultValue={prefillLastName}
            />
          </div>
        </div>

        {/* Personalized email with pre-fill */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('apply_legacy_email')}</label>
          <input 
            name="email" 
            type="email" 
            className="input-field" 
            required 
            placeholder="jane.doe@example.com" 
            defaultValue={prefillEmail}
          />
          {prefillEmail && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {t('apply_personalized_email_note')}
            </p>
          )}
        </div>

        {/* Phone number */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('profile_phone_number')}</label>
          <input 
            name="phone" 
            type="tel" 
            className="input-field" 
            placeholder={t('profile_phone_placeholder')} 
            defaultValue={prefillPhone}
          />
        </div>

        {/* Resume upload with option to use saved CV or upload new */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('apply_legacy_resume')}</label>
          <div style={{ border: '2px dashed var(--border)', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--surface-muted)', transition: 'border-color 0.2s' }}>
            {savedCv ? (
              <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: usingSavedCv ? '2px solid var(--accent)' : '1px solid var(--border)', backgroundColor: usingSavedCv ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--surface)', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="cvChoice" 
                    checked={usingSavedCv} 
                    onChange={() => { setUsingSavedCv(true); setSelectedFile(null); }} 
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem' }}>
                      {t('apply_use_saved_cv')?.replace(/^⚡\s*/, '') || 'Use saved profile CV'} ({savedCv.name})
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t('apply_personalized_saved_cv') || 'Apply instantly with the CV already saved on your candidate profile'}
                    </span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: !usingSavedCv ? '2px solid var(--accent)' : '1px solid var(--border)', backgroundColor: !usingSavedCv ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--surface)', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="cvChoice" 
                    checked={!usingSavedCv} 
                    onChange={() => setUsingSavedCv(false)} 
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem' }}>
                      {t('apply_upload_different')?.replace(/^📄\s*/, '') || 'Upload a custom/tailored resume for this role'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Choose a new PDF or DOCX file to submit specifically for this position
                    </span>
                  </div>
                </label>

                {usingSavedCv && (
                  <input type="hidden" name="useProfileResume" value="true" />
                )}
              </div>
            ) : null}

            {!usingSavedCv && (
              <div>
                <input 
                  name="resume" 
                  type="file" 
                  accept=".pdf,.docx" 
                  onChange={handleFileChange}
                  className="input-field" 
                  style={{ padding: '0.5rem' }}
                  required={!usingSavedCv}
                />
                {fileError && (
                  <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {fileError}
                  </p>
                )}
                {selectedFile && !fileError && (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-between">
                    <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                    <span className="font-mono text-[11px] uppercase tracking-wider">Verified</span>
                  </div>
                )}
              </div>
            )}
            
            {savedCv && usingSavedCv && (
              <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '0.5rem', fontWeight: 600 }}>
                Ready to submit using saved CV: <strong>{savedCv.name}</strong>
              </p>
            )}
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <input name="consent" type="checkbox" required />
          {t('apply_legacy_consent')}
        </label>

        <button type="submit" className="btn-primary" disabled={isUploading || jobs.length === 0} style={{ marginTop: '0.5rem' }}>
          {isUploading ? t('apply_legacy_uploading') : t('submit_application')}
        </button>
      </form>

      {status && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: status.error ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: status.error ? 'var(--accent)' : 'var(--secondary)' }}>
          {status.text}
        </div>
      )}
    </>
  );
}
