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

    return NextResponse.json({ success: true, trades, journals });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
