# THENIJOBS — 15-Day Free Trial Expiry, Mandatory Paid Subscription & Admin Portal Integration Workflow

**Author:** THENIJOBS Core Engineering Team  
**Architecture:** Next.js 16 (Turbopack) • Firebase Firestore • Firebase Admin SDK • Razorpay HMAC-SHA256  
**Status:** Verified in Production (`tests/trial-expiry-and-admin-portal.test.mjs` 100% Pass)  
**Date:** October 2026  

---

## 1. Executive Summary & Core Invariants

The THENIJOBS platform implements a secure, business-friendly subscription and trial lifecycle designed for Theni District entrepreneurs and local enterprises:
1. **15-Day Free Trial starts strictly upon Admin Approval**: When a business owner registers and selects the 15-Day Free Trial, their trial counter does NOT start at registration time. It starts when THENIJOBS Admin approves the account (`trialStartedAt = now`, `trialEndsAt = now + 15 days`).
2. **Zero-Data-Loss Invariant**: When a 15-day free trial expires (`trialEndsAt < now`), all company profile data, uploaded logos, founder information, published jobs, candidate job applications, and inbound leads remain **100% securely preserved** in Firestore. No records are deleted, truncated, or dropped.
3. **Graceful Gating UI**: When an expired business owner logs in, they are presented with an elegant, non-destructive modal gate:
   - **Title:** *"Your 15-Day Free Trial Has Expired"*
   - **Subtext:** *"Your free trial has ended. Choose a subscription plan to continue using THENIJOBS business features."*
   - **Direct Actions:**
     - **"Choose a Plan"** (`/pricing` or instant in-app checkout)
     - **"View Payment History"** (`/employer/billing`)
     - **"Logout"** (Clean sign-out returning to `/login`)
     - **WhatsApp Support Link** (+91 93605 19460)
4. **Immediate Paid Reactivation Without Redundant Admin Approval**: An already-approved business owner whose trial expires and who completes payment for an annual plan (Basic ₹999, Standard ₹1,800, Premium ₹3,500, or Enterprise ₹5,000) is **immediately activated** (`subscriptionStatus: 'active'`, `accountStatus: 'active'`). They do not undergo admin review again.
5. **Cross-Company Job Applications Hub (`/admin/applications`)**: A dedicated administration hub for monitoring, managing, and exporting all candidate job applications submitted across every employer in Theni.
6. **15-Metric Executive Admin Dashboard**: Live, real-time counters derived directly from Firestore collections without hardcoding.

---

## 2. 15-Day Free Trial Expiry Architecture

### 2.1 State Evaluation Engine
In `src/lib/subscriptionService.ts` and `src/hooks/useSubscriptionStatus.ts`, trial expiration is evaluated dynamically:

```typescript
// Trial Expiration Logic
const now = Date.now();
const trialEndsAtMs = company?.trialEndsAt?.seconds 
  ? company.trialEndsAt.seconds * 1000 
  : (user?.trialEndsAt?.seconds ? user.trialEndsAt.seconds * 1000 : 0);

const isTrialActive = Boolean(
  (company?.isTrialActive || user?.trialRequested || company?.subscriptionPlan === 'trial') &&
  trialEndsAtMs > now &&
  !isPaidActive
);

const isTrialExpired = Boolean(
  (company?.hasUsedFreeTrial || user?.hasUsedFreeTrial || user?.trialRequested || company?.subscriptionPlan === 'trial') &&
  trialEndsAtMs > 0 &&
  trialEndsAtMs <= now &&
  !isPaidActive
);
```

### 2.2 Security Rules Lockout
In `firestore.rules`, user documents are locked down with `userModerationUnchanged()`:
- `trialStartedAt`, `trialEndsAt`, `hasUsedFreeTrial`, `trialDurationDays`, and `approvalStatus` can only be altered by admin service accounts or admin cloud functions.
- Clients attempting to manipulate timestamps or set `hasUsedFreeTrial = false` will be rejected by Firestore rule evaluation.

---

## 3. Employer Gating & Data Preservation Workflow

```mermaid
flowchart TD
    Login[Business Owner Logs In] --> CheckApproval{Is Account Approved?}
    CheckApproval -- No --> ReviewScreen[Pending Admin Approval Screen]
    CheckApproval -- Yes --> CheckSub{Subscription State}
    
    CheckSub -- Active Paid Plan --> Dashboard[Business Owner Dashboard]
    CheckSub -- Active 15-Day Trial --> DashboardWithTrialCard[Dashboard + Countdown Card]
    CheckSub -- Trial Expired --> TrialExpiredGate[Your 15-Day Free Trial Has Expired Gate]
    
    TrialExpiredGate --> Option1[Choose a Plan /pricing]
    TrialExpiredGate --> Option2[View Payment History /employer/billing]
    TrialExpiredGate --> Option3[Logout /login]
    TrialExpiredGate --> Option4[Chat Admin on WhatsApp]
    
    Option1 --> RazorpayPayment[Pay via Razorpay]
    RazorpayPayment -- HMAC Verified --> ImmediateActive[Instant Dashboard Reactivation]
```

