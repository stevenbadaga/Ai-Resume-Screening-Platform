import { z } from 'zod/v4';
import { NextResponse } from 'next/server';

// ──────────────────────────────────────────────
// Reusable primitives
// ──────────────────────────────────────────────

const emailSchema = z.string().trim().pipe(z.email()).transform((v) => v.toLowerCase());
const nonEmptyString = z.string().min(1);
const uuidSchema = z.string().uuid();

// ──────────────────────────────────────────────
// Auth schemas
// ──────────────────────────────────────────────

export const signupSchema = z.object({
  name: z.string().min(1, 'Full name is required').max(200),
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  accountType: z.enum(['candidate', 'worker']).default('candidate'),
  companyName: z.string().max(200).optional(),
  // role is intentionally NOT accepted from the client — enforced server-side
});

// ──────────────────────────────────────────────
// Jobs schemas
// ──────────────────────────────────────────────

export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  department: z.string().min(1, 'Department is required').max(200),
  description: z.string().max(10000).optional(),
  criteria: z.array(z.object({
    category: z.string().max(200).optional(),
    description: z.string().min(1).max(2000),
    weight: z.coerce.number().int().min(1).max(10).optional(),
  })).max(50).optional().default([]),
});

// ──────────────────────────────────────────────
// Decisions schemas
// ──────────────────────────────────────────────

export const decisionSchema = z.object({
  applicationId: uuidSchema,
  decision: z.enum(['ADVANCED', 'REJECTED']),
  rationale: z.string().min(1, 'Rationale is required').max(5000),
});

export const decisionOverrideSchema = z.discriminatedUnion('_type', [
  z.object({
    _type: z.literal('score'),
    applicationId: uuidSchema,
    newScore: z.coerce.number().min(0).max(100).optional(),
    reason: z.string().max(5000).optional(),
    rationale: z.string().max(5000).optional(),
    // unused but accepted for compat
    assessmentId: z.string().optional(),
    newResult: z.string().optional(),
  }),
  z.object({
    _type: z.literal('criterion'),
    assessmentId: uuidSchema,
    newResult: z.string().min(1).max(200),
    rationale: z.string().min(1, 'Rationale is required').max(5000),
    // unused but accepted for compat
    applicationId: z.string().optional(),
    newScore: z.number().optional(),
    reason: z.string().optional(),
  }),
]);

// Since the frontend won't send _type, we pre-process:
export const overrideBodySchema = z.object({
  assessmentId: z.string().optional(),
  newResult: z.string().optional(),
  rationale: z.string().max(5000).optional(),
  applicationId: z.string().optional(),
  newScore: z.coerce.number().min(0).max(100).optional(),
  reason: z.string().max(5000).optional(),
}).refine(
  (d) => (d.applicationId && (d.newScore !== undefined || d.reason)) || (d.assessmentId && d.newResult && d.rationale),
  { message: 'Must provide either (applicationId + newScore/reason) or (assessmentId + newResult + rationale)' }
);

// ──────────────────────────────────────────────
// Privacy schemas
// ──────────────────────────────────────────────

export const privacyRequestSchema = z.object({
  email: emailSchema,
});

// ──────────────────────────────────────────────
// Candidate schemas
// ──────────────────────────────────────────────

export const stageChangeSchema = z.object({
  applicationId: uuidSchema,
  newStage: z.string().min(1).max(100),
  newStatus: z.string().max(100).optional(),
});

export const profileUpdateSchema = z.object({
  skills: z.unknown(), // JSON – passed through
  experience: z.unknown(), // JSON – passed through
});

export const offerSchema = z.object({
  salary: z.coerce.number().positive('Salary must be positive'),
  startDate: z.string().min(1, 'Start date is required'),
  equity: z.string().max(200).optional(),
  signingBonus: z.coerce.number().nonnegative().optional(),
  notes: z.string().max(5000).optional(),
});

// ──────────────────────────────────────────────
// Team schemas
// ──────────────────────────────────────────────

export const ALLOWED_ROLES = ['Admin', 'Recruiter', 'HiringManager', 'Interviewer', 'ComplianceAuditor', 'Candidate'] as const;

export const teamInviteSchema = z.object({
  email: emailSchema,
  roleName: z.enum(ALLOWED_ROLES),
});

export const teamRoleSchema = z.object({
  userId: uuidSchema,
  newRole: z.enum(ALLOWED_ROLES),
});

