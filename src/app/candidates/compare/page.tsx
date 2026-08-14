/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CompareCandidatesPage({ searchParams }: { searchParams: { ids?: string | string[] } }) {
  const session = await getServerSession();
  if (!session) redirect('/api/auth/signin');

  // Parse candidate application IDs to compare
  const idsParam = searchParams.ids;
  let applicationIds: string[] = [];
  if (Array.isArray(idsParam)) {
    applicationIds = idsParam;
  } else if (typeof idsParam === 'string') {
    applicationIds = idsParam.split(',');
  }

  // Fetch all applications if none selected yet
  const allApps = await prisma.application.findMany({
    include: { candidate: true, job: true }
  });

  // If IDs are provided, fetch the full details for the matrix
  let compareData: any[] = [];
  if (applicationIds.length > 0) {
    compareData = await prisma.application.findMany({
      where: { id: { in: applicationIds } },
      include: {
        candidate: true,
        job: true,
        parsedProfile: true,
        screeningRuns: {
          include: { assessments: { include: { criterion: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
  }

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Candidate Comparison Matrix</h1>
        <Link href="/candidates">
          <button className="btn-secondary">Back to Pipeline</button>
        </Link>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h3>Select Candidates to Compare</h3>
        <form method="GET" action="/candidates/compare" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
          <select name="ids" multiple style={{ padding: '0.5rem', width: '300px', height: '100px', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
            {allApps.map(app => (
              <option key={app.id} value={app.id}>
                {app.candidate.firstName} {app.candidate.lastName} - {app.job.title}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary">Compare Selected</button>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>(Hold Ctrl/Cmd to select multiple)</p>
        </form>
      </div>

      {compareData.length > 0 && (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', width: '20%' }}>Feature / Criterion</th>
                {compareData.map(app => (
                  <th key={app.id} style={{ padding: '1rem', fontWeight: 600 }}>
                    {app.candidate.firstName} {app.candidate.lastName}<br/>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.job.title}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Basic Profile Stats */}
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>Overall Score</td>
                {compareData.map(app => (
                  <td key={app.id} style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {app.screeningRuns[0]?.totalResult ? `${app.screeningRuns[0].totalResult}%` : 'N/A'}
                    </span>
                  </td>
                ))}
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>Skills</td>
                {compareData.map(app => {
                  const skills = app.parsedProfile?.skills ? JSON.parse(app.parsedProfile.skills) : [];
                  return (
                    <td key={app.id} style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {skills.slice(0, 5).map((s: string, i: number) => (
                          <span key={i} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--surface)', borderRadius: '1rem' }}>{s}</span>
                        ))}
                        {skills.length > 5 && <span style={{ fontSize: '0.75rem' }}>+{skills.length - 5} more</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Dynamically extract all unique criteria evaluated across selected candidates */}
              {Array.from(new Set(
                compareData.flatMap(app => app.screeningRuns[0]?.assessments.map((a: any) => a.criterion.description) || [])
              )).map((criterionDesc, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>{criterionDesc as string}</td>
                  {compareData.map(app => {
                    const assessment = app.screeningRuns[0]?.assessments.find((a: any) => a.criterion.description === criterionDesc);
                    if (!assessment) return <td key={app.id} style={{ padding: '1rem', color: 'var(--text-muted)' }}>N/A</td>;
                    
                    const isMatch = assessment.result === 'MATCH';
                    const isMissing = assessment.result === 'MISSING';
                    
                    return (
                      <td key={app.id} style={{ padding: '1rem' }}>
                        <div style={{ 
                          display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem',
                          backgroundColor: isMatch ? 'rgba(16,185,129,0.1)' : isMissing ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)',
                          color: isMatch ? 'var(--secondary)' : isMissing ? 'var(--accent)' : 'var(--warning)'
                        }}>
                          {assessment.result}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {assessment.supportingEvidence || 'No evidence provided.'}
                        </div>
                        {assessment.uncertainty && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem' }}>⚠️ Ambiguous / Low Confidence</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
