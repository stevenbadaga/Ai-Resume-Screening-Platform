import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import bcrypt from 'bcryptjs';
import { signupSchema, validateBody, safeErrorResponse } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { resolveMx, resolve4, resolve6 } from 'node:dns/promises';
import {
  generateVerificationToken,
  isDisposableEmailDomain,
  EMAIL_VERIFICATION_TOKEN_TTL_MINUTES,
} from '@/lib/emailVerification';
import { sendRecordedEmail } from '@/lib/emailService';
import { resolveSignupRole } from '@/lib/signupRoles';
import { permissionsForRoleName } from '@/lib/roleAccess';
import { emailDomain, generateDomainClaimToken, isSharedEmailProviderDomain } from '@/lib/domainClaim';

const BCRYPT_SALT_ROUNDS = 12;

async function hasMailDomain(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  if (!domain) return false;

  try {
    const mxRecords = await resolveMx(domain);
    if (mxRecords.length > 0) return true;
  } catch {
    // Some valid domains accept mail without publishing MX records.
  }

  try {
    await Promise.any([resolve4(domain), resolve6(domain)]);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(req, 'signup');
    const rateCheck = await checkRateLimit(rateLimitKey, RATE_LIMITS.signup);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
      );
    }

    const body = await req.json();

    // Validate input with Zod
    const { data, error } = validateBody(signupSchema, body);
    if (error) return error;

    const { name, email: normalizedEmail, password, accountType, companyName } = data;

    if (!(await hasMailDomain(normalizedEmail))) {
      return NextResponse.json(
        { error: 'Please use an email address with a valid mail domain.' },
        { status: 422 }
      );
    }

    // Block known disposable/throwaway inbox providers.
    if (isDisposableEmailDomain(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Disposable email addresses are not allowed. Please use a permanent email address.' },
        { status: 422 }
      );
    }

    // SECURITY: The client-supplied role is always ignored. Role is resolved
    // server-side (see src/lib/signupRoles.ts): candidates are Candidates,
    // staff who FOUND a new workspace become its Admin (standard founder
    // model), and staff joining an existing workspace start as Recruiters —
    // only an Admin can elevate them via the audited team/role endpoint.

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in.' },
        { status: 409 }
      );
    }

    let organizationId = '';
    let assignedRoleName: 'Admin' | 'Recruiter' | 'Candidate';

    if (accountType === 'worker') {
      // Company name is REQUIRED for staff accounts — it becomes the display
      // name of a workspace they found. It is NOT an identity: routing is by
      // verified email domain (see below), so two workspaces may share a name
      // and name-squatting gains nothing.
      const targetOrgName = companyName?.trim();
      if (!targetOrgName) {
        return NextResponse.json(
          { error: 'Company or organization name is required for staff accounts.' },
          { status: 400 }
        );
      }

      // Identity routing (production policy): a staff signup joins the
      // workspace that has VERIFIED ownership of their email domain. If no
      // workspace has claimed their domain yet, they found a new one and
      // become its Admin — then prove domain ownership via DNS (see
      // /api/org/domain-claim) to let future teammates auto-join. A squatter
      // can neither claim a domain their email is not at, nor be routed into
      // a workspace by guessing its display name.
      const registrantDomain = emailDomain(normalizedEmail);
      let org = registrantDomain
        ? await prisma.organization.findFirst({
            where: { verifiedEmailDomain: registrantDomain }
          })
        : null;

      const foundedOrg = !org;

      if (!org) {
        // Pre-seed the DNS challenge for the founder's email domain so the
        // Admin can verify ownership right away — but never for shared public
        // provider namespaces (gmail.com etc.), which no tenant may claim.
        const seedDomain =
          registrantDomain && !isSharedEmailProviderDomain(registrantDomain)
            ? registrantDomain
            : null;
        const challengeToken = seedDomain ? generateDomainClaimToken() : null;
        org = await prisma.organization.create({
          data: {
            name: targetOrgName,
            pendingEmailDomain: seedDomain ?? undefined,
            domainClaimToken: challengeToken ?? undefined,
          },
        });
      }
      organizationId = org.id;

      assignedRoleName = resolveSignupRole({ accountType, foundedOrg });
    } else {
      // Candidate account attaches to the public application workspace for job
      // application scope. Created lazily with an explicit name — no fake company.
      const PUBLIC_WORKSPACE_NAME = process.env.PUBLIC_WORKSPACE_NAME || 'Public Applications Workspace';
      let defaultOrg = await prisma.organization.findFirst({
        where: { name: PUBLIC_WORKSPACE_NAME }
      });
      if (!defaultOrg) {
        defaultOrg = await prisma.organization.create({
          data: { name: PUBLIC_WORKSPACE_NAME }
        });
      }
      organizationId = defaultOrg.id;

      assignedRoleName = resolveSignupRole({ accountType, foundedOrg: false });
    }

    // Get or create the Role in DB — permission strings come from the RBAC
    // matrix via the single shared helper, never a local hardcoded list.
    let roleRecord = await prisma.role.findFirst({
      where: { name: assignedRoleName }
    });

    if (!roleRecord) {
      roleRecord = await prisma.role.create({
        data: {
          name: assignedRoleName,
          permissions: permissionsForRoleName(assignedRoleName)
        }
      });
    } else {
      // Self-heal legacy rows whose stored strings predate the unified matrix.
      const canonical = permissionsForRoleName(assignedRoleName);
      if (JSON.stringify([...roleRecord.permissions].sort()) !== JSON.stringify([...canonical].sort())) {
        roleRecord = await prisma.role.update({
          where: { id: roleRecord.id },
          data: { permissions: canonical },
        });
      }
    }

    // Hash password before storing
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create User record
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        organizationId,
        roles: {
          connect: { id: roleRecord.id }
        }
      },
      include: { roles: true }
    });

    // Record the workspace founder as the organization's owner (used by team
    // management to protect the last Admin from demotion/deletion).
    if (assignedRoleName === 'Admin') {
      await prisma.organization.update({
        where: { id: organizationId },
        data: { primaryOwnerId: user.id },
      });
    }

    // If Candidate, ensure a corresponding Candidate record exists for ATS tracking
    if (assignedRoleName === 'Candidate') {
      const existingCandidate = await prisma.candidate.findFirst({
        where: { email: normalizedEmail }
      });

      if (!existingCandidate) {
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || 'Applicant';
        const lastName = nameParts.slice(1).join(' ') || '';

        await prisma.candidate.create({
          data: {
            firstName,
            lastName,
            email: normalizedEmail,
            consentGiven: true
          }
        });
      }
    }

    // Log Audit Event
    await logAuditEvent({
      action: 'USER_REGISTERED',
      actorId: user.id,
      affectedRecordId: user.id,
      newValues: {
        email: user.email,
        role: assignedRoleName,
        accountType,
        organizationId,
        foundedWorkspace: assignedRoleName === 'Admin'
      }
    });

    // Email verification (spec §6.1): prove the mailbox is real and owned by
    // the registrant. The account cannot sign in until the emailed link is
    // clicked. Send AFTER the user row exists; a delivery failure does NOT
    // roll back the account — the user can request a fresh link from the
    // sign-in page (resend-verification endpoint).
    const { token, tokenHash } = generateVerificationToken();
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MINUTES * 60_000);
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const origin = process.env.NEXTAUTH_URL || new URL(req.url).origin;
    const verifyUrl = `${origin}/auth/verify-email?token=${token}`;
    // Recorded send (spec §6.9): the attempt lands in the Communication table
    // with an honest SENT/FAILED state so admins can see and retry delivery.
    const recorded = await sendRecordedEmail({
      to: normalizedEmail,
      template: 'EMAIL_VERIFICATION',
      data: { joinLink: verifyUrl },
      senderId: user.id,
    });
    const verificationEmailQueued = recorded.delivered;

    return NextResponse.json({
      success: true,
      emailVerificationRequired: true,
      emailDelivered: verificationEmailQueued,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: assignedRoleName
      }
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    // SECURITY: Never leak internal error details to the client
    return safeErrorResponse('Internal server error during account creation.');
  }
}