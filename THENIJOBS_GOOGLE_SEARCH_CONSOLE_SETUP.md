# THENIJOBS — Google Search Console & Indexing API Setup Guide

**Author:** THENIJOBS Core Engineering Team  
**Canonical Domain:** `https://www.thenijobs.com`  
**Platform:** Next.js 16 (Turbopack) • Google Search Console • Google Cloud Platform  
**Target Search Verticals:** Google Search, Google for Jobs, Google Local Business  

---

## 1. Property Setup in Google Search Console

To ensure complete coverage across all subdomains and protocols, set up two properties in Google Search Console:

### 1.1 Property A: Domain Property (Recommended)
1. Navigate to [Google Search Console](https://search.google.com/search-console).
2. Click **Add Property** and select **Domain**.
3. Enter: `thenijobs.com` (without `https://` or `www`).
4. Copy the generated DNS TXT record (e.g., `google-site-verification=abcdef123456...`).
5. Open your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.) and add:
   - **Type:** `TXT`
   - **Name:** `@` (or `thenijobs.com`)
   - **Content:** The Google verification string
   - **TTL:** Auto or 3600
6. Return to Google Search Console and click **Verify**.

### 1.2 Property B: URL Prefix Property (Required for Indexing API Delegation)
1. Click **Add Property** and select **URL Prefix**.
2. Enter the primary canonical origin:
   ```
   https://www.thenijobs.com
   ```
3. Complete verification via DNS or HTML Meta Tag (already embedded in Next.js metadata).

---

## 2. Dynamic XML Sitemap Submission

1. In the Google Search Console sidebar, click **Sitemaps** under *Indexing*.
2. In the **Add a new sitemap** input field, enter:
   ```
   sitemap.xml
   ```
   (Full URL: `https://www.thenijobs.com/sitemap.xml`)
3. Click **Submit**.
4. GSC will query the endpoint and report:
   - **Status:** *Success*
   - **Type:** *Sitemap*
   - **Discovered Pages:** Typically 150–350+ URLs (including active jobs, verified companies, marketplace items, taluk matrices).
5. The sitemap uses 1-hour ISR revalidation (`revalidate = 3600`), so new jobs and companies appear automatically without manual re-submission.

---

## 3. Google Indexing API Configuration (Instant Job Indexing)

The Google Indexing API allows THENIJOBS to notify Google immediately when a job posting is created, approved, updated, or expired.

### Step 3.1: Enable the Indexing API in Google Cloud Console
1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Select the THENIJOBS project (`thenijobs-9f01d`).
3. Navigate to **APIs & Services → Library**.
4. Search for **Web Search Indexing API**.
5. Click **Enable**.

### Step 3.2: Create / Verify Service Account
1. In Google Cloud Console, navigate to **IAM & Admin → Service Accounts**.
2. Identify or create the service account:
   ```
   firebase-adminsdk-xxxxx@thenijobs-9f01d.iam.gserviceaccount.com
   ```
3. Generate a private key in JSON format (this matches `serviceAccountKey.json`).

### Step 3.3: Delegate Ownership in Google Search Console
> [!IMPORTANT]
> The Google Indexing API requires the service account email to be registered as an **Owner** of the property in Google Search Console. If this step is omitted, API calls will fail with `403 Forbidden: Permission denied`.

1. Go to [Google Search Console](https://search.google.com/search-console).
2. Select the `https://www.thenijobs.com` property.
3. In the left menu, click **Settings** (gear icon) → **Users and permissions**.
4. Click **Add User** (blue button in top right).
5. Enter the service account email:
   ```
   firebase-adminsdk-xxxxx@thenijobs-9f01d.iam.gserviceaccount.com
   ```
6. Set the Permission level to: **Owner**.
7. Click **Add**.

### Step 3.4: Server Environment Configuration
On your hosting provider (Vercel):
- Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable contains the JSON key string, or ensure `serviceAccountKey.json` is deployed on the server.
- The THENIJOBS backend (`src/lib/seo/googleIndexingApi.ts` and `/api/seo/index-job`) handles JWT generation and token exchange automatically.

---

## 4. Rich Results & Schema Validation Protocol

Before launching new templates or categories, validate structured data:

1. Open [Google Rich Results Test](https://search.google.com/test/rich-results).
2. Enter a live job URL, e.g.:
   `https://www.thenijobs.com/jobs/medical-records-reviewer-ags-it-solutions-theni`
3. Verify that the test reports:
   - **Job postings:** Valid (Green checkmark)
   - **Breadcrumbs:** Valid
4. Inspect the extracted fields:
   - `Title`, `hiringOrganization`, `jobLocation`, `datePosted`, `validThrough`, `baseSalary`.

---

## 5. Ongoing Monitoring & Maintenance Checklist

| Task | Frequency | GSC Section | Target Metric |
| :--- | :--- | :--- | :--- |
| **Indexing Coverage** | Weekly | *Pages* | 0 unhandled 5xx / 4xx errors; all valid jobs indexed. |
| **Google for Jobs Performance** | Bi-weekly | *Performance → Search appearance → Job details* | Steady increase in impressions and clicks. |
| **Sitemap Health** | Monthly | *Sitemaps* | Status: *Success*, last read within 24–48 hours. |
| **Core Web Vitals** | Monthly | *Core Web Vitals* | 100% "Good" URLs (LCP < 2.5s, CLS < 0.1, INP < 200ms). |
| **Security & Manual Actions** | Quarterly | *Security & Manual Actions* | "No issues detected". |
