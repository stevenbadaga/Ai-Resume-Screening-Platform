/**
 * Spec §6.9 — confidentiality guards for candidate communications.
 *
 * "Internal notes, AI prompts, private reviewer comments, and other
 * confidential information must never be inserted into candidate
 * communications."
 *
 * "Candidates must not be informed that a final employment decision was made
 * solely by AI."
 *
 * Every manually composed message is checked here at preview time (surfaced
 * to the author) and again at send time (enforced with 400).
 */

export interface MessageSafetyIssue {
  code: 'INTERNAL_NOTE_LEAK' | 'AI_DECISION_CLAIM' | 'CONFIDENTIAL_TECHNICAL_CONTENT';
  message: string;
}

export interface CandidateMessageInput {
  subject: string;
  body: string;
  /** Raw application notes field (JSON or free text) — internal, never sendable. */
  internalNotes?: string | null;
}

/** Pulls human-readable note strings out of the application.notes JSON/text blob. */
export function extractInternalNoteStrings(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) =>
          typeof entry === 'string'
            ? entry
            : entry && typeof entry === 'object'
              ? String((entry as any).text ?? (entry as any).content ?? (entry as any).note ?? '')
              : ''
        )
        .map((s) => s.trim())
        .filter((s) => s.length >= 20);
    }
    if (parsed && typeof parsed === 'object') {
      return Object.values(parsed)
        .map((v) => (typeof v === 'string' ? v.trim() : ''))
        .filter((s) => s.length >= 20);
    }
  } catch {
    // Not JSON — treat the whole field as one free-text note.
    const text = raw.trim();
    return text.length >= 20 ? [text] : [];
  }
  return [];
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Patterns asserting a final decision was made by AI (spec §6.9/§7). */
const AI_DECISION_PATTERNS: RegExp[] = [
  /\bsolely by (?:an? )?(?:ai|algorithm|automated system)\b/i,
  /\b(?:the )?ai\b[^.!?\n]{0,80}\b(?:decided|rejected|shortlisted|selected|hired|disqualified)\b/i,
  /\b(?:decided|rejected|shortlisted|selected|disqualified)\b[^.!?\n]{0,60}\bby (?:an? )?ai\b/i,
  /\bautomatic(?:ally)? reject/i,
  /\bby (?:an? )?ai (?:only|alone|automatically)\b/i,
];

/** Technical markers that belong to prompts/assessment internals, not candidate mail. */
const CONFIDENTIAL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bsystem prompt\b/i, label: 'system prompt text' },
  { pattern: /\bsupportingEvidence\b/, label: 'AI assessment field' },
  { pattern: /\bcriterionId\b/, label: 'AI assessment field' },
  { pattern: /\bgpt-4o\b/i, label: 'model identifier' },
  { pattern: /\bscreening (?:run|configuration) (?:id|snapshot)\b/i, label: 'screening internals' },
  { pattern: /\brubric weight[s]?\b/i, label: 'internal scoring weights' },
];

/**
 * Returns every confidentiality/safety issue in a composed message.
 * Empty array = safe to send.
 */
export function findMessageSafetyIssues(input: CandidateMessageInput): MessageSafetyIssue[] {
  const issues: MessageSafetyIssue[] = [];
  const subject = normalize(input.subject ?? '');
  const body = normalize(input.body ?? '');
  const combined = `${subject} ${body}`;

  // 1. Internal notes / reviewer comments must never leak into candidate mail.
  for (const note of extractInternalNoteStrings(input.internalNotes)) {
    const normalizedNote = normalize(note);
    if (normalizedNote.length >= 20 && combined.includes(normalizedNote)) {
      issues.push({
        code: 'INTERNAL_NOTE_LEAK',
        message: 'The message contains internal reviewer notes verbatim. Internal notes are never shown to candidates (spec §6.9).',
      });
      break;
    }
    // Also catch a distinctive 8-word fragment (partial copy-paste).
    const words = normalizedNote.split(' ');
    if (words.length >= 8) {
      const fragment = words.slice(0, 8).join(' ');
      if (combined.includes(fragment)) {
        issues.push({
          code: 'INTERNAL_NOTE_LEAK',
          message: 'The message appears to quote an internal reviewer note. Remove internal content before sending (spec §6.9).',
        });
        break;
      }
    }
  }

  // 2. Never tell a candidate AI made the decision.
  for (const pattern of AI_DECISION_PATTERNS) {
    if (pattern.test(input.body ?? '') || pattern.test(input.subject ?? '')) {
      issues.push({
        code: 'AI_DECISION_CLAIM',
        message:
          'The message states or implies an AI system made the employment decision. Final decisions are made by people — rephrase before sending (spec §6.9, §7).',
      });
      break;
    }
  }

  // 3. No prompts, assessment internals, or model identifiers.
  for (const { pattern, label } of CONFIDENTIAL_PATTERNS) {
    if (pattern.test(input.body ?? '') || pattern.test(input.subject ?? '')) {
      issues.push({
        code: 'CONFIDENTIAL_TECHNICAL_CONTENT',
        message: `The message contains ${label}, which must never be sent to candidates (spec §6.9).`,
      });
      break;
    }
  }

  return issues;
}

/** Replaces approved placeholders in a composed message for preview/send. */
export function renderMessageBody(
  body: string,
  vars: { candidateName?: string; jobTitle?: string }
): string {
  return (body ?? '')
    .replace(/\{\{\s*candidateName\s*\}\}/g, vars.candidateName ?? '')
    .replace(/\{\{\s*jobTitle\s*\}\}/g, vars.jobTitle ?? '');
}
