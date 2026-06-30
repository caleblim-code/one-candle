import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { trades, accountId } = body;

    if (!Array.isArray(trades) || trades.length === 0) {
      return NextResponse.json({ error: 'No trades provided' }, { status: 400 });
    }

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Verify account belongs to user
    const account = await prisma.tradingAccount.findFirst({
      where: { id: accountId, userId: session.id }
    });

    if (!account) {
      return NextResponse.json({ error: 'Invalid account' }, { status: 400 });
    }

    const tradesToInsert = trades.map((t: any) => {
      // Calculate PnL if closed and both prices exist
      let pnl = null;
      let status = 'Open';
      
      const entry = parseFloat(t.entryPrice);
      const exit = t.exitPrice ? parseFloat(t.exitPrice) : null;
      const size = parseFloat(t.positionSize);
      const fees = t.fees ? parseFloat(t.fees) : 0;

      if (exit !== null && !isNaN(exit)) {
        status = 'Closed';
        if (t.direction === 'Long') {
          pnl = (exit - entry) * size - fees;
        } else {
          pnl = (entry - exit) * size - fees;
        }
      }

      return {
        userId: session.id,
        accountId: accountId,
        ticker: String(t.ticker).toUpperCase(),
        assetClass: t.assetClass || 'Stocks',
        direction: t.direction || 'Long',
        entryPrice: entry,
        exitPrice: exit,
        positionSize: size,
        entryDate: new Date(t.entryDate),
        exitDate: t.exitDate ? new Date(t.exitDate) : null,
        stopLoss: t.stopLoss ? parseFloat(t.stopLoss) : null,
        takeProfit: t.takeProfit ? parseFloat(t.takeProfit) : null,
        fees: fees,
        pnl: pnl,
        status: status,
        notes: 'Imported via CSV',
      };
    });

    const result = await prisma.trade.createMany({
      data: tradesToInsert,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error('Bulk insert error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { tradeIds } = body;

    if (!Array.isArray(tradeIds) || tradeIds.length === 0) {
      return NextResponse.json({ error: 'No trade IDs provided' }, { status: 400 });
    }

    const result = await prisma.trade.deleteMany({
      where: {
        id: { in: tradeIds },
        userId: session.id, // Security: only delete trades belonging to the user
      },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
