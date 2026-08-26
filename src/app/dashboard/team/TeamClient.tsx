'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

interface TeamClientProps {
  initialUsers: any[];
}

export default function TeamClient({ initialUsers }: TeamClientProps) {
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<'staff' | 'candidates'>('staff');

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
          `Updated role for ${editingUser.name || editingUser.email} to ${selectedRole}`,
          'success',
          'Role Updated'
        );
      } else {
        showToast(data.error || 'Failed to update role', 'error');
      }
    } catch (err: any) {
      showToast('Network error while updating role', 'error');
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
        showToast(`Invitation sent to ${inviteEmail}`, 'success', 'Staff Member Invited');
      } else {
        showToast(data.error || 'Failed to invite member', 'error');
      }
    } catch (err: any) {
      showToast('Network error while sending invite', 'error');
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
              User & Access Governance
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-purple-950/60 bg-purple-50 dark:text-purple-300 text-purple-800 border dark:border-purple-800/50 border-purple-200">
              {users.length} TOTAL ACCOUNTS
            </span>
          </div>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            Strictly segregated directory distinguishing internal workspace staff from external job seekers.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1 shadow-xs self-start sm:self-auto"
        >
          <span>+</span>
          <span>Invite Staff Member</span>
        </button>
      </div>

      {/* Segregation Tabs */}
      <div className="flex items-center gap-2 border-b dark:border-slate-800 border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-2.5 px-3 flex items-center gap-2 transition border-b-2 ${
            activeTab === 'staff'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'border-transparent dark:text-slate-400 text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🏢 Internal Staff Directory</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono dark:bg-indigo-950 bg-indigo-50 border dark:border-indigo-800/60 border-indigo-200">
            {staffMembers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('candidates')}
          className={`pb-2.5 px-3 flex items-center gap-2 transition border-b-2 ${
            activeTab === 'candidates'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'border-transparent dark:text-slate-400 text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>📄 External Job Seekers (Candidates)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono dark:bg-slate-900 bg-slate-100 border dark:border-slate-800 border-slate-200">
            {candidateAccounts.length}
          </span>
        </button>
      </div>

      {/* Notice Banner */}
      <div className="p-3 rounded-xl dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border flex items-center justify-between text-xs dark:text-slate-300 text-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-base">{activeTab === 'staff' ? '🏢' : '📄'}</span>
          <span>
            {activeTab === 'staff'
              ? 'Showing only authenticated company employees, recruiters, hiring managers, and system administrators.'
              : 'Showing external job applicants with registered accounts. To evaluate their submitted resumes, open the Candidate Pipeline.'}
          </span>
        </div>
        {activeTab === 'candidates' && (
          <Link
            href="/candidates"
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] shrink-0 ml-2 shadow-xs"
          >
            Open Candidate Pipeline &rarr;
          </Link>
        )}
      </div>

      {/* Directory Table */}
      <div className="dark:bg-[#0B0F19] bg-white dark:border-slate-800/80 border-slate-200 border rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs dark:text-slate-300 text-slate-700">
          <thead className="dark:bg-slate-900/60 bg-slate-50 dark:text-slate-400 text-slate-500 font-mono uppercase text-[10px] dark:border-slate-800 border-slate-200 border-b">
            <tr>
              <th className="p-3">{activeTab === 'staff' ? 'Employee / Staff Member' : 'Candidate Name'}</th>
              <th className="p-3">Classification</th>
              <th className="p-3">{activeTab === 'staff' ? 'Assigned Role' : 'Account Status'}</th>
              <th className="p-3">{activeTab === 'staff' ? 'RBAC Permissions' : 'Portal Access'}</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800/60 divide-slate-100">
            {displayedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                  {activeTab === 'staff'
                    ? 'No internal staff members found.'
                    : 'No external candidate accounts registered yet.'}
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
                              ? 'bg-indigo-600/15 border border-indigo-500/20 text-indigo-400'
                              : 'bg-emerald-600/15 border border-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {(user.name || user.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold dark:text-white text-slate-900">
                            {user.name || (isStaff ? 'Staff User' : 'Applicant')}
                          </p>
                          <p className="text-[10px] dark:text-slate-500 text-slate-400 font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isStaff
                            ? 'dark:bg-indigo-950/80 bg-indigo-50 dark:text-indigo-300 text-indigo-700 border dark:border-indigo-800/80 border-indigo-200'
                            : 'dark:bg-emerald-950/60 bg-emerald-50 dark:text-emerald-300 text-emerald-800 border dark:border-emerald-800/60 border-emerald-200'
                        }`}
                      >
                        {isStaff ? '🏢 INTERNAL STAFF' : '📄 EXTERNAL APPLICANT'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-slate-800 bg-slate-100 dark:text-slate-300 text-slate-700 border dark:border-slate-700 border-slate-200">
                        {roleName}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[10px] dark:text-slate-400 text-slate-500">
                      {isStaff
                        ? user.roles?.[0]?.permissions?.join(', ') || 'READ_WRITE'
                        : 'Applicant Portal (Apply & Track Status)'}
                    </td>
                    <td className="p-3 text-right">
                      {isStaff ? (
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="px-2.5 py-1 dark:bg-slate-900 bg-slate-100 hover:bg-indigo-600 hover:text-white dark:border-slate-800 border-slate-200 border dark:text-slate-300 text-slate-700 rounded text-xs font-semibold transition"
                        >
                          Edit Role
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href="/candidates"
                            className="px-2.5 py-1 dark:bg-slate-900 bg-slate-100 hover:bg-indigo-600 hover:text-white dark:border-slate-800 border-slate-200 border dark:text-slate-300 text-slate-700 rounded text-xs font-semibold transition"
                          >
                            View Applications &rarr;
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="px-2 py-1 text-[10px] text-slate-400 hover:text-indigo-400 font-semibold"
                            title="Promote to Internal Staff"
                          >
                            Promote
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
          <div className="dark:bg-[#0B0F19] bg-white dark:border-slate-800 border-slate-200 border rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800 border-slate-100">
              <h3 className="text-sm font-bold dark:text-white text-slate-900">Edit Member Role</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-1">
              <p className="font-semibold dark:text-white text-slate-900">{editingUser.name || 'User'}</p>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 font-mono">{editingUser.email}</p>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-3">
              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">
                  Select Role & Permissions *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="Admin">Admin (Full Workspace Owner)</option>
                  <option value="Recruiter">Recruiter (ATS & Candidate Owner)</option>
                  <option value="HiringManager">Hiring Manager (Department Head)</option>
                  <option value="Interviewer">Interviewer (Technical Evaluator)</option>
                  <option value="ComplianceAuditor">Compliance Auditor (Audit Inspector)</option>
                  <option value="Candidate">Candidate (Job Applicant Portal Only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800 border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 dark:bg-slate-800 bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRole}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {savingRole ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-[#0B0F19] bg-white dark:border-slate-800 border-slate-200 border rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800 border-slate-100">
              <h3 className="text-sm font-bold dark:text-white text-slate-900">Invite Staff Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">Staff Role Assignment *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="Admin">Admin</option>
                  <option value="Recruiter">Recruiter</option>
                  <option value="HiringManager">Hiring Manager</option>
                  <option value="Interviewer">Interviewer</option>
                  <option value="ComplianceAuditor">Compliance Auditor</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800 border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 dark:bg-slate-800 bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {inviting ? 'Sending Invite...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}