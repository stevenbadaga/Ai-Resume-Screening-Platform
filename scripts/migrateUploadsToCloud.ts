/**
 * ONE-TIME migration: moves every locally-stored resume document into the
 * cloud bucket (Supabase Storage) and deletes the local file, so no resume
 * data remains on the host machine (user requirement + spec §6.4).
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Idempotent: rows already stored as `supabase:...` are skipped; rows whose
 * local file is missing are reported and left for manual review.
 *
 * Usage:
 *   npx tsx scripts/migrateUploadsToCloud.ts            # dry-run report
 *   npx tsx scripts/migrateUploadsToCloud.ts --apply    # perform the move
 */
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../src/lib/prisma';
import { isSupabaseConfigured, putObject, contentTypeFromKey, buildObjectKey } from '../src/lib/storage';
import { isPathWithinUploads } from '../src/lib/validation';

async function main() {
  const apply = process.argv.includes('--apply');

  if (!isSupabaseConfigured()) {
    console.error(
      'Cloud storage is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.'
    );
    process.exit(1);
  }

  const localResumes = await prisma.resumeDocument.findMany({
    where: { fileReference: { not: { startsWith: 'supabase:' } } },
    select: { id: true, fileReference: true },
  });

  console.log(`Local resume rows found: ${localResumes.length}${apply ? '' : ' (dry-run — pass --apply to move them)'}`);

  let migrated = 0;
  let missing = 0;
  for (const row of localResumes) {
    const filePath = path.isAbsolute(row.fileReference)
      ? row.fileReference
      : path.resolve(process.cwd(), row.fileReference);

    if (!isPathWithinUploads(filePath)) {
      console.warn(`  SKIP (reference outside uploads sandbox): ${row.id}`);
      missing++;
      continue;
    }

    let bytes: Buffer;
    try {
      bytes = await fs.readFile(filePath);
    } catch {
      console.warn(`  MISSING local file for row ${row.id}: ${row.fileReference}`);
      missing++;
      continue;
    }

    if (!apply) {
      console.log(`  WOULD UPLOAD row ${row.id} (${bytes.length} bytes): ${row.fileReference}`);
      continue;
    }

    const objectKey = buildObjectKey(path.basename(filePath));
    const stored = await putObject(bytes, objectKey, contentTypeFromKey(filePath));
    await prisma.resumeDocument.update({
      where: { id: row.id },
      data: { fileReference: stored.reference },
    });
    await fs.unlink(filePath).catch(() => undefined);
    migrated++;
    console.log(`  MIGRATED row ${row.id} → ${stored.reference} (local copy deleted)`);
  }

  console.log(`Done. migrated=${migrated} skippedOrMissing=${missing}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
