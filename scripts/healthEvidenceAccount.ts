/**
 * Staging evidence helper for the authenticated /api/health detail view.
 * Creates (or removes) ONE scoped evidence account so the health detail can
 * be exercised over real HTTP with a NextAuth session.
 *
 * Usage:
 *   npx tsx scripts/healthEvidenceAccount.ts create
 *   npx tsx scripts/healthEvidenceAccount.ts cleanup
 *
 * Everything is namespaced under 'health-evidence-' ids/emails and removed
 * by the cleanup mode. No real data is touched.
 */
import 'dotenv/config';
import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import { permissionsForRoleName } from '../src/lib/roleAccess';

const ORG_ID = 'health-evidence-org';
const USER_ID = 'health-evidence-admin';
const ROLE_ID = 'health-evidence-role';
const EMAIL = 'health-evidence@evidence.test';
const PASSWORD = 'Evidence-Probe-2026!x';

async function create() {
  await cleanup(); // idempotent re-runs
  const org = await prisma.organization.create({ data: { id: ORG_ID, name: 'Health Evidence Org' } });
  const role = await prisma.role.create({
    data: { id: ROLE_ID, name: 'Admin', permissions: permissionsForRoleName('Admin') },
  });
  await prisma.user.create({
    data: {
      id: USER_ID,
      email: EMAIL,
      name: 'Health Evidence Admin',
      passwordHash: await bcrypt.hash(PASSWORD, 12),
      accessStatus: 'ACTIVE',
      emailVerifiedAt: new Date(),
      organizationId: org.id,
      roles: { connect: { id: role.id } },
    },
  });
  console.log('Evidence account ready:', EMAIL);
}

async function cleanup() {
  await prisma.user.deleteMany({ where: { id: USER_ID } });
  await prisma.role.deleteMany({ where: { id: ROLE_ID } }).catch(() => undefined);
  await prisma.organization.deleteMany({ where: { id: ORG_ID } }).catch(() => undefined);
  console.log('Evidence account removed.');
}

const mode = process.argv[2];
async function main() {
  if (mode === 'create') await create();
  else if (mode === 'cleanup') await cleanup();
  else {
    console.error('Usage: tsx scripts/healthEvidenceAccount.ts create|cleanup');
    process.exitCode = 1;
    return;
  }
}
main()
  .catch((e) => {
    console.error('Failed:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
