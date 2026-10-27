# THENIJOBS — Pending Works, Applied Fixes & Architectural Health Ledger

> **Platform:** THENIJOBS Hyperlocal Portal & Mobile App  
> **Environment:** Next.js 16.3.4 + Flutter 3.x + Firebase (`thenijobs-9f01d`)  
> **Date:** October 2026 Production Release  
> **Status:** All Code Deficiencies Resolved; Zero Code Blockers  

---

## 1. Executive Summary

This document catalogs all defects identified during the comprehensive audit, their root causes, the engineering fixes applied, test verification outcomes, and the checklist of final operational prerequisites for production launch.

---

## 2. Ledger of Completed Engineering Fixes

### 2.1 Razorpay Payment Workflow & "Payment Incomplete or Cancelled" Resolution

* **Defect:**  
  When completing a payment via Razorpay, users frequently encountered:
  > *"Payment Incomplete or Cancelled. The payment could not be recorded. If money was debited, quote your order id to support and it will be reconciled manually — do not pay again."*

* **Root Cause Analysis:**  
  1. **Firestore `5 NOT_FOUND` Exception:** In `src/lib/firebase/paymentAdminService.ts`, payment recording invoked `paymentsRef.doc(paymentId).update(...)`. If the client-side `/api/payment/verify` route executed before the order document was pre-seeded or if the webhook ran asynchronously, Firestore threw an unhandled `5 NOT_FOUND` error, causing the entire API call to reject with a 500 status.
  2. **Plan Price Validation Rigidity:** The backend checked amounts strictly against a single tier constant, rejecting variations between quarterly seeker plans and multi-branch employer plans.
  3. **Local Clock Skew (`16 UNAUTHENTICATED: ACCESS_TOKEN_EXPIRED`):** In environments where system clocks deviate from Google's server clock, the Firebase Admin SDK minted OAuth tokens with invalid `iat`/`exp` claims.
  4. **Missing Self-Service Reconciliation:** If network dropped after money was captured at Razorpay, users had no mechanism to self-heal their subscription without contacting support.

* **Fixes Implemented:**
  - **Atomic Upsert:** Switched all Firestore writes in `paymentAdminService.ts` from strict `.update(...)` to `.set(..., { merge: true })`.
  - **Dynamic Clock Skew Compensation:** Added `getGoogleClockOffsetMs()` to dynamically measure the offset against Google's `Date` response header and mint valid tokens. Added REST fallback execution (`executeRestFirestoreGet`, `executeRestFirestorePatch`).
  - **Unified Price Dictionary:** Created `ALL_VALID_PLAN_PRICES` covering Basic (₹999), Standard (₹1,800), Premium (₹3,500), Enterprise (₹5,000), Seeker Pro (₹199), and Seeker Annual (₹50).
  - **Dedicated Webhook Handler:** Built `src/app/api/payment/webhook/route.ts` handling `payment.captured`, `order.paid`, and `payment.failed` with timing-safe signature checks.
  - **Self-Service Reconciliation Endpoint:** Created `src/app/api/payment/reconcile/route.ts` enabling client modals to poll for background payment capture and recover immediately.
  - **Automatic PDF Receipt Download:** Integrated `autoDownloadedRef` in `PaymentCheckoutModal.tsx` so high-resolution vector PDF receipts download automatically on confirmation.
  - **Verification:** Verified via `scripts/test-payment-system.ts` -> **19/19 tests passed**.

---

### 2.2 Job Lifecycle, Expiry Protocols & SLA Monitoring

* **Implementation & Hardening:**
  - Automated nightly job expiration cron (`/api/cron/expire-jobs`) running at `01:00 UTC` with `CRON_SECRET` protection.
  - Daily trial and subscription expiration cron (`/api/cron/expire-trials`) running at `00:00 UTC`.
  - Admin 30-Day Renewal button on `/admin/jobs` allowing instant 1-click reactivation of expired listings.
  - 7-Day Overdue Application SLA dashboard on `/admin/jobs` with 1-tap WhatsApp reminders to recruiters.
  - Public role-based views on `/jobs/[id]` ensuring expired jobs show friendly notices to candidates while offering renewal flows to employers.
  - **Verification:** Verified via `tests/business-logic.test.mjs` -> **Pass**.

