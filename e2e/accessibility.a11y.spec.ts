/**
 * Spec §9 Accessibility — automated axe-core scans of the core recruiter and
 * candidate pages (keyboard operability, labels, contrast, focus behavior).
 *
 * Self-skips when TEST_DATABASE_URL is not set (same seeded dataset as the
 * recruiter workflow E2E). Violations of "serious"/"critical" impact fail the
 * run; moderate/minor findings are reported without failing so they can be
 * scheduled.
 */
import { test, expect } from '@playwright/test';
import { injectAxe, getAxeResults } from 'axe-playwright';
import { E2E } from './constants';

const skip = !process.env.TEST_DATABASE_URL;

interface AxeViolation {
  id: string;
  impact?: string | null;
  help: string;
  nodes: Array<{ target: string[] }>;
}

async function signIn(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/auth/signin');
  await page.fill('#signin-email', email);
  await page.fill('#signin-password', password);
  await page.getByRole('button', { name: /sign in/i }).click();
  // Two-step sign-in: enter the emailed verification code (pre-staged solved
  // LOGIN_MFA code for the seeded recruiter — see e2e/global-setup.ts).
  await page.waitForSelector('#signin-code', { timeout: 20_000 });
  await page.fill('#signin-code', E2E.loginCode);
  await page.getByRole('button', { name: /verify & sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

/** Scan a page and assert no serious/critical accessibility violations. */
async function expectNoSeriousViolations(
  page: import('@playwright/test').Page,
  label: string
) {
  await injectAxe(page);
  const results = await getAxeResults(page);
  const serious = (results.violations ?? []).filter((v) =>
    ['serious', 'critical'].includes((v.impact ?? '').toLowerCase())
  );

  if (serious.length > 0) {
    // Print actionable detail so the violation can be located in the DOM.
    console.error(`[${label}] accessibility violations:`);
    for (const v of serious) {
      console.error(`  - ${v.id} (${v.impact}): ${v.help}`);
      for (const node of v.nodes.slice(0, 5)) {
        console.error(`      ${node.target.join(' ')}`);
      }
    }
  }

  expect(serious, `${label} should have no serious/critical a11y violations`).toEqual([]);
}

test.describe('accessibility scans (spec §9)', () => {
  test.skip(skip, 'TEST_DATABASE_URL not set — a11y scans require the seeded dataset');

  test('sign-in page is accessible', async ({ page }) => {
    await page.goto('/auth/signin');
    await expectNoSeriousViolations(page, 'auth/signin');
  });

  test('recruiter dashboard is accessible', async ({ page }) => {
    await signIn(page, E2E.recruiter.email, E2E.recruiter.password);
    await expectNoSeriousViolations(page, 'dashboard');
  });

  test('jobs board is accessible', async ({ page }) => {
    await signIn(page, E2E.recruiter.email, E2E.recruiter.password);
    await page.goto('/jobs');
    await expect(page.getByText(E2E.job.title)).toBeVisible({ timeout: 20_000 });
    await expectNoSeriousViolations(page, 'jobs');
  });

  test('candidate pipeline is accessible', async ({ page }) => {
    await signIn(page, E2E.recruiter.email, E2E.recruiter.password);
    await page.goto('/candidates');
    await expectNoSeriousViolations(page, 'candidates');
  });

  test('privacy page is accessible', async ({ page }) => {
    await signIn(page, E2E.recruiter.email, E2E.recruiter.password);
    await page.goto('/privacy');
    await expectNoSeriousViolations(page, 'privacy');
  });
});
