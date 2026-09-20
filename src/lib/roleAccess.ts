/**
 * Typed permission matrix — single source of truth for RBAC.
 *
 * Route handlers should guard endpoints with `requirePermission(Permission.X)`
 * (see src/lib/auth.ts) instead of hardcoding role-name arrays. The matrix is
 * data, so the guard logic is testable in isolation and role changes happen in
 * exactly one place.
 *
 * Roles:
 *  - Admin             — workspace owner, full control
 *  - Recruiter         — end-to-end pipeline owner
 *  - HiringManager     — department head, reviews + decides
 *  - Interviewer       — evaluates candidates, no decisions
 *  - ComplianceAuditor — read-only compliance reviewer
 *  - Auditor           — legacy alias of ComplianceAuditor
 *  - Candidate         — external job seeker
 */

export type ApplicationRole =
  | 'Admin'
  | 'Recruiter'
  | 'HiringManager'
  | 'Interviewer'
  | 'ComplianceAuditor'
  | 'Auditor'
  | 'Candidate';

/**
 * Coarse-grained permissions granted to API endpoints.
 * Each permission should map to one guardable capability.
 */
export const Permission = {
  // Job requisitions & rubrics
  ManageJobs: 'jobs:manage',
  ManageRubrics: 'jobs:rubrics',
  ViewTalentPool: 'jobs:talent-pool',

  // Candidates & pipeline
  ReviewCandidates: 'candidates:review',
  MakeHiringDecisions: 'candidates:decide',
  OverrideScores: 'candidates:override-scores',
  MergeDuplicates: 'candidates:merge-duplicates',
  EditParsedProfile: 'candidates:edit-profile',
  OfferJob: 'candidates:offer',

  // Interviews & scorecards
  ScheduleInterviews: 'interviews:schedule',
  GenerateInterviewQuestions: 'interviews:generate-questions',
  ViewScorecards: 'interviews:scorecards:view',
  SubmitScorecards: 'interviews:scorecards:submit',

  // Data & compliance
  ExportData: 'data:export',
  ViewAuditLog: 'compliance:audit-log',
  ManagePrivacyRequests: 'compliance:privacy-requests',
  RetryResumeUpload: 'uploads:retry',

  // Team administration
  ManageTeam: 'team:manage',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

/**
 * Role → granted permissions. THE source of truth for authorization.
 */
export const ROLE_PERMISSIONS: Record<ApplicationRole, readonly Permission[]> = {
  Admin: Object.values(Permission),
  Recruiter: [
    Permission.ManageJobs,
    Permission.ManageRubrics,
    Permission.ViewTalentPool,
    Permission.ReviewCandidates,
    Permission.MakeHiringDecisions,
    Permission.OverrideScores,
    Permission.MergeDuplicates,
    Permission.EditParsedProfile,
    Permission.OfferJob,
    Permission.ScheduleInterviews,
    Permission.GenerateInterviewQuestions,
    Permission.ViewScorecards,
    Permission.SubmitScorecards,
    Permission.ExportData,
    Permission.RetryResumeUpload,
  ],
  HiringManager: [
    Permission.ManageJobs,
    Permission.ManageRubrics,
    Permission.ViewTalentPool,
    Permission.ReviewCandidates,
    Permission.MakeHiringDecisions,
    Permission.OverrideScores,
    Permission.EditParsedProfile,
    Permission.ScheduleInterviews,
    Permission.GenerateInterviewQuestions,
    Permission.ViewScorecards,
    Permission.ExportData,
  ],
  Interviewer: [
    Permission.ReviewCandidates,
    Permission.GenerateInterviewQuestions,
    Permission.ViewScorecards,
    Permission.SubmitScorecards,
  ],
  ComplianceAuditor: [
    Permission.ReviewCandidates,
    Permission.ViewScorecards,
    Permission.ViewAuditLog,
    Permission.ManagePrivacyRequests,
  ],
  // Legacy alias — kept so old audit/DB records still authorize correctly.
  Auditor: [
    Permission.ReviewCandidates,
    Permission.ViewScorecards,
    Permission.ViewAuditLog,
    Permission.ManagePrivacyRequests,
  ],
  Candidate: [],
};

const ROLE_SETS: Record<Permission, ReadonlySet<ApplicationRole>> = Object.fromEntries(
  (Object.values(Permission) as Permission[]).map((permission) => [
    permission,
    new Set(
      (Object.keys(ROLE_PERMISSIONS) as ApplicationRole[]).filter((role) =>
        ROLE_PERMISSIONS[role].includes(permission)
      )
    ),
  ])
) as unknown as Record<Permission, ReadonlySet<ApplicationRole>>;

/** Type-checked role membership check against the matrix. */
export function roleHasPermission(role: string, permission: Permission): boolean {
  return ROLE_SETS[permission].has(role as ApplicationRole);
}

/**
 * THE single source of truth for the permission strings persisted on Role
 * rows in the database. Every role-row creation (signup, team invite, role
 * change) must use this — the DB strings are the human-readable mirror of
 * the matrix and must never drift from it. Actual authorization always
 * consults the matrix via `roleHasPermission`; DB strings are informational
 * (displayed in the team directory and useful for audits).
 *
 * Unknown role names resolve to no permissions (safe default).
 */
export function permissionsForRoleName(roleName: string): string[] {
  const grants = (ROLE_PERMISSIONS as Record<string, readonly Permission[]>)[roleName];
  return grants ? [...grants] : [];
}

/** Roles granted the given permission (useful for tests and UI hints). */
export function rolesWithPermission(permission: Permission): readonly ApplicationRole[] {
  return [...ROLE_SETS[permission]].sort();
}

// ─────────────────────────────────────────────
// Capability predicates (compat layer)
// ─────────────────────────────────────────────

const roles = (...allowed: ApplicationRole[]) => (role?: string) =>
  allowed.includes(role as ApplicationRole);

/**
 * Kept for existing call sites/tests; each predicate now mirrors a permission
 * in the matrix so the two can never drift apart.
 */
export const roleCapabilities = {
  canManageJobs: roles('Admin', 'Recruiter', 'HiringManager'),
  canReviewCandidates: roles('Admin', 'Recruiter', 'HiringManager', 'Interviewer', 'ComplianceAuditor', 'Auditor'),
  canMakeDecisions: roles('Admin', 'Recruiter', 'HiringManager'),
  canOverrideScores: roles('Admin', 'Recruiter', 'HiringManager'),
  canScheduleInterviews: roles('Admin', 'Recruiter', 'HiringManager'),
  canGenerateInterviewQuestions: roles('Admin', 'Recruiter', 'HiringManager', 'Interviewer'),
  canSubmitScorecards: roles('Interviewer'),
  canViewAudit: roles('Admin', 'ComplianceAuditor', 'Auditor'),
  canManageTeam: roles('Admin'),
};