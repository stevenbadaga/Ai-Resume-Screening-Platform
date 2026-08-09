import Link from 'next/link';

export default function CandidatesDashboard() {
  // Simulating data for UI demonstration
  const applications = [
    { id: '1', name: 'Alice Smith', job: 'Senior Frontend Engineer', status: 'COMPLETED', date: 'Oct 24, 2026' },
    { id: '2', name: 'Bob Jones', job: 'Backend Developer', status: 'PROCESSING', date: 'Oct 24, 2026' },
    { id: '3', name: 'Charlie Brown', job: 'Product Manager', status: 'FAILED', date: 'Oct 23, 2026' },
  ];

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
            {applications.map((app) => (
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
