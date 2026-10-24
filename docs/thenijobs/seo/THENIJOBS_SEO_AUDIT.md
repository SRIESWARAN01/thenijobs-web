# THENIJOBS – Comprehensive Technical SEO Audit Report

**Project:** THENIJOBS  
**Production URL:** `https://thenijobs-web-main.vercel.app`  
**Canonical Domain:** `https://www.thenijobs.com`  
**Framework:** Next.js 16.3.4 (App Router) | React 19.2.4 | TypeScript 5 | TailwindCSS 4  
**Date of Audit:** October 24, 2026  
**Auditor:** Senior Technical SEO & Performance Engineer  

---

## 1. Executive Summary & Audit Scope

This audit evaluates the complete crawlability, indexability, structured data integrity, canonical routing, and performance posture of the THENIJOBS platform. Every public page, dynamic entity route, sitemap generation endpoint, and robots directive was evaluated against Google Search Essentials, Schema.org specifications, and Web Vitals standards.

---

## 2. Issues Discovered, Severity & Implemented Corrections

| ID | Issue Description | Severity | Affected Routes | Evidence | Resolution / Fix Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEO-01** | **Domain Redirect Ping-Pong Loop** | **Critical** | `thenijobs.com`, `www.thenijobs.com`, `www.thenijobs.in` | Vercel Edge issued 308 to WWW while Next.js middleware issued 301 to Apex. Infinite bounce triggered `ERR_TOO_MANY_REDIRECTS`. | **FIXED:** Refactored `src/middleware.ts` to enforce `www.thenijobs.com` as canonical pass-through (`NextResponse.next()`) and single 301 hop for aliases. |
| **SEO-02** | **Conflicting Stale DNS Records on `.in` Domain** | **Critical** | `https://thenijobs.in` | `nslookup` revealed stale Hostinger IPs (`2.57.91.91`, `2a02:4780:84::32`) competing with Vercel IP (`216.198.79.1`). Failed SSL handshake (`SSL alert 80`). | **ACTION DOCUMENTED:** Requires removal of stale A/AAAA records in Hostinger DNS zone to enable Let's Encrypt validation. |
| **SEO-03** | **Soft 404 & Indexing of Expired Job Postings** | **High** | `/jobs/[id]` | Expired or closed jobs previously returned empty shells with 200 OK, risking Google quality penalties and broken user journeys. | **FIXED:** Added `isJobExpired()` utility. Expired jobs emit `robots: { index: false, follow: true }`, suppress `JobPosting` JSON-LD, and non-existent jobs trigger genuine Next.js `notFound()` (HTTP 404). |
| **SEO-04** | **Unrestricted Google Indexing API Calls** | **High** | `/api/seo/index-job` | Attempting to notify Google Indexing API of products, companies, or categories violates Google's explicit policy (strictly JobPosting or BroadcastEvent). | **FIXED:** Enforced regex guardrail `^https:\/\/(www\.)?thenijobs\.com\/jobs\/[a-zA-Z0-9_\-]+$` in `src/lib/seo/googleIndexingApi.ts`. Non-job requests are rejected with 400. |
| **SEO-05** | **Hand-Maintained Out-of-Sync Sitemap Slugs** | **Medium** | `/sitemap.xml` | Hardcoded category lists advertised non-existent routes (105 URLs returning 404 in early deployments). | **FIXED:** Refactored `src/app/sitemap.ts` to derive paths dynamically from `LOCATIONS_DATA`, `CATEGORIES_LIST`, and `BUSINESS_CATEGORY_SITEMAP_SLUGS`. |
| **SEO-06** | **Fictitious `lastmod` Timestamp Generation** | **Medium** | `/sitemap.xml` | All static and hub pages previously stamped `new Date()` at build time, invalidating crawl priority trust. | **FIXED:** Implemented `withLastModified(value)` which only emits `<lastmod>` when a valid, verified database timestamp (`updatedAt`) exists. |
| **SEO-07** | **Incomplete Sitemap Coverage for Portfolios & Marketplace** | **Medium** | `/sitemap.xml` | Published seeker portfolios and product/service item pages were excluded from sitemap discovery. | **FIXED:** Added `getPublicSeekerPortfoliosForSitemap()` and `getAllMarketplaceItemParamsServer()` to include all verified public items. |
| **SEO-08** | **Search & Filter Parameter Duplicate Content** | **Medium** | `/marketplace`, `/jobs`, `/daily-jobs` | Faceted navigation (`?search=`, `?sort=`, `?taluk=`) threatened duplicate indexing. | **FIXED:** Self-referencing canonical URLs set on base paths (`https://www.thenijobs.com/marketplace`), and `robots.ts` disallows `/*?search=*`. |
| **SEO-09** | **Missing Server-Side Rendered JSON-LD on Dynamic Items** | **Medium** | `/marketplace/product/*`, `/marketplace/service/*`, `/company/*` | Client-only component rendering meant Googlebot had to execute JS before seeing structured data. | **FIXED:** Server components generate `BreadcrumbList`, `Organization`, `LocalBusiness`, `Product`, and `Service` JSON-LD directly into initial HTML response. |
| **SEO-10** | **Private Dashboard Crawl Leakage** | **Low** | `/admin/*`, `/employer/*`, `/seeker/*` | Risk of search bots indexing private authenticated shells. | **FIXED:** Standardized `robots.ts` with explicit `disallow: ['/admin/', '/seeker/', '/employer/', '/api/', '/login', '/register', '/profile']`. |

