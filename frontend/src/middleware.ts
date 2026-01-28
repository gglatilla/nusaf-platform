import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Portal domains (customer app)
const portalDomains = ['app.nusaf.net', 'app.nusaf.co.za'];

// Public domains (marketing website)
const publicDomains = ['nusaf.net', 'nusaf.co.za', 'www.nusaf.net', 'www.nusaf.co.za'];

// Portal-only routes (should redirect from public site to portal)
const portalRoutes = ['/login', '/register', '/dashboard', '/imports', '/quotes', '/orders', '/settings', '/profile'];

// Public-only routes (marketing pages)
const publicRoutes = ['/', '/products', '/about', '/contact', '/solutions', '/services', '/resources'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Check domain type
  const isPortalDomain = portalDomains.some(domain => hostname.includes(domain));
  const isPublicDomain = publicDomains.some(domain => hostname === domain || hostname === `www.${domain}`);

  // On portal domain (app.nusaf.net)
  if (isPortalDomain) {
    // Redirect root "/" to "/login"
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Allow all other routes on portal
    return NextResponse.next();
  }

  // On public domain (www.nusaf.net, nusaf.net)
  if (isPublicDomain || !isPortalDomain) {
    // Check if trying to access a portal route
    const isPortalRoute = portalRoutes.some(route =>
      pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isPortalRoute) {
      // Redirect to app.nusaf.net
      const portalUrl = new URL(pathname, 'https://app.nusaf.net');
      portalUrl.search = request.nextUrl.search;
      return NextResponse.redirect(portalUrl);
    }
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
