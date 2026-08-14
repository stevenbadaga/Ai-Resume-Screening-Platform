import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navigation from "@/components/Navigation";
import UserNav from "@/components/UserNav";

import { getServerSession } from "next-auth/next";

export const metadata: Metadata = {
  title: "AI Resume Screening Platform",
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
                <header style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--surface)' }}>
                  <UserNav userName={session.user?.name} userEmail={session.user?.email} />
                </header>
              )}
              <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
