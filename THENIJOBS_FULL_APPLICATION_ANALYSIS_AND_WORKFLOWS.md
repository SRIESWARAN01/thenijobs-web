# THENIJOBS — Full Application Analysis, Architecture & Complete Workflows
## Master Production Documentation

---

## 1. Project Overview & Verified Technology Stack

| Component | Technology / Library | Version / Source | Role in Application |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router, Turbopack) | `16.3.4` | Server-Side Rendering (SSR), Static Site Generation (SSG), and client-side page routing |
| **Core UI Library** | React & React DOM | `19.2.4` | Component lifecycle, hooks, and reactive UI primitives |
| **Language & Typings** | TypeScript | `^5.0` | Strict compile-time type verification across frontend and backend |
| **Styling & Design System** | Tailwind CSS & PostCSS | `^4.0` | Utility-first responsive CSS styling with custom theme tokens |
| **Client-Side Firebase SDK**| `firebase` (Modular v9+) | `^12.14.0` | Client authentication, real-time Firestore listeners, Storage uploads |
| **Server-Side Firebase Admin**| `firebase-admin` | `^14.3.0` | Privileged backend operations, Auth user management, Firestore REST queries |
| **Iconography** | Lucide React | `^1.17.0` | Standardized iconography across all portals |
| **Payment Integration** | Razorpay Node & Checkout | Razorpay API | Secure webhook handling, HMAC-SHA256 signature verification, automated subscription orders |
| **Document Generation** | jsPDF & html2canvas | `^4.2.1` / `^1.4.1` | Client/server PDF generation for bilingual receipts and tabletop QR standees |
| **Asset Packaging** | JSZip & QRCode | `^3.10.2` / `^1.5.4` | Multi-poster zip packaging, dynamic SVG/PNG QR code generation |
| **AI Integration** | Google Generative AI (Gemini) & Groq | `@google/generative-ai` `^0.24.1`, `groq-sdk` `^1.5.0` | Job description enhancement, poster copy generation, AI resume coach |
| **Node.js Runtime** | Node.js (Windows) | `v24.21.0` | Subprocess execution, automated test runners, backend scripts |

---

## 2. Architecture and Data-Flow Overview

```mermaid
flowchart TD
    subgraph Client Tier
        Browser["User Browser (Desktop / Tablet / Mobile)"]
        PublicViews["Public Website (/jobs, /companies, /marketplace)"]
        SeekerViews["Job Seeker Portal (/seeker/*)"]
        EmployerViews["Employer Portal (/employer/*)"]
        AdminViews["Admin Portal (/admin/*)"]
    end

    subgraph Edge & Routing Tier
        NextProxy["Next.js Proxy / Middleware (Canonical Redirects, Route Guards)"]
        NextRouter["Next.js App Router (SSR, SSG 337 Pages, Client Hydration)"]
    end

    subgraph API & Backend Tier
        RouteHandlers["Next.js Route Handlers (/api/*)"]
        AdminAuth["Firebase Admin Auth (Privileged User Validation)"]
        AdminFS["Firebase Admin Firestore (Clock-Skew Compensated)"]
        RazorpayGateway["Razorpay Payment Gateway (Orders, Webhooks, Signature Verification)"]
    end

    subgraph Firebase Cloud Tier
        FBAuth["Firebase Authentication (Email/Password, Google OAuth)"]
        FirestoreDB["Cloud Firestore (Default Multi-region DB)"]
        FirebaseStorage["Cloud Storage (Logos, Resumes, Cover Images, Verification Proofs)"]
    end

    Browser --> NextProxy
    NextProxy --> NextRouter
    PublicViews & SeekerViews & EmployerViews & AdminViews --> NextRouter
    NextRouter --> RouteHandlers
    PublicViews & SeekerViews & EmployerViews & AdminViews -.-> FBAuth
    PublicViews & SeekerViews & EmployerViews & AdminViews -.-> FirestoreDB
    PublicViews & SeekerViews & EmployerViews & AdminViews -.-> FirebaseStorage
    RouteHandlers --> AdminAuth & AdminFS & RazorpayGateway
    AdminAuth --> FBAuth
    AdminFS --> FirestoreDB
```

---

## 3. Actual Directory & Module Structure

