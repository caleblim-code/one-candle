import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DashboardOverviewClient from './DashboardOverviewClient';

export default async function DashboardOverview() {
  const session = await getSession();
  if (!session) redirect('/login');

  const trades = await prisma.trade.findMany({
    where: { userId: session.id },
    orderBy: { entryDate: 'asc' } // chronological for charts
  });

  // Calculate stats
  const totalTrades = trades.length;
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
