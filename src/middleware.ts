import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * THENIJOBS — Edge Canonical Domain Redirection Middleware
 *
 * Enforces https://thenijobs.com as the sole primary production domain.
 * Permanently redirects (HTTP 301) alias domains (thenijobs.in, www.thenijobs.in, www.thenijobs.com)
 * to the canonical domain, preventing split indexing, duplicate content, and link equity dilution.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0].toLowerCase();

  // Alias domains to redirect permanently to canonical https://thenijobs.com
  const isAliasHost =
    hostname === 'thenijobs.in' ||
    hostname === 'www.thenijobs.in' ||
    hostname === 'www.thenijobs.com';

  if (isAliasHost) {
    const url = request.nextUrl.clone();
    url.protocol = 'https';
    url.host = 'thenijobs.com';
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
