import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Portal domains (admin/staff app)
const portalDomains = new Set(['app.nusaf.net', 'app.nusaf.co.za']);

// Portal redirect URL (from env or default)
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://app.nusaf.net';
const WEBSITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nusaf.net';

// Portal-only routes (should redirect from public site to portal)
const portalRoutes = [
  '/login',
  '/register',
  '/dashboard',
  '/catalog',
  '/imports',
  '/quotes',
  '/orders',
  '/profile',
  '/picking-slips',
  '/job-cards',
  '/transfer-requests',
  '/issues',
  '/documents',
  '/invoices',
  '/purchase-orders',
  '/purchase-requisitions',
  '/goods-receipts',
  '/inventory',
  '/admin',
  '/my',
  '/fulfillment',
  '/delivery-notes',
  '/packing-lists',
  '/return-authorizations',
  '/tax-invoices',
  '/credit-notes',
  '/reports',
];

// Public website routes (served only on www.nusaf.net)
const publicRoutes = ['/', '/about', '/contact', '/solutions', '/services', '/resources', '/products', '/privacy', '/terms'];

function isPortalHost(hostname: string): boolean {
  // Strip port for localhost comparisons
  const host = hostname.split(':')[0];
  return portalDomains.has(host);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Check domain type using exact hostname match
  const isPortal = isPortalHost(hostname);

  // On portal domain (app.nusaf.net)
  if (isPortal) {
    // Redirect root "/" to "/login"
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect public website routes from portal domain to www.nusaf.net
    const isPublicRoute = publicRoutes.some(
      (route) => route !== '/' && (pathname === route || pathname.startsWith(`${route}/`))
    );

    if (isPublicRoute) {
      const websiteUrl = new URL(pathname, WEBSITE_URL);
      websiteUrl.search = request.nextUrl.search;
      return NextResponse.redirect(websiteUrl);
    }

    // Allow all portal routes
    return NextResponse.next();
  }

  // On public domain (www.nusaf.net, nusaf.net, localhost) or any non-portal domain
  // Check if trying to access a portal-only route
  const isPortalRoute = portalRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPortalRoute) {
    // Redirect to app.nusaf.net
    const portalUrl = new URL(pathname, PORTAL_URL);
    portalUrl.search = request.nextUrl.search;
    return NextResponse.redirect(portalUrl);
  }

  // Allow public website routes
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
