import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, type, balance, isDefault } = body;

    // Check if account exists
    const account = await prisma.tradingAccount.findUnique({
      where: { id: id, userId: session.id }
    });

    if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // If making this default, unset others
    if (isDefault) {
      await prisma.tradingAccount.updateMany({
        where: { userId: session.id, id: { not: id } },
        data: { isDefault: false }
      });
    }

    const updated = await prisma.tradingAccount.update({
      where: { id: id },
      data: {
        name: name !== undefined ? name : account.name,
        type: type !== undefined ? type : account.type,
        balance: balance !== undefined ? parseFloat(balance) : account.balance,
        isDefault: isDefault !== undefined ? isDefault : account.isDefault
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accountToDelete = await prisma.tradingAccount.findUnique({
      where: { id: id, userId: session.id }
    });

    if (!accountToDelete) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // First delete all trades associated with this account to avoid orphaned data
    await prisma.trade.deleteMany({
      where: { accountId: id }
    });

    // Delete the account
    await prisma.tradingAccount.delete({
      where: { id: id }
    });

    // If it was the default account, set another account as default if any exists
    if (accountToDelete.isDefault) {
      const remainingAccount = await prisma.tradingAccount.findFirst({
        where: { userId: session.id }
      });
      if (remainingAccount) {
        await prisma.tradingAccount.update({
          where: { id: remainingAccount.id },
          data: { isDefault: true }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
