# THENIJOBS – Google Search Console (GSC) Production Setup Guide

**Project:** THENIJOBS  
**Production Canonical Host:** `https://www.thenijobs.com`  
**Date:** October 24, 2026  
**Document:** Manual Google Search Console Setup & Verification Guide  

---

## 1. Domain Property Verification (Recommended Method)

To ensure comprehensive tracking across all subdomains and protocol variants (`https://www.thenijobs.com`, `https://thenijobs.com`, `http://...`), verify via **Domain Property** in Hostinger DNS:

### Step-by-Step Instructions:
1. Log into [Google Search Console](https://search.google.com/search-console).
2. Click **Add Property** $\rightarrow$ Select **Domain** (left box).
3. Enter `thenijobs.com` (without `https://` or `www`).
4. Copy the unique `TXT` verification token provided by Google (e.g., `google-site-verification=XXXXXXXXXXXXXXXXXXXXXXX`).
5. Open your [Hostinger Control Panel (hPanel)](https://hpanel.hostinger.com) $\rightarrow$ Navigate to **DNS Zone Editor**.
6. Create a new DNS record:
   * **Type:** `TXT`
   * **Name / Host:** `@`
   * **TXT Value:** Paste the token `google-site-verification=...`
   * **TTL:** `3600` (or default Auto)
7. Return to Google Search Console and click **Verify**.
8. Once verified, add the secondary domain `thenijobs.in` following the exact same procedure.

---

## 2. Sitemap Submission

Once domain ownership is verified:
1. In Google Search Console, select property `thenijobs.com`.
2. In the left navigation menu, click **Sitemaps** (under Indexing).
3. Under **Add a new sitemap**, enter the path:
   ```
   sitemap.xml
   ```
4. Click **Submit**.
5. GSC will process `https://www.thenijobs.com/sitemap.xml`.
6. Confirm the Status changes to **Success**. GSC will display the number of discovered URLs across jobs, companies, marketplace items, and categories.

---

## 3. URL Inspection & Initial Seed Indexing

To prompt Google to discover your primary templates immediately after deployment:
1. Select the search bar at the very top of GSC: **"Inspect any URL in 'thenijobs.com'"**.
2. Inspect the core canonical URLs in this order:
   * `https://www.thenijobs.com/`
   * `https://www.thenijobs.com/jobs`
   * `https://www.thenijobs.com/daily-jobs`
   * `https://www.thenijobs.com/marketplace`
   * `https://www.thenijobs.com/businesses`
   * `https://www.thenijobs.com/jobs-in-theni`
3. Click **Test Live URL**. Verify that:
   * **Page is indexable** (Google can see the HTML).
   * **User-declared canonical** matches **Google-selected canonical** (`https://www.thenijobs.com/...`).
   * **Structured data detected:** `WebSite`, `Organization`, `BreadcrumbList`, etc.
4. Click **Request Indexing**.

---

## 4. Rich Results & Structured Data Monitoring

Google Search Console automatically flags Schema.org validation issues under the **Enhancements** section:

### What to Monitor:
1. **Job Postings:**
   * Verify that discovered jobs appear under the "Job postings" enhancement tab.
   * Check for any critical errors (missing `title`, `description`, `hiringOrganization`, or `jobLocation`).
   * Verify that warnings (e.g., `baseSalary` not provided) are understood: THENIJOBS deliberately omits salary when the employer selects "Negotiable", which is fully supported by Google.
2. **Breadcrumbs:**
   * Verify that all breadcrumb items are detected with 0 errors.
3. **Sitelinks Searchbox:**
   * Verify detection of the homepage `WebSite` schema with `SearchAction`.

---

## 5. Index Coverage & Crawl Error Triage

Navigate to **Indexing** $\rightarrow$ **Pages**:
1. **Valid Pages:** Confirm indexed URLs are increasing over time.
2. **Excluded Pages:**
   * *Alternate page with proper canonical tag:* Expected for `thenijobs.com` and `thenijobs.in` (points to `www.thenijobs.com`).
   * *Excluded by 'noindex' tag:* Expected for expired jobs, `/login`, `/register`, and `/admin/*`.
   * *Not found (404):* Expected for deleted jobs or non-existent URLs. Ensure soft 404 count remains zero.
3. **Crawl Errors (5xx):** Must be 0. If any 500 errors appear, check Vercel deployment logs immediately.

---

## 6. Core Web Vitals & Mobile Usability Monitoring

Under **Experience** in GSC:
1. **Core Web Vitals:**
   * Check **Mobile** and **Desktop** status tabs.
   * Ensure LCP is under 2.5s, INP under 200ms, and CLS under 0.1 for 75% of page visits.
2. **Page Experience:**
   * Ensure HTTPS status is active and verified across all pages.
   * Verify mobile usability shows zero viewport or click target warnings.

---

## 7. Ongoing Maintenance Cadence

* **Weekly:** Check **Pages** report for unexpected exclusions or spikes in 404s.
* **Monthly:** Review **Search Results (Performance)** for top queries, impressions, CTR, and average position across Theni taluks.
* **Post-Deployment:** Inspect canonical status whenever adding new dynamic route families or restructuring landing pages.
