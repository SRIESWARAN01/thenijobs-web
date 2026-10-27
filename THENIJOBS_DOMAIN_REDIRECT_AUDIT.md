# THENIJOBS — Production Domain Redirect Loop Audit & Comprehensive Fix Report

**Date:** 2026-10-24  
**Author:** Senior Full-Stack, Next.js, Vercel Infrastructure & SEO Systems Engineer  
**Status:** Code-Level Fix Completed & Verified | DNS & Deployment Action Required  
**Canonical Domain:** `https://www.thenijobs.com`

---

## 1. Executive Summary & Root Cause Analysis

### 1.1 The Primary Issue: `ERR_TOO_MANY_REDIRECTS` on `thenijobs.com`
When navigating to `https://thenijobs.com`, the browser entered an infinite redirect loop and failed with `ERR_TOO_MANY_REDIRECTS`.

#### Root Cause (Dual Opposing Redirect Policies):
1. **Vercel Edge Level:**
   - In the Vercel Project Domains configuration, the apex domain `thenijobs.com` is configured as **"Redirect to www.thenijobs.com"**.
   - Verified via live HTTP header probe:
     ```http
     HTTP/1.1 308 Permanent Redirect
     Location: https://www.thenijobs.com/
     Server: Vercel
     ```
2. **Next.js Middleware Level (in deployed commit `8e9798b`):**
   - The previously deployed `src/middleware.ts` configured `thenijobs.com` (apex) as the canonical target, incorrectly classifying `www.thenijobs.com` as an alias:
     ```typescript
     // PREVIOUS BUGGY LOGIC in commit 8e9798b
     const isAliasHost =
       hostname === 'thenijobs.in' ||
       hostname === 'www.thenijobs.in' ||
       hostname === 'www.thenijobs.com'; // <--- Root cause of ping-pong loop

     if (isAliasHost) {
       url.host = 'thenijobs.com'; // <--- Redirected www back to apex!
       return NextResponse.redirect(url, 301);
     }
     ```
   - Verified via live HTTP header probe against production:
     ```http
     HTTP/1.1 301 Moved Permanently
     Location: https://thenijobs.com/
     Server: Vercel
     ```
3. **The Infinite Ping-Pong Cycle:**
   $$\text{Browser requests } https://thenijobs.com \xrightarrow{\text{Vercel 308}} https://www.thenijobs.com \xrightarrow{\text{Next.js 301}} https://thenijobs.com \xrightarrow{\text{Vercel 308}} \dots \text{ [Infinite Loop]}$$

---

### 1.2 The Secondary Issue: `thenijobs.in` "Invalid Configuration" in Vercel
In the Vercel Dashboard, `thenijobs.in` displayed **"Invalid Configuration"**, while `www.thenijobs.in` showed **"Valid Configuration"**.

#### Root Cause (Stale Conflicting DNS Records):
Live DNS query via `nslookup thenijobs.in`:
```
Name:    thenijobs.in
Addresses:  2a02:4780:84::32   <--- Hostinger IPv6 (STALE/CONFLICTING)
            2.57.91.91         <--- Hostinger IPv4 (STALE/CONFLICTING)
            216.198.79.1       <--- Vercel Anycast IPv4 (CORRECT)
```
- The domain registrar for `thenijobs.in` contains legacy A and AAAA records pointing to an old Hostinger server (`2.57.91.91` and `2a02:4780:84::32`).
- When Vercel automated ACME/Let's Encrypt SSL challenges or edge health-checks hit `thenijobs.in`, queries resolve inconsistently to the Hostinger server, which returns an SSL handshake alert (`SEC_E_ILLEGAL_MESSAGE`).
- In contrast, `www.thenijobs.in` has a clean CNAME pointing exclusively to Vercel (`d6b4022f797e951b.vercel-dns-017.com`), which is why `www.thenijobs.in` is Valid.

---

## 2. Complete File Inspection & Audit Inventory

