import { describe, expect, it } from 'vitest';
import {
  signupSchema,
  stageChangeSchema,
  createJobSchema,
} from '@/lib/validation';

describe('signup validation', () => {
  it('normalizes valid email addresses', () => {
    const result = signupSchema.parse({
      name: 'Test User',
      email: '  USER@example.com ',
      password: 'secure-password',
      accountType: 'candidate',
    });

    expect(result.email).toBe('user@example.com');
  });

  it('rejects malformed email addresses', () => {
    const result = signupSchema.safeParse({
      name: 'Test User',
      email: 'not-an-email',
      password: 'secure-password',
      accountType: 'candidate',
    });

    expect(result.success).toBe(false);
  });

  it('rejects passwords shorter than eight characters', () => {
    const result = signupSchema.safeParse({
      name: 'Test User',
      email: 'user@example.com',
      password: 'short',
      accountType: 'candidate',
    });

    expect(result.success).toBe(false);
  });
});

describe('stage change validation (§6.3/§6.7 decision trail)', () => {
  it('requires a reason for stage changes', () => {
    const result = stageChangeSchema.safeParse({
      applicationId: '5f0b3f1e-2b6f-4a3a-9f0e-1c2d3e4f5a6b',
      newStage: 'SHORTLISTED',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a stage change with a reason', () => {
    const result = stageChangeSchema.safeParse({
      applicationId: '5f0b3f1e-2b6f-4a3a-9f0e-1c2d3e4f5a6b',
      newStage: 'SHORTLISTED',
      reason: 'Strong evidence for all required criteria',
    });

    expect(result.success).toBe(true);
  });
});

describe('job creation validation (§6.2 requisition fields)', () => {
  it('accepts location, employment type, and application window', () => {
    const result = createJobSchema.safeParse({
      title: 'Backend Engineer',
      department: 'Engineering',
      location: 'Kigali / Remote',
      employmentType: 'Full-time',
      closesAt: '2026-12-31T00:00:00.000Z',
      description: 'Build APIs.',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.location).toBe('Kigali / Remote');
      expect(result.data.employmentType).toBe('Full-time');
      expect(result.data.closesAt).toBeInstanceOf(Date);
    }
  });

  it('still requires title and department', () => {
    const result = createJobSchema.safeParse({
      description: 'No title.',
    });

    expect(result.success).toBe(false);
  });
});
