import { describe, expect, it } from 'vitest';
import { Permission, ROLE_PERMISSIONS, roleCapabilities, roleHasPermission, rolesWithPermission } from '@/lib/roleAccess';

const ALL_ROLES = Object.keys(ROLE_PERMISSIONS) as Array<keyof typeof ROLE_PERMISSIONS>;

describe('role capability matrix', () => {
  it('keeps candidate users in candidate workflows', () => {
    expect(roleCapabilities.canManageJobs('Candidate')).toBe(false);
    expect(roleCapabilities.canMakeDecisions('Candidate')).toBe(false);
    expect(roleCapabilities.canSubmitScorecards('Candidate')).toBe(false);
    expect(roleCapabilities.canManageTeam('Candidate')).toBe(false);
  });

  it('gives interviewers evaluation capabilities without decision powers', () => {
    expect(roleCapabilities.canGenerateInterviewQuestions('Interviewer')).toBe(true);
    expect(roleCapabilities.canSubmitScorecards('Interviewer')).toBe(true);
    expect(roleCapabilities.canScheduleInterviews('Interviewer')).toBe(false);
    expect(roleCapabilities.canMakeDecisions('Interviewer')).toBe(false);
    expect(roleCapabilities.canOverrideScores('Interviewer')).toBe(false);
  });

  it('gives recruiters and hiring managers operational hiring controls', () => {
    for (const role of ['Recruiter', 'HiringManager'] as const) {
      expect(roleCapabilities.canManageJobs(role)).toBe(true);
      expect(roleCapabilities.canMakeDecisions(role)).toBe(true);
      expect(roleCapabilities.canOverrideScores(role)).toBe(true);
      expect(roleCapabilities.canScheduleInterviews(role)).toBe(true);
      expect(roleCapabilities.canSubmitScorecards(role)).toBe(false);
    }
  });

  it('keeps auditors read-only and limits team administration to admins', () => {
    for (const role of ['ComplianceAuditor', 'Auditor'] as const) {
      expect(roleCapabilities.canReviewCandidates(role)).toBe(true);
      expect(roleCapabilities.canViewAudit(role)).toBe(true);
      expect(roleCapabilities.canMakeDecisions(role)).toBe(false);
      expect(roleCapabilities.canManageTeam(role)).toBe(false);
    }
    expect(roleCapabilities.canManageTeam('Admin')).toBe(true);
  });
});

describe('typed permission matrix (ROLE_PERMISSIONS)', () => {
  it('grants Admin every permission and Candidate none', () => {
    const allPermissions = Object.values(Permission);
    for (const permission of allPermissions) {
      expect(roleHasPermission('Admin', permission)).toBe(true);
      expect(roleHasPermission('Candidate', permission)).toBe(false);
    }
  });

  it('every permission is granted to at least one role', () => {
    for (const permission of Object.values(Permission)) {
      expect(rolesWithPermission(permission).length).toBeGreaterThan(0);
    }
  });

  it('returns false for unknown role strings instead of throwing', () => {
    expect(roleHasPermission('SuperAdmin', Permission.ManageJobs)).toBe(false);
    expect(roleHasPermission('', Permission.ManageJobs)).toBe(false);
    expect(roleHasPermission(undefined as unknown as string, Permission.ManageJobs)).toBe(false);
  });

  it('separates scorecard viewing from submission', () => {
    // Viewing includes auditors; submission is staff + Interviewer only.
    expect(roleHasPermission('ComplianceAuditor', Permission.ViewScorecards)).toBe(true);
    expect(roleHasPermission('Auditor', Permission.ViewScorecards)).toBe(true);
    expect(roleHasPermission('ComplianceAuditor', Permission.SubmitScorecards)).toBe(false);
    expect(roleHasPermission('Interviewer', Permission.SubmitScorecards)).toBe(true);
  });

  it('keeps interview scheduling and offers away from Interviewer', () => {
    expect(roleHasPermission('Interviewer', Permission.ScheduleInterviews)).toBe(false);
    expect(roleHasPermission('Interviewer', Permission.OfferJob)).toBe(false);
    expect(roleHasPermission('HiringManager', Permission.OfferJob)).toBe(false);
    expect(roleHasPermission('Recruiter', Permission.OfferJob)).toBe(true);
  });

  it('keeps auditors read-only across the whole matrix', () => {
    for (const role of ['ComplianceAuditor', 'Auditor'] as const) {
      for (const permission of Object.values(Permission)) {
        const readOnly: string[] = [
          Permission.ReviewCandidates,
          Permission.ViewScorecards,
          Permission.ViewAuditLog,
          Permission.ManagePrivacyRequests,
        ];
        expect(roleHasPermission(role, permission)).toBe(readOnly.includes(permission));
      }
    }
  });

  it('treats the legacy Auditor alias identically to ComplianceAuditor', () => {
    for (const permission of Object.values(Permission)) {
      expect(roleHasPermission('Auditor', permission)).toBe(
        roleHasPermission('ComplianceAuditor', permission)
      );
    }
  });

  it('never drifts from the legacy capability predicates', () => {
    // Each predicate must agree with the matrix for every role.
    const pairs: Array<[keyof typeof roleCapabilities, (typeof Permission)[keyof typeof Permission]]> = [
      ['canManageJobs', Permission.ManageJobs],
      ['canReviewCandidates', Permission.ReviewCandidates],
      ['canMakeDecisions', Permission.MakeHiringDecisions],
      ['canOverrideScores', Permission.OverrideScores],
      ['canScheduleInterviews', Permission.ScheduleInterviews],
      ['canGenerateInterviewQuestions', Permission.GenerateInterviewQuestions],
      ['canViewAudit', Permission.ViewAuditLog],
      ['canManageTeam', Permission.ManageTeam],
      // canSubmitScorecards is intentionally narrower ('Interviewer' only)
      // than the SubmitScorecards permission — do not add a pair for it.
    ];

    for (const [predicate, permission] of pairs) {
      for (const role of ALL_ROLES) {
        expect(`${predicate}:${role}`).toBe(
          `${predicate}:${roleHasPermission(role, permission) === roleCapabilities[predicate](role) ? role : `MISMATCH-${role}`}`
        );
      }
    }
  });

  it('lists roles for a permission in sorted order', () => {
    expect(rolesWithPermission(Permission.OfferJob)).toEqual(['Admin', 'Recruiter']);
    expect(rolesWithPermission(Permission.ManageTeam)).toEqual(['Admin']);
  });
});
