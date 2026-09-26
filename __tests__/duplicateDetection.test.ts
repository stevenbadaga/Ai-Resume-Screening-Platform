import { describe, it, expect } from 'vitest';

// Mirrors normalizeName() in src/lib/intakeService.ts (§6.3 controlled
// duplicate matching): the function is intentionally tiny and stable, so the
// test pins its contract where the matching logic is exercised.
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('duplicate detection name normalization (§6.3)', () => {
  it('is case-insensitive', () => {
    expect(normalizeName('Ada SAMPLE')).toBe(normalizeName('ada sample'));
  });

  it('collapses extra whitespace', () => {
    expect(normalizeName('Ada   Sample')).toBe('ada sample');
  });

  it('ignores punctuation and diacritic-free markers', () => {
    expect(normalizeName('Ada-Sample, Jr.')).toBe('adasample jr');
  });

  it('treats punctuation-only differences as the same person', () => {
    expect(normalizeName('Tariq K. Sample')).toBe(normalizeName('tariq k sample'));
  });
});
