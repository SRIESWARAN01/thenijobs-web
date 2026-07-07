import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PRIMARY_DOMAIN = 'thenijobs.com';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // ── 1. Domain consolidation: thenijobs.in → thenijobs.com (301) ──
  // Redirect any non-primary domain (e.g. thenijobs.in, www.thenijobs.com)
  const bareHost = hostname.split(':')[0].toLowerCase();
  if (
    bareHost !== PRIMARY_DOMAIN &&
    bareHost !== 'localhost' &&
    !bareHost.startsWith('127.') &&
    !bareHost.startsWith('192.168.') &&
    !bareHost.startsWith('10.')
  ) {
    const canonicalUrl = new URL(`https://${PRIMARY_DOMAIN}${pathname}${search}`);
    return NextResponse.redirect(canonicalUrl, 301);
  }

  // ── 2. Legacy path redirects (308 Permanent) ──

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
