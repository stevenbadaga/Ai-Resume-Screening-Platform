import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DuplicatesPage() {
  const duplicates = await prisma.candidate.findMany({
    where: {
      tags: { has: 'POTENTIAL_DUPLICATE' }
    },
    include: {
      applications: {
        include: { job: true }
      }
    }
  });

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Review Potential Duplicates</h1>
        <Link href="/candidates">
          <button className="btn-secondary">Back to Pipeline</button>
        </Link>
      </div>

      <div className="glass-panel">
        {duplicates.length === 0 ? (
          <p>No duplicates found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-hover)' }}>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Candidate</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Applications</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {duplicates.map(cand => (
                <tr key={cand.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{cand.firstName} {cand.lastName}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{cand.email}</td>
                  <td style={{ padding: '1rem' }}>
                    {cand.applications.length} applications
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <form action="/api/candidates/merge" method="POST">
                      <input type="hidden" name="email" value={cand.email} />
                      <button className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Merge & Approve</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
