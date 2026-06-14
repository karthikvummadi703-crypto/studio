import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Routes that require an authenticated session cookie.
 * Uses startsWith() so all nested routes are also protected automatically.
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/calculator',
  '/ai-advisor',
  '/profile',
  '/knowledge-hub',
  '/insights',
  '/progress',
  '/recommendations',
  '/settings',
] as const;

/**
 * Routes that authenticated users should be redirected away from.
 */
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'] as const;

/**
 * Server-side authentication guard running on the Next.js edge runtime.
 *
 * Security note: cookie-presence check only — actual JWT verification
 * is performed in each API route. The __session cookie is HttpOnly and
 * set server-side so it cannot be forged from client JavaScript.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('__session')?.value;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = (AUTH_ROUTES as readonly string[]).includes(pathname);

  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const response = NextResponse.next();

  // Prevent CDN from caching authenticated page responses.
  if (isProtected) {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
