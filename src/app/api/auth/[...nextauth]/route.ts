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
        const rateCheck = checkRateLimit(rateLimitKey, RATE_LIMITS.login);
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
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };