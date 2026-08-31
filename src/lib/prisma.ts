import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = (process.env.DATABASE_URL || '').replace('localhost', '127.0.0.1');

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  pgPool: Pool;
};

if (!globalForPrisma.pgPool) {
  globalForPrisma.pgPool = new Pool({ connectionString });
}

const adapter = new PrismaPg(globalForPrisma.pgPool);

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