---

### 2.3 Dynamic Slogan Rotation & Billing Slogans

* **Implementation & Hardening:**
  - Sequential atomic rotation through 100 bilingual business growth slogans (`src/lib/billing/sloganService.ts`).
  - Deterministic invoice slogan assignment ensuring every receipt has a unique inspirational message.
  - Admin management interface at `/admin/slogans` and API endpoints at `/api/admin/slogans/*` with Admin Bearer token authorization.
  - **Verification:** Verified via `tests/payment-workflow.test.mjs` -> **Pass**.

---

### 2.4 Flutter Mobile Application Consistency & Clean Architecture

* **Implementation & Verification:**
  - Complete screen inventory across all 15 core screens (`SplashScreen`, `MainNavigation`, `JobsFeedScreen`, `JobDetailScreen`, `ApplyJobModal`, `MarketplaceScreen`, `CompanyDetailScreen`, `ManageJobsScreen`, `PostJobScreen`, `MyApplicationsScreen`, `NotificationsScreen`, `ProfileScreen`, `EditProfileScreen`, `LoginScreen`, `RegisterScreen`).
  - Shared Firebase backend (`thenijobs-9f01d`) ensuring full data consistency with the Next.js web application.
  - Material 3 theme and dynamic English ↔ Tamil runtime switcher.
  - **Verification:** Ran `flutter test` (15/15 passed) and `dart analyze` (0 issues).

---

## 3. Pending Operational Prerequisites (External DevOps Checklist)

The application code is complete and production-ready. The following external configuration steps must be verified in the production environment:

| Category | Prerequisite Item | Responsible System | Action Required | Status |
|---|---|---|---|---|
| **Payments** | Razorpay Live Webhook Configuration | Razorpay Dashboard | Add `https://www.thenijobs.com/api/payment/webhook` with secret `RAZORPAY_WEBHOOK_SECRET` and events: `payment.captured`, `order.paid`, `payment.failed`. | Ready to Configure |
| **Payments** | Razorpay Live API Keys | Vercel Environment | Ensure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` contain production live keys (starting with `rzp_live_`). | Ready for Live Keys |
| **Security** | Cron Secret Configuration | Vercel Environment | Confirm `CRON_SECRET` matches between `vercel.json` and production environment variables. | Configured & Protected |
| **Database** | Firestore Security Rules Deployment | Firebase Console / CLI | Deploy `firestore.rules` (763 lines) and `storage.rules` (119 lines) to `thenijobs-9f01d`. | Files Prepared |
| **SMS/Voice** | 2Factor.in Live Credit Balance | 2Factor.in Account | Ensure sufficient balance for SMS OTP and voice call OTP delivery. | API Route Ready |
| **AI Gateways** | Production AI API Keys | Vercel Environment | Confirm `GEMINI_API_KEY`, `GROQ_API_KEY`, and `OPENAI_API_KEY` are provisioned. | Gateway Multi-Tier Ready |
| **DNS / Domain** | Domain Routing | Domain Registrar | Verify CNAME and A records point `www.thenijobs.com` and `www.thenijobs.in` to Vercel. | Active |

---

## 4. Architectural Risk Analysis & Mitigation

1. **Risk:** High concurrency payment webhook duplicate delivery.  
   **Mitigation:** `paymentAdminService.ts` checks existing payment status; if already recorded, it skips duplicate writes and preserves the original receipt number.
2. **Risk:** Unauthorized access to candidate resumes.  
   **Mitigation:** `storage.rules` and `firestore.rules` enforce that only the candidate who uploaded the resume and recruiters with active subscriptions can access the file.
3. **Risk:** Cron jobs triggered by malicious external crawlers.  
   **Mitigation:** Routes verify `Authorization: Bearer <CRON_SECRET>` using constant-time string comparison (`crypto.timingSafeEqual`) and validate the `x-vercel-cron` header.
