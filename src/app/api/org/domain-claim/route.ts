import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { safeErrorResponse } from '@/lib/validation';
import {
  normalizeDomain,
  generateDomainClaimToken,
  buildChallengeTxtRecord,
  buildChallengeHost,
  hashDomainClaimToken,
  isSharedEmailProviderDomain,
} from '@/lib/domainClaim';

/**
 * POST /api/org/domain-claim  { domain }
 *
 * Starts (or restarts) a domain-claim challenge for the Admin's workspace.
 * The Admin must control an email address at the claimed domain and publish
 * the returned TXT record in DNS. GET returns the pending challenge state.
 */
export async function POST(req: Request) {
  try {
    const auth = await requirePermission(Permission.ManageTeam);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const domain = normalizeDomain(typeof body?.domain === 'string' ? body.domain : '');
    if (!domain) {
      return NextResponse.json({ error: 'Provide a valid domain, e.g. "acme.com".' }, { status: 400 });
    }

    // Shared public email-provider namespaces (gmail.com, outlook.com, …)
    // are owned by other companies and can never be a workspace identity.
    if (isSharedEmailProviderDomain(domain)) {
      return NextResponse.json(
        { error: 'Public email provider domains (gmail.com, outlook.com, etc.) cannot be claimed as a workspace identity. Use a domain you control and add the TXT record in its DNS.' },
        { status: 403 }
      );
    }

    // A domain may belong to exactly one workspace.
    const existingClaim = await prisma.organization.findFirst({
      where: { verifiedEmailDomain: domain },
    });
    if (existingClaim) {
      if (existingClaim.id === auth.user.organizationId) {
        return NextResponse.json({ success: true, alreadyVerified: true, domain });
      }
      return NextResponse.json({ error: 'This domain is already claimed by another workspace.' }, { status: 409 });
    }

    const token = generateDomainClaimToken();
    await prisma.organization.update({
      where: { id: auth.user.organizationId },
      data: {
        pendingEmailDomain: domain,
        domainClaimToken: token,
        domainClaimVerifiedAt: null,
      },
    });

    await logAuditEvent({
      action: 'DOMAIN_CLAIM_STARTED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      newValues: { domain, tokenRef: hashDomainClaimToken(token) },
    });

    return NextResponse.json({
      success: true,
      domain,
      host: buildChallengeHost(domain),
      txtRecord: buildChallengeTxtRecord(token),
      instructions:
        'Publish this TXT record in your DNS provider, then click "Verify now". DNS propagation can take a few minutes.',
    });
  } catch (error) {
    console.error('Domain claim start error:', error);
    return safeErrorResponse('Failed to start domain claim');
  }
}

/**
 * GET /api/org/domain-claim
 *
 * Returns the workspace's current claim state (verified domain and/or
 * pending challenge host for UI display).
 */
export async function GET(req: Request) {
  try {
    const auth = await requirePermission(Permission.ManageTeam);
    if (auth.error) return auth.error;

    const org = await prisma.organization.findUnique({
      where: { id: auth.user.organizationId },
      select: {
        name: true,
        verifiedEmailDomain: true,
        pendingEmailDomain: true,
        domainClaimToken: true,
        domainClaimVerifiedAt: true,
      },
    });

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    // The challenge value is safe to show to this workspace's Admins: it is
    // not a credential — proving anything with it requires publishing it in
    // the domain's DNS, which is exactly the ownership evidence sought.
    return NextResponse.json({
      success: true,
      verifiedDomain: org.verifiedEmailDomain,
      verifiedAt: org.domainClaimVerifiedAt,
      pendingDomain: org.pendingEmailDomain,
      pendingHost: org.pendingEmailDomain ? buildChallengeHost(org.pendingEmailDomain) : null,
      pendingTxtRecord: org.pendingEmailDomain && org.domainClaimToken
        ? buildChallengeTxtRecord(org.domainClaimToken)
        : null,
    });
  } catch (error) {
    console.error('Domain claim status error:', error);
    return safeErrorResponse('Failed to load domain claim status');
  }
}
