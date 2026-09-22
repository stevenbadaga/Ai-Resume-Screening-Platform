/**
 * Spec §14 — Browser-level E2E: the recruiter workflow.
 *
 * Walks the minimum completion standard in a real Chromium browser against
 * the running app, using the scoped dataset seeded in global-setup:
 *
 *   sign in → jobs list (rubric preview) → candidates pipeline →
 *   candidate profile (evidence, blind screening, score recalibration) →
 *   record human decision with reason (§6.7) → schedule interview (§6.8) →
 *   submit structured scorecard (§6.8) → audit trail visibility (§6.12) →
 *   manager analytics page (§6.10) → CSV export → secure sign-out.
 *
 * Self-skips when TEST_DATABASE_URL is not set (no seeded dataset).
 */
import { test, expect } from '@playwright/test';
import { E2E } from './constants';

const skip = !process.env.TEST_DATABASE_URL;

test.describe('recruiter workflow E2E (spec §14)', () => {
  test.skip(skip, 'TEST_DATABASE_URL not set — E2E requires the scoped seeded dataset');

  test('signs in as the seeded recruiter', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('heading', { name: /sign in to recruitai/i })).toBeVisible();

    await page.fill('#signin-email', E2E.recruiter.email);
    await page.fill('#signin-password', E2E.recruiter.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Successful sign-in lands on the dashboard; the UserNav button's
    // accessible name contains "<firstName> <role>" (e.g. "Rosa Admin").
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await expect(
      page.getByRole('button', { name: new RegExp(E2E.recruiter.name.split(' ')[0]) }).first()
    ).toBeVisible();
  });

  test('creates a job requisition from the UI', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('#signin-email', E2E.recruiter.email);
    await page.fill('#signin-password', E2E.recruiter.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.goto('/jobs');
    await page.getByRole('button', { name: /\+ create requisition/i }).click();

    const jobTitle = `E2E UI Job ${Date.now().toString(36)}`;
    await page.fill('input[placeholder*="Senior Frontend Architect"]', jobTitle);
    await page.fill('textarea[placeholder*="Responsibilities"]', 'Created by the browser E2E test.');
    // The modal's submit button (distinct from the "+ Create Requisition"
    // trigger behind the backdrop, which intercepts pointer events).
    await page.getByRole('button', { name: /publish requisition/i }).click();

    // The new requisition appears as a DRAFT card with its default rubric
    // (the title also appears in the success toast — assert the card heading)
    await expect(page.getByRole('heading', { name: jobTitle })).toBeVisible({ timeout: 20_000 });
  });

  test('shows the seeded job with rubric preview', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('#signin-email', E2E.recruiter.email);
    await page.fill('#signin-password', E2E.recruiter.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.goto('/jobs');
    await expect(page.getByText(E2E.job.title)).toBeVisible({ timeout: 20_000 });

    // §6.2: readable pre-screen rubric preview
    await page.getByRole('button', { name: /preview rubric/i }).first().click();
    await expect(page.getByText(/pre-screen rubric preview/i)).toBeVisible();
    await expect(page.getByText('Node.js backend experience')).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
  });

  test('finds the seeded candidate in the pipeline and opens the profile', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('#signin-email', E2E.recruiter.email);
    await page.fill('#signin-password', E2E.recruiter.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.goto('/candidates');
    await expect(page.getByText(`${E2E.candidate.firstName} ${E2E.candidate.lastName}`)).toBeVisible({ timeout: 20_000 });

    await page.getByText(`${E2E.candidate.firstName} ${E2E.candidate.lastName}`).first().click();
    await page.waitForURL(/\/candidates\/[^/]+$/);

    // §6.5: explainable score + criterion evidence are on the profile
    await expect(page.getByText(/\d+%/).first()).toBeVisible();
    await expect(page.getByText('Node.js backend experience')).toBeVisible();
    // §6.5/§7: verbatim evidence quote from the resume
    await expect(page.getByText(/Node\.js and PostgreSQL developer/i).first()).toBeVisible();
  });

  test('toggles blind screening and hides candidate PII', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('#signin-email', E2E.recruiter.email);
    await page.fill('#signin-password', E2E.recruiter.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.goto('/candidates');
    await page.getByText(`${E2E.candidate.firstName} ${E2E.candidate.lastName}`).first().click();
    await page.waitForURL(/\/candidates\/[^/]+$/);

    // §7: blind screening is the DEFAULT — the profile anonymizes the
    // candidate ("Candidate #XXXXXXXX") and hides the email until revealed.
    await expect(page.getByText(/Candidate #/).first()).toBeVisible();
    await expect(page.getByText(E2E.candidate.email)).toBeHidden();

    // Reveal PII shows the email
    await page.getByRole('button', { name: /reveal pii/i }).click();
    await expect(page.getByText(E2E.candidate.email).first()).toBeVisible();

    // And blind screening hides it again
    await page.getByRole('button', { name: /blind screen/i }).click();
    await expect(page.getByText(/Candidate #/).first()).toBeVisible();
    await expect(page.getByText(E2E.candidate.email)).toBeHidden();
  });

  test('recalibrates the AI score with a mandatory reason (§6.5 override)', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('#signin-email', E2E.recruiter.email);
    await page.fill('#signin-password', E2E.recruiter.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.goto('/candidates');
    await page.getByText(`${E2E.candidate.firstName} ${E2E.candidate.lastName}`).first().click();
    await page.waitForURL(/\/candidates\/[^/]+$/);

    await page.getByRole('button', { name: /recalibrate/i }).click();
    await page.fill('input[type="number"]', '91');
    await page.fill('textarea[placeholder*="Justification"], textarea[placeholder*="Reason"], textarea >> visible=true', 'E2E: verified deeper PostgreSQL evidence in the resume.').catch(async () => {
      // Fallback: the override modal's textarea is the only one visible
      await page.locator('textarea').last().fill('E2E: verified deeper PostgreSQL evidence in the resume.');
    });
    await page.getByRole('button', { name: /save|apply|confirm/i }).last().click();

    // Toast confirms the recalibration and the score updates (assert the
    // toast heading once — the description also contains "recalibrated")
    await expect(page.getByRole('heading', { name: /score recalibrated/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('91%').first()).toBeVisible();
  });

  test('records a human decision with reason and updates the stage (§6.7)', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('#signin-email', E2E.recruiter.email);
    await page.fill('#signin-password', E2E.recruiter.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.goto('/candidates');
    await page.getByText(`${E2E.candidate.firstName} ${E2E.candidate.lastName}`).first().click();
    await page.waitForURL(/\/candidates\/[^/]+$/);

    // §6.7: shortlist requires a recorded human reason
    await page.getByRole('button', { name: /shortlist candidate/i }).click();
    await expect(page.getByText(/record.*decision|decision.*modal/i).first()).toBeVisible();
    await page.selectOption('select >> visible=true', { index: 0 }); // decision type
    await page.locator('textarea').last().fill('E2E: strong backend evidence across required criteria.');
    await page.getByRole('button', { name: /confirm & apply decision/i }).click();

    // Stage updates to SHORTLISTED on the profile
    await expect(page.getByText('SHORTLISTED').first()).toBeVisible({ timeout: 20_000 });
  });

  test('schedules an interview from the profile (§6.8)', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('#signin-email', E2E.recruiter.email);
    await page.fill('#signin-password', E2E.recruiter.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.goto('/candidates');
    await page.getByText(`${E2E.candidate.firstName} ${E2E.candidate.lastName}`).first().click();
    await page.waitForURL(/\/candidates\/[^/]+$/);

    await page.getByRole('link', { name: /schedule/i }).first().click();
    await page.waitForURL(/\/interview$/);

    // Pick a future slot and confirm
    const future = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const local = new Date(future.getTime() - future.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
    await page.fill('input[type="datetime-local"]', local);
    await page.getByRole('button', { name: /schedule|confirm/i }).last().click();

    // Success banner then redirect back to the profile
    await expect(page.getByText(/interview scheduled successfully/i)).toBeVisible({ timeout: 30_000 });
    await page.waitForURL(/\/candidates\/[^/]+$/, { timeout: 30_000 });
    await expect(page.getByText(/interview/i).first()).toBeVisible();
  });

  test('submits a structured scorecard and shows the completed evaluation (§6.8)', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('#signin-email', E2E.recruiter.email);
    await page.fill('#signin-password', E2E.recruiter.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.goto('/candidates');
    await page.getByText(`${E2E.candidate.firstName} ${E2E.candidate.lastName}`).first().click();
    await page.waitForURL(/\/candidates\/[^/]+$/);

    await page.getByRole('button', { name: /scorecard/i }).first().click();
    // Ratings default to 4/4/5 — set explicit values
    const selects = page.locator('select');
    await selects.nth(0).selectOption('5');
    await selects.nth(1).selectOption('4');
    await selects.nth(2).selectOption('5');
    await selects.nth(3).selectOption('HIRE');
    await page.locator('textarea').last().fill('E2E: excellent system design walkthrough.');
    await page.getByRole('button', { name: /submit interview scorecard/i }).click();

    // Completed evaluation appears with the recommendation
    await expect(page.getByText(/HIRE/).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/excellent system design walkthrough/i)).toBeVisible();
  });

  test('shows the audit trail to authorized staff (§6.12)', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('#signin-email', E2E.recruiter.email);
    await page.fill('#signin-password', E2E.recruiter.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.goto('/audit');
    // §6.12: searchable audit history; the ledger renders events
    await expect(page.getByText('Tamper-Evident Security & Audit Ledger')).toBeVisible();
    await expect(page.locator('table, [class*="audit"]').first()).toBeVisible();
  });

  test('renders the manager analytics page with §6.10 metrics', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('#signin-email', E2E.recruiter.email);
    await page.fill('#signin-password', E2E.recruiter.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.goto('/dashboard/analytics');
    await expect(page.getByText(/manager analytics/i).first()).toBeVisible();
    await expect(page.getByText(/time to screen/i)).toBeVisible();
    await expect(page.getByText(/stage distribution/i)).toBeVisible();
    await expect(page.getByText(/recruiter workload/i)).toBeVisible();
  });

  test('exports the recruitment CSV with the seeded application (§6.10/§6.11)', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('#signin-email', E2E.recruiter.email);
    await page.fill('#signin-password', E2E.recruiter.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    const response = await page.request.get('/api/export');
    expect(response.status()).toBe(200);
    const csv = await response.text();
    expect(csv).toContain('Application ID');
    expect(csv).toContain(E2E.candidate.email);
  });

  test('signs out and blocks unauthenticated access to the pipeline', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('#signin-email', E2E.recruiter.email);
    await page.fill('#signin-password', E2E.recruiter.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Sign out via the user menu (UserNav button name contains "<firstName>")
    const userMenu = page.getByRole('button', { name: new RegExp(E2E.recruiter.name.split(' ')[0]) }).first();
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.getByText(/sign out/i).first().click();
    }

    // §6.1: protected pages redirect unauthenticated visitors to sign-in
    await page.goto('/candidates');
    await page.waitForURL(/\/auth\/signin/, { timeout: 20_000 });
  });
});
