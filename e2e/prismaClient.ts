/**
 * Deterministic Prisma client for the E2E global setup/teardown.
 *
 * Playwright's transpiler applies CJS↔ESM interop to `await import('../src/lib/prisma')`,
 * which can yield a namespace object instead of the client instance (`.organization`
 * undefined at runtime). Building the client directly — with the same pg driver
 * adapter the app uses (src/lib/prisma.ts) — is interop-proof and connects to
 * TEST_DATABASE_URL.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export function createE2EPrisma(): PrismaClient {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error('TEST_DATABASE_URL is not set — the E2E suite cannot reach its database.');
  }
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 20_000,
    idleTimeoutMillis: 30_000,
    max: 5,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}
