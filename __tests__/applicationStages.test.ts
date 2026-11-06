import { describe, it, expect } from 'vitest';
import {
  APPLICATION_STAGES,
  statusForStage,
  isFinalStage,
  stageForDecision,
} from '../src/lib/applicationStages';

describe('canonical stage/status vocabulary (§6.7, §9 data integrity)', () => {
  it('covers every workflow state named by the spec', () => {
    for (const stage of [
      'NEW', 'SCREENING', 'NEEDS_REVIEW', 'SHORTLISTED', 'ON_HOLD',
      'INTERVIEW_SCHEDULED', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN',
    ]) {
      expect(APPLICATION_STAGES).toContain(stage);
    }
  });

  it('derives a consistent status for every stage (no drift possible)', () => {
    const expected: Record<string, string> = {
      NEW: 'NEW',
      SCREENING: 'SCREENING',
      NEEDS_REVIEW: 'ACTIVE',
      SHORTLISTED: 'ACTIVE',
      ON_HOLD: 'ACTIVE',
      INTERVIEW_SCHEDULED: 'INTERVIEW',
      OFFERED: 'OFFER',
      HIRED: 'HIRED',
      REJECTED: 'REJECTED',
      WITHDRAWN: 'WITHDRAWN',
    };
    for (const [stage, status] of Object.entries(expected)) {
      expect(statusForStage(stage)).toBe(status);
    }
    // Unknown stages fall back to ACTIVE (live), never crash.
    expect(statusForStage('SOMETHING_ELSE')).toBe('ACTIVE');
  });

  it('maps every human decision to its target stage (§6.7)', () => {
    expect(stageForDecision('SHORTLIST')).toBe('SHORTLISTED');
    expect(stageForDecision('ADVANCE')).toBe('INTERVIEW_SCHEDULED');
    expect(stageForDecision('ADVANCED')).toBe('INTERVIEW_SCHEDULED');
    expect(stageForDecision('HOLD')).toBe('ON_HOLD');
    expect(stageForDecision('REJECT')).toBe('REJECTED');
    expect(stageForDecision('REJECTED')).toBe('REJECTED');
    expect(stageForDecision('WITHDRAW')).toBe('WITHDRAWN');
    expect(stageForDecision('REVIEW')).toBe('NEEDS_REVIEW');
  });

  it('locks scorecards at final stages (§6.8: no rewriting feedback after the decision)', () => {
    expect(isFinalStage('OFFERED')).toBe(true);
    expect(isFinalStage('HIRED')).toBe(true);
    expect(isFinalStage('REJECTED')).toBe(true);
    expect(isFinalStage('WITHDRAWN')).toBe(true);
    // Pre-decision stages stay open for feedback.
    expect(isFinalStage('INTERVIEW_SCHEDULED')).toBe(false);
    expect(isFinalStage('SHORTLISTED')).toBe(false);
    expect(isFinalStage('SCREENING')).toBe(false);
  });
});
