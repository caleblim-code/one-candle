"use client";

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentAccount = searchParams.get('account') || 'all';

  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAccounts(data);
    }).catch(() => {});
  }, []);

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const accountId = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (accountId === 'all') {
      params.delete('account');
    } else {
      params.set('account', accountId);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

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

  // Preserve account search param in links
  const createHref = (path: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  };

  return (
    <nav style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      
      <div style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
        <label className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Global Account Filter</label>
        <select 
          className="form-select" 
          value={currentAccount} 
          onChange={handleAccountChange}
          style={{ width: '100%', fontSize: '0.9rem', padding: '0.5rem', fontWeight: 600, backgroundColor: 'var(--surface)' }}
        >
          <option value="all">All Accounts</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
          ))}
        </select>
      </div>

      <Link href={createHref('/dashboard')} style={getStyle('/dashboard')}>Overview</Link>
      <Link href={createHref('/journal')} style={getStyle('/journal')}>Journal</Link>
      <Link href={createHref('/add-trade')} style={getStyle('/add-trade')}>Add Trade</Link>
      <Link href={createHref('/daily-notes')} style={getStyle('/daily-notes')}>Daily Notes</Link>
      <Link href={createHref('/analytics')} style={getStyle('/analytics')}>Analytics</Link>
      <Link href={createHref('/playbooks')} style={getStyle('/playbooks')}>Playbooks</Link>
      <Link href={createHref('/settings')} style={getStyle('/settings')}>Settings</Link>
    </nav>
  );
}
