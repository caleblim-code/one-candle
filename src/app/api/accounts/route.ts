import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accounts = await prisma.tradingAccount.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'asc' }
    });
    
    return NextResponse.json(accounts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, type, balance } = body;

    if (!name) {
      return NextResponse.json({ error: 'Account name is required' }, { status: 400 });
    }

    // Check if user has any accounts
    const existingAccounts = await prisma.tradingAccount.count({
      where: { userId: session.id }
    });

    const account = await prisma.tradingAccount.create({
      data: {
        userId: session.id,
        name,
        type: type || 'Live Personal',
        balance: parseFloat(balance) || 0,
        isDefault: existingAccounts === 0 // First account is default
      }
    });

    return NextResponse.json(account);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
