import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession, getSession } from '@/lib/session'

const protectedRoutes = ['/dashboard', '/journal', '/analytics', '/playbooks', '/settings', '/add-trade', '/daily-notes', '/prop-firm']

export async function middleware(request: NextRequest) {
  const res = await updateSession(request)
  
  // Also perform auth checks for protected routes
  const path = request.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  
  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get('session')?.value
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // If we updated the session, return the response with the new cookie
  // Otherwise, return next
  return res || NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