---

## 3. Crawlability & Indexability Audit

```
Googlebot HTTP Request
        │
        ▼
Vercel Edge Proxy ──(Host: thenijobs.com)──► 308 Redirect to www.thenijobs.com
        │
        ▼ (Host: www.thenijobs.com)
Next.js Middleware ──(Valid Canonical)────► NextResponse.next()
        │
        ├─► /robots.txt (Valid plaintext disallows private, points to sitemap)
        ├─► /sitemap.xml (Valid dynamic XML, Firestore-backed active records)
        ├─► / (HTTP 200, WebSite + Organization + FAQ schema)
        ├─► /jobs/[slug] (HTTP 200, Server-rendered JobPosting schema)
        ├─► /company/[slug] (HTTP 200, Server-rendered LocalBusiness schema)
        └─► /admin/* (Protected by auth session + robots disallow)
```

### Crawlability Summary
* **Public Discovery Hubs:** 100% crawlable.
* **Essential Static Assets:** `/_next/static/` explicitly allowed for full CSS/JS rendering.
* **Private Protection:** Sensitive administration, authentication, and employer management routes shielded.
* **Orphan Prevention:** Comprehensive bidirectional internal linking established between jobs, hiring companies, locations, and categories.

---

## 4. On-Page & Heading Hierarchy Audit

* **Single `<h1>` Invariant:** Verified on all core templates (Home, Jobs, Daily Jobs, Marketplace, Business Directory, Company Profile, Job Details).
* **Logical Subheading Flow:** Primary sections follow strict `<h1>` $\rightarrow$ `<h2>` $\rightarrow$ `<h3>` cascades without skipped levels.
* **Semantic Elements:** Utilizes semantic `<main>`, `<header>`, `<nav>`, `<article>`, and `<section>` tags across layouts.
* **Image Accessibility:** Enforces descriptive alt attributes via `generateImageAlt()` rather than empty or generic tags.

---

## 5. Technical SEO Audit Checklist Status

- [x] Canonical domain strategy aligned to `https://www.thenijobs.com`
- [x] Zero redirect loops on canonical domain
- [x] Server-side metadata on all dynamic routes (`generateMetadata`)
- [x] Valid JSON-LD structured data matching visible content
- [x] Soft 404 prevention with real HTTP 404 status codes
- [x] Dynamic sitemap with real Firestore records
- [x] Clean robots.txt pointing to XML sitemap
- [x] Google Indexing API policy enforcement for jobs only
- [x] Mobile responsiveness and viewport meta tags verified
- [x] Automated test coverage for all SEO invariants
