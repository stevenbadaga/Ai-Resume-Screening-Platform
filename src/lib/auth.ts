import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { Permission, effectivePermissionsForRole, type ApplicationRole, type Permission as PermissionType } from '@/lib/roleAccess';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  organizationId: string;
  departmentRestrictions: string[];
  mustChangePassword: boolean;
  permissions: PermissionType[];
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
 * Validates the current session.
 * @returns `{ user, error }` – if `error` is set, return it as the API response.
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
  return requireAuthInternal();
}

/**
 * Validates the current session AND enforces a permission from the typed
 * RBAC matrix (src/lib/roleAccess.ts). Preferred over the role-list overload:
 * the compiler checks the permission name, and role grants live in one place.
 *
 * @param permission – permission required to proceed (e.g. Permission.MakeHiringDecisions)
 */
export async function requirePermission(
  permission: Permission
): Promise<AuthResult | AuthError> {
  return requireAuthInternal({ permission });
}

/**
 * @deprecated Legacy guard — a hardcoded role-name whitelist. Kept only for
 * call sites not yet migrated to `requirePermission`; new code must not use it.
 */
export async function requireAuthWithRoles(
  allowedRoles: readonly ApplicationRole[]
): Promise<AuthResult | AuthError> {
  return requireAuthInternal({ allowedRoles });
}

async function requireAuthInternal(
  check?: { permission?: Permission; allowedRoles?: readonly ApplicationRole[] }
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

  // Spec §5: an invited account that still requires first-login password setup
  // must not access protected app features. They can only complete the first-login
  // password-set flow. This check runs even if the session is otherwise valid so
  // a stale session cannot bypass it.
  if (userRecord.mustChangePassword) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'ACCOUNT_SETUP_REQUIRED' },
        { status: 403 }
      ),
    };
  }

  // Session-revocation guard (spec §5, §6.1): if the password was changed
  // (first-login setup or password reset) AFTER this session was issued,
  // the stale session is no longer valid and the user must re-authenticate.
  const sessionPwdChanged = (session.user as any)?.passwordChangedAt;
  if (sessionPwdChanged && userRecord.passwordChangedAt) {
    const sessionChanged = new Date(sessionPwdChanged);
    if (userRecord.passwordChangedAt > sessionChanged) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Unauthorized: Session expired — please sign in again.' },
          { status: 401 }
        ),
      };
    }
  }

  const user: AuthenticatedUser = {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name,
    role: userRecord.roles[0]?.name || 'Candidate',
    organizationId: userRecord.organizationId,
    departmentRestrictions: userRecord.departmentRestrictions,
    mustChangePassword: Boolean(userRecord.mustChangePassword),
    permissions: effectivePermissionsForRole(userRecord.roles[0]?.name || 'Candidate', userRecord.customPermissions),
  };

  if (check) {
    const forbidden = NextResponse.json(
      { error: 'Forbidden: Insufficient role permissions' },
      { status: 403 }
    );

    if ('permission' in check && check.permission && !user.permissions.includes(check.permission)) {
      return { user: null, error: forbidden };
    }

    if ('allowedRoles' in check && check.allowedRoles && !check.allowedRoles.includes(user.role as ApplicationRole)) {
      return { user: null, error: forbidden };
    }
  }

  return { user, error: null };
}

export function canAccessDepartment(user: AuthenticatedUser, department?: string | null): boolean {
  if (!department || user.departmentRestrictions.length === 0) return true;
  return user.departmentRestrictions.includes(department);
}
