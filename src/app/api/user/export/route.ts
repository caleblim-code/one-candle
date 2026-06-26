import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Fetch all trades for the user
    const trades = await prisma.trade.findMany({
      where: {
        account: {
          userId: session.userId,
        },
      },
      include: {
        account: true,
        playbook: true,
      },
      orderBy: {
        entryDate: 'desc',
      },
    });

    // Format trades into a clean structure
    const formattedTrades = trades.map((t) => ({
      AccountName: t.account?.name || 'Unknown',
      Ticker: t.ticker,
      Direction: t.direction,
      AssetClass: t.assetClass,
      EntryDate: t.entryDate.toISOString(),
      ExitDate: t.exitDate ? t.exitDate.toISOString() : '',
      EntryPrice: t.entryPrice,
      ExitPrice: t.exitPrice ?? '',
      PositionSize: t.positionSize,
      StopLoss: t.stopLoss ?? '',
      TakeProfit: t.takeProfit ?? '',
      Fees: t.fees,
      PnL: t.pnl ?? '',
      Status: t.status,
      BrokerTradeId: t.brokerTradeId || '',
      SetupTag: t.setupTag || '',
      Mistakes: t.mistakeTags || '',
      Playbook: t.playbook?.name || '',
      Notes: t.notes || '',
    }));

    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
      const jsonStr = JSON.stringify(formattedTrades, null, 2);
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('Content-Disposition', `attachment; filename="onecandle_export_${timestamp}.json"`);
      return new NextResponse(jsonStr, { status: 200, headers });
    }

    // Default: CSV
    // Build CSV manually to avoid client-side lib dependency issues
    if (formattedTrades.length === 0) {
      const headers = new Headers();
      headers.set('Content-Type', 'text/csv');
      headers.set('Content-Disposition', `attachment; filename="onecandle_export_${timestamp}.csv"`);
      return new NextResponse('No trades found.', { status: 200, headers });
    }

    const csvColumns = Object.keys(formattedTrades[0]);
    const escapeCsv = (val: unknown): string => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [
      csvColumns.join(','),
      ...formattedTrades.map(row =>
        csvColumns.map(col => escapeCsv((row as Record<string, unknown>)[col])).join(',')
      ),
    ];

    const csv = csvRows.join('\n');
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="onecandle_export_${timestamp}.csv"`);

    return new NextResponse(csv, { status: 200, headers });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
