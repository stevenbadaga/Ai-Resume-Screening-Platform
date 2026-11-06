import OpenAI from 'openai';

/**
 * Central OpenAI configuration.
 *
 * Design rule: NEVER fall back to a fake credential (e.g. `|| 'dummy_key'`).
 * A missing API key must be a loud, explicit failure — silently constructing
 * a client with a junk key just moves the failure to request time, where it
 * gets misdiagnosed as an OpenAI outage.
 */

/** Minimum plausible length for a real OpenAI key (sk-... keys are far longer). */
const MIN_KEY_LENGTH = 20;

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return typeof key === 'string' && key.trim().length >= MIN_KEY_LENGTH;
}

/**
 * Returns a configured OpenAI client.
 * Throws an explicit error when OPENAI_API_KEY is not set — callers should
 * either gate on `isOpenAIConfigured()` or handle this as a config failure.
 */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length < MIN_KEY_LENGTH) {
    throw new Error('OPENAI_API_KEY is not configured — AI features are unavailable.');
  }
  return new OpenAI({ apiKey });
}
