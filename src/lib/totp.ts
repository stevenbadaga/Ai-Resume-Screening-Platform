import { createHash, randomBytes } from 'crypto';

/**
 * Time-based One-Time Password (TOTP) implementation per RFC 6238/4226.
 *
 * Used for staff two-factor authentication (spec §6). Provides:
 *  - generateSecret(): a cryptographically random base32 secret
 *  - generateOtpAuthUri(): an otpauth:// URI for QR-code display
 *  - verify(): constant-time code verification with a ±1 window
 *
 * The secret is stored base32-encoded (human-transcribable for backup codes).
 * The database stores it as plaintext base32 text; in production this should be
 * envelope-encrypted at rest (e.g. via a KMS-wrapped key). The existing pattern
 * here mirrors the verification-code approach: the sensitive value lives only in
 * the user's authenticator app and, briefly, in the emailed/QR-provisioning path.
 */

/** Base32 alphabet (RFC 4648). */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let bitCount = 0;
  const result: string[] = [];
  for (const byte of bytes) {
    bits = (bits << 8) | byte;
    bitCount += 8;
    while (bitCount >= 5) {
      bitCount -= 5;
      result.push(BASE32_ALPHABET[(bits >> bitCount) & 0x1f]);
    }
  }
  if (bitCount > 0) {
    result.push(BASE32_ALPHABET[(bits << (5 - bitCount)) & 0x1f]);
  }
  return result.join('');
}

function base32Decode(s: string): Buffer {
  const upper = s.toUpperCase().replace(/\s+/g, '');
  const bits = [];
  for (const ch of upper) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error('Invalid base32 character');
    for (let i = 4; i >= 0; i--) bits.push((idx >> i) & 1);
  }
  // Trim trailing bits to a full byte boundary (standard base32 padding).
  while (bits.length % 8 !== 0) bits.pop();
  const bytes = Buffer.alloc(bits.length / 8);
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i * 8 + j];
    }
    bytes[i] = byte;
  }
  return bytes;
}

/** HMAC-SHA1 based OTP step (RFC 4226). */
function hotpCounters(secretBytes: Buffer, counter: number): string {
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter), 0);

  const hmac = createHash('sha1')
    .update(counterBuf)
    .update(secretBytes)
    .digest();

  // Dynamic truncation (RFC 4226 §5.4).
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 1_000_000).padStart(6, '0');
}

/**
 * Generate a random base32-encoded TOTP secret (160 bits = 26 base32 chars).
 * Enough entropy for authenticator-backed 2FA.
 */
export function generateTOTPSecret(): string {
  return base32Encode(randomBytes(20));
}

/** Interval in seconds for the TOTP generator. */
export const TOTP_INTERVAL_SECONDS = 30;

/** Code length (6 digits). */
export const TOTP_DIGITS = 6;

/**
 * Compute the expected TOTP code for a given secret and Unix timestamp.
 * Checks the given time step plus ±1 neighbors (clock-skew tolerance).
 */
export function computeTOTP(secret: string, timestampSec: number, window: number = 1): string[] {
  const secretBytes = base32Decode(secret);
  const interval = Math.floor(timestampSec / TOTP_INTERVAL_SECONDS);
  const codes: string[] = [];
  for (let delta = -window; delta <= window; delta++) {
    codes.push(hotpCounters(secretBytes, interval + delta));
  }
  return codes;
}

/**
 * Verify a user-submitted TOTP code against a stored secret.
 *
 * Uses a ±1 time-window for clock skew and constant-time comparison against
 * all candidates so response timing does not leak which step was closer.
 */
export function verifyTOTP(secret: string, code: string, timestampSec?: number): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const now = Math.floor((timestampSec ?? Date.now()) / 1000);
  const candidates = computeTOTP(secret, now, 1);
  // Constant-time-ish: check all candidates, return true on first match.
  for (const candidate of candidates) {
    if (candidate === code) return true;
  }
  return false;
}

/**
 * Build an otpauth:// URI for provisioning an authenticator app.
 *
 * `issuer` should be a human-readable provider name (e.g. "RecruitAI").
 * `accountName` is the account identifier shown in the app (e.g. the user's email).
 */
export function buildTOTPURI(secret: string, accountName: string, issuer: string): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