| File Path | Inspection Focus | Findings & Modifications |
| :--- | :--- | :--- |
| `vercel.json` | Vercel Edge configuration | Valid headers, rewrites, and cron jobs. No conflicting edge redirect blocks present. |
| `next.config.ts` | Next.js redirect configuration | Clean internal redirects (`/services` $\rightarrow$ `/marketplace?type=services`, `/companies` $\rightarrow$ `/businesses`). No conflicting domain rules. |
| `src/middleware.ts` | Edge Domain Redirection | **Primary Fix Applied:** Enforces `https://www.thenijobs.com` as canonical; supports `x-forwarded-host`; strictly passes canonical host through without redirect. |
| `src/lib/seo/metadata.ts` | Base SEO Metadata builder | Sets `SITE_URL = 'https://www.thenijobs.com'`. |
| `src/app/sitemap.ts` | Dynamic XML Sitemap | Sets `BASE = 'https://www.thenijobs.com'`. |
| `src/app/robots.ts` | Robots.txt directives | Sets `host: 'https://www.thenijobs.com'` and `sitemap: 'https://www.thenijobs.com/sitemap.xml'`. |
| 64 app & component files | Canonical & OG URLs | Updated all hardcoded `https://thenijobs.com` references to `https://www.thenijobs.com`. |
| `tests/domain-redirects.test.mjs` | Automated redirect tests | Created 9 automated assertions covering all redirect scenarios and anti-loop invariants. |

---

## 3. Safe Production Fix Implementation

### 3.1 Hardened Middleware (`src/middleware.ts`)
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * THENIJOBS — Edge Canonical Domain Redirection Middleware
 *
 * Enforces https://www.thenijobs.com as the primary canonical production domain.
 * Permanently redirects (HTTP 301) alias/apex domains (thenijobs.com, thenijobs.in, www.thenijobs.in)
 * to https://www.thenijobs.com, preventing redirect loops, duplicate content, and split SEO equity.
 *
 * Invariant: Requests arriving at www.thenijobs.com MUST NEVER redirect,
 * terminating cleanly at the canonical destination.
 */
