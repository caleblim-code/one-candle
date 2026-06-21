import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
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
    orderBy: { entryDate: 'desc' }
  });

  const journals = await prisma.dailyJournal.findMany({
    where: { userId: session.id }
  });

  if (trades.length === 0) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
        </div>
        <h2>Not Enough Data Yet</h2>
        <p className="text-muted" style={{ marginTop: '0.5rem', marginBottom: '2rem', maxWidth: '400px' }}>Your analytics engine needs data to run. Log your trades to unlock deep insights, profitability heatmaps, and performance breakdowns.</p>
        <a href="/add-trade" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>Log a Trade</a>
      </div>
    );
  }

  return <AnalyticsClient initialTrades={trades} initialJournals={journals} />;
}
