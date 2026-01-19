/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@nusaf/ui",
    "@nusaf/utils",
    "@nusaf/database",
    "@nusaf/auth",
    "@nusaf/pricing",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3001", "app.nusaf.net", "app.nusaf.co.za"],
    },
  },
};

module.exports = nextConfig;
