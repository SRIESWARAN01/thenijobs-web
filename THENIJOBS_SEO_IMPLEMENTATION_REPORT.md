# THENIJOBS — Technical SEO Implementation Report

**Date:** 2026-10-23  
**Status:** Validated & Production Ready  
**Canonical Domain:** `https://www.thenijobs.com`

---

## 1. SEO Architecture Overview

THENIJOBS implements a comprehensive technical SEO stack designed for maximum crawlability, high Core Web Vitals performance, and Google Search & Google for Jobs visibility.

| Component | Endpoint / Implementation | Status |
| :--- | :--- | :--- |
| **Robots.txt** | `/robots.txt` (`src/app/robots.ts`) | Crawls permitted for public hubs; private dashboards blocked. |
| **Dynamic XML Sitemap** | `/sitemap.xml` (`src/app/sitemap.ts`) | Real-time querying of published jobs, approved companies, and public categories. |
| **Canonical URL Standardization** | Standardized to `https://www.thenijobs.com` | Enforced in metadata and Next.js middleware. |
| **Schema.org JobPosting** | Dynamic JSON-LD embedded on job pages | Full Google for Jobs compliance; soft-404 prevention for closed jobs. |
| **Schema.org Organization** | Dynamic JSON-LD on company pages | Validated against Google Rich Results. |
| **Google Indexing API** | `/api/seo/notify-job` | Strictly restricted to qualifying `JobPosting` URLs only. |

---

## 2. Dynamic XML Sitemap Engine (`/sitemap.xml`)

The sitemap automatically fetches all eligible public entities from Firestore:
1. **Core Static Hubs:** `/`, `/jobs`, `/daily-jobs`, `/marketplace`, `/businesses`, `/pricing`, `/about`, `/contact`.
2. **Taluk & Category Landing Pages:**
   - 7 Theni District Taluks &times; 15 job categories (105 targeted landing pages).
3. **Published Jobs:**
   - Queries `jobs` collection where `status == 'published'` and `validThrough > now`.
   - Excludes draft, closed, deleted, or expired jobs.
4. **Approved Companies:**
   - Queries `companies` collection where `verificationStatus == 'verified'`.
   - Excludes pending, rejected, or unverified businesses.

---

## 3. Schema.org JobPosting Structured Data

Every active job listing embeds structured data formatted according to Schema.org standards:

```json
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "Front Office Executive",
  "description": "<p>We are looking for a Front Office Executive...</p>",
  "datePosted": "2026-10-20T10:00:00.000Z",
  "validThrough": "2026-11-19T10:00:00.000Z",
  "employmentType": "FULL_TIME",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "Theni Medical Center",
    "sameAs": "https://www.thenijobs.com/companies/theni-medical-center",
    "logo": "https://www.thenijobs.com/logo.png"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "NRT Road",
      "addressLocality": "Theni",
      "addressRegion": "Tamil Nadu",
      "postalCode": "625531",
      "addressCountry": "IN"
    }
  },
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "INR",
    "value": {
      "@type": "QuantitativeValue",
      "minValue": 15000,
      "maxValue": 22000,
      "unitText": "MONTH"
    }
  }
}
```

### Soft-404 & Expired Job Protection
- When a job expires, is unpublished, or closed:
  - The JobPosting JSON-LD script is removed.
  - The page displays an alert stating the position has closed, along with recommendations for related active positions in the same taluk and category.
  - A notification can be dispatched to Google Indexing API with type `URL_DELETED`.

---

## 4. Google Indexing API Guardrails

In compliance with Google Search Console policies:
- **Eligible URLs:** Only URLs matching `/jobs/[id]` or `/jobs/[slug]` carrying active JobPosting markup are submitted.
- **Ineligible URLs:** Company profiles, general category hubs, marketplace items, and homepage are **never** dispatched to the Indexing API. These are discovered via `/sitemap.xml` and internal linking.
- **Authentication:** Managed securely via Google Service Account credentials (`GOOGLE_APPLICATION_CREDENTIALS` / environment variables) on the server. Never exposed to client-side bundles.

---

## 5. Automated SEO Test Suite Results

All automated tests in `tests/seo-and-indexing.test.mjs` pass cleanly:
- `Canonical Domain Strategy`: PASS
- `Robots Directives`: PASS
- `Expired Job Identification Logic`: PASS
- `Google Indexing API Policy Guardrails`: PASS
- `JobPosting Schema Integrity`: PASS
