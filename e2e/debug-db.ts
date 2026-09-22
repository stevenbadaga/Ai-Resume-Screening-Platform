import { createE2EPrisma } from './prismaClient';

async function main() {
  const prisma = createE2EPrisma();
  const users = await prisma.user.findMany({
    where: { email: { contains: '@e2e.test' } },
    select: { id: true, email: true, accessStatus: true, emailVerifiedAt: true, passwordHash: true, roles: { select: { name: true } } },
  });
  console.log('E2E users:', JSON.stringify(users, null, 2));
  const orgs = await prisma.organization.findMany({ where: { id: { startsWith: 'org-a-e2e' } }, select: { id: true, name: true } });
  console.log('E2E orgs:', JSON.stringify(orgs));
  await prisma.$disconnect();
}
main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
