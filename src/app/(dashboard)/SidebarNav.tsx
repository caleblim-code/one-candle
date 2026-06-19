"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarNav() {
  const pathname = usePathname();

  const linkStyle = {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    color: 'var(--text-main)',
    display: 'block',
    textDecoration: 'none',
    transition: 'all 150ms ease',
  };

  const getStyle = (path: string) => {
    const isActive = pathname === path || pathname.startsWith(`${path}/`);
    return isActive 
      ? { ...linkStyle, backgroundColor: 'var(--surface-light)', color: 'var(--accent)', fontWeight: '600' }
      : linkStyle;
  };

  return (
    <nav style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Link href="/dashboard" style={getStyle('/dashboard')}>Overview</Link>
      <Link href="/journal" style={getStyle('/journal')}>Journal</Link>
      <Link href="/add-trade" style={getStyle('/add-trade')}>Add Trade</Link>
      <Link href="/analytics" style={getStyle('/analytics')}>Analytics</Link>
      <Link href="/playbooks" style={getStyle('/playbooks')}>Playbooks</Link>
      <Link href="/settings" style={getStyle('/settings')}>Settings</Link>
    </nav>
  );
}
