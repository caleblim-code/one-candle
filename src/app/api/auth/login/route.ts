import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encrypt } from '@/lib/session'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitResult = rateLimit(`login_${ip}`, 10, 15 * 60 * 1000); // 10 attempts per 15 min
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many login attempts from this IP, please try again later.' }, { status: 429 });
    }

    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
    }

    const sessionPayload = { 
      id: user.id, 
      name: user.name, 
      email: user.email,
      emailVerified: user.emailVerified 
    }
    const session = await encrypt(sessionPayload)
    
    const res = NextResponse.json({ success: true, user: sessionPayload })
    res.cookies.set({
      name: 'session',
      value: session,
      httpOnly: true,
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    
    return res
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
