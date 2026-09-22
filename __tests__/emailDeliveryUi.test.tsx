// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * Honest email delivery — UI layer: when the signup API reports
 * emailDelivered:false, the UI must forward emailDelivery=failed so the
 * sign-in page shows the delivery-failure warning instead of a dead-end
 * "check your inbox" (spec §6.1/§6.9).
 */

const h = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routerRefresh: vi.fn(),
  searchParams: new Map<string, string>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: h.routerPush, refresh: h.routerRefresh, replace: vi.fn() }),
  useSearchParams: () => ({ get: (key: string) => h.searchParams.get(key) ?? null }),
}));

vi.mock('@/lib/i18n/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

vi.mock('next-auth/react', () => ({
  signIn: vi.fn().mockResolvedValue({}),
}));

import SignupPage from '@/app/auth/signup/page';
import SignInPage from '@/app/auth/signin/page';

beforeEach(() => {
  vi.clearAllMocks();
  h.searchParams.clear();
});

// ─────────────────────────────────────────────
// Signup redirect carries the delivery result
// ─────────────────────────────────────────────
async function fillAndSubmitSignup(emailDelivered: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        emailVerificationRequired: true,
        emailDelivered,
      }),
    })
  );

  const { container } = render(<SignupPage />);
  const inputs = container.querySelectorAll('input');
  fireEvent.change(inputs[0], { target: { value: 'Tess' } }); // first name
  fireEvent.change(inputs[1], { target: { value: 'Ngabo' } }); // last name
  fireEvent.change(inputs[2], { target: { value: 'tess@example.com' } }); // email
  fireEvent.change(inputs[3], { target: { value: 'Str0ng-Passw0rd!' } }); // password
  fireEvent.submit(container.querySelector('form')!);

  await waitFor(() => expect(h.routerPush).toHaveBeenCalled(), { timeout: 5000 });
}

describe('signup redirect — delivery-failed flag forwarding', () => {
  it('redirects with emailDelivery=failed when the verification email was NOT delivered', async () => {
    await fillAndSubmitSignup(false);
    expect(h.routerPush).toHaveBeenCalledWith('/auth/signin?registered=1&emailDelivery=failed');
  });

  it('redirects cleanly when the verification email WAS delivered', async () => {
    await fillAndSubmitSignup(true);
    expect(h.routerPush).toHaveBeenCalledWith('/auth/signin?registered=1');
  });

  it('defaults to the clean redirect for legacy APIs without the flag', async () => {
    await fillAndSubmitSignup(undefined);
    expect(h.routerPush).toHaveBeenCalledWith('/auth/signin?registered=1');
  });
});

// ─────────────────────────────────────────────
// Sign-in page renders the honest result of that redirect
// ─────────────────────────────────────────────
describe('sign-in page — post-signup banners', () => {
  it('shows the delivery-failure warning (with resend) when emailDelivery=failed', () => {
    h.searchParams.set('registered', '1');
    h.searchParams.set('emailDelivery', 'failed');

    render(<SignInPage />);

    expect(screen.getByText(/verification email could not be sent/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
    expect(screen.queryByText(/check your inbox/i)).not.toBeInTheDocument();
  });

  it('shows the normal check-your-inbox notice for a delivered verification email', () => {
    h.searchParams.set('registered', '1');

    render(<SignInPage />);

    expect(
      screen.getByText(/check your inbox and click the verification link/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/could not be sent/i)).not.toBeInTheDocument();
  });
});
