import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DashboardOverviewClient from './DashboardOverviewClient';

export default async function DashboardOverview({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
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
    orderBy: { entryDate: 'asc' } // chronological for charts
  });

  // Calculate stats
  const totalTrades = trades.length;

  if (totalTrades === 0) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        </div>
        <h2>Welcome to OneCandle</h2>
        <p className="text-muted" style={{ marginTop: '0.5rem', marginBottom: '2rem', maxWidth: '400px' }}>Your dashboard is currently empty. Start by logging your first trade to see your performance metrics and equity curve come to life.</p>
        <a href="/add-trade" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>Add Your First Trade</a>
      </div>
    );
  }

  const closedTrades = trades.filter(t => t.status === 'Closed');
  
  const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
  const losingTrades = closedTrades.filter(t => (t.pnl || 0) <= 0);

  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  
  const averageWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length : 0;
  const averageLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length : 0;

  // Prepare chart data
  let currentEquity = 0;
  const chartData = closedTrades.map(t => {
    currentEquity += (t.pnl || 0);
    return {
      date: new Date(t.exitDate || t.entryDate).toLocaleDateString(),
      equity: currentEquity,
      pnl: t.pnl || 0
    };
  });

  return (
    <DashboardOverviewClient 
      stats={{
        totalTrades,
        winRate,
        totalPnl,
        averageWin,
        averageLoss
      }}
      chartData={chartData}
      recentTrades={trades.slice(-5).reverse()} // latest 5
    />
  );
}
