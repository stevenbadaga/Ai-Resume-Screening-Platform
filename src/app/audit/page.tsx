import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Audit & Compliance Trails
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Immutable, tamper-proof audit log recording all system decisions, recruiter score overrides, and stage transitions.
            </p>
          </div>
          <form method="GET" action="/audit" className="flex items-center gap-2">
            <div className="relative w-72">
              <input 
                name="q" 
                type="text" 
                placeholder="Search action or user ID..." 
                defaultValue={query}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute left-3 top-2 text-slate-500 text-xs">🔍</span>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/30"
            >
              Filter
            </button>
          </form>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Action Performed</th>
                <th className="py-4 px-6">Actor ID</th>
                <th className="py-4 px-6">Record ID</th>
                <th className="py-4 px-6">Event Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-800/20 transition">
                  <td className="py-4 px-6 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(ev.timestamp).toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-lg font-bold font-mono text-[11px]">
                      {ev.action}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-300 text-[11px]">
                    {ev.actorId || 'SYSTEM'}
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-400 text-[11px]">
                    {ev.affectedRecordId ? `${ev.affectedRecordId.slice(0, 8)}...` : 'N/A'}
                  </td>
                  <td className="py-4 px-6 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                    {ev.newValues || ev.previousValues || '-'}
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    No audit records match your query. All platform mutations are automatically logged here in real time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}