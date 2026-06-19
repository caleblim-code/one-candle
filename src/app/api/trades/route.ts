import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    if (!data.ticker || !data.assetClass || !data.direction || !data.entryPrice || !data.positionSize || !data.entryDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const trade = await prisma.trade.create({
      data: {
        userId: session.id,
        ticker: data.ticker,
        assetClass: data.assetClass,
        direction: data.direction,
        entryPrice: parseFloat(data.entryPrice),
        exitPrice: data.exitPrice ? parseFloat(data.exitPrice) : null,
        positionSize: parseFloat(data.positionSize),
        entryDate: new Date(data.entryDate),
        exitDate: data.exitDate ? new Date(data.exitDate) : null,
        stopLoss: data.stopLoss ? parseFloat(data.stopLoss) : null,
        takeProfit: data.takeProfit ? parseFloat(data.takeProfit) : null,
        fees: data.fees ? parseFloat(data.fees) : 0,
        pnl: data.pnl !== null ? parseFloat(data.pnl) : null,
        status: data.status || 'Open',
        setupTag: data.setupTag || null,
        playbookId: data.playbookId || null,
        mistakeTags: data.mistakeTags || null,
        notes: data.notes || null,
      }
    })

    return NextResponse.json({ success: true, trade })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    // Optional filtering here if needed, or fetch all and filter on frontend for Phase 1.
    
    const trades = await prisma.trade.findMany({
      where: { userId: session.id },
      orderBy: { entryDate: 'desc' }
    })

    return NextResponse.json({ success: true, trades })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
