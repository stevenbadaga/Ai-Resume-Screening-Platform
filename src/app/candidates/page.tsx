import Link from 'next/link';

import prisma from '@/lib/prisma';

// In Next.js App Router, this forces the page to dynamically render on every request
export const dynamic = 'force-dynamic';

export default async function CandidatesDashboard() {
  // Fetch real applications from the database
  const applicationsData = await prisma.application.findMany({
    include: {
      candidate: true,
      job: true,
      resumeDocument: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
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
        <h1>Candidate Pipeline</h1>
        <Link href="/candidates/apply">
          <button className="btn-secondary">Submit Test Application</button>
        </Link>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-hover)' }}>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Candidate</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Applied Job</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>AI Processing Status</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No candidates have applied yet.
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
                <td style={{ padding: '1rem' }}>
                  <Link href={`/candidates/${app.id}`}>
                    <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>View Profile</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
