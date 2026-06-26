import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { sendEmail } from '@/lib/resend'
import { verificationEmailHtml } from '@/lib/email-templates'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    // Rate limiting: 1 email per 60 seconds
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitResult = rateLimit(`resend_verify_${ip}`, 5, 15 * 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    if (user.lastVerifyEmailSent) {
      const timeSinceLastEmail = Date.now() - user.lastVerifyEmailSent.getTime()
      if (timeSinceLastEmail < 60 * 1000) {
         return NextResponse.json({ error: 'Please wait a minute before requesting another email.' }, { status: 429 })
      }
    }

    const emailVerifyToken = crypto.randomUUID()
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken,
        emailVerifyExpiry,
        lastVerifyEmailSent: new Date()
      }
    })

    const appUrl = new URL(req.url).origin;
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${emailVerifyToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Verify your OneCandle account',
      html: verificationEmailHtml(user.name, verifyUrl)
    });

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