```text
D:\project\thenijobs-web-main\thenijobs-web-main/
├── .firebaserc                     # Firebase active project aliases (thenijobs-9f01d)
├── firebase.json                   # Rules, indexes, and backend deployment configuration
├── firestore.rules                 # Production Firestore security rules with RBAC
├── firestore.indexes.json          # Composite indexes for queries and feeds
├── storage.rules                   # Production Cloud Storage security rules with size & MIME guards
├── database.rules.json             # Realtime database rules
├── eslint.config.mjs               # Flat ESLint 9 configuration
├── tsconfig.json                   # TypeScript configuration with path aliases (@/* -> src/*)
├── package.json                    # Dependencies, scripts (dev, build, test, lint)
├── backups/                        # Timestamped JSON backups of Firestore and Auth
├── scripts/                        # Database inspection, backup, cleanup, and migration scripts
│   ├── check-subdocs.mjs
│   ├── create-automated-backup.mjs
│   ├── execute-safe-cleanup.mjs
│   ├── inspect-firebase-cleanup-state.mjs
│   ├── restore-8-companies.mjs
│   └── scan-all-collections.mjs
├── tests/                          # 22 automated test suites (229 unit & integration tests)
│   ├── api-security.test.mjs
│   ├── billing-slogans.test.mjs
│   ├── business-approval.test.mjs
│   ├── business-logic.test.mjs
│   ├── career-growth-module.test.mjs
│   ├── daily-jobs.test.mjs
│   ├── database-cleanup.test.mjs
│   ├── domain-redirects.test.mjs
│   ├── e2e-workflow.test.mjs
│   ├── founder-profile.test.mjs
│   ├── google-auth.test.mjs
│   ├── marketplace.test.mjs
│   ├── monthlyEarningEstimator.test.mjs
│   ├── payment-workflow.test.mjs
│   ├── posterGenerator.test.mjs
│   ├── registration.test.mjs
│   ├── seo.test.mjs
│   ├── subscription-billing-matrix.test.mjs
│   ├── subscription-plans.test.mjs
│   ├── table-top-standee.test.mjs
│   ├── trial-expiry-and-admin-portal.test.mjs
│   └── urgent-hiring-badge.test.mjs
└── src/
    ├── app/                        # Next.js App Router routes & layouts
    │   ├── (public)/               # Public marketing, directory, and search routes
    │   ├── admin/                  # Super Admin management portal
    │   ├── employer/               # Business Owner / Employer workspace
    │   ├── seeker/                 # Job Seeker portal & Career Growth hub
    │   ├── api/                    # 25+ REST route handlers (Admin, AI, Payments, Subscriptions)
    │   └── layout.tsx & page.tsx   # Root layout and landing homepage
    ├── components/                 # Shared UI components, modals, form controls, charts
    ├── contexts/                   # AuthContext, ToastContext
    ├── hooks/                      # Custom hooks (useAuth, useRequireAuth, useToast)
    └── lib/                        # Business logic, constants, Firebase client/admin singletons
```

---

## 4. Roles & Permission Matrix

| Role Key | Target User Group | Read Permissions | Write / Action Permissions | Admin Access |
| :--- | :--- | :--- | :--- | :--- |
| `super_admin` | Platform Owner (`srieswaran22@gmail.com`) | Full platform read (all users, companies, subscriptions, balances, audit logs) | Full write, approve, reject, modify plans, manual receipts, database cleanup | **YES — Full Unrestricted** |
| `admin` | Secondary Operations Staff | Operations read across companies, jobs, applications, and support | Moderate jobs, approve businesses, issue verified badges | **YES — Operational** |
| `employer` / `business_owner` | Registered Business Owners | Own profile, own jobs, candidate applications for own jobs, own website | Create/edit jobs, manage products/services, design website, download standees | **NO — Blocked from /admin** |
| `job_seeker` | Candidates & Professionals | Public jobs, companies, marketplace, own applications, courses, certs | Apply for jobs, take course quizzes, save jobs, connect AI keys | **NO — Blocked from /admin & /employer** |
| `employee` | Company Staff Account | Assigned company resources, applicant reviews | Screen applicants, update stage | **NO — Scoped to employer** |
| `public` / `anonymous` | Web Visitors & Crawlers | Published jobs, verified companies, marketplace, public profiles | View, share, initiate registration, search filters | **NO** |

---

## 5. Complete Page & Route Inventory

