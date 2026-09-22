import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Provide safe defaults for unit tests that import modules referencing prisma
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://mock:mock@127.0.0.1:5432/mock';
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || 'mock-nextauth-secret-for-testing-at-least-32-chars';

vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    organization: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    auditEvent: { create: vi.fn(), findMany: vi.fn() },
    resumeDocument: { findUnique: vi.fn(), update: vi.fn() },
    parsedProfile: { findUnique: vi.fn(), upsert: vi.fn() },
    rubric: { findUnique: vi.fn() },
    screeningRun: { create: vi.fn(), update: vi.fn() },
    criterionAssessment: { create: vi.fn() },
    communication: { create: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(cb => (typeof cb === 'function' ? cb({}) : Promise.resolve(cb))),
  },
}));

// Mock matchMedia for jsdom if running in DOM environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
