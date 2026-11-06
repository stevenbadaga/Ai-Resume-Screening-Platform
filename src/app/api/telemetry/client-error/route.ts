import { NextRequest, NextResponse } from 'next/server';
import { trackError, trackWarning } from '@/lib/errorTracker';
import { logEvent } from '@/lib/observability';

/**
 * Client-side error telemetry (spec §9 Monitoring and Logging).
 *
 * The browser cannot run the Sentry Node SDK, so the React error boundary
 * forwards render errors here and the server reports them to the tracker.
 * The payload contract is deliberately strict (bounded strings, no free-form
 * objects) so this endpoint cannot be abused as a log-injection or PII
 * sink. Rate limiting is inherited from the deployment edge; the payload
 * itself carries no user identifiers beyond what the stack trace contains.
 */

interface ClientErrorPayload {
  message?: unknown;
  digest?: unknown;
  stack?: unknown;
}

function asBoundedString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export async function POST(req: NextRequest) {
  let body: ClientErrorPayload;
  try {
    body = (await req.json()) as ClientErrorPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const message = asBoundedString(body.message, 500);
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const digest = asBoundedString(body.digest, 64);
  const stack = asBoundedString(body.stack, 2000);

  logEvent('info', 'telemetry.clientError.received', {
    digest,
    messageLength: message.length,
  });

  if (process.env.SENTRY_DSN) {
    const error = new Error(message);
    if (stack) error.stack = stack;
    if (digest) {
      trackError('ui.renderError', error, { digest });
    } else {
      trackError('ui.renderError', error, {});
    }
  } else {
    // No tracker configured: keep a warn-level structured record so the
    // noise is at least greppable in server logs.
    trackWarning('ui.renderError.untracked', message, { digest });
  }

  return NextResponse.json({ ok: true });
}
