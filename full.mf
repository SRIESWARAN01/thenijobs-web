# THENIJOBS — Complete App Documentation

> **Mobile-friendly local jobs, business directory & services platform for Theni and Tamil Nadu**
> Domain: [thenijobs.com](https://thenijobs.com)

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. Tech Stack](#2-tech-stack)
- [3. User Roles & Permissions](#3-user-roles--permissions)
- [4. Public Pages (No Auth Required)](#4-public-pages-no-auth-required)
- [5. Authentication System](#5-authentication-system)
- [6. Job Seeker Portal](#6-job-seeker-portal)
- [7. Employer Portal](#7-employer-portal)
- [8. Admin Portal](#8-admin-portal)
- [9. Subscription & Pricing System](#9-subscription--pricing-system)
- [10. Data Models & Database Schema](#10-data-models--database-schema)
- [11. Firebase Security Rules](#11-firebase-security-rules)
- [12. Custom Hooks & Utilities](#12-custom-hooks--utilities)
- [13. UI Component Library](#13-ui-component-library)
- [14. SEO & Performance](#14-seo--performance)
- [15. Deployment & Hosting](#15-deployment--hosting)
- [16. Workflow Diagrams](#16-workflow-diagrams)
- [17. File & Folder Structure](#17-file--folder-structure)

---

## 1. Overview

**THENIJOBS** is a comprehensive local employment and business discovery platform focused on **Theni district** and **Tamil Nadu**. It combines:

- 🔍 **Job Portal** — Search, apply, and manage job listings
- 🏢 **Business Directory** — Discover and list verified local businesses
- 🛠️ **Service Marketplace** — Offer and find local services
- 📊 **B2B Lead Generation** — Generate and manage business leads
- 💬 **WhatsApp & Direct Contact Integration** — One-tap business communication
- 📱 **Mobile-First Design** — Fully responsive with bottom navigation and PWA support

### Key Differentiators
- **Bilingual support** (English + Tamil labels across all navigation)
- **District-focused** — Covers all 36 Tamil Nadu districts with Theni as primary
- **Multi-role platform** — Job seekers, employers, business owners, suppliers, service providers
- **Franchise-ready** architecture — District-level franchise management

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.2.7 (App Router, Static Export) |
| **Language** | TypeScript 5.x |
| **UI Library** | React 19.2.4 |
| **Styling** | Tailwind CSS 4.x + Custom CSS |
| **Fonts** | Google Fonts — Inter (body), Outfit (headings) |
| **Icons** | Lucide React |
| **Animations** | Framer Motion 12.x |
| **Forms** | React Hook Form 7.x + Zod 4.x validation |
| **State/Data** | TanStack React Query 5.x |
| **Backend/Auth** | Firebase 12.x (Auth, Firestore, Storage) |
| **UI Components** | Radix UI (Dialog, Select, Tabs, Toast, Switch, etc.) |
| **Charts** | Recharts 3.x |
| **Date Utils** | date-fns 4.x |
| **Hosting** | Firebase Hosting (static export to `out/`) |
| **Theme** | Dark mode (`#0a0a1a` base) with glassmorphism design |

---

## 3. User Roles & Permissions

### Primary Roles

| Role | Description | Portal Access |
|------|-------------|---------------|
| `job_seeker` | Users searching for employment | `/seeker/*` |
| `employer` | HR/recruiters posting jobs | `/employer/*` |
| `business_owner` | Business listing owners | `/employer/*` + business features |
| `supplier` | B2B product suppliers | Marketplace features |
| `service_provider` | Local service providers | Services marketplace |
| `admin` | Platform moderator | `/admin/*` |
| `super_admin` | Full platform control | `/admin/*` (all permissions) |

### Admin Sub-Roles

| Sub-Role | Scope |
|----------|-------|
| `super_admin` | Full access to everything |
| `admin` | All management except system settings |
| `moderator` | Content moderation (reviews, jobs, businesses) |
| `support_executive` | Support tickets & user queries |
| `sales_manager` | Leads, subscriptions, ads management |
| `franchise_admin` | District-level franchise management |

### Employer Sub-Roles

| Sub-Role | Scope |
|----------|-------|
| `company_owner` | Full company management |
| `hr_manager` | Job postings, candidate management |
| `recruiter` | Application screening, interviews |
| `branch_manager` | Branch-specific operations |
| `staff_user` | Read-only access |

---

## 4. Public Pages (No Auth Required)

### 4.1 Homepage (`/`)
A rich landing page with the following sections:

| Section | Component | Description |
|---------|-----------|-------------|
| **Header** | `Header.tsx` | Fixed navigation with logo, links, login/register CTAs |
| **Hero** | `HeroSection.tsx` | Full-width hero with bilingual tagline, unified search bar (job + location), quick-action buttons, live stats (5,200+ Jobs, 1,800+ Companies, 48,000+ Seekers), platform preview image, and live local update feed |
| **Search Hub** | `SearchHub.tsx` | Tabbed search interface for Jobs, Businesses, and Services |
| **Stats** | `StatsSection.tsx` | Animated counters showing platform metrics |
| **Categories** | `CategoriesSection.tsx` | Browse by industry category grid |
| **Trending Jobs** | `TrendingJobs.tsx` | Featured/trending job listings carousel |
| **Featured Businesses** | `FeaturedBusinesses.tsx` | Premium business listings showcase |
| **Business Updates** | `BusinessUpdates.tsx` | Latest business activity feed |
| **Testimonials** | `TestimonialsSection.tsx` | User reviews and success stories |
| **Footer** | `HomeFooter.tsx` | Site links, contact, social media |
| **Bottom Nav** | `BottomNav.tsx` | Mobile-only sticky bottom navigation |
| **WhatsApp** | `FloatingWhatsApp.tsx` | Floating WhatsApp contact button |

### 4.2 Job Listings (`/jobs`)
- **Search & Filter**: Title/skill/company search + location dropdown (Theni, Madurai, Dindigul, Coimbatore, Remote)
- **Filter Panel**: Job Type (Full Time, Part Time, Remote, WFH, Internship, Fresher, Contract) + Category filters
- **Sort Options**: Latest, Salary, Relevance
- **Job Cards**: Title, company (with verified badge), location, salary, type, posted time, openings count, skills tags
- **Actions**: Apply Now, Save/Bookmark, View Company
- **Badges**: Urgent (⚡), Premium (⭐), Verified (✓)
- **Empty State**: Friendly "No jobs found" with clear filters option

### 4.3 Job Detail (`/jobs/[id]`)
- Dynamic job detail page with full description, requirements, skills, company info

### 4.4 Business Directory (`/businesses`)
- Full business directory listing page with category filtering
- Category sub-pages (`/businesses/[category]`)

### 4.5 Company Profile (`/company/[slug]`)
- Public company profile page with details, gallery, reviews, contact info, map

### 4.6 Company Registration (`/company/register`)
- Multi-step company registration form

### 4.7 Services Directory (`/services`)
- Local services marketplace listing

### 4.8 Pricing (`/pricing`)
- Subscription plan comparison page

---

## 5. Authentication System

### 5.1 Login Page (`/login`)

**Three authentication methods:**

| Method | Flow |
|--------|------|
| **Email + Password** | Standard email/password sign-in |
| **Mobile OTP** | Indian +91 phone number → 6-digit OTP verification via Firebase Phone Auth + reCAPTCHA |
| **Google OAuth** | One-click Google sign-in popup |

**Additional features:**
- Toggle between Email and Phone modes
- Password show/hide toggle
- Forgot password link → `/forgot-password`
- Demo quick-access buttons (Seeker, Employer, Admin)
- OTP auto-focus with 6-digit input boxes

### 5.2 Registration Page (`/register`)

**3-Step Registration Wizard:**

| Step | Content |
|------|---------|
| **Step 1** | Role selection — Job Seeker, Employer/HR, Business Owner, Supplier/B2B, Service Provider (with Tamil sub-labels and descriptions) |
| **Step 2** | Basic details — Full name, mobile (+91), email, password + Google sign-up option |
| **Step 3** | OTP verification — 6-digit code sent to mobile, with resend option |

**Progress indicator:** 3-step visual progress bar with checkmarks for completed steps.

### 5.3 Forgot Password (`/forgot-password`)
- Email-based password reset flow

### 5.4 Auth Context (`AuthContext.tsx`)

The `AuthProvider` wraps the entire app and provides:

```
AuthState:     firebaseUser, user (Firestore profile), loading, error
AuthActions:   signInWithEmail, signInWithGoogle, sendPhoneOTP, verifyPhoneOTP, createAccount, logout, clearError
AuthHelpers:   isAdmin, isEmployer, isSeeker (computed booleans)
```

**On registration**, a Firestore `users/{uid}` document is seeded with role, display name, email, verification status, and timestamps.

---

## 6. Job Seeker Portal

**Route:** `/seeker/*`
**Layout:** Dedicated sidebar + top header with emerald/cyan theme

### 6.1 Navigation

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/seeker/dashboard` | Overview with stats, recent applications, recommended jobs |
| My Profile | `/seeker/profile` | Personal details, skills, experience, education |
| Resume | `/seeker/resume` | Resume builder and PDF upload/management |
| Job Search | `/jobs` | (Public) Full job search with filters |
| Applications | `/seeker/applications` | Track all submitted applications with status |
| Saved Jobs | `/seeker/saved-jobs` | Bookmarked job listings |
| Job Alerts | `/seeker/job-alerts` | Configure automated job alert preferences |
| Interviews | `/seeker/interviews` | Scheduled interview management |
| Companies | `/businesses` | (Public) Browse business directory |
| AI Coach | `/seeker/ai-coach` | AI-powered career coaching and interview prep |
| Skill Dev | `/seeker/skills` | Skill development and learning resources |
| Settings | `/seeker/settings` | Account and notification settings |

### 6.2 Key Features

- **Profile Strength Indicator** — Sidebar widget showing completion percentage (e.g., 65%) with gradient progress bar
- **"Open to Work" Status** — Visible badge in sidebar footer
- **Find Jobs CTA** — Prominent button in header
- **Application Tracking** — Status pipeline: Applied → Shortlisted → Interview Scheduled → Selected/Rejected
- **Resume Management** — Upload PDF (max 5MB), share link
- **Job Alerts** — Email + SMS notifications for matching jobs
- **Interview Scheduling** — View dates, modes (In-person, Phone, Video), meeting links

### 6.3 Seeker Profile Fields

| Field | Type |
|-------|------|
| Name, Phone, Email, Address | Basic info |
| District, State | Location (Tamil Nadu districts) |
| Profile Photo | Image upload |
| Skills | Multi-select from 45+ predefined skills |
| Experience | Company, role, dates, description (multiple entries) |
| Education | Institution, degree, field, years (multiple entries) |
| Resume | PDF upload (Firebase Storage) |
| Expected Salary | Number (INR) |
| Job Type Preference | Full-time, Part-time, Remote, etc. |
| Open to Work | Boolean toggle |
| Profile Strength | Auto-calculated 0-100% |

---

## 7. Employer Portal

**Route:** `/employer/*`
**Layout:** Dedicated sidebar + top header with cyan/emerald theme

### 7.1 Navigation

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/employer/dashboard` | Stats overview, recent activity, quick actions |
| Company Profile | `/employer/company-profile` | Manage company listing details |
| Jobs | `/employer/jobs` | Manage all posted jobs |
| Post a Job | `/employer/post-job` | Multi-step job posting form |
| Candidates | `/employer/candidates` | Browse and manage candidate applications |
| Interviews | `/employer/interviews` | Schedule and manage interviews |
| Talent Search | `/employer/talent-search` | Search job seeker database |
| Leads | `/employer/leads` | Business inquiries and lead management |
| Messages | `/employer/messages` | Direct messaging with candidates |
| Reports | `/employer/reports` | Analytics and reporting |
| Billing | `/employer/billing` | Subscription and payment management |
| Reviews | `/employer/reviews` | Manage company reviews |

### 7.2 Post Job Feature (`/employer/post-job`)

Full-featured job posting form with fields:

| Field | Details |
|-------|---------|
| Job Title | Text input |
| Description | Rich text description |
| Requirements | List of requirements |
| Skills Required | Multi-select from predefined skills |
| Location / District | Dropdown with TN districts |
| Job Type | Full-time, Part-time, Internship, Remote, WFH, Fresher, Contract |
| Salary Range | Min/max in INR |
| Experience Level | Fresher, 1-2 Years, 3-5 Years, 5-10 Years, 10+ Years |
| Education Required | Optional |
| Number of Openings | Numeric |
| Deadline | Date picker |
| Priority Flags | isUrgent, isPremium, isFeatured |

### 7.3 Candidate Pipeline

```
Applied → Shortlisted → Interview Scheduled → Selected / Rejected
```

Each stage has color-coded badges and dedicated icons for easy visual tracking.

### 7.4 Company Profile Fields

| Field Group | Fields |
|-------------|--------|
| **Basic** | Name, Logo, Cover Image, Category, Subcategory, Founded Year, Company Size, GST Number, Registration Number, Description |
| **Contact** | Phone, Alternate Phone, Email, Website, WhatsApp |
| **Location** | Address, District, State, Country, Lat/Lng, Map Embed URL |
| **Social** | Facebook, Instagram, LinkedIn, YouTube |
| **Media** | Gallery Images, Gallery Videos |
| **Services** | List of offered services |
| **Verification** | Status (Pending/Verified/Rejected), Badges (Mobile, Email, GST, Business verified) |
| **Visibility** | isActive, isFeatured, isPremium |
| **Analytics** | View Count, Enquiry Count, Rating, Review Count |
| **SEO** | Meta Title, Meta Description |

---

## 8. Admin Portal

**Route:** `/admin/*`
**Layout:** Dedicated sidebar + top header with violet/indigo theme
**Auth Guard:** Login bypass for demo, session-based admin authentication

### 8.1 Navigation

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin/dashboard` | Platform-wide KPIs, pending approvals, activity log |
| Users | `/admin/users` | User management (CRUD, role assignment, verification) |
| Businesses | `/admin/businesses` | Business listing approval & management |
| Jobs | `/admin/jobs` | Job post moderation & management |
| Leads | `/admin/leads` | Lead pipeline management |
| Services | `/admin/services` | Service listing management |
| Subscriptions | `/admin/subscriptions` | Subscription & revenue management |
| Ads | `/admin/ads` | Advertisement management |
| Reviews | `/admin/reviews` | Review moderation & flagging |
| Reports | `/admin/reports` | Platform analytics & reports |
| Notifications | `/admin/notifications` | System notification management |
| Security | `/admin/security` | Activity logs, security monitoring |
| Settings | `/admin/settings` | Platform configuration |

### 8.2 Admin Dashboard Features

| Section | Details |
|---------|---------|
| **Stats Grid** | 6 animated KPI cards — Total Users, Businesses, Active Jobs, Applications, Total Leads, Revenue (₹) — each with trend % and link to detail page |
| **Quick Actions** | 4 action cards with pending counts — Approve Users, Pending Businesses, Review Jobs, New Leads |
| **Pending Approvals** | Real-time list of businesses/jobs awaiting approval with Approve/Reject/View buttons |
| **Recent Activity** | Timeline of platform events (registrations, approvals, job posts, reviews, upgrades, leads) |
| **Revenue Overview** | Chart area with 7D/1M/3M/1Y period toggles |
| **Platform Health** | Server Uptime (99.9%), Firebase Usage (45%), Active Sessions, Error Rate (0.02%), Avg Response (120ms) |
| **District Distribution** | Bar chart showing user distribution across Theni, Madurai, Dindigul, Others |
| **Alert Banners** | Warning alerts for reported jobs + system status indicator |

### 8.3 Admin Capabilities

- **User Management** — View all users, assign roles, verify accounts, ban/delete users
- **Business Moderation** — Approve/reject business listings, manage verification badges
- **Job Moderation** — Review flagged jobs, approve/reject postings
- **Lead Management** — Pipeline: New → Contacted → Qualified → Converted → Lost
- **Revenue Tracking** — Subscription revenue, payment methods, auto-renewal management
- **Ad Management** — Banner/sponsored/featured ads with impression & click tracking
- **Review Moderation** — Flag spam reviews, manage ratings
- **Security Monitoring** — Activity logs with IP tracking, user sessions
- **Franchise Management** — District-level franchise operations

---

## 9. Subscription & Pricing System

### Plans

| Plan | Price | Period | Best For |
|------|-------|--------|----------|
| **Free** | ₹0 | Forever | Casual job seekers |
| **Basic** | ₹40/mo | Monthly | Active job seekers |
| **Premium** ★ | ₹100/mo | Monthly | Serious candidates wanting to stand out |
| **Enterprise** | ₹190/mo | Monthly | Businesses, agencies & franchise partners |

### Feature Matrix

| Feature | Free | Basic | Premium | Enterprise |
|---------|------|-------|---------|------------|
| Create basic profile | ✅ | ✅ | ✅ | ✅ |
| Search & apply to jobs | 5/mo | Unlimited | Unlimited | Unlimited |
| View business listings | ✅ | ✅ | ✅ | ✅ |
| Basic job alerts | ✅ | ✅ | ✅ | ✅ |
| Resume upload & share | ❌ | ✅ | ✅ | ✅ |
| Advanced job filters | ❌ | ✅ | ✅ | ✅ |
| Email + SMS job alerts | ❌ | ✅ | ✅ | ✅ |
| Priority support | ❌ | ✅ | ✅ | ✅ |
| Resume boost (2× visibility) | ❌ | ❌ | ✅ | ✅ |
| Direct chat with employers | ❌ | ❌ | ✅ | ✅ |
| Application analytics | ❌ | ❌ | ✅ | ✅ |
| Interview prep tips | ❌ | ❌ | ✅ | ✅ |
| Profile badge | ❌ | ❌ | ✅ | ✅ |
| Priority in search results | ❌ | ❌ | ✅ | ✅ |
| Featured profile listing | ❌ | ❌ | ❌ | ✅ |
| Dedicated account manager | ❌ | ❌ | ❌ | ✅ |
| Bulk resume access | ❌ | ❌ | ❌ | ✅ |
| Advanced analytics & reports | ❌ | ❌ | ❌ | ✅ |
| API access | ❌ | ❌ | ❌ | ✅ |
| Custom branding | ❌ | ❌ | ❌ | ✅ |
| Franchise management tools | ❌ | ❌ | ❌ | ✅ |

---

## 10. Data Models & Database Schema

### Firestore Collections

```mermaid
erDiagram
    USERS ||--o{ SEEKER_PROFILES : has
    USERS ||--o{ COMPANIES : owns
    COMPANIES ||--o{ JOBS : posts
    JOBS ||--o{ APPLICATIONS : receives
    USERS ||--o{ APPLICATIONS : submits
    COMPANIES ||--o{ REVIEWS : receives
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ LEADS : generates
    USERS ||--o{ SUBSCRIPTIONS : purchases
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ SUPPORT_TICKETS : creates
    COMPANIES ||--o{ SERVICES : offers
    JOBS ||--o{ INTERVIEW_SCHEDULES : creates
```

### Key Collections

| Collection | Document ID | Purpose |
|------------|-------------|---------|
| `users` | `{uid}` | User profiles with role & metadata |
| `seekerProfiles` | `{uid}` | Extended job seeker profiles |
| `companies` | `{companyId}` | Business/company listings |
| `jobs` | `{jobId}` | Job postings |
| `applications` | `{applicationId}` | Job applications |
| `reviews` | `{reviewId}` | Business/service reviews |
| `leads` | `{leadId}` | Business leads & inquiries |
| `services` | `{serviceId}` | Service marketplace listings |
| `subscriptions` | `{subscriptionId}` | User/company subscriptions |
| `notifications` | `{notificationId}` | Push/in-app notifications |
| `advertisements` | `{adId}` | Banner/sponsored ads |
| `franchises` | `{franchiseId}` | District franchise records |
| `interviews` | `{interviewId}` | Interview schedules |
| `supportTickets` | `{ticketId}` | Support tickets with messages |
| `activityLogs` | `{logId}` | Audit trail |
| `chatMessages` | `{messageId}` | Direct messages |

### Application Status Flow

```
applied → shortlisted → interview_scheduled → selected
                                            → rejected
```

### Lead Status Flow

```
new → contacted → qualified → converted
                            → lost
```

### Verification Status Flow

```
pending → verified
        → rejected
```

---

## 11. Firebase Security Rules

### Firestore Rules Summary

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| `users` | Owner or Admin | Owner only | Owner or Admin | Admin only |
| `companies` | **Public** (anyone) | Authenticated | Owner or Admin | Admin only |
| `jobs` | **Public** (anyone) | Authenticated | Poster or Admin | Poster or Admin |
| `applications` | Seeker (own), Company Owner, Admin | Authenticated | Seeker (own), Company Owner, Admin | Admin only |
| `reviews` | **Public** (anyone) | Authenticated | Reviewer or Admin | Reviewer or Admin |
| `seekerProfiles` | Owner or Admin | Owner only | Owner or Admin | Admin only |

### Storage Rules Summary

| Path | Read | Write | Constraints |
|------|------|-------|-------------|
| `users/{uid}/profile/*` | Public | Owner only | Image, ≤5MB |
| `companies/{id}/logo/*` | Public | Authenticated | Image, ≤5MB |
| `companies/{id}/cover/*` | Public | Authenticated | Image, ≤10MB |
| `companies/{id}/gallery/*` | Public | Authenticated | Image/Video, ≤10MB |
| `resumes/{uid}/*` | Owner + Authenticated | Owner only | PDF, ≤5MB |
| `verification/{id}/*` | Authenticated | Authenticated | Image/PDF, ≤5MB |
| Everything else | ❌ Denied | ❌ Denied | — |

---

## 12. Custom Hooks & Utilities

### `useAuth()` — [useAuth.ts](file:///c:/jo/thenijobs/src/hooks/useAuth.ts)
Wraps the `AuthContext` for easy access to auth state and actions.

### `useFirestore` — [useFirestore.ts](file:///c:/jo/thenijobs/src/hooks/useFirestore.ts)

| Hook | Purpose |
|------|---------|
| `useCollection<T>(name, constraints?, options?)` | Real-time Firestore collection listener with query support |
| `useDocument<T>(name, docId)` | Real-time single document listener |
| `useAddDocument(name)` | Add document with auto server timestamps |
| `useUpdateDocument(name)` | Update document fields with auto `updatedAt` |
| `useDeleteDocument(name)` | Delete document by ID |

### `useStorage` — [useStorage.ts](file:///c:/jo/thenijobs/src/hooks/useStorage.ts)

| Hook | Purpose |
|------|---------|
| `useUploadFile()` | Upload file with progress tracking, type/size validation (default 5MB max) |
| `useDeleteFile()` | Delete file from Firebase Storage |

---

## 13. UI Component Library

### Shared Components (`src/components/ui/`)

| Component | File | Purpose |
|-----------|------|---------|
| **BrandIcons** | `BrandIcons.tsx` | Google, brand SVG icons |
| **Breadcrumb** | `Breadcrumb.tsx` | Page breadcrumb navigation |
| **Chart** | `Chart.tsx` | Recharts wrapper for analytics charts |
| **DataTable** | `DataTable.tsx` | Full-featured data table with sorting, filtering, pagination |
| **EmptyState** | `EmptyState.tsx` | Consistent empty state displays |
| **FileUpload** | `FileUpload.tsx` | Drag & drop file upload with preview and progress |
| **FloatingWhatsApp** | `FloatingWhatsApp.tsx` | Sticky floating WhatsApp CTA button |
| **LoadingSkeleton** | `LoadingSkeleton.tsx` | Shimmer loading placeholder animations |
| **Modal** | `Modal.tsx` | Radix-based modal dialog |
| **SearchInput** | `SearchInput.tsx` | Reusable search input with debouncing |
| **Sidebar** | `Sidebar.tsx` | Collapsible sidebar navigation (shared logic) |
| **StatsCard** | `StatsCard.tsx` | Animated stat card with trends |
| **StatusBadge** | `StatusBadge.tsx` | Color-coded status badges |

### Design System

| Element | Implementation |
|---------|---------------|
| **Theme** | Dark mode with `#0a0a1a` base, glassmorphism cards |
| **Glass Cards** | `glass-card` class — semi-transparent bg, blur backdrop, subtle border |
| **Buttons** | `btn-gradient` (violet→cyan gradient), `btn-outline-glass` (glassmorphic outline) |
| **Inputs** | `search-input` — dark bg, rounded corners, focus glow |
| **Animations** | `animate-fade-in-up`, animated counters, smooth transitions |
| **Color Palette** | Violet (primary), Cyan (secondary), Emerald (success), Amber (warning), Rose (danger) |
| **Typography** | Inter for body text, Outfit for headings |

---

## 14. SEO & Performance

### SEO Implementation

| Feature | Details |
|---------|---------|
| **Metadata** | Full OpenGraph + Twitter cards on root layout |
| **Sitemap** | Dynamic `sitemap.ts` — static pages + category pages + company pages |
| **Robots** | `robots.ts` — allows all crawlers, links to sitemap |
| **Structured Data** | Title templates: `%s | THENIJOBS` |
| **Keywords** | Theni jobs, Tamil Nadu, local business listing, recruitment |
| **PWA** | `manifest.json` with app icons |
| **Locale** | `en-IN` targeting Indian English audience |

### Performance Features

| Feature | Implementation |
|---------|---------------|
| **Static Export** | `output: 'export'` in next.config.ts for static HTML |
| **Image Optimization** | Next.js `<Image>` with priority loading for hero |
| **Font Swap** | `display: 'swap'` for Inter + Outfit fonts |
| **Cache Headers** | 1-year immutable cache for static assets (JS, CSS, images, fonts) |
| **Security Headers** | X-Content-Type-Options, X-Frame-Options (DENY), Referrer-Policy |
| **Code Splitting** | Automatic via Next.js App Router |

---

## 15. Deployment & Hosting

### Firebase Hosting Configuration

```
Hosting:     Firebase Hosting
Public Dir:  out/ (static export)
Clean URLs:  Enabled (no .html extensions)
SPA Rewrite: /** → /index.html
```

### Firebase Services Used

| Service | Purpose |
|---------|---------|
| **Firebase Authentication** | Email/password, Google OAuth, Phone OTP |
| **Cloud Firestore** | Primary database (NoSQL document store) |
| **Firebase Storage** | File uploads (resumes, images, documents) |
| **Firebase Hosting** | Static site hosting with CDN |
| **Realtime Database** | Secondary database (rules configured) |

### Build & Deploy Commands

```bash
npm run dev       # Local development server
npm run build     # Production build (static export)
npm run start     # Production server
npm run lint      # ESLint check
```

---

## 16. Workflow Diagrams

### Job Application Workflow

```mermaid
flowchart TD
    A[Job Seeker visits /jobs] --> B[Searches & filters jobs]
    B --> C{Finds matching job}
    C -->|Yes| D[Views job detail /jobs/id]
    D --> E{Logged in?}
    E -->|No| F[Redirects to /login]
    F --> G[Signs in or registers]
    G --> D
    E -->|Yes| H[Clicks Apply Now]
    H --> I[Submits application with resume]
    I --> J[Status: Applied]
    J --> K[Employer reviews application]
    K --> L{Decision}
    L -->|Shortlist| M[Status: Shortlisted]
    M --> N[Schedule Interview]
    N --> O[Status: Interview Scheduled]
    O --> P{Interview Result}
    P -->|Pass| Q[Status: Selected ✅]
    P -->|Fail| R[Status: Rejected ❌]
    L -->|Reject| R
```

### Business Registration Workflow

```mermaid
flowchart TD
    A[Business Owner visits /company/register] --> B[Step 1: Basic Details]
    B --> C[Step 2: Contact & Location]
    C --> D[Step 3: Gallery & Services]
    D --> E[Step 4: Verification Documents]
    E --> F[Submit for Review]
    F --> G[Status: Pending]
    G --> H[Admin reviews listing]
    H --> I{Admin Decision}
    I -->|Approve| J[Status: Verified ✅]
    J --> K[Business appears in directory]
    I -->|Reject| L[Status: Rejected ❌]
    L --> M[Owner notified with reason]
    M --> N[Owner can resubmit]
    N --> F
```

### User Registration Workflow

```mermaid
flowchart TD
    A[User visits /register] --> B[Step 1: Select Role]
    B --> C{Role Selected}
    C -->|Job Seeker| D[Step 2: Basic Details]
    C -->|Employer| D
    C -->|Business Owner| D
    C -->|Supplier| D
    C -->|Service Provider| D
    D --> E[Name, Phone +91, Email, Password]
    E --> F[Optional: Google Sign-up]
    F --> G[Step 3: OTP Verification]
    G --> H[Enter 6-digit code]
    H --> I[Account Created]
    I --> J[Firestore user doc seeded]
    J --> K[Redirected to role-specific dashboard]
```

### Lead Management Workflow

```mermaid
flowchart LR
    A[New Lead] --> B[Contacted]
    B --> C[Qualified]
    C --> D[Converted ✅]
    C --> E[Lost ❌]
    B --> E
```

---

## 17. File & Folder Structure

```
thenijobs/
├── public/                          # Static assets
│   ├── logo.png                     # Brand logo
│   ├── manifest.json                # PWA manifest
│   └── thenijobs-platform-preview.png
│
├── src/
│   ├── app/                         # Next.js App Router pages
│   │   ├── layout.tsx               # Root layout (fonts, metadata, viewport)
│   │   ├── page.tsx                 # Homepage
│   │   ├── globals.css              # Global styles + Tailwind
│   │   ├── sitemap.ts               # Dynamic sitemap generation
│   │   ├── robots.ts                # Search engine directives
│   │   ├── favicon.ico
│   │   │
│   │   ├── login/page.tsx           # Login (Email/Phone/Google)
│   │   ├── register/page.tsx        # Multi-step registration
│   │   ├── forgot-password/page.tsx # Password reset
│   │   │
│   │   ├── jobs/                    # Job listings
│   │   │   ├── page.tsx             # Search & filter jobs
│   │   │   └── [id]/               # Job detail page
│   │   │
│   │   ├── businesses/              # Business directory
│   │   │   ├── page.tsx             # All businesses
│   │   │   └── [category]/          # Category filtered
│   │   │
│   │   ├── company/
│   │   │   ├── [slug]/              # Public company profile
│   │   │   └── register/            # Company registration
│   │   │
│   │   ├── services/page.tsx        # Services marketplace
│   │   ├── pricing/page.tsx         # Subscription plans
│   │   │
│   │   ├── seeker/                  # Job Seeker Portal
│   │   │   ├── layout.tsx           # Seeker layout + sidebar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/
│   │   │   └── resume/
│   │   │
│   │   ├── employer/                # Employer Portal
│   │   │   ├── layout.tsx           # Employer layout + sidebar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── post-job/page.tsx
│   │   │   ├── jobs/
│   │   │   ├── candidates/
│   │   │   ├── interviews/
│   │   │   ├── company-profile/
│   │   │   └── talent-search/
│   │   │
│   │   └── admin/                   # Admin Portal
│   │       ├── layout.tsx           # Admin layout + sidebar
│   │       ├── login/               # Admin login
│   │       ├── dashboard/page.tsx
│   │       ├── users/page.tsx
│   │       ├── businesses/page.tsx
│   │       ├── jobs/
│   │       ├── leads/
│   │       ├── services/
│   │       ├── subscriptions/
│   │       ├── ads/
│   │       ├── reviews/
│   │       ├── reports/
│   │       ├── notifications/
│   │       ├── security/
│   │       └── settings/
│   │
│   ├── components/
│   │   ├── home/                    # Homepage sections (9 components)
│   │   ├── navigation/              # Header, BottomNav
│   │   └── ui/                      # Shared UI components (13 components)
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx           # Firebase auth state management
│   │
│   ├── hooks/
│   │   ├── useAuth.ts               # Auth context hook
│   │   ├── useFirestore.ts          # Firestore CRUD hooks
│   │   └── useStorage.ts            # File upload/delete hooks
│   │
│   └── lib/
│       ├── constants.ts             # Plans, categories, skills, nav items
│       ├── firebase/
│       │   └── config.ts            # Firebase app initialization
│       └── types/
│           └── index.ts             # 450+ lines of TypeScript interfaces
│
├── firebase.json                    # Firebase hosting + services config
├── firestore.rules                  # Firestore security rules
├── storage.rules                    # Storage security rules
├── database.rules.json              # Realtime DB rules
├── next.config.ts                   # Next.js config (static export)
├── package.json                     # Dependencies & scripts
└── tsconfig.json                    # TypeScript configuration
```

---

> [!NOTE]
> This documentation reflects the current state of the codebase. Some features (like real-time chat, AI Coach, full payment integration) have their data models and UI scaffolding in place but may need backend implementation to be fully functional.
