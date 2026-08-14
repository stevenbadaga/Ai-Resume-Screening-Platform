import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { logAuditEvent } from '@/lib/auditLogger';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    const { skills, experience } = await req.json();

    const application = await prisma.application.findUnique({
      where: { id },
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
        manualCorrections: JSON.stringify({ correctedBy: (session.user as any).id, timestamp: new Date() })
      }
    });

    await logAuditEvent({
      action: 'CANDIDATE_PROFILE_CORRECTED',
      actorId: (session.user as any).id,
      affectedRecordId: updatedProfile.id,
      previousValues,
      newValues: { skills, experience }
    });

    return NextResponse.json({ success: true, updatedProfile });
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
