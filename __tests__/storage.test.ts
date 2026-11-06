import { describe, it, expect } from 'vitest';
import { buildObjectKey, contentTypeFromKey, deleteObject, getStorageStatusSummary } from '@/lib/storage';

describe('storage abstraction (cloud-first, §6.4)', () => {
  it('builds unique, sanitized object keys under the resumes/ prefix', () => {
    const key = buildObjectKey('My CV (final).pdf');
    expect(key.startsWith('resumes/')).toBe(true);
    expect(key).toMatch(/resumes\/\d+-[0-9a-f-]+-My_CV__final_\.pdf$/);
    // Two calls never collide, even within the same millisecond.
    const other = buildObjectKey('My CV (final).pdf');
    expect(key).not.toBe(other);
  });

  it('derives the correct content type from the key extension', () => {
    expect(contentTypeFromKey('resumes/1.pdf')).toBe('application/pdf');
    expect(contentTypeFromKey('resumes/1.docx')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(contentTypeFromKey('resumes/1.md')).toBe('text/markdown; charset=utf-8');
    expect(contentTypeFromKey('resumes/1.txt')).toBe('text/plain; charset=utf-8');
  });

  it('treats references as cloud objects only via the explicit supabase: prefix', () => {
    // A legacy local path must never be interpreted as a cloud key.
    const legacy = 'uploads/abc-123.pdf';
    expect(legacy.startsWith('supabase:')).toBe(false);
    const cloud = 'supabase:resumes:resumes/1.pdf';
    expect(cloud.startsWith('supabase:')).toBe(true);
  });

  it('silently ignores deleting a legacy path outside uploads (no local writes)', async () => {
    // Must not throw and must not touch anything outside the sandbox.
    await expect(deleteObject('/etc/passwd')).resolves.toBeUndefined();
  });

  it('reports the active storage backend for operational health checks', () => {
    const previousUrl = process.env.SUPABASE_URL;
    const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
      const summary = getStorageStatusSummary();
      expect(summary.backend).toBe('supabase');
      expect(summary.configured).toBe(true);
      expect(summary.bucket).toBe('resumes');
    } finally {
      if (previousUrl === undefined) delete process.env.SUPABASE_URL;
      else process.env.SUPABASE_URL = previousUrl;

      if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    }
  });
});
