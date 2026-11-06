import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * §9 Monitoring and Logging: the tracker must be a safe no-op without
 * SENTRY_DSN (dev/CI ship nothing), must never throw into the caller's
 * error path, and logEvent's warn/error levels must route to it.
 */

describe('error tracker gating (§9 observability)', () => {
  const originalDsn = process.env.SENTRY_DSN;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalDsn === undefined) delete process.env.SENTRY_DSN;
    else process.env.SENTRY_DSN = originalDsn;
    vi.restoreAllMocks();
  });

  it('is a silent no-op without SENTRY_DSN (no events, no crashes)', async () => {
    delete process.env.SENTRY_DSN;
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const tracker = await import('../src/lib/errorTracker');
    expect(() => tracker.initErrorTracker()).not.toThrow();
    expect(() => tracker.trackError('test.event', new Error('boom'), { a: 1 })).not.toThrow();
    expect(() => tracker.trackWarning('test.warn', 'careful', {})).not.toThrow();
    expect(() => tracker.setTrackerRequestId('abc')).not.toThrow();

    // Exactly one explicit "disabled" notice, from init — no error output.
    const disabledLogs = consoleSpy.mock.calls.filter((c) =>
      String(c[0]).includes('errorTracker.disabled')
    );
    expect(disabledLogs.length).toBe(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('mirrors logEvent error level to trackError without throwing', async () => {
    delete process.env.SENTRY_DSN;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { logEvent } = await import('../src/lib/observability');
    expect(() =>
      logEvent('error', 'test.route.error', { requestId: 'r1', error: 'db down' })
    ).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('mirrors logEvent warn level without throwing and never blocks info', async () => {
    delete process.env.SENTRY_DSN;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const { logEvent } = await import('../src/lib/observability');
    expect(() => logEvent('warn', 'test.degraded', { detail: 'retry scheduled' })).not.toThrow();
    expect(() => logEvent('info', 'test.ok', { status: 200 })).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('redacts sensitive fields before anything leaves the process', async () => {
    delete process.env.SENTRY_DSN;
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const { redactFields } = await import('../src/lib/observability');
    const redacted = redactFields({
      password: 'hunter2',
      authorization: 'Bearer x',
      resumeText: 'candidate content',
      status: 200,
      empty: null,
    });

    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.authorization).toBe('[REDACTED]');
    expect(redacted.resumeText).toBe('[REDACTED]');
    expect(redacted.status).toBe(200);
    expect(redacted.empty).toBeNull();
  });
});
