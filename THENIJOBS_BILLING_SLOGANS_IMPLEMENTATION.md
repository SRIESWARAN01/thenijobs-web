# THENIJOBS Dynamic Billing Slogan Library — Architecture & Production Implementation

---

## 1. System Overview

The **THENIJOBS Dynamic Billing Slogan Library** (`src/lib/billing/sloganLibrary.ts`, `src/lib/billing/sloganService.ts`) is an enterprise-grade tagging and branding subsystem designed to print, display, and audit culturally resonant slogans across all billing documents:
- **Tax Invoices**
- **Payment Receipts**
- **Bills of Supply**
- **Quotations / Estimates**
- **Customer Billing History**
- **Admin Audit Trails**

The system guarantees that every bill dynamically receives an appropriate slogan based on its billing model, service type, and selected language (**Tamil** or **English**), while maintaining the invariant that **existing invoices and receipts never lose or alter their historical slogans**.

---

## 2. Core Components & File Structure

| Component | File Path | Description |
|---|---|---|
| **Authoritative 100 Slogan Library** | [sloganLibrary.ts](file:///D:/project/thenijobs-web-main/thenijobs-web-main/src/lib/billing/sloganLibrary.ts) | 100 master slogans (50 Tamil, 50 English), 5 categories, 14 billing models, and 4-tier resolution engine. |
| **Slogan Assignment & Rotation Service** | [sloganService.ts](file:///D:/project/thenijobs-web-main/thenijobs-web-main/src/lib/billing/sloganService.ts) | Concurrency-safe Firestore transactions, cycle management, seeding, and model mapping persistence. |
| **Canvas PDF Rasterizer** | [receiptGenerator.ts](file:///D:/project/thenijobs-web-main/thenijobs-web-main/src/lib/pdf/receiptGenerator.ts) | 3x ultra-sharp HTML5 canvas rendering for Tamil Unicode (`Mukta Malar`, `Noto Sans Tamil`, `Latha`) and English with multiline auto-wrapping. |
| **Admin Slogans API** | [route.ts](file:///D:/project/thenijobs-web-main/thenijobs-web-main/src/app/api/admin/slogans/route.ts) | Admin-only API for listing, filtering, creating, defaulting, and seeding slogans. |
| **Admin Slogans ID API** | [[id]/route.ts](file:///D:/project/thenijobs-web-main/thenijobs-web-main/src/app/api/admin/slogans/[id]/route.ts) | Edit and delete endpoints for individual slogans. |
| **Admin Model Mappings API** | [models/route.ts](file:///D:/project/thenijobs-web-main/thenijobs-web-main/src/app/api/admin/slogans/models/route.ts) | Query and update slogan pairings for 14 billing models. |
| **Admin Cycle Reset API** | [reset/route.ts](file:///D:/project/thenijobs-web-main/thenijobs-web-main/src/app/api/admin/slogans/reset/route.ts) | Cycle rotation reset endpoint. |
| **Admin Slogans Portal UI** | [page.tsx](file:///D:/project/thenijobs-web-main/thenijobs-web-main/src/app/admin/slogans/page.tsx) | Dual-tab dashboard (Library + Billing Models), Live A4 Preview Modal, and filter controls. |
| **Payment Integration** | [paymentAdminService.ts](file:///D:/project/thenijobs-web-main/thenijobs-web-main/src/lib/firebase/paymentAdminService.ts) | Automated slogan resolution upon Razorpay payment confirmation. |
| **Firestore Security Rules** | [firestore.rules](file:///D:/project/thenijobs-web-main/thenijobs-web-main/firestore.rules) | Strict security rules protecting `/billingSlogans` and `/systemSettings`. |
| **Test Suite** | [billing-slogans.test.mjs](file:///D:/project/thenijobs-web-main/thenijobs-web-main/tests/billing-slogans.test.mjs) | 11 automated unit and integration tests covering 100% of specification requirements. |

---

## 3. 4-Tier Slogan Resolution Hierarchy

Whenever a billing document is generated, `resolveBillingSlogan()` executes through four prioritized tiers:

```
Tier 1: Historical Invoice Snapshot (if existingSlogan?.sloganText exists, PRESERVE UNCONDITIONALLY)
   ↓ (not historical)
Tier 2: Billing Model Slogan (check custom mapping in Firestore or code defaults in BILLING_MODELS)
   ↓ (no model match)
Tier 3: Category Default Slogan (check category default flag for requested language)
   ↓ (no category match)
Tier 4: Global Default Slogan (slogan_1 for Tamil, slogan_51 for English)
```

### Invariants Enforced:
1. **Language Purity Invariant:**
   - Invoices marked for Tamil (`ta`) **never** receive English slogans.
   - Invoices marked for English (`en`) **never** receive Tamil slogans.
2. **Immutable Snapshot Invariant:**
   - Past invoices and payment vouchers retain their exact original slogan text, ID, and cycle, even if the admin modifies the model mapping or deactivates the slogan later.
3. **Zero Financial Mutation:**
   - Slogan rendering never affects tax calculations, plan amounts, or payment status.

---

## 4. 14 Supported Billing Models & Default Pairings

| Billing Model ID | Service Description | Category | Default Tamil Slogan | Default English Slogan |
|---|---|---|---|---|
| `job_posting` | Single / Pack Job Posting | Recruitment | `slogan_11` (வேலைவாய்ப்பும் வளர்ச்சியும்...) | `slogan_61` (Jobs and Growth on One Platform!) |
| `company_registration` | Company Onboarding | Business Growth | `slogan_1` (ஒரு கட்டணம் — ஒரு புதிய வளர்ச்சி!) | `slogan_51` (One Payment — A New Growth!) |
| `website_development` | Custom Portfolio Website | Business Growth | `slogan_6` (உங்கள் தொழிலுக்கு டிஜிட்டல் துணை!) | `slogan_53` (A New Path to Business Growth!) |
| `website_hosting` | 365-Day Managed Hosting | Trust & Quality | `slogan_25` (எப்போதும் தரமான சேவை!) | `slogan_75` (Always Quality Service!) |
| `digital_marketing` | Local Ads & Promotion | Business Growth | `slogan_3` (தொழில் வளர்ச்சிக்கு புதிய வழி!) | `slogan_55` (A New Journey Towards Growth!) |
| `social_media_management`| Hyperlocal Social Reach | Business Growth | `slogan_10` (தொழில் வளர்ச்சி இனி எளிது!) | `slogan_56` (Building Better Business Opportunities.) |
| `recruitment_subscription`| Candidate Sourcing Pro | Recruitment | `slogan_15` (சரியான திறமை, சரியான வாய்ப்பு!) | `slogan_65` (Right Talent, Right Opportunity!) |
| `company_verification` | Green Shield Verification| Trust & Quality | `slogan_21` (நம்பிக்கையான வணிகம் — எங்கள்...) | `slogan_71` (Trust and Quality are Our Identity!) |
| `digital_id_card` | Digital Smart ID Card | Trust & Quality | `slogan_23` (தரமான சேவை, உடனடி தீர்வு!) | `slogan_73` (Quality Service, Immediate Solution!) |
| `custom_service` | Bespoke Enterprise Solution| Custom | `slogan_41` (உங்கள் தேவை, எங்கள் உழைப்பு!) | `slogan_91` (Your Need, Our Effort!) |
| `subscription_basic` | Basic Plan (₹999/yr) | Business Growth | `slogan_1` (ஒரு கட்டணம் — ஒரு புதிய வளர்ச்சி!) | `slogan_51` (One Payment — A New Growth!) |
| `subscription_standard` | Standard Plan (₹1,800/yr) | Recruitment | `slogan_11` (வேலைவாய்ப்பும் வளர்ச்சியும்...) | `slogan_61` (Jobs and Growth on One Platform!) |
| `subscription_premium` | Premium Plan (₹3,500/yr) | Business Growth | `slogan_8` (உங்கள் வெற்றிக்கு ஒரு புதிய தொடக்கம்!)| `slogan_57` (Your Success Starts Here.) |
| `subscription_enterprise`| Enterprise Plan (₹5,000/yr)| Theni Pride | `slogan_31` (தேனியின் தொழில் பெருமை...) | `slogan_81` (The Pride of Theni...) |

---

## 5. Security & Access Control

- **Client Reads:** Authenticated users (`isAuthenticated()`) can read approved billing slogans to render their own invoices and receipts.
- **Admin Writes:** Only authorized, non-suspended platform administrators (`isAdmin() && isNotSuspended()`) can add, edit, delete, seed, or re-map slogans.
- **Server Enforcement:** All mutations are authenticated server-side via `verifyAdminAuth(req)` in Next.js Route Handlers before interacting with Firebase Admin SDK.
