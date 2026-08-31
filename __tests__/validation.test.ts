import { describe, expect, it } from 'vitest';
import { signupSchema } from '@/lib/validation';

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
