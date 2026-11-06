import { createHash, randomBytes } from 'crypto';
import { resolveTxt } from 'dns/promises';

/**
 * Organization domain claiming (spec §6.1 hardening for the workspace-founder
 * Admin bootstrap).
 *
 * A workspace's identity is its verified email domain; the display name is
 * cosmetic. Verification uses a DNS TXT challenge: the Admin publishes
 * `recruitai-verify=<token>` at `_recruitai-challenge.<domain>` — proving
 * control of the domain's DNS without any traffic interception risk (the
 * token itself is not a secret worth protecting; the *response* containing
 * it is what proves control).
 *
 * Rules enforced here:
 *  - A domain can be claimed by at most one workspace (DB unique index).
 *  - Shared public email-provider domains (gmail.com, outlook.com, …) can
 *    never be claimed — they are namespaces owned by other companies.
 *  - Ownership of any other domain is proven exclusively by the DNS TXT
 *    challenge; the claimant's own email address is guidance, not proof.
 *  - One workspace may hold at most one verified domain.
 */

export const DOMAIN_CHALLENGE_PREFIX = '_recruitai-challenge';
export const DOMAIN_CHALLENGE_LABEL = 'recruitai-verify=';

/** Normalizes a domain for comparison: lowercase, no scheme, no trailing dot. */
export function normalizeDomain(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.length > 253) return null;
  const cleaned = trimmed
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .replace(/\.$/, '');
  // Must be a plausible hostname: letters/digits/hyphens with dots, no spaces.
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/** Extracts the email domain from an address, or null if malformed. */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at <= 0 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

/**
 * Shared/public email-provider domains. These are namespaces owned by other
 * companies — no tenant may ever claim them as a workspace identity, no
 * matter what email address they hold. (An earlier design required the
 * Admin's email to be at the claimed domain, but that check was both too
 * weak — it allowed claiming gmail.com with a Gmail address — and too strict
 * — it blocked legitimate claims where the admin's mailbox is elsewhere,
 * e.g. a founder testing on a free subdomain. DNS TXT is the actual proof;
 * this denylist handles the shared-namespace abuse case.)
 */
export const SHARED_EMAIL_PROVIDER_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'ymail.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'yandex.com',
  'yandex.ru',
  'zoho.com',
  'gmx.com',
  'gmx.de',
  'mail.ru',
  'hey.com',
  'fastmail.com',
]);

export function isSharedEmailProviderDomain(domain: string): boolean {
  return SHARED_EMAIL_PROVIDER_DOMAINS.has(domain.toLowerCase());
}

export function generateDomainClaimToken(): string {
  return randomBytes(24).toString('hex');
}

/** The exact TXT record the Admin must publish, for UI display. */
export function buildChallengeTxtRecord(token: string): string {
  return `${DOMAIN_CHALLENGE_LABEL}${token}`;
}

/** The FQDN the TXT record must be published at, for UI display. */
export function buildChallengeHost(domain: string): string {
  return `${DOMAIN_CHALLENGE_PREFIX}.${domain}`;
}

/**
 * Queries DNS for the challenge record and checks the token.
 * Returns false on any DNS failure (NXDOMAIN, timeout, no matching record).
 */
export async function verifyDomainChallenge(domain: string, token: string): Promise<boolean> {
  let records: string[][];
  try {
    records = await resolveTxt(`${DOMAIN_CHALLENGE_PREFIX}.${domain}`);
  } catch {
    return false;
  }
  const expected = buildChallengeTxtRecord(token);
  // resolveTxt returns an array of chunks per record; join them per record.
  return records.some((chunks) => chunks.join('') === expected);
}

/** One-way reference hash for audit logging — never log the raw token. */
export function hashDomainClaimToken(token: string): string {
  return createHash('sha256').update(token).digest('hex').slice(0, 32);
}
