import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const accountId = url.searchParams.get('account');

    const whereClause: any = { userId: session.id, status: 'Closed' }; // Analytics only runs on closed trades
    if (accountId && accountId !== 'all') {
      whereClause.accountId = accountId;
    }

    const [trades, journals] = await Promise.all([
      prisma.trade.findMany({
        where: whereClause,
        orderBy: { entryDate: 'desc' },
      }),
      prisma.dailyJournal.findMany({
        where: { userId: session.id }
      })
    ]);

    // Fetch account info for equity curve
    let accountBalance = 0;
    let transactions: any[] = [];
    if (accountId && accountId !== 'all') {
      const account = await prisma.tradingAccount.findFirst({ where: { id: accountId, userId: session.id } });
      if (account) accountBalance = account.balance;
      transactions = await prisma.accountTransaction.findMany({
        where: { accountId },
        orderBy: { date: 'asc' }
      });
    } else {
      // For "all accounts" mode, sum all account balances
      const accounts = await prisma.tradingAccount.findMany({ where: { userId: session.id } });
      accountBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
      transactions = await prisma.accountTransaction.findMany({
        where: { account: { userId: session.id } },
        orderBy: { date: 'asc' }
      });
    }

    return NextResponse.json({ success: true, trades, journals, accountBalance, transactions });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
