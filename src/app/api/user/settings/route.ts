import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, encrypt } from '@/lib/session';
import { cookies } from 'next/headers';

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: { name, email }
    });

    // Update session cookie with new name/email
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const updatedSession = await encrypt({ id: user.id, name: user.name, email: user.email, expires });
    const cookieStore = await cookies();
    cookieStore.set('session', updatedSession, { expires, httpOnly: true });

    return NextResponse.json({ success: true, user: { name: user.name, email: user.email } });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
