import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import bcrypt from 'bcryptjs';
import { signupSchema, validateBody, safeErrorResponse } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { resolveMx, resolve4, resolve6 } from 'node:dns/promises';

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
    const rateCheck = checkRateLimit(rateLimitKey, RATE_LIMITS.signup);
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

    // SECURITY: Force self-signup role — ignore any client-supplied role
    // Only admins can assign elevated roles through the team/role endpoint
    const assignedRoleName = accountType === 'candidate' ? 'Candidate' : 'Recruiter';

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

    if (accountType === 'worker') {
      // If company name is specified, find or create company
      const targetOrgName = companyName?.trim() || 'Codafriqa Tech Corp';
      let org = await prisma.organization.findFirst({
        where: { name: targetOrgName }
      });

      if (!org) {
        org = await prisma.organization.create({
          data: { name: targetOrgName }
        });
      }
      organizationId = org.id;
    } else {
      // Candidate account attaches to default workspace for job application scope
      let defaultOrg = await prisma.organization.findFirst();
      if (!defaultOrg) {
        defaultOrg = await prisma.organization.create({
          data: { name: 'Codafriqa Tech Corp' }
        });
      }
      organizationId = defaultOrg.id;
    }

    // Get or create the Role in DB
    let roleRecord = await prisma.role.findFirst({
      where: { name: assignedRoleName }
    });

    if (!roleRecord) {
      const getPermissions = (r: string) => {
        switch (r) {
          case 'Admin': return ['ALL'];
          case 'Recruiter': return ['MANAGE_CANDIDATES', 'OVERRIDE_SCORES', 'EXTEND_OFFERS'];
          case 'HiringManager': return ['VIEW_DEPARTMENT_CANDIDATES', 'OVERRIDE_SCORES'];
          case 'Interviewer': return ['EVALUATE_CANDIDATES', 'SUBMIT_SCORECARDS'];
          case 'ComplianceAuditor': return ['VIEW_AUDIT_LOGS', 'INSPECT_MODELS'];
          default: return ['VIEW_OWN_APPLICATIONS'];
        }
      };

      roleRecord = await prisma.role.create({
        data: {
          name: assignedRoleName,
          permissions: getPermissions(assignedRoleName)
        }
      });
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
        organizationId
      }
    });

    return NextResponse.json({
      success: true,
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