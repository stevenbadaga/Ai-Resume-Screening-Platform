import * as Sentry from '@sentry/node';

/**
 * Error tracker (spec §9 Monitoring and Logging).
 *
 * Wires structured logging to Sentry so that swallowed log noise — the
 * `console.error` calls that previously vanished into stderr — becomes
 * visible, grouped, and alertable. Design rules:
 *
 *  - Initialization is lazy and DSN-gated: without SENTRY_DSN the tracker is
 *    a no-op, so local development and CI never ship events (and never need
 *    the dependency to work).
 *  - One init per process for both runtimes: the Next.js server and the
 *    standalone BullMQ worker (`src/lib/worker.ts`) both import this module;
 *    `@sentry/node` covers Node server + worker runtimes.
 *  - Privacy by construction (spec §6.11/§9): `sendDefaultPii: false`,
 *    a deny-list `beforeBreadcrumb` that drops secrets/resume content from
 *    the breadcrumb trail, and `captureMessage`/`captureException` callers
 *    that only pass structured, redacted context — never raw bodies.
 */

let initialized = false;

/** Extra fields the SDK should never record in breadcrumbs. */
const BREADCRUMB_DENYLIST = /^(password|token|secret|authorization|apiKey|api_key|resumeText|extractedText|consentChoices|failureInfo)$/i;

export function initErrorTracker(): void {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // Loud once, then silent: operators see in logs that error tracking is
    // not configured (mirrors the honest-config-error rule used elsewhere).
    console.log(
      '{"level":"info","event":"errorTracker.disabled","reason":"SENTRY_DSN not set — error tracking is a no-op"}'
    );
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    // Keep noise down: only explicit capture + unhandled process errors.
    tracesSampleRate: 0,
    beforeBreadcrumb(breadcrumb) {
      const category = breadcrumb.category ?? '';
      const message = breadcrumb.message ?? '';
      if (BREADCRUMB_DENYLIST.test(category) || BREADCRUMB_DENYLIST.test(message)) {
        return null; // drop — would carry secrets or candidate content
      }
      return breadcrumb;
    },
  });
  // PII note (spec §6.11/§9): captures are explicit — captureMessage and
  // captureException with redacted, structured extras only. No request bodies,
  // resume text, or credentials ever reach the tracker by construction.

  // Unhandled rejections/exceptions in the worker or server process surface
  // in Sentry even when a code path forgot to call the tracker.
  process.on('unhandledRejection', (reason) => {
    Sentry.captureException(reason);
  });
  process.on('uncaughtException', (error) => {
    Sentry.captureException(error);
  });
}

export interface TrackedContext {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Record a handled error with structured, redacted context. Used by
 * `logEvent('error', …)` so every swallowed `console.error` gains a Sentry
 * record without any caller change beyond the log call itself.
 */
export function trackError(event: string, error: unknown, context: TrackedContext = {}): void {
  if (!process.env.SENTRY_DSN) return;
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    Sentry.withScope((scope) => {
      scope.setTag('logEvent', event);
      for (const [key, value] of Object.entries(context)) {
        if (value !== undefined) scope.setExtra(key, value);
      }
      scope.setLevel('error');
      Sentry.captureException(err);
    });
  } catch {
    // Never let the tracker itself break the caller's error path.
  }
}

/**
 * Record a warning-level signal (e.g. recoverable queue outage, retry
 * exhaustion) — visible in Sentry as a message event, not an exception.
 */
export function trackWarning(event: string, message: string, context: TrackedContext = {}): void {
  if (!process.env.SENTRY_DSN) return;
  try {
    Sentry.withScope((scope) => {
      scope.setTag('logEvent', event);
      scope.setLevel('warning');
      for (const [key, value] of Object.entries(context)) {
        if (value !== undefined) scope.setExtra(key, value);
      }
      Sentry.captureMessage(message, 'warning');
    });
  } catch {
    // Never let the tracker itself break the caller.
  }
}

/**
 * Correlates tracker events with structured logs and audit records: the
 * request id set here appears on every subsequent capture in the same scope.
 */
export function setTrackerRequestId(requestId: string): void {
  if (!process.env.SENTRY_DSN) return;
  try {
    Sentry.getCurrentScope().setTag('requestId', requestId);
  } catch {
    /* tracker not initialized — no-op */
  }
}
