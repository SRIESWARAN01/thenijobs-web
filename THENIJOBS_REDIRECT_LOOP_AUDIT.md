# THENIJOBS – Production Custom Domain Redirect Loop Audit & Resolution Report

**Project:** THENIJOBS  
**Production URL:** `https://thenijobs-web-main.vercel.app`  
**Preferred Canonical Domain:** `https://www.thenijobs.com`  
**Date:** October 24, 2026  
**Auditor:** Senior Vercel, Next.js, DNS & Production Deployment Engineer  

---

## 1. Executive Summary

| Target Domain | Status on Production Before Fix | Root Cause Classification | Post-Fix Target Behavior |
| :--- | :--- | :--- | :--- |
| `https://thenijobs-web-main.vercel.app` | **200 OK** | None (Baseline Vercel deployment healthy) | **200 OK** direct pass-through |
| `https://thenijobs.com` | **ERR_TOO_MANY_REDIRECTS** | Vercel Edge 308 to WWW $\leftrightarrow$ Old Next.js Middleware 301 to Apex | **308/301 Redirect** $\rightarrow$ `https://www.thenijobs.com` |
| `https://www.thenijobs.com` | **ERR_TOO_MANY_REDIRECTS** | Old Next.js Middleware (`8e9798b`) 301 to Apex $\leftrightarrow$ Vercel Edge 308 to WWW | **200 OK** Authoritative Canonical Destination |
| `https://thenijobs.in` | **SSL Alert 80 (Invalid Configuration)** | Hostinger DNS zone has conflicting stale A/AAAA records | **301 Redirect** $\rightarrow$ `https://www.thenijobs.com` |
| `https://www.thenijobs.in` | **ERR_TOO_MANY_REDIRECTS** | Old Next.js Middleware 301 to Apex $\rightarrow$ entered `thenijobs.com` loop | **301 Redirect** $\rightarrow$ `https://www.thenijobs.com` |

---

## 2. Confirmed Root Cause Analysis

### A. The Ping-Pong Loop on `thenijobs.com` and `www.thenijobs.com`
Direct probing using low-level network tracing (`scripts/audit-live-and-local.mjs`) isolated the exact loop mechanism:
1. **Vercel Project Domain Configuration**: Vercel was configured with `www.thenijobs.com` as the primary production domain and `thenijobs.com` configured to redirect to `www.thenijobs.com` with HTTP `308 Permanent Redirect`.
2. **Conflicting Application Code in Production (Commit `8e9798b`)**: The previously deployed Next.js middleware at edge contained code forcing traffic to the apex domain `thenijobs.com` with HTTP `301 Moved Permanently`.
3. **The Infinite Cycle**:
   - Client requests `https://thenijobs.com` $\rightarrow$ Vercel edge issues `308 Permanent Redirect` to `https://www.thenijobs.com/`.
   - Browser requests `https://www.thenijobs.com/` $\rightarrow$ Next.js middleware intercepts and issues `301 Moved Permanently` to `https://thenijobs.com/`.
   - Browser requests `https://thenijobs.com/` $\rightarrow$ Vercel edge issues `308 Permanent Redirect` to `https://www.thenijobs.com/`.
   - After repeated iterations, browser halts with `ERR_TOO_MANY_REDIRECTS`.

### B. The "Invalid Configuration" and Handshake Failure on `thenijobs.in`
DNS investigation via `nslookup` revealed conflicting records in Hostinger DNS:
- Stale Hostinger Parking/Shared A record: `2.57.91.91`
- Stale Hostinger IPv6 AAAA record: `2a02:4780:84::32`
- Vercel Anycast A record: `216.198.79.1`

Because the stale Hostinger IPs answered requests before or alongside Vercel, Let's Encrypt / ACME domain validation failed, preventing Vercel from provisioning an SSL certificate. This triggered `SSL alert number 80` (`SEC_E_ILLEGAL_MESSAGE`), causing Vercel to mark `thenijobs.in` as **Invalid Configuration**.

---

## 3. Redirect Chains

