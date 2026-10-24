# THENIJOBS – SEO Architecture & Implementation Guide

**Project:** THENIJOBS  
**Production Host:** `https://www.thenijobs.com`  
**Date:** October 24, 2026  
**Document:** Technical SEO Implementation Architecture  

---

## 1. Architectural Overview

The THENIJOBS SEO architecture is built around three foundational pillars:
1. **Server-Side Generation & Rendering (SSR / SSG):** All public pages render full semantic HTML, metadata, and JSON-LD structured data on the server before reaching the client. Search engine spiders (Googlebot, Bingbot) receive rich, complete content without relying on JavaScript client hydration.
2. **Deterministic Canonical Hierarchy:** Every route defines an unambiguous canonical URL using `https://www.thenijobs.com`. Alias hostnames (`thenijobs.com`, `thenijobs.in`, `www.thenijobs.in`) are 301-redirected immediately at edge/middleware without entering duplicate indexing or redirect loops.
3. **Database-Driven Discovery:** Dynamic routes (jobs, companies, marketplace items, portfolios) sync directly with live Firebase Firestore collections via secure server utilities (`src/lib/firebase/firestoreServer.ts`).

---

## 2. Core SEO Engine (`src/lib/seo/seoEngine.ts`)

The centralized SEO Engine provides reusable, typed generators for all platform entities:

```typescript
// Example: Centralized canonical URL builders
export function canonicalCompanyUrl(slug: string): string {
  return `https://www.thenijobs.com/company/${slug}`;
}

export function canonicalJobUrl(slugOrId: string): string {
  return `https://www.thenijobs.com/jobs/${slugOrId}`;
}

export function canonicalProductUrl(companySlug: string, itemId: string): string {
  return `https://www.thenijobs.com/marketplace/product/${companySlug}/${itemId}`;
}

export function canonicalServiceUrl(companySlug: string, itemId: string): string {
  return `https://www.thenijobs.com/marketplace/service/${companySlug}/${itemId}`;
}
```

### Key Functions Implemented
* `generateCompanySEO(company)`: Generates title, meta description, OpenGraph, and Twitter tags for verified companies.
* `generateCompanySchema(company)`: Produces `LocalBusiness` / `Organization` JSON-LD schema with address, contact, and founding date.
* `generateProductSEO(product, company)`: Generates canonical metadata and OpenGraph images for marketplace products.
* `generateProductSchemaLD(product, company)`: Produces `Product` JSON-LD schema with authentic prices and seller credentials.
* `generateServiceSEO(service, company)`: Generates canonical metadata for commercial and local services.
* `generateServiceSchemaLD(service, company)`: Produces `Service` JSON-LD schema with provider details.
* `generateImageAlt(params)`: Produces contextual, descriptive alt text based on entity type and location.

---

## 3. Server-Rendered Metadata Implementation

Each dynamic route exports Next.js `generateMetadata()`:

### A. Dynamic Job Pages (`src/app/jobs/[id]/page.tsx`)
* Retrieves job data via `getJobByIdServer(id)`.
* Emits tailored title: `{job.title} in {job.district} | {job.companyName} | THENIJOBS`.
* Formats salary description dynamically via `formatSalaryDisplay()`.
* Sets `robots: { index: false, follow: true }` if `isJobExpired(job)` is true.
* Permanent redirect (308) from legacy document IDs to canonical slugs (`slugify(title-company-location)`).

### B. Company Profile Pages (`src/app/company/[slug]/page.tsx`)
* Fetches live company details via `getCompanyBySlugServer(slug)`.
* Generates metadata using verified company names, authentic descriptions, and logos.
* Returns `notFound()` with non-indexed 404 metadata if company does not exist.

### C. Marketplace Item Pages (`src/app/marketplace/[type]/[companySlug]/[itemId]/page.tsx`)
* Fetches product or service data via `getMarketplaceItemServer()`.
* Prevents query string duplicate content by forcing canonical URL to clean path.

---

## 4. Structured Data Implementation (JSON-LD)

Structured data is rendered directly into the HTML `<head>` or initial body via `<script type="application/ld+json">` using `toJsonLdScript()`.

### Supported Schema Types
1. **`WebSite`** (Homepage): Includes `SearchAction` targeting `https://www.thenijobs.com/jobs?search={search_term_string}`.
2. **`Organization`** (Homepage & Company Profiles): Includes name, logo, contact points, and verified social URLs.
3. **`LocalBusiness`** (Homepage & Company Profiles): Includes localized address, postal codes, and region.
4. **`JobPosting`** (Job Detail Pages): Strictly follows Google Jobs specifications:
   * `title`, `description`, `datePosted`, `validThrough`, `employmentType`.
   * `hiringOrganization` with verified employer name and logo.
   * `jobLocation` PostalAddress in Tamil Nadu.
   * `baseSalary` MonetaryAmount in INR (only when explicitly provided by employer; never fabricated).
   * Automatically suppressed when job is expired, closed, or inactive.
