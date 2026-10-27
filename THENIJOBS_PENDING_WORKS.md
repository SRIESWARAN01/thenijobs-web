# THENIJOBS — Pending Works & External Configuration Guide

**Date:** 2026-10-23  
**Status:** Code Complete & Production-Ready  
**Current Milestone:** All code-level implementations, audits, fixes, builds, and automated tests are complete.

---

## 1. Work Completed at Code Level

| Work Item | Status | Verification Detail |
| :--- | :---: | :--- |
| **Dual-Role Registration** | ✅ Completed | Strictly Job Seeker & Business Owner. Mandatory Name, Mobile (+91), Email, Password, Confirm Password. |
| **Mobile & Email Login** | ✅ Completed | Login page accepts either 10-digit Indian Mobile or standard email. |
| **15-Day Free Trial Architecture** | ✅ Completed | Starts **only** after Admin approval. Client cannot self-activate. Server-side timestamps. Auto-expiry with zero data loss. |
| **Business Owner Navigation State Machine** | ✅ Completed | Active trial business owners access `/employer/dashboard` and Standard tier features. No redirect loops. |
| **Admin Portal Governance** | ✅ Completed | Business owner approve/reject actions with audit logs and notification dispatches. Live Firestore queries only (no mock data). |
| **Marketplace & Services Unification** | ✅ Completed | `/marketplace` and `/marketplace?type=services` use unified engine with deep filtering and WhatsApp orders. |
| **Technical SEO & Sitemap** | ✅ Completed | Dynamic `/sitemap.xml`, Schema.org JobPosting, canonical redirects to `https://www.thenijobs.com`. |
| **Production Build & Tests** | ✅ Completed | `npm run build` generated 321 routes. `npm test` passed 99/99 assertions across 21 suites. |

---

## 2. External Actions Requiring Credentials / Third-Party Dashboards

The following items cannot be performed purely through codebase changes and require administrator action in external service consoles:

### 2.1 Razorpay Live Production Mode
- **Current State:** Tested and functional in test/sandbox mode with cryptographic HMAC-SHA256 signature verification.
- **Required External Action:**
  1. Log into Razorpay Dashboard (`https://dashboard.razorpay.com`).
  2. Activate Live Mode and generate Live Key ID (`rzp_live_...`) and Live Key Secret.
  3. Configure Webhook URL to `https://www.thenijobs.com/api/payment/webhook`.
  4. Add the live credentials to Vercel Environment Variables.

### 2.2 Google Search Console & Indexing API Authorization
- **Current State:** Dynamic `/sitemap.xml` and `/robots.txt` are live. The Google Indexing API client is restricted to JobPosting URLs.
- **Required External Action:**
  1. In Google Search Console, verify domain ownership of `https://www.thenijobs.com` via DNS TXT record.
  2. Submit `https://www.thenijobs.com/sitemap.xml`.
  3. In Google Cloud Console, grant the service account (`firebase-adminsdk-...`) "Owner" permissions in Google Search Console to authorize the Indexing API.

### 2.3 Production Vercel Deployment Authorization
- **Current State:** Code is tested, committed, and ready for deployment.
- **Required External Action:**
  - Trigger deployment to `https://www.thenijobs.com` via Git push to the production branch or Vercel CLI command:
    ```bash
    vercel --prod
    ```

---

## 3. Maintenance & Periodic Operations

1. **Daily Job Expiry:** Scheduled via Vercel Cron at `0 0 * * *` hitting `/api/cron/expire-jobs`.
2. **Trial Expiry Reconciler:** Scheduled via Vercel Cron at `0 0 * * *` hitting `/api/cron/expire-trials`.
3. **Database Backups:** Ensure GCP Cloud Firestore automated backups are scheduled weekly in the Firebase/GCP Console.
