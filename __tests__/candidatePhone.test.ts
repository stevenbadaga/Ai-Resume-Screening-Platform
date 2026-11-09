import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import type { IntakeInput } from '@/lib/intakeService';

describe('Candidate Phone Support & 1-Click Apply Flow', () => {
  const profilePhoneSchema = z.object({
    name: z.string().trim().min(1).max(200).optional(),
    phone: z.string().trim().max(50).optional().nullable(),
    skills: z.unknown().optional(),
    experience: z.unknown().optional(),
  });

  it('validates and accepts valid phone numbers in candidate profile', () => {
    const validProfiles = [
      { name: 'Alice Smith', phone: '+1 (555) 234-5678' },
      { name: 'Bob Jones', phone: '0788123456' },
      { name: 'Charlie', phone: null },
      { name: 'Dana', phone: undefined },
    ];

    for (const p of validProfiles) {
      const parsed = profilePhoneSchema.safeParse(p);
      expect(parsed.success).toBe(true);
      if (parsed.success && p.phone) {
        expect(parsed.data.phone).toBe(p.phone.trim());
      }
    }
  });

  it('rejects phone numbers that exceed 50 characters', () => {
    const oversized = { name: 'Eve', phone: '+1' + '0'.repeat(60) };
    const parsed = profilePhoneSchema.safeParse(oversized);
    expect(parsed.success).toBe(false);
  });

  it('resolves effective phone correctly in 1-click apply priority waterfall', () => {
    function resolveEffectivePhone(params: {
      formPhone?: string | null;
      candidateProfilePhone?: string | null;
      userAccountPhone?: string | null;
    }) {
      return (
        params.formPhone?.trim() ||
        params.candidateProfilePhone?.trim() ||
        params.userAccountPhone?.trim() ||
        null
      );
    }

    // Case 1: 1-Click Apply with phone saved on candidate profile
    expect(
      resolveEffectivePhone({
        formPhone: null,
        candidateProfilePhone: '+1 (555) 987-6543',
        userAccountPhone: null,
      })
    ).toBe('+1 (555) 987-6543');

    // Case 2: 1-Click Apply with phone on User account fallback
    expect(
      resolveEffectivePhone({
        formPhone: null,
        candidateProfilePhone: null,
        userAccountPhone: '+1 (555) 111-2222',
      })
    ).toBe('+1 (555) 111-2222');

    // Case 3: Explicit form input overrides saved profile
    expect(
      resolveEffectivePhone({
        formPhone: '+1 (555) 999-0000',
        candidateProfilePhone: '+1 (555) 987-6543',
        userAccountPhone: '+1 (555) 111-2222',
      })
    ).toBe('+1 (555) 999-0000');

    // Case 4: No phone provided anywhere returns null
    expect(
      resolveEffectivePhone({
        formPhone: null,
        candidateProfilePhone: null,
        userAccountPhone: null,
      })
    ).toBe(null);
  });

  it('supports phone field in IntakeInput contract', () => {
    const intakePayload: IntakeInput = {
      jobId: 'job-123',
      firstName: 'Alice',
      lastName: 'Applicant',
      email: 'alice@example.com',
      phone: '+1 (555) 333-4444',
      consentGiven: true,
      file: null,
    };

    expect(intakePayload.phone).toBe('+1 (555) 333-4444');
  });
});

