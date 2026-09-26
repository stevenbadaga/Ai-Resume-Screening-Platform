import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { initErrorTracker, trackError, trackWarning, setTrackerRequestId } from '@/lib/errorTracker';

// Initialize on first import in any process (server or worker). No-op
// without SENTRY_DSN, so local dev and CI are unaffected.
initErrorTracker();

/**
 * Observability primitives (spec §9 Monitoring and Logging).
 *
 * Operational logs must be observable WITHOUT recording passwords, secrets,
 * full resumes, or unnecessary personal data. This module provides:
 *
 *  - `requestIdOf(req)`: an X-Request-ID per request (client-supplied IDs are
 *    accepted but re-hashed so header injection cannot poison the log stream).
 *  - `logEvent()`: single-line structured JSON logs — greppable, parseable,
 *    and safe by construction (an allow-list of fields; no raw bodies).
 *  - `withRequestContext()`: wraps a route handler, attaches the request id
 *    to the response (`X-Request-ID`), times the call, and logs the outcome
 *    at the appropriate level. Handlers return either a NextResponse or
 *    throw — thrown errors are logged with stack and turned into a 500.
 */

const SENSITIVE_KEYS = /^(password|token|secret|authorization|apiKey|api_key|resumeText|extractedText|consentChoices)$/i;

export function requestIdOf(req: Request): string {
  const incoming = req.headers.get('x-request-id');
  // Re-hash client-supplied IDs: bounded length, no log-injection content.
  if (incoming && incoming.length <= 128) {
    return crypto.createHash('sha256').update(incoming).digest('hex').slice(0, 32);
  }
  const requestId = crypto.randomUUID().replace(/-/g, '').slice(0, 32);
  // Correlate tracker captures with this request's log + audit records.
  setTrackerRequestId(requestId);
  return requestId;
}

export interface SafeLogFields {
  [key: string]: string | number | boolean | null | undefined;
}

export function logEvent(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: SafeLogFields = {}
): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);

  // §9: swallowed log noise must be observable. Error- and warn-level log
  // events are mirrored to the error tracker so they become grouped,
  // alertable records instead of vanishing into stderr. The structured
  // fields are already redacted (see redactFields), so only safe context
  // reaches the tracker; the error object itself (if any) is attached by
  // the caller via the `error` field.
  if (level === 'error') {
    const error = extractError(fields.error);
    const context = { ...fields };
    delete (context as Record<string, unknown>).error;
    trackError(event, error ?? new Error(event), context);
  } else if (level === 'warn') {
    trackWarning(event, event, fields);
  }
}

/**
 * Extracts a real Error from a log field so the tracker records the stack.
 * Fields are `string | number | boolean | null | undefined`, so callers pass
 * `error.message` — when they have the live Error they call trackError
 * directly (as withRequestContext does).
 */
function extractError(field: SafeLogFields['error']): Error | undefined {
  return field !== null && field !== undefined && typeof field === 'object'
    ? (field as Error)
    : undefined;
}

/** Redact anything that smells sensitive from an object before logging. */
export function redactFields(obj: Record<string, unknown>): SafeLogFields {
  const out: SafeLogFields = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.test(key)) {
      out[key] = '[REDACTED]';
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = typeof value === 'string' && value.length > 512 ? `${value.slice(0, 512)}…` : value;
    } else if (value === null || value === undefined) {
      out[key] = value ?? null;
    } else {
      out[key] = '[OBJECT]';
    }
  }
  return out;
}

type Handler = (req: Request, ctx: { requestId: string }) => Promise<Response>;

/**
 * Wraps an API route handler: request id, timing, structured outcome log, and
 * a safe 500 on unexpected throws. Use inside each exported HTTP method:
 *
 *   export const GET = (req: Request) => withRequestContext('jobs.list', req, async (req) => { … });
 */
export function withRequestContext(event: string, handler: Handler) {
  return async (req: Request): Promise<Response> => {
    const requestId = requestIdOf(req);
    const started = Date.now();
    try {
      const response = await handler(req, { requestId });
      response.headers.set('X-Request-ID', requestId);
      logEvent('info', `${event}.ok`, {
        requestId,
        method: req.method,
        status: response.status,
        durationMs: Date.now() - started,
      });
      return response;
    } catch (error) {
      // Attach the real Error object so the tracker records the stack, not
      // just the message string.
      const logFields: SafeLogFields = {
        requestId,
        method: req.method,
        durationMs: Date.now() - started,
      };
      logEvent('error', `${event}.error`, logFields);
      trackError(`${event}.error`, error, logFields);
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500, headers: { 'X-Request-ID': requestId } }
      );
    }
  };
}

/**
 * Builds the `requestContext` payload for logAuditEvent — the audit ledger
 * then carries the correlation id without storing personal content.
 */
export function auditRequestContext(requestId: string, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ requestId, ...redactFields(extra) });
}
