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

    const payouts = await prisma.payout.findMany({
      where: { accountId },
      orderBy: { date: 'desc' }
    });
    
    return NextResponse.json(payouts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { amount, date, status, method, processingDays, reference, notes } = body;

    if (!amount || !date) {
      return NextResponse.json({ error: 'Amount and date are required' }, { status: 400 });
    }

    const payout = await prisma.payout.create({
      data: {
        accountId,
        amount: parseFloat(amount),
        date: new Date(date),
        status: status || 'Pending',
        method: method || null,
        processingDays: processingDays ? parseInt(processingDays, 10) : null,
        reference: reference || null,
        notes: notes || null
      }
    });

    return NextResponse.json(payout);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
