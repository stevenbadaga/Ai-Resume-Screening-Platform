import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Per-request CSP nonce (spec §9 Security).
 *
 * In production the Content-Security-Policy for scripts uses a per-request
 * nonce instead of 'unsafe-inline' / 'unsafe-eval' (Next.js requires
 * 'unsafe-eval' only in dev for its overlay). The nonce is generated in
 * middleware, forwarded to the app on the `x-nonce` request header (Next.js
 * reads the CSP header from middleware and tags its own scripts with the
 * same nonce), and the policy is set here so it applies to every page.
 * Dev keeps a relaxed policy to avoid breaking the dev overlay/HMR.
 */
/** Builds the per-request nonce + CSP string (prod only; dev returns null). */
function buildCsp(request: NextRequest): { nonce: string; csp: string } | null {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return null; // next.config.ts static headers cover dev

  const nonce = crypto.randomUUID().replace(/-/g, '');

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob:`,
    // OpenAI is called server-side only; no browser connect-src needed.
    `connect-src 'self'`,
    `frame-ancestors 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
  ].join('; ');

  return { nonce, csp };
}

/**
 * For redirects (no body) — just attach the policy as a response header.
 */
function withCsp(request: NextRequest, response: NextResponse) {
  const built = buildCsp(request);
  if (!built) return response;
  response.headers.set('Content-Security-Policy', built.csp);
  return response;
}

/**
 * For rendered pages — the CSP must ALSO be forwarded on the REQUEST headers:
 * Next.js reads the request's Content-Security-Policy to discover the nonce
 * and stamps it onto its own <script> tags. Setting only the response header
 * makes the browser reject every script under 'strict-dynamic', leaving the
 * page stuck on its SSR shell (no hydration, no sign-in form).
 */
function nextWithCsp(request: NextRequest): NextResponse {
  const built = buildCsp(request);
  if (!built) return NextResponse.next();

  // Belt and braces: mutate the original request (some proxy runtimes only
  // forward those) AND pass an explicit request override.
  request.headers.set('x-nonce', built.nonce);
  request.headers.set('Content-Security-Policy', built.csp);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', built.nonce);
  requestHeaders.set('Content-Security-Policy', built.csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', built.csp);
  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Decode JWT token to check authentication and roles. The cookie name must
  // match authOptions (src/app/api/auth/[...nextauth]/route.ts): production
  // builds use the __Secure- prefixed cookie even over http (e.g. staging
  // behind a plain-HTTP proxy), so derive it from NODE_ENV — not from whether
  // NEXTAUTH_URL is https, which is what getToken would otherwise assume.
  const secureCookie = process.env.NODE_ENV === 'production';
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie,
  });

  // Signed-out visitors may browse published openings.
  if (!token && pathname === '/jobs') return nextWithCsp(request);

  // Signed-out users must always be able to reach the auth pages themselves —
  // redirecting /auth/signin to /auth/signin would loop forever and make the
  // whole application unreachable without an existing session.
  if (!token && pathname.startsWith('/auth/')) {
    return nextWithCsp(request);
  }

  // If no token and accessing a protected route, redirect to sign-in
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return withCsp(request, NextResponse.redirect(signInUrl));
  }

  if (token.accountDisabled && !pathname.startsWith('/auth/')) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('error', 'AccountUnavailable');
    return withCsp(request, NextResponse.redirect(signInUrl));
  }

  if (token.mustChangePassword && pathname !== '/auth/first-login') {
    const setupUrl = new URL('/auth/first-login', request.url);
    setupUrl.searchParams.set('callbackUrl', `${pathname}${request.nextUrl.search}`);
    return withCsp(request, NextResponse.redirect(setupUrl));
  }

  if (pathname === '/jobs') return nextWithCsp(request);

  const userRole = (token.role as string) || 'Candidate';

  // Protect admin routes — require Admin role
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'Admin') {
      return withCsp(request, NextResponse.redirect(new URL('/dashboard', request.url)));
    }
  }

  // Protect audit inspection routes — require Admin or ComplianceAuditor role
  if (pathname.startsWith('/audit')) {
    const auditRoles = ['Admin', 'ComplianceAuditor', 'Auditor'];
    if (!auditRoles.includes(userRole)) {
      return withCsp(request, NextResponse.redirect(new URL('/dashboard', request.url)));
    }
  }

  // Protect internal candidate review routes — require recruitment staff roles
  // Note: /candidates/apply is public/candidate-accessible intake
  if (pathname.startsWith('/candidates') && !pathname.startsWith('/candidates/apply')) {
    const recruitmentRoles = ['Admin', 'Recruiter', 'HiringManager', 'Interviewer', 'ComplianceAuditor'];
    if (!recruitmentRoles.includes(userRole)) {
      return withCsp(request, NextResponse.redirect(new URL('/dashboard/my-applications', request.url)));
    }
  }

  return nextWithCsp(request);
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/audit/:path*',
    '/candidates/:path*',
    // Run on dashboard/auth pages too so every document response carries the
    // nonce CSP in production (config matcher must stay static).
    '/dashboard/:path*',
    '/auth/:path*',
    '/privacy/:path*',
    '/jobs/:path*',
    '/',
  ],
};
