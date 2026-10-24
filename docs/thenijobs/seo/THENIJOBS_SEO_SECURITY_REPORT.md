# THENIJOBS – SEO Data Protection & Firebase Security Report

**Project:** THENIJOBS  
**Backend:** Google Cloud Firebase / Cloud Firestore / Firebase Auth  
**Date:** October 24, 2026  
**Document:** SEO Data Protection & Security Isolation Report  

---

## 1. Security Architecture & Threat Model

Search engine crawlers systematically traverse and scrape public metadata, sitemaps, and JSON-LD payloads. A critical security requirement for THENIJOBS is ensuring that **public SEO optimization never leaks private or sensitive user/business data**.

```
                           FIRESTORE DATABASE
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
        [PUBLIC DATASET]                    [PRIVATE DATASET]
   • Approved Business Name             • Personal Mobile Numbers (unlisted)
   • Public Job Description             • User Passwords / Hashes
   • Verified Business District         • Private KYC Documents / Bank Details
   • Published Products & Services      • Internal Admin Review Notes
   • Public Contact Email / WhatsApp    • Job Seeker Resumes & Profiles
                 │                                   │
                 ▼                                   ▼
      SEO METADATA & SCHEMAS               RESTRICTED SECURITY RULES
    Rendered to Googlebot & SERPs        Protected by firestore.rules
```

---

## 2. Public vs. Private Data Isolation

| Data Attribute | Public SEO Status | Handling Mechanism | Security Invariant |
| :--- | :--- | :--- | :--- |
| **Company Owner Mobile** | **STRICTLY PRIVATE** | Stripped from server-rendered metadata unless explicitly configured as the public business WhatsApp hotline. | Never appears in OpenGraph or JSON-LD schema. |
| **Employer KYC / Tax ID** | **STRICTLY PRIVATE** | Excluded from server data queries (`firestoreServer.ts`). | Admin-only access via Firebase Security Rules. |
| **Internal Review Notes** | **STRICTLY PRIVATE** | Filtered out during schema serialization in `generateCompanySchema()`. | Verified via automated test `tests/seo.test.mjs`. |
| **Seeker Identity & Applications** | **STRICTLY PRIVATE** | Shielded under `/seeker/` and `/admin/` paths. | Disallowed in `robots.txt` and protected by Firebase Auth session checks. |
| **Verified Business Name & Slug** | **PUBLIC** | Exposed in title, meta description, and `LocalBusiness` JSON-LD. | Enables public discovery on Google Search. |
| **Job Requirements & Salary** | **PUBLIC (When provided)** | Exposed in `JobPosting` schema only when provided; salary omitted when negotiable. | No fabricated figures or private payroll details. |

---

## 3. Firestore Rules & Permission Guardrails (`firestore.rules`)

1. **Unapproved Company Shield:**
   * Unverified companies cannot be read by anonymous users in bulk.
   * Server utilities (`getVerifiedCompanySlugsForSitemap()`) query with explicit `verified == true` filters, preventing draft or pending companies from leaking into public sitemaps.
2. **Seeker Portfolio Privacy:**
   * Job seeker portfolios only become sitemap-eligible if the seeker explicitly enables public indexing in their profile settings. Private portfolios return `robots: { index: false, follow: false }`.
3. **Write Protection:**
   * Public web clients cannot alter the `isVerified`, `status`, or `slug` fields of any company or job doc. Status mutations are restricted to authenticated admin accounts.

---

## 4. Google Indexing API Security Guardrails

* **Zero Client-Side Exposure:** Service account private keys (`FIREBASE_SERVICE_ACCOUNT_JSON`) reside solely in secure environment variables accessible only by Next.js server runtime (`Node.js`).
* **Protected Webhook Endpoints:**
  * `/api/seo/index-job` only processes notifications initiated by authorized server cron jobs or authenticated admin triggers.
  * Payloads are strictly validated; invalid URLs or attempts to notify arbitrary domains are rejected with `HTTP 400 Bad Request`.
* **Zero Trust Policy:** Even if a malicious user calls `/api/seo/index-job`, the underlying service verifies that the job exists in Firestore and matches the allowed domain regex before contacting Google.

---

## 5. Security Invariant Tests Passed

Automated tests in `tests/seo.test.mjs` and `tests/api-security.test.mjs` verify:
- [x] Internal admin notes and verification flags are omitted from `LocalBusiness` schemas.
- [x] Expired or unpublished jobs are suppressed from Google indexing webhooks.
- [x] Authenticated admin routes (`/admin/*`) are blocked in `robots.txt`.
- [x] Client bundles contain zero service account keys, Firebase Admin credentials, or Razorpay secret keys.
