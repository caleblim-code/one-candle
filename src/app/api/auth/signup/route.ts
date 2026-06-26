import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encrypt } from '@/lib/session'
import { rateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/resend'
import { verificationEmailHtml } from '@/lib/email-templates'

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitResult = rateLimit(`signup_${ip}`, 5, 15 * 60 * 1000); // 5 per 15 min
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many signups from this IP, please try again later.' }, { status: 429 });
    }

    const { name, email, password } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }
    
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const emailVerifyToken = crypto.randomUUID()
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        passwordHash,
        emailVerifyToken,
        emailVerifyExpiry,
        lastVerifyEmailSent: new Date(),
        accounts: {
          create: {
            name: 'Main Portfolio',
            type: 'Live Personal',
            balance: 0,
            isDefault: true
          }
        }
      }
    })

    // Send verification email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${emailVerifyToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Verify your OneCandle account',
      html: verificationEmailHtml(user.name, verifyUrl)
    });

    // We standardize session to id, name, email, emailVerified
    const sessionPayload = { 
      id: user.id, 
      name: user.name, 
      email: user.email,
      emailVerified: false 
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