### Data Preservation Guarantee
| Collection | Behavior on Trial Expiry |
| :--- | :--- |
| `companies` | **Preserved**. Address, phone, GST, logos, templates, and social links remain untouched. |
| `jobs` | **Preserved**. Postings remain stored in Firestore. Re-activated when paid. |
| `applications` | **Preserved**. Resumes, applicant details, status, and notes remain accessible upon renewal. |
| `leads` | **Preserved**. Customer inquiries and leads remain intact. |
| `products` & `services` | **Preserved**. Marketplace listings remain linked to company record. |

---

## 4. Immediate Post-Trial Paid Activation

When a business owner with an expired trial selects and pays for an annual plan:
1. Razorpay initiates client modal.
2. Upon payment completion, client submits payment signature to `/api/payment/verify`.
3. `/api/payment/verify` cryptographically verifies signature via `verifyRazorpaySignature(orderId, paymentId, signature)`.
4. `recordVerifiedPayment()` in `src/lib/firebase/paymentAdminService.ts` executes:
   ```typescript
   let isAlreadyApproved = false;
   const uSnap = await db.collection('users').doc(targetUserId).get();
   if (uSnap.exists && uSnap.data()?.approvalStatus === 'approved') {
     isAlreadyApproved = true;
   }

   const userUpdatePayload = {
     subscriptionPlan: planSlug,
     selectedPlan: planSlug,
     paymentStatus: 'paid',
     paidAt: now,
     isPremium: true,
     updatedAt: now,
   };

   // Since user was ALREADY approved by admin during trial onboarding:
   if (isAlreadyApproved) {
     userUpdatePayload.subscriptionStatus = 'active';
     userUpdatePayload.accountStatus = 'active';
   }
   ```
5. Result: **Zero friction, instantaneous access to dashboard upon payment confirmation**.

---

## 5. Cross-Company Job Applications Hub (`/admin/applications`)

### 5.1 Route & Feature Matrix
Located at `/admin/applications` and accessible via the Admin sidebar navigation:

- **Metrics Counter Tiles:**
  - Total Applications
  - New Applied (`applied`)
  - Shortlisted (`shortlisted`)
  - Interview Scheduled (`interview_scheduled`)
  - Hired / Selected (`selected`)
  - Rejected (`rejected`)
- **Interactive Search & Filter:**
  - Instant live filter by candidate name, email, phone, job title, and company.
  - Dropdown filter by status.
- **Candidate Dossier Modal:**
  - Full candidate information, phone, email, applied role, and company name.
  - One-click resume download / view (`safeExternalUrl(app.resumeUrl)`).
  - Cover letter / candidate remarks.
  - Direct WhatsApp link pre-filled with job inquiry message.
  - Direct Phone Call trigger.
- **Immediate Moderation & Status Updates:**
  - Status dropdown on each table row updates Firestore in real-time with toast confirmation.
- **CSV Data Export:**
  - Export filtered applications to `thenijobs-candidate-applications-YYYY-MM-DD.csv`.

---

## 6. Executive Admin Dashboard (15 Operational Metrics)

Located at `/admin/dashboard`, the executive overview displays 15 real-time Firestore counts:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      THENIJOBS ADMIN DASHBOARD                         │
└────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 1. Business Owners      │  │ 2. Pending Approvals    │  │ 3. Approved Owners      │
│ Total Registered: (Live)│  │ Action Required: (Live) │  │ Verified Active: (Live) │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 4. Active 15-Day Trials │  │ 5. Expired Trials       │  │ 6. Paid Subscriptions   │
│ In Trial Window: (Live) │  │ Upgrade Needed: (Live)  │  │ Active Annual: (Live)   │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 7. Pending Payments     │  │ 8. Verified Payments    │  │ 9. Total Job Postings   │
│ Awaiting Pay: (Live)    │  │ Captured: (Live)        │  │ All Postings: (Live)    │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 10. Pending Job Reviews │  │ 11. Total Applications  │  │ 12. Inbound Leads       │
│ Moderation Queue: (Live)│  │ Candidates: (Live)      │  │ Client Leads: (Live)    │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 13. Pending Products    │  │ 14. Pending Services    │  │ 15. Total Revenue       │
│ Marketplace: (Live)     │  │ Service Catalog: (Live) │  │ ₹ Total Billed: (Live)  │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

---

## 7. Automated Testing & Verification Report

Automated tests in `tests/trial-expiry-and-admin-portal.test.mjs` verify:
1. `Trial Expiration Logic: Detects expired trial when trialEndsAt < now`: **PASS**
2. `Data Preservation Invariant: Expired trial never purges company, jobs, or leads data`: **PASS**
3. `Employer Layout contains required Trial Expired screen with specific copy & actions`: **PASS**
4. `Immediate Paid Activation: Approved business owner with expired trial activates instantly upon payment`: **PASS**
5. `Admin Navigation includes Job Applications route`: **PASS**
6. `Admin Applications Hub page exists with search, filter, status update, and CSV export`: **PASS**
7. `Admin Dashboard renders all 15 operational metrics across business, subscriptions, jobs, and services`: **PASS**
8. `Google Indexing API endpoint exists and strictly validates JobPosting URLs`: **PASS**
9. `Sitemap and Robots enforce public discovery while shielding admin & private areas`: **PASS**

**Overall Test Suite Status:**
- `npm test`: **119 passing tests** across 21 test suites.
- `npx tsc --noEmit`: **0 errors**.
- `npm run build`: **322 pages generated cleanly**.
