import { describe, it, expect } from 'vitest';
import { calculateTotalScore } from '@/lib/scoringEngine';

describe('AI Scoring Logic (calculateTotalScore)', () => {
  it('calculates 100% when all criteria are MATCH', () => {
    const criteria = [
      { id: '1', weight: 5 },
      { id: '2', weight: 3 },
      { id: '3', weight: 2 }
    ];
    const assessments = [
      { criterionId: '1', result: 'MATCH' },
      { criterionId: '2', result: 'MATCH' },
      { criterionId: '3', result: 'MATCH' }
    ];

    const result = calculateTotalScore(assessments, criteria);
    expect(result.maxScore).toBe(10);
    expect(result.totalScore).toBe(10);
    expect(result.percentage).toBe(100);
  });

  it('calculates 50% for PARTIAL matches', () => {
    const criteria = [
      { id: '1', weight: 4 }, // max: 4
      { id: '2', weight: 4 }  // max: 4, Total max = 8
    ];
    const assessments = [
      { criterionId: '1', result: 'PARTIAL' }, // score: 2
      { criterionId: '2', result: 'PARTIAL' }  // score: 2, Total score = 4
    ];

    const result = calculateTotalScore(assessments, criteria);
    expect(result.totalScore).toBe(4);
    expect(result.percentage).toBe(50);
  });

  it('calculates 0% for MISSING matches', () => {
    const criteria = [
      { id: '1', weight: 5 }
    ];
    const assessments = [
      { criterionId: '1', result: 'MISSING' }
    ];

    const result = calculateTotalScore(assessments, criteria);
    expect(result.totalScore).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it('ignores assessments for criteria outside the rubric', () => {
    const criteria = [
      { id: '1', weight: 5 }
    ];
    const assessments = [
      { criterionId: '2', result: 'MATCH' } // criterion 2 does not exist
    ];

    // Criterion 1 was never assessed → counts toward maxScore at 0 points.
    const result = calculateTotalScore(assessments, criteria);
    expect(result.maxScore).toBe(5);
    expect(result.totalScore).toBe(0);
    expect(result.percentage).toBe(0);
  });

  // Regression: unassessed criteria must count toward maxScore (score 0),
  // not silently drop out and inflate the match percentage.
  it('treats unassessed criteria as MISSING instead of inflating the score', () => {
    const criteria = [
      { id: '1', weight: 5, isRequired: false },
      { id: '2', weight: 5, isRequired: false },
      { id: '3', weight: 5, isRequired: false },
      { id: '4', weight: 5, isRequired: false },
    ];
    const assessments = [
      { criterionId: '1', result: 'MATCH' },
      { criterionId: '2', result: 'MATCH' },
      // AI omitted criteria 3 and 4 entirely
    ];

    const result = calculateTotalScore(assessments, criteria);
    expect(result.maxScore).toBe(20);        // all four criteria counted
    expect(result.totalScore).toBe(10);      // only the two MATCHes score
    expect(result.percentage).toBe(50);      // NOT 100%
  });

  it('fails at 0% when a required criterion was never assessed', () => {
    const criteria = [
      { id: '1', weight: 5, isRequired: true },
      { id: '2', weight: 5, isRequired: false },
    ];
    const assessments = [
      { criterionId: '2', result: 'MATCH' },
      // required criterion 1 never assessed
    ];

    const result = calculateTotalScore(assessments, criteria);
    expect(result.percentage).toBe(0);
    expect(result.failedRequiredCriterion).toBeTruthy();
  });

  it('counts a duplicated assessment only once', () => {
    const criteria = [
      { id: '1', weight: 4, isRequired: false },
      { id: '2', weight: 4, isRequired: false },
    ];
    const assessments = [
      { criterionId: '1', result: 'MATCH' },
      { criterionId: '1', result: 'MATCH' },  // duplicate — must not stack
      { criterionId: '2', result: 'MISSING' },
    ];

    const result = calculateTotalScore(assessments, criteria);
    expect(result.maxScore).toBe(8);
    expect(result.totalScore).toBe(4);
    expect(result.percentage).toBe(50);
  });
});
