import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nusaf.co.za';

/**
 * Generate robots.txt for the marketing website.
 * This is automatically served at /robots.txt
 *
 * Note: The noindex header in next.config.js takes precedence for staging.
 * Update next.config.js to remove the X-Robots-Tag header for production.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',      // API routes
          '/_next/',    // Next.js internals
          '/login',     // Auth pages (redirect to portal)
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
