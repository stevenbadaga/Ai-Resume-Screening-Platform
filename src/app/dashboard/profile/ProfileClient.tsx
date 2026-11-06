'use client';

import { useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface AccountInfo {
  name: string | null;
  email: string;
  role: string;
  organizationName: string | null;
  memberSince: string | null;
  departmentRestrictions: string[];
}

interface CandidateInfo {
  firstName: string;
  lastName: string;
  skills: string | null; // JSON string
  experience: string | null; // JSON string
  profileResumeName: string | null;
  profileResumeSize: number | null;
  profileResumeUploadedAt: string | null;
  consentGiven: boolean;
  consentNoticeVersion: string | null;
  _count: { applications: number };
}

interface Props {
  account: AccountInfo;
  candidate: CandidateInfo | null;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ProfileClient({ account, candidate }: Props) {
  const { t } = useLanguage();
  const isCandidate = account.role === 'Candidate';

  // ── Editable profile state ──
  const [name, setName] = useState(account.name ?? '');
  const initialSkills: string[] = (() => {
    if (!candidate?.skills) return [];
    try {
      const parsed = JSON.parse(candidate.skills);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  })();
  const initialExperience: string = (() => {
    if (!candidate?.experience) return '';
    try {
      const parsed = JSON.parse(candidate.experience);
      return typeof parsed === 'string' ? parsed : '';
    } catch {
      return '';
    }
  })();

  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [skillDraft, setSkillDraft] = useState('');
  const [experience, setExperience] = useState(initialExperience);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // ── Saved CV state ──
  const [savedResume, setSavedResume] = useState<{
    name: string | null;
    size: number | null;
    uploadedAt: string | null;
  }>({
    name: candidate?.profileResumeName ?? null,
    size: candidate?.profileResumeSize ?? null,
    uploadedAt: candidate?.profileResumeUploadedAt ?? null,
  });
  const [cvBusy, setCvBusy] = useState(false);
  const [cvMessage, setCvMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const addSkill = () => {
    const parts = skillDraft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setSkills((prev) => Array.from(new Set([...prev, ...parts])));
    setSkillDraft('');
  };

  const saveProfile = async () => {
    setSaving(true);
    setProfileMessage(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          skills: isCandidate ? skills : undefined,
          experience: isCandidate ? experience : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('profile_save_failed'));
      setProfileMessage({ kind: 'ok', text: t('profile_saved') });
    } catch (err: any) {
      setProfileMessage({ kind: 'err', text: err.message || t('profile_save_failed') });
    } finally {
      setSaving(false);
    }
  };

  const uploadCv = async (file: File) => {
    setCvBusy(true);
    setCvMessage(null);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await fetch('/api/profile/resume', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('profile_cv_save_failed'));
      setSavedResume({
        name: data.savedResume?.name ?? file.name,
        size: data.savedResume?.size ?? file.size,
        uploadedAt: data.savedResume?.uploadedAt ?? new Date().toISOString(),
      });
      setCvMessage({ kind: 'ok', text: t('profile_cv_saved_ok') });
    } catch (err: any) {
      setCvMessage({ kind: 'err', text: err.message || t('profile_cv_save_failed') });
    } finally {
      setCvBusy(false);
      if (cvInputRef.current) cvInputRef.current.value = '';
    }
  };

  const removeCv = async () => {
    setCvBusy(true);
    setCvMessage(null);
    try {
      const res = await fetch('/api/profile/resume', { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('profile_cv_remove_failed'));
      setSavedResume({ name: null, size: null, uploadedAt: null });
      setCvMessage({ kind: 'ok', text: t('profile_cv_removed_ok') });
    } catch (err: any) {
      setCvMessage({ kind: 'err', text: err.message || t('profile_cv_remove_failed') });
    } finally {
      setCvBusy(false);
    }
  };

  const initials = (account.name || account.email)
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Personalized Header */}
      <div className="pb-3 border-b border-[var(--border)]">
        <p className="eyebrow mb-1">{isCandidate ? t('profile_workspace_candidate') : t('profile_workspace_account')}</p>
        <h1 className="h-page">{t('profile_title')}</h1>
        {/* Personalized greeting for candidates */}
        {isCandidate && candidate?.firstName && (
          <p className="text-xs text-[color-mix(in_srgb,var(--accent)_70%,transparent)] mt-0.5">
            {candidate.firstName.split(' ')[0] ? t('profile_personalized_greeting').replace('{firstName}', candidate.firstName.split(' ')[0]) : t('profile_personalized_greeting').replace('{firstName}', candidate.firstName)}
          </p>
        )}
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] mt-1">
          {t('profile_subtitle')}
        </p>
      </div>

      {/* Identity card */}
      <section className="panel p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="brand-mark w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-extrabold shrink-0">
            {initials}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <label htmlFor="profile-name" className="field-label">{t('profile_display_name')}</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('profile_name_placeholder')}
                className="field"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="chip chip-accent">{account.role}</span>
              {account.organizationName && <span className="chip">{account.organizationName}</span>}
              <span className="text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] font-mono">
                {account.email}
              </span>
              {account.memberSince && (
                <span className="text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">
                  · {t('profile_member_since').replace('{date}', new Date(account.memberSince).toLocaleDateString())}
                </span>
              )}
            </div>
            {account.departmentRestrictions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_50%,transparent)]">
                  {t('profile_department_access')}
                </span>
                {account.departmentRestrictions.map((d) => (
                  <span key={d} className="chip">{d}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {isCandidate && (
        <>
          {/* Saved CV — powers one-click applications */}
          <section className="panel p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--foreground)]">
                  {t('profile_saved_cv')}
                </h2>
                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] mt-0.5">
                  {t('profile_one_click_hint')}
                </p>
              </div>
              {candidate && (
                <div className="flex items-center gap-2">
                  <span className="chip">{t('profile_applications_count').replace('{count}', String(candidate._count.applications))}</span>
                  {/* Personalized profile completeness indicator */}
                  {(!savedResume.name || skills.length === 0) && (
                    <span className="chip chip-warning" title={t('profile_completion_hint')}>
                      {t('profile_completion_status').replace('{completed}', String([!!savedResume.name, skills.length > 0].filter(Boolean).length)).replace('{total}', '2')}
                    </span>
                  )}
                </div>
              )}
            </div>

            {savedResume.name ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[var(--accent-soft)] p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl" aria-hidden="true">📄</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--foreground)] truncate">{savedResume.name}</p>
                    <p className="text-[11px] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] font-mono">
                      {formatBytes(savedResume.size)}
                      {savedResume.uploadedAt ? ` · ${t('profile_cv_saved_on').replace('{date}', new Date(savedResume.uploadedAt).toLocaleDateString())}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cvInputRef.current?.click()}
                    disabled={cvBusy}
                    className="btn btn-secondary !text-[11px]"
                  >
                    {t('profile_replace_cv')}
                  </button>
                  <button
                    type="button"
                    onClick={removeCv}
                    disabled={cvBusy}
                    className="btn btn-danger !text-[11px]"
                  >
                    {t('profile_remove_cv')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => cvInputRef.current?.click()}
                disabled={cvBusy}
                className="w-full rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] p-6 text-center transition cursor-pointer"
              >
                <span className="text-2xl block" aria-hidden="true">📄</span>
                <p className="text-xs font-bold text-[var(--foreground)] mt-1.5">
                  {t('profile_upload_cv')}
                </p>
                <p className="text-[11px] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
                  {t('profile_no_cv')}
                </p>
                <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] mt-0.5 font-mono">
                  {t('profile_file_hint')}
                </p>
              </button>
            )}

            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="sr-only"
              aria-label={t('aria_upload_cv')}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadCv(f);
              }}
            />

            {cvBusy && (
              <p className="text-xs text-[var(--accent)] font-semibold" aria-live="polite">
                {t('loading')}
              </p>
            )}
            {cvMessage && (
              <p
                role="status"
                className={`text-xs font-semibold ${cvMessage.kind === 'ok' ? 'text-[var(--accent)]' : 'text-[var(--coral)]'}`}
              >
                {cvMessage.text}
              </p>
            )}
          </section>

          {/* Skills & experience */}
          <section className="panel p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold text-[var(--foreground)]">{t('profile_about_you')}</h2>

            <div>
              <label htmlFor="profile-skills" className="field-label">
                {t('profile_skills')}
              </label>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {skills.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSkills(skills.filter((x) => x !== s))}
                      className="chip chip-accent cursor-pointer hover:opacity-80"
                      title={t('profile_skill_remove_hint')}
                    >
                      {s} ×
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  id="profile-skills"
                  type="text"
                  value={skillDraft}
                  onChange={(e) => setSkillDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder={t('profile_skill_placeholder')}
                  className="field"
                />
                <button type="button" onClick={addSkill} className="btn btn-secondary shrink-0">
                  {t('profile_add')}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="profile-experience" className="field-label">
                {t('profile_experience')}
              </label>
              <textarea
                id="profile-experience"
                rows={4}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder={t('profile_experience_placeholder')}
                className="field leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              {profileMessage && (
                <span
                  role="status"
                  className={`text-xs font-semibold mr-auto ${profileMessage.kind === 'ok' ? 'text-[var(--accent)]' : 'text-[var(--coral)]'}`}
                >
                  {profileMessage.text}
                </span>
              )}
              <button type="button" onClick={saveProfile} disabled={saving} className="btn btn-primary">
                {saving ? t('profile_saving') : t('profile_save')}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
