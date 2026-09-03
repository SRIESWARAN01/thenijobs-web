import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export is required for the Firebase Hosting deploy target, but it forces every
  // dynamic route ([slug]/[id]/[category]) to be fully known via generateStaticParams() —
  // including in `next dev`, which has no hosting-level rewrite to fall back on for slugs
  // outside that list (unlike production, where Firebase Hosting silently serves the
  // `_fallback` shell for any unknown path). Restrict it to production builds so local dev
  // can render any slug/id directly instead of 500ing with "missing param in
  // generateStaticParams()". `next build`/`next start` always run with NODE_ENV=production,
  // so the production static-export output is unaffected.
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' as const } : {}),
  // Lets a phone/tablet on the same Wi-Fi hit the dev server via its LAN IP for real
  // mobile-device testing (keyboard behavior, touch, etc.) instead of only an emulated
  // viewport. Dev-only — has no effect on the production build.
  allowedDevOrigins: ['192.168.1.2', '10.77.10.141'],
  devIndicators: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
};

export default nextConfig;
