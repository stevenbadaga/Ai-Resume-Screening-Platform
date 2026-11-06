/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { hasRecentSolvedLoginCode } from "@/lib/verificationCode";
import { effectivePermissionsForRole } from "@/lib/roleAccess";
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Two-step sign-in: by the time signIn('credentials') is called, the
        // client has already proven factor 1 (password, /api/auth/login/challenge)
        // and factor 2 (emailed code, /api/auth/login/verify). authorize()
        // re-checks both proofs server-side and issues the session only when
        // they hold. Direct signIn('credentials', {email, password}) calls that
        // skipped the two-step dance fail here — the marker is absent.
        const mfaTicket = (credentials as Record<string, unknown> | undefined)?.mfaTicket;
        if (typeof mfaTicket !== 'string' || !mfaTicket.startsWith('v1:')) {
          return null;
        }
        const mfaUserId = mfaTicket.slice('v1:'.length).split(':')[0];
        if (!mfaUserId) return null;

        if (!credentials?.email || !credentials?.password) return null;

        // Rate limiting on login attempts (keyed by email to prevent brute-force on specific accounts)
        const rateLimitKey = `login:${credentials.email.toLowerCase().trim()}`;
        const rateCheck = await checkRateLimit(rateLimitKey, RATE_LIMITS.login);
        if (!rateCheck.allowed) {
          throw new Error('Too many login attempts. Please try again later.');
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { roles: true }
        });

        const invitationSetup = user?.accessStatus === 'INVITED' && user.mustChangePassword;
        if (!user || !user.passwordHash || (user.accessStatus !== 'ACTIVE' && !invitationSetup) || (!user.emailVerifiedAt && !invitationSetup)) return null;

        // Secure password comparison using bcrypt
        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValidPassword) return null;

        // Factor 2 proof: a LOGIN_MFA code for THIS account was solved
        // (verifiedAt stamped) within the last 5 minutes. The cookie alone is
        // not trusted — the database record is the source of truth.
        if (mfaUserId !== user.id) return null;
        const solvedRecently = await hasRecentSolvedLoginCode(user.id);
        if (!solvedRecently) return null;

        // Defense in depth — verify the ticket cookie too when running inside
        // a request scope where cookies() is readable (route handler context).
        // The DB check above is authoritative; this catches ticket/DB drift.
        try {
          const cookieStore = await cookies();
          const ticketCookie = cookieStore.get('nextauth.mfa')?.value;
          if (!ticketCookie || ticketCookie.split(':')[1] !== user.id) return null;
        } catch {
          // cookies() unavailable outside a request scope — DB check already passed.
        }

        const role = user.roles.length > 0 ? user.roles[0].name : "Candidate";
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: role,
          organizationId: user.organizationId,
          mustChangePassword: user.mustChangePassword,
          passwordChangedAt: user.passwordChangedAt,
          permissions: effectivePermissionsForRole(role, user.customPermissions),
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.passwordChangedAt = (user as any).passwordChangedAt?.toISOString() ?? null;
        token.mustChangePassword = Boolean((user as any).mustChangePassword);
        token.permissions = (user as any).permissions;
      }
      // Refresh claims from the database. Never accept permission or role
      // values sent by the browser.
      if (token.id) {
        const current = await prisma.user.findUnique({ where: { id: String(token.id) }, include: { roles: true } });
        if (!current || (current.accessStatus !== 'ACTIVE' && !(current.accessStatus === 'INVITED' && current.mustChangePassword))) {
          token.permissions = [];
          token.accountDisabled = true;
          return token;
        }
        token.accountDisabled = false;
        token.role = current.roles[0]?.name || 'Candidate';
        token.organizationId = current.organizationId;
        token.passwordChangedAt = current.passwordChangedAt?.toISOString() ?? null;
        token.mustChangePassword = current.mustChangePassword;
        token.permissions = effectivePermissionsForRole(String(token.role), current.customPermissions);
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).passwordChangedAt = token.passwordChangedAt ?? null;
        (session.user as any).mustChangePassword = Boolean(token.mustChangePassword);
        (session.user as any).permissions = token.permissions || [];
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  // Spec §6.1: secure session handling with expiry. Sessions expire after 8
  // hours of inactivity (checked on every request) instead of the NextAuth
  // default of 30 days, and the cookie is HTTPS-only in production.
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
    updateAge: 60 * 60, // refresh the expiry window hourly on activity
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
