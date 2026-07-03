import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('account');
    if (!accountId) return NextResponse.json({ error: 'Account ID required' }, { status: 400 });

    const account = await prisma.tradingAccount.findFirst({
      where: { id: accountId, userId: session.id }
    });
    if (!account) return NextResponse.json({ error: 'Invalid account' }, { status: 403 });

    // Fetch active goals
    const activeGoals = await prisma.goal.findMany({
      where: { accountId, status: 'Active' }
    });

    if (activeGoals.length === 0) {
      return NextResponse.json({ success: true, progress: {} });
    }

    const progress: Record<string, any> = {};

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    for (const goal of activeGoals) {
      // Find all trades within the goal period
      const trades = await prisma.trade.findMany({
        where: {
          accountId,
          entryDate: {
            gte: goal.startDate,
            lte: goal.endDate
          }
        }
      });

      let totalPnl = 0;
      let wins = 0;
      let closedTrades = 0;
      let tradesToday = 0;

      for (const trade of trades) {
        if (trade.pnl !== null && trade.status === 'Closed') {
          totalPnl += trade.pnl;
          closedTrades++;
          if (trade.pnl > 0) wins++;
        }
        
        // Count trades today (for maxTradesPerDay limit)
        if (trade.entryDate >= todayStart && trade.entryDate <= todayEnd) {
          tradesToday++;
        }
      }

      const winRate = closedTrades > 0 ? (wins / closedTrades) * 100 : 0;

      progress[goal.id] = {
        currentPnl: totalPnl,
        currentWinRate: winRate,
        currentTrades: trades.length,
        tradesToday: tradesToday
      };
    }

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('Failed to fetch goal progress', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
