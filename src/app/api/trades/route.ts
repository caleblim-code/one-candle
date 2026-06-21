import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { ticker, assetClass, direction, entryPrice, exitPrice, positionSize, entryDate, exitDate, stopLoss, takeProfit, fees, pnl, status, setupTag, playbookId, accountId, mistakeTags, notes } = body;

    if (!ticker || !assetClass || !direction || !entryPrice || !positionSize || !entryDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const trade = await prisma.trade.create({
      data: {
        userId: session.id,
        ticker: ticker.toUpperCase(),
        assetClass,
        direction,
        entryPrice: parseFloat(entryPrice),
        exitPrice: exitPrice ? parseFloat(exitPrice) : null,
        positionSize: parseFloat(positionSize),
        entryDate: new Date(entryDate),
        exitDate: exitDate ? new Date(exitDate) : null,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        fees: parseFloat(fees) || 0,
        pnl: pnl !== null ? parseFloat(pnl) : null,
        status: status || 'Open',
        setupTag: setupTag || null,
        playbookId: playbookId || null,
        accountId: accountId || null,
        mistakeTags: mistakeTags || null,
        notes: notes || null,
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
    const accountId = url.searchParams.get('account')
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit
    
    const whereClause: any = { userId: session.id }
    if (accountId && accountId !== 'all') {
      whereClause.accountId = accountId
    }

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where: whereClause,
        orderBy: { entryDate: 'desc' },
        include: { playbook: { select: { id: true, name: true } } },
        skip,
        take: limit
      }),
      prisma.trade.count({ where: whereClause })
    ])

    return NextResponse.json({ success: true, trades, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
