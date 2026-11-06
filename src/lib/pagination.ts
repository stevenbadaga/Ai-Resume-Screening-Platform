/**
 * Shared server-side pagination primitives (spec §9 Performance).
 *
 * The candidates pipeline, jobs board, and audit screen all page in the
 * database — the page size and parameter parsing must be identical
 * everywhere so dashboards, exports, and lists agree on totals.
 */

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export interface PageInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Parses `page`/`pageSize` from loose search-param values with clamping. */
export function parsePagination(
  params: Record<string, string | string[] | undefined>,
  defaultPageSize: number = DEFAULT_PAGE_SIZE
): { page: number; pageSize: number; skip: number; take: number } {
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const rawSize = Array.isArray(params.pageSize) ? params.pageSize[0] : params.pageSize;

  const page = Math.max(1, Math.floor(Number(rawPage)) || 1);
  const parsedSize = Math.floor(Number(rawSize));
  // Invalid (NaN, 0, negative) sizes fall back to the default — a hostile
  // `pageSize=-1` must not produce a 1-row page.
  const requestedSize = Number.isFinite(parsedSize) && parsedSize >= 1 ? parsedSize : defaultPageSize;
  const pageSize = Math.min(requestedSize, MAX_PAGE_SIZE);

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

/** Builds the PageInfo object to hand to client pager components. */
export function toPageInfo(page: number, pageSize: number, total: number): PageInfo {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** True when a search-param value is a meaningful (non-empty) string. */
export function firstParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const value = params[key];
  const first = Array.isArray(value) ? value[0] : value;
  return first && first.trim() ? first.trim() : undefined;
}

/**
 * Builds a URL that preserves current params, replaces `updates`, and drops
 * keys whose value is null/undefined/'ALL'/''.
 *
 * Pagination rule: any update that touches a NON-page key (a filter change)
 * resets to page 1 automatically — a user narrowing results must never land
 * on a stale deep page. Explicit `page` updates pass through unchanged.
 */
export function buildPageUrl(
  basePath: string,
  current: Record<string, string | string[] | undefined>,
  updates: Record<string, string | number | null | undefined>
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v && v !== 'ALL') params.set(key, v);
  }

  const updatesKeys = Object.keys(updates);
  const touchesFilter = updatesKeys.some((key) => key !== 'page');
  if (touchesFilter && !('page' in updates)) {
    params.delete('page');
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === '' || value === 'ALL') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