5. **`Product`** (Marketplace Products): Includes brand, seller, image, and authentic offer details.
6. **`Service`** (Marketplace Services): Includes service provider, category, and area served.
7. **`BreadcrumbList`** (All Hubs & Detail Pages): Unbroken hierarchical navigation chain.
8. **`FAQPage`** (Homepage): FAQ schema generated from verified platform answers.

---

## 5. Dynamic XML Sitemap (`src/app/sitemap.ts`)

Accessible at `https://www.thenijobs.com/sitemap.xml`.
* **Revalidation:** `export const revalidate = 3600` (1 hour) ensures newly published jobs and businesses are discoverable without requiring full rebuilds.
* **Derived Route Slugs:** Reads directly from `LOCATIONS_DATA`, `CATEGORIES_LIST`, and `BUSINESS_CATEGORY_SITEMAP_SLUGS`.
* **Database Queries via Firestore REST API:**
  * `getActiveJobsForSitemap()`: Queries active, non-expired jobs only.
  * `getVerifiedCompanySlugsForSitemap()`: Queries verified public businesses only.
  * `getPublishedPortfolioSitesForSitemap()`: Queries public portfolio sites.
  * `getPublicSeekerPortfoliosForSitemap()`: Queries indexed seeker portfolios.
  * `getAllMarketplaceItemParamsServer()`: Queries verified product and service items.
* **Authentic `lastmod`:** Emits date only when backed by genuine `updatedAt` records; prevents crawler distrust.

---

## 6. Production Robots Configuration (`src/app/robots.ts`)

Accessible at `https://www.thenijobs.com/robots.txt`.
```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/_next/static/',
        ],
        disallow: [
          '/admin/',
          '/seeker/',
          '/employer/',
          '/api/',
          '/login',
          '/register',
          '/register-business',
          '/forgot-password',
          '/profile',
          '/*?search=*',
        ],
      },
    ],
    sitemap: 'https://www.thenijobs.com/sitemap.xml',
    host: 'https://www.thenijobs.com',
  };
}
```

---

## 7. Modified & Created Files Summary

* `src/middleware.ts`: Hardened domain canonicalization and loop prevention.
* `src/lib/constants.ts`: Standardized production URL to `https://www.thenijobs.com`.
* `src/app/layout.tsx`: Root `metadataBase` configuration.
* `src/app/sitemap.ts`: Dynamic XML sitemap generator.
* `src/app/robots.ts`: Production crawler directives.
* `src/lib/seo/seoEngine.ts`: Master entity SEO and JSON-LD engine.
* `src/lib/seo/jobSchema.ts`: Google JobPosting and breadcrumb schemas.
* `src/lib/seo/expiredJobUtils.ts`: Soft 404 and expired job guardrails.
* `src/lib/seo/googleIndexingApi.ts`: Google Indexing API v3 service account integration.
* `src/app/api/seo/index-job/route.ts`: Secure backend Google Indexing webhook.
* `tests/seo.test.mjs`: Automated technical SEO regression test suite.
