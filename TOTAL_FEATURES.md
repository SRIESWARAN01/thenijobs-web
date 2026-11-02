# THENIJOBS — Complete Platform Architecture, Features Guide & Comprehensive Ecosystem Master Documentation (TOTAL_FEATURES.md)

> **The Unified Hyperlocal Job Portal, Business Directory, Service Marketplace & Digital Website Builder for Theni District & Tamil Nadu**  
> **Ecosystem:** Next.js 16.3.4 Production Web Platform (Responsive Desktop, Tablet & Mobile PWA) + Firebase Cloud Backend  
> **Production URLs:** [www.thenijobs.com](https://www.thenijobs.com) | [www.thenijobs.in](https://www.thenijobs.in)  
> **Official Helplines:** +91 93605 19460 / +91 70948 26886 | **Email:** info@thenijobs.com / support@thenijobs.com  
> **Headquarters:** North Street, A.M. Patty, Uthamapalayam, Theni District, Tamil Nadu - 625533, India  
> **Verification Status:** **ALL OK — Production Verified (100% Pass in 453 Automated Test Suites, 0 TypeScript Errors, 0 ESLint Errors, 0 Next.js Build Warnings)**  
> **Last Comprehensive Audit:** November 2026 Production Release

---

## 📑 Table of Contents

1. [Executive Summary & Unified Ecosystem Architecture](#1-executive-summary--unified-ecosystem-architecture)
2. [User Roles, Capabilities & Access Control Matrix](#2-user-roles-capabilities--access-control-matrix)
3. [Theni District Hyperlocal Demographics & Regional Corridors](#3-theni-district-hyperlocal-demographics--regional-corridors)
4. [Mobile Experience & Progressive Web Application (PWA) Architecture](#4-mobile-experience--progressive-web-application-pwa-architecture)
5. [Next.js Web Application (`thenijobs-web-main`) Architecture & Discovery Hub](#5-nextjs-web-application-thenijobs-web-main-architecture--discovery-hub)
6. [Job Lifecycle, Expiry Protocols, 30-Day Renewal & 7-Day SLA System](#6-job-lifecycle-expiry-protocols-30-day-renewal--7-day-sla-system)
7. [Hyperlocal & Regional Job Portals (SEO Landing Pages)](#7-hyperlocal--regional-job-portals-seo-landing-pages)
8. [Job Seeker Portal & Vanity URLs (`/seeker/*` & `/job-seeker/*`)](#8-job-seeker-portal--vanity-urls-seeker--job-seeker)
9. [Employer & Business Owner Portal (`/employer/*`)](#9-employer--business-owner-portal-employer)
10. [THENIJOBS Academy & LMS Certification Engine (`/courses` & `/verify-certificate`)](#10-thenijobs-academy--lms-certification-engine-courses--verify-certificate)
11. [Admin & Platform Supervision Portal (`/admin/*`)](#11-admin--platform-supervision-portal-admin)
12. [Village Ambassador & Referral Network (`/ambassador/*`)](#12-village-ambassador--referral-network-ambassador)
13. [No-Code Website Builder (16 Company + 4 Seeker Templates)](#13-no-code-website-builder-16-company--4-seeker-templates)
14. [Product & Service Marketplace with Instant WhatsApp Conversion](#14-product--service-marketplace-with-instant-whatsapp-conversion)
15. [AI Gateway, Bring-Your-Own-Key (BYOK) & Smart Automation Suite](#15-ai-gateway-bring-your-own-key-byok--smart-automation-suite)
16. [Digital Identity, Visiting Cards & Printable Counter Standees](#16-digital-identity-visiting-cards--printable-counter-standees)
17. [Payment, Subscriptions, Dynamic Slogans & Automated Invoicing](#17-payment-subscriptions-dynamic-slogans--automated-invoicing)
18. [Authentication, Security, Storage & Maintenance Infrastructure](#18-authentication-security-storage--maintenance-infrastructure)
19. [Design System, Microcopy & Bilingual (English + தமிழ்) Localization](#19-design-system-microcopy--bilingual-english--தமிழ்-localization)
20. [Architectural Consolidation & Flutter Companion App Removal History](#20-architectural-consolidation--flutter-companion-app-removal-history)
21. [Complete "ALL-OK" Verification Audit, Test Results & Route/API Inventory](#21-complete-all-ok-verification-audit-test-results--routeapi-inventory)
22. [Formal Verification Statement](#22-formal-verification-statement)

---

## 1. Executive Summary & Unified Ecosystem Architecture

**THENIJOBS** is a multi-sided hyperlocal web application engineered specifically for job seekers, recruiters, local micro-enterprises, service professionals, and enterprise corporations across Theni district and Tamil Nadu.

The entire platform operates as a **unified cloud architecture** powered by Next.js 16.3.4 (App Router) running as an Edge-enabled Node.js server deployment with Google Cloud Firestore, Firebase Authentication, and Razorpay 256-bit SSL payments:

```mermaid
graph TD
    subgraph Client Applications
        WEB[Next.js 16.3.4 Desktop Portal<br/>High-Definition Desktop & Laptop]
        PWA[Progressive Web App - PWA<br/>Mobile & Tablet Responsive]
    end

    subgraph Firebase Cloud Backend thenijobs-9f01d
        AUTH[Firebase Authentication<br/>Email, Google, Phone + Voice OTP]
        FS[(Cloud Firestore<br/>Production Security Rules)]
        STORAGE[(Firebase Storage<br/>Hardened MIME/Size Rules)]
    end

    subgraph Serverless Cloud & AI Gateways
        PROXY[Next.js 16 Edge Proxy src/proxy.ts<br/>Canonical Domain & Loop Shield]
        VERCEL[Vercel Serverless Functions<br/>API Routes & Nightly Cron Jobs]
        RAZORPAY[Razorpay 256-bit SSL<br/>Webhooks & Dual-Path HMAC]
        AI[AI Multi-Gateway<br/>Gemini 2.5 / Groq / OpenAI / BYOK]
        TWOFAC[2Factor.in SMS & Voice Gateway]
    end

    WEB <--> PROXY
    PWA <--> PROXY
    PROXY <--> VERCEL
    WEB <--> AUTH
    WEB <--> FS
    WEB <--> STORAGE
    PWA <--> AUTH
    PWA <--> FS
    VERCEL <--> FS
    VERCEL <--> RAZORPAY
    VERCEL <--> AI
    VERCEL <--> TWOFAC
```

### 1.1 Core Technology Stacks

* **Framework:** Next.js 16.3.4 (App Router running as a full Node.js server app with Edge Proxy routing in `src/proxy.ts`)
* **Package Architecture:** `"type": "module"` with native ECMAScript Modules throughout
* **Runtime & Language:** React 19.2.4, TypeScript 5.9.3
* **UI & Styling:** Tailwind CSS v4, Framer Motion (`^12.40.0`), Radix UI Primitives (`@radix-ui/react-checkbox`, `@radix-ui/react-dialog`, `@radix-ui/react-progress`), Lucide React (`^1.17.0`), Recharts (`^3.8.1`), Tailwind Merge (`^3.6.0`), CLSX (`^2.1.1`)
* **Typography:** Inter (Body) + Poppins / Outfit (Headings) optimized via `next/font/google`
* **PDF & Media Generation:** `jspdf` (`^4.2.1`), `html2canvas` (`^1.4.1`), `qrcode` (`^1.5.4`), `xlsx` (`^0.18.5`)
* **AI Provider Integrations:** Multi-tier gateway routing:
  * Google Gemini API (`@google/generative-ai` `^0.24.1` with `gemini-2.5-flash`)
  * Groq Cloud (`groq-sdk` `^1.5.0` with `llama-3.3-70b-versatile`)
  * OpenAI API (`openai` `^7.4.0` with `gpt-4o-mini`)
* **Cloud & Serverless Infrastructure:**
  * **Firebase Authentication:** Email/Password, Google OAuth, Indian Phone (+91) OTP via 2Factor.in, and Voice Call OTP fallback
  * **Cloud Firestore:** Real-time NoSQL database guarded by production security rules
  * **Firebase Storage:** Secure document and media storage with hardened MIME/size rules (PDF-only resumes <5MB, media <10MB)
  * **Firebase Admin SDK:** `firebase-admin` (`^14.3.0`) for privileged server-side operations (webhook verification, cron jobs, ID token validation, invoice slogan rotation)
  * **Hosting & CDN:** Vercel deployment with HTTP security headers (HSTS, CSP, X-Frame-Options, nosniff), image optimization, clean URLs, and scheduled cron jobs
  * **Payments & Billing:** 256-bit SSL Razorpay Checkout with server-side HMAC-SHA256 signature verification, webhook processing, dynamic unique slogan rotation (100 master slogans), and automated PDF tax invoice generator

---

## 2. User Roles, Capabilities & Access Control Matrix

The platform provides dedicated, guarded dashboard portals and permission matrices:

| Role | Role Identifier | Primary Capabilities | Guarded Web Route |
|---|---|---|---|
| **Job Seeker** | `job_seeker` | Search & apply to jobs, ATS resume builder, career coach, digital ID card, vanity portfolio (`/job-seeker/[username]`), BYOK AI keys, skill courses | `/seeker/*` & `/job-seeker/*` |
| **Employer / HR** | `employer` | Post jobs, candidate ATS pipeline, interview scheduling, talent search, resume vault, subscription management, printable hiring posters | `/employer/*` |
| **Business Owner** | `business_owner` | Company profile, showcase products/services, 16 website templates, table-top QR standees, digital visiting card, multi-branch addresses | `/employer/*` |
| **Supplier / B2B** | `supplier` | List wholesale/retail products, catalog management, receive WhatsApp purchase leads | `/employer/*` & `/marketplace` |
| **Service Provider** | `service_provider` | Showcase services, accept customer booking inquiries, quote prices | `/employer/*` & `/marketplace?type=services` |
| **Village Ambassador** | `ambassador` | Referral link tracking, WhatsApp sharing kits, commission ledger, UPI & bank payout requests | `/ambassador/dashboard` |
| **Administrator** | `admin` | Moderation of jobs, companies, user accounts, reviews, subscriptions, dynamic slogans, 30-day renewal & 7-day SLA | `/admin/*` |
| **Super Admin** | `super_admin` | Master control over revenue, AI gateways, SEO, district franchise rules, master credentials, database cleanup | `/admin/*` |

### 2.1 Role Provisioning, Assignment & 15-Day Trial Consistency

* **Job Seeker (`job_seeker`)**: Self-registration at `/register`. Upon account creation, corresponding `users/{uid}` and `seekerProfiles/{uid}` records are initialized. Redirects to `/seeker/dashboard`.
* **Employer (`employer`) & Business Owner (`business_owner`)**: Self-registration at `/register` or `/register-business`. Creates `users/{uid}` and a canonical `companies/{companyId}` profile. Assigned an automatic **15-Day Standard Plan Trial** (`subscriptionStatus: 'trial'`, `trialStartDate = now`, `trialEndDate = now + 15 days`). Redirects to `/employer/dashboard`.
* **Supplier (`supplier`) & Service Provider (`service_provider`)**:
  * **15-Day Trial Parity**: Fully unified with Employer and Business Owner. Receives the automatic **15-Day Standard Plan Trial** (`trialStartDate`, `trialEndDate = now + 15 days`, `subscriptionStatus: 'trial'`) and an initialized `companies` record.
  * **Dashboard Routing**: Redirects to `/employer/dashboard` with full access to the business portal (product/service catalog, branches, visiting card, website builder, leads CRM).
  * **Role Preservation on Admin Approval**: When an administrator approves a company in `/admin/business-approvals` or `/admin/businesses`, the user's specific role (`business_owner`, `supplier`, `service_provider`) is strictly preserved rather than being overwritten to generic `employer`.
* **Administrator (`admin`)**: Provisioned directly by existing administrators at `/admin/users/create` or via Firebase Admin SDK. Has access to all moderation, verification, and audit tools.
* **Super Admin (`super_admin`)**: Top-level platform ownership role. Cannot be selected in public registration or created through client forms. Assigned exclusively via the Firebase Admin SDK or manually promoted in Firestore (`users/{uid}.role = 'super_admin'`).

---

## 3. Theni District Hyperlocal Demographics & Regional Corridors

The platform is purpose-built with localized knowledge of the 7 taluks of Theni district and surrounding commercial corridors:

1. **Theni City (District Headquarters):** Commercial hub, hospitals, banks, retail, BPO, logistics, and tech offices.
2. **Periyakulam:** Educational institutions, horticulture, mango/fruit processing, healthcare, and engineering colleges.
3. **Cumbum Valley:** Rich agricultural belt, grape vineyards, cardamom/spice trade, agro-mills, irrigation machinery, and cross-border transport.
4. **Bodinayakanur (Bodi — Cardamom City):** Cardamom capital of India, spice auctions, hill plantation labor, packaging, logistics, and trading firms.
5. **Chinnamanur:** Livestock trade, agricultural markets, banana processing, textile retail, and financial cooperatives.
6. **Andipatti:** Handloom and powerloom textile weaving, spinning mills, rural manufacturing, and garment units.
7. **Uthamapalayam:** Legal, administrative, educational institutions, commercial shops, and agro-business.
8. **Regional Corridors (Madurai & Dindigul):** Extended hiring routes for candidates seeking career growth in nearby tier-2 cities.

---

## 4. Mobile Experience & Progressive Web Application (PWA) Architecture

Rather than requiring users to download a large native app store package over rural 2G/3G/4G connections, THENIJOBS delivers a mobile experience via a **Progressive Web Application (PWA)**:

```
┌────────────────────────────────────────────────────────┐
│                   THENIJOBS PWA                        │
├────────────────────────────────────────────────────────┤
│ • Zero App Store friction (Instant Home Screen Add)     │
│ • Service Worker caching for fast page loading         │
│ • BottomNav Component with role-aware tab switches    │
│ • 1-Tap Native Phone Dialer (tel:+91...)              │
│ • 1-Tap WhatsApp Direct Apply (wa.me/91...)           │
│ • Web Share API for native Android/iOS share sheets    │
│ • Touch-friendly action sheets & modal workflows       │
└────────────────────────────────────────────────────────┘
```

### 4.1 Mobile-First Capabilities
* **Bottom Navigation Bar (`src/components/navigation/BottomNav.tsx`):** Fixed bottom navigation on mobile viewports with dynamic tab swapping based on user role (Jobs, Business, Manage/Applied, Alerts, Profile).
* **1-Tap Direct Call & WhatsApp:** Native telephone dialer (`tel:`) and instant WhatsApp chat (`wa.me`) buttons on every job posting and marketplace item.
* **Responsive Breakpoints:** Fully fluid layouts tailored for 320px (compact mobile), 375px/414px (standard smartphones), 768px (tablets), and 1024px+ (desktop workstations).
* **Offline-Friendly Visual Feedback:** Skeleton loaders, instant optimistic state updates, and graceful network disconnection alerts.

---

## 5. Next.js Web Application (`thenijobs-web-main`) Architecture & Discovery Hub

### 5.1 Homepage Component Breakdown (`src/components/home`)

1. **AnnouncementBar (`AnnouncementBar.tsx`):** Top marquee broadcasting flash job alerts, government walk-ins, and district recruitment updates.
2. **HeroSection (`HeroSection.tsx`):** Dynamic search input (Keyword + Location) with live auto-suggestions and platform metrics counters.
3. **TrustedEmployersStrip (`TrustedEmployersStrip.tsx`):** Logo marquee of top verified companies, hospitals, and agro-firms in Theni.
4. **TrendingJobs (`TrendingJobs.tsx`):** High-priority openings with ⚡ *Urgent* and ⭐ *Premium* tags (automatically filtered to exclude expired listings).
5. **WalkInDriveBanner (`WalkInDriveBanner.tsx`):** Dedicated promo highlight for upcoming offline walk-in interviews and mega job fairs.
6. **CategoriesSection (`CategoriesSection.tsx`):** Browse top 12+ industry categories with Tamil subtitles and live opening counts.
7. **FeaturedBusinesses (`FeaturedBusinesses.tsx`):** Verified business cards with uncropped banners and category pills.
8. **ServicesSection (`ServicesSection.tsx`):** Highlights local service professionals (electricians, mechanics, accountants).
9. **WhySection (`WhySection.tsx`):** Hyperlocal value proposition highlighting 10x faster recruitment than national portals.
10. **HowItWorksSection (`HowItWorksSection.tsx`):** 3-step visual guide for job seekers and hiring businesses.
11. **JobSeekerEmployerCTA (`JobSeekerEmployerCTA.tsx`):** Dual registration CTA cards for candidates and hiring managers.
12. **LocationsSection (`LocationsSection.tsx`):** Quick-link chips for all 7 Theni taluks and neighboring corridors.
13. **FAQSection (`FAQSection.tsx`):** Accordion FAQ addressing common candidate and recruiter queries with FAQPage JSON-LD schema.
14. **FinalCTA (`FinalCTA.tsx`):** Bottom conversion banner for candidate onboarding.
15. **HomeFooter (`HomeFooter.tsx`):** Comprehensive footer with district office address, phone helplines, WhatsApp links, and legal routes.
16. **ClientFloatingWidgets (`ClientFloatingWidgets.tsx`):** Floating WhatsApp customer helpline button (`+91 93605 19460`) and back-to-top button.

---

## 6. Job Lifecycle, Expiry Protocols, 30-Day Renewal & 7-Day SLA System

```mermaid
graph TD
    Job[Job Posting Created] --> Pending[Pending Review / Immediate Active]
    Pending --> Active[Active & Live on Website]
    Active -->|Deadline Passed / Plan Ends / Cron| Expired[Job Expired]
    
    Expired -->|Public Visitor / Candidate| PublicView[Candidate 'Job Not Available' Screen]
    Expired -->|Posting Employer| EmpView[Employer Notice: Renew Plan / Upgrade]
    Expired -->|Admin Portal| AdminView[Admin Controls: 30-Day Renewal / WhatsApp Employer]
    
    AdminView -->|Renew & Extend +30 Days| Active
    EmpView -->|Renew Subscription via Billing| Active
```

### 6.1 Role Visibility Matrix for Expired Jobs

| Viewer Role | What Is Displayed | Actions Available |
| :--- | :--- | :--- |
| **Public Visitor / Candidate** | **Candidate-Friendly "Job Not Available" Screen**<br>• Job details hidden.<br>• Filtered out from public search (`/jobs`), Trending, and Daily Jobs.<br>• No administrative numbers or internal URLs leaked. | • Click **"Browse All Active Jobs"** to explore current vacancies in Theni. |
| **Employer (Job Owner)** | **Specialized Employer Notice & Warning Banner**<br>• Shown on `/employer/jobs` under dedicated **"Expired"** tab.<br>• Banner on `/jobs/[id]`: *"Your Job Posting Has Expired"*. | • 💳 **Renew Plan** (direct to `/employer/billing`).<br>• 💬 **Contact Admin to Renew** (direct WhatsApp link to `+91 93605 19460`).<br>• View all applications received prior to expiration. |
| **Admin Portal** | **Admin Moderation & Renewal Hub**<br>• Listed under dedicated **"Expired"** tab with real-time KPI badge on `/admin/jobs`.<br>• Banner on `/jobs/[id]`: *"This Job Has Expired — Hidden from Public Website"*. | • 🚀 **Renew & Extend (+30 Days)**: One-click deadline reset & automatic reactivation.<br>• 💬 **WhatsApp: Ask Employer to Renew**: Pre-filled WhatsApp notification sent to employer with direct billing link.<br>• ✏️ **Re-Approve & Moderate**: Re-approve with automatic +30 day deadline extension. |

### 6.2 Strict Renewal & Subscription Policy
* **Dual-Requirement for Job Reactivation:** A job cannot be active if the posting business is inactive. Reactivation requires:
  1. An Active Business Subscription or Unexpired Trial (`subscriptionStatus: 'active' \| 'trial'`).
  2. A Valid Deadline set in the future (+30 days).
* **Admin Verification:** Clicking **"Renew & Extend (+30 Days)"** on `/admin/jobs` checks the company's real-time subscription status. If lapsed, the system blocks reactivation, displays an alert, and generates a pre-filled WhatsApp billing reminder.

### 6.3 Automated Nightly Cron Jobs
* **Job Expiry Cron (`/api/cron/expire-jobs`):** Executes nightly at `01:00 UTC` via Vercel Cron. Scans all `status: 'active'` jobs whose deadline has passed, transitioning them to `status: 'expired'`, `isActive: false`, with audit logging.
* **Company Trial Expiry Cron (`/api/cron/expire-trials`):** Executes daily at `00:00 UTC`. Automatically transitions companies whose 15-day trial or 1-year annual plan has lapsed to `trial_expired` or `subscription_expired`.
* **Timing-Safe Authentication:** Both cron endpoints authenticate via `crypto.timingSafeEqual` verifying the `CRON_SECRET` bearer token and `x-vercel-cron` header.

### 6.4 7-Day Employer Response SLA System
* On `/admin/jobs`, the **"Overdue Apps"** tab monitors candidate applications that have remained unreviewed by employers for more than 7 days.
* Administrators have 1-click **"Call Employer"** and **"WhatsApp Follow-up"** buttons with pre-filled candidate reminder text.

---

## 7. Hyperlocal & Regional Job Portals (SEO Landing Pages)

Dedicated, search-engine-optimized landing pages targeting specific taluks and neighboring commercial hubs:

* **Theni Hub:** `/jobs-in-theni` (and category pages `/jobs-in-theni/[category]`)
* **Andipatti:** `/jobs-in-andipatti`
* **Bodinayakanur:** `/jobs-in-bodinayakanur`
* **Chinnamanur:** `/jobs-in-chinnamanur`
* **Cumbum:** `/jobs-in-cumbum`
* **Periyakulam:** `/jobs-in-periyakulam`
* **Uthamapalayam:** `/jobs-in-uthamapalayam`
* **Madurai Corridor:** `/jobs-in-madurai`
* **Dindigul Corridor:** `/jobs-in-dindigul`
* **Daily Fresh Jobs Stream:** `/daily-jobs` (Aggregated live stream of today's freshest local job postings).

---

## 8. Job Seeker Portal & Vanity URLs (`/seeker/*` & `/job-seeker/*`)

A personal career hub with AI tools, ATS resume builder, application tracking, and personal website generator:

### 8.1 Dashboard & Navigation (`/seeker/dashboard`)
* **Profile Strength Meter:** Visual percentage gauge (0–100%) indicating missing profile items.
* **"Open to Work" Toggle:** Instant availability badge visible to recruiters.
* **KPI Metrics:** Applied Jobs count, Shortlisted count, Scheduled Interviews count, Saved Jobs count.
* **Personalized Job Recommendations:** Tailored openings matching the user's skill set and district.

### 8.2 Comprehensive Profile Builder (`/seeker/profile` & `/seeker/skills`)
* **Personal Data:** Name, phone, email, full address, district, state, profile avatar.
* **Work Experience:** Multiple entries with company name, designation, start/end dates, roles, achievements.
* **Education History:** School/College, degree, specialization, graduation year, percentage/CGPA.
* **Categorized Skills Matrix:** Multi-select from 45+ predefined tech, trade, and regional skills.
* **Career Preferences:** Desired job roles, expected monthly salary (INR), preferred districts, work mode.

### 8.3 AI-Powered ATS Resume Builder (`/seeker/resume/builder` & `/seeker/resume/analyze`)
* **Auto-Populate from Profile:** 1-click sync pulling personal details, education, work experience, and skills directly from Firestore into the resume builder.
* **AI Bullet Point Generator & Optimizer:** Converts basic work descriptions into ATS-friendly, quantified achievements with action verbs.
* **Dual-Mode High-Definition Export:**
  1. High-resolution canvas-based PDF generation (`html2canvas` + `jsPDF`) with mobile-safe margins.
  2. Vector-crisp native browser print engine (`window.print()`) formatted for standard A4 paper.
* **Resume AI Analysis (`/seeker/resume/analyze`):** Automated ATS score, keyword density checker, and improvement suggestions.

### 8.4 Career Coaching & AI Suite (`/seeker/ai-coach`, `/seeker/ai-chat`, `/seeker/ai`)
* **AI Career Coach (`/seeker/ai-coach`):** Structured interview preparation, situational question evaluation, and custom cover letter generator.
* **Ask AI Chatbot (`/seeker/ai-chat`):** Freeform conversational chatbot grounded strictly in the candidate's own profile.
* **BYOK AI Settings (`/seeker/ai`):** Connect personal OpenAI or Gemini API key to bypass platform rate limits.

### 8.5 Vanity Candidate Portfolio (`/job-seeker/[username]`)
* Candidates claim a vanity URL (e.g., `www.thenijobs.com/job-seeker/anand-kumar`).
* **Real-Time Uniqueness Validation:** Instant checks via `/api/job-seeker/check-username`.
* **4 Responsive Templates:** Minimal Resume, Executive Dark, Creative Showcase, Modern Portfolio.
* **SEO & Indexing Protection:** Strict `noindex, nofollow` metadata while the portfolio is in draft mode; unlocked for Google indexing upon publishing.
* **Subscription Fee:** **₹100 / year** (`SEEKER_PUBLIC_PROFILE_FEE_INR`) processed via Razorpay order creation (`/api/payment/seeker-public-profile/create-order`) and server-to-server webhook activation.

### 8.6 Digital Identity & Visiting Card (`/seeker/id-card`)
* Candidate profile card with unique QR code linking to their public portfolio.
* 1-click download as PNG or share via native device share sheet.

---

## 9. Employer & Business Owner Portal (`/employer/*`)

A hiring, marketing, and business administration suite:

### 9.1 Employer Dashboard (`/employer/dashboard`)
* Real-time metrics: Active Jobs, Total Applicants, Interviews Scheduled, Website Visitors, Inbound WhatsApp Leads.
* 15-Day Free Trial countdown banner with 1-click upgrade button.
* Recent applicant activity feed with quick action buttons.

### 9.2 Job Posting & Applicant ATS Pipeline (`/employer/post-job`, `/employer/jobs`, `/employer/candidates`)
* **Multi-Step Job Posting Engine:** Step-by-step wizard covering job basics, role requirements, salary details, location, and screening questions.
* **Kanban ATS Pipeline:** Pipeline stages (`Applied` → `Under Review` → `Shortlisted` → `Interview Scheduled` → `Hired` → `Rejected`).
* **Applicant Detail Modal:** Candidate resume preview, contact details, candidate notes, and status changer.
* **Interview Scheduler (`/employer/interviews`):** Schedule Google Meet, Phone, or Walk-in interviews with candidate notifications.

### 9.3 Printable Media & Offline Toolkits (`/employer/standee` & `/employer/jobs/[id]/posters`)
* **Table-Top Counter Standee Studio (`/employer/standee`):** Generate high-resolution acrylic counter standees with company branding and QR codes for shop counters and hospital desks.
* **Hyperlocal Hiring Posters (`/employer/jobs/[id]/posters`):** 1-click generation of printable A4 hiring posters and 1:1 square WhatsApp/Instagram status cards for any job vacancy.

### 9.4 Business Profile & Catalog Management (`/employer/company-profile`, `/employer/leads`)
* Company profile details, uncropped 1200x400 banners, logo upload, GST number, multiple branch locations.
* Product & Service catalog manager with price tags, images, and WhatsApp lead tracking.
* Inbound Leads CRM (`/employer/leads`): Tracks customer inquiries submitted via the public website or marketplace.

---

## 10. THENIJOBS Academy & LMS Certification Engine (`/courses` & `/verify-certificate`)

A vocational education and practical skill certification engine designed for rural job seekers:

### 10.1 Course Catalog & Lesson Delivery (`/courses` & `/courses/[slug]`)
* **Curriculum Areas:** Tally Prime with GST, Modern Web Development (React & Next.js), Office Data Entry & Tamil Typing, Retail & Field Sales.
* **Interactive Lessons:** Embedded video tutorials, detailed lesson notes, downloadable study resources, and key takeaways.
* **Knowledge Check Quizzes:** Interactive multiple-choice quizzes at the end of each module.

### 10.2 Cryptographic Certificate Issuance & Public Verification (`/verify-certificate/[id]`)
* **Automated Issuance:** Upon achieving passing quiz scores, the system creates a cryptographic certificate record in the `certificates` Firestore collection.
* **Public QR Verification:** Scanning the certificate's QR code routes to `/verify-certificate/[id]`, displaying verified student name, course title, completion date, and issuing authority seal.
* **Admin LMS Management:** Administrators manage course catalogs, video lessons, and quiz questions at `/admin/career-growth`.

---

## 11. Admin & Platform Supervision Portal (`/admin/*`)

Supervisory control center for platform owners:

* `/admin/login` — Dedicated admin authentication screen with multi-factor session validation.
* `/admin/dashboard` — Platform KPIs: Total Users, Active Jobs, Registered Businesses, Total Revenue, Expired Jobs, Overdue Apps.
* `/admin/users` & `/admin/users/create` — User directory with manual verification, role assignment, and account ban/unban toggles.
* `/admin/businesses` & `/admin/business-approvals` — Business directory moderation, verification badges (Mobile, Email, GST), approval workflow.
* `/admin/business-recovery` — Ownership recovery request review and password reset token generation.
* `/admin/businesses/import` — Bulk Excel/CSV business importer for rapid district onboarding.
* `/admin/businesses/website-health` — Portfolio website health monitor checking logo, favicon, and SEO tags.
* `/admin/businesses/[id]` (and subpages: `/jobs`, `/profile`, `/website`) — Deep Company Controls
* `/admin/company-accounts` — Multi-User Company Accounts Manager
* `/admin/database-cleanup` — Orphan & Stale Data Cleanup Utility
* `/admin/jobs` & `/admin/jobs/create` — Job Listing Moderation, Expired Tabs, 30-Day Renewal & 7-Day SLA System
* `/admin/career-growth` — THENIJOBS Academy Curriculum & Quiz Management
* `/admin/leads` — Platform-wide Leads Overview
* `/admin/services` — Service Directory Moderation
* `/admin/subscriptions` — Transactions & Plan Activations
* `/admin/ambassadors` — Village Ambassador Network & UPI Payouts Processing
* `/admin/slogans` — **Dynamic Growth Slogans Management**: Admin interface to create, edit, activate, or reset invoice slogans.
* `/admin/reviews` — Content Moderation
* `/admin/reports` — Financial & Growth Analytics
* `/admin/ai-settings` & `/admin/ai-analytics` — AI Gateways & Usage Limits
* `/admin/notifications` — System Broadcast Announcements
* `/admin/security` — Activity Logs & IP Audit Trail
* `/admin/seo` — Global SEO & Google Indexing Submissions
* `/admin/errors` — Crash Logs & Error Diagnostics
* `/admin/settings` — Platform Parameters, Maintenance Mode & Master Controls

---

## 12. Village Ambassador & Referral Network (`/ambassador/*`)

A localized affiliate network empowering village youths and local organizers to onboard businesses:

* **Public Landing Page (`/ambassador`):** Highlights earning potential, zero upfront investment, and 1-minute registration.
* **Ambassador Dashboard (`/ambassador/dashboard`):**
  * Unique referral link generation (e.g. `www.thenijobs.com/register?ref=AMB-THENI-102`).
  * WhatsApp Sharing Kit with pre-written Tamil and English marketing templates.
  * Real-time referral ledger: Businesses registered, subscriptions activated, total earnings, pending payouts.
  * **Withdrawal Requests:** Ambassadors submit UPI ID or Direct Bank Account (NEFT/IMPS) details.
* **Commission Matrix:**
  * Basic Plan (₹999/yr): ₹150 commission
  * Standard Plan (₹1,800/yr): ₹350 commission
  * Premium Plan (₹3,500/yr): ₹700 commission
  * Enterprise Plan (₹5,000/yr): ₹1,000 commission

---

## 13. No-Code Website Builder (16 Company + 4 Seeker Templates)

Local businesses and job seekers can build a responsive, search-engine-optimized website without writing code:

### 13.1 16 Business Templates (`/employer/website/templates`)
1. **Modern Clean:** Minimalist corporate layout for agencies and consultants.
2. **Corporate Prime:** Multi-section layout for established enterprises.
3. **Creative Agency:** Dark/vibrant hero with portfolio showcase.
4. **Minimal Elegance:** High-white-space layout for boutique services.
5. **Local Retail & Supermarket:** Product-heavy grid with discount tags and WhatsApp order buttons.
6. **Healthcare & Clinic:** Appointment booking, doctor profiles, emergency call banner.
7. **Restaurant & Cafe:** Visual food menu, operating hours, table reservation link.
8. **Education & Coaching:** Course catalog, faculty list, student testimonials.
9. **Real Estate & Builders:** Property listings with BHK/sqft filters, photo carousel.
10. **Automobile & Workshop:** Vehicle service menu, spare parts catalog.
11. **Agriculture & Spices (Theni Signature):** Agro-product catalog, spice export details.
12. **Textile & Handloom (Andipatti Signature):** Fabric showcase, wholesale bulk order calculator.
13. **Professional Services:** Trust layout for lawyers, chartered accountants, and tax advisors.
14. **Tech & Software:** SaaS-style hero, feature matrix, pricing tiers.
15. **Industrial & Manufacturing:** Factory machinery photos, production capacity, ISO certifications.
16. **Wholesale & B2B Distribution:** Tiered volume pricing, catalog PDF download, credit terms.

### 13.2 4 Candidate Portfolio Templates
1. **Seeker Minimal Resume:** Clean single-column layout prioritizing experience and education.
2. **Seeker Executive Dark:** High-contrast corporate layout with career snapshot and bio.
3. **Seeker Creative Showcase:** Card-based visual layout for designers, photographers, and marketers.
4. **Seeker Modern Portfolio:** Clean, balanced design with project grids and skill bars.

---

## 14. Product & Service Marketplace with Instant WhatsApp Conversion

Integrated local commerce hub connecting buyers directly with Theni businesses and service experts:

* **Unified Marketplace Route (`/marketplace`):** Tabbed toggle between **Products** and **Services** (with permanent 301 redirect from `/services`). Filter by taluk, category, and price range.
* **Instant WhatsApp Conversion Flow:** Clicking **"Inquire on WhatsApp"** or **"Order via WhatsApp"** opens WhatsApp with pre-filled product details.
* **Product Detail Route (`/marketplace/[type]/[companySlug]/[itemId]`):** Full gallery images, item specifications, seller verification badge, and direct call/message buttons.

---

## 15. AI Gateway, Bring-Your-Own-Key (BYOK) & Smart Automation Suite

Multi-provider AI architecture delivering cost-effective, high-speed intelligent features:

```mermaid
graph LR
    User[User Request] --> Router[AI Gateway Router /api/ai]
    Router -->|Seeker/Employer BYOK Key| BYOK[User Personal Key]
    Router -->|Platform Free Quota| GROQ[Groq Cloud: Llama 3.3 70B]
    Router -->|High-Reasoning Tasks| GEMINI[Google Gemini 2.5 Flash]
    Router -->|Fallback| OPENAI[OpenAI GPT-4o-mini]
```

### 15.1 Key AI Features
1. **AI Resume Bullet Generator:** Converts informal text into ATS-optimized achievement statements.
2. **AI Job Description Generator:** Generates professional job postings based on title, skills, and industry in English and Tamil.
3. **AI Candidate-Job Matcher:** Scores candidate profiles against job requirements and highlights skill gaps.
4. **AI Career Coach (`/seeker/ai-coach`):** Interactive interview preparation chatbot.

### 15.2 Bring-Your-Own-Key (BYOK) Architecture
* Users can connect their personal OpenAI or Google Gemini API key to bypass platform rate limits.
* **Security:** Keys are encrypted in Firestore using AES-256-GCM (`AI_KEY_ENCRYPTION_SECRET`).
* **Activation:** One-time nominal fee of ₹50 (`AI_CONNECTION_FEE_INR`) processed via Razorpay.

---

## 16. Digital Identity, Visiting Cards & Printable Counter Standees

Instant mobile-first digital credentials and offline-to-online marketing toolkits:

* **Seeker Digital ID Card (`/seeker/id-card`):** Credit-card aspect ratio with photo, name, member ID, verified badges, and QR code pointing to their live portfolio.
* **Employer Digital Visiting Card (`/employer/id-card`):** Modern NFC-style digital business card with company logo, owner designation, address, and contact buttons.
* **Table-Top Counter Standee Studio (`/employer/standee`):** Printable acrylic counter standees with QR codes for shop counters and hospital receptions.
* **Offline Hiring Posters (`/employer/jobs/[id]/posters`):** 1-click generation of printable A4 hiring posters and WhatsApp status banners.

---

## 17. Payment, Subscriptions, Dynamic Slogans & Automated Invoicing

### 17.1 Employer Annual Subscription Plans

| Plan Feature | Basic (₹999/yr) | Standard (₹1,800/yr) | Premium (₹3,500/yr) | Enterprise (₹5,000/yr) |
|---|---|---|---|---|
| **Monthly Equivalent** | ₹83 / mo | ₹150 / mo | ₹292 / mo | ₹417 / mo |
| **Daily Cost** | ₹2.74 / day | ₹4.93 / day | ₹9.59 / day | ₹13.69 / day |
| **Active Job Postings** | 5 Jobs | 10 Jobs | 50 Jobs | **Unlimited** |
| **Job Alerts** | 5 Alerts | 10 Alerts | 50 Alerts | **Unlimited** |
| **Product Catalog** | None | 20 Products | 100 Products | **Unlimited** |
| **Service Listings** | None | 10 Services | 50 Services | **Unlimited** |
| **Gallery & Media** | 6 Images | 10 Images + 2 Videos | 50 Images + 10 Videos | **Unlimited** |
| **Website Templates** | 1 Template | 5 Templates | 15 Templates | **All 16 + Custom** |
| **Digital Visiting Card** | Basic Card | Silver Badge + Card | Gold Badge + 25 Staff | Platinum + Unlimited Staff |
| **Branches** | 1 Location | 3 Branches | 20 Branches | **Unlimited Branches** |
| **AI Assistant** | None | Basic | Full Access | **Dedicated Chatbot** |
| **Search Priority** | Standard | Elevated | Top Featured | **Homepage Featured** |
| **Ambassador Payout** | ₹150 | ₹350 | ₹700 | ₹1,000 |

### 17.2 Job Seeker Plans & Monetization Fees

| Offering | Pricing & Frequency | Key Benefits & Entitlements | API Order Endpoint | Webhook / Verification Flow |
|---|---|---|---|---|
| **Pro Candidate Plan** | **₹199 / quarter** (3 months) | • Featured Candidate Badge<br>• Priority Application Review<br>• Unlimited Job Alerts<br>• AI Career Coach mock interviews | `POST /api/payment/create-order`<br>`{ planSlug: 'seeker_pro' }` | `POST /api/payment/verify` & `POST /api/payment/webhook`. Updates `seekerProfiles/{uid}` with `isPremium = true`. |
| **Public Portfolio Website** | **₹100 / year** | • Unlocks public web portfolio link `/job-seeker/[username]` with 1-year validity.<br>• Shareable digital resume for social media.<br>• Unlocks Google search indexing. | `POST /api/payment/seeker-public-profile/create-order` | `POST /api/payment/seeker-public-profile/webhook`. Updates `seekerProfiles/{uid}` with `publicProfilePaidUntil = now + 365 days`. |
| **BYOK Personal AI Key Connection** | **₹50 one-time** | • Connect personal OpenAI or Google Gemini API key.<br>• AES-256-GCM encryption.<br>• Unlocks unlimited AI usage without platform limits. | `POST /api/ai/connections/fee/create-order` | `POST /api/ai/connections/fee/webhook`. Updates `aiConnections/{uid}` entitlement to `hasPaidConnectionFee = true`. |

### 17.3 Dynamic 100-Slogan Billing Rotation System
* Every generated invoice includes a unique business growth slogan in English and Tamil.
* **Deterministic & Atomic Rotation:** Powered by `src/lib/billing/sloganService.ts` and `sloganLibrary.ts` using Firestore Admin transactions.
* Rotates sequentially through 100 curated slogans before repeating. Admin controls at `/admin/slogans`.

### 17.4 Automated PDF Tax Invoice Generation
* Instant generation of official tax receipts upon payment completion using `jspdf`.
* Receipt Number format: `THENI-REC-[RANDOM-HASH]`, customer details, GSTIN, and CGST/SGST breakdown.

---

## 18. Authentication, Security, Storage & Maintenance Infrastructure

### 18.1 Next.js 16 Edge Proxy (`src/proxy.ts`)
* Canonical domain enforcement redirecting alias domains (`thenijobs.com`, `thenijobs.in`, `www.thenijobs.in`) to authoritative canonical `https://www.thenijobs.com` with HTTP 301.
* Fully adheres to the Next.js 16 Edge Proxy standard, eliminating legacy middleware deprecation warnings.

### 18.2 Triple Authentication Flow
* **Email + Password:** With password reset flow via Firebase Auth.
* **SMS OTP:** Mobile OTP delivery via 2Factor.in / Firebase Phone Auth.
* **Voice Call OTP Fallback:** Automated voice call OTP via `/api/otp/call` with strict server rate limiting (max 3 calls per 5 minutes per IP/phone).
* **Google OAuth:** 1-tap Google Sign-In with automatic role detection.

### 18.3 Cloud Firestore Security Rules
* Granular role-based rules ensuring users only modify authorized documents.
* Moderation protection preventing suspended or banned users from modifying records.
* Public reads restricted to verified active jobs, active business profiles, and marketplace items.

### 18.4 Firebase Storage Rules
* Resumes (`resumes/{uid}/*`): Strictly restricted to PDF MIME type (`application/pdf`) under 5MB.
* Company Media: Restricted to valid image (`image/*`) or video (`video/*`) formats under 10MB.

### 18.5 Maintenance Mode Gate (`MaintenanceGate.tsx`)
* Controlled dynamically via Firestore document `platformSettings/public.maintenance`.
* When activated, public traffic sees a friendly maintenance notice while `/admin/**` and `/login` remain accessible.

---

## 19. Design System, Microcopy & Bilingual (English + தமிழ்) Localization

### 19.1 Bilingual Microcopy
Every major user touchpoint provides English and Tamil translations:
* `Jobs / வேலைகள்`
* `Post Job / வேலை பதிவிடு`
* `Dashboard / டாஷ்போர்ட்`
* `Applied / விண்ணப்பித்தவை`
* `Alerts / அறிவிப்புகள்`
* `Business / வணிகங்கள்`

### 19.2 Role-Based Color Pillars
* **Seeker Portal:** Emerald / Cyan gradient (`--seeker-*`).
* **Employer Portal:** Royal Blue / Indigo gradient (`--employer-*`).
* **Admin Portal:** Violet / Purple gradient (`--admin-*`).

---

## 20. Architectural Consolidation & Flutter Companion App Removal History

Per [`THENIJOBS_FLUTTER_REMOVAL_REPORT.md`](file:///d:/project/thenijobs-web-main/THENIJOBS_FLUTTER_REMOVAL_REPORT.md), the earlier separate Flutter companion application (`thenijobs_app`) was safely removed and consolidated into the Next.js 16 Responsive Web Application & Progressive Web App (PWA):

1. **Rationale:** Eliminates duplicate codebase overhead, dual app store update review cycles, and native build toolchain dependencies, while providing an identical mobile experience via responsive viewports and PWA home-screen installation.
2. **Preservation:** 100% of cloud collections, Firebase Auth users, payment flows, and business logic were preserved.
3. **Outcome:** A single, high-performance, 100% test-verified codebase running on Next.js 16.3.4.

---

## 21. Complete "ALL-OK" Verification Audit, Test Results & Route/API Inventory

### 21.1 Verification Audit Results

```
========================================================================================
THENIJOBS ECOSYSTEM HEALTH CHECK & VERIFICATION AUDIT
========================================================================================
[✓] Automated Test Suite (npm test): 453 / 453 PASSED (94 suites, 0 failures, 2.5s)
    • Domain Redirection & Proxy Loop Prevention Tests: PASSED (9/9)
    • Payment Verification Tests (HMAC-SHA256, atomic merge writes): PASSED
    • Dynamic 100-Slogan Rotation & Service Tests: PASSED
    • Candidate Match Score & Proximity Engine Tests: PASSED
    • Career Growth & Academy LMS Tests: PASSED
    • Candidate Portfolio Preview, Username & Indexing Tests: PASSED
    • Table-Top Standee & Hiring Poster Generator Tests: PASSED
    • WhatsApp 1-Click Direct Apply & Alerts Tests: PASSED
[✓] Next.js Production Build (npx next build): 105+ PAGES GENERATED, 0 ERRORS
    • Next.js 16 Edge Proxy: ƒ Proxy (Middleware) — 0 DEPRECATION WARNINGS
[✓] TypeScript Type Check (npx tsc --noEmit): 0 ERRORS
[✓] ESLint Code Quality Inspection (npm run lint): 0 ERRORS
[✓] Node.js Package Module Type: "type": "module" enabled — 0 MODULE WARNINGS
[✓] Database Connectivity: 100% of pages verified against Firestore / API routes
========================================================================================
OVERALL STATUS: ALL OK — 100% PRODUCTION READY
========================================================================================
```

### 21.2 Complete Route, Page & API Inventory

#### A. Public Web Pages
* `/` — Platform Homepage (16 components, Live updates ticker, Walk-in banner)
* `/jobs` — Searchable Job Directory with filters (auto-excludes expired jobs)
* `/jobs/[id]` — Dynamic Job Detail & Application View (role-based access; candidate-safe screen for expired jobs)
* `/businesses` & `/businesses/[category]` — Business Directory & Category Listings
* `/companies` & `/companies/[slug]` — Company Profile directory
* `/company/[slug]` & `/[companySlug]` — Public Business Profile & Catalog
* `/company/register` & `/register-business` — Business Registration Onboarding
* `/services` — Permanent 301 redirect to `/marketplace?type=services`
* `/marketplace` — Product & Service Marketplace
* `/marketplace/[type]/[companySlug]/[itemId]` — Product & Service Detail View
* `/courses` & `/courses/[slug]` — THENIJOBS Academy Skill Courses & Lessons
* `/verify-certificate/[id]` — Public Cryptographic Certificate Verification Portal
* `/job-seeker/[username]` — Public Candidate Portfolio View
* `/pricing` — Subscription Plans & Feature Matrix
* `/daily-jobs` — Daily Stream of New Jobs
* `/jobs-in-theni`, `/jobs-in-andipatti`, `/jobs-in-bodinayakanur`, `/jobs-in-chinnamanur`, `/jobs-in-cumbum`, `/jobs-in-periyakulam`, `/jobs-in-uthamapalayam`, `/jobs-in-madurai`, `/jobs-in-dindigul` — Local Taluk Job Portals
* `/about`, `/contact`, `/privacy`, `/terms`, `/cookies` — Core Platform Pages

#### B. Ambassador & Referral Routes
* `/ambassador` — Public Village Ambassador Landing & 1-Minute Registration
* `/ambassador/dashboard` — Ambassador Portal (Referral Link, WhatsApp Sharing Kit, Earnings & Payout Requests)

#### C. Authentication Routes
* `/login` — Unified Login (Email, Phone OTP, Voice Call OTP, Google OAuth)
* `/register` — 3-Step Multi-role Registration Wizard
* `/forgot-password` & `/reset-password` — Password Recovery & Business Account Recovery

#### D. Job Seeker Routes (`/seeker/*`)
* `/seeker/dashboard` — Seeker Overview, Stats, Strength Gauge
* `/seeker/profile` & `/seeker/skills` — Profile & Skills Editor
* `/seeker/resume` — Resume Vault & Download
* `/seeker/resume/builder` — Dual-Mode High-Definition ATS Resume Builder
* `/seeker/resume/analyze` — AI ATS Resume Analyzer
* `/seeker/jobs` & `/seeker/jobs/recommended` — Job Search & AI Matches
* `/seeker/applications` — Application Status Pipeline
* `/seeker/interviews` — Scheduled Interviews
* `/seeker/saved-jobs` — Bookmarked Listings
* `/seeker/job-alerts` — Notification Preferences
* `/seeker/ai-coach`, `/seeker/ai-chat`, `/seeker/ai` — AI Career Suite & BYOK Key Settings
* `/seeker/id-card` — Digital Seeker Identity Card & QR Code
* `/seeker/website` — Seeker Portfolio Website Editor (4 Templates)
* `/seeker/subscription` — Pro Candidate Plan (₹199/quarter) Checkout & Status
* `/seeker/become-employer` — Upgrade Account Role
* `/seeker/notifications` & `/seeker/messages` — Notification Feed & Recruiter Chat
* `/seeker/settings` — Account & Multi-Channel Notification Matrix

#### E. Employer Routes (`/employer/*`)
* `/employer/dashboard` — Employer Overview & Analytics
* `/employer/post-job` — Multi-Step Job Posting Engine
* `/employer/jobs` & `/employer/jobs/[id]` — Manage Posted Jobs, Expired Listings & Applicants
* `/employer/jobs/[id]/posters` — Printable A4 Hiring Posters & WhatsApp Status Banners
* `/employer/standee` — Table-Top QR Counter Standee Studio
* `/employer/candidates` — Candidate ATS Pipeline
* `/employer/interviews` — Schedule & Manage Candidate Interviews
* `/employer/talent-search` — Candidate Resume Database Search
* `/employer/company-profile` — Company Profile, Logo, Banners, Media
* `/employer/website`, `/employer/website/editor`, `/employer/website/templates`, `/employer/website/settings` — Business Website Builder (16 Templates)
* `/employer/id-card` — Digital Visiting Card & Staff ID Generator
* `/employer/leads` — Inbound Customer Inquiries & CRM
* `/employer/messages` — Candidate Direct Messages
* `/employer/billing` & `/employer/subscription` — Razorpay Checkout & Invoices
* `/employer/ai` — AI Job Description, Candidate Matcher & BYOK Key Settings
* `/employer/reports` — Analytics on Views & Applicants
* `/employer/reviews` — Company Reviews & Ratings Management
* `/employer/settings` — Company Notification Preferences

#### F. Admin Routes (`/admin/*`)
* `/admin/login` — Dedicated Admin Authentication Screen
* `/admin/dashboard` — Platform KPIs, Approvals, Health Stats
* `/admin/users` & `/admin/users/create` — User Ledger & Verification
* `/admin/businesses` & `/admin/business-approvals` — Business Directory Moderation
* `/admin/business-recovery` — Account Recovery Review & Password Reset Tokens
* `/admin/businesses/import` — Bulk Excel/CSV Business Importer
* `/admin/businesses/website-health` — Portfolio Website Health Monitor
* `/admin/businesses/[id]` (and subpages: `/jobs`, `/profile`, `/website`) — Deep Company Controls
* `/admin/company-accounts` — Multi-User Company Accounts Manager
* `/admin/database-cleanup` — Orphan & Stale Data Cleanup Utility
* `/admin/jobs` & `/admin/jobs/create` — Job Listing Moderation, Expired Tabs, 30-Day Renewal & 7-Day SLA System
* `/admin/career-growth` — THENIJOBS Academy Curriculum & Quiz Management
* `/admin/leads` — Platform-wide Leads Overview
* `/admin/services` — Service Directory Moderation
* `/admin/subscriptions` — Transactions & Plan Activations
* `/admin/ambassadors` — Village Ambassador Network & UPI Payouts Processing
* `/admin/slogans` — Dynamic Growth Slogans Management & Customization
* `/admin/reviews` — Content Moderation
* `/admin/reports` — Financial & Growth Analytics
* `/admin/ai-settings` & `/admin/ai-analytics` — AI Gateways & Usage Limits
* `/admin/notifications` — System Broadcast Announcements
* `/admin/security` — Activity Logs & IP Audit Trail
* `/admin/seo` — Global SEO & Google Indexing Submissions
* `/admin/errors` — Crash Logs & Error Diagnostics
* `/admin/settings` — Platform Parameters, Maintenance Mode & Master Controls

#### G. Server API Endpoints (`/api/*`)
* **AI & BYOK:**
  * `POST /api/ai` — Multi-model AI generation router (Gemini, Groq, OpenAI)
  * `POST /api/ai/test` — Gateway health test endpoint
  * `POST /api/ai/connections/connect` — Connect personal OpenAI/Gemini API key
  * `POST /api/ai/connections/disconnect` — Unlink API key preserving paid entitlement
  * `GET  /api/ai/connections/status` — Get personal key connection state
  * `POST /api/ai/connections/test` — Test personal API key credentials
  * `POST /api/ai/connections/fee/create-order` — Create Razorpay order for ₹50 AI connection fee
  * `POST /api/ai/connections/fee/webhook` — Razorpay webhook activating AI key connection
* **Scheduled Cron Jobs:**
  * `GET  /api/cron/expire-jobs` — Nightly 01:00 UTC job expiry engine
  * `GET  /api/cron/expire-trials` — Midnight 00:00 UTC company trial expiration engine
* **Authentication & OTP:**
  * `POST /api/otp/send` — Send SMS OTP via 2Factor.in
  * `POST /api/otp/verify` — Verify SMS OTP code
  * `POST /api/otp/call` — Voice call OTP fallback with server rate-limiting
  * `POST /api/auth/business-google-login` — Google sign-in with company resolution
  * `POST /api/auth/business-recovery/request` — Submit business recovery request
  * `POST /api/auth/business-recovery/verify-token` — Validate recovery token
  * `POST /api/auth/business-recovery/reset-password` — Complete password reset
* **Payment & Subscriptions:**
  * `POST /api/payment/create-order` — Create Razorpay order for employer subscription plans
  * `POST /api/payment/verify` — Verify Razorpay payment signature & issue receipt
  * `POST /api/payment/seeker-public-profile/create-order` — Create Razorpay order for ₹100/yr seeker public profile fee
  * `POST /api/payment/seeker-public-profile/webhook` — Razorpay webhook activating seeker public profile
  * `POST /api/payment/urgent-badge/create-order` — Create Razorpay order for urgent job badge
  * `POST /api/payment/urgent-badge/verify` — Verify urgent job badge payment
  * `POST /api/subscription/reconcile` — Server-side reconciliation for expired trial/subscription
  * `POST /api/subscription/request-trial` — Request 15-day free trial extension
* **Academy & LMS:**
  * `POST /api/career-growth/quiz/submit` — Submit course quiz answers and score
  * `POST /api/career-growth/certificate/issue` — Issue cryptographic course certificate
  * `GET  /api/career-growth/certificate/verify` — Verify certificate authenticity
* **Admin Management:**
  * `GET, POST /api/admin/slogans` — List and create custom slogans
  * `POST /api/admin/slogans/reset` — Reset slogans to default dictionary
  * `PUT, DELETE /api/admin/slogans/[id]` — Update or remove individual slogan
  * `GET, POST /api/admin/business-recovery/list`, `approve`, `reject` — Business recovery moderation
  * `POST /api/admin/database-cleanup` — Dry-run and execute orphan data cleanup

---

## 22. Formal Verification Statement

This document serves as the **definitive, consolidated, and authoritative single source of truth** for the entire THENIJOBS web platform and ecosystem.

* **Codebase Verification:** Cross-referenced against active production files in `thenijobs-web-main` (Next.js 16.3.4, React 19.2.4, TypeScript 5.9.3).
* **Automated Test Verification:** Validated via automated test suites:
  * Node.js native test runner (`npm test`): **453 / 453 tests passed** across 94 suites with 0 failures and 0 warnings.
  * TypeScript type check (`npx tsc --noEmit`): **0 errors**.
  * ESLint inspection (`npm run lint`): **0 errors**.
  * Next.js production build (`npx next build`): **105+ routes compiled, 0 errors, exit code 0**.
  * Edge Proxy: `src/proxy.ts` exporting `proxy` — **0 deprecation warnings**.
* **Consolidation Note:** Replaces and supersedes all fragmented or previous revisions of `FEATURES.md` and `TOTAL_FEATURES.md`.

---
*Document officially compiled, unified, and signed off for the THENIJOBS Platform Ecosystem.*
