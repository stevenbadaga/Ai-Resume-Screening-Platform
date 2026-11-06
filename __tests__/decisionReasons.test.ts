import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DECISION_REASONS,
  findProhibitedReasonTerm,
  resolveDecisionReasons,
  validateDecisionRationale,
  validateDecisionReasonCode,
} from '@/lib/decisionReasons';

describe('decision reasons (spec §6.7)', () => {
  it('falls back to the default job-related catalog when none is configured', () => {
    expect(resolveDecisionReasons(undefined)).toEqual(DEFAULT_DECISION_REASONS);
    expect(resolveDecisionReasons([])).toEqual(DEFAULT_DECISION_REASONS);
    expect(resolveDecisionReasons('garbage')).toEqual(DEFAULT_DECISION_REASONS);
  });

  it('uses the org-configured catalog when present', () => {
    const configured = [{ code: 'STRONG_MATCH', label: 'Strong match' }];
    expect(resolveDecisionReasons(configured)).toEqual(configured);
  });

  it('drops configured entries with protected-characteristic terms (defense in depth)', () => {
    const configured = [
      { code: 'GOOD_CULTURE', label: 'Good culture fit' },
      { code: 'TOO_OLD', label: 'Candidate is too old' },
    ];
    const resolved = resolveDecisionReasons(configured);
    expect(resolved.map((r) => r.code)).toEqual(['GOOD_CULTURE']);
  });

  it('detects protected-characteristic terms in codes and free text', () => {
    expect(findProhibitedReasonTerm('AGE_RACE')).toMatch(/age|race/i); // snake_case normalised
    expect(findProhibitedReasonTerm('decided because of their religion')).toMatch(/religion/i);
    expect(findProhibitedReasonTerm('pregnancy leave')).toMatch(/pregnancy/i);
    expect(findProhibitedReasonTerm('strong React skills')).toBeNull();
    expect(findProhibitedReasonTerm(null)).toBeNull();
  });

  it('accepts reason codes from the effective catalog and rejects unknown ones', () => {
    expect(validateDecisionReasonCode('QUALIFICATIONS_MATCH', undefined).ok).toBe(true);
    expect(validateDecisionReasonCode('   ', undefined).ok).toBe(true);
    expect(validateDecisionReasonCode('NOT_A_REASON', undefined).ok).toBe(false);
    expect(validateDecisionReasonCode('STRONG_MATCH', [{ code: 'STRONG_MATCH', label: 'x' }]).ok).toBe(true);
    expect(validateDecisionReasonCode('QUALIFICATIONS_MATCH', [{ code: 'STRONG_MATCH', label: 'x' }]).ok).toBe(false);
  });

  it('always rejects prohibited reason codes, even custom-configured ones', () => {
    const res = validateDecisionReasonCode('RACIAL', [{ code: 'RACIAL', label: 'x' }]);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/protected/i);
  });

  it('rejects rationales that cite protected characteristics', () => {
    expect(validateDecisionRationale('Too many years of age for this team').ok).toBe(false);
    expect(validateDecisionRationale('Wrong religion for the team').ok).toBe(false);
    expect(validateDecisionRationale('Missing required Kubernetes experience on the rubric').ok).toBe(true);
  });
});
