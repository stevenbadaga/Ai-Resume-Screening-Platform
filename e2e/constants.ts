/**
 * Shared E2E constants — the per-run namespace that keeps browser tests
 * strictly scoped inside the target database (same discipline as the
 * integration suite: unique org/role/user ids and emails per run, cleaned
 * up in global-teardown).
 *
 * RUN_ID stability: Playwright runs globalSetup and the test workers in
 * DIFFERENT processes, so a bare `Date.now()` here would produce different
 * ids in each — global-setup would seed one email and the tests would log
 * in with another. The id is therefore generated once (by the first process
 * to import this module, i.e. global-setup) and persisted to a file that
 * worker processes read back. Teardown removes the file.
 */
import fs from 'fs';
import path from 'path';

const RUN_ID_FILE = path.join(process.cwd(), 'test-results', '.e2e-run-id');

function resolveRunId(): string {
  try {
    const existing = fs.readFileSync(RUN_ID_FILE, 'utf8').trim();
    if (existing) return existing;
  } catch {
    // No file yet — this process is the first importer (global-setup).
  }
  const id = `e2e${Date.now().toString(36)}`;
  try {
    fs.mkdirSync(path.dirname(RUN_ID_FILE), { recursive: true });
    fs.writeFileSync(RUN_ID_FILE, id);
  } catch {
    // Read-only filesystem: fall back to per-process ids (suite would be
    // broken anyway, but nothing crashes).
  }
  return id;
}

export const RUN_ID = resolveRunId();

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
