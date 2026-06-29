import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { sanitize } from '@/lib/sanitize'

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params;

    const trade = await prisma.trade.findUnique({ where: { id } })
    if (!trade || trade.userId !== session.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    await prisma.trade.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params;

    const trade = await prisma.trade.findUnique({ where: { id } })
    if (!trade || trade.userId !== session.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, trade })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params;
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      ticker: rawBody.ticker ? sanitize(rawBody.ticker) : undefined,
      setupTag: rawBody.setupTag ? sanitize(rawBody.setupTag) : undefined,
      mistakeTags: rawBody.mistakeTags ? sanitize(rawBody.mistakeTags) : undefined,
      notes: rawBody.notes ? sanitize(rawBody.notes) : undefined,
      brokerTradeId: rawBody.brokerTradeId ? sanitize(rawBody.brokerTradeId) : undefined
    };

    const trade = await prisma.trade.findUnique({ where: { id } })
    if (!trade || trade.userId !== session.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    const { ticker, assetClass, direction, entryPrice, exitPrice, positionSize, entryDate, exitDate, stopLoss, takeProfit, fees, pnl, status, setupTag, playbookId, accountId, mistakeTags, notes, brokerTradeId } = body;

    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: {
        ticker: ticker ? ticker.toUpperCase() : trade.ticker,
        assetClass: assetClass !== undefined ? assetClass : trade.assetClass,
        direction: direction !== undefined ? direction : trade.direction,
        entryPrice: entryPrice !== undefined ? parseFloat(entryPrice) : trade.entryPrice,
        exitPrice: exitPrice !== undefined ? (exitPrice ? parseFloat(exitPrice) : null) : trade.exitPrice,
        positionSize: positionSize !== undefined ? parseFloat(positionSize) : trade.positionSize,
        entryDate: entryDate ? new Date(entryDate) : trade.entryDate,
        exitDate: exitDate !== undefined ? (exitDate ? new Date(exitDate) : null) : trade.exitDate,
        stopLoss: stopLoss !== undefined ? (stopLoss ? parseFloat(stopLoss) : null) : trade.stopLoss,
        takeProfit: takeProfit !== undefined ? (takeProfit ? parseFloat(takeProfit) : null) : trade.takeProfit,
        fees: fees !== undefined ? parseFloat(fees) || 0 : trade.fees,
        pnl: pnl !== undefined ? (pnl !== null ? parseFloat(pnl) : null) : trade.pnl,
        status: status !== undefined ? status : trade.status,
        setupTag: setupTag !== undefined ? (setupTag || null) : trade.setupTag,
        playbookId: playbookId !== undefined ? (playbookId || null) : trade.playbookId,
        accountId: accountId !== undefined ? (accountId || null) : trade.accountId,
        mistakeTags: mistakeTags !== undefined ? (mistakeTags || null) : trade.mistakeTags,
        notes: notes !== undefined ? (notes || null) : trade.notes,
        brokerTradeId: brokerTradeId !== undefined ? (brokerTradeId || null) : trade.brokerTradeId,
      }
    });

    return NextResponse.json({ success: true, trade: updatedTrade })
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