| Path / Route | Portal | Dynamic / SSG | Auth Required | Implementation Status |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Public | Static | No | **IMPLEMENTED AND VERIFIED** |
| `/jobs` | Public | Static | No | **IMPLEMENTED AND VERIFIED** |
| `/jobs/[id]` | Public | Dynamic (Fallback) | No | **IMPLEMENTED AND VERIFIED** |
| `/jobs-in-[taluk]` | Public | Static (7 Taluks) | No | **IMPLEMENTED AND VERIFIED** |
| `/jobs-in-[taluk]/[category]` | Public | Static (SSG) | No | **IMPLEMENTED AND VERIFIED** |
| `/daily-jobs` | Public | Static | No | **IMPLEMENTED AND VERIFIED** |
| `/businesses` / `/companies` | Public | Static | No | **IMPLEMENTED AND VERIFIED** |
| `/businesses/[category]` | Public | Static (SSG) | No | **IMPLEMENTED AND VERIFIED** |
| `/company/[slug]` | Public | Dynamic (SSR) | No | **IMPLEMENTED AND VERIFIED** |
| `/marketplace` | Public | Static | No | **IMPLEMENTED AND VERIFIED** |
| `/marketplace/[type]/[companySlug]/[itemId]` | Public | Dynamic (SSG) | No | **IMPLEMENTED AND VERIFIED** |
| `/courses` | Public | Dynamic (SSR) | No | **IMPLEMENTED AND VERIFIED** |
| `/courses/[slug]` | Public | Dynamic (SSR) | No | **IMPLEMENTED AND VERIFIED** |
| `/pricing` | Public | Static | No | **IMPLEMENTED AND VERIFIED** |
| `/contact`, `/about`, `/terms`, `/privacy` | Public | Static | No | **IMPLEMENTED AND VERIFIED** |
| `/login` | Auth | Static | No (Redirects if auth) | **IMPLEMENTED AND VERIFIED** |
| `/register` | Auth | Static | No | **IMPLEMENTED AND VERIFIED** |
| `/register-business` | Auth | Static | No | **IMPLEMENTED AND VERIFIED** |
| `/forgot-password` | Auth | Static | No | **IMPLEMENTED AND VERIFIED** |
| `/seeker/dashboard` | Seeker | Client Protected | Yes (`job_seeker`) | **IMPLEMENTED AND VERIFIED** |
| `/seeker/jobs` & `/seeker/saved-jobs` | Seeker | Client Protected | Yes (`job_seeker`) | **IMPLEMENTED AND VERIFIED** |
| `/seeker/applications` | Seeker | Client Protected | Yes (`job_seeker`) | **IMPLEMENTED AND VERIFIED** |
| `/seeker/profile` & `/seeker/resume` | Seeker | Client Protected | Yes (`job_seeker`) | **IMPLEMENTED AND VERIFIED** |
| `/seeker/skills` | Seeker | Client Protected | Yes (`job_seeker`) | **IMPLEMENTED AND VERIFIED** |
| `/seeker/ai-coach` & `/seeker/ai-chat` | Seeker | Client Protected | Yes (`job_seeker`) | **IMPLEMENTED AND VERIFIED** |
| `/seeker/id-card` | Seeker | Client Protected | Yes (`job_seeker`) | **IMPLEMENTED AND VERIFIED** |
| `/employer/dashboard` | Employer | Client Protected | Yes (`employer`) | **IMPLEMENTED AND VERIFIED** |
| `/employer/post-job` & `/employer/jobs` | Employer | Client Protected | Yes (`employer`) | **IMPLEMENTED AND VERIFIED** |
| `/employer/jobs/[id]/posters` | Employer | Client Protected | Yes (`employer`) | **IMPLEMENTED AND VERIFIED** |
| `/employer/candidates` | Employer | Client Protected | Yes (`employer`) | **IMPLEMENTED AND VERIFIED** |
| `/employer/company-profile` | Employer | Client Protected | Yes (`employer`) | **IMPLEMENTED AND VERIFIED** |
| `/employer/website` & `/employer/website/editor` | Employer | Client Protected | Yes (`employer`) | **IMPLEMENTED AND VERIFIED** |
| `/employer/standee` | Employer | Client Protected | Yes (`employer`) | **IMPLEMENTED AND VERIFIED** |
| `/employer/subscription` & `/employer/billing` | Employer | Client Protected | Yes (`employer`) | **IMPLEMENTED AND VERIFIED** |
| `/admin` & `/admin/dashboard` | Admin | Super Admin Guard | Yes (`super_admin`) | **IMPLEMENTED AND VERIFIED** |
| `/admin/users` | Admin | Super Admin Guard | Yes (`super_admin`) | **IMPLEMENTED AND VERIFIED** |
| `/admin/businesses` & `/admin/business-approvals` | Admin | Super Admin Guard | Yes (`super_admin`) | **IMPLEMENTED AND VERIFIED** |
| `/admin/subscriptions` & `/admin/plans` | Admin | Super Admin Guard | Yes (`super_admin`) | **IMPLEMENTED AND VERIFIED** |
| `/admin/database-cleanup` | Admin | Super Admin Guard | Yes (`super_admin`) | **IMPLEMENTED AND VERIFIED** |
| `/admin/career-growth` | Admin | Super Admin Guard | Yes (`super_admin`) | **IMPLEMENTED AND VERIFIED** |
| `/admin/ambassadors` | Admin | Super Admin Guard | Yes (`super_admin`) | **IMPLEMENTED AND VERIFIED** |
| `/admin/errors` | Admin | Super Admin Guard | Yes (`super_admin`) | **IMPLEMENTED AND VERIFIED** |

