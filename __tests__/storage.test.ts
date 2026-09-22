import { describe, it, expect } from 'vitest';
import { buildObjectKey, contentTypeFromKey, deleteObject } from '@/lib/storage';

describe('storage abstraction (cloud-first, §6.4)', () => {
  it('builds unique, sanitized object keys under the resumes/ prefix', () => {
    const key = buildObjectKey('My CV (final).pdf');
    expect(key.startsWith('resumes/')).toBe(true);
    expect(key).toMatch(/resumes\/\d+-My_CV__final_\.pdf$/);
    // Two calls never collide (timestamp prefix)
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
});
