import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Fail LOUDLY when DATABASE_URL is missing. An empty connection string
 * produces confusing "socket hang up" style errors deep in request handlers;
 * a clear startup error is the honest failure mode.
 */
const rawDatabaseUrl =
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV === 'test'
    ? 'postgresql://mock:mock@127.0.0.1:5432/mock'
    : undefined);

if (!rawDatabaseUrl) {
  throw new Error(
    'DATABASE_URL is not set — the application cannot reach its database. ' +
      'Copy .env.example to .env and configure a PostgreSQL connection string.'
  );
}

// `localhost` can resolve to ::1 in some environments where Postgres only
// listens on IPv4; pin to 127.0.0.1. Only rewrite the host part.
const connectionString = (() => {
  try {
    const url = new URL(rawDatabaseUrl);
    if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
    return url.toString();
  } catch {
    throw new Error('DATABASE_URL is not a valid connection string.');
  }
})();

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  pgPool: Pool;
};

if (process.env.NODE_ENV === 'test' && rawDatabaseUrl.includes('mock')) {
  // Safe mock for unit tests that do not test live database operations
  const mockModel = {
    findUnique: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    create: async (args: any) => ({ id: 'mock-id', ...args.data }),
    update: async (args: any) => ({ id: 'mock-id', ...args.data }),
    upsert: async (args: any) => ({ id: 'mock-id', ...args.create }),
    delete: async () => ({ id: 'mock-id' }),
    deleteMany: async () => ({ count: 0 }),
    count: async () => 0,
  };

  const mockPrisma = new Proxy({} as any, {
    get: (_target, prop) => {
      if (prop === '$transaction') {
        return async (fnOrArray: any) =>
          typeof fnOrArray === 'function' ? fnOrArray(mockPrisma) : Promise.all(fnOrArray);
      }
      return mockModel;
    },
  });

  globalForPrisma.prisma = mockPrisma;
} else {
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new Pool({
      connectionString,
      connectionTimeoutMillis: 20_000,
      idleTimeoutMillis: 30_000,
      max: 10,
    });
  }

  const adapter = new PrismaPg(globalForPrisma.pgPool);
  const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

  // Cache in every environment (including production): the module's default
  // export reads `globalForPrisma.prisma`, so skipping the assignment under
  // NODE_ENV=production exported `undefined` and broke every module-level
  // import in the built server (auth, pages, APIs — everything).
  globalForPrisma.prisma = prisma;
}

export default globalForPrisma.prisma;
