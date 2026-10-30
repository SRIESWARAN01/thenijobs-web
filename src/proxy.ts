import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * THENIJOBS — Edge Canonical Domain Redirection Middleware
 *
 * Enforces https://www.thenijobs.com as the primary canonical production domain.
 * Permanently redirects (HTTP 301) alias/apex domains (thenijobs.com, thenijobs.in, www.thenijobs.in)
 * to https://www.thenijobs.com, preventing redirect loops, duplicate content, and split SEO equity.
 *
 * NOTE: www.thenijobs.com is the authoritative canonical domain configured on Vercel.
 * Requests arriving at www.thenijobs.com must NEVER redirect back to apex thenijobs.com,
 * as Vercel's edge already 308-redirects apex to www, which would cause an infinite ERR_TOO_MANY_REDIRECTS loop.
 */
export function proxy(request: NextRequest) {
  // Respect Vercel forwarded host header if present, falling back to Host header
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const hostname = rawHost.split(':')[0].toLowerCase();

  // If already on the authoritative canonical domain, do not redirect
  if (hostname === 'www.thenijobs.com') {
    return NextResponse.next();
  }

  // Alias and apex domains that must permanently 301-redirect to canonical https://www.thenijobs.com
  const isAliasHost =
    hostname === 'thenijobs.com' ||
    hostname === 'thenijobs.in' ||
    hostname === 'www.thenijobs.in';

  if (isAliasHost) {
    const url = request.nextUrl.clone();
    url.protocol = 'https';
    url.host = 'www.thenijobs.com';
    url.port = '';
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static chunks)
     * - _next/image (image optimization API)
     * - favicon, logo and static image files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
