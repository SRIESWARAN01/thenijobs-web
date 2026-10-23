# THENIJOBS — Complete Workflow and Features Guide

**Production Domains:** `https://www.thenijobs.com` | `https://www.thenijobs.in`  
**Platform Version:** Next.js 16.3.4 Full Server Architecture on Vercel with Cloud Firestore (`thenijobs-9f01d`)  

---

## 1. Public Visitor Workflow

1. **Discovery & Search (`/`, `/jobs`, `/businesses`):**
   - Unauthenticated visitors land on the homepage and search jobs or businesses by keyword, industry category, district/taluk, job type, or salary range.
   - Trending jobs and featured businesses highlight high-priority local opportunities.
   - Expired listings are completely excluded from active public searches.
2. **Job Details & Safe Expired Handling (`/jobs/[id]`):**
   - Active jobs display verified company details, requirements, Google Maps pin, and a 1-click **"Apply Now"** button.
   - If an expired job link is accessed directly, public visitors are shown a clean **"Job Not Available"** screen directing them to active vacancies, preventing exposure of employer phone numbers or internal renewal links.
3. **Hyperlocal Regional Pages (`/jobs-in-[taluk]`):**
   - Optimized landing hubs for Theni, Andipatti, Bodinayakanur, Chinnamanur, Cumbum, Periyakulam, Uthamapalayam, Madurai, and Dindigul with localized `JobPosting` and `BreadcrumbList` schema markup.
4. **Business Directory & Company Profiles (`/businesses`, `/company/[slug]`):**
   - View uncropped 1200x400 business banners, verified badges (GST, Mobile, Email), direct Call/WhatsApp links, and interactive Google Maps turn-by-turn directions.

---

## 2. Job Seeker Workflow (`/seeker/*`)

1. **Registration & Profile Completion (`/register`, `/seeker/profile`, `/seeker/skills`):**
   - Sign up via Email/Password, Google OAuth, or Indian Phone (+91) OTP.
   - Complete profile with education, experience, career preferences, and 45+ categorized technical and trade skills.
   - The visual Profile Strength Meter guides seekers to 100% completion.
2. **AI ATS Resume Builder & Analysis (`/seeker/resume/builder`, `/seeker/resume/analyze`):**
   - 1-click auto-populate pulls profile details directly into a professional resume format.
   - Google Gemini AI bullet-point enhancer refines work descriptions into quantified achievement statements.
   - Dual-mode export: High-definition PDF (`html2canvas` + `jsPDF`) and native browser A4 print engine (`window.print()`).
   - ATS resume scanner scores keyword density and identifies missing qualifications.
3. **Applications & Interview Tracking (`/seeker/applications`, `/seeker/interviews`):**
   - Track application stages: `Applied → Shortlisted → Interview Scheduled → Selected / Rejected`.
   - Access scheduled interview details, video meeting links, or physical venue directions.
4. **Personal Portfolio & Digital ID Card (`/seeker/website`, `/seeker/id-card`):**
   - Build a portfolio website using Minimal, Executive, or Creative layouts.
   - Public sharing is unlocked via the ₹50/year `SEEKER_PUBLIC_PROFILE_FEE_INR` with granular privacy toggles (`hidePhone`, `hideEmail`, `hideAddress`, `hideResume`).
   - Generate official Seeker ID cards with photo, verification badge, and portfolio QR code.
5. **AI Career Coach & BYOK Integration (`/seeker/ai-coach`, `/seeker/ai`):**
   - 24/7 AI chatbot provides role-specific interview coaching and salary negotiation advice.
   - Connect personal OpenAI or Google Gemini API key with a one-time ₹50 setup fee (`AI_CONNECTION_FEE_INR`).
6. **Multi-Channel Notification Settings (`/seeker/settings`):**
   - Real-time Firestore sync with `seekerProfiles/{uid}.notificationPreferences` for Push, SMS, Email, and WhatsApp alerts.

---

## 3. Employer & Business Owner Workflow (`/employer/*`)

1. **Registration & Company Setup (`/company/register`, `/employer/company-profile`):**
   - Register organization, upload company logo, 1200x400 banner, GST details, and multi-branch addresses.
2. **15-Day Free Trial Guard:**
   - Standard 15-day free trial employers have targeted access strictly limited to:
     - `/employer/post-job` (create job postings under plan quota)
     - `/employer/company-profile` (manage profile and media)
     - `/employer/billing` (upgrade to active paid plan)
   - Advanced ATS candidate search, resume viewing, CRM leads, and website builders require an active paid subscription (`paymentStatus === 'paid'`).
3. **Job Posting Engine (`/employer/post-job`, `/employer/jobs`):**
   - Multi-step job creator with salary range, experience, vacancies, and promotion tags (⚡ Urgent, ⭐ Premium, 📌 Featured).
   - Submitted jobs enter `status: 'pending'` awaiting admin approval.
   - Dedicated **"Expired"** tab displays expired listings with direct renewal actions.
