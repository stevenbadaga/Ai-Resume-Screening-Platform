import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

  // If no token and accessing a protected route, redirect to sign-in
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  const userRole = (token.role as string) || 'Candidate';

  // Protect admin routes — require Admin role
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'Admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Protect audit inspection routes — require Admin or ComplianceAuditor role
  if (pathname.startsWith('/audit')) {
    const auditRoles = ['Admin', 'ComplianceAuditor', 'Auditor'];
    if (!auditRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Protect internal candidate review routes — require recruitment staff roles
  if (pathname.startsWith('/candidates')) {
    const recruitmentRoles = ['Admin', 'Recruiter', 'HiringManager', 'Interviewer', 'ComplianceAuditor'];
    if (!recruitmentRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/dashboard/my-applications', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/audit/:path*',
    '/candidates/:path*',
    '/interviews/:path*'
  ],
};
