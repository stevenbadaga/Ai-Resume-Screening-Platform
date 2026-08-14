import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect('/api/auth/signin');

  // Fetch basic stats
  const totalJobs = await prisma.jobRequisition.count();
  const totalCandidates = await prisma.candidate.count();
  
  // Pipeline metrics
  const newApplications = await prisma.application.count({ where: { status: 'NEW' } });
  const screeningApps = await prisma.application.count({ where: { status: 'SCREENING' } });
  const reviewApps = await prisma.application.count({ where: { status: 'NEEDS_REVIEW' } });
  const shortlistedApps = await prisma.application.count({ where: { status: 'SHORTLISTED' } });
  const rejectedApps = await prisma.application.count({ where: { status: 'REJECTED' } });

  // Quality metrics (failed jobs)
  const failedJobs = await prisma.application.count({ where: { status: 'FAILED' } });

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Management Analytics Dashboard</h1>
        <Link href="/">
          <button className="btn-secondary">Back to Home</button>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ fontSize: '3rem', color: 'var(--primary)' }}>{totalJobs}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Active Job Requisitions</p>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ fontSize: '3rem', color: 'var(--primary)' }}>{totalCandidates}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Total Candidates</p>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem', border: failedJobs > 0 ? '1px solid var(--accent)' : 'none' }}>
          <h2 style={{ fontSize: '3rem', color: failedJobs > 0 ? 'var(--accent)' : 'var(--secondary)' }}>{failedJobs}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Failed Processing Jobs</p>
        </div>
      </div>

      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Pipeline Distribution</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ flex: 1, backgroundColor: 'var(--surface-hover)', padding: '1rem', borderRadius: '4px', textAlign: 'center' }}>
            <h3>New</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{newApplications}</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'var(--surface-hover)', padding: '1rem', borderRadius: '4px', textAlign: 'center' }}>
            <h3>Screening</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{screeningApps}</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'var(--surface-hover)', padding: '1rem', borderRadius: '4px', textAlign: 'center' }}>
            <h3>Needs Review</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{reviewApps}</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'var(--surface-hover)', padding: '1rem', borderRadius: '4px', textAlign: 'center' }}>
            <h3>Shortlisted</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{shortlistedApps}</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'var(--surface-hover)', padding: '1rem', borderRadius: '4px', textAlign: 'center' }}>
            <h3>Rejected</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{rejectedApps}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
