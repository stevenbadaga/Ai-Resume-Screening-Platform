import { createHash, randomBytes } from 'crypto';

/**
 * Email verification (spec §6.1: only valid email addresses may be used for
 * signup/login). DNS checks prove a domain can receive mail; they cannot prove
 * a specific mailbox exists or is controlled by the registrant. A verification
 * link does both.
 *
 * Same threat model as password reset: tokens are random 32-byte values
 * delivered by email, only the SHA-256 hash is stored, links are single-use
 * and expire after 24 hours.
 */

export const EMAIL_VERIFICATION_TOKEN_TTL_MINUTES = 60 * 24; // 24 hours

/** Domains that exist only to generate throwaway inboxes (blocklist, not a full DMARC solution). */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'sharklasers.com',
  'grr.la',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
  'trashmail.com',
  'getnada.com',
  'dispostable.com',
  'maildrop.cc',
  'throwawaymail.com',
  'fakeinbox.com',
  'spam4.me',
  'mytemp.email',
  'mohmal.com',
  'emailondeck.com',
  'moakt.com',
  'tmpmail.org',
]);

export function isDisposableEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

export function generateVerificationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('hex');
  return { token, tokenHash: hashVerificationToken(token) };
}

export function hashVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
