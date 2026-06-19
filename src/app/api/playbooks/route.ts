import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, rules } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const playbook = await prisma.playbook.create({
      data: {
        userId: session.id,
        name,
        description,
        rules
      }
    });

    return NextResponse.json(playbook);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
