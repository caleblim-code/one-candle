import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const accountId = url.searchParams.get('account');

    const whereClause: any = { userId: session.id };
    if (accountId && accountId !== 'all') {
      whereClause.accountId = accountId;
    }

    // 1. Get recent 5 trades
    const recentTradesPromise = prisma.trade.findMany({
      where: whereClause,
      take: 5,
      orderBy: { entryDate: 'desc' },
    });

    // 2. Get minimal data for stats and charting
    const closedTradesPromise = prisma.trade.findMany({
      where: { ...whereClause, status: 'Closed' },
      select: { pnl: true, entryDate: true },
      orderBy: { entryDate: 'asc' },
    });

    // 3. Get total trades count
    const totalTradesPromise = prisma.trade.count({
      where: whereClause,
    });

    const [recentTrades, closedTrades, totalTrades] = await Promise.all([
      recentTradesPromise,
      closedTradesPromise,
      totalTradesPromise,
    ]);

    // Calculate stats purely in memory on minimal dataset
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) <= 0);

    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const averageWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length : 0;

    let currentEquity = 0;
    const chartData = closedTrades.map(t => {
      currentEquity += (t.pnl || 0);
      return {
        date: new Date(t.entryDate).toLocaleDateString(),
        equity: currentEquity,
        pnl: t.pnl || 0
      };
    });

    return NextResponse.json({
      success: true,
      stats: { totalTrades, winRate, totalPnl, averageWin, averageLoss },
      chartData,
      recentTrades
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
