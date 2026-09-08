import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // HOSTING-1 (D-HOSTING, owner-answered 2026-09-07, confirmed again in chat 2026-09-08):
  // production is no longer a static export. Vercel now builds and runs this app as a normal
  // Next.js server app, so src/app/api/** route handlers execute for real requests instead of
  // 404ing. This also removes the reason the old NODE_ENV-conditional `output: 'export'`
  // existed -- it was there because dev needed non-static behavior production did not have;
  // now both run the same way, so no conditional is needed.
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
