import { defineConfig, devices } from '@playwright/test';

/**
 * Browser-level E2E tests (spec §14).
 *
 * Runs the recruiter workflow in a real Chromium browser against a running
 * instance of the app:
 *   npm run build && npm run start   (or npm run dev)
 *   npx playwright test
 *
 * The suite requires TEST_DATABASE_URL so global-setup can seed a scoped
 * recruiter account + job + rubric + candidate with a screening run via
 * Prisma (same namespace discipline as the integration suite: per-run orgs
 * and emails, self-cleaning). It self-skips without it.
 *
 * BASE_URL (default http://127.0.0.1:3000) selects the app instance.
 */

const PORT = Number(process.env.PORT || 3000);
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  // Full workflow in one serial file — steps build on each other.
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