### Before Fix (Observed in Production Deployment `8e9798b`)

#### 1. `https://thenijobs.com`
```
Hop 1: GET https://thenijobs.com
       Status: 308 Permanent Redirect (Server: Vercel)
       Location: https://www.thenijobs.com/

Hop 2: GET https://www.thenijobs.com/
       Status: 301 Moved Permanently (Server: Vercel Next.js Middleware)
       Location: https://thenijobs.com/

Hop 3: GET https://thenijobs.com/
       Status: 308 Permanent Redirect (Server: Vercel)
       Location: https://www.thenijobs.com/

Hop 4: LOOP DETECTED -> ERR_TOO_MANY_REDIRECTS
```

#### 2. `https://www.thenijobs.com`
```
Hop 1: GET https://www.thenijobs.com
       Status: 301 Moved Permanently (Server: Vercel Next.js Middleware)
       Location: https://thenijobs.com/

Hop 2: GET https://thenijobs.com/
       Status: 308 Permanent Redirect (Server: Vercel)
       Location: https://www.thenijobs.com/

Hop 3: GET https://www.thenijobs.com/
       Status: 301 Moved Permanently (Server: Vercel Next.js Middleware)
       Location: https://thenijobs.com/

Hop 4: LOOP DETECTED -> ERR_TOO_MANY_REDIRECTS
```

#### 3. `https://thenijobs.in`
```
Hop 1: GET https://thenijobs.in
       Status: Connection Failure / SSL Alert 80
       Reason: Conflicting A/AAAA records in Hostinger DNS; no Vercel SSL cert issued
```

#### 4. `https://www.thenijobs.in`
```
Hop 1: GET https://www.thenijobs.in
       Status: 301 Moved Permanently (Server: Vercel Next.js Middleware)
       Location: https://thenijobs.com/

Hop 2: GET https://thenijobs.com/
       Status: 308 Permanent Redirect (Server: Vercel)
       Location: https://www.thenijobs.com/

Hop 3: GET https://www.thenijobs.com/
       Status: 301 Moved Permanently (Server: Vercel Next.js Middleware)
       Location: https://thenijobs.com/

Hop 4: LOOP DETECTED -> ERR_TOO_MANY_REDIRECTS
```

---

### After Fix (Implemented and Tested Locally)

#### 1. `https://www.thenijobs.com` (Authoritative Canonical Domain)
```
Hop 1: GET https://www.thenijobs.com/jobs?category=it
       Status: 200 OK (Pass-through via NextResponse.next())
       Termination: Instant 200 OK, zero redirects
```

#### 2. `https://thenijobs.com` (Apex Domain)
```
Hop 1: GET https://thenijobs.com/jobs?category=it
       Status: 301 Moved Permanently
       Location: https://www.thenijobs.com/jobs?category=it
       
Hop 2: GET https://www.thenijobs.com/jobs?category=it
       Status: 200 OK
       Termination: 1 Hop, 0 Loops
```

#### 3. `https://thenijobs.in` & `https://www.thenijobs.in` (Regional Domains)
```
Hop 1: GET https://(www.)thenijobs.in/marketplace?type=services
       Status: 301 Moved Permanently
       Location: https://www.thenijobs.com/marketplace?type=services

Hop 2: GET https://www.thenijobs.com/marketplace?type=services
       Status: 200 OK
       Termination: 1 Hop, 0 Loops
```

---

## 4. Files Inspected

