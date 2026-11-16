import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { permissionsForRoleName, ApplicationRole } from '@/lib/roleAccess';

const DEMO_ORG_NAME = 'RecruitAI Demo Workspace';
const DEMO_DOMAIN = 'demo.local';
const DEMO_SECRET_PASSWORD = 'Demo-Passw0rd!2026';

interface RoleConfig {
  email: string;
  name: string;
  roleName: ApplicationRole;
  destination: string;
}

const ROLE_CONFIGS: Record<'candidate' | 'recruiter' | 'admin', RoleConfig> = {
  candidate: {
    email: `candidate@${DEMO_DOMAIN}`,
    name: 'Casey Sample (Demo Candidate)',
    roleName: 'Candidate',
    destination: '/dashboard/my-applications',
  },
  recruiter: {
    email: `recruiter@${DEMO_DOMAIN}`,
    name: 'Rosa Sample (Demo Recruiter)',
    roleName: 'Recruiter',
    destination: '/dashboard',
  },
  admin: {
    email: `admin@${DEMO_DOMAIN}`,
    name: 'Amara Sample (Demo Admin)',
    roleName: 'Admin',
    destination: '/dashboard',
  },
};

/**
 * POST /api/auth/demo-login
 * Body: { role: 'candidate' | 'recruiter' | 'admin' }
 *
 * Self-healing, 1-click demo login endpoint.
 * Guarantees that the demo user, role, and organization exist (upserting if needed),
 * satisfies the 2FA requirement by stamping a verified LOGIN_MFA ticket,
 * sets the required NextAuth MFA cookie, and returns credentials for immediate sign-in.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const roleKey = (body?.role || 'recruiter') as 'candidate' | 'recruiter' | 'admin';
    const config = ROLE_CONFIGS[roleKey] || ROLE_CONFIGS.recruiter;

    // 1. Ensure the demo organization exists
    let org = await prisma.organization.findFirst({
      where: { name: DEMO_ORG_NAME },
    });
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: DEMO_ORG_NAME,
          verifiedEmailDomain: DEMO_DOMAIN,
        },
      });
    }

    // 2. Ensure the role exists with standard permissions
    let roleRecord = await prisma.role.findFirst({
      where: { name: config.roleName },
    });
    if (!roleRecord) {
      const perms = permissionsForRoleName(config.roleName);
      roleRecord = await prisma.role.create({
        data: {
          name: config.roleName,
          permissions: perms,
        },
      });
    }

    // 3. Ensure the user exists with active verified status
    const passwordHash = await bcrypt.hash(DEMO_SECRET_PASSWORD, 10);
    let user = await prisma.user.findUnique({
      where: { email: config.email },
      include: { roles: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: config.email,
          name: config.name,
          passwordHash,
          accessStatus: 'ACTIVE',
          emailVerifiedAt: new Date(),
          organizationId: org.id,
          roles: { connect: { id: roleRecord.id } },
        },
        include: { roles: true },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          accessStatus: 'ACTIVE',
          emailVerifiedAt: user.emailVerifiedAt || new Date(),
          roles: {
            set: [{ id: roleRecord.id }],
          },
        },
        include: { roles: true },
      });
    }

    // 4. Issue and solve a short-lived LOGIN_MFA verification code in the database
    const solvedHash = Buffer.from('demo:' + user.id + ':' + Date.now().toString(36)).toString('base64');
    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        purpose: 'LOGIN_MFA',
        codeHash: solvedHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        verifiedAt: new Date(),
        maxAttempts: 1,
      },
    });

    // 5. Generate MFA ticket and set HTTP-only cookie for NextAuth authorize()
    const mfaTicket = `v1:${user.id}:${Date.now()}`;
    const response = NextResponse.json({
      success: true,
      email: user.email,
      password: DEMO_SECRET_PASSWORD,
      mfaTicket,
      role: config.roleName,
      destination: config.destination,
    });

    response.cookies.set('nextauth.mfa', mfaTicket, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 120,
    });

    return response;
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize demo login session.' },
      { status: 500 }
    );
  }
}
