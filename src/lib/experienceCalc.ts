/**
 * Spec §6.6 — Experience calculations.
 *
 * "Experience calculations must account for overlapping dates, incomplete
 * dates, internships, part-time work, and gaps without inventing precision
 * that is not supported by the resume."
 *
 * Design rules:
 *  - Overlapping employments are MERGED into union intervals before summing,
 *    so concurrent roles never inflate the total.
 *  - Gaps between roles are excluded from the total and reported separately.
 *  - Partial dates (year only, or year+month) are accepted; the result's
 *    precision never exceeds the weakest input (year-only input ⇒ the total
 *    is reported as a whole-year figure and flagged).
 *  - Internships and part-time work ARE counted (they are real experience)
 *    but are itemised so a reviewer can discount them if the rubric requires.
 *  - Entries without any usable dates are excluded from the total and
 *    surfaced as `undatedEntries` — never silently guessed.
 *  - Nothing is rounded beyond the declared precision: totals are kept at
 *    0.1-year granularity from month-level input.
 */

export interface EmploymentEntryLike {
  title?: string | null;
  company?: string | null;
  /** Start date in any of: "2020", "2020-03", "2020-03-15". */
  start?: string | null;
  /** End date in the same formats; empty/absent/"present" = current role. */
  end?: string | null;
  /** Free-text type ("internship", "part-time", "contract"…). */
  type?: string | null;
}

export type ExperiencePrecision = 'year' | 'month' | 'none';

export interface ExperienceSummary {
  /** Total years of experience (union of dated intervals), or null when no dated entry exists. */
  totalYears: number | null;
  /** Weakest date precision among the intervals that produced the total. */
  precision: ExperiencePrecision;
  /** Entries considered (total parsed entries). */
  entriesConsidered: number;
  /** Entries excluded from the total because no usable date was found. */
  undatedEntries: number;
  /** Entries flagged as internship/part-time (counted, but itemised). */
  nonStandardEntries: number;
  /** Months of unexplained gap between merged intervals. */
  gapMonths: number;
  /** Months saved by merging overlapping intervals (double-count avoided). */
  overlapMonths: number;
  /** Human-readable uncertainty notes for reviewers (§6.5/§7). */
  notes: string[];
}

interface Interval {
  start: Date;
  end: Date;
  precision: ExperiencePrecision;
  partialStart: boolean;
  partialEnd: boolean;
  label: string;
  nonStandard: boolean;
  openEnded: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parses "2020", "2020-03" or "2020-03-15" into a bounded date. */
function parsePartialDate(raw: string | null | undefined, endOfMonth: boolean): { date: Date; precision: ExperiencePrecision } | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;

  const yearMatch = /^(\d{4})$/.exec(value);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    // Year-only: start → Jan 1, end → Dec 31 (flagged as reduced precision).
    return { date: new Date(Date.UTC(year, endOfMonth ? 11 : 0, 1)), precision: 'year' };
  }

  const monthMatch = /^(\d{4})-(\d{1,2})$/.exec(value);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Math.min(Math.max(Number(monthMatch[2]), 1), 12) - 1;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return {
      date: new Date(Date.UTC(year, month, endOfMonth ? lastDay : 1)),
      precision: 'month',
    };
  }

  const fullMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (fullMatch) {
    const year = Number(fullMatch[1]);
    const month = Math.min(Math.max(Number(fullMatch[2]), 1), 12) - 1;
    const day = Math.min(Math.max(Number(fullMatch[3]), 1), 31);
    return { date: new Date(Date.UTC(year, month, day)), precision: 'month' };
  }

  return null;
}

function isOpenEndedLabel(raw: string | null | undefined): boolean {
  if (!raw) return true;
  const value = String(raw).trim().toLowerCase();
  return value === '' || value === 'present' || value === 'current' || value === 'now' || value === 'ongoing';
}

function weakest(a: ExperiencePrecision, b: ExperiencePrecision): ExperiencePrecision {
  if (a === 'none' || b === 'none') return 'none';
  if (a === 'year' || b === 'year') return 'year';
  return 'month';
}

function toInterval(entry: EmploymentEntryLike, now: Date): Interval | null {
  const label = [entry.title, entry.company].filter(Boolean).join(' @ ') || 'Untitled role';
  const nonStandard = /intern|part[- ]?time|contract|freelance|volunteer/i.test(
    [entry.type, entry.title].filter(Boolean).join(' ')
  );

  const start = parsePartialDate(entry.start, false);
  if (!start) return null;

  const openEnded = isOpenEndedLabel(entry.end);
  let end: { date: Date; precision: ExperiencePrecision };
  if (openEnded) {
    end = { date: now, precision: 'month' };
  } else {
    const parsedEnd = parsePartialDate(entry.end, true);
    if (!parsedEnd) return null;
    end = parsedEnd;
  }

  if (end.date < start.date) return null; // inverted dates are not evidence

  return {
    start: start.date,
    end: end.date,
    precision: weakest(start.precision, end.precision),
    partialStart: start.precision !== 'month',
    partialEnd: openEnded || end.precision !== 'month',
    label,
    nonStandard,
    openEnded,
  };
}

