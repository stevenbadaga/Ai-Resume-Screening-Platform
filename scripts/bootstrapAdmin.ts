import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { permissionsForRoleName } from '../src/lib/roleAccess';

const required = ['DATABASE_URL', 'BOOTSTRAP_ORG_NAME', 'BOOTSTRAP_ADMIN_EMAIL', 'BOOTSTRAP_ADMIN_NAME', 'BOOTSTRAP_ADMIN_PASSWORD'] as const;
for (const key of required) {
  if (!process.env[key]?.trim()) throw new Error(`Required environment variable ${key} is missing.`);
}

const email = process.env.BOOTSTRAP_ADMIN_EMAIL!.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD!;
if (password.length < 16) throw new Error('BOOTSTRAP_ADMIN_PASSWORD must contain at least 16 characters.');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('BOOTSTRAP_ADMIN_EMAIL is not a valid email address.');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new Error('That email already has an account; bootstrap will not modify it.');
  const organizationName = process.env.BOOTSTRAP_ORG_NAME!.trim();
  if (await prisma.organization.findFirst({ where: { name: organizationName }, select: { id: true } })) {
    throw new Error('That organization name already exists; bootstrap will not attach an account to it.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const canonicalPermissions = permissionsForRoleName('Admin');
  await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({ data: { name: organizationName } });
    const existingRole = await tx.role.findFirst({ where: { name: 'Admin' } });
    const role = existingRole
      ? await tx.role.update({ where: { id: existingRole.id }, data: { permissions: canonicalPermissions } })
      : await tx.role.create({ data: { name: 'Admin', permissions: canonicalPermissions } });
    const admin = await tx.user.create({
      data: {
        name: process.env.BOOTSTRAP_ADMIN_NAME!.trim(),
        email,
        passwordHash,
        accessStatus: 'INVITED',
        mustChangePassword: true,
        organizationId: organization.id,
        roles: { connect: { id: role.id } },
      },
    });
    await tx.organization.update({ where: { id: organization.id }, data: { primaryOwnerId: admin.id } });
  });
  console.log(`Created the initial Admin account for ${organizationName}. Sign in with the configured credentials and complete emailed MFA plus password setup.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Admin bootstrap failed.');
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
