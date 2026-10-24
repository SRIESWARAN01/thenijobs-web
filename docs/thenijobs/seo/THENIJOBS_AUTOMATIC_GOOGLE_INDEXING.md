# THENIJOBS – Automatic Google Indexing & Discovery Architecture

**Project:** THENIJOBS  
**Production Host:** `https://www.thenijobs.com`  
**Date:** October 24, 2026  
**Document:** Automatic Google Indexing & Discovery Architecture  

---

## 1. Dual-Track Indexing Architecture

Google Search uses different discovery mechanisms depending on content type. THENIJOBS employs a strict dual-track architecture compliant with Google's official policies:

```
                                  CONTENT CREATION / UPDATE
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         [JOBPOSTING CONTENT]                            [ALL OTHER CONTENT]
   Individual Job Postings (/jobs/*)         (Companies, Products, Services, Locations)
                      │                                               │
                      ▼                                               ▼
             GOOGLE INDEXING API                             DYNAMIC XML SITEMAP
    • Instant URL notification                     • Generated every 3600 seconds
    • URL_UPDATED on publish/edit                  • Verified public records only
    • URL_DELETED on close/expiry                  • Discovered via /sitemap.xml
    • Typically crawled in minutes                 • Crawled on Googlebot schedule
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              ▼
                                   GOOGLE SEARCH CONSOLE
                           • Periodic sitemap pinging
                           • Coverage & indexing status monitoring
```

---

## 2. Track 1: Google Indexing API Integration (Jobs Only)

### Official Policy Constraint
Per [Google Search Central Guidelines](https://developers.google.com/search/apis/indexing-api/v3/quickstart):
> *"Currently, the Indexing API can only be used to crawl pages that include either `JobPosting` or `BroadcastEvent` embedded in a `VideoObject`."*

Attempting to submit company profiles, marketplace categories, or generic URLs can result in quota revocation or domain-level API bans.

### Implementation Details (`src/lib/seo/googleIndexingApi.ts`)
1. **Strict Regex Policy Enforcement:**
   ```typescript
   const jobUrlPattern = /^https:\/\/(www\.)?thenijobs\.com\/jobs\/[a-zA-Z0-9_\-]+$/;
   if (!jobUrlPattern.test(jobUrl)) {
     return {
       success: false,
       url: jobUrl,
       type,
       error: 'Invalid URL. Google Indexing API can only be used for published individual job postings.',
     };
   }
   ```
2. **Server-Side Authentication via OAuth2 JWT:**
   * Utilizes official Google Service Account credentials (`GOOGLE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_JSON`).
   * Generates short-lived RS256 JWT tokens with `https://www.googleapis.com/auth/indexing` scope.
   * Auto-refreshes tokens with clock-skew compensation against Google servers.
   * Zero exposure of service account secrets in client bundles.
3. **API Endpoint (`src/app/api/seo/index-job/route.ts`):**
   * Receives webhook notifications on job publish, update, or deletion.
   * Dispatches payload to `https://indexing.googleapis.com/v3/urlNotifications:publish`.
   * Accepts actions: `URL_UPDATED` (default) and `URL_DELETED`.

---

## 3. Track 2: Dynamic XML Sitemap & Periodic Revalidation

For non-JobPosting entities (Companies, Products, Services, Categories, Locations):

### Automatic Revalidation Schedule
* `src/app/sitemap.ts` exports `export const revalidate = 3600` (1 hour).
* When a new company is verified or product is published in Firestore, it is dynamically incorporated into the sitemap within the hourly revalidation window without requiring a full application redeployment.

### Exclusion Rules
The sitemap strictly filters out:
* Unverified or pending companies (`verified !== true`).
* Inactive or closed jobs (`isActive === false` or `status !== 'active'`).
* Past-deadline jobs (`expiryDate < now`).
* Admin, employer dashboard, and authentication URLs.
* Search query variations and filtered parameters.

---

## 4. Internal Linking Architecture for Fast Spider Discovery

Sitemaps provide hints, but Googlebot prioritizes discovery through HTML links. THENIJOBS implements comprehensive internal linking:

1. **Breadcrumb Links:** Every job, company, product, and service detail page renders clickable HTML breadcrumbs linking to parent hubs (e.g., `Home` $\rightarrow$ `Jobs` $\rightarrow$ `Jobs in Theni` $\rightarrow$ `Job Title`).
2. **Taluk & Category Cross-Linking:**
   * All 7 Theni district taluk hubs link to active jobs in that taluk.
   * Location pages cross-link to category sub-pages (`/jobs-in-theni/freshers`, `/jobs-in-theni/sales`).
3. **Company $\leftrightarrow$ Job Bidirectional Linking:**
   * Job detail pages link directly to the employer's public company profile (`/company/{slug}`).
   * Company profiles display cards linking to all active jobs posted by that company.
4. **Marketplace Navigation:**
   * Unified `/marketplace` and `/marketplace?type=services` tabs ensure both products and services are linked from main navigation.
   * Product/service cards link to dedicated detail pages (`/marketplace/{type}/{companySlug}/{itemId}`).

---

## 5. Automated Testing Verification

Automated test assertions in `tests/seo.test.mjs` confirm:
* Indexing API strictly accepts valid `https://www.thenijobs.com/jobs/*` URLs.
* Indexing API strictly rejects non-job URLs (companies, products, services).
* Expired and closed jobs are excluded from active sitemap generation.
* Verified companies are included in the sitemap while unverified and rejected companies are excluded.

---

## 6. Important Disclaimer Regarding Google Indexing

> **Notice:** Technical SEO compliance and Indexing API notifications alert Google to URL availability and updates. Google maintains absolute discretion over indexing cadence, crawl rate, and search rankings based on domain authority, content quality, and searcher intent. No technical implementation can guarantee immediate indexing or top-tier ranking.
