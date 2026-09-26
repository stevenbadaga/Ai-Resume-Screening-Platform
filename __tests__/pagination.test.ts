import { describe, it, expect } from 'vitest';
import {
  parsePagination,
  toPageInfo,
  firstParam,
  buildPageUrl,
  MAX_PAGE_SIZE,
} from '../src/lib/pagination';

describe('shared pagination primitives (§9 performance)', () => {
  it('parses page/pageSize with sane defaults', () => {
    expect(parsePagination({})).toEqual({ page: 1, pageSize: 50, skip: 0, take: 50 });
    expect(parsePagination({ page: '3' })).toEqual({ page: 3, pageSize: 50, skip: 100, take: 50 });
    expect(parsePagination({ page: '2', pageSize: '25' })).toEqual({
      page: 2, pageSize: 25, skip: 25, take: 25,
    });
  });

  it('rejects garbage and clamps hostile values', () => {
    expect(parsePagination({ page: 'abc' }).page).toBe(1);
    expect(parsePagination({ page: '-5' }).page).toBe(1);
    expect(parsePagination({ page: '0' }).page).toBe(1);
    expect(parsePagination({ pageSize: '99999' }).pageSize).toBe(MAX_PAGE_SIZE);
    expect(parsePagination({ pageSize: '-1' }).pageSize).toBe(50);
    // Array-valued params (repeated query keys) use the first entry.
    expect(parsePagination({ page: ['4', '9'] }).page).toBe(4);
  });

  it('builds correct PageInfo with at least one page', () => {
    expect(toPageInfo(1, 50, 0)).toEqual({ page: 1, pageSize: 50, total: 0, totalPages: 1 });
    expect(toPageInfo(2, 50, 120)).toEqual({ page: 2, pageSize: 50, total: 120, totalPages: 3 });
  });

  it('extracts the first meaningful param value', () => {
    expect(firstParam({ q: ' engineer ' }, 'q')).toBe('engineer');
    expect(firstParam({ q: '' }, 'q')).toBeUndefined();
    expect(firstParam({ q: ['a', 'b'] }, 'q')).toBe('a');
    expect(firstParam({}, 'q')).toBeUndefined();
  });

  it('builds URLs that preserve filters and reset pagination cleanly', () => {
    expect(
      buildPageUrl('/jobs', { status: 'OPEN', q: 'rust', page: '3' }, { page: 4 })
    ).toBe('/jobs?status=OPEN&q=rust&page=4');

    // Changing filters drops the page param.
    expect(
      buildPageUrl('/jobs', { status: 'OPEN', page: '3' }, { status: null })
    ).toBe('/jobs');

    // 'ALL' and empty values are dropped from both current and updates.
    expect(
      buildPageUrl('/audit', { action: 'ALL', actor: 'x' }, { page: null })
    ).toBe('/audit?actor=x');

    // No params at all → bare path.
    expect(buildPageUrl('/jobs', {}, { page: null })).toBe('/jobs');
  });
});
