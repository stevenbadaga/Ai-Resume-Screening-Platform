import { describe, it, expect } from 'vitest';
import { resolveSignupRole } from '@/lib/signupRoles';

/**
 * RBAC bootstrap policy (the "workspace founder" model): the first staff
 * signup for a company name that does not exist yet becomes that workspace's
 * Admin; staff joining an existing workspace start as Recruiters; candidates
 * are always Candidates. Role is resolved server-side only — the client's
 * requested role is ignored.
 */
describe('resolveSignupRole — workspace founder RBAC bootstrap', () => {
  it('makes a staff signup that founds a new workspace the Admin', () => {
    expect(resolveSignupRole({ accountType: 'worker', foundedOrg: true })).toBe('Admin');
  });

  it('makes a staff signup joining an existing workspace a Recruiter', () => {
    expect(resolveSignupRole({ accountType: 'worker', foundedOrg: false })).toBe('Recruiter');
  });

  it('never grants Admin to candidates, even in a brand-new workspace', () => {
    expect(resolveSignupRole({ accountType: 'candidate', foundedOrg: true })).toBe('Candidate');
    expect(resolveSignupRole({ accountType: 'candidate', foundedOrg: false })).toBe('Candidate');
  });
});
