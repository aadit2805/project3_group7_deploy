import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'openweathermap.org',
        port: '',
        pathname: '/img/wn/**',
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    return [
      // Rewrite specific API routes to backend, excluding /api/docs/* which are handled by Next.js API routes
      // We need to be explicit because Next.js rewrites don't support negative lookaheads
      {
        source: '/api/orders/:path*',
        destination: `${backendUrl}/api/orders/:path*`,
      },
      {
        source: '/api/analytics/:path*',
        destination: `${backendUrl}/api/analytics/:path*`,
      },
      {
        source: '/api/meal-types/:path*',
        destination: `${backendUrl}/api/meal-types/:path*`,
      },
      {
        source: '/api/customer/:path*',
        destination: `${backendUrl}/api/customer/:path*`,
      },
      {
        source: '/api/translation/:path*',
        destination: `${backendUrl}/api/translation/:path*`,
      },
      {
        source: '/api/audit-logs/:path*',
        destination: `${backendUrl}/api/audit-logs/:path*`,
      },
      {
        source: '/api/revenue/:path*',
        destination: `${backendUrl}/api/revenue/:path*`,
      },
      {
        source: '/api/user/:path*',
        destination: `${backendUrl}/api/user/:path*`,
      },
      {
        source: '/api/menu/:path*',
        destination: `${backendUrl}/api/menu/:path*`,
      },
      {
        source: '/api/inventory/:path*',
        destination: `${backendUrl}/api/inventory/:path*`,
      },
      {
        source: '/api/staff/:path*',
        destination: `${backendUrl}/api/staff/:path*`,
      },
      {
        source: '/api/discounts/:path*',
        destination: `${backendUrl}/api/discounts/:path*`,
      },
      {
        source: '/api/feedback/:path*',
        destination: `${backendUrl}/api/feedback/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${backendUrl}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
