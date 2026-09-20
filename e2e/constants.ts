/**
 * Shared E2E constants — the per-run namespace that keeps browser tests
 * strictly scoped inside the target database (same discipline as the
 * integration suite: unique org/role/user ids and emails per run, cleaned
 * up in global-teardown).
 */
export const RUN_ID = `e2e${Date.now().toString(36)}`;

export const E2E = {
  orgId: `org-a-${RUN_ID}`,
  orgName: `E2E Corp ${RUN_ID}`,
  roleId: `role-recruiter-${RUN_ID}`,
  roleName: 'Recruiter',
  recruiter: {
    id: `u-rec-${RUN_ID}`,
    email: `recruiter.${RUN_ID}@e2e.test`,
    password: 'E2e-Recruiter-Passw0rd!',
    name: 'Rosa Recruiter (E2E)',
  },
  job: {
    title: `E2E Backend Engineer ${RUN_ID}`,
    department: 'Engineering',
  },
  candidate: {
    email: `tess.${RUN_ID}@e2e.test`,
    firstName: 'Tess',
    lastName: 'Ngabo (E2E)',
  },
  // Exposed for the resume-download E2E test (file saved into uploads/).
  resumePath: `uploads/e2e-resume-${RUN_ID}.txt`,
} as const;

export const EMAILS_PREFIXES = [`recruiter.${RUN_ID}@`, `tess.${RUN_ID}@`, `ANON-${RUN_ID}`];
