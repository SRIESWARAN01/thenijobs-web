# THENIJOBS — Company AI Auto-Enhance, Admin Panel Fixes, Subscription & Payment Automation Audit

---

## 1. Existing System Architecture Discovery

| Layer | Implementation in THENIJOBS | File Reference |
|---|---|---|
| **Frontend Framework** | Next.js 16.3.4 (App Router) + React 19.2.4 + Tailwind CSS 4 | `package.json`, `next.config.ts` |
| **Backend & APIs** | Next.js Serverless Route Handlers (`/api/*`) | `src/app/api/*` |
| **Database** | Google Cloud Firestore (Document NoSQL) | `src/lib/firebase/config.ts` |
| **Authentication** | Firebase Auth (Email/Password + Google OAuth) | `src/contexts/AuthContext.tsx` |
| **AI Integration** | Google Generative AI (`@google/generative-ai`) via Gemini Provider + Groq SDK | `src/lib/ai/*`, `src/lib/ai/providers/geminiProvider.ts` |
| **Payment Gateway** | Razorpay (Orders API, Webhooks, HMAC-SHA256 verification) | `src/app/api/payment/*` |
| **Firebase Project** | `thenijobs-9f01d` (Project #1057136000588) | `.firebaserc`, `firebase.json` |
| **Hosting** | Vercel (Edge SSR/API) + Firebase Hosting | `vercel.json`, `firebase.json` |
| **GitHub Repository** | `https://github.com/SRIESWARAN01/thenijobs-web.git` (Branch: `main`) | Git origin |

---

## 2. Existing Company Registration & Profile Workflows

1. **Business Owner Registration (`/register-business`)**:
   - Creates a user account with role `business_owner` / `employer`.
   - Allows selecting either a paid annual subscription or the **15-Day Free Trial**.
   - Places the account in `approvalStatus: 'pending'` and `accountStatus: 'pending_approval'`.
   - Strictly gates access to employer routes until authorized Admin Approval.
2. **Multi-Step Company Registration (`/company/register`)**:
   - 6-step form: Basic Info, Contact & Location, Media Upload, Details & Social, Services, Preview & Submit.
   - Saves to the `companies` Firestore collection with `verificationStatus: 'pending'`.
3. **Employer Company Profile Editor (`/employer/company-profile` & `CompanyProfileEditor.tsx`)**:
   - Single-page comprehensive editor for existing employers.
   - Allows updating company name, tagline, description, category, phone, email, website, address, products, services, and gallery.
   - Saves to `companies` document matching `ownerId == user.uid`.

---

## 3. Existing Admin Panel Functionality

- **Business Owner Approvals (`/admin/business-approvals`)**:
  - Filter tabs: Pending, Approved, Rejected, All.
  - Approve action: activates user, starts 15-day free trial or activates 365-day annual plan, updates `companies` and `users` records.
  - Reject action: records mandatory rejection reason, sets `approvalStatus: 'rejected'`.
  - View Details Modal: displays full applicant dossier, plan details, payment order, and audit log.
- **Subscriptions & Trials (`/admin/subscriptions`)**:
  - Operational metrics: Active Paid, Trial Active, Trial Expired, Total Revenue.
  - Subscriptions data table with search and plan filters.
  - Alert Queue: identifies expiring (≤3 days) and expired trials.
  - Actions: Extend Trial (+7 days with admin reason), Manual Activate Subscription, WhatsApp payment reminder.
- **Jobs Hub (`/admin/jobs`)**:
  - Status management (active, expired, draft, rejected), 48-Hour Urgent Hiring badge review.
- **Applications Hub (`/admin/applications`)**:
  - Status management (applied, reviewing, shortlisted, rejected, hired), search, filter, CSV candidate export.
- **Slogans Hub (`/admin/slogans`)**:
  - 100 billing slogans (50 Tamil, 50 English) with model mapping and admin edit/reset.

---

## 4. Existing Plan and Trial Logic

- **Authoritative Plans (`src/lib/constants.ts` & `src/lib/plans.ts`)**:
  - **Basic**: ₹999/year (5 active jobs, 6 gallery images, 1 template, basic verified badge).
  - **Standard**: ₹1,800/year (10 active jobs, 20 products, 10 services, 10 images, 2 videos, 5 templates, silver badge).
  - **Premium**: ₹3,600/year (25 active jobs, 50 products, 25 services, 20 images, 5 videos, 10 templates, gold badge).
  - **Enterprise**: ₹6,000/year (50 active jobs, unlimited products/services/branches, 16 templates, diamond badge).
- **Trial Calculation**:
  - Free trial duration: exactly **15 days**.
  - Trial start is set on Admin Approval timestamp (`trialStartedAt = now()`, `trialEndsAt = now() + 15 days`).
  - State computation via `computeSubscriptionState(companyDoc)`.
  - Daily cron (`/api/cron/expire-trials`) flags expired trials in Firestore.
  - When trial expires, write operations are blocked and `EmployerTrialExpiredScreen` prompts for plan selection.

---

## 5. Existing Gemini Integration & Backend AI Service

- **SDK Used**: `@google/generative-ai` (`GoogleGenerativeAI`).
- **Provider Architecture**:
  - `src/lib/ai/providers/geminiProvider.ts`: Factory wrapping `@google/generative-ai` with JSON mode, chat history, and connection testing.
  - `src/lib/ai/aiConfigService.ts`: Reads config from Firestore (`platformSettings/aiConfig`), falls back to environment variables (`GEMINI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GROQ_API_KEY`).
  - `src/app/api/ai/route.ts`: Central authenticated API endpoint with rate limiting (15 req/min) and credit checks.
  - Feature key `company_description` is defined in `src/lib/ai/config.ts`.

---

## 6. Identified Gaps & Required Implementation

1. **Company Auto Fill / Auto Enhance Missing**:
   - Currently, employers must type company descriptions and taglines manually.
   - Missing: One-click "Auto Fill / Auto Enhance" with Gemini AI in both `CompanyProfileEditor.tsx` and `src/app/company/register/page.tsx`.
   - Missing: Side-by-side preview modal displaying Original vs. AI Enhanced content with field-by-field accept/reject/regenerate.
   - Missing: Bilingual Tamil & English AI content generation.
   - Missing: Strict data integrity guardrail (AI must never invent legal registration numbers, GST, addresses, phones, founding years, or verification badges).
2. **Admin Review of AI-Enhanced Company Information**:
   - Missing: Admin badge "🤖 AI Enhanced" in Business Approvals queue.
   - Missing: Admin comparison view showing original submitted details vs AI-generated enhancements.
   - Gated visibility: AI-enhanced content must remain unverified until Admin explicitly reviews and approves.
3. **Admin Subscription Plan Management**:
   - Currently, plans in `constants.ts` are static.
   - Missing: Dedicated "Plan Settings / Plan Editor" tab in `/admin/subscriptions` to view and modify editable plan fields (limits, active status, features, description) stored securely in `platformSettings/subscriptionPlans` without mutating historical transaction amounts.
4. **End-to-End Test Suite**:
   - Missing: Dedicated automated tests verifying Company AI enhancement, data accuracy safeguards, admin review, plan editor validation, trial calculation, and payment verification.

---

## 7. Implementation Roadmap

1. **Phase 2 & 3**: Create `/api/company/auto-enhance` backend endpoint with Gemini integration, strict anti-fabrication rules, bilingual support, and rate limiting.
2. **Phase 2 (UI)**: Implement `CompanyAiEnhanceModal.tsx` and wire into `CompanyProfileEditor.tsx` and `src/app/company/register/page.tsx`.
3. **Phase 2 (Admin)**: Add AI Enhancement Dossier comparison and review controls in `src/app/admin/business-approvals/page.tsx`.
4. **Phase 4 & 5**: Add Plan Management Editor in `src/app/admin/subscriptions/page.tsx` and `/api/admin/plans`.
5. **Phase 6 & 7**: Audit and reinforce trial expiration and Razorpay payment automation.
6. **Phase 11**: Create and execute `tests/companyAiAndAdminPayment.test.mjs` verifying all features.
7. **Phase 12-14**: Full build, typecheck, lint, Firebase rules deployment, Git push, and final report.
