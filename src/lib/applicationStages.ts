/**
 * Canonical application stage vocabulary and the single stage → status map.
 *
 * Spec §6.7 names the workflow states; every route that mutates an
 * application's stage previously hand-rolled its own status mapping, and the
 * mappings drifted (e.g. SHORTLISTED applications kept status='ACTIVE' in one
 * route and 'SHORTLISTED' in another). All routes now derive status from
 * stage through `statusForStage` so the vocabulary cannot drift again.
 */

export const APPLICATION_STAGES = [
  'NEW',
  'SCREENING',
  'NEEDS_REVIEW',
  'SHORTLISTED',
  'ON_HOLD',
  'INTERVIEW_SCHEDULED',
  'OFFERED',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

/**
 * Secondary lifecycle status. Deliberately derived, never independently set:
 * dashboards funnel by `stage` (the field decision routes write), while
 * `status` answers "is this application still live?" for workload metrics.
 */
export function statusForStage(stage: string): string {
  switch (stage) {
    case 'NEW':
      return 'NEW';
    case 'SCREENING':
      return 'SCREENING';
    case 'NEEDS_REVIEW':
      return 'ACTIVE';
    case 'SHORTLISTED':
      return 'ACTIVE';
    case 'ON_HOLD':
      return 'ACTIVE';
    case 'INTERVIEW_SCHEDULED':
      return 'INTERVIEW';
    case 'OFFERED':
      return 'OFFER';
    case 'HIRED':
      return 'HIRED';
    case 'REJECTED':
      return 'REJECTED';
    case 'WITHDRAWN':
      return 'WITHDRAWN';
    default:
      return 'ACTIVE';
  }
}

/**
 * Stages at which the recruitment outcome is final for this application.
 * Interview scorecards are locked at these stages — feedback must be
 * submitted before the hiring decision, not rewritten after it.
 */
export const FINAL_STAGES: readonly string[] = ['OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN'];

export function isFinalStage(stage: string): boolean {
  return FINAL_STAGES.includes(stage);
}

/**
 * Maps a human decision (§6.7) to its target stage. Used by the individual
 * decision route, the bulk-action route, and the offer flow.
 */
export function stageForDecision(
  decision: 'SHORTLIST' | 'ADVANCE' | 'ADVANCED' | 'HOLD' | 'REJECT' | 'REJECTED' | 'WITHDRAW' | 'REVIEW'
): ApplicationStage {
  switch (decision) {
    case 'SHORTLIST':
      return 'SHORTLISTED';
    case 'ADVANCE':
    case 'ADVANCED':
      return 'INTERVIEW_SCHEDULED';
    case 'HOLD':
      return 'ON_HOLD';
    case 'REJECT':
    case 'REJECTED':
      return 'REJECTED';
    case 'WITHDRAW':
      return 'WITHDRAWN';
    case 'REVIEW':
      return 'NEEDS_REVIEW';
  }
}
