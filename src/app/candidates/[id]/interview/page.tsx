/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import { logAuditEvent } from '@/lib/auditLogger';
import { sendMockEmail } from '@/lib/mockEmailService';

export const dynamic = 'force-dynamic';

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) redirect('/api/auth/signin');

  const resolvedParams = await params;
  const applicationId = resolvedParams.id;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: true,
      job: true,
      interviews: { include: { participants: { include: { user: true } } } }
    }
  });

  if (!application) {
    return <div className="p-8 text-white">Application not found</div>;
  }

  // Handle scheduling form submission
  async function scheduleInterview(formData: FormData) {
    'use server';
    const schedule = formData.get('schedule') as string;
    const timezone = formData.get('timezone') as string;
    const details = formData.get('details') as string;
    
    const sessionUser = await getServerSession();
    if (!sessionUser?.user?.email) return;

    const user = await prisma.user.findUnique({ where: { email: sessionUser.user.email } });
    if (!user) return;

    const interview = await prisma.interview.create({
      data: {
        applicationId: applicationId,
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

    await prisma.application.update({
      where: { id: applicationId },
      data: { stage: 'INTERVIEW_SCHEDULED', status: 'INTERVIEW' }
    });

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
      affectedRecordId: applicationId,
      newValues: { schedule, interviewId: interview.id }
    });

    redirect(`/candidates/${applicationId}/interview`);
  }

  // Handle scorecard submission
  async function submitScorecard(formData: FormData) {
    'use server';
    const interviewId = formData.get('interviewId') as string;
    const recommendation = formData.get('recommendation') as string;
    const comments = formData.get('comments') as string;
    const rating1 = formData.get('rating1') as string;
    const rating2 = formData.get('rating2') as string;

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

    redirect(`/candidates/${applicationId}/interview`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Interview Scheduling & Scorecards
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Candidate: <strong className="text-white">{application.candidate.firstName} {application.candidate.lastName}</strong> â€” {application.job.title}
            </p>
          </div>
          <Link
            href={`/candidates/${application.id}`}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition"
          >
            &larr; Back to Profile
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Schedule Form */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <h2 className="text-base font-bold text-white">Schedule New Session</h2>
            <form action={scheduleInterview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="schedule"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Timezone
                </label>
                <select
                  name="timezone"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Africa/Kigali">CAT (Africa/Kigali)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">EST (America/New_York)</option>
                  <option value="Europe/London">GMT (Europe/London)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Meeting Link / Details
                </label>
                <input
                  type="text"
                  name="details"
                  placeholder="https://meet.google.com/... or Zoom Link"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/30"
              >
                Send Calendar Invite & Confirm ðŸ“…
              </button>
            </form>
          </div>

          {/* Existing Interviews & Scorecards */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-base font-bold text-white">Scheduled Sessions & Evaluations</h2>

            {application.interviews.length === 0 ? (
              <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-3xl text-center text-xs text-slate-500">
                No interviews scheduled for this candidate yet.
              </div>
            ) : (
              application.interviews.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {(inv.schedule ? new Date(inv.schedule).toLocaleString() : 'TBD')} ({inv.timezone})
                      </h3>
                      <p className="text-xs text-indigo-400 mt-0.5">
                        Link: <a href={inv.meetingDetails || '#'} target="_blank" rel="noreferrer" className="underline">{inv.meetingDetails}</a>
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                        inv.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  {inv.status === 'SCHEDULED' && (
                    <form action={submitScorecard} className="space-y-3 pt-2">
                      <input type="hidden" name="interviewId" value={inv.id} />
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Submit Interview Scorecard
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Technical Skills (1-5)</label>
                          <input
                            type="number"
                            name="rating1"
                            min="1"
                            max="5"
                            defaultValue={4}
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Cultural Alignment (1-5)</label>
                          <input
                            type="number"
                            name="rating2"
                            min="1"
                            max="5"
                            defaultValue={4}
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Interviewer Feedback & Notes</label>
                        <textarea
                          name="comments"
                          rows={2}
                          placeholder="Candidate's technical depth, problem-solving, and team fit..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                        ></textarea>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          name="recommendation"
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-400 font-bold"
                        >
                          <option value="HIRE">Recommendation: Strongly Hire</option>
                          <option value="HOLD">Recommendation: Neutral / Hold</option>
                          <option value="NO_HIRE">Recommendation: Do Not Hire</option>
                        </select>
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                        >
                          Submit Scorecard & Complete
                        </button>
                      </div>
                    </form>
                  )}

                  {inv.status === 'COMPLETED' &&
                    inv.participants.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs space-y-1 text-slate-300"
                      >
                        <p><strong>Interviewer:</strong> {p.user.name}</p>
                        <p><strong>Recommendation:</strong> <span className="text-emerald-400 font-bold">{p.recommendation}</span></p>
                        <p><strong>Feedback:</strong> {p.comments}</p>
                        <p><strong>Evaluation Ratings:</strong> <span className="font-mono text-indigo-300">{p.structuredFeedback}</span></p>
                      </div>
                    ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}