import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { safeErrorResponse } from '@/lib/validation';
import {
  verifyDomainChallenge,
  buildChallengeHost,
  hashDomainClaimToken,
} from '@/lib/domainClaim';

/**
 * POST /api/org/domain-claim/verify
 *
 * Re-checks DNS for the pending challenge TXT record. On success the domain
 * becomes the workspace's verified identity (unique across all workspaces).
 * Rate limited by the standard API limiter via NextAuth route conventions —
 * failure is reported honestly so the Admin can retry after propagation.
 */
export async function POST(req: Request) {
  try {
    const auth = await requirePermission(Permission.ManageTeam);
    if (auth.error) return auth.error;

    const org = await prisma.organization.findUnique({
      where: { id: auth.user.organizationId },
      select: {
        id: true,
        pendingEmailDomain: true,
        domainClaimToken: true,
        verifiedEmailDomain: true,
      },
    });

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    if (org.verifiedEmailDomain) {
      return NextResponse.json({
        success: true,
        verifiedDomain: org.verifiedEmailDomain,
        message: 'This workspace already has a verified domain.',
      });
    }

    if (!org.pendingEmailDomain || !org.domainClaimToken) {
      return NextResponse.json(
        { error: 'No pending domain claim. Start one first (POST /api/org/domain-claim).' },
        { status: 400 }
      );
    }

    const verified = await verifyDomainChallenge(org.pendingEmailDomain, org.domainClaimToken);

    if (!verified) {
      await logAuditEvent({
        action: 'DOMAIN_CLAIM_CHECK_FAILED',
        actorId: auth.user.id,
        organizationId: org.id,
        newValues: { domain: org.pendingEmailDomain, host: buildChallengeHost(org.pendingEmailDomain) },
      });
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: `TXT record not found at ${buildChallengeHost(org.pendingEmailDomain)} yet. If you just published it, wait a few minutes for DNS propagation and try again.`,
        },
        { status: 200 }
      );
    }

    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: {
        verifiedEmailDomain: org.pendingEmailDomain,
        domainClaimVerifiedAt: new Date(),
        domainClaimToken: null,
      },
    });

    await logAuditEvent({
      action: 'DOMAIN_CLAIM_VERIFIED',
      actorId: auth.user.id,
      organizationId: org.id,
      affectedRecordId: org.id,
      previousValues: { verifiedEmailDomain: null },
      newValues: {
        verifiedEmailDomain: updated.verifiedEmailDomain,
        tokenRef: hashDomainClaimToken(org.domainClaimToken),
      },
    });

    return NextResponse.json({
      success: true,
      verified: true,
      verifiedDomain: updated.verifiedEmailDomain,
      message: 'Domain verified. Your workspace identity is now cryptographically anchored to your DNS.',
    });
  } catch (error) {
    console.error('Domain claim verify error:', error);
    // A claimed-by-another-workspace race surfaces as a unique constraint
    // violation — report it honestly without leaking which org won.
    return safeErrorResponse('Failed to verify domain claim');
  }
}
