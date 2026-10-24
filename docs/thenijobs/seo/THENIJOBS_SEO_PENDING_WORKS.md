# THENIJOBS – Remaining SEO Action Items & Production Roadmap

**Project:** THENIJOBS  
**Production Host:** `https://www.thenijobs.com`  
**Date:** October 24, 2026  
**Document:** Remaining SEO Action Items & Production Roadmap  

---

## 1. Prioritized Action Matrix

| Priority | Task Description | Owner | Category | Reason / Impact |
| :--- | :--- | :--- | :--- | :--- |
| **P0 (Immediate)** | **Deploy Code Changes to Vercel** | DevOps / Lead Eng | Infrastructure | Pushes hardened middleware, canonical SEO updates, and redirect loop fix to live edge. |
| **P0 (Immediate)** | **Delete Stale Hostinger DNS Records for `thenijobs.in`** | DNS Admin / Owner | DNS / SSL | Deletes stale `2.57.91.91` and `2a02:4780:84::32` records, unblocking Vercel Let's Encrypt SSL certificate provisioning. |
| **P1 (Launch)** | **Verify Domain Ownership in Google Search Console** | SEO Lead / Owner | Indexing | Add DNS TXT verification token in Hostinger DNS for `thenijobs.com` to unlock Search Console telemetry. |
| **P1 (Launch)** | **Submit `/sitemap.xml` to Google Search Console** | SEO Lead | Indexing | Informs Googlebot of all 322+ dynamic URLs across jobs, companies, marketplace items, and taluks. |
| **P1 (Launch)** | **Configure Google Indexing API Service Account Key** | DevOps / Backend | Indexing API | Add `FIREBASE_SERVICE_ACCOUNT_JSON` to Vercel production environment variables to enable automatic JobPosting indexing notifications. |
| **P2 (Post-Launch)**| **Onboard Employers with High-Resolution Logos** | Business Ops | Structured Data | Square (1:1) employer logos enhance rich card visibility in Google for Jobs cards. |
| **P2 (Post-Launch)**| **Acquire Local Business Citations in Tamil Nadu** | Marketing / SEO | Local SEO | Directory listings in Justdial, IndiaMART, Sulekha, and local chambers reinforce entity authority. |
| **P3 (Ongoing)** | **Monitor Real User Core Web Vitals in Search Console** | Frontend / Performance | CWV | Audit field metrics (LCP, INP, CLS) once sufficient organic mobile traffic has accumulated. |

---

## 2. Detailed Task Breakdown

### A. Hostinger DNS Cleanup for `thenijobs.in` (Priority: P0)
* **Problem:** In Hostinger DNS zone for `thenijobs.in`, two stale records exist alongside Vercel's IP:
  * A record `@` $\rightarrow$ `2.57.91.91`
  * AAAA record `@` $\rightarrow$ `2a02:4780:84::32`
* **Action Required:**
  1. Open Hostinger hPanel $\rightarrow$ DNS Zone Editor for `thenijobs.in`.
  2. Locate the A record with content `2.57.91.91` and click Delete.
  3. Locate the AAAA record with content `2a02:4780:84::32` and click Delete.
  4. Ensure only Vercel Anycast A record (`216.198.79.1`) remains for `@`.
  5. In Vercel Project Settings $\rightarrow$ Domains, click "Refresh". Vercel will issue the SSL certificate and transition status to "Valid Configuration".

### B. Production Git Deployment (Priority: P0)
* **Action Required:** Commit all modified files and push to GitHub repository branch triggering Vercel build:
  ```bash
  git add -A
  git commit -m "feat(seo): complete technical SEO, canonical domain enforcement, and documentation suite"
  git push origin main
  ```

### C. Google Indexing API Production Environment Activation (Priority: P1)
* **Action Required:**
  1. In Google Cloud Console, ensure the Indexing API is enabled for your project.
  2. Ensure the service account email is added as an **Owner** or **Full Permission user** on the Search Console property `thenijobs.com`.
  3. Ensure the environment variable `FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_SERVICE_ACCOUNT_JSON` is populated in Vercel project settings.

### D. Employer Education on Salary & Logo Best Practices (Priority: P2)
* Google for Jobs awards highest click-through visibility to job cards with transparent salary bands and crisp company branding.
* Employers should be guided during the post-job flow to input realistic salary ranges (`salaryMin` / `salaryMax`) rather than leaving it as "Negotiable" whenever possible.
