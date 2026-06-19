import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const linkStyle = {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    color: 'var(--text-main)',
    display: 'block',
    textDecoration: 'none',
  };

  const activeLinkStyle = {
    ...linkStyle,
    backgroundColor: 'var(--surface-light)',
    color: 'var(--accent)',
    fontWeight: '600'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', backgroundColor: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          OneCandle
        </div>
        <nav style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/dashboard" style={linkStyle}>Overview</Link>
          <Link href="/journal" style={linkStyle}>Journal</Link>
          <Link href="/add-trade" style={linkStyle}>Add Trade</Link>
          <div style={{ ...linkStyle, color: 'var(--text-muted)' }}>Analytics (Soon)</div>
          <div style={{ ...linkStyle, color: 'var(--text-muted)' }}>Playbooks (Soon)</div>
          <div style={{ ...linkStyle, color: 'var(--text-muted)' }}>Settings</div>
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header style={{ height: '70px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 2rem', backgroundColor: 'var(--bg-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent)' }}>
              {session.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span style={{ fontWeight: '500' }}>{session.name}</span>
          </div>
        </header>
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
