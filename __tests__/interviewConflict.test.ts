import { describe, it, expect } from 'vitest';

function checkTimeConflict(
  newStart: Date,
  newDurationMinutes: number,
  existingSchedule: Date,
  existingDurationMinutes: number
): boolean {
  const newEnd = new Date(newStart.getTime() + newDurationMinutes * 60_000);
  const existingEnd = new Date(existingSchedule.getTime() + existingDurationMinutes * 60_000);
  return newStart < existingEnd && newEnd > existingSchedule;
}

describe('Interview Conflict Detection (§6.8)', () => {
  const slotStart = new Date('2026-09-25T10:00:00Z');
  const slotDuration = 60; // 10:00 - 11:00

  it('detects an exact overlap', () => {
    const existing = new Date('2026-09-25T10:00:00Z');
    expect(checkTimeConflict(slotStart, slotDuration, existing, 60)).toBe(true);
  });

  it('detects a partial overlap where new interview starts before existing ends', () => {
    const existing = new Date('2026-09-25T09:30:00Z'); // 09:30 - 10:30
    expect(checkTimeConflict(slotStart, slotDuration, existing, 60)).toBe(true);
  });

  it('detects a partial overlap where existing starts inside new interview slot', () => {
    const existing = new Date('2026-09-25T10:45:00Z'); // 10:45 - 11:45
    expect(checkTimeConflict(slotStart, slotDuration, existing, 60)).toBe(true);
  });

  it('detects complete enclosure of an existing shorter interview', () => {
    const existing = new Date('2026-09-25T10:15:00Z'); // 10:15 - 10:45 (30 mins)
    expect(checkTimeConflict(slotStart, slotDuration, existing, 30)).toBe(true);
  });

  it('allows back-to-back non-overlapping interviews', () => {
    const previousInterview = new Date('2026-09-25T09:00:00Z'); // 09:00 - 10:00
    expect(checkTimeConflict(slotStart, slotDuration, previousInterview, 60)).toBe(false);

    const nextInterview = new Date('2026-09-25T11:00:00Z'); // 11:00 - 12:00
    expect(checkTimeConflict(slotStart, slotDuration, nextInterview, 60)).toBe(false);
  });

  it('allows interviews scheduled on different dates', () => {
    const differentDay = new Date('2026-09-26T10:00:00Z');
    expect(checkTimeConflict(slotStart, slotDuration, differentDay, 60)).toBe(false);
  });
});