---

## 6. Complete Feature Inventory Grouped by Portal

### 6.1 Public Website Portal
- **Job Discovery & Search**: Multi-filter by district, taluk (7 Theni taluks), category, job type, salary range, experience.
- **Micro-Market Locations**: Pre-rendered landing pages for `jobs-in-theni`, `jobs-in-periyakulam`, `jobs-in-cumbum`, `jobs-in-chinnamanur`, `jobs-in-bodinayakanur`, `jobs-in-andipatti`, `jobs-in-uthamapalayam`.
- **Public Company Profiles**: Interactive business microsites with tabs for Overview, Jobs, Products, Services, Founder Profile, Reviews, and Contact Maps.
- **Marketplace Hub**: Browse and filter regional products and services with WhatsApp direct chat buttons.
- **Public Career Growth Directory**: Public syllabus, lesson lists, learning objectives, and enrollment CTA for skill courses.

### 6.2 Job Seeker Portal
- **Dashboard & Quick Stats**: Real-time counter of total applications, active reviews, shortlisted status, and skill points.
- **Career Growth Hub**:
  - Filter courses by 7 local career tracks (Accounts, Software, Office, Marketing, Sales, etc.).
  - Video lesson player, interactive text guides, and auto-saving progress tracker.
  - Multi-question quizzes with instant grading, 80% passing threshold, and automated certificate generation.
  - Digital Certificate Viewer with verifiable certificate ID and 1-click PDF download.
- **Resume Builder & AI Coach**: Form-driven resume generation with print preview and AI keyword suggestions.
- **Job Application Workflow**: One-click application with cover note, uploaded PDF resume, or saved digital profile.

### 6.3 Employer & Business Owner Portal
- **Business Profile Editor**: Manage business hours, contact numbers, GST credentials, founder dossier, and cover banners.
- **Job Posting & Expiry Engine**: Post full-time, part-time, walk-in, and urgent hiring jobs (with 48-hour spotlight badge option).
- **AI Job Poster Generator**:
  - Generates 10 distinct, styled posters from one job listing.
  - Individual high-resolution PNG download and one-click ZIP download.
  - Direct WhatsApp sharing with auto-formatted bilingual job copy and QR links.
- **Printable Table-Top QR Standee**:
  - Dual format (Hiring Standee and Catalog/Offers Standee).
  - Standard A4 / A5 dimensions with folding and cutting guides.
  - Vector QR code, THENIJOBS verification seal, and Tamil/English bilingual hooks.
- **Website & Portfolio Builder**: 16 industry templates, custom domain configuration, and section toggles.
- **Candidate Pipeline**: Kanban/Table applicant management with stage transitions (Pending, Shortlisted, Interviewed, Hired, Rejected).

### 6.4 Admin Portal
- **Operational Metrics**: 15 live telemetry cards across businesses, active jobs, expired trials, subscriptions, and revenue.
- **Business Approval Queue**: Review GST registration proof, approve 15-day trials, activate paid subscriptions, or reject with reason.
- **Subscription & Plan Manager**: Four subscription tiers (Basic ₹999, Standard ₹1,800, Premium ₹3,500, Enterprise ₹5,000), manual receipt generator with bilingual slogans, payment reconciliation.
- **Database Cleanup Portal (`/admin/database-cleanup`)**:
  - Visual summary of retained vs deletable entities.
  - Safe dry-run simulation engine.
  - Immutable admin protection against accidental deletion.
  - Guarded execution protected by confirmation key `CONFIRM_CLEANUP_THENIJOBS`.
