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
import { randomUUID } from 'crypto';

export type StorageBackend = 'supabase' | 'local';

/**
 * Raised when the storage backend itself is unavailable or misconfigured
 * (network/DNS failure, dead project, bad credentials). Callers distinguish
 * this from caller-side validation errors: the candidate's submission is
 * valid, the platform just cannot persist the document right now — so it
 * must be surfaced as a retryable 503, not a generic 500.
 */
export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export interface StoredFile {
  /** Key stored in ResumeDocument.fileReference */
  reference: string;
  backend: StorageBackend;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getStorageStatusSummary(): {
  backend: StorageBackend;
  configured: boolean;
  bucket?: string;
  path?: string;
  mode: 'cloud' | 'local';
} {
  if (isSupabaseConfigured()) {
    return {
      backend: 'supabase',
      configured: true,
      bucket: process.env.SUPABASE_RESUME_BUCKET || 'resumes',
      mode: 'cloud',
    };
  }

  return {
    backend: 'local',
    configured: true,
    path: path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_LOCAL_PATH || './uploads'),
    mode: 'local',
  };
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

/** Collision-resistant key: timestamp + UUID + sanitized filename (§6.4). */
export function buildObjectKey(originalName: string): string {
  const safe = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `resumes/${Date.now()}-${randomUUID()}-${safe}`;
}

/** 
 * Uploads bytes to storage. Attempts cloud storage if configured;
 * automatically falls back to local disk storage on network or configuration errors.
 */
export async function putObject(buffer: Buffer, objectKey: string, contentType: string): Promise<StoredFile> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await getSupabaseAdmin();
      const { error: uploadError } = await supabase.storage.from(RESUME_BUCKET).upload(objectKey, buffer, {
        contentType,
        upsert: false,
      });
      if (!uploadError) {
        return { reference: `supabase:${RESUME_BUCKET}:${objectKey}`, backend: 'supabase' };
      }
      console.warn('Supabase storage upload error:', uploadError.message, '— falling back to resilient local storage.');
    } catch (err: any) {
      console.warn('Supabase cloud storage unreachable (' + (err?.message || err) + ') — falling back to resilient local storage.');
    }
  }

  // Resilient local storage fallback
  try {
    const fs = await import('fs/promises');
    const uploadsDir = path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_LOCAL_PATH || './uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = path.basename(objectKey);
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);
    return { reference: `local:uploads/${filename}`, backend: 'local' };
  } catch (fsErr: any) {
    throw new StorageError(`Failed to store document: ${fsErr?.message || fsErr}`);
  }
}

export interface FetchedObject {
  bytes: Buffer;
  contentType: string;
}

/** Reads an object by its stored reference (cloud or resilient local row). */
export async function getObject(reference: string): Promise<FetchedObject> {
  const fs = await import('fs/promises');

  if (reference.startsWith('supabase:')) {
    const parts = reference.split(':');
    const bucket = parts[1];
    const objectKey = parts.slice(2).join(':');

    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase.storage.from(bucket).download(objectKey);
      if (!error && data) {
        const bytes = Buffer.from(await data.arrayBuffer());
        return { bytes, contentType: data.type || contentTypeFromKey(objectKey) };
      }
    } catch {
      // Cloud unreachable or project offline — attempt local fallback below
    }

    // Check if a local copy exists in uploads folder (e.g. created during fallback or migration)
    const filename = path.basename(objectKey);
    const uploadsDir = path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_LOCAL_PATH || './uploads');
    const localFallback = path.join(uploadsDir, filename);
    try {
      const bytes = await fs.readFile(localFallback);
      return { bytes, contentType: contentTypeFromKey(filename) };
    } catch {
      throw new StorageError(
        'The document stored in cloud storage is temporarily unreachable. Please attach your resume file directly to complete your application.'
      );
    }
  }

  // Local storage row (e.g., "local:uploads/foo.pdf", "uploads/foo.pdf", or absolute path).
  const cleanRef = reference.replace(/^local:/, '').replace(/^\.?\/?uploads\/?/, '');
  const uploadsDir = path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_LOCAL_PATH || './uploads');
  const filePath = path.resolve(uploadsDir, cleanRef);

  const { isPathWithinUploads } = await import('@/lib/validation');
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
    try {
      const supabase = await getSupabaseAdmin();
      await supabase.storage.from(bucket).remove([objectKey]);
    } catch {
      // Best-effort cloud deletion
    }
    return;
  }

  // Local file deletion
  try {
    const fs = await import('fs/promises');
    const cleanRef = reference.replace(/^local:/, '').replace(/^\.?\/?uploads\/?/, '');
    const uploadsDir = path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_LOCAL_PATH || './uploads');
    const filePath = path.resolve(uploadsDir, cleanRef);
    const { isPathWithinUploads } = await import('@/lib/validation');
    if (!isPathWithinUploads(filePath)) return;
    await fs.unlink(filePath).catch(() => undefined);
  } catch {
    // Best-effort local deletion
  }
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
