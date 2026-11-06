import { createHash, randomBytes } from 'crypto';

/**
 * Password reset tokens (spec §6.1: "password reset" must be supported).
 *
 * Tokens are random 32-byte values delivered by email. Only a SHA-256 hash is
 * stored, so a database leak does not expose usable reset links. Tokens are
 * single-use (deleted on consume) and expire after 30 minutes.
 */

export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('hex');
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function buildResetEmailBody(resetUrl: string): string {
  return [
    '<p>Hello,</p>',
    '<p>We received a request to reset your RecruitAI account password.</p>',
    `<p><a href="${resetUrl}">Click here to choose a new password</a>.</p>`,
    '<p>This link expires in 30 minutes and can only be used once. ',
    'If you did not request a reset, you can safely ignore this email.</p>',
  ].join('\n');
}
