const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nusaf/shared'],
  async headers() {
    return [
      {
        // Apply to all routes for staging
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Old /browse routes → new /products routes
      {
        source: '/browse',
        destination: '/products',
        permanent: true,
      },
      {
        source: '/browse/:slug',
        destination: '/products/:slug',
        permanent: true,
      },
      {
        source: '/browse/:cat/:sub',
        destination: '/products/:cat/:sub',
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
