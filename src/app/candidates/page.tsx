/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CandidatesDashboard({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getServerSession();
  if (!session) redirect('/api/auth/signin');

  const role = (session.user as any)?.role || 'Recruiter';
  const userId = (session.user as any)?.id;

  const resolvedParams = await searchParams;
  const filterJob = resolvedParams.job;
  const filterName = resolvedParams.name;
  const filterStatus = resolvedParams.status;

  const whereClause: any = {};
  
  if (role === 'HiringManager' && userId) {
    whereClause.job = { ownerId: userId };
  }

  if (filterJob) {
    if (whereClause.job) {
      whereClause.job.title = { contains: filterJob, mode: 'insensitive' };
    } else {
      whereClause.job = { title: { contains: filterJob, mode: 'insensitive' } };
    }
  }

  if (filterName) {
    whereClause.candidate = {
      OR: [
        { firstName: { contains: filterName, mode: 'insensitive' } },
        { lastName: { contains: filterName, mode: 'insensitive' } }
      ]
    };
  }

  if (filterStatus) {
    whereClause.resumeDocument = { processingStatus: filterStatus };
  }

  const applicationsData = await prisma.application.findMany({
    where: whereClause,
    include: {
      candidate: true,
      job: true,
      resumeDocument: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const duplicates = await prisma.candidate.findMany({
    where: { tags: { has: 'POTENTIAL_DUPLICATE' } }
  });

  const applications = applicationsData.map((app: any) => ({
    id: app.id,
    name: `${app.candidate.firstName} ${app.candidate.lastName}`,
    job: app.job.title,
    status: app.resumeDocument?.processingStatus || 'UNKNOWN',
    date: app.createdAt.toLocaleDateString(),
  }));

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Candidate Pipeline {role === 'HiringManager' ? '(Assigned Jobs)' : ''}</h1>
        <div>
          <a href="/api/export" target="_blank" rel="noopener noreferrer">
            <button className="btn-secondary" style={{ marginRight: '1rem' }}>Export CSV</button>
          </a>
          <Link href="/candidates/compare">
            <button className="btn-primary" style={{ marginRight: '1rem', backgroundColor: 'var(--primary)' }}>Compare Candidates</button>
          </Link>
          <Link href="/candidates/apply">
            <button className="btn-secondary">Submit Test</button>
          </Link>
        </div>
      </div>

      {duplicates.length > 0 && (
        <div style={{ padding: '1rem', marginBottom: '2rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--accent)', borderRadius: '8px', color: 'var(--accent)' }}>
          <strong>Attention:</strong> There are {duplicates.length} candidates tagged as potential duplicates requiring manual review.
          <Link href="/candidates/duplicates">
            <button className="btn-primary" style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>Review Duplicates</button>
          </Link>
        </div>
      )}

      {/* Pipeline Search & Filter */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Search & Filter</h3>
        <form style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Candidate Name</label>
            <input type="text" name="name" className="input-field" placeholder="e.g. John Doe" defaultValue={filterName} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Job Title</label>
            <input type="text" name="job" className="input-field" placeholder="e.g. Engineer" defaultValue={filterJob} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Processing Status</label>
            <select name="status" className="input-field" defaultValue={filterStatus} style={{ width: '100%' }}>
              <option value="">All Statuses</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
          <div>
            <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Filter</button>
            <Link href="/candidates">
              <button type="button" className="btn-secondary" style={{ padding: '0.75rem 1.5rem', marginLeft: '0.5rem' }}>Clear</button>
            </Link>
          </div>
        </form>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-hover)' }}>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Candidate</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Applied Job</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Processing Status</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No candidates match the filter criteria.
                </td>
              </tr>
            ) : applications.map((app: any) => (
              <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{app.name}</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{app.job}</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{app.date}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.875rem',
                    backgroundColor: 
                      app.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 
                      app.status === 'FAILED' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                    color: 
                      app.status === 'COMPLETED' ? 'var(--secondary)' : 
                      app.status === 'FAILED' ? 'var(--accent)' : 'var(--primary)',
                  }}>
                    {app.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/candidates/${app.id}`}>
                    <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>View Profile</button>
                  </Link>
                  {app.status === 'FAILED' && (
                    <form action="/api/upload/retry" method="POST">
                      <input type="hidden" name="applicationId" value={app.id} />
                      <button className="btn-primary" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--accent)', border: 'none', color: 'white' }}>Retry Processing</button>
                    </form>
                  )}
                  {app.status === 'NEEDS_REVIEW' && (
                    <Link href={`/candidates/${app.id}/review`}>
                      <button className="btn-primary" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--warning)', border: 'none', color: 'black' }}>Review AI Extraction</button>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
