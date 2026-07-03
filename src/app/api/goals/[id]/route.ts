import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { profitTarget, maxLoss, targetWinRate, targetTrades, maxTradesPerDay } = body;

    // Verify goal belongs to user account
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { account: true }
    });

    if (!goal || goal.account.userId !== session.id) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 404 });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        profitTarget: profitTarget !== undefined ? (profitTarget ? parseFloat(profitTarget) : null) : undefined,
        maxLoss: maxLoss !== undefined ? (maxLoss ? parseFloat(maxLoss) : null) : undefined,
        targetWinRate: targetWinRate !== undefined ? (targetWinRate ? parseFloat(targetWinRate) : null) : undefined,
        targetTrades: targetTrades !== undefined ? (targetTrades ? parseInt(targetTrades) : null) : undefined,
        maxTradesPerDay: maxTradesPerDay !== undefined ? (maxTradesPerDay ? parseInt(maxTradesPerDay) : null) : undefined,
      }
    });

    return NextResponse.json({ success: true, goal: updatedGoal });
  } catch (error) {
    console.error('Failed to update goal', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { account: true }
    });

    if (!goal || goal.account.userId !== session.id) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 404 });
    }

    // Instead of hard deleting, we archive it
    await prisma.goal.update({
      where: { id },
      data: { status: 'Archived' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete goal', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
