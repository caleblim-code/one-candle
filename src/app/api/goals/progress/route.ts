import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('account');
    const offsetStr = searchParams.get('offset');
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    
    if (!accountId) return NextResponse.json({ error: 'Account ID required' }, { status: 400 });

    if (accountId !== 'all') {
      const account = await prisma.tradingAccount.findFirst({
        where: { id: accountId, userId: session.id }
      });
      if (!account) return NextResponse.json({ error: 'Invalid account' }, { status: 403 });
    }

    const whereClause: any = { status: 'Active' };
    if (accountId !== 'all') {
      whereClause.accountId = accountId;
    } else {
      whereClause.account = { userId: session.id };
    }

    // Fetch active goals
    const activeGoals = await prisma.goal.findMany({
      where: whereClause
    });

    if (activeGoals.length === 0) {
      return NextResponse.json({ success: true, progress: {} });
    }

    const progress: Record<string, any> = {};

    // Calculate 'today' boundaries in user's local timezone
    const nowUtc = new Date();
    const localNow = new Date(nowUtc.getTime() - offset * 60000);
    const localTodayStart = new Date(localNow);
    localTodayStart.setUTCHours(0, 0, 0, 0);
    const localTodayEnd = new Date(localNow);
    localTodayEnd.setUTCHours(23, 59, 59, 999);
    
    // Convert back to UTC for database comparison
    const todayStartUTC = new Date(localTodayStart.getTime() + offset * 60000);
    const todayEndUTC = new Date(localTodayEnd.getTime() + offset * 60000);

    for (const goal of activeGoals) {
      // Adjust goal start and end dates based on user's local timezone offset
      const localStartDate = new Date(goal.startDate.getTime() + offset * 60000);
      const localEndDate = new Date(goal.endDate.getTime() + offset * 60000);

      // Find all trades within the goal period
      const trades = await prisma.trade.findMany({
        where: {
          accountId: goal.accountId,
          OR: [
            {
              entryDate: {
                gte: localStartDate,
                lte: localEndDate
              }
            },
            {
              exitDate: {
                gte: localStartDate,
                lte: localEndDate
              }
            }
          ]
        }
      });

      let totalPnl = 0;
      let grossLoss = 0;
      let wins = 0;
      let closedTrades = 0;
      let tradesToday = 0;
      let volumeCount = 0;

      for (const trade of trades) {
        const tradeDate = trade.exitDate || trade.entryDate;

        // Only count PnL and Win Rate if the trade was closed during the goal period
        if (trade.status === 'Closed' && trade.exitDate && trade.exitDate >= localStartDate && trade.exitDate <= localEndDate) {
          if (trade.pnl !== null) {
            totalPnl += trade.pnl;
            if (trade.pnl < 0) grossLoss += Math.abs(trade.pnl);
            closedTrades++;
            if (trade.pnl > 0) wins++;
          }
        }
        
        // Count Target Volume if the trade was active during the goal period
        if (tradeDate && tradeDate >= localStartDate && tradeDate <= localEndDate) {
          volumeCount++;
        }
        
        // Count trades today (for maxTradesPerDay limit)
        if (tradeDate && tradeDate >= todayStartUTC && tradeDate <= todayEndUTC) {
          tradesToday++;
        }
      }

      const winRate = closedTrades > 0 ? (wins / closedTrades) * 100 : 0;

      progress[goal.id] = {
        currentPnl: totalPnl,
        grossLoss,
        currentWinRate: winRate,
        currentTrades: volumeCount,
        tradesToday
      };
    }

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('Failed to fetch goal progress', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
