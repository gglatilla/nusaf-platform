import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Portal domains (customer app) - redirect "/" to "/login"
const portalDomains = ['app.nusaf.net', 'app.nusaf.co.za'];

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/products', '/quotes', '/orders'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Check if this is the portal domain
  const isPortalDomain = portalDomains.some(domain => hostname.includes(domain));

  // On portal domain, redirect root "/" to "/login"
  if (isPortalDomain && pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