4. **Candidate ATS Pipeline (`/employer/candidates`, `/employer/talent-search`):**
   - Kanban board to review candidate resumes, shortlist talent, schedule interviews, and issue offer letters.
5. **Customer Leads CRM (`/employer/leads`):**
   - Track inbound inquiries from the marketplace and public website from `New Lead → Contacted → Qualified → Converted`.
6. **Digital Visiting Cards & Staff Badges (`/employer/id-card`):**
   - High-resolution business visiting card with vCard (.vcf) QR code and staff ID cards (up to 25 staff on Premium, unlimited on Enterprise).
7. **No-Code Website Builder (`/employer/website/*`):**
   - Choose from 16 plan-tier gated templates and customize 31+ modular section types with live in-editor AI content generation (`AIContentAssistant.tsx`).

---

## 4. Admin & Super-Admin Workflow (`/admin/*`)

1. **Authentication & Security:**
   - Dedicated admin portal (`/admin/login`) guarded by `useRequireAuth(['admin', 'super_admin'])`.
2. **Platform Governance & Moderation:**
   - **Jobs (`/admin/jobs`):** Approve/reject pending listings, renew expired listings in 1 click (+30 days), and monitor 7-day overdue candidate applications.
   - **Businesses (`/admin/businesses`):** Review KYC/GST verification, toggle featured status, or bulk-import via CSV/Excel (`/admin/businesses/import`).
   - **Users (`/admin/users`):** Manage account statuses, toggle verification badges, or suspend violators.
3. **Dynamic Slogans Engine (`/admin/slogans`):**
   - Manage and reset dynamic motivational growth slogans across 12+ career roles, 14+ business categories, and billing receipts.
4. **Subscription Audit (`/admin/subscriptions`):**
   - Inspect Razorpay payment slips, manual bank transfer plan activations, and expiry dates.
5. **System Controls & Maintenance Mode (`/admin/settings`, `/admin/seo`):**
   - Site-wide maintenance mode gate (`platformSettings/public.maintenance`) with automatic admin bypass.

---

## 5. Village Ambassador & Referral Workflow (`/ambassador/*`)

1. **Public Onboarding (`/ambassador`):**
   - 1-minute registration for local youth and college ambassadors.
2. **Dashboard & Marketing Kit (`/ambassador/dashboard`):**
   - Personalized referral link with 1-click WhatsApp status sharing kit.
3. **Commission Structure:**
   - Basic Plan (₹999): **₹150**
   - Standard Plan (₹1,800): **₹350**
   - Premium Plan (₹3,500): **₹700**
   - Enterprise Plan (₹5,000): **₹1,000**
4. **UPI Payouts:**
   - Request commission disbursements to Google Pay, PhonePe, or Paytm UPI IDs, audited and processed via `/admin/ambassadors`.

---

## 6. Product & Service Marketplace with WhatsApp Flow

1. **Marketplace Discovery (`/marketplace`, `/marketplace?type=services`):**
   - Browse retail, wholesale, and professional services across Theni.
2. **WhatsApp Order Slips (`ProductDetailModal.tsx`):**
   - Generates pre-formatted WhatsApp order messages containing item title, price, company name, location, photo URL, and direct marketplace link.

---

## 7. Website Builder: 16 Company + 3 Seeker Templates

### 7.1 16 Company Website Templates
- **Free (3):** `classic-business`, `clean-corporate`, `modern-services`
- **Standard (3):** `professional-company`, `business-showcase`, `local-business-pro`
- **Premium (6):** `corporate-premium`, `product-marketplace`, `service-marketplace`, `executive-company`, `creative-business`, `modern-business`
- **Enterprise (4):** `enterprise-corporate`, `luxury-brand`, `business-careers`, `ultimate-business-pro`

### 7.2 3 Seeker Portfolio Templates
- `minimal` (`SeekerPortfolioMinimal.tsx`)
- `executive` (`SeekerPortfolioExecutive.tsx`)
- `creative` (`SeekerPortfolioCreative.tsx`)

---

## 8. Scheduled Cron Jobs & Server Reconciliation

1. **`/api/cron/expire-jobs` (Nightly 01:00 UTC):**
   - Transitions passed-deadline active jobs to `status: 'expired'`, `isActive: false`.
2. **`/api/cron/expire-trials` (Midnight 00:00 UTC):**
   - Batch 1: Suspends 15-day free trials that have lapsed without payment.
   - Batch 2: Suspends 1-year paid subscriptions that have reached `subscriptionEndDate`.
3. **Timing-Safe Protection:**
   - Both cron routes enforce `CRON_SECRET` timing-safe bearer token authentication and `x-vercel-cron` header verification.
