import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;

    // Verify ownership
    const account = await prisma.tradingAccount.findFirst({ where: { id, userId: session.id } });
    if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const transactions = await prisma.accountTransaction.findMany({
      where: { accountId: id },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;

    // Verify ownership
    const account = await prisma.tradingAccount.findFirst({ where: { id, userId: session.id } });
    if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const { type, amount, date, notes } = body;

    if (!type || !amount || !date) {
      return NextResponse.json({ error: 'Type, amount, and date are required' }, { status: 400 });
    }

    const transaction = await prisma.accountTransaction.create({
      data: {
        accountId: id,
        type,
        amount: parseFloat(amount),
        date: new Date(date),
        notes: notes || null,
      }
    });

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const url = new URL(req.url);
    const txId = url.searchParams.get('txId');
    if (!txId) return NextResponse.json({ error: 'txId required' }, { status: 400 });

    // Verify ownership via account
    const tx = await prisma.accountTransaction.findFirst({
      where: { id: txId, account: { id, userId: session.id } }
    });
    if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.accountTransaction.delete({ where: { id: txId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
