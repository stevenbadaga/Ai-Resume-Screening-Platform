
import prisma from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export default async function AuditDashboard() {
  const auditLogs = await prisma.auditEvent.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100, // Limit to recent 100 for performance
  });

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Security & Compliance Audit Log</h1>
        <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--surface-hover)', borderRadius: '1rem', fontSize: '0.875rem' }}>
          Auditor View Only
        </span>
      </div>

      <div className="glass-panel" style={{ overflow: 'x-auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-hover)' }}>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Timestamp</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Action</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Actor ID</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Record ID</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Details (New Values)</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No audit events recorded yet.
                </td>
              </tr>
            ) : auditLogs.map((log: any) => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {log.timestamp.toLocaleString()}
                </td>
                <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--primary)' }}>{log.action}</td>
                <td style={{ padding: '1rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>{log.actorId || 'SYSTEM'}</td>
                <td style={{ padding: '1rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>{log.affectedRecordId}</td>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', backgroundColor: 'var(--surface-hover)', padding: '0.5rem', borderRadius: '0.25rem' }}>
                    {log.newValues || '-'}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
