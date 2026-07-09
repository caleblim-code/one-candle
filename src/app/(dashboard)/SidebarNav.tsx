"use client";

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentAccount = searchParams.get('account') || 'all';
  const [isPending, startTransition] = useTransition();

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
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
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
    <nav style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
      
      <div style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
        <label className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Global Account Filter
          {isPending && <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }} />}
        </label>
        <select 
          className="form-select" 
          value={currentAccount} 
          onChange={handleAccountChange}
          disabled={isPending}
          style={{ width: '100%', fontSize: '0.9rem', padding: '0.5rem', fontWeight: 600, backgroundColor: 'var(--surface)', opacity: isPending ? 0.6 : 1, transition: 'opacity 150ms ease' }}
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
      <Link href={createHref('/insights')} style={getStyle('/insights')}>Insights</Link>
      <Link href={createHref('/goals')} style={getStyle('/goals')}>Goals</Link>
      <Link href={createHref('/playbooks')} style={getStyle('/playbooks')}>Playbooks</Link>
      <Link href={createHref('/prop-firm')} style={getStyle('/prop-firm')}>Prop Firm</Link>
      <Link href={createHref('/settings')} style={getStyle('/settings')}>Settings</Link>

      <div style={{ margin: '1rem 0', height: '1px', backgroundColor: 'var(--border)' }}></div>
      <a 
        href="https://www.tradingview.com/chart/" 
        target="_blank" 
        rel="noopener noreferrer" 
        style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}
        onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        TradingView
      </a>
      <a 
        href="https://www.forexfactory.com/calendar?day=today" 
        target="_blank" 
        rel="noopener noreferrer" 
        style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}
        onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        Forex Factory
      </a>
    </nav>
  );
}
