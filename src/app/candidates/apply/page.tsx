import ApplyForm from './ApplyForm';

import prisma from '@/lib/prisma';
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
        {/* Localized header is rendered inside the client ApplyForm (uses the i18n dictionary). */}
        <ApplyForm jobs={jobs} />
      </div>
    </div>
  );
}
