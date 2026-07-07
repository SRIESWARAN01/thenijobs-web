import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Proxy (formerly Middleware in Next.js <16)
 *
 * Handles legacy path redirects only.
 *
 * IMPORTANT: Domain canonicalization (www ↔ apex) is handled by the
 * hosting provider (Vercel dashboard → Domains settings).
 * Do NOT add domain redirects here — they conflict with Vercel's
 * own redirects and cause ERR_TOO_MANY_REDIRECTS.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ── Legacy path redirects (308 Permanent) ──

  // /employer/* → /business/*
  if (pathname.startsWith('/employer')) {
    const newPath = pathname.replace(/^\/employer/, '/business');
    return NextResponse.redirect(new URL(`${newPath}${search}`, request.url), 308);
  }

  // /service/* → /business/*
  if (pathname.startsWith('/service')) {
    const newPath = pathname.replace(/^\/service/, '/business');
    return NextResponse.redirect(new URL(`${newPath}${search}`, request.url), 308);
  }

  // /company (exact — no slug) → /businesses
  if (pathname === '/company') {
    return NextResponse.redirect(new URL(`/businesses${search}`, request.url), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static assets, Next.js internals, and API routes
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webp|woff2|woff|ttf|css|js|json|xml|txt|webmanifest)$).*)',
  ],
};