1. `vercel.json` – Verified clean: headers configured for security, no legacy redirect overrides.
2. `next.config.ts` – Verified clean: image optimization remotePatterns configured, no `redirects()` array conflicting with canonical domain.
3. `package.json` – Framework identified: Next.js 16.3.4 (App Router), React 19.2.4, TypeScript 5, TailwindCSS 4.
4. `src/middleware.ts` – Identified the primary culprit: previously forced non-WWW apex domain (`thenijobs.com`), directly clashing with Vercel's edge redirect.
5. `src/app/layout.tsx` – Inspected `metadataBase` and OpenGraph URLs.
6. `src/app/sitemap.ts` & `src/app/robots.ts` – Inspected canonical sitemap generator URLs.
7. `src/lib/constants.ts` – Inspected application-wide `APP_URL` and `PRODUCTION_URL`.
8. `src/lib/seo/metadata.ts`, `schemas.ts`, `jobSchema.ts` – Inspected canonical tag builders and JSON-LD schemas.
9. 60+ Page and Layout metadata definitions across `src/app/` – Inspected for hardcoded URLs.
10. Authentication & Firebase flows (`src/lib/firebase/`, `src/app/login/`, `src/app/register/`) – Verified zero dependency on custom domain redirect loops.

---

## 5. Files Modified

### 1. `src/middleware.ts` (Core Fix)
- Strict single canonical destination: `CANONICAL_DOMAIN = 'www.thenijobs.com'`.
- Pass-through guard: If `hostname === 'www.thenijobs.com'` or localhost/preview, immediately returns `NextResponse.next()`.
- Single 301 redirect for alias hostnames (`thenijobs.com`, `thenijobs.in`, `www.thenijobs.in`) to `https://www.thenijobs.com`, preserving full `pathname` and `search` query parameters.
- Reads `x-forwarded-host` with fallback to `req.nextUrl.hostname` to correctly handle Vercel's reverse proxy layer.

### 2. `src/lib/constants.ts`
- Standardized `APP_URL` and `SITE_URL` to `https://www.thenijobs.com`.

### 3. `src/app/layout.tsx`
- Standardized `metadataBase` to `new URL('https://www.thenijobs.com')`.

### 4. `src/app/sitemap.ts` & `src/app/robots.ts`
- Standardized sitemap generation and robots host to `https://www.thenijobs.com`.

### 5. SEO & Metadata Libraries (3 files)
- `src/lib/seo/metadata.ts`: Base domain set to `https://www.thenijobs.com`.
- `src/lib/seo/schemas.ts`: Organization schema and WebSite `@id` updated to `https://www.thenijobs.com`.
- `src/lib/seo/jobSchema.ts`: Structured job schema URLs updated to `https://www.thenijobs.com`.

### 6. Pages, Layouts, and Components (60+ files)
- Standardized all canonical URLs, OpenGraph images, and JSON-LD schema instances across all 7 Theni taluk landing pages, daily jobs, employer dashboard, marketplace, and public company profiles to `https://www.thenijobs.com`.

### 7. Automated Test Suite
- `tests/domain-redirects.test.mjs`: Added 9 regression tests covering all canonical pass-throughs, aliases, query preservation, and loop termination.

---

## 6. DNS Records Requiring Manual Verification (Hostinger DNS)

To resolve the "Invalid Configuration" on `thenijobs.in` and guarantee seamless SSL certificate generation across all 4 hostnames, verify the Hostinger DNS zone for both domains:

### For `thenijobs.com`
| Type | Name / Host | Target / Value | TTL | Action |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `216.198.79.1` | 3600 (or Auto) | **Keep / Ensure present** (Vercel Anycast IP) |
| **CNAME** | `www` | `cname.vercel-dns.com` (or Vercel-provided CNAME) | 3600 (or Auto) | **Keep** (Currently Valid in Vercel) |

### For `thenijobs.in` (CRITICAL FIX FOR INVALID CONFIGURATION)
| Type | Name / Host | Target / Value | Action | Reason |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `2.57.91.91` | **DELETE** | Stale Hostinger IP preventing Vercel ACME challenge |
| **AAAA** | `@` | `2a02:4780:84::32` | **DELETE** | Stale Hostinger IPv6 causing connection timeouts |
| **A** | `@` | `216.198.79.1` | **ADD / KEEP** | Official Vercel Anycast IPv4 record |
| **CNAME** | `www` | `cname.vercel-dns.com` (or Vercel CNAME) | **KEEP** | Points www alias cleanly to Vercel |

---

## 7. Vercel Configuration Requirements

