import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';

export default async function AuditPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string }> 
}) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const userEmail = session.user.email;
  const user = await prisma.user.findFirst({
    where: userEmail ? { email: userEmail } : undefined,
    include: { roles: true }
  });

  if (!user) {
    redirect('/auth/signin');
  }

  const resolvedParams = await searchParams;
  const query = (resolvedParams?.q || '').trim();
  
  const events = await prisma.auditEvent.findMany({
    where: {
      ...(user.organizationId ? { organizationId: user.organizationId } : {}),
      ...(query ? {
        OR: [
          { action: { contains: query, mode: 'insensitive' } },
          { actorId: { contains: query, mode: 'insensitive' } }
        ]
      } : {})
    },
    orderBy: { timestamp: 'desc' },
    take: 100
  });

  return (
    <div className="animate-in" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Audit & Compliance Trails</h1>
          <p style={{ color: 'var(--text-muted)' }}>Immutable log of all system decisions, profile modifications, and AI evaluations.</p>
        </div>
        <form style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            name="q" 
            type="text" 
            placeholder="Search action or user ID..." 
            defaultValue={query}
            className="input-field"
            style={{ width: '280px' }}
          />
          <button type="submit" className="btn-secondary">Search</button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>TIMESTAMP</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>ACTION</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>ACTOR</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>RECORD ID</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>EVENT DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(ev.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                  {ev.action}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text)' }}>
                  {ev.actorId || 'SYSTEM'}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {ev.affectedRecordId ? `${ev.affectedRecordId.slice(0, 8)}...` : 'N/A'}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.newValues || ev.previousValues || '-'}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No audit events found. Actions taken on the platform will be logged here automatically.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}