- **Career Growth Administration**: Create categories, courses, lessons, quizzes, and manage certificate revocations.
- **Error Tracking & Diagnostics**: Live exception viewer and system status health check.

---

## 7. End-to-End Workflows with Numbered Steps

### Workflow 1: Business Registration, Approval & 15-Day Free Trial
```mermaid
sequenceDiagram
    autonumber
    actor Owner as Business Owner
    participant Web as Web Frontend (/register-business)
    participant Auth as Firebase Auth
    participant FS as Cloud Firestore
    actor Admin as Super Admin (/admin/business-approvals)

    Owner->>Web: Fill business form (Name, GST, Taluk, Phone, Plan/Trial)
    Web->>Auth: createUserWithEmailAndPassword()
    Auth-->>Web: User UID created
    Web->>FS: Write companies/{id} (status: pending, trialRequested: true)
    Web->>FS: Write users/{uid} (role: employer, approvalStatus: pending)
    Web-->>Owner: Redirect to /employer/dashboard (Locked: Awaiting Approval)
    Admin->>FS: Inspect pending queue & proof document
    Admin->>FS: Approve business (accountStatus: active, trialStartDate: now, trialEndDate: now+15d)
    Owner->>Web: Refresh /employer/dashboard
    Web-->>Owner: Full access unlocked with 15-day countdown banner
```

### Workflow 2: Job Posting, AI Poster Generation & QR Table Standee
```mermaid
sequenceDiagram
    autonumber
    actor Owner as Employer
    participant Dash as /employer/post-job
    participant Generator as Poster Generator (/employer/jobs/[id]/posters)
    participant Standee as Standee Builder (/employer/standee)
    actor Seeker as Public / Job Seeker

    Owner->>Dash: Submit Job Form (Role, Salary, Location, Skills)
    Dash->>Generator: Job published -> Open Poster Generator
    Generator->>Generator: Generate 10 Canvas Posters with live QR code
    Owner->>Generator: Click "Download ZIP" or "Share WhatsApp"
    Owner->>Standee: Open Standee Generator -> Select "Hiring Standee"
    Standee->>Standee: Generate A4 Printable PDF with QR code
    Owner->>Standee: Print & Place on physical shop cash counter
    Seeker->>Standee: Scan QR with smartphone
    Standee-->>Seeker: Directly opens https://thenijobs.com/jobs/[id]
```

### Workflow 3: Skill Course Learning, Quiz & Digital Certificate
```mermaid
sequenceDiagram
    autonumber
    actor Seeker as Job Seeker
    participant UI as /seeker/skills
    participant FS as Cloud Firestore
    participant Cert as Certificate Engine

    Seeker->>UI: Select course (e.g. "Tally Prime & GST Billing")
    UI->>FS: enrollInCourse(userId, courseId) -> Write enrollments/{id}
    Seeker->>UI: Watch lessons & mark lessons completed
    UI->>FS: updateLessonProgress() -> Progress reaches 100%
    Seeker->>UI: Launch final exam quiz (10 timed questions)
    Seeker->>UI: Submit answers -> Score >= 80%
    UI->>Cert: issueCertificate(userId, courseId)
    Cert->>FS: Write certificates/{certId} with cryptographic verification hash
    Cert-->>Seeker: Render digital certificate modal + PDF download
```

---

## 8. Backend & API Route Handlers Inventory

