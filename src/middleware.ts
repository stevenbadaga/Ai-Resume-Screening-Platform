import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Decode JWT token to check authentication and roles
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

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
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Protect job management routes — require recruitment roles
  if (pathname.startsWith('/jobs')) {
    const recruitmentRoles = ['Admin', 'Recruiter', 'HiringManager'];
    if (!recruitmentRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Protect candidate routes — require recruitment roles
  if (pathname.startsWith('/candidates')) {
    const recruitmentRoles = ['Admin', 'Recruiter', 'HiringManager', 'Interviewer'];
    if (!recruitmentRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/jobs/:path*',
    '/candidates/:path*',
    '/interviews/:path*'
  ],
};
