/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import { logAuditEvent } from '@/lib/auditLogger';
import { sendMockEmail } from '@/lib/mockEmailService';

export const dynamic = 'force-dynamic';

export default async function InterviewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) redirect('/api/auth/signin');

  const applicationId = params.id;
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: true,
      job: true,
      interviews: { include: { participants: { include: { user: true } } } }
    }
  });

  if (!application) {
    return <div>Application not found</div>;
  }

  // Handle scheduling form submission
  async function scheduleInterview(formData: FormData) {
    'use server';
    const schedule = formData.get('schedule') as string;
    const timezone = formData.get('timezone') as string;
    const details = formData.get('details') as string;
    
    // In a real app, you would select interviewers from the UI. Here we hardcode to the current session user.
    const sessionUser = await getServerSession();
    if (!sessionUser?.user?.email) return;

    const user = await prisma.user.findUnique({ where: { email: sessionUser.user.email } });
    if (!user) return;

    // Week 6: Conflict Checking
    const existingInterviews = await prisma.interview.findMany({
      where: {
        schedule: new Date(schedule),
        participants: { some: { userId: user.id } }
      }
    });

    if (existingInterviews.length > 0) {
      // In a real app we'd throw an error or show a banner.
      console.warn("Conflict detected! Double booking the interviewer.");
    }

    const interview = await prisma.interview.create({
      data: {
        applicationId: application!.id,
        schedule: new Date(schedule),
        timezone,
        meetingDetails: details,
        status: 'SCHEDULED',
        participants: {
          create: {
            userId: user.id
          }
        }
      }
    });

    // Send mock email invitation (Week 6 requirement)
    await sendMockEmail(
      application!.candidate.email, 
      'INTERVIEW_INVITATION', 
      {
        candidateName: application!.candidate.firstName,
        jobTitle: application!.job.title,
        schedule,
        timezone,
        details
      },
      application!.id
    );

    await logAuditEvent({
      action: 'INTERVIEW_SCHEDULED',
      actorId: user.id,
      affectedRecordId: application!.id,
      newValues: { schedule, interviewId: interview.id }
    });

    redirect(`/candidates/${application!.id}/interview`);
  }

  // Handle scorecard submission
  async function submitScorecard(formData: FormData) {
    'use server';
    const interviewId = formData.get('interviewId') as string;
    const recommendation = formData.get('recommendation') as string;
    const comments = formData.get('comments') as string;
    const rating1 = formData.get('rating1') as string; // technical
    const rating2 = formData.get('rating2') as string; // cultural

    const sessionUser = await getServerSession();
    const user = await prisma.user.findUnique({ where: { email: sessionUser?.user?.email || '' } });
    
    if (!user) return;

    const participant = await prisma.interviewParticipant.findFirst({
      where: { interviewId, userId: user.id }
    });

    if (participant) {
      await prisma.interviewParticipant.update({
        where: { id: participant.id },
        data: {
          recommendation,
          comments,
          structuredFeedback: JSON.stringify({ technical: rating1, cultural: rating2 })
        }
      });
      
      await prisma.interview.update({
        where: { id: interviewId },
        data: { status: 'COMPLETED' }
      });
    }

    redirect(`/candidates/${application!.id}/interview`);
  }

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Interviews: {application.candidate.firstName} {application.candidate.lastName}</h1>
        <Link href={`/candidates/${application.id}`}>
          <button className="btn-secondary">Back to Profile</button>
        </Link>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-panel">
          <h2>Schedule New Interview</h2>
          <form action={scheduleInterview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label>Date & Time</label>
              <input type="datetime-local" name="schedule" required style={{ width: '100%', padding: '0.5rem' }} />
            </div>
            <div>
              <label>Timezone</label>
              <select name="timezone" style={{ width: '100%', padding: '0.5rem' }}>
                <option value="UTC">UTC</option>
                <option value="America/New_York">EST</option>
                <option value="Africa/Kigali">CAT</option>
              </select>
            </div>
            <div>
              <label>Meeting Link / Details</label>
              <input type="text" name="details" placeholder="Zoom Link..." required style={{ width: '100%', padding: '0.5rem' }} />
            </div>
            <button type="submit" className="btn-primary">Send Invitation</button>
          </form>
        </div>

        <div>
          <h2>Existing Interviews</h2>
          {application.interviews.length === 0 ? (
            <p className="text-muted" style={{ marginTop: '1rem' }}>No interviews scheduled yet.</p>
          ) : (
            application.interviews.map(inv => (
              <div key={inv.id} className="glass-panel" style={{ marginTop: '1rem', borderLeft: '4px solid var(--primary)' }}>
                <h3>{inv.schedule?.toLocaleString()} ({inv.timezone})</h3>
                <p>Status: <span style={{ fontWeight: 'bold', color: inv.status === 'COMPLETED' ? 'var(--secondary)' : 'var(--text)' }}>{inv.status}</span></p>
                <p>Details: <a href={inv.meetingDetails || '#'} style={{ color: 'var(--primary)' }}>{inv.meetingDetails}</a></p>
                
                {inv.status === 'SCHEDULED' && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <h4>Submit Scorecard</h4>
                    <form action={submitScorecard} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input type="hidden" name="interviewId" value={inv.id} />
                      
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <label>Technical Skills (1-5):</label>
                        <input type="number" name="rating1" min="1" max="5" required style={{ width: '60px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <label>Cultural Alignment (1-5):</label>
                        <input type="number" name="rating2" min="1" max="5" required style={{ width: '60px' }} />
                      </div>
                      
                      <label>General Comments:</label>
                      <textarea name="comments" rows={3} style={{ width: '100%', padding: '0.5rem' }}></textarea>
                      
                      <label>Recommendation:</label>
                      <select name="recommendation" style={{ width: '100%', padding: '0.5rem' }}>
                        <option value="HIRE">Hire</option>
                        <option value="NO_HIRE">No Hire</option>
                        <option value="HOLD">Hold</option>
                      </select>
                      
                      <button type="submit" className="btn-secondary" style={{ marginTop: '0.5rem' }}>Submit Feedback</button>
                    </form>
                  </div>
                )}
                
                {inv.status === 'COMPLETED' && inv.participants.map(p => (
                  <div key={p.id} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: '4px' }}>
                    <p><strong>Interviewer:</strong> {p.user.name}</p>
                    <p><strong>Recommendation:</strong> {p.recommendation}</p>
                    <p><strong>Feedback:</strong> {p.comments}</p>
                    <p><strong>Scores:</strong> {p.structuredFeedback}</p>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
