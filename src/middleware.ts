import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Example basic RBAC middleware template
  // In a real application, this would read the token and check roles
  
  const pathname = request.nextUrl.pathname;
  
  // Protect routes that require specific roles
  if (pathname.startsWith('/admin')) {
    // Check if user is System Administrator
    // if (!isSystemAdmin) return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  if (pathname.startsWith('/jobs')) {
    // Jobs require Recruiter, Recruitment Manager, or Hiring Manager roles
    // if (!hasRecruitmentRole) return NextResponse.redirect(new URL('/unauthorized', request.url));
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
