import 'dotenv/config';
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

prisma.organization
  .count()
  .then((count) => {
    console.log(`STAGING_DB_REACHABLE orgs=${count}`);
    return prisma.$disconnect();
  })
  .catch((err: Error) => {
    console.error(`DB_ERROR ${err.message.slice(0, 200)}`);
    process.exit(1);
  });
