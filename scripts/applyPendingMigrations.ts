import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString, connectionTimeoutMillis: 30_000, max: 2 });

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT migration_name FROM "_prisma_migrations" ORDER BY migration_name`);
    const appliedSet = new Set(res.rows.map((r: { migration_name: string }) => r.migration_name));

    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const localMigrations = fs
      .readdirSync(migrationsDir)
      .filter((d) => d !== 'migration_lock.toml' && fs.statSync(path.join(migrationsDir, d)).isDirectory())
      .sort();

    const pending = localMigrations.filter((m) => !appliedSet.has(m));
    console.log(`Pending migrations: ${pending.length}`);

    for (const migration of pending) {
      console.log(`Applying migration: ${migration}...`);
      const sqlPath = path.join(migrationsDir, migration, 'migration.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sqlContent);

        const checksum = crypto.createHash('sha256').update(sqlContent).digest('hex');
        const id = crypto.randomUUID();

        await client.query(
          `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
           VALUES ($1, $2, NOW(), $3, NULL, NULL, NOW(), 1)`,
          [id, checksum, migration]
        );

        await client.query('COMMIT');
        console.log(`Successfully applied: ${migration}`);
      } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(`Failed to apply ${migration}:`, err.message);
        throw err;
      }
    }

    console.log('All pending migrations processed successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

