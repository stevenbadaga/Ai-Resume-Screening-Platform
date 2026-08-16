import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navigation from "@/components/Navigation";
import UserNav from "@/components/UserNav";
import NotificationBell from "@/components/NotificationBell";
import SupportWidget from "@/components/SupportWidget";

import { getServerSession } from "next-auth/next";

export const metadata: Metadata = {
  title: "RecruitAI — AI Resume Screening & Talent ATS Platform",
  description: "Evidence-based recruitment and candidate matching.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  
  return (
    <html lang="en">
      <body>
        <Providers>
          <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
            {/* Sidebar - only show if logged in */}
            {session && <Navigation />}
            
            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {session && (
                <header style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', backgroundColor: 'var(--surface)' }}>
                  <NotificationBell />
                  <UserNav userName={session.user?.name} userEmail={session.user?.email} />
                </header>
              )}
              <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                {children}
              </main>
            </div>
          </div>
          {/* Floating AI Customer Support Assistant */}
          <SupportWidget />
        </Providers>
      </body>
    </html>
  );
}