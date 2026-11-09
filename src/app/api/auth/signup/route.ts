import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import bcrypt from 'bcryptjs';
import { signupSchema, validateBody, safeErrorResponse } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import {
  isDisposableEmailDomain,
} from '@/lib/emailVerification';
import { issueVerificationCode } from '@/lib/verificationCode';
import { sendRecordedEmail } from '@/lib/emailService';
import { permissionsForRoleName } from '@/lib/roleAccess';
import { resolveSignupRole } from '@/lib/signupRoles';

const BCRYPT_SALT_ROUNDS = 12;

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

    // Block known disposable/throwaway inbox providers.
    if (isDisposableEmailDomain(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Disposable email addresses are not allowed. Please use a permanent email address.' },
        { status: 422 }
      );
    }

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
      const targetOrgName = companyName?.trim();
      if (!targetOrgName) {
        return NextResponse.json(
          { error: 'Company or organization name is required for staff accounts.' },
          { status: 400 }
        );
      }

      // Check if an organization with this name exists
      let org = await prisma.organization.findFirst({
        where: { name: targetOrgName }
      });

      const foundedOrg = !org;

      if (!org) {
        org = await prisma.organization.create({
          data: {
            name: targetOrgName,
          },
        });
      }
      organizationId = org.id;

      assignedRoleName = resolveSignupRole({ accountType, foundedOrg });
    } else {
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

    // Record the workspace founder as the organization's owner
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
    // the registrant. The account cannot sign in until the emailed 6-digit
    // code is typed into the verification screen. Send AFTER the user row
    // exists; a delivery failure does NOT roll back the account — the user
    // can request a fresh code from the sign-in page (resend-verification).
    const issued = await issueVerificationCode(user.id, 'EMAIL_VERIFICATION');
    if (issued.ok) {
      console.log(`[AUTH SIGNUP] 6-digit verification code for ${normalizedEmail}: ${issued.code}`);
    }

    // Cooldown conflict on a brand-new account cannot really happen (the row
    // set is empty), but fail honest rather than silently skipping the email.
    if (!issued.ok) {
      return NextResponse.json(
        { error: 'Too many verification emails requested. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    // Recorded send (spec §6.9): the attempt lands in the Communication table
    // with an honest SENT/FAILED state so admins can see and retry delivery.
    const recorded = await sendRecordedEmail({
      to: normalizedEmail,
      template: 'EMAIL_VERIFICATION_CODE',
      data: { verificationCode: issued.code },
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
