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
function withCsp(request: NextRequest, response: NextResponse) {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return response; // next.config.ts static headers cover dev

  const nonce = crypto.randomUUID().replace(/-/g, '');
  request.headers.set('x-nonce', nonce);

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob:`,
    // OpenAI is called server-side only; no browser connect-src needed.
    `connect-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
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

  // Signed-out users must always be able to reach the auth pages themselves —
  // redirecting /auth/signin to /auth/signin would loop forever and make the
  // whole application unreachable without an existing session.
  if (!token && pathname.startsWith('/auth/')) {
    return withCsp(request, NextResponse.next());
  }

  // If no token and accessing a protected route, redirect to sign-in
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return withCsp(request, NextResponse.redirect(signInUrl));
  }

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
  if (pathname.startsWith('/candidates')) {
    const recruitmentRoles = ['Admin', 'Recruiter', 'HiringManager', 'Interviewer', 'ComplianceAuditor'];
    if (!recruitmentRoles.includes(userRole)) {
      return withCsp(request, NextResponse.redirect(new URL('/dashboard/my-applications', request.url)));
    }
  }

  return withCsp(request, NextResponse.next());
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/audit/:path*',
    '/candidates/:path*',
    '/interviews/:path*',
    // Run on dashboard/auth pages too so every document response carries the
    // nonce CSP in production (config matcher must stay static).
    '/dashboard/:path*',
    '/auth/:path*',
    '/privacy/:path*',
    '/jobs/:path*',
    '/',
  ],
};
