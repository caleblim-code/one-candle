import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import LogoutButton from './LogoutButton';
import SidebarNav from './SidebarNav';
import DashboardShell from './DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const sidebarContent = (
    <>
      <Suspense fallback={<div style={{ padding: '1.5rem 1rem' }}>Loading...</div>}>
        <SidebarNav />
      </Suspense>
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <LogoutButton />
      </div>
    </>
  );

  return (
    <DashboardShell 
      sidebarContent={sidebarContent}
      userInitial={session.name?.[0]?.toUpperCase() || 'U'}
      userName={session.name || 'User'}
    >
      {children}
    </DashboardShell>
  );
}
