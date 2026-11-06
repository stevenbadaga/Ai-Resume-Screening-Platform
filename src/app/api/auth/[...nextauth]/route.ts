import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'NEXTAUTH_SECRET is not set — sessions cannot be signed securely. ' +
      'Generate one with: openssl rand -base64 32'
  );
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
