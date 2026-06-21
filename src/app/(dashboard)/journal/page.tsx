import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import JournalClient from './JournalClient';

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const params = await searchParams;
  const accountId = params.account;
  const session = await getSession();
  if (!session) redirect('/login');

  const whereClause: any = { userId: session.id };
  if (accountId && accountId !== 'all') {
    whereClause.accountId = accountId;
  }

  const trades = await prisma.trade.findMany({
    where: whereClause,
    orderBy: { entryDate: 'desc' },
    include: { playbook: { select: { id: true, name: true } } }
  });

  if (trades.length === 0) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </div>
        <h2>Your Journal is Empty</h2>
        <p className="text-muted" style={{ marginTop: '0.5rem', marginBottom: '2rem', maxWidth: '400px' }}>Every great trader starts with a single log. Start recording your trades to build your journal and uncover your edge.</p>
        <a href="/add-trade" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>Log a Trade</a>
      </div>
    );
  }

  return <JournalClient initialTrades={trades} />;
}
