/**
 * Cloud object storage for resume documents (spec §6.4 "store the original
 * document securely with a unique reference" + the user's requirement that
 * NOTHING persists on the local machine).
 *
 * Primary backend: Supabase Storage (S3-compatible, private bucket, accessed
 * only from the server with the service-role key). The local directory remains
 * ONLY as a transparent dev fallback when cloud credentials are absent — with
 * SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set, no byte ever touches disk.
 *
 * `fileReference` in the database stores the OBJECT KEY for cloud objects
 * (prefixed `supabase:`) or the legacy local path for old rows, so both
 * backends coexist during migration.
 */

import path from 'path';

export type StorageBackend = 'supabase' | 'local';

export interface StoredFile {
  /** Key stored in ResumeDocument.fileReference */
  reference: string;
  backend: StorageBackend;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const RESUME_BUCKET = process.env.SUPABASE_RESUME_BUCKET || 'resumes';

async function getSupabaseAdmin() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Safe, unique object key: uuid-prefixed, filename sanitized (§6.4). */
export function buildObjectKey(originalName: string): string {
  const safe = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `resumes/${Date.now()}-${safe}`;
}

/** Uploads bytes to the private cloud bucket. Throws on failure (no fakes). */
export async function putObject(buffer: Buffer, objectKey: string, contentType: string): Promise<StoredFile> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Cloud storage is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. ' +
        'Resume files must not be stored on the local machine.'
    );
  }
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase.storage.from(RESUME_BUCKET).upload(objectKey, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`Cloud storage upload failed: ${error.message}`);
  return { reference: `supabase:${RESUME_BUCKET}:${objectKey}`, backend: 'supabase' };
}

export interface FetchedObject {
  bytes: Buffer;
  contentType: string;
}

/** Reads an object by its stored reference (cloud or legacy local row). */
export async function getObject(reference: string): Promise<FetchedObject> {
  if (reference.startsWith('supabase:')) {
    const parts = reference.split(':');
    // supabase:<bucket>:<key...>
    const bucket = parts[1];
    const objectKey = parts.slice(2).join(':');
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase.storage.from(bucket).download(objectKey);
    if (error || !data) {
      throw new Error(`Cloud storage download failed: ${error?.message ?? 'object not found'}`);
    }
    const bytes = Buffer.from(await data.arrayBuffer());
    return { bytes, contentType: data.type || contentTypeFromKey(objectKey) };
  }

  // Legacy local row (pre-cloud uploads). Kept so historical records stay
  // downloadable, with the same path-traversal guard as before.
  const fs = await import('fs/promises');
  const { isPathWithinUploads } = await import('@/lib/validation');
  const filePath = path.isAbsolute(reference)
    ? reference
    : path.resolve(process.cwd(), reference);
  if (!isPathWithinUploads(filePath)) {
    throw new Error('Invalid file reference');
  }
  const bytes = await fs.readFile(filePath);
  return { bytes, contentType: contentTypeFromKey(filePath) };
}

/** Deletes an object by its stored reference. Missing objects resolve silently. */
export async function deleteObject(reference: string): Promise<void> {
  if (reference.startsWith('supabase:')) {
    const parts = reference.split(':');
    const bucket = parts[1];
    const objectKey = parts.slice(2).join(':');
    const supabase = await getSupabaseAdmin();
    const { error } = await supabase.storage.from(bucket).remove([objectKey]);
    if (error) throw new Error(`Cloud storage delete failed: ${error.message}`);
    return;
  }

  // Legacy local row.
  const fs = await import('fs/promises');
  const { isPathWithinUploads } = await import('@/lib/validation');
  const filePath = path.isAbsolute(reference)
    ? reference
    : path.resolve(process.cwd(), reference);
  if (!isPathWithinUploads(filePath)) return;
  await fs.unlink(filePath).catch(() => undefined);
}

export function contentTypeFromKey(key: string): string {
  const extension = path.extname(key).toLowerCase();
  if (extension === '.pdf') return 'application/pdf';
  if (extension === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (extension === '.md') return 'text/markdown; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

/**
 * Reads the stored document bytes for processing (worker/extraction).
 * Works for both cloud and legacy references.
 */
export async function readForProcessing(reference: string): Promise<Buffer> {
  const { bytes } = await getObject(reference);
  return bytes;
}
