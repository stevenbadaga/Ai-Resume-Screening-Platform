import { PrismaClient } from '@prisma/client';
import ApplyForm from './ApplyForm';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function ApplyPage() {
  // Fetch active jobs to populate the dropdown
  const jobs = await prisma.jobRequisition.findMany({
    select: { id: true, title: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%', padding: '2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '3rem' }}>
        <h1 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Submit Application</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Please fill out the form below and upload your resume (PDF or DOCX, max 5MB).
        </p>

        <ApplyForm jobs={jobs} />
      </div>
    </div>
  );
}