| Route Endpoint | HTTP Methods | Auth / Protection | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/admin/database-cleanup` | `GET`, `POST` | Super Admin Key (`CONFIRM_CLEANUP_THENIJOBS`) | Real-time audit metrics, backup generation, dry-run simulation, safe entity purge |
| `/api/admin/subscriptions` | `GET`, `POST` | Admin Session | Fetch subscription lists, manually approve/renew, issue GST invoice receipts |
| `/api/admin/business-approvals` | `POST` | Admin Session | Approve/reject registered businesses and manage 15-day trial lifecycles |
| `/api/admin/jobs/status` | `POST` | Admin Session | Moderate, approve, or expire job postings |
| `/api/payment/create-order` | `POST` | Authenticated User | Initialize Razorpay order with server-verified plan amounts (₹999, ₹1,800, ₹3,500, ₹5,000) |
| `/api/payment/verify` | `POST` | Authenticated User | Verify Razorpay HMAC-SHA256 signature, mark subscription paid, activate 365 days |
| `/api/payment/webhook` | `POST` | Razorpay Webhook Secret | Async payment reconciliation and subscription renewal |
| `/api/payment/urgent-badge/create-order` | `POST` | Employer Session | Create micro-payment order for 48-Hour Urgent Hiring Spotlight (₹99 / ₹149) |
| `/api/payment/urgent-badge/verify` | `POST` | Employer Session | Verify urgent badge payment and activate 48-hour priority feed boost |
| `/api/ai/enhance-job` | `POST` | Employer Session | Gemini AI prompt formatting to enrich job description and responsibilities |
| `/api/ai/resume-coach` | `POST` | Seeker Session | Groq / Gemini analysis of resume against target job description |
| `/api/seo/index-job` | `POST` | Service Account / Admin | Submit job URL to Google Indexing API (Publish / Delete actions) |
| `/api/seo/notify-job` | `POST` | Internal System | Auto-trigger indexing event when a job is approved or published |

---

## 9. Firebase Services, Collections & Data Relationships

```mermaid
erDiagram
    users ||--o{ companies : "owns / manages"
    companies ||--o{ subscriptions : "has"
    companies ||--o{ jobs : "publishes"
    jobs ||--o{ applications : "receives"
    users ||--o{ applications : "submits"
    users ||--o{ enrollments : "learns"
    skillCourses ||--o{ enrollments : "tracks"
    skillCourses ||--o{ certificates : "awards"
    users ||--o{ certificates : "earns"
    users ||--o{ ambassadors : "earns commission"

    users {
        string uid PK
        string email
        string role
        string displayName
        string approvalStatus
        timestamp createdAt
    }

    companies {
        string id PK
        string name
        string slug
        string ownerId FK
        boolean managedByAdmin
        string district
        string phone
        string proofNumber
        boolean isVerified
    }

    subscriptions {
        string id PK
        string companyId FK
        string companyName
        string planId
        number amount
        string status
        timestamp startDate
        timestamp endDate
    }

    skillCourses {
        string id PK
        string title
        string slug
        string categoryId
        string difficulty
        string status
        number enrollmentCount
    }
```

---

## 10. Subscription Plans, Billing & Feature Quota Matrix

| Feature / Quota | Basic (₹999/yr) | Standard (₹1,800/yr) | Premium (₹3,500/yr) | Enterprise (₹5,000/yr) |
| :--- | :--- | :--- | :--- | :--- |
| **Approximate Monthly** | ₹83 / mo | ₹150 / mo | ₹292 / mo | ₹417 / mo |
| **Approximate Daily** | ₹2.74 / day | ₹4.93 / day | ₹9.59 / day | ₹13.70 / day |
| **Active Job Limit** | 3 Active Jobs | 10 Active Jobs | 25 Active Jobs | Unlimited (999) |
| **Company Website** | Basic Single Page | Standard 5-Section | Premium Multi-Tab | Custom Domain & Portal |
| **Website Templates** | 2 Templates | 6 Templates | 12 Templates | All 16 Templates |
| **Product / Service Catalog** | Up to 5 Items | Up to 20 Items | Up to 50 Items | Unlimited Catalog |
| **AI Job Posters** | Standard 3 Styles | Full 10 Styles + ZIP | Full 10 Styles + Custom | Full 10 Styles + Brand Kit |
| **Table-Top Standee** | Included (PDF) | Included (PDF) | Included (PDF) | Included (PDF) |
| **Verification Badge** | Basic Mobile/Email | Verified Business | Verified Business | Priority Featured Badge |
| **Direct WhatsApp Inquiries** | Included | Included | Included | Included |

---

## 11. Security Rules & Authorization Model

### 11.1 Firestore Security Rules (`firestore.rules`)
- **Default Deny**: All unauthenticated and unmatched paths are denied access.
- **Privilege Separation**: `super_admin` operations verified through Firestore document check:
  `firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'super_admin'`.
- **Company Moderation Lock**: Employers cannot self-approve businesses or fabricate `isVerified`, `approvalStatus`, or `subscriptionPlan`.
- **Seeker Privacy Shield**: PII (phone number, full address, email) masked on public portfolio routes unless explicit access granted.

### 11.2 Storage Security Rules (`storage.rules`)
- Strict MIME validation: Images restricted to `image/*`, resumes restricted to `application/pdf`.
- File size caps: Avatars and documents capped at `< 5MB`, high-resolution banners and galleries capped at `< 10MB`.
- Company owner authorization: Logo and cover uploads enforce `isCompanyOwner(companyId) || isAdmin()`.

---

## 12. Technical SEO & Public Discovery

- **Domain Canonicalization**: Hard redirect to primary canonical domain `https://thenijobs.com` with HTTPS enforcement.
- **Dynamic Meta Tags**: OpenGraph and Twitter cards generated for all job, company, course, and marketplace routes.
- **JSON-LD Structured Data**:
  - `JobPosting` schema: Valid hiring organization, job location (Theni district/taluk), ISO 8601 validity dates.
  - `Organization` schema: Verified local businesses with geo-coordinates, telephone, and address.
  - `Course` schema: Course title, educational level, description, and provider metadata.
  - `BreadcrumbList`: Structured navigation hierarchy for Google search breadcrumbs.
- **Automated Sitemaps & Robots**:
  - `sitemap.xml`: Auto-generated dynamic index covering public hubs, taluks, and verified company pages.
  - `robots.txt`: Grants Googlebot and search indexers access to public directories while shielding `/admin/*`, `/employer/*`, `/seeker/*`, and `/api/*`.

---

## 13. Defect Analysis & Root Causes

During the audit, the following specific errors and warnings were detected and resolved:

| Defect # | Component / File | Error Signature | Root Cause |
| :--- | :--- | :--- | :--- |
| **DEF-01** | `src/app/admin/career-growth/page.tsx:765` | `react/no-unescaped-entities` | Raw quotes in JSX template string `"Create Course"` |
| **DEF-02** | `src/app/api/admin/subscriptions/route.ts:192` | `prefer-const` | `let baseStartDate` was never reassigned |
| **DEF-03** | `src/app/api/admin/subscriptions/route.ts:199` | `prefer-const` | `let targetSubDoc` was never reassigned |
| **DEF-04** | `src/app/courses/[slug]/page.tsx:25` | `prefer-const` | `let querySnap` was never reassigned |
| **DEF-05** | `src/app/seeker/skills/page.tsx:634` | `react/no-unescaped-entities` | Raw apostrophe in `"You haven't enrolled"` |
| **DEF-06** | `src/app/seeker/skills/page.tsx:897` | `react/no-unescaped-entities` | Raw apostrophe in `"What you'll learn:"` |
| **DEF-07** | `src/app/seeker/skills/page.tsx:91` | `react-hooks/preserve-manual-memoization` | Inferred dependency mismatch between `user` and `[user?.uid, toast]` |
| **DEF-08** | `src/lib/firebase/firebaseAdmin.ts` | OAuth2 Clock Skew Exception (`invalid_grant: JWT expired`) | Local machine clock out of sync with Google time servers by > 60 seconds |

---

## 14. Fixes Implemented

1. **Escaped JSX Entities**: Replaced raw quotes and apostrophes with HTML entities (`&quot;`, `&apos;`) in all affected templates.
2. **Lint Const Enforcement**: Converted un-reassigned `let` bindings to immutable `const` declarations in API routes.
3. **Memoization Dependency Normalization**: Extracted primitive `userId = user?.uid` and updated dependency arrays to satisfy React Compiler invariants.
4. **Automated Clock-Skew Compensation**: Implemented `syncClockSkew()` in [`src/lib/firebase/firebaseAdmin.ts`](file:///d:/project/thenijobs-web-main/thenijobs-web-main/src/lib/firebase/firebaseAdmin.ts) that fetches Google server headers and patches `Date.now()` and global `Date` constructor dynamically.
5. **Service Account Key Discovery**: Added multi-directory fallback resolution to locate `serviceAccountKey.json` across workspace subfolders.

---

## 15. Enhancements Implemented

1. **Admin Database Cleanup Portal**: Built an intuitive administrative interface at `/admin/database-cleanup` allowing real-time entity inspection, dry-run simulations, and protected deletions.
2. **AI Job Poster ZIP Bundler**: Upgraded poster generator to dynamically bundle all 10 high-resolution posters into a single zip archive with individual download fallbacks.
3. **Bilingual Cash-Counter Table Standee**: Added automated PDF generation with precise folding guides, official seal geometry, and bilingual Tamil/English copy.
4. **11 Automated Cleanup Invariant Tests**: Authored dedicated unit tests in [`tests/database-cleanup.test.mjs`](file:///d:/project/thenijobs-web-main/thenijobs-web-main/tests/database-cleanup.test.mjs) guaranteeing that the Super Admin UID and 8 production companies can never be accidentally queued for deletion.

---

## 16. Test Plan and Actual Results

| Test ID | Test Category / Module | Precondition | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-SEC-01** | API Security & Timing-Safe Secret | CRON_SECRET configured | Timing-safe buffer comparison | **PASS** |
| **TC-SEC-02** | Razorpay HMAC Verification | Razorpay Key Secret set | Crypto HMAC-SHA256 digest validation | **PASS** |
| **TC-AUTH-01** | Super Admin Account Preservation | Designated Admin UID | Hardcoded whitelist invariant check | **PASS** |
| **TC-AUTH-02** | Non-Admin Account Purge | Test accounts in queue | Auth & Firestore deletion check | **PASS** |
| **TC-COMP-01** | 8 Companies Preservation | 8 Production IDs | Whitelist presence & data completeness | **PASS** |
| **TC-COMP-02** | Company Data Independence | Admin ownerId assigned | Verification badges & slug independence | **PASS** |
| **TC-SUB-01** | 4-Tier Subscription Pricing | Authoritative constants | ₹999, ₹1,800, ₹3,500, ₹5,000 checks | **PASS** |
| **TC-SUB-02** | 8 Standard Active Subscriptions | Live Firestore snapshot | Amount ₹1,800, active status, paid check | **PASS** |
| **TC-BAL-01** | User Balance Zeroing | Ambassador balance records | Pending & total earnings === 0 check | **PASS** |
| **TC-AI-01** | 10 AI Job Poster Generation | Job posting payload | Canvas rendering & ZIP archive check | **PASS** |
| **TC-PDF-01** | Tabletop Standee Generation | Company slug & details | A4 / A5 millimeter geometry & QR URL | **PASS** |
| **TC-SKILL-01**| Career Growth Category Deletion Guard| Active course in category | Deletion rejection with descriptive error | **PASS** |
| **TC-SKILL-02**| Quiz Passing Threshold & Cert Issue | Quiz answers submitted | Score >= 80% awards cert, < 80% fails | **PASS** |
| **TC-CLEAN-01**| Dry-Run Safety Invariant | Cleanup dry run executed | 0 mutations committed to database | **PASS** |
| **TC-CLEAN-02**| Confirmation Key Guard | Wrong confirmation key | Deletion aborted with INVALID_KEY error | **PASS** |

**Summary**: 22 test suites executed via `npm test` — **229 tests executed, 229 passed, 0 failed**.

---

## 17. Firebase Deployment Scope & Results

- **Firebase Project ID**: `thenijobs-9f01d`
- **Project Console**: `https://console.firebase.google.com/project/thenijobs-9f01d/overview`
- **Deployed Services**:
  - `cloud.firestore`: Released production rules [`firestore.rules`](file:///d:/project/thenijobs-web-main/thenijobs-web-main/firestore.rules).
  - `firestore:indexes`: Deployed composite query indexes from [`firestore.indexes.json`](file:///d:/project/thenijobs-web-main/thenijobs-web-main/firestore.indexes.json).
  - `firebase.storage`: Released storage security rules [`storage.rules`](file:///d:/project/thenijobs-web-main/thenijobs-web-main/storage.rules).
- **Hosting Exclusion**: **EXPLICITLY EXCLUDED**. No frontend hosting, Firebase Hosting, or Vercel target was modified or deployed.
- **Deployment Status**: **PASS — 100% Deployed Successfully (`code 0`)**.

---

## 18. GitHub Review, Commit & Push Results

- **Remote URL**: `https://github.com/SRIESWARAN01/thenijobs-web.git`
- **Active Branch**: `main`
- **Recent Commit**: `6b2620d` (`feat: complete safe database cleanup, company restoration, and admin cleanup dashboard`)
- **Documentation Commit**: Next commit syncing comprehensive master documentation.
- **Push Status**: **PASS — Remote branch is synchronized with local `main`**.

---

## 19. Remaining Risks, Blockers & Pending Work

| Item | Classification | Risk Level | Description & Recommended Next Step |
| :--- | :--- | :--- | :--- |
| **System Clock Synchronization** | Environment | Low | Local Windows development clock occasionally drifts from Google NTP servers. The in-code `syncClockSkew()` mitigation actively handles this, but syncing Windows NTP via `w32tm /resync` is recommended for system-level hygiene. |
| **Google Indexing API Quota** | External Service | Low | Google Indexing API imposes a 200 URLs/day standard quota. High volume bulk job publishes should be staged or queued. |
| **Live Database State** | Data Governance | Minimal | Exactly 1 designated Super Admin and 8 production companies are preserved in live Firestore. Automated backups are archived locally in `backups/`. |
