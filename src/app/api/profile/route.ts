import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse, validateBody } from '@/lib/validation';
import { z } from 'zod/v4';

/**
 * Session-scoped profile for EVERY role (spec §6.1 — profile view).
 *
 * Candidates additionally get their self-service profile: declared
 * skills/experience and the saved default CV that powers one-click
 * applications. Staff (company side) get their account/workspace view.
 */

// Skills/experience are free-form JSON entered by the candidate in the UI
// (the profile editor sends structured arrays/strings). Size-capped.
const selfProfileSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  phone: z.string().trim().max(50).optional().nullable(),
  skills: z.unknown().optional(),
  experience: z.unknown().optional(),
});

/**
 * Tolerant parse for Candidate.skills/experience. The profile editor always
 * stores JSON.stringify()-encoded values, but legacy/externally-created rows
 * may hold plain text — a strict parse there would 500 the whole endpoint
 * (and with it, the apply page's one-click CV section). The profile page
 * client already degrades the same way: parse, and on failure use the raw
 * value.
 */
function parseJsonField(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        organization: { select: { id: true, name: true } },
        roles: { select: { name: true } },
      },
    });

    const base = {
      id: user.id,
      email: user.email,
      name: userRecord?.name ?? user.name ?? null,
      phone: userRecord?.phone ?? null,
      role: user.role,
      organizationName: userRecord?.organization?.name ?? null,
      memberSince: userRecord?.createdAt ?? null,
    };

    if (user.role !== 'Candidate') {
      return NextResponse.json({
        profile: {
          ...base,
          departmentRestrictions: user.departmentRestrictions,
          // Staff do not keep a self-service CV or declared skills.
          candidate: null,
        },
      });
    }

    // Candidate: merge the User account with the Candidate self-service
    // profile (matched by email — the same linkage the intake pipeline uses).
    const candidate = await prisma.candidate.findFirst({
      where: { email: user.email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        skills: true,
        experience: true,
        profileResumeRef: true,
        profileResumeName: true,
        profileResumeSize: true,
        profileResumeUploadedAt: true,
        consentGiven: true,
        consentNoticeVersion: true,
        applications: { select: { id: true } },
      },
    });

    const effectivePhone = candidate?.phone ?? userRecord?.phone ?? null;

    return NextResponse.json({
      profile: {
        ...base,
        phone: effectivePhone,
        candidate: candidate
          ? {
              id: candidate.id,
              name: `${candidate.firstName} ${candidate.lastName}`.trim(),
              phone: effectivePhone,
              skills: parseJsonField(candidate.skills),
              experience: parseJsonField(candidate.experience),
              savedResume: candidate.profileResumeRef
                ? {
                    name: candidate.profileResumeName ?? 'resume',
                    size: candidate.profileResumeSize ?? null,
                    uploadedAt: candidate.profileResumeUploadedAt,
                  }
                : null,
              consentGiven: candidate.consentGiven,
              consentNoticeVersion: candidate.consentNoticeVersion,
              applicationCount: candidate.applications.length,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return safeErrorResponse('Failed to load profile');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { data, error } = validateBody(selfProfileSchema, body);
    if (error) return error;

    // Account display name and phone apply to user account.
    const userUpdates: Record<string, unknown> = {};
    if (data.name !== undefined) userUpdates.name = data.name;
    if (data.phone !== undefined) userUpdates.phone = data.phone?.trim() || null;
    if (Object.keys(userUpdates).length > 0) {
      await prisma.user.update({ where: { id: user.id }, data: userUpdates });
    }

    // Candidate profile data: skills, experience, and candidate phone.
    if (user.role === 'Candidate' && (data.skills !== undefined || data.experience !== undefined || data.phone !== undefined)) {
      const candidate = await prisma.candidate.findFirst({ where: { email: user.email } });
      if (!candidate) {
        // A candidate account without an intake Candidate row yet — create one
        // so profile data (and later one-click applications) work immediately.
        const parts = (data.name ?? user.name ?? user.email.split('@')[0]).split(' ');
        const created = await prisma.candidate.create({
          data: {
            firstName: parts[0] || user.email.split('@')[0],
            lastName: parts.slice(1).join(' ') || '(candidate)',
            email: user.email,
            phone: data.phone !== undefined ? (data.phone?.trim() || null) : undefined,
            consentGiven: false,
            tags: ['SELF_PROFILE'],
            skills: data.skills !== undefined ? JSON.stringify(data.skills ?? null) : undefined,
            experience:
              data.experience !== undefined ? JSON.stringify(data.experience ?? null) : undefined,
          },
        });
        await logAuditEvent({
          action: 'CANDIDATE_PROFILE_CREATED',
          actorId: user.id,
          organizationId: user.organizationId,
          affectedRecordId: created.id,
          newValues: { source: 'self-service profile', phone: data.phone },
        });
      } else {
        const previous = { skills: candidate.skills, experience: candidate.experience, phone: candidate.phone };
        const candidateUpdates: Record<string, unknown> = {};
        if (data.skills !== undefined) candidateUpdates.skills = JSON.stringify(data.skills ?? null);
        if (data.experience !== undefined) candidateUpdates.experience = JSON.stringify(data.experience ?? null);
        if (data.phone !== undefined) candidateUpdates.phone = data.phone?.trim() || null;

        if (Object.keys(candidateUpdates).length > 0) {
          await prisma.candidate.update({
            where: { id: candidate.id },
            data: candidateUpdates,
          });
          await logAuditEvent({
            action: 'CANDIDATE_PROFILE_UPDATED',
            actorId: user.id,
            organizationId: user.organizationId,
            affectedRecordId: candidate.id,
            previousValues: previous,
            newValues: { skills: data.skills, experience: data.experience, phone: data.phone },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return safeErrorResponse('Failed to update profile');
  }
}
