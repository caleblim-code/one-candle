import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

const calculateEndDate = (startDate: Date, periodType: string) => {
  const end = new Date(startDate);
  if (periodType === 'Weekly') {
    end.setDate(end.getDate() + 7);
  } else if (periodType === 'Monthly') {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
};

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('account');
    if (!accountId) return NextResponse.json({ error: 'Account ID required' }, { status: 400 });

    if (accountId !== 'all') {
      const account = await prisma.tradingAccount.findFirst({
        where: { id: accountId, userId: session.id }
      });
      if (!account) return NextResponse.json({ error: 'Invalid account' }, { status: 403 });
    }

    const whereClause: any = {};
    if (accountId !== 'all') {
      whereClause.accountId = accountId;
    } else {
      whereClause.account = { userId: session.id };
    }

    let goals = await prisma.goal.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    let hasRolledOver = false;

    for (const goal of goals) {
      if (goal.status === 'Active' && new Date(goal.endDate) < now) {
        await prisma.goal.update({
          where: { id: goal.id },
          data: { status: 'Archived' }
        });

        const currentStart = new Date();
        currentStart.setHours(0, 0, 0, 0);
        if (goal.periodType === 'Monthly') {
          currentStart.setDate(1);
        } else if (goal.periodType === 'Weekly') {
          const day = currentStart.getDay();
          const diff = currentStart.getDate() - day + (day === 0 ? -6 : 1);
          currentStart.setDate(diff);
        }

        await prisma.goal.create({
          data: {
            accountId: goal.accountId,
            periodType: goal.periodType,
            startDate: currentStart,
            endDate: calculateEndDate(currentStart, goal.periodType),
            profitTarget: goal.profitTarget,
            maxLoss: goal.maxLoss,
            targetWinRate: goal.targetWinRate,
            targetTrades: goal.targetTrades,
            maxTradesPerDay: goal.maxTradesPerDay,
            status: 'Active'
          }
        });

        hasRolledOver = true;
      }
    }

    if (hasRolledOver) {
      goals = await prisma.goal.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({ success: true, goals });
  } catch (error) {
    console.error('Failed to fetch goals', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { accountId, periodType, profitTarget, maxLoss, targetWinRate, targetTrades, maxTradesPerDay } = body;

    if (!accountId || !periodType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const account = await prisma.tradingAccount.findFirst({
      where: { id: accountId, userId: session.id }
    });
    if (!account) return NextResponse.json({ error: 'Invalid account' }, { status: 403 });

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    if (periodType === 'Monthly') {
      startDate.setDate(1);
    } else if (periodType === 'Weekly') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
    }
    const endDate = calculateEndDate(startDate, periodType);

    await prisma.goal.updateMany({
      where: { accountId, periodType, status: 'Active' },
      data: { status: 'Archived' }
    });

    const goal = await prisma.goal.create({
      data: {
        accountId,
        periodType,
        startDate,
        endDate,
        profitTarget: profitTarget ? parseFloat(profitTarget) : null,
        maxLoss: maxLoss ? parseFloat(maxLoss) : null,
        targetWinRate: targetWinRate ? parseFloat(targetWinRate) : null,
        targetTrades: targetTrades ? parseInt(targetTrades) : null,
        maxTradesPerDay: maxTradesPerDay ? parseInt(maxTradesPerDay) : null,
      }
    });

    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('Failed to create goal', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
