import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DB_ERROR DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString, connectionTimeoutMillis: 20_000, max: 2 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const applied = await prisma.$queryRaw<Array<{ migration_name: string }>>`
    SELECT migration_name FROM "_prisma_migrations" ORDER BY migration_name
  `;
  const local = fs
    .readdirSync(path.join(process.cwd(), 'prisma', 'migrations'))
    .filter((d) => d !== 'migration_lock.toml')
    .sort();
  const appliedSet = new Set(applied.map((r) => r.migration_name));
  const missing = local.filter((m) => !appliedSet.has(m));

  console.log(`LOCAL_MIGRATIONS=${local.length} APPLIED=${applied.length}`);
  if (missing.length > 0) {
    console.log(`NOT_APPLIED: ${missing.join(', ')}`);
    process.exitCode = 2;
  } else {
    console.log('ALL_MIGRATIONS_APPLIED');
  }
}

main()
  .catch((err: Error) => {
    console.error(`DB_ERROR ${err.message.slice(0, 200)}`);
    process.exit(1);
  })
  .finally(() => pool.end());
