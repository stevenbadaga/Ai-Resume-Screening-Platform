import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Honest email delivery — provider layer (spec §6.9):
 *  1. Provider failure hints — when Brevo/Resend rejects a send, the thrown
 *     error must contain an actionable hint (e.g. Brevo authorized-IPs) so
 *     failures like "IP not allowlisted" are discoverable from logs and
 *     Communication.failureInfo instead of looking like silent dead ends.
 *  2. Honest recording — sendRecordedEmail persists SENT/FAILED + failureInfo
 *     and never throws to the caller.
 */

import { sendRecordedEmail, sendTransactionalEmail } from '@/lib/emailService';
import prisma from '@/lib/prisma';

// The setup-file prisma mock has no communication.update — attach one.
const comm = prisma.communication as unknown as {
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};
if (!comm.update) comm.update = vi.fn();

/** Plain-object Response stand-in: sendTransactionalEmail only uses ok/status/json. */
function stubFetch(status: number, body: unknown): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const BASE_PAYLOAD = {
  to: 'user@example.com',
  template: 'EMAIL_VERIFICATION' as const,
  data: {},
};

beforeEach(() => {
  vi.clearAllMocks();
  comm.create.mockReset().mockResolvedValue({ id: 'comm-test-1' });
  comm.update.mockReset().mockResolvedValue({});
  // Deterministic provider selection regardless of ambient .env
  vi.stubEnv('BREVO_API_KEY', '');
  vi.stubEnv('RESEND_API_KEY', '');
  vi.stubEnv('EMAIL_FROM', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// ─────────────────────────────────────────────
// Provider failure hints (sendTransactionalEmail)
// ─────────────────────────────────────────────
describe('sendTransactionalEmail — provider failure hints', () => {
  it('rejects when no email provider is configured (loud config error, not silent)', async () => {
    await expect(sendTransactionalEmail(BASE_PAYLOAD)).rejects.toThrow(
      /No email provider configured/
    );
  });

  it('Brevo 401 with IP rejection appends the authorized-IPs hint', async () => {
    vi.stubEnv('BREVO_API_KEY', 'xkeysib-test-key');
    vi.stubEnv('EMAIL_FROM', 'recruitai250@gmail.com');
    stubFetch(401, {
      message:
        'We have detected you are using an unrecognised IP address 2c0f:eb68::1. If you performed this action make sure to add the new IP address in this link: https://app.brevo.com/security/authorised_ips',
      code: 'unauthorized',
    });

    // The real-world failure observed on staging: an unauthorized egress IP.
    await expect(sendTransactionalEmail(BASE_PAYLOAD)).rejects.toThrow(
      /Brevo HTTP 401/
    );
    await expect(sendTransactionalEmail(BASE_PAYLOAD)).rejects.toThrow(
      /restricts API access to authorized IPs/
    );
    await expect(sendTransactionalEmail(BASE_PAYLOAD)).rejects.toThrow(
      /security\/authorised_ips/
    );
  });

  it('Brevo 401 without an IP complaint falls back to the generic key/IP hint', async () => {
    vi.stubEnv('BREVO_API_KEY', 'xkeysib-test-key');
    vi.stubEnv('EMAIL_FROM', 'recruitai250@gmail.com');
    stubFetch(401, { message: 'invalid API key', code: 'unauthorized' });

    await expect(sendTransactionalEmail(BASE_PAYLOAD)).rejects.toThrow(
      /check that BREVO_API_KEY is valid/
    );
  });

  it('403 appends the verify-your-EMAIL_FROM hint', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    stubFetch(403, { message: 'The from address is not verified' });

    await expect(sendTransactionalEmail(BASE_PAYLOAD)).rejects.toThrow(
      /EMAIL_FROM address may not be verified/
    );
  });

  it('Resend 401 appends the RESEND_API_KEY hint', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_stale_key');
    stubFetch(401, { message: 'Invalid API key' });

    await expect(sendTransactionalEmail(BASE_PAYLOAD)).rejects.toThrow(
      /check that RESEND_API_KEY is valid/
    );
  });

  it('Brevo misconfiguration: key set but EMAIL_FROM missing is a loud error', async () => {
    vi.stubEnv('BREVO_API_KEY', 'xkeysib-test-key');
    // EMAIL_FROM intentionally left empty
    await expect(sendTransactionalEmail(BASE_PAYLOAD)).rejects.toThrow(
      /EMAIL_FROM is missing\/invalid/
    );
  });

  it('successful sends never carry hints and resolve with the provider id', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    const fetchMock = stubFetch(200, { id: 're_123' });

    await expect(
      sendTransactionalEmail({
        to: 'user@example.com',
        template: 'EMAIL_VERIFICATION',
        data: { joinLink: 'https://x/verify' },
      })
    ).resolves.toEqual({ success: true, id: 're_123' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('Brevo success resolves with the messageId and posts to the Brevo endpoint', async () => {
    vi.stubEnv('BREVO_API_KEY', 'xkeysib-test-key');
    vi.stubEnv('EMAIL_FROM', 'recruitai250@gmail.com');
    const fetchMock = stubFetch(200, { messageId: 'brevo-42' });

    await expect(sendTransactionalEmail(BASE_PAYLOAD)).resolves.toEqual({
      success: true,
      id: 'brevo-42',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    const body = JSON.parse(init.body);
    expect(body.to).toEqual([{ email: 'user@example.com' }]);
    expect(body.sender.email).toBe('recruitai250@gmail.com');
  });
});

// ─────────────────────────────────────────────
// Honest recording (sendRecordedEmail)
// ─────────────────────────────────────────────
describe('sendRecordedEmail — honest SENT/FAILED recording (spec §6.9)', () => {
  it('records SENT on successful delivery and returns delivered:true', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    stubFetch(200, { id: 're_ok' });

    const result = await sendRecordedEmail({
      to: 'user@example.com',
      template: 'EMAIL_VERIFICATION',
      data: { joinLink: 'https://x/verify' },
      senderId: 'u-1',
    });

    expect(result.delivered).toBe(true);
    expect(result.communicationId).toBe('comm-test-1');
    expect(comm.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipient: 'user@example.com',
          template: 'EMAIL_VERIFICATION',
          deliveryState: 'PENDING',
          senderId: 'u-1',
        }),
      })
    );
    expect(comm.update).toHaveBeenCalledWith({
      where: { id: 'comm-test-1' },
      data: { deliveryState: 'SENT' },
    });
  });

  it('records FAILED with the provider hint in failureInfo — and never throws', async () => {
    vi.stubEnv('BREVO_API_KEY', 'xkeysib-test-key');
    vi.stubEnv('EMAIL_FROM', 'recruitai250@gmail.com');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubFetch(401, {
      message: 'unrecognised IP address ... https://app.brevo.com/security/authorised_ips',
      code: 'unauthorized',
    });

    const result = await sendRecordedEmail({
      to: 'user@example.com',
      template: 'EMAIL_VERIFICATION',
      data: {},
    });

    expect(result.delivered).toBe(false);
    expect(result.error).toMatch(/security\/authorised_ips/);
    expect(comm.update).toHaveBeenCalledWith({
      where: { id: 'comm-test-1' },
      data: expect.objectContaining({
        deliveryState: 'FAILED',
        failureInfo: expect.stringContaining('security/authorised_ips'),
      }),
    });
    const updatePayload = comm.update.mock.calls[0][0] as { data: { failureInfo: string } };
    expect(updatePayload.data.failureInfo.length).toBeLessThanOrEqual(2000);
    consoleError.mockRestore();
  });

  it('passes the custom HTML body through to the provider (password reset flow)', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    const fetchMock = stubFetch(200, { id: 're_1' });

    await sendRecordedEmail(
      { to: 'user@example.com', template: 'PASSWORD_RESET', data: {} },
      '<p>Reset here</p>'
    );

    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    const body = JSON.parse(init.body);
    expect(body.html).toContain('Reset here');
  });
});
