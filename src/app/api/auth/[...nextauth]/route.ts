/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/rateLimit";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
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

        if (!user || !user.passwordHash || user.accessStatus !== 'ACTIVE') return null;

        // Secure password comparison using bcrypt
        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValidPassword) return null;

        // Email verification (spec §6.1): the credentials are correct at this
        // point, so telling the user their email is unverified leaks nothing.
        // next-auth surfaces thrown messages to the client's `error` field.
        if (!user.emailVerifiedAt) {
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        const role = user.roles.length > 0 ? user.roles[0].name : "Candidate";
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: role,
          organizationId: user.organizationId
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
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

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'NEXTAUTH_SECRET is not set — sessions cannot be signed securely. ' +
      'Generate one with: openssl rand -base64 32'
  );
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };