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

let cachedPasswordHash: string | null = null;
async function getDemoPasswordHash(): Promise<string> {
  if (!cachedPasswordHash) {
    cachedPasswordHash = await bcrypt.hash(DEMO_SECRET_PASSWORD, 10);
  }
  return cachedPasswordHash;
}

/**
 * Ensures a demo user, their role, and workspace organization exist in the DB.
 * Only runs if the user record is missing.
 */
async function bootstrapDemoUser(roleKey: 'candidate' | 'recruiter' | 'admin') {
  const config = ROLE_CONFIGS[roleKey];

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

  const passwordHash = await getDemoPasswordHash();
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

  return user;
}

/**
 * GET /api/auth/demo-login
 * Background pre-warmer. When called by the client upon landing on the signin page,
 * it verifies all 3 demo accounts so clicking any demo button is instant.
 */
export async function GET() {
  try {
    for (const key of ['candidate', 'recruiter', 'admin'] as const) {
      const cfg = ROLE_CONFIGS[key];
      const existing = await prisma.user.findUnique({
        where: { email: cfg.email },
        select: { id: true, accessStatus: true },
      });
      if (!existing || existing.accessStatus !== 'ACTIVE') {
        await bootstrapDemoUser(key);
      }
    }
    return NextResponse.json({ ready: true });
  } catch (error) {
    console.error('Demo warmup error:', error);
    return NextResponse.json({ ready: false }, { status: 500 });
  }
}

/**
 * POST /api/auth/demo-login
 * Body: { role: 'candidate' | 'recruiter' | 'admin' }
 *
 * Fast 1-click demo login endpoint.
 * Takes the fast-path when the demo user is already active,
 * satisfies 2FA via a solved LOGIN_MFA ticket, and sets the NextAuth cookie.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const roleKey = (body?.role || 'recruiter') as 'candidate' | 'recruiter' | 'admin';
    const config = ROLE_CONFIGS[roleKey] || ROLE_CONFIGS.recruiter;

    // Fast path: find existing active user with minimal fields
    let user = await prisma.user.findUnique({
      where: { email: config.email },
      select: {
        id: true,
        email: true,
        accessStatus: true,
        emailVerifiedAt: true,
      },
    });

    if (!user || user.accessStatus !== 'ACTIVE' || !user.emailVerifiedAt) {
      user = await bootstrapDemoUser(roleKey);
    }

    // Issue and solve a short-lived LOGIN_MFA verification code in the database
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

    // Generate MFA ticket and set HTTP-only cookie for NextAuth authorize()
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
