import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession, decrypt } from './lib/session'

export default async function proxy(request: NextRequest) {
  // Update session expiration if present
  const res = await updateSession(request)
  const response = res || NextResponse.next()

  const path = request.nextUrl.pathname
  const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/journal') || path.startsWith('/add-trade')

  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get('session')?.value
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    try {
      await decrypt(sessionCookie)
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
