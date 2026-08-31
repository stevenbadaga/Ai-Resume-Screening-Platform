import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { requireAuth } from '@/lib/auth';
import { profileUpdateSchema, validateBody, safeErrorResponse } from '@/lib/validation';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // SECURITY: Fixed getServerSession() → requireAuth (uses authOptions)
    const auth = await requireAuth(['Admin', 'Recruiter', 'HiringManager']);
    if (auth.error) return auth.error;
    
    const { id } = await params;
    const body = await req.json();

    // Validate input
    const { data, error } = validateBody(profileUpdateSchema, body);
    if (error) return error;

    const { skills, experience } = data;

    const application = await prisma.application.findUnique({
      where: { id, job: { organizationId: auth.user.organizationId } },
      include: { parsedProfile: true }
    });

    if (!application || !application.parsedProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Save old profile to audit log manually
    const previousValues = {
      skills: application.parsedProfile.skills,
      experience: application.parsedProfile.employment
    };

    const updatedProfile = await prisma.parsedProfile.update({
      where: { id: application.parsedProfile.id },
      data: {
        skills: JSON.stringify(skills),
        employment: JSON.stringify(experience),
        manualCorrections: JSON.stringify({ correctedBy: auth.user.id, timestamp: new Date() })
      }
    });

    await logAuditEvent({
      action: 'CANDIDATE_PROFILE_CORRECTED',
      actorId: auth.user.id,
      affectedRecordId: updatedProfile.id,
      previousValues,
      newValues: { skills, experience }
    });

    return NextResponse.json({ success: true, updatedProfile });
  } catch (error) {
    console.error('Error saving profile:', error);
    return safeErrorResponse('Failed to save profile');
  }
}
