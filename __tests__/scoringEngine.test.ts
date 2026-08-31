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

  it('handles missing criteria gracefully (ignores them)', () => {
    const criteria = [
      { id: '1', weight: 5 }
    ];
    const assessments = [
      { criterionId: '2', result: 'MATCH' } // criterion 2 does not exist
    ];

    const result = calculateTotalScore(assessments, criteria);
    expect(result.maxScore).toBe(0);
    expect(result.totalScore).toBe(0);
    expect(result.percentage).toBe(0);
  });
});
