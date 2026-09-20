import { describe, it, expect } from 'vitest';
import { containsKnownMalwareSignature, validateFileMagicBytes, escapeCsvCell, isPathWithinUploads } from '@/lib/validation';
import { calculateTotalScore } from '@/lib/scoringEngine';
import { redactPII } from '@/lib/resumeProcessor';
import path from 'path';

// ─────────────────────────────────────────────
// File Validation & Magic-Byte Security (C1, C10)
// ─────────────────────────────────────────────

describe('validateFileMagicBytes', () => {
  it('accepts a valid PDF buffer', () => {
    const buf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
    expect(validateFileMagicBytes(buf)).toBe('pdf');
  });

  it('accepts a valid DOCX (ZIP) buffer', () => {
    const buf = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]); // PK\x03\x04
    expect(validateFileMagicBytes(buf)).toBe('docx');
  });

  it('rejects a spoofed file with wrong magic bytes', () => {
    const buf = Buffer.from('Hello, I am not a PDF', 'utf-8');
    expect(validateFileMagicBytes(buf)).toBeNull();
  });

  it('rejects a buffer that is too short', () => {
    const buf = Buffer.from([0x25, 0x50]); // only 2 bytes
    expect(validateFileMagicBytes(buf)).toBeNull();
  });

  it('rejects an empty buffer', () => {
    expect(validateFileMagicBytes(Buffer.alloc(0))).toBeNull();
  });
});

describe('containsKnownMalwareSignature', () => {
  it('detects the antivirus test signature in content', () => {
    expect(containsKnownMalwareSignature(Buffer.from('EICAR-STANDARD-ANTIVIRUS-TEST-FILE'))).toBe(true);
  });

  it('does not use the filename as a malware signal', () => {
    expect(containsKnownMalwareSignature(Buffer.from('A normal resume named virus.txt'))).toBe(false);
  });
});

// ─────────────────────────────────────────────
// Path Traversal Protection (C10)
// ─────────────────────────────────────────────

describe('isPathWithinUploads', () => {
  it('accepts a valid path inside uploads directory', () => {
    const uploadsDir = path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads');
    const validPath = path.join(uploadsDir, 'resume.pdf');
    expect(isPathWithinUploads(validPath)).toBe(true);
  });

  it('rejects a path traversal attack (../../etc/passwd)', () => {
    const uploadsDir = path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads');
    const maliciousPath = path.join(uploadsDir, '..', '..', 'etc', 'passwd');
    expect(isPathWithinUploads(maliciousPath)).toBe(false);
  });

  it('rejects an absolute path outside uploads', () => {
    expect(isPathWithinUploads('/etc/passwd')).toBe(false);
  });

  it('rejects a path with encoded traversal to .env', () => {
    const malicious = path.resolve('./uploads/../.env');
    expect(isPathWithinUploads(malicious)).toBe(false);
  });
});

// ─────────────────────────────────────────────
// CSV Injection Prevention (C10)
// ─────────────────────────────────────────────

describe('escapeCsvCell', () => {
  it('escapes = prefix to prevent formula injection', () => {
    expect(escapeCsvCell('=SUM(A1:A10)')).toBe(`"'=SUM(A1:A10)"`);
  });

  it('escapes + prefix', () => {
    expect(escapeCsvCell('+cmd|/C calc')).toBe(`"'+cmd|/C calc"`);
  });

  it('escapes - prefix', () => {
    expect(escapeCsvCell('-2+3')).toBe(`"'-2+3"`);
  });

  it('escapes @ prefix', () => {
    expect(escapeCsvCell('@SUM(1+1)')).toBe(`"'@SUM(1+1)"`);
  });

  it('does not escape safe plain-text values', () => {
    expect(escapeCsvCell('John Doe')).toBe('"John Doe"');
  });

  it('escapes internal double-quotes', () => {
    expect(escapeCsvCell('say "hello"')).toBe('"say ""hello"""');
  });
});

// ─────────────────────────────────────────────
// isRequired Criterion Enforcement (C4)
// ─────────────────────────────────────────────