/**
 * Computes a reproducible experience summary from parsed employment entries.
 * Pure function of (entries, now) so tests can pin `now`.
 */
export function calculateExperienceSummary(
  entries: EmploymentEntryLike[],
  now: Date = new Date()
): ExperienceSummary {
  const notes: string[] = [];
  const intervals: Interval[] = [];
  let undatedEntries = 0;
  let nonStandardEntries = 0;

  for (const entry of entries ?? []) {
    const interval = toInterval(entry, now);
    if (!interval) {
      undatedEntries += 1;
      notes.push(`Entry "${[entry.title, entry.company].filter(Boolean).join(' @ ')}" has no usable dates — excluded from the total.`);
      continue;
    }
    if (interval.nonStandard) nonStandardEntries += 1;
    if (interval.partialStart) {
      notes.push(`Start date of "${interval.label}" is reported at reduced precision.`);
    }
    intervals.push(interval);
  }

  if (intervals.length === 0) {
    return {
      totalYears: null,
      precision: 'none',
      entriesConsidered: entries?.length ?? 0,
      undatedEntries,
      nonStandardEntries,
      gapMonths: 0,
      overlapMonths: 0,
      notes: notes.length ? notes : ['No dated employment entries — experience total cannot be computed from this resume.'],
    };
  }

  // Sort by start, then merge overlapping/abutting intervals (union, not sum).
  intervals.sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Interval[] = [];
  let rawMonths = 0;
  let precision: ExperiencePrecision = 'month';

  for (const interval of intervals) {
    rawMonths += monthsBetween(interval.start, interval.end);
    precision = weakest(precision, interval.precision);
    const last = merged[merged.length - 1];
    if (last && interval.start.getTime() <= last.end.getTime()) {
      // Overlap (or same-day chain): extend the merged span.
      if (interval.end > last.end) last.end = interval.end;
      last.precision = weakest(last.precision, interval.precision);
      last.partialEnd = last.partialEnd || interval.partialEnd;
      last.nonStandard = last.nonStandard || interval.nonStandard;
      last.openEnded = last.openEnded || interval.openEnded;
    } else {
      merged.push({ ...interval });
    }
  }

  let unionMonths = 0;
  for (const interval of merged) unionMonths += monthsBetween(interval.start, interval.end);

  // Gaps between merged intervals (excluded from the total by construction).
  let gapMonths = 0;
  for (let i = 1; i < merged.length; i++) {
    gapMonths += monthsBetween(merged[i - 1].end, merged[i].start);
  }

  const overlapMonths = Math.max(0, rawMonths - unionMonths);
  if (overlapMonths > 0) {
    notes.push(`${monthsToYearsLabel(overlapMonths)} of overlapping employment was merged (concurrent roles are not double-counted).`);
  }
  if (gapMonths > 0) {
    notes.push(`${monthsToYearsLabel(gapMonths)} of gaps between roles is excluded from the total.`);
  }
  if (nonStandardEntries > 0) {
    notes.push(`${nonStandardEntries} internship/part-time/freelance entr${nonStandardEntries === 1 ? 'y is' : 'ies are'} included in the total.`);
  }
  if (precision === 'year') {
    notes.push('One or more dates are year-only — the total is rounded down to whole years to avoid invented precision.');
  }

  let totalYears = unionMonths / 12;
  // Never invent precision: year-precision input is reported whole.
  totalYears = precision === 'year' ? Math.floor(totalYears) : Math.round(totalYears * 10) / 10;

  return {
    totalYears,
    precision,
    entriesConsidered: entries?.length ?? 0,
    undatedEntries,
    nonStandardEntries,
    gapMonths,
    overlapMonths,
    notes,
  };
}

/** Whole months between two dates, counting a part-month as a month. */
function monthsBetween(start: Date, end: Date): number {
  if (end <= start) return 0;
  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());
  const dayAdjust = end.getUTCDate() >= start.getUTCDate() ? 0 : -1;
  const result = months + dayAdjust;
  if (result > 0) return result;
  // Sub-month span (e.g. same-month roles) still counts as one month.
  return end.getTime() - start.getTime() >= MS_PER_DAY ? 1 : 0;
}

function monthsToYearsLabel(months: number): string {
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} year(s) ${rest} month(s)` : `${years} year(s)`;
}
