import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  organizationId: string;
}

interface AuthResult {
  user: AuthenticatedUser;
  error: null;
}

interface AuthError {
  user: null;
  error: NextResponse;
}

/**
 * Validates the current session and optionally checks role membership.
 *
 * Always uses `getServerSession(authOptions)` to ensure the JWT callbacks
 * populate the session with `id` and `role`.
 *
 * @param allowedRoles – optional whitelist of roles. If provided, user must have one of them.
 * @returns `{ user, error }` – if `error` is set, return it as the API response.
 */
export async function requireAuth(
  allowedRoles?: readonly string[]
): Promise<AuthResult | AuthError> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      ),
    };
  }

  const userId = (session.user as any)?.id || '';

  if (!userId) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized: Invalid session — no user ID' },
        { status: 401 }
      ),
    };
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true },
  });

  if (!userRecord || userRecord.accessStatus !== 'ACTIVE') {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized: Account is inactive' },
        { status: 401 }
      ),
    };
  }

  const user: AuthenticatedUser = {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name,
    role: userRecord.roles[0]?.name || 'Candidate',
    organizationId: userRecord.organizationId,
  };

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Forbidden: Insufficient role permissions' },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}
