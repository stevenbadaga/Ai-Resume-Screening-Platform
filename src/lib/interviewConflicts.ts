import prisma from '@/lib/prisma';

/**
 * Shared interview conflict detection (spec §6.8: the system must detect
 * scheduling conflicts within information available to it and require
 * confirmation before double-booking an interviewer or candidate).
 *
 * Overlap math compares the proposed slot against each existing interview's
 * OWN duration (stored in meetingDetails JSON; 60-minute default), and the
 * check runs per user — previously only the scheduler's calendar was
 * verified, so assigned interviewers could be double-booked silently.
 */

export interface ConflictResult {
  conflict: false;
}
export interface ConflictError {
  conflict: true;
  userId: string;
  kind: 'interviewer' | 'candidate';
}

interface ExistingInterview {
  schedule: Date | null;
  meetingDetails: string | null;
}

export async function findSchedulingConflict(params: {
  userIds: string[];
  candidateId?: string;
  proposedStart: Date;
  durationMinutes: number;
  /** Interviews to ignore (e.g. the one being rescheduled). */
  excludeInterviewId?: string;
}): Promise<ConflictResult | ConflictError> {
  const { userIds, candidateId, proposedStart, durationMinutes, excludeInterviewId } = params;
  const proposedEnd = new Date(proposedStart.getTime() + durationMinutes * 60_000);

  const baseWhere = {
    status: { not: 'CANCELLED' },
    schedule: { not: null },
    ...(excludeInterviewId ? { id: { not: excludeInterviewId } } : {}),
  } as const;

  const overlaps = (existing: ExistingInterview) => {
    if (existing.schedule == null) return false;
    let existingDuration = 60;
    try {
      const details = existing.meetingDetails ? JSON.parse(existing.meetingDetails) : {};
      if (details.durationMinutes) existingDuration = details.durationMinutes;
    } catch {
      /* keep default */
    }
    const existingEnd = new Date(existing.schedule.getTime() + existingDuration * 60_000);
    return proposedStart < existingEnd && proposedEnd > existing.schedule;
  };

  // ── Per-user (interviewer) conflicts ──
  for (const userId of userIds) {
    const interviews = await prisma.interview.findMany({
      where: { ...baseWhere, participants: { some: { userId } } },
      select: { schedule: true, meetingDetails: true },
    });
    for (const existing of interviews) {
      if (existing.schedule != null && overlaps(existing)) {
        return { conflict: true, userId, kind: 'interviewer' };
      }
    }
  }

  // ── Candidate conflicts across all their applications ──
  if (candidateId) {
    const interviews = await prisma.interview.findMany({
      where: {
        ...baseWhere,
        application: { candidateId },
      },
      select: { schedule: true, meetingDetails: true },
    });
    for (const existing of interviews) {
      if (existing.schedule != null && overlaps(existing)) {
        return { conflict: true, userId: candidateId, kind: 'candidate' };
      }
    }
  }

  return { conflict: false };
}
