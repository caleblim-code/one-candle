import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/resend'
import { passwordResetEmailHtml } from '@/lib/email-templates'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Rate limiting: max 3 requests per IP per 15 minutes
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitResult = rateLimit(`forgot_pw_${ip}`, 3, 15 * 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email } })
    
    // Always return success even if user not found (security best practice)
    if (!user) {
      return NextResponse.json({ success: true })
    }

    const passwordResetToken = crypto.randomUUID()
    const passwordResetExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpiry,
      }
    })

    const appUrl = new URL(req.url).origin;
    const resetUrl = `${appUrl}/reset-password?token=${passwordResetToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Reset your OneCandle password',
      html: passwordResetEmailHtml(user.name, resetUrl)
    });

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
