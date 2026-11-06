/**
 * RBAC bootstrap — who becomes Admin when no Admin exists?
 *
 * Policy (the industry-standard "workspace founder" model used by Slack,
 * Notion, Linear, GitHub, etc.):
 *
 *  - A staff signup whose company name does NOT match any existing workspace
 *    is founding a NEW workspace → that account becomes the workspace Admin
 *    and is recorded as the Organization's primaryOwnerId.
 *  - A staff signup joining an EXISTING workspace starts as Recruiter.
 *    Only an Admin can elevate them (team/role endpoint, audited).
 *  - Candidates are always Candidates.
 *
 * Security note: founding a workspace only grants Admin over the founder's
 * own (new, empty) workspace. Organization isolation is enforced on every
 * endpoint, so a bad actor founding a workspace gains no access to any other
 * organization's data. Privilege escalation would require joining an existing
 * workspace, and that path never grants Admin by itself.
 */
export type SelfSignupRole = 'Admin' | 'Recruiter' | 'Candidate';

export function resolveSignupRole(
  input:
    | {
        accountType: 'candidate' | 'worker';
        foundedOrg?: boolean;
      }
    | 'candidate'
    | 'worker'
): SelfSignupRole {
  if (typeof input === 'string') {
    return input === 'candidate' ? 'Candidate' : 'Recruiter';
  }
  if (input.accountType === 'candidate') return 'Candidate';
  return input.foundedOrg ? 'Admin' : 'Recruiter';
}
