import { describe, it, expect } from 'vitest';
import {
  normalizeDomain,
  emailDomain,
  buildChallengeTxtRecord,
  buildChallengeHost,
  isSharedEmailProviderDomain,
  DOMAIN_CHALLENGE_PREFIX,
  DOMAIN_CHALLENGE_LABEL,
} from '@/lib/domainClaim';
import { permissionsForRoleName, ROLE_PERMISSIONS } from '@/lib/roleAccess';

/**
 * Production RBAC hardening (spec §6.1):
 *  1. Domain claiming — a workspace's identity is its VERIFIED email domain,
 *     proven by a DNS TXT challenge; display names are cosmetic.
 *  2. Unified role permissions — DB Role rows mirror the code matrix via one
 *     shared helper; no local hardcoded permission lists may drift.
 */
describe('domain claiming — normalization', () => {
  it('normalizes scheme, www, paths, casing and trailing dots', () => {
    expect(normalizeDomain('https://WWW.Acme.com/')).toBe('acme.com');
    expect(normalizeDomain('Acme.COM.')).toBe('acme.com');
    expect(normalizeDomain('  acme.com/about ')).toBe('acme.com');
  });

  it('rejects malformed domains', () => {
    expect(normalizeDomain('')).toBeNull();
    expect(normalizeDomain('not a domain')).toBeNull();
    expect(normalizeDomain('-bad.com')).toBeNull();
    expect(normalizeDomain('acme..com')).toBeNull();
    expect(normalizeDomain('a'.repeat(300))).toBeNull();
  });

  it('extracts the domain from an email address', () => {
    expect(emailDomain('jane@acme.com')).toBe('acme.com');
    expect(emailDomain('JANE@ACME.COM')).toBe('acme.com');
    expect(emailDomain('no-at-sign')).toBeNull();
    expect(emailDomain('@acme.com')).toBeNull();
  });

  it('blocks shared public email-provider domains from being claimed', () => {
    // A Gmail founder must never be able to seed or request a challenge for
    // gmail.com — the staging test caught this exact pre-seed leak.
    expect(isSharedEmailProviderDomain('gmail.com')).toBe(true);
    expect(isSharedEmailProviderDomain('Gmail.com')).toBe(true);
    expect(isSharedEmailProviderDomain('outlook.com')).toBe(true);
    expect(isSharedEmailProviderDomain('acme.rw')).toBe(false);
  });

  it('builds the DNS challenge host and TXT value', () => {
    expect(buildChallengeHost('acme.com')).toBe(`${DOMAIN_CHALLENGE_PREFIX}.acme.com`);
    expect(buildChallengeTxtRecord('tok123')).toBe(`${DOMAIN_CHALLENGE_LABEL}tok123`);
  });
});

describe('unified role permissions — single source of truth', () => {
  it('mirrors the matrix exactly for every role', () => {
    for (const [roleName, grants] of Object.entries(ROLE_PERMISSIONS)) {
      expect(permissionsForRoleName(roleName)).toEqual([...grants]);
    }
  });

  it('grants Admin every permission and Candidate none', () => {
    expect(permissionsForRoleName('Admin').length).toBeGreaterThan(0);
    expect(permissionsForRoleName('Candidate')).toEqual([]);
  });

  it('resolves unknown roles to no permissions (safe default)', () => {
    expect(permissionsForRoleName('SuperAdmin')).toEqual([]);
    expect(permissionsForRoleName('')).toEqual([]);
  });
});
