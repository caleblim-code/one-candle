import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, encrypt } from '@/lib/session'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing-token', req.url))
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
      }
    })

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=invalid-token', req.url))
    }

    if (user.emailVerifyExpiry && user.emailVerifyExpiry < new Date()) {
      return NextResponse.redirect(new URL('/login?error=expired-token', req.url))
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      }
    })

    // If the user is currently logged in, update their session
    const session = await getSession()
    let res = NextResponse.redirect(new URL('/dashboard?verified=true', req.url))
    
    if (session && session.id === user.id) {
      const newSessionPayload = { ...session, emailVerified: true }
      const newSessionStr = await encrypt(newSessionPayload)
      res.cookies.set({
        name: 'session',
        value: newSessionStr,
        httpOnly: true,
        sameSite: 'lax',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
    }

    return res
  } catch (error) {
    return NextResponse.redirect(new URL('/login?error=internal-error', req.url))
  }
}
