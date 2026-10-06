'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface TeamClientProps {
  initialUsers: any[];
  verifiedDomain: string | null;
  pendingDomain: string | null;
  pendingHost: string | null;
  pendingTxtRecord: string | null;
}

export default function TeamClient({ initialUsers, verifiedDomain, pendingDomain, pendingHost, pendingTxtRecord }: TeamClientProps) {
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<'staff' | 'candidates'>('staff');

  // Domain claiming state (workspace identity = verified email domain)
  const [claimDomain, setClaimDomain] = useState('');
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimRecord, setClaimRecord] = useState<{ host: string; txt: string } | null>(
    pendingHost && pendingTxtRecord ? { host: pendingHost, txt: pendingTxtRecord } : null
  );
  const [claimMessage, setClaimMessage] = useState('');

  const handleStartClaim = async () => {
    if (!claimDomain.trim() || claimBusy) return;
    setClaimBusy(true);
    setClaimMessage('');
    try {
      const res = await fetch('/api/org/domain-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: claimDomain.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClaimRecord({ host: data.host, txt: data.txtRecord });
        setClaimMessage(data.alreadyVerified ? t('team_domain_already') : data.instructions);
      } else {
        setClaimMessage(data.error || t('team_domain_claim_failed'));
      }
    } catch {
      setClaimMessage(t('team_domain_network'));
    } finally {
      setClaimBusy(false);
    }
  };

  const handleVerifyClaim = async () => {
    if (claimBusy) return;
    setClaimBusy(true);
    setClaimMessage('');
    try {
      const res = await fetch('/api/org/domain-claim/verify', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.verified) {
        setClaimRecord(null);
        setClaimMessage(data.message);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setClaimMessage(data.message || data.error || t('team_verify_failed'));
      }
    } catch {
      setClaimMessage(t('team_verify_network'));
    } finally {
      setClaimBusy(false);
    }
  };

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('Recruiter');
  const [savingRole, setSavingRole] = useState(false);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Recruiter');
  const [inviting, setInviting] = useState(false);

  const { showToast } = useToast();
  const { t } = useLanguage();

  // Strict Segregation: Separate internal workers from external candidates
  const staffMembers = users.filter((u) => {
    const role = u.roles?.[0]?.name;
    return role && role !== 'Candidate';
  });

  const candidateAccounts = users.filter((u) => {
    const role = u.roles?.[0]?.name;
    return !role || role === 'Candidate';
  });

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setSelectedRole(user.roles?.[0]?.name || 'Candidate');
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSavingRole(true);
    try {
      const res = await fetch('/api/team/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          newRole: selectedRole
        })
      });

      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? { ...u, roles: [{ ...u.roles?.[0], name: selectedRole }] }
              : u
          )
        );
        setEditingUser(null);
        showToast(
          t('toast_role_updated').replace('{name}', editingUser.name || editingUser.email).replace('{role}', selectedRole),
          'success',
          t('toast_role_updated_title')
        );
      } else {
        showToast(data.error || t('toast_role_failed'), 'error');
      }
    } catch {
      showToast(t('toast_role_network'), 'error');
    } finally {
      setSavingRole(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          roleName: inviteRole
        })
      });

      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => [
          ...prev,
          {
            id: 'invited-' + Date.now(),
            name: inviteName || 'Invited Staff Member',
            email: inviteEmail,
            roles: [{ name: inviteRole, permissions: ['INVITED'] }]
          }
        ]);
        setShowInviteModal(false);
        setInviteName('');
        setInviteEmail('');
        showToast(t('toast_invited').replace('{email}', inviteEmail), 'success', t('toast_invited_title'));
      } else {
        showToast(data.error || t('toast_invite_failed'), 'error');
      }
    } catch {
      showToast(t('toast_invite_network'), 'error');
    } finally {
      setInviting(false);
    }
  };

  const displayedUsers = activeTab === 'staff' ? staffMembers : candidateAccounts;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b dark:border-slate-800/80 border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              {t('nav_team')}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-teal-950/60 bg-teal-50 dark:text-teal-300 text-teal-800 border dark:border-teal-800/50 border-teal-200">
              {t('team_accounts_badge').replace('{count}', String(users.length))}
            </span>
          </div>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            {t('team_subtitle') || t('team_notice_staff')}
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1 shadow-xs self-start sm:self-auto"
        >
          <span>+</span>
          <span>{t('btn_invite_member')}</span>
        </button>
      </div>

      {/* Workspace Identity — Domain Claiming */}
      <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold dark:text-white text-slate-900">{t('team_domain_title')}</h2>
            <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5">
              {t('team_domain_desc')}
            </p>
          </div>
          {verifiedDomain ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap">
              {t('team_domain_verified').replace('{domain}', verifiedDomain)}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 whitespace-nowrap">
              {t('team_domain_not_verified')}
            </span>
          )}
        </div>

        {!verifiedDomain && (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={claimDomain}
              onChange={(e) => setClaimDomain(e.target.value)}
              placeholder={t('team_domain_placeholder')}
              className="flex-1 dark:bg-slate-950 bg-white dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 text-xs dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={handleStartClaim}
              disabled={claimBusy || !claimDomain.trim()}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition whitespace-nowrap"
            >
              {claimBusy ? t('team_btn_working') : t('team_btn_start_verification')}
            </button>
          </div>
        )}

        {claimRecord && (
          <div className="p-3 rounded-lg dark:bg-slate-950/70 bg-slate-50 dark:border-slate-800 border-slate-200 border space-y-1.5">
            <p className="text-[10px] font-mono dark:text-slate-300 text-slate-700">
              {t('team_dns_step')}
            </p>
            <p className="text-[11px] font-mono font-bold dark:text-teal-300 text-teal-700 break-all">{claimRecord.host}</p>
            <p className="text-[11px] font-mono font-bold dark:text-teal-300 text-teal-700 break-all">{claimRecord.txt}</p>
            <button
              onClick={handleVerifyClaim}
              disabled={claimBusy}
              className="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition"
            >
              {claimBusy ? t('team_btn_checking_dns') : t('team_btn_verify_now')}
            </button>
          </div>
        )}

        {claimMessage && (
          <p className="text-[11px] dark:text-slate-400 text-slate-500">{claimMessage}</p>
        )}
      </div>

      {/* Segregation Tabs */}
      <div className="flex items-center gap-2 border-b dark:border-[#30424A] border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-2.5 px-3 flex items-center gap-2 transition border-b-2 ${
            activeTab === 'staff'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent dark:text-slate-400 text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🏢 {t('tab_internal_staff')}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono dark:bg-teal-950 bg-teal-50 border dark:border-teal-800/60 border-teal-200">
            {staffMembers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('candidates')}
          className={`pb-2.5 px-3 flex items-center gap-2 transition border-b-2 ${
            activeTab === 'candidates'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent dark:text-slate-400 text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>📄 {t('tab_external_candidates')}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono dark:bg-[#17242B] bg-slate-100 border dark:border-[#30424A] border-slate-200">
            {candidateAccounts.length}
          </span>
        </button>
      </div>

      {/* Notice Banner */}
      <div className="p-3 rounded-xl dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border flex items-center justify-between text-xs dark:text-slate-300 text-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-base">{activeTab === 'staff' ? '🏢' : '📄'}</span>
          <span>
            {activeTab === 'staff'
              ? t('team_notice_staff')
              : t('team_notice_candidates')}
          </span>
        </div>
        {activeTab === 'candidates' && (
          <Link
            href="/candidates"
            className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold text-[10px] shrink-0 ml-2 shadow-xs"
          >
            {t('nav_candidates')} &rarr;
          </Link>
        )}
      </div>

      {/* Directory Table */}
      <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs dark:text-slate-300 text-slate-700">
          <thead className="dark:bg-slate-900/60 bg-slate-50 dark:text-slate-400 text-slate-500 font-mono uppercase text-[10px] dark:border-[#30424A] border-slate-200 border-b">
            <tr>
              <th className="p-3">{activeTab === 'staff' ? t('team_col_employee') : t('team_col_candidate_name')}</th>
              <th className="p-3">{t('team_col_classification')}</th>
              <th className="p-3">{activeTab === 'staff' ? t('team_col_assigned_role') : t('team_col_account_status')}</th>
              <th className="p-3">{activeTab === 'staff' ? t('team_col_permissions') : t('team_col_portal_access')}</th>
              <th className="p-3 text-right">{t('team_col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-[#30424A]/60 divide-slate-100">
            {displayedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                  {activeTab === 'staff'
                    ? t('team_empty_staff')
                    : t('team_empty_candidates')}
                </td>
              </tr>
            ) : (
              displayedUsers.map((user) => {
                const roleName = user.roles?.[0]?.name || 'Candidate';
                const isStaff = roleName !== 'Candidate';

                return (
                  <tr key={user.id} className="dark:hover:bg-slate-900/50 hover:bg-slate-50 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold ${
                            isStaff
                              ? 'bg-teal-600/15 border border-teal-500/20 text-teal-600 dark:text-teal-400'
                              : 'bg-emerald-600/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {(user.name || user.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold dark:text-white text-slate-900">
                            {user.name || (isStaff ? t('team_staff_user') : t('team_applicant'))}
                          </p>
                          <p className="text-[10px] dark:text-slate-500 text-slate-400 font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isStaff
                            ? 'dark:bg-teal-950/80 bg-teal-50 dark:text-teal-300 text-teal-700 border dark:border-teal-800/80 border-teal-200'
                            : 'dark:bg-emerald-950/60 bg-emerald-50 dark:text-emerald-300 text-emerald-800 border dark:border-emerald-800/60 border-emerald-200'
                        }`}
                      >
                        {isStaff ? t('team_badge_internal') : t('team_badge_external')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-[#0F171D] bg-slate-100 dark:text-slate-300 text-slate-700 border dark:border-[#30424A] border-slate-200">
                        {roleName}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[10px] dark:text-slate-400 text-slate-500">
                      {isStaff
                        ? user.roles?.[0]?.permissions?.join(', ') || 'READ_WRITE'
                        : t('team_applicant_portal')}
                    </td>
                    <td className="p-3 text-right">
                      {isStaff ? (
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="px-2.5 py-1 dark:bg-[#0F171D] bg-slate-100 hover:bg-teal-700 hover:text-white dark:border-[#30424A] border-slate-200 border dark:text-slate-300 text-slate-700 rounded text-xs font-semibold transition"
                        >
                          {t('btn_edit_role')}
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href="/candidates"
                            className="px-2.5 py-1 dark:bg-[#0F171D] bg-slate-100 hover:bg-teal-700 hover:text-white dark:border-[#30424A] border-slate-200 border dark:text-slate-300 text-slate-700 rounded text-xs font-semibold transition"
                          >
                            {t('team_view_applications')} &rarr;
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="px-2 py-1 text-[10px] text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 font-semibold"
                            title={t('team_promote_title')}
                          >
                            {t('promote_btn')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT ROLE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-[#17242B] bg-[#FFFDF8] dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b dark:border-[#30424A] border-slate-100">
              <h3 className="text-sm font-bold dark:text-white text-slate-900">{t('team_edit_role_title')}</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-1">                <p className="font-semibold dark:text-white text-slate-900">{editingUser.name || t('team_user_fallback')}</p>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 font-mono">{editingUser.email}</p>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-3">
              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">
                  {t('team_select_role')}
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full dark:bg-[#0F171D] bg-slate-50 dark:border-[#30424A] border-slate-200 border rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-teal-500"
                >
                  <option value="Admin">{t('team_role_admin')}</option>
                  <option value="Recruiter">{t('team_role_recruiter')}</option>
                  <option value="HiringManager">{t('team_role_manager')}</option>
                  <option value="Interviewer">{t('team_role_interviewer')}</option>
                  <option value="ComplianceAuditor">{t('team_role_auditor')}</option>
                  <option value="Candidate">{t('team_role_candidate')}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-[#30424A] border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 dark:bg-slate-800 bg-slate-100 rounded-lg font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingRole}
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {savingRole ? t('loading') : t('confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-[#17242B] bg-[#FFFDF8] dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b dark:border-[#30424A] border-slate-100">
              <h3 className="text-sm font-bold dark:text-white text-slate-900">{t('team_invite_title')}</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">{t('team_full_name')}</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder={t('team_full_name_placeholder')}
                  className="w-full dark:bg-[#0F171D] bg-slate-50 dark:border-[#30424A] border-slate-200 border rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">{t('team_work_email')}</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t('team_work_email_placeholder')}
                  className="w-full dark:bg-[#0F171D] bg-slate-50 dark:border-[#30424A] border-slate-200 border rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">{t('team_role_assignment')}</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full dark:bg-[#0F171D] bg-slate-50 dark:border-[#30424A] border-slate-200 border rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-teal-500"
                >
                  <option value="Admin">Admin</option>
                  <option value="Recruiter">Recruiter</option>
                  <option value="HiringManager">Hiring Manager</option>
                  <option value="Interviewer">Interviewer</option>
                  <option value="ComplianceAuditor">Compliance Auditor</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-[#30424A] border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 dark:bg-slate-800 bg-slate-100 rounded-lg font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {inviting ? t('loading') : t('team_send_invite')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}