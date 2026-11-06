import { describe, it, expect } from 'vitest';
import { resolveSignupRole } from '@/lib/signupRoles';

describe('public signup role policy', () => {
  it('always creates applicant accounts as Candidates', () => {
    expect(resolveSignupRole('candidate')).toBe('Candidate');
    expect(resolveSignupRole({ accountType: 'candidate', foundedOrg: false })).toBe('Candidate');
  });

  it('assigns Admin to staff founding a new workspace', () => {
    expect(resolveSignupRole({ accountType: 'worker', foundedOrg: true })).toBe('Admin');
  });

  it('assigns Recruiter to staff joining an existing workspace', () => {
    expect(resolveSignupRole({ accountType: 'worker', foundedOrg: false })).toBe('Recruiter');
    expect(resolveSignupRole('worker')).toBe('Recruiter');
  });
});