export function middleware(request: NextRequest) {
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 3.2 Key Protection Mechanics
1. **Preserves Path & Query:** Uses `request.nextUrl.clone()`, ensuring deep links (e.g. `/marketplace?type=services&district=Theni`) maintain exact query arguments upon 301 redirection.
2. **Explicit Canonical Pass-Through:** `if (hostname === 'www.thenijobs.com') return NextResponse.next();` guarantees zero chance of self-redirection or redirect loops.
3. **Environment Agnostic:** Requests to `localhost`, `127.0.0.1`, and Vercel preview environments (`*.vercel.app`) pass through cleanly without redirection.

---

## 4. Phase 3: SEO Corrections Across the Codebase

All 64 files containing metadata, canonical tags, and OpenGraph URLs were updated from `https://thenijobs.com` to `https://www.thenijobs.com`:
- **Pricing:** `src/app/pricing/page.tsx` & `layout.tsx` canonical tags updated.
- **Marketplace & Services:** `src/app/marketplace/page.tsx` & `src/app/services/layout.tsx` canonical tags updated.
- **Company Profiles:** `src/app/[companySlug]/page.tsx` & `src/app/company/[slug]/CompanyProfilePageClient.tsx` updated.
- **Portfolios:** `src/app/portfolio/[username]/page.tsx` & `src/app/portfolio/seeker/[id]/page.tsx` updated.
- **Structured Data:** JSON-LD BreadcrumbList and Organization schemas now use `https://www.thenijobs.com`.
- **ID Cards & WhatsApp Links:** Pre-filled shareable URLs now use `https://www.thenijobs.com`.

---

## 5. Phase 4: Automated Testing & Verification Results

### 5.1 Domain Redirects Test Suite (`tests/domain-redirects.test.mjs`)
- ✔ 1. Authoritative canonical domain (`www.thenijobs.com`) passes through without redirect (0.33ms)
- ✔ 2. Apex domain (`thenijobs.com`) permanently redirects (301) to `www.thenijobs.com` preserving path & query (0.64ms)
- ✔ 3. Apex .in domain (`thenijobs.in`) permanently redirects (301) to `www.thenijobs.com` (0.42ms)
- ✔ 4. www .in domain (`www.thenijobs.in`) permanently redirects (301) to `www.thenijobs.com` (0.40ms)
- ✔ 5. Respects `x-forwarded-host` header from Vercel edge reverse proxy (0.50ms)
- ✔ 6. Canonical domain with port (`www.thenijobs.com:443`) does not self-redirect (0.28ms)
- ✔ 7. Localhost and Vercel preview URLs pass through without redirection (0.41ms)
- ✔ 8. Multi-Hop Redirect Loop Simulation: Output of redirect terminates at canonical (0.48ms)
- ✔ 9. Middleware source code static invariants audit (1.46ms)

### 5.2 Overall Test Suite Execution
- **Command:** `npm test`
- **Result:** **129 passed / 0 failed / 21 suites (100% Pass Rate)**
- **Duration:** 497.30 ms

### 5.3 Next.js Production Build
- **Command:** `npm run build`
- **Result:** **Exited with code 0**
- **Output:** All 322 static and dynamic routes compiled successfully in Turbopack.

---

## 6. Phase 5: DNS Configuration & Manual Action Requirements

The codebase changes are completely verified and ready for deployment. The remaining domain-level items must be executed in your **Domain Registrar DNS Manager** (e.g. GoDaddy, Namecheap, Hostinger) and **Vercel Project Settings**:

### 6.1 Fix for `thenijobs.in` ("Invalid Configuration")
In your DNS provider for **`thenijobs.in`**:
1. **REMOVE** the stale Hostinger A record:
   - Type: `A` | Name/Host: `@` | Value: `2.57.91.91` $\rightarrow$ **DELETE**
2. **REMOVE** the stale Hostinger AAAA record:
   - Type: `AAAA` | Name/Host: `@` | Value: `2a02:4780:84::32` $\rightarrow$ **DELETE**
3. **VERIFY / ADD** the Vercel A record:
   - Type: `A` | Name/Host: `@` | Value: `76.76.21.21` (or `216.198.79.1`) $\rightarrow$ **SAVE**
4. Once removed, return to **Vercel Dashboard $\rightarrow$ Settings $\rightarrow$ Domains**, find `thenijobs.in`, and click **"Refresh"**. Vercel will verify the DNS and issue the SSL certificate.

### 6.2 Vercel Domain Configuration for `thenijobs.com` & `thenijobs.in`
In **Vercel Dashboard $\rightarrow$ Settings $\rightarrow$ Domains**:
- **`www.thenijobs.com`**: Set as the **Production Domain** (Canonical).
- **`thenijobs.com`**: Set to **"Redirect to www.thenijobs.com"** (Status Code: 308).
- **`www.thenijobs.in`**: Set to **"Redirect to www.thenijobs.com"** (Status Code: 308).
- **`thenijobs.in`**: Set to **"Redirect to www.thenijobs.com"** (Status Code: 308).

---

## 7. Production Deployment Instructions

To apply the code-level fix to production:

```bash
# 1. Commit and push changes to the repository
git add .
git commit -m "fix(seo): eliminate redirect loop by aligning canonical domain to www.thenijobs.com"
git push origin main

# 2. Or trigger immediate production deployment via Vercel CLI
vercel --prod
```

Once deployed, verify using curl:
```bash
curl -I https://thenijobs.com
# Expected: HTTP 308 -> https://www.thenijobs.com/

curl -I https://www.thenijobs.com
# Expected: HTTP 200 OK (Clean page load, no redirect loop)
```
