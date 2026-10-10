import { describe, expect, it } from 'vitest';
import { calculateExperienceSummary } from '@/lib/experienceCalc';

const NOW = new Date(Date.UTC(2026, 9, 9)); // fixed clock — reproducibility (§6.5)

describe('calculateExperienceSummary (spec §6.6)', () => {
  it('sums disjoint roles without overlap or gap', () => {
    const summary = calculateExperienceSummary(
      [
        { title: 'Dev', company: 'A', start: '2020-01', end: '2022-01' },
        { title: 'Dev', company: 'B', start: '2022-01', end: '2024-01' },
      ],
      NOW
    );
    expect(summary.totalYears).toBe(4);
    expect(summary.gapMonths).toBe(0);
    expect(summary.overlapMonths).toBe(0);
  });

  it('merges overlapping employments instead of double-counting them', () => {
    // 3y full-time + 1y part-time that sits entirely inside it → total stays 3y.
    const summary = calculateExperienceSummary(
      [
        { title: 'Engineer', company: 'A', start: '2020-01', end: '2023-01' },
        { title: 'Part-time Tutor', company: 'B', type: 'part-time', start: '2021-01', end: '2022-01' },
      ],
      NOW
    );
    expect(summary.totalYears).toBe(3);
    expect(summary.overlapMonths).toBe(12);
    expect(summary.nonStandardEntries).toBe(1);
    expect(summary.notes.some((n) => n.includes('overlapping'))).toBe(true);
  });

  it('excludes gaps between roles from the total and reports them', () => {
    const summary = calculateExperienceSummary(
      [
        { title: 'Dev', company: 'A', start: '2020-01', end: '2021-01' },
        { title: 'Dev', company: 'B', start: '2023-01', end: '2024-01' },
      ],
      NOW
    );
    expect(summary.totalYears).toBe(2);
    // Role 1 ends 2021-01-31, role 2 starts 2023-01-01 → 23 clear months.
    expect(summary.gapMonths).toBe(23);
    expect(summary.notes.some((n) => n.includes('gaps'))).toBe(true);
  });

  it('accepts year-only dates but never invents precision beyond them', () => {
    const summary = calculateExperienceSummary(
      [{ title: 'Dev', company: 'A', start: '2020', end: '2023' }],
      NOW
    );
    // Union is 2020-01-01 → 2023-12-31 = ~48 months; year precision floors it.
    expect(summary.precision).toBe('year');
    expect(summary.totalYears).toBe(3);
    expect(summary.notes.some((n) => n.includes('year-only'))).toBe(true);
  });

  it('counts an open-ended current role up to the provided clock', () => {
    const summary = calculateExperienceSummary(
      [{ title: 'Engineer', company: 'A', start: '2024-10', end: 'Present' }],
      NOW
    );
    expect(summary.totalYears).toBeCloseTo(2, 1);
    expect(summary.gapMonths).toBe(0);
  });

  it('includes internships in the total but itemises them for reviewers', () => {
    const summary = calculateExperienceSummary(
      [
        { title: 'Intern', company: 'A', type: 'internship', start: '2022-01', end: '2022-07' },
        { title: 'Dev', company: 'B', start: '2022-07', end: '2024-07' },
      ],
      NOW
    );
    expect(summary.totalYears).toBe(2.5);
    expect(summary.nonStandardEntries).toBe(1);
    expect(summary.notes.some((n) => n.includes('internship'))).toBe(true);
  });

  it('excludes undated entries from the total and flags them instead of guessing', () => {
    const summary = calculateExperienceSummary(
      [
        { title: 'Mystery role', company: '??' },
        { title: 'Dev', company: 'A', start: '2023-01', end: '2024-01' },
      ],
      NOW
    );
    expect(summary.totalYears).toBe(1);
    expect(summary.undatedEntries).toBe(1);
    expect(summary.notes.some((n) => n.includes('no usable dates'))).toBe(true);
  });

  it('returns an explicit insufficient summary when nothing is dated', () => {
    const summary = calculateExperienceSummary([{ title: 'Freelancer' }], NOW);
    expect(summary.totalYears).toBeNull();
    expect(summary.precision).toBe('none');
    expect(summary.undatedEntries).toBe(1);
    expect(summary.notes.length).toBeGreaterThan(0);
  });

  it('ignores inverted dates rather than producing negative experience', () => {
    const summary = calculateExperienceSummary(
      [{ title: 'Dev', company: 'A', start: '2024-01', end: '2023-01' }],
      NOW
    );
    expect(summary.totalYears).toBeNull();
    expect(summary.undatedEntries).toBe(1);
  });

  it('is reproducible for the same entries and clock (§6.5)', () => {
    const entries = [
      { title: 'Dev', company: 'A', start: '2021-03', end: '2024-06' },
      { title: 'Dev', company: 'B', start: '2023-01', end: 'Present' },
    ];
    const a = calculateExperienceSummary(entries, NOW);
    const b = calculateExperienceSummary(entries, NOW);
    expect(a).toEqual(b);
  });
});
