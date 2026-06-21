import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: accountId } = await params;

    // Verify account belongs to user
    const account = await prisma.tradingAccount.findUnique({
      where: { id: accountId }
    });

    if (!account || account.userId !== session.id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const rules = await prisma.propFirmRules.findUnique({
      where: { accountId }
    });
    
    return NextResponse.json(rules || null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: accountId } = await params;

    // Verify account belongs to user
    const account = await prisma.tradingAccount.findUnique({
      where: { id: accountId }
    });

    if (!account || account.userId !== session.id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await request.json();
    const { firmName, maxDailyLoss, maxTotalDrawdown, profitTarget, trailingDrawdown, minTradingDays, maxTradingDays } = body;

    const rules = await prisma.propFirmRules.upsert({
      where: { accountId },
      update: {
        firmName,
        maxDailyLoss: parseFloat(maxDailyLoss) || 0,
        maxTotalDrawdown: parseFloat(maxTotalDrawdown) || 0,
        profitTarget: parseFloat(profitTarget) || 0,
        trailingDrawdown: !!trailingDrawdown,
        minTradingDays: parseInt(minTradingDays, 10) || 0,
        maxTradingDays: maxTradingDays ? parseInt(maxTradingDays, 10) : null
      },
      create: {
        accountId,
        firmName: firmName || 'Custom',
        maxDailyLoss: parseFloat(maxDailyLoss) || 0,
        maxTotalDrawdown: parseFloat(maxTotalDrawdown) || 0,
        profitTarget: parseFloat(profitTarget) || 0,
        trailingDrawdown: !!trailingDrawdown,
        minTradingDays: parseInt(minTradingDays, 10) || 0,
        maxTradingDays: maxTradingDays ? parseInt(maxTradingDays, 10) : null
      }
    });

    return NextResponse.json(rules);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
