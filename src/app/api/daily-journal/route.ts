import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const journals = await prisma.dailyJournal.findMany({
      where: { userId: session.id },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(journals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { date, content, mentalState } = body;

    if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 });

    const existing = await prisma.dailyJournal.findUnique({
      where: {
        userId_date: {
          userId: session.id,
          date
        }
      }
    });

    let journal;
    if (existing) {
      journal = await prisma.dailyJournal.update({
        where: { id: existing.id },
        data: { content, mentalState }
      });
    } else {
      journal = await prisma.dailyJournal.create({
        data: {
          userId: session.id,
          date,
          content,
          mentalState
        }
      });
    }

    return NextResponse.json(journal);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
