import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    pool: 'forks',
    // Slow machines + cold module imports (e.g. @sentry/node) can exceed the
    // 5s default per-test timeout when the full suite runs in parallel.
    testTimeout: 20_000,
    // Cap parallel forks: on Windows, spawning one fork per test file can
    // exhaust the worker pool and fail tests to start at all.
    maxWorkers: 4,
    // Only pick up tests from __tests__/ at the project root —
    // without this, vitest also runs stale copies under .next/standalone/.
    include: ['__tests__/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