export const teamDeleteSchema = z.object({
  targetUserId: uuidSchema,
});

export const interviewScheduleSchema = z.object({
  scheduledAt: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(15).max(240),
  meetingType: z.enum(['Google Meet', 'Zoom', 'In-Person']),
});

// ──────────────────────────────────────────────
// Notification schemas
// ──────────────────────────────────────────────

export const notificationPatchSchema = z.object({
  notificationId: z.string().uuid().optional(),
  markAll: z.boolean().optional(),
}).refine((d) => d.notificationId || d.markAll, { message: 'Must provide notificationId or markAll' });

// ──────────────────────────────────────────────
// Support schemas
// ──────────────────────────────────────────────

export const supportMessageSchema = z.object({
  message: z.string().max(10000).optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(10000),
  })).max(50).optional(),
  language: z.enum(['en', 'fr', 'es', 'de', 'rw']).optional().default('en'),
}).refine(
  (d) => d.message || (d.messages && d.messages.length > 0),
  { message: 'Either message or messages array is required' }
);

// ──────────────────────────────────────────────
// Validation helper
// ──────────────────────────────────────────────

/**
 * Parses request body against a Zod schema.
 * Returns `{ data, error }` — if `error` is set, return it as the API response.
 */
export function validateBody<T>(
  schema: z.ZodType<T>,
  body: unknown
): { data: T; error: null } | { data: null; error: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => i.message).join('; ');
    return {
      data: null,
      error: NextResponse.json(
        { error: `Validation failed: ${issues}` },
        { status: 400 }
      ),
    };
  }
  return { data: result.data, error: null };
}

// ──────────────────────────────────────────────
// File validation helpers
// ──────────────────────────────────────────────

/** PDF files start with "%PDF" */
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]);

/** DOCX (Office Open XML) files are ZIP archives starting with "PK\x03\x04" */
const DOCX_MAGIC = Buffer.from([0x50, 0x4B, 0x03, 0x04]);

/**
 * Validates that a file buffer matches the expected magic bytes for PDF or DOCX.
 * Returns the detected type or null if invalid.
 */
export function validateFileMagicBytes(buffer: Buffer): 'pdf' | 'docx' | null {
  if (buffer.length < 4) return null;
  const header = buffer.subarray(0, 4);
  if (header.compare(PDF_MAGIC) === 0) return 'pdf';
  if (header.compare(DOCX_MAGIC) === 0) return 'docx';
  return null;
}

// ──────────────────────────────────────────────
// CSV injection prevention
// ──────────────────────────────────────────────

/**
 * Escapes a CSV cell value to prevent formula injection.
 * If the value starts with =, +, -, @, \t, or \r, it is prefixed with a single quote.
 * The value is also wrapped in double-quotes with internal double-quotes escaped.
 */
export function escapeCsvCell(value: string): string {
  const DANGEROUS_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];
  let safe = value;
  if (DANGEROUS_PREFIXES.some((p) => safe.startsWith(p))) {
    safe = `'${safe}`;
  }
  // Escape internal double-quotes
  safe = safe.replace(/"/g, '""');
  return `"${safe}"`;
}

// ──────────────────────────────────────────────
// Safe redirect helper
// ──────────────────────────────────────────────

/**
 * Creates a redirect response to a relative path, preventing open redirect attacks.
 * Always constructs the URL from a hardcoded origin rather than trusting req.url.
 */
export function safeRedirect(path: string): NextResponse {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  // Ensure path is relative and doesn't contain protocol
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return NextResponse.redirect(new URL(safePath, baseUrl));
}

// ──────────────────────────────────────────────
// Path traversal prevention
// ──────────────────────────────────────────────

import path from 'path';

/**
 * Validates that a file path resolves within the allowed uploads directory.
 * Prevents path traversal attacks (e.g., ../../etc/passwd).
 */
export function isPathWithinUploads(filePath: string): boolean {
  const uploadsDir = path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads');
  const resolved = path.resolve(filePath);
  return resolved.startsWith(uploadsDir + path.sep) || resolved === uploadsDir;
}

// ──────────────────────────────────────────────
// Generic safe error response
// ──────────────────────────────────────────────

/**
 * Returns a sanitized 500 error response, never leaking internal error details.
 */
export function safeErrorResponse(message = 'Internal server error', status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
