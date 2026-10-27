# THENIJOBS — Google Search Console & Indexing API Production Setup Guide

This guide details the exact manual steps and verification workflows required to configure Google Search Console (GSC), submit the dynamic XML sitemap, link the Google Indexing API service account, and monitor crawl health for **THENIJOBS**.

---

## 1. Google Search Console Property Setup

### 1.1 Recommended Property Types

You should add two properties in Google Search Console:

1. **Domain Property: `thenijobs.com`** *(Recommended Primary)*
   - Covers all protocols (`https://`, `http://`) and subdomains (`thenijobs.com`, `www.thenijobs.com`).
   - **Verification Method:** DNS TXT Record.
   - **Action:** Add the Google TXT verification string (e.g., `google-site-verification=...`) to your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.) for `thenijobs.com`.

2. **URL-Prefix Property: `https://thenijobs.in/`** *(Alias Monitoring)*
   - Add this property to verify that requests to `thenijobs.in` are properly recognized as 301 redirects to `https://thenijobs.com`.
   - **Verification Method:** DNS TXT record or HTML verification tag.

---

## 2. Dynamic XML Sitemap Submission

Once the `thenijobs.com` property is verified:

1. Open **Google Search Console** → Select `thenijobs.com`.
2. In the left navigation menu, click **Sitemaps** under *Indexing*.
3. In the **Add a new sitemap** input field, enter:
   ```text
   sitemap.xml
   ```
4. Click **Submit**.
5. **Expected Status:** `Success`.
6. **Expected Discovered Pages:**
   - Static hubs (`/`, `/jobs`, `/marketplace`, `/businesses`, `/daily-jobs`, `/pricing`, `/about`, `/contact`, `/privacy`, `/terms`)
   - 9 Location landing pages (`/jobs-in-theni`, `/jobs-in-cumbum`, etc.)
   - 135 Location × Category landing pages (`/jobs-in-theni/sales`, etc.)
   - 18 Business category hubs (`/businesses/retail`, `/businesses/healthcare`, etc.)
   - Real active job detail pages (`/jobs/[slug]`)
   - Verified company profiles (`/company/[slug]`) and branded landing pages (`/[companySlug]`)
   - Published public seeker portfolios (`/portfolio/seeker/[id]`)
   - Active marketplace products and services (`/marketplace/[type]/[companySlug]/[itemId]`)

> [!NOTE]
> The dynamic sitemap is automatically revalidated every hour (`revalidate = 3600`) via Next.js ISR. As new jobs and companies are published, they automatically appear in `https://thenijobs.com/sitemap.xml` without requiring a redeploy or code change.

---

## 3. Google Indexing API Setup (For Real-Time Job Posting Discovery)

Google's Indexing API allows THENIJOBS to notify Google immediately when a job posting is created, updated, or expires.

### Step 1: Enable the Indexing API in Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Firebase project: `thenijobs-9f01d`.
3. In the search bar, search for **Indexing API** and click **Enable**.

### Step 2: Identify Your Service Account Email
1. Go to **IAM & Admin** → **Service Accounts**.
2. Locate your Firebase Admin service account (e.g., `firebase-adminsdk-xxxxx@thenijobs-9f01d.iam.gserviceaccount.com`).
3. Copy this email address.

### Step 3: Grant the Service Account "Owner" Permission in Search Console
> [!IMPORTANT]
> The Indexing API will return HTTP 403 `Permission denied` unless the service account is explicitly listed as a verified Owner in Search Console.

1. Open [Google Search Console](https://search.google.com/search-console).
2. Select the `thenijobs.com` property.
3. Click **Settings** (bottom left) → **Users and permissions**.
4. Click **Add User** (top right).
5. Paste the Service Account email address.
6. Set the Permission level to **Owner**.
7. Click **Add**.

### Step 4: Verification
- The Next.js backend is now ready. Nightly job expirations (`/api/cron/expire-jobs`) and job updates will automatically transmit authenticated RS256 JWT notifications to Google without human intervention.

---

## 4. Live URL Inspection & Rich Results Validation

Before requesting indexing for new pages, perform live tests using Google's inspection tools:

### 4.1 URL Inspection Tool (Search Console)
1. In Search Console, paste any public URL into the top search bar (e.g. `https://thenijobs.com/jobs/medical-records-reviewer-theni`).
2. Click **Test Live URL**.
3. Verify:
   - **Page availability:** "URL is available to Google".
   - **HTTP Response:** `200 OK`.
   - **Rendered HTML:** Verify that the job title, company name, salary range, and description are present in the HTML snippet (confirming SSR execution).
   - **Crawl allowed:** `Yes`.
   - **User-declared canonical:** `https://thenijobs.com/jobs/...`.
   - **Google-selected canonical:** Matches user-declared canonical.
4. Click **Request Indexing**.

### 4.2 Rich Results Test Tool
Test individual job postings at:
[https://search.google.com/test/rich-results](https://search.google.com/test/rich-results)
1. Enter your active job URL.
2. Select **Googlebot smartphone**.
3. Verify that the **JobPosting** structured data item is detected with 0 errors.

---

## 5. Google Search Console Status Codes & Resolutions

| Status in Search Console | Root Cause Fixed in Code | Verified Status |
| :--- | :--- | :--- |
| **Soft 404** | Previously, deleted/missing jobs returned HTTP 200 with an empty container. | **Fixed:** All dynamic routes call `notFound()`, issuing authentic HTTP 404 with `noindex` headers. |
| **Duplicate without user-selected canonical** | Missing canonical headers on core hubs and duplicate `/companies/[slug]` routes. | **Fixed:** Canonical tags output on every route; `/companies/[slug]` issued permanent 308 redirect; `thenijobs.in` issued 301 redirect. |
| **Blocked by robots.txt** | Previous robots rule `/jobs/*?*` blocked shared URLs with tracking parameters. | **Fixed:** Removed overly restrictive regex; added explicit allow for `/_next/static/` rendering resources. |
| **Page with redirect** | Inbound requests to `thenijobs.in` or `www.thenijobs.com`. | **Expected Behavior:** Google reports this correctly under redirected URLs, transferring link equity to `https://thenijobs.com`. |

---

## 6. Ongoing Maintenance Workflow

1. **Weekly Search Console Review:**
   - Check the **Pages** indexing report for any unexpected exclusions.
   - Review **Enhancements** → **Job Postings** to verify zero structured data syntax warnings.
2. **Automated Cron Jobs:**
   - Ensure Vercel Cron or GitHub Actions triggers `/api/cron/expire-jobs` daily at 01:00 UTC.
   - The cron handles expired job database updates and sends `URL_DELETED` signals to Google Indexing API.
3. **Adding New Locations or Business Categories:**
   - Update `LOCATIONS_DATA` and `CATEGORIES_LIST` in `src/components/seo/locationData.ts`.
   - The sitemap generator (`src/app/sitemap.ts`) will automatically register the new routes without manual XML edits.
