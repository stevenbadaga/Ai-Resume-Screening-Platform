import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Resume Screening Platform",
  description: "Evidence-based recruitment and candidate matching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
          {/* Sidebar */}
          <aside className="glass-panel" style={{ width: '250px', padding: '2rem', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', borderRadius: 0 }}>
            <h2 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>RecruitAI</h2>
            <a href="/" className="btn-secondary" style={{ border: 'none', textAlign: 'left', padding: '0.5rem' }}>Dashboard</a>
            <a href="/jobs" className="btn-secondary" style={{ border: 'none', textAlign: 'left', padding: '0.5rem' }}>Jobs & Rubrics</a>
            <a href="/candidates" className="btn-secondary" style={{ border: 'none', textAlign: 'left', padding: '0.5rem' }}>Candidates</a>
          </aside>
          
          {/* Main Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <header style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>Intern (Recruiter)</span>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>I</div>
              </div>
            </header>
            <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
