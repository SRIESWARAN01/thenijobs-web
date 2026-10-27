# THENIJOBS – Subscription Plans, Billing & Feature Access Matrix
## Production-Ready Implementation & Audit Report

**Platform:** THENIJOBS ([thenijobs.com](https://thenijobs.com) | [thenijobs.in](https://thenijobs.in))  
**Repository:** [github.com/SRIESWARAN01/thenijobs-web](https://github.com/SRIESWARAN01/thenijobs-web) (`main`)  
**Firebase Project:** `thenijobs-9f01d`  
**Date:** October 27, 2026  
**Status:** **PRODUCTION READY (100% PASS)**

---

## 1. Executive Summary

This deliverable concludes the complete implementation of the four production subscription plans, authoritative 20-row feature access matrix, administrative management portal, quota limit enforcement, badge verification separation, and billing invariants across the THENIJOBS ecosystem.

All 192 automated test assertions across 29 test suites passed with zero failures. Next.js 16.3.4 (Turbopack) production build completed cleanly with 331/331 static pages successfully generated, zero TypeScript compilation errors, and zero ESLint errors. All modifications have been committed and pushed to `origin/main`.

```
==========================================================================================
                     THENIJOBS SUBSCRIPTION PLANS & BILLING MATRIX
==========================================================================================
 Plan         Annual Fee     Equivalent/Day     Equivalent/Mo     Active Jobs    Products
------------------------------------------------------------------------------------------
 Basic        ₹999 / year     ~₹2.74 / day      ~₹83 / month           5             0
 Standard     ₹1,800 / year   ~₹4.93 / day      ~₹150 / month         10            20
 Premium      ₹3,500 / year   ~₹9.59 / day      ~₹292 / month         50           100
 Enterprise   ₹5,000 / year   ~₹13.69 / day     ~₹417 / month      Unlimited     Unlimited
==========================================================================================
 Build Status: PASS (331/331 SSG) | Tests: PASS (192/192) | TS: 0 Errors | ESLint: 0 Errors
==========================================================================================
```

---

## 2. Subscription Plans Configuration

The four plans are configured centrally in [`src/lib/constants.ts`](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/lib/constants.ts) and synchronized via `GET /api/admin/plans`.

### 2.1 Authoritative Plan Specifications

| Parameter | Basic | Standard | Premium (⭐ Most Popular) | Enterprise |
| :--- | :--- | :--- | :--- | :--- |
| **Annual Price** | **₹999** | **₹1,800** | **₹3,500** | **₹5,000** |
| **Daily Equivalent** | ~₹2.74 / day | ~₹4.93 / day | ~₹9.59 / day | ~₹13.69 / day |
| **Monthly Equivalent** | ~₹83 / month | ~₹150 / month | ~₹292 / month | ~₹417 / month |
| **Target Audience** | New Users & Startups | Local Shops & Growing Businesses | Established Companies | Large Enterprises & Factories |
| **Active Jobs Limit** | 5 | 10 | 50 | Unlimited (`-1`) |
| **Job Alerts** | 5 / month | 10 / month | 50 / month | Unlimited (`-1`) |
| **Products (Marketplace)** | 0 | 20 | 100 | Unlimited (`-1`) |
| **Services (Marketplace)** | 0 | 10 | 50 | Unlimited (`-1`) |
| **Gallery Images** | 6 | 10 | 50 | Unlimited (`-1`) |
| **Videos** | 0 | 2 | 10 | Unlimited (`-1`) |
| **Company Templates** | 1 | 5 | 15 | All (Unlimited) |
| **Color Themes** | 1 | 5 | 15 | All (Unlimited) |
| **Branches** | 0 | 3 | 20 | Unlimited (`-1`) |
| **Staff Digital IDs** | 0 | 0 | 25 | Unlimited (`-1`) |
| **Membership Tier Badge** | 🟢 Basic Member | 🥈 Silver Member | ⭐ Gold Member | 💎 Enterprise Member |
| **Verified Badge (Admin)** | Basic Verified | Silver Verified | Gold Verified | Platinum Corporate Badge |

---

## 3. The Authoritative 20-Row Feature Access Matrix

The 20-row Feature Access Matrix is defined in [`src/lib/constants.ts`](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/lib/constants.ts#L612-L780) as `FEATURE_ACCESS_MATRIX_20_ROWS` and mapped dynamically across the Public Pricing Page and Admin Portal.

| # | Feature / Resource | Basic (₹999) | Standard (₹1,800) | Premium (₹3,500) | Enterprise (₹5,000) | Category |
|---|:---|:---|:---|:---|:---|:---|
| 1 | **Job Postings (Active)** | 5 jobs | 10 jobs | 50 jobs | Unlimited | Core Recruitment |
| 2 | **Job Alerts to Candidates** | 5 / month | 10 / month | 50 / month | Unlimited | Core Recruitment |
| 3 | **Product Catalogue** | Not available | Up to 20 products | Up to 100 products | Unlimited products | Marketplace |
| 4 | **Services Catalogue** | Not available | Up to 10 services | Up to 50 services | Unlimited services | Marketplace |
| 5 | **Photo Gallery** | Up to 6 photos | Up to 10 photos | Up to 50 photos | Unlimited photos | Media & Branding |
| 6 | **Video Embeds** | Not available | 2 videos | 10 videos | Unlimited videos | Media & Branding |
| 7 | **Website Templates** | 1 basic template | 5 templates | 15 templates | All templates | Digital Presence |
| 8 | **Color Themes** | 1 standard theme | 5 color themes | 15 color themes | All themes & custom | Digital Presence |
| 9 | **Branch Locations** | Not available | Up to 3 branches | Up to 20 branches | Unlimited branches | Business Ops |
| 10 | **Staff ID Cards** | Not available | Not available | Up to 25 staff cards | Unlimited staff cards | Business Ops |
| 11 | **Digital Business Card** | Available | Available | Available | Available | Media & Branding |
| 12 | **QR Code Standee (PDF)** | Available | Available | Available | Available | Media & Branding |
| 13 | **Google SEO Indexing** | Standard | Standard | Priority | Dedicated & Fast-Track | Visibility & Reach |
| 14 | **WhatsApp Direct Enquiry** | Available | Available | Available | Available | Visibility & Reach |
| 15 | **Lead Management CRM** | Basic leads | Full CRM | Advanced CRM + Export | Enterprise CRM + Multi-User | Tools & Analytics |
| 16 | **AI Company Assistant** | 5 queries / day | 20 queries / day | 100 queries / day | Unlimited AI | Tools & Analytics |
| 17 | **AI SEO Content Generator** | Not available | Not available | Available | Available | Visibility & Reach |
| 18 | **Careers / Jobs Page** | Basic listing | Custom branding | Full Portal + Filtering | Custom Domain Support | Digital Presence |
| 19 | **Homepage Featured Placement** | Not available | Not available | 7 days / month | 30 days continuous | Visibility & Reach |
| 20 | **Search Ranking Priority** | Standard | Medium | High | Maximum Top Rank | Visibility & Reach |

---

## 4. Admin Portal Implementation

The Admin Subscription Management page ([`src/app/admin/subscriptions/page.tsx`](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/app/admin/subscriptions/page.tsx)) provides real-time control without requiring code deployments:

### 4.1 Live Operational Panels
1. **Plan Management (`'plans'`)**:
   - Live pricing and quota cards for Basic, Standard, Premium, and Enterprise.
   - Edit Plan modal: Admin can update annual prices, target audience descriptions, and quota limits.
   - Invariant notice: Edits apply only to future checkouts and renewals; existing subscriptions remain unchanged.
   - Pricing Card Preview modal: Renders how the plan looks on the public pricing page.
2. **Feature Access Matrix (`'matrix'`)**:
   - Complete 20-row matrix table with category filtering (All, Recruitment, Marketplace, Media & Branding, Digital Presence, Business Ops, Visibility & Reach, Tools & Analytics).
   - Search filter across row titles and descriptions.
   - In-place row editing with Firestore override synchronization via `PUT /api/admin/plans`.
3. **Subscribers Roster (`'subscriptions'`)**:
   - Real-time subscriber directory with plan filter (`all`, `basic`, `standard`, `premium`, `enterprise`) and status filter (`active`, `trial`, `expired`, `pending`).
   - One-click PDF receipt generation using [`receiptGenerator.ts`](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/lib/pdf/receiptGenerator.ts).
4. **Trial & Payment Alerts Queue (`'alerts'`)**:
   - Dedicated queue for companies with expiring trials or overdue renewals.
   - Quick WhatsApp notification trigger with pre-filled bilingual reminder messages.
   - 7-day trial extension or 1-year manual activation directly from the alert card.

### 4.2 Database Metrics Grid
- **Total Companies Enrolled**: 8
- **Active Subscriptions**: Live count from Firestore
- **15-Day Free Trials**: Active trial countdowns
- **Expired Subscriptions**: Overdue renewals requiring follow-up
- **Pending Approvals / Payments**: Action items for administrative moderation
- **Verified Revenue Collected**: Verified Razorpay transaction sum

---

## 5. Downgrade Data Preservation & Limit Enforcement

### 5.1 The Downgrade Invariant
When an employer downgrades (e.g., from **Enterprise** to **Basic**):
- **NO DATA IS PURGED OR DELETED**: Existing branches, gallery images, products, services, and staff IDs remain preserved in Firestore and continue to display on their public website.
- **NEW ADDITIONS BLOCKED**: New creations are strictly prevented if the current count exceeds the new tier limit:
  $$\text{Allow Add} \iff \text{limit} = -1 \lor \text{currentCount} < \text{limit}$$

### 5.2 Client & Server Enforcement Points
- **Gallery Uploads** ([`CompanyProfileEditor.tsx`](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/components/company/editor/CompanyProfileEditor.tsx#L398-L418)): Checks `canAddGalleryImage(company.plan, currentImagesCount)` before accepting file drops.
- **Branch Locations** ([`CompanyProfileEditor.tsx`](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/components/company/editor/CompanyProfileEditor.tsx#L425-L445)): Checks `canAddBranch(company.plan, currentBranchesCount)` before expanding branch forms.
- **Job Postings** ([`subscriptionService.ts`](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/lib/subscriptionService.ts)): Enforces `canPostJob(company)` against the active jobs ceiling.

---

## 6. Verification Badge Separation

To protect job seekers and ensure regulatory compliance, **Paid Subscription Tier** is strictly decoupled from **Legal Business Verification**:

1. **Paid Member Status** (Self-service upon Razorpay checkout):
   - Basic: 🟢 `Basic Member`
   - Standard: 🥈 `Silver Member`
   - Premium: ⭐ `Gold Member`
   - Enterprise: 💎 `Enterprise Member`
   *(Appears with the label `Verification Pending` until Admin review).*
2. **Official Verified Badge** (Admin legal verification in [`business-approvals`](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/app/admin/business-approvals/page.tsx)):
   - Requires valid GST / MSME / FSSAI / Shop License document review.
   - Upgrades display to `Basic Verified`, `Silver Verified`, `Gold Verified`, or `Platinum Corporate Badge`.

---

## 7. Security, Invariants & Anti-Tampering

- **Razorpay HMAC-SHA256**: All subscription payments and urgent hiring badge orders require strict cryptographic signature verification via timing-safe comparisons before any subscription dates are mutated.
- **Historical Invariants**: Invoices and receipts snapshot their billing parameters at creation time. Admin price changes in `platformSettings/subscriptionPlans` never alter past receipts or accounting ledgers.
- **Idempotent Webhooks**: Payment callbacks check transaction IDs and prevent duplicate credit or multi-year drift.

---

## 8. Verification Results

### 8.1 Automated Test Suite
```bash
npm test
```
- **Total Test Suites**: 29
- **Total Assertions**: 192 passed, 0 failed
- **Duration**: 1,511 ms

### 8.2 Production Build & Compilation
```bash
npm run build
```
- **Next.js Version**: 16.3.4 (Turbopack)
- **Static Pages Generated**: 331 / 331 routes
- **TypeScript**: 0 errors (`npx tsc --noEmit` clean)
- **ESLint**: 0 errors (`npm run lint` clean)

### 8.3 Git Repository & Deployment Synchronization
```bash
git push origin main
To https://github.com/SRIESWARAN01/thenijobs-web.git
   b1eaf4f..877b6e8  main -> main
```
- Working tree clean. All files committed and pushed to GitHub `origin/main`.

---

## 9. Deliverable Files Reference

- [Authoritative Plans & Matrix Constants](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/lib/constants.ts)
- [Admin Subscriptions & Billing Hub](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/app/admin/subscriptions/page.tsx)
- [Admin Plans & Matrix REST API](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/app/api/admin/plans/route.ts)
- [Public Pricing Page Client](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/app/pricing/PricingClient.tsx)
- [Company Profile & Quota Editor](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/components/company/editor/CompanyProfileEditor.tsx)
- [Subscription Service & Invariants](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/lib/subscriptionService.ts)
- [PDF Receipt Generator](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/lib/pdf/receiptGenerator.ts)
- [Subscription & Billing Test Suite](file:///d:/project/thenijobs-web-main/thenijobs-web-main/tests/subscription-billing-matrix.test.mjs)
