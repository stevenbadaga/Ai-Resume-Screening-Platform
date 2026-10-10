/**
 * Spec §6.7 — Configurable decision reasons with a discriminatory/irrelevant
 * category guard.
 *
 * "The system must support configurable decision reasons and free-text
 * justification while preventing discriminatory or irrelevant decision
 * categories."
 *
 * Single source of truth used by the decisions API, the bulk-action API, the
 * admin workflow-config API, and the recruiter decision modal.
 */

export interface DecisionReason {
  code: string;
  label: string;
}

/** Built-in, job-related reasons used when the org has not configured a catalog. */
export const DEFAULT_DECISION_REASONS: DecisionReason[] = [
  { code: 'QUALIFICATIONS_MATCH', label: 'Qualifications match the approved rubric' },
  { code: 'EXCELLENT_TECHNICAL_FIT', label: 'Excellent technical fit for the role' },
  { code: 'EXPERIENCE_GAP', label: 'Experience gap against required criteria' },
  { code: 'COMMUNICATION_FIT', label: 'Communication skills fit the role' },
  { code: 'COMPENSATION_MISMATCH', label: 'Compensation expectations mismatch' },
  { code: 'TALENT_BENCH', label: 'Strong profile — kept on the talent bench' },
  { code: 'CANDIDATE_WITHDREW', label: 'Candidate withdrew from the process' },
  { code: 'OTHER', label: 'Other (free-text justification required)' },
];

/**
 * Protected/sensitive characteristics (spec §4.3, §7) that must never appear
 * in a decision category or as a decision justification. Matched with word
 * boundaries, case-insensitively.
 */
const PROHIBITED_TERMS: readonly string[] = [
  'race', 'racial', 'ethnicity', 'ethnic', 'religion', 'religious',
  'disability', 'disabled', 'pregnant', 'pregnancy', 'political',
  'sexual orientation', 'sexual preference', 'gender', 'sex life',
  'marital status', 'marital', 'nationality', 'national origin',
  'skin color', 'skin colour', 'appearance', 'photograph', 'photo',
  'age discrimination', 'too old', 'too young', 'birth year', 'birthday', 'age', 'years old',
  'health status', 'medical condition', 'hiv', 'caste',
  'name sounds', 'foreign name', 'accent',
];

const PROHIBITED_PATTERN = new RegExp(
  `\\b(?:${PROHIBITED_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'i'
);

/**
 * Returns the first prohibited term found in `text`, or null when clean.
 * Snake/Pascal separators are normalised to spaces first so codes like
 * `AGE_RACE` or `RaceBased` are caught by the same word-boundary rules.
 */
export function findProhibitedReasonTerm(text: string | null | undefined): string | null {
  if (!text) return null;
  const normalized = String(text).replace(/[_\-]+/g, ' ');
  const match = PROHIBITED_PATTERN.exec(normalized);
  return match ? match[0] : null;
}

/**
 * The effective catalog: org-configured reasons when present (and not empty),
 * otherwise the built-in job-related defaults. Entries that contain a
 * prohibited term are dropped as defense-in-depth (they can no longer be
 * configured, but legacy rows are also never offered).
 */
export function resolveDecisionReasons(configured: unknown): DecisionReason[] {
  const raw = Array.isArray(configured) ? configured : [];
  const valid = raw
    .filter((r): r is DecisionReason =>
      Boolean(r) && typeof (r as DecisionReason).code === 'string' && typeof (r as DecisionReason).label === 'string'
    )
    .map((r) => ({ code: r.code.trim(), label: r.label.trim() }))
    .filter((r) => r.code.length > 0 && r.label.length > 0)
    .filter((r) => !findProhibitedReasonTerm(r.code) && !findProhibitedReasonTerm(r.label));
  return valid.length > 0 ? valid : DEFAULT_DECISION_REASONS;
}

export interface ReasonValidation {
  ok: boolean;
  error?: string;
}

/**
 * Validates a decision reason CODE against the effective catalog.
 *
 * When `configured` is a non-empty catalog the code must be one of its
 * entries — organizations control the allowed decision categories. An empty/
 * absent catalog falls back to the built-in defaults (which also keeps
 * older clients working before an org configures its own list).
 * Prohibited (discriminatory/irrelevant) terms are rejected in every case.
 */
export function validateDecisionReasonCode(
  code: string | null | undefined,
  configured: unknown
): ReasonValidation {
  if (!code || !code.trim()) return { ok: true }; // free-text rationale still required downstream

  const trimmed = code.trim();
  const prohibited = findProhibitedReasonTerm(trimmed);
  if (prohibited) {
    return {
      ok: false,
      error: `Decision reason "${trimmed}" contains a protected-characteristic term ("${prohibited}"), which is not an allowed decision category (spec §6.7).`,
    };
  }

  const catalog = resolveDecisionReasons(configured);
  if (!catalog.some((r) => r.code === trimmed)) {
    return {
      ok: false,
      error: `Decision reason code "${trimmed}" is not in this organization's approved reason catalog.`,
    };
  }
  return { ok: true };
}

/**
 * Validates the free-text justification. The justification is required by the
 * route schema; here it must not cite protected/sensitive characteristics as
 * the reason for a recruitment decision (spec §6.7/§7 — job relevance).
 */
export function validateDecisionRationale(rationale: string | null | undefined): ReasonValidation {
  const prohibited = findProhibitedReasonTerm(rationale);
  if (prohibited) {
    return {
      ok: false,
      error: `The justification cites "${prohibited}", a protected characteristic. Recruitment decisions must be based on job-related criteria only (spec §6.7).`,
    };
  }
  return { ok: true };
}