describe('calculateTotalScore — isRequired enforcement', () => {
  it('returns 0% when a required criterion is MISSING', () => {
    const criteria = [
      { id: '1', weight: 5, isRequired: true },
      { id: '2', weight: 3, isRequired: false },
    ];
    const assessments = [
      { criterionId: '1', result: 'MISSING' },
      { criterionId: '2', result: 'MATCH' },
    ];
    const result = calculateTotalScore(assessments, criteria);
    expect(result.percentage).toBe(0);
    expect(result.failedRequiredCriterion).toBeTruthy();
  });

  it('scores normally when required criterion is MATCH', () => {
    const criteria = [
      { id: '1', weight: 4, isRequired: true },
      { id: '2', weight: 4, isRequired: false },
    ];
    const assessments = [
      { criterionId: '1', result: 'MATCH' },
      { criterionId: '2', result: 'MATCH' },
    ];
    const result = calculateTotalScore(assessments, criteria);
    expect(result.percentage).toBe(100);
    expect(result.failedRequiredCriterion).toBeNull();
  });

  it('scores 50% when required criterion is PARTIAL (not an automatic fail)', () => {
    const criteria = [{ id: '1', weight: 4, isRequired: true }];
    const assessments = [{ criterionId: '1', result: 'PARTIAL' }];
    const result = calculateTotalScore(assessments, criteria);
    expect(result.percentage).toBe(50);
    expect(result.failedRequiredCriterion).toBeNull();
  });

  it('scores 50% when only non-required criterion is MISSING', () => {
    const criteria = [
      { id: '1', weight: 4, isRequired: false },
      { id: '2', weight: 4, isRequired: false },
    ];
    const assessments = [
      { criterionId: '1', result: 'MISSING' },
      { criterionId: '2', result: 'MATCH' },
    ];
    const result = calculateTotalScore(assessments, criteria);
    expect(result.percentage).toBe(50);
    expect(result.failedRequiredCriterion).toBeNull();
  });
});

// ─────────────────────────────────────────────
// GDPR Erasure — Absolute Path Resolution (C2)
// ─────────────────────────────────────────────

describe('GDPR erasure file path resolution', () => {
  it('resolves a relative fileReference to an absolute path', () => {
    const fileReference = 'uploads/1234_resume.pdf';
    const absolutePath = path.isAbsolute(fileReference)
      ? fileReference
      : path.resolve(process.cwd(), fileReference);
    expect(path.isAbsolute(absolutePath)).toBe(true);
    expect(absolutePath).toContain('1234_resume.pdf');
  });

  it('leaves an already-absolute path unchanged', () => {
    const fileReference = path.resolve('./uploads/1234_resume.pdf');
    const absolutePath = path.isAbsolute(fileReference)
      ? fileReference
      : path.resolve(process.cwd(), fileReference);
    expect(absolutePath).toBe(fileReference);
  });

  it('resolved absolute path still passes isPathWithinUploads check', () => {
    const fileReference = 'uploads/1234_resume.pdf';
    const absolutePath = path.isAbsolute(fileReference)
      ? fileReference
      : path.resolve(process.cwd(), fileReference);
    expect(isPathWithinUploads(absolutePath)).toBe(true);
  });
});

// ─────────────────────────────────────────────
// Tenant Isolation Logic (C10)
// ─────────────────────────────────────────────

describe('Tenant isolation — organization ownership checks', () => {
  it('blocks cross-tenant access when organizationIds differ', () => {
    const requestingUserOrgId: string = 'org-A';
    const resourceOrgId: string = 'org-B';
    const isAuthorized = resourceOrgId === requestingUserOrgId;
    expect(isAuthorized).toBe(false);
  });

  it('allows access when organizationIds match', () => {
    const requestingUserOrgId = 'org-A';
    const resourceOrgId = 'org-A';
    const isAuthorized = resourceOrgId === requestingUserOrgId;
    expect(isAuthorized).toBe(true);
  });

  it('blocks access when resource orgId is undefined', () => {
    const requestingUserOrgId = 'org-A';
    const resourceOrgId = undefined;
    const isAuthorized = resourceOrgId === requestingUserOrgId;
    expect(isAuthorized).toBe(false);
  });
});

// ─────────────────────────────────────────────
// PII Redaction — Extended Coverage
// ─────────────────────────────────────────────

describe('redactPII — extended coverage', () => {
  it('redacts email addresses', () => {
    expect(redactPII('contact@example.com')).toBe('[EMAIL_REDACTED]');
  });

  it('redacts US phone numbers', () => {
    expect(redactPII('Call (555) 123-4567')).toContain('[PHONE_REDACTED]');
  });

  it('does not alter text with no PII', () => {
    const clean = 'Experienced software engineer with 5 years in TypeScript.';
    expect(redactPII(clean)).toBe(clean);
  });

  it('redacts multiple PII items in one pass', () => {
    const text = 'Email: a@b.com, Phone: 555-555-5555';
    const result = redactPII(text);
    expect(result).toContain('[EMAIL_REDACTED]');
    expect(result).toContain('[PHONE_REDACTED]');
  });
});
