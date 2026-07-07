import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // output: 'export',
  devIndicators: false,
  turbopack: {
    root: appRoot,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
    ],
  },
  serverExternalPackages: ['firebase-admin'],

  // SEO: Permanent redirects for legacy path migrations
  async redirects() {
    return [
      {
        source: '/employer/:path*',
        destination: '/business/:path*',
        permanent: true,
      },
      {
        source: '/service/:path*',
        destination: '/business/:path*',
        permanent: true,
      },
      {
        source: '/company',
        destination: '/businesses',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;