1. **Domains Settings in Vercel Dashboard** (`Project -> Settings -> Domains`):
   - `www.thenijobs.com` $\rightarrow$ **Production (No redirect)**.
   - `thenijobs.com` $\rightarrow$ **Redirect to `www.thenijobs.com`** (308 Permanent).
   - `www.thenijobs.in` $\rightarrow$ **Redirect to `www.thenijobs.com`** (308 Permanent).
   - `thenijobs.in` $\rightarrow$ **Redirect to `www.thenijobs.com`** (308 Permanent).
2. **Environment Variables**:
   - Ensure `NEXT_PUBLIC_APP_URL` = `https://www.thenijobs.com` in Production.

---

## 8. Tests Executed & Verification Results

### A. Automated Unit and Integration Tests
```
$ npm test
ℹ tests 129
ℹ suites 21
ℹ pass 129
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
- **129/129 tests passed (100% pass rate)**.
- Specific domain redirect tests passed in `tests/domain-redirects.test.mjs`:
  1. Authoritative canonical domain (`www.thenijobs.com`) passes through without redirect (HTTP 200).
  2. Apex domain (`thenijobs.com`) permanently redirects (301) to `www.thenijobs.com` preserving path & query parameters.
  3. Regional apex (`thenijobs.in`) permanently redirects (301) to `www.thenijobs.com`.
  4. Regional www (`www.thenijobs.in`) permanently redirects (301) to `www.thenijobs.com`.
  5. Respects `x-forwarded-host` from Vercel edge reverse proxy.
  6. Port numbers (e.g., `:443`) stripped safely without false self-redirects.
  7. Localhost and Vercel preview URLs pass through cleanly without redirection.
  8. Multi-hop simulation proves termination in exactly 1 hop (no cycle possible).
  9. Middleware static invariants check confirms zero hardcoded redirects to apex.

### B. Production Build Verification
```
$ npm run build
   ▲ Next.js 16.3.4 (Turbopack)
   ✓ Compiled successfully in 14.5s
   ✓ Generating static pages (322/322)
   ✓ Finalizing page optimization
Exit status: 0
```

### C. Local Runtime Route Verification (`http://localhost:3000`)
- `/` $\rightarrow$ `HTTP 200 OK`
- `/jobs` $\rightarrow$ `HTTP 200 OK`
- `/marketplace` $\rightarrow$ `HTTP 200 OK`
- `/marketplace?type=services` $\rightarrow$ `HTTP 200 OK`
- `/daily-jobs` $\rightarrow$ `HTTP 200 OK`
- `/login` $\rightarrow$ `HTTP 200 OK`
- `/register` $\rightarrow$ `HTTP 200 OK`
- `/pricing` $\rightarrow$ `HTTP 200 OK`
- `/businesses` $\rightarrow$ `HTTP 200 OK`
- `/robots.txt` $\rightarrow$ `HTTP 200 OK`
- `/sitemap.xml` $\rightarrow$ `HTTP 200 OK`

---

## 9. Remaining Production Deployment Steps

To complete the production transition and see the live custom domains working without `ERR_TOO_MANY_REDIRECTS`:

1. **Deploy the Codebase to Vercel**:
   ```bash
   git add -A
   git commit -m "fix(domain): resolve redirect loop, enforce www.thenijobs.com canonical domain across middleware and SEO metadata"
   git push origin main
   ```
2. **Update Hostinger DNS for `thenijobs.in`**:
   - Delete stale A record `2.57.91.91`.
   - Delete stale AAAA record `2a02:4780:84::32`.
   - Wait 5-15 minutes for DNS TTL to expire.
   - Click "Refresh" in the Vercel Domains tab for `thenijobs.in`. Vercel will immediately issue the Let's Encrypt SSL certificate and transition status from "Invalid Configuration" to "Valid Configuration".
3. **Verify Live Custom Domains**:
   Run `node scripts/audit-live-and-local.mjs` post-deployment to verify all live domains terminate with `HTTP 200 OK` at `https://www.thenijobs.com`.
