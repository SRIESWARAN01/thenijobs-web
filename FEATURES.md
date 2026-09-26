# THENIJOBS — Complete Platform Features Guide (FEATURES.md)

> **The Comprehensive Hyperlocal Job Portal, Business Directory, Service Marketplace & Digital Website Builder for Theni District & Tamil Nadu**  
> **Production URL:** [www.thenijobs.com](https://www.thenijobs.com) | [www.thenijobs.in](https://www.thenijobs.in)  
> **Official Support:** +91 93605 19460 / +91 70948 26886 | info@thenijobs.com

---

## 📑 Table of Contents

1. [Executive Summary & Platform Architecture](#1-executive-summary--platform-architecture)
2. [User Roles & Access Control](#2-user-roles--access-control)
3. [Public Discovery & Local Search Hub](#3-public-discovery--local-search-hub)
4. [Hyperlocal & Regional Job Portals (SEO Landing Pages)](#4-hyperlocal--regional-job-portals-seo-landing-pages)
5. [Job Seeker Portal (`/seeker/*`)](#5-job-seeker-portal-seeker)
6. [Employer & Business Owner Portal (`/employer/*`)](#6-employer--business-owner-portal-employer)
7. [Admin & Platform Supervision Portal (`/admin/*`)](#7-admin--platform-supervision-portal-admin)
8. [Portfolio Website Builder (Seeker & Company)](#8-portfolio-website-builder-seeker--company)
9. [Product & Service Marketplace with WhatsApp Flow](#9-product--service-marketplace-with-whatsapp-flow)
10. [AI Gateway & Smart Automation Suite](#10-ai-gateway--smart-automation-suite)
11. [Digital Identity & Visiting Cards (QR Codes)](#11-digital-identity--visiting-cards-qr-codes)
12. [Payment, Subscriptions & Automated Invoicing](#12-payment-subscriptions--automated-invoicing)
13. [Authentication & Security Infrastructure](#13-authentication--security-infrastructure)
14. [Design System & Bilingual Localization](#14-design-system--bilingual-localization)
15. [Complete Route & Page Inventory](#15-complete-route--page-inventory)

---

## 1. Executive Summary & Platform Architecture

**THENIJOBS** is a multi-sided hyperlocal web platform specifically engineered for job seekers, recruiters, local micro-enterprises, service professionals, and enterprise corporations across Theni district and Tamil Nadu.

### Core Technology Stack
* **Framework:** Next.js 16.2.7 (App Router with Static HTML Export)
* **Runtime / Client:** React 19.2.4, TypeScript 5.9.3
* **Styling & Design System:** Tailwind CSS v4, Custom CSS Variables (`--vk-*`), Glassmorphism, Responsive Mobile Bottom Navigation
* **Typography:** Inter (Body) + Outfit / Poppins (Headings) via `next/font`
* **Backend & Cloud Infrastructure:**
  * **Firebase Authentication:** Email/Password, Google OAuth, Indian Phone (+91) OTP via 2Factor.in / Phone Auth
  * **Cloud Firestore:** Real-time NoSQL database with 400+ lines of production security rules
  * **Firebase Storage:** Secure document and media storage (PDF resumes, company logos, gallery banners)
  * **Hosting:** Vercel (Production Static Export) + Firebase Hosting backup
* **AI Providers:** Multi-tier gateway routing: Groq (`openai/gpt-oss-120b`) → Google Gemini (`gemini-flash-latest`) → OpenAI
* **Payments:** 256-bit SSL Razorpay Checkout with backend HMAC-SHA256 signature verification & automated PDF tax invoice generator

---

## 2. User Roles & Access Control

The platform provides dedicated, guarded dashboard portals and permission matrices for distinct user roles:

| Role | Role Identifier | Primary Capabilities | Guarded Portal |
|---|---|---|---|
| **Job Seeker** | `job_seeker` | Search & apply to jobs, AI resume builder, career coach, digital ID card, portfolio website | `/seeker/*` |
| **Employer / HR** | `employer` | Post jobs, candidate tracking pipeline, interview scheduling, talent search, resume access | `/employer/*` |
| **Business Owner** | `business_owner` | Company profile, showcase products/services, 15 website templates, digital business visiting card | `/employer/*` |
| **Supplier / B2B** | `supplier` | List wholesale/retail products, catalog management, receive WhatsApp purchase leads | `/employer/*` & `/marketplace` |
| **Service Provider** | `service_provider` | Showcase services, accept customer booking inquiries, quote prices | `/employer/*` & `/services` |
| **Administrator** | `admin` | Moderation of jobs, companies, user accounts, reviews, and platform configuration | `/admin/*` |
| **Super Admin** | `super_admin` | Full control over revenue, AI gateways, SEO, district franchise rules, master credentials | `/admin/*` |

---

## 3. Public Discovery & Local Search Hub

Accessible without authentication, optimized for rapid discovery, instant contact, and search engines:

### 3.1 Homepage (`/`)
* **Dynamic Hero Section:** Unified search bar (Keyword + Location) with auto-suggestions, platform metrics counters (5,200+ Jobs, 1,800+ Companies, 48,000+ Seekers), and real-time live local updates ticker.
* **Search Hub (`SearchHub.tsx`):** Tabbed interface allowing users to toggle between searching for **Jobs**, **Businesses**, and **Local Services**.
* **Categories Grid:** Browse top industry categories with Tamil subtitles and icon indicators.
* **Trending & Urgent Jobs:** Carousel featuring high-priority openings with ⚡ *Urgent* and ⭐ *Premium* tags.
* **Featured Businesses Showcase:** Uncropped high-definition company banners with smart backdrop blur matching shop themes.
* **Recent Business Updates & Announcements Feed:** Real-time updates posted by local shops and firms.
* **Testimonials & Success Stories:** Verified reviews from candidates and local employers.
* **Floating WhatsApp Button:** Immediate 1-tap connection to THENIJOBS customer helpline.
* **Mobile Sticky Bottom Navigation:** Quick access on smartphones to Home, Jobs, Businesses, Services, and Account.

### 3.2 Job Directory (`/jobs` & `/jobs/[id]`)
* **Multi-Filter System:** Filter by category, job type (Full-time, Part-time, Remote, WFH, Internship, Fresher, Contract), district/taluk, experience level, and salary ranges.
* **Sorting Engine:** Sort by newest, highest salary, and relevance.
* **Job Cards:** Company logo, verified badge, salary range in INR, number of openings, application deadline, and required skills tags.
* **Interactive Job Details (`/jobs/[id]`):** Complete job description, responsibilities, eligibility, company overview, Google Map location, similar job recommendations, and 1-click **"Apply Now"** button.
* **Social Sharing:** One-click share to WhatsApp, Facebook, LinkedIn, Twitter, and native clipboard.

### 3.3 Business Directory & Company Profiles (`/businesses`, `/company/[slug]`)
* **Categorized Directory:** Search local companies across manufacturing, textile, agriculture, retail, healthcare, etc.
* **Full Company Showcase:**
  * Uncropped 1200x400 business banners with backdrop blur.
  * Verified badges (Mobile, Email, GST, Business Registration).
  * Direct Call, Email, and WhatsApp contact buttons.
  * Embedded interactive Google Map and turn-by-turn navigation.
  * Photo gallery and video showcase.
  * Active job openings posted by the company.
  * Customer reviews and 5-star rating breakdown.
* **Company Registration (`/company/register` & `/register-business`):** Multi-step onboarding for local business owners.

### 3.4 Services Marketplace (`/services`)
* Browse local certified technicians, electricians, plumbers, legal consultants, accounting, photographers, and tailoring services.
* Direct contact buttons and quotation request forms.

---

## 4. Hyperlocal & Regional Job Portals (SEO Landing Pages)

Dedicated, search-engine-optimized landing pages targeting specific taluks and neighboring districts in Tamil Nadu:

* **Theni Hub:** `/jobs-in-theni` (and category-specific pages `/jobs-in-theni/[category]`)
* **Andipatti:** `/jobs-in-andipatti`
* **Bodinayakanur:** `/jobs-in-bodinayakanur`
* **Chinnamanur:** `/jobs-in-chinnamanur`
* **Cumbum:** `/jobs-in-cumbum`
* **Periyakulam:** `/jobs-in-periyakulam`
* **Uthamapalayam:** `/jobs-in-uthamapalayam`
* **Madurai:** `/jobs-in-madurai`
* **Dindigul:** `/jobs-in-dindigul`
* **Daily Fresh Jobs Stream:** `/daily-jobs` (Aggregated live stream of today's freshest local job postings).

---

## 5. Job Seeker Portal (`/seeker/*`)

A full-fledged personal career hub with AI tools, ATS resume builder, application tracking, and personal website generator:

### 5.1 Dashboard & Navigation (`/seeker/dashboard`)
* **Profile Strength Meter:** Visual percentage gauge (0–100%) indicating missing profile items.
* **"Open to Work" Toggle:** Instant availability badge visible to recruiters.
* **KPI Metrics:** Applied Jobs count, Shortlisted count, Scheduled Interviews count, Saved Jobs count.
* **Personalized Job Recommendations:** Tailored openings matching the user's skill set and district.

### 5.2 Comprehensive Profile Builder (`/seeker/profile`)
* **Personal Data:** Name, phone, email, full address, district, state, profile avatar.
* **Work Experience:** Multiple entries with company name, designation, start/end dates, roles, achievements.
* **Education History:** School/College, degree, specialization, graduation year, percentage/CGPA.
* **Categorized Skills Matrix:** Multi-select from 45+ predefined tech, trade, and regional skills (e.g. Tamil Typing, Tally, Silk Weaving, Agriculture Management).
* **Certifications & Languages:** Upload certificates and specify spoken/written language proficiency.
* **Career Preferences:** Desired job roles, expected monthly salary (INR), preferred districts, work mode.

### 5.3 AI-Powered ATS Resume Builder (`/seeker/resume/builder`)
* **Auto-Populate from Profile:** 1-click sync pulling personal details, education, work experience, and skills directly from Firestore into the resume builder.
* **AI Bullet Point Generator & Optimizer:** Integrated Google Gemini assistant that converts basic work descriptions into ATS-friendly, quantified achievements with action verbs.
* **Dual-Mode High-Definition Export:**
  1. High-resolution canvas-based PDF generation (`html2canvas` + `jsPDF`) with mobile-safe margins.
  2. Vector-crisp native browser print engine (`window.print()`) formatted for standard A4 paper.
* **Cloud Storage Sync:** 1-click save to user's Firestore resume vault and downloadable link generation.
* **Resume AI Analysis (`/seeker/resume/analyze`):** Automated ATS score, keyword density checker, and improvement suggestions.

### 5.4 Career Coaching & AI Suite (`/seeker/ai-coach`, `/seeker/ai-chat`, `/seeker/ai`)
* **AI Career Coach:** Chatbot providing interview preparation, situational question answers, and salary negotiation tips.
* **Cover Letter Generator:** Auto-generates customized cover letters tailored to specific job postings.
* **AI Key Connection (BYOK):** Option for users to connect their personal OpenAI or Google Gemini API key with a one-time ₹50 setup fee.

### 5.5 Applications & Interview Pipeline
* **Track Applications (`/seeker/applications`):** Real-time status pipeline:
  $$\text{Applied} \longrightarrow \text{Shortlisted} \longrightarrow \text{Interview Scheduled} \longrightarrow \text{Selected / Rejected}$$
* **Interview Tracker (`/seeker/interviews`):** Displays date, time, interview mode (In-person, Phone call, Google Meet/Zoom link), and venue directions.
* **Saved Jobs (`/seeker/saved-jobs`):** Bookmark interesting openings for later review.
* **Job Alerts (`/seeker/job-alerts`):** Automated email/SMS notifications based on preferred keywords and locations.

### 5.6 Personal Portfolio & Digital ID Card
* **Personal Portfolio Website (`/seeker/website`):** Build a personal online portfolio hosted at `/portfolio/seeker/[id]` or `/portfolio/[username]`. Includes Minimal, Executive, and Creative layouts with a ₹50/year public privacy toggle.
* **Seeker Digital ID Card (`/seeker/id-card`):** Official digital identity card with photo, verified badge, skills list, and a scan-to-verify QR code.

---

## 6. Employer & Business Owner Portal (`/employer/*`)

A complete recruitment CRM, business directory management suite, and digital presence manager:

### 6.1 Employer Dashboard (`/employer/dashboard`)
* High-level metrics: Active Job Posts, Total Applicants Received, New Inquiries/Leads, Company Profile Views.
* Recent applicant activity feed with fast-action shortlist/reject buttons.

### 6.2 Job Posting & Management Engine (`/employer/post-job`, `/employer/jobs`)
* **Rich Job Creator:** Post jobs with title, industry, vacancies, job type, salary range, experience requirement, detailed descriptions, and perks.
* **Urgency & Promotion Flags:** Tag postings as ⚡ *Urgent Hiring*, ⭐ *Premium Job*, or 📌 *Featured Listing*.
* **Job Management (`/employer/jobs/[id]`):** Edit live jobs, close postings, pause applications, and duplicate existing listings.

### 6.3 Candidate Applicant Tracking System (ATS) (`/employer/candidates`)
* **Pipeline Management:** Visual Kanban/List tracker for candidates:
  * *Applied:* Review candidate profile, resume PDF, and contact details.
  * *Shortlisted:* Mark high-potential candidates.
  * *Interview Scheduled:* Trigger calendar invite with meeting link or address.
  * *Selected / Rejected:* Close applicant status with optional feedback note.
* **Talent Search Database (`/employer/talent-search`):** Search verified job seekers by skill keywords, experience level, and Tamil Nadu district.

### 6.4 Interview Coordination (`/employer/interviews`)
* Schedule interviews with automated time slots, notes, and platform reminders.

### 6.5 Business Leads & Customer CRM (`/employer/leads`)
* Dedicated lead management pipeline for local businesses receiving product/service inquiries:
  $$\text{New Lead} \longrightarrow \text{Contacted} \longrightarrow \text{Qualified} \longrightarrow \text{Converted} \ / \ \text{Lost}$$
* Record notes, lead value, customer phone numbers, and follow-up dates.

### 6.6 Company Profile & Media Center (`/employer/company-profile`)
* Edit company details: Logo, 1200x400 cover banner, tagline, founding year, company size, GST & registration numbers.
* Multi-branch management (add multiple physical shop/office addresses in different towns).
* Photo gallery and video embedding.
* Customer reviews management and reply system.

### 6.7 Digital Visiting Card & Staff ID Cards (`/employer/id-card`)
* **Company Visiting Card:** High-resolution digital business card with company branding, contact icons, Google Map pin, and quick WhatsApp share.
* **Dynamic QR Code:** Scan-to-save contact (.vcf) and view company website.
* **Staff ID Generator:** Create verified digital employee ID cards for company staff (up to 25+ or unlimited depending on subscription tier).

---

## 7. Admin & Platform Supervision Portal (`/admin/*`)

Centralized governance, moderation, and business intelligence portal:

### 7.1 Security & Session Management
* Dedicated admin initialization screen with encrypted credentials stored in platform settings.
* Session destruction on logout and protection via client-side role guards (`useRequireAuth(['admin', 'super_admin'])`).

### 7.2 Platform KPIs & System Health (`/admin/dashboard`)
* **Real-Time Counters:** Total Registered Users, Active Companies, Published Jobs, Total Applications, Lead Volume, and Platform Revenue (INR).
* **System Health Monitor:** Server uptime tracker, Firebase resource usage, active sessions, and API latency.
* **Regional Distribution Charts:** Visual analytics displaying user and company density across Theni, Madurai, Dindigul, and other districts.

### 7.3 Content Moderation & Verification
* **User Ledger (`/admin/users`, `/admin/users/create`):** Search, filter, edit, activate, suspend, or delete any user account across all roles. Toggle verified badges (Mobile, Email, Business, GST).
* **Business Moderation (`/admin/businesses`):** Approve or reject pending company submissions. Manage *Featured* and *Premium* directory placements.
* **Bulk Business Import (`/admin/businesses/import`):** Upload Excel / CSV spreadsheets to import hundreds of local business listings in batch.
* **Job Post Moderation (`/admin/jobs`):** Review reported or flagged job postings, check for wage compliance, and remove spam.
* **Review & Rating Governance (`/admin/reviews`):** Moderate public reviews, flag inappropriate content, and resolve disputes.

### 7.4 Revenue & Subscription Controls (`/admin/subscriptions`)
* Audit every Razorpay transaction, payment slip, active plan, start date, and renewal date.
* Manually override, extend, or activate subscriptions for offline bank transfers.

### 7.5 AI Engine Configuration (`/admin/ai-settings`, `/admin/ai-analytics`)
* Configure AI fallback priorities: Groq vs. Gemini vs. OpenAI.
* Set per-plan free credit allowances and adjust credit consumption rates per feature.
* Monitor token usage, API latency, and credit pack purchase revenue.

### 7.6 Platform Configuration & SEO Master (`/admin/settings`, `/admin/seo`)
* **Category & District Builders:** Add or modify job categories, business sectors, and Tamil Nadu taluk listings without code changes.
* **SEO Metadata Controls:** Set global meta titles, OpenGraph images, and JSON-LD schema definitions.
* **System Notification Broadcasts (`/admin/notifications`):** Send platform-wide announcements or targeted push notifications to all users or specific roles.
* **Error Log Diagnostics (`/admin/errors`):** Real-time diagnostic viewer for client-side and API runtime issues.

---

## 8. Portfolio Website Builder (Seeker & Company)

THENIJOBS features an integrated, no-code website builder that creates dedicated websites for local companies and job seekers:

### 8.1 15 Pre-Built Website Templates (by Subscription Tier)

| Plan Tier | Template Name | Key Focus | Included Sections |
|---|---|---|---|
| **Free** | `classic-business` | Clean, professional local shop presence | Hero, About, Services, Gallery (6), Contact, Map, Social |
| **Free** | `clean-corporate` | Minimal corporate branding | Hero, About, Services, Contact, Social |
| **Free** | `modern-services` | Service-focused cards with enquiry buttons | Hero, About, Service Cards, Gallery, WhatsApp Enquiry |
| **Standard** | `professional-company` | Comprehensive SME presentation | Hero, Products, Services, Testimonials, Map, Colors |
| **Standard** | `business-showcase` | Product catalog with direct ordering | Featured Products, Categories, Reviews, WhatsApp Order |
| **Standard** | `local-business-pro` | Optimized for local search & foot traffic | Working Hours, Map + Directions, Reviews, Local SEO |
| **Premium** | `corporate-premium` | Established firms with hiring needs | Advanced Hero, Team, Projects, Careers, Animations |
| **Premium** | `product-marketplace` | E-commerce style product catalog | Full Catalog, Categories, Search, Related Items |
| **Premium** | `service-marketplace` | Multi-service pricing & booking | Service Catalog, Pricing Tiers, Inquiries, FAQ |
| **Premium** | `executive-company` | Law, finance, and consulting firms | Leadership Profiles, Case Studies, Clients, Careers |
| **Premium** | `creative-business` | Agencies, design, and digital studios | Bento-Grid, Video, Case Studies, Dynamic Animations |
| **Premium** | `modern-business` | Split hero SaaS-style company presentation | Split Hero, Quick Stats, Avatars, Working Hours Schedule |
| **Enterprise** | `enterprise-corporate` | Large factories, corporations, and groups | News & Updates, All Sections, Multi-branch, Careers |
| **Enterprise** | `luxury-brand` | High-end retail, jewellery, and textiles | Full-screen Hero, Brand Story, Collections, Typography |
| **Enterprise** | `business-careers` | Corporate talent recruitment portal | Job Listings, Company Culture, Online Applications |
| **Enterprise** | `ultimate-business-pro` | The ultimate all-in-one corporate site | All 26+ Sections, AI Assistant, Custom Branding, Multi-branch |

### 8.2 31 Modular Section Types
Hero Banner, About Us, Services, Products, Team Members, Photo Gallery, Testimonials, Projects, Careers Portal, Contact Info, FAQ Accordion, Timeline / History, Achievements & Stats, Client Logos, News / Press, Custom HTML/Markdown, Leadership Team, CEO Message, Branch Locations, Awards & Accreditations, Portfolio Grid, Case Studies, Video Embeds, Social Links, Working Hours, Interactive Google Maps, Seeker Skills, Seeker Experience, Seeker Education, Seeker Certifications, and Download Resume.

### 8.3 In-Editor AI Content Assistant (`AIContentAssistant.tsx`)
* Generate company headlines, about-us bios, service descriptions, and mission statements with 1 click using Google Gemini.

---

## 9. Product & Service Marketplace with WhatsApp Flow

A lightweight, localized e-commerce experience designed for Indian commerce behavior:

* **Product Cards & Modal (`ProductDetailModal.tsx`):** Displays product photo, title, pricing in INR, description, specifications, and availability.
* **1-Click WhatsApp Direct Order Message:** Clicking "Order on WhatsApp" automatically opens WhatsApp with a pre-filled, formatted order slip:
  ```text
  🛍️ *PRODUCT ORDER / SERVICE ENQUIRY*
  ─────────────────────────
  📌 *Item:* [Product Name]
  💰 *Price:* ₹[Price]
  🏢 *Company:* [Company Name]
  📍 *Location:* [District], Tamil Nadu
  🖼️ *Photo:* [Product Image URL]
  🔗 *THENIJOBS Marketplace:* [Link]
  📝 *Customer Note:* [User Order Note]
  ─────────────────────────
  Hi, I found your listing on THENIJOBS Marketplace and would like to order / get more information.
  ```

---

## 10. AI Gateway & Smart Automation Suite

A centralized, multi-provider AI infrastructure (`src/lib/ai/`) that powers intelligent features across the entire platform:

### 10.1 16 Specialized AI Capabilities

| Feature Key | Description | Credit Cost |
|---|---|---|
| `job_search` | Natural language job search query interpreter | 1 credit |
| `job_recommendation` | Match candidate profiles with suitable active jobs | 1 credit |
| `career_assistant` | 24/7 AI chat answering career guidance questions | 1 credit |
| `profile_improvement` | Analyzes profile and recommends improvements | 1 credit |
| `resume_improvement` | Rewrites resume bullet points with quantifiable metrics | 2 credits |
| `resume_analysis` | Evaluates ATS compatibility and skill gaps | 2 credits |
| `cover_letter` | Generates personalized job application cover letters | 2 credits |
| `interview_prep` | Creates role-specific interview Q&A mock sessions | 2 credits |
| `full_resume_generation` | Synthesizes an entire professional resume from scratch | 3 credits |
| `company_description` | Generates compelling company bios and taglines | 1 credit |
| `service_product_description`| Writes sales copy for products and services | 1 credit |
| `job_description` | Generates comprehensive job postings for HR | 1 credit |
| `candidate_matching` | Calculates match percentage between candidate & job | 2 credits |
| `candidate_ranking` | Ranks applicant pool by relevance and qualifications | 2 credits |
| `candidate_search` | AI-assisted search across talent database | 1 credit |
| `chatbot` | Public-facing company AI chatbot for website visitors | 1 credit |

### 10.2 AI Credit Packs & Pricing

| Credit Pack | Credits | Price (INR) | Value Tag |
|---|---|---|---|
| **Starter Pack** | 10 Credits | ₹10 | Starter |
| **Popular Pack** | 25 Credits | ₹20 | Most Popular |
| **Value Pack** | 50 Credits | ₹35 | Best Value |
| **Pro Pack** | 100 Credits | ₹60 | Professional |

---

## 11. Digital Identity & Visiting Cards (QR Codes)

Instant digital networking tools for both candidates and enterprises:

* **Seeker Digital ID Card (`SeekerIDCard.tsx`):**
  * Displays Candidate Photo, Name, Verified Badge, Primary Skill Tag, District, and THENIJOBS Member ID.
  * Encoded QR Code linking to candidate's online public portfolio.
  * Download as crisp PNG / PDF image for easy sharing on WhatsApp.
* **Company Digital Visiting Card (`CompanyIDCard.tsx`):**
  * Displays Company Logo, Official Name, Category, GST/Reg Badge, Phone, WhatsApp, and Address.
  * Scan-to-Save Contact: Generates a standard vCard (.vcf) QR code that adds contact info directly to smartphone address books.
  * Staff ID Cards: Generate branded employee badges under the company account.

---

## 12. Payment, Subscriptions & Automated Invoicing

Transparent, annual pricing architecture with automated checkout and receipts:

### 12.1 Annual Subscription Plans

| Feature / Tier | Basic (₹999/yr) | Standard (₹1,800/yr) | Premium (₹3,500/yr) | Enterprise (₹5,000/yr) |
|---|---|---|---|---|
| **Monthly Equivalent** | ₹83 / mo | ₹150 / mo | ₹292 / mo | ₹417 / mo |
| **Daily Cost** | ₹2.74 / day | ₹4.93 / day | ₹9.59 / day | ₹13.69 / day |
| **Active Job Postings** | 5 Jobs | 10 Jobs | 50 Jobs | **Unlimited** |
| **Job Alerts** | 5 Alerts | 10 Alerts | 50 Alerts | **Unlimited** |
| **Product Catalog** | None | 20 Products | 100 Products | **Unlimited** |
| **Service Listings** | None | 10 Services | 50 Services | **Unlimited** |
| **Gallery & Media** | 6 Images | 10 Images + 2 Videos | 50 Images + 10 Videos | **Unlimited** |
| **Website Templates** | 1 Basic Template | 5 Templates | 15 Templates | **All 15 + Custom** |
| **Digital Visiting Card** | Basic Card | Silver Badge + Card | Gold Badge + 25 Staff | Platinum + Unlimited Staff |
| **Branches** | 1 Location | 3 Branches | 20 Branches | **Unlimited Branches** |
| **AI Assistant** | None | Basic | Full Access | **Dedicated Chatbot** |
| **Search Priority** | Standard | Elevated | Top Featured | **Homepage Featured** |

### 12.2 Micro-Purchases & Add-Ons
* **Seeker Public Profile Fee:** ₹50 / year (Unlocks public portfolio at `/portfolio/seeker/[id]`).
* **AI Key Connection Fee (BYOK):** ₹50 one-time fee (Unlocks connecting personal OpenAI/Gemini API key permanently).
* **Resume Builder Direct Export:** ₹15 one-time fee for standalone users.

### 12.3 Automated Invoicing & Tax Slips
* Upon payment completion, an official tax receipt is generated instantly:
  * Receipt Number: `THENI-REC-[RANDOM-HASH]`
  * Customer Name, Billing Address, Plan Name, Amount Paid, GST breakdown.
  * **"Download Receipt (PDF)"** button produces an official invoice.

---

## 13. Authentication & Security Infrastructure

Robust, enterprise-grade security protocols across client and cloud:

* **Triple Authentication Flow:**
  * Email + Password with password reset link via Firebase Auth.
  * Mobile Phone OTP verification (+91) via 2Factor.in / Firebase SMS gateway.
  * One-tap Google OAuth popup login.
* **Firestore Security Rules (`firestore.rules`):**
  * 400+ lines of granular access controls.
  * Moderation checks: Suspended/banned users blocked from mutating state.
  * Strict ownership checks: Users can only modify their own profiles, resumes, and company assets.
  * Public read access to verified jobs, company profiles, and public marketplace items.
* **Storage Rules (`storage.rules`):**
  * Resumes (`resumes/{uid}/*`): Restricted to PDF files under 5MB, readable only by the owner and authenticated employers.
  * Company Media: Restricted to valid image/video MIME types under 10MB.
* **No Leaked Secrets:** Environment variables strictly segregated; public client builds contain no secret API keys.

---

## 14. Design System & Bilingual Localization

Engineered for local Tamil Nadu demographics with high usability and aesthetics:

* **Bilingual English + Tamil Support:**
  * All major navigation items, buttons, form headers, and category titles include Tamil translations (e.g. `Jobs / வேலைகள்`, `Post Job / வேலை பதிவிடு`, `Dashboard / டாஷ்போர்ட்`).
* **Role Color Pillars:**
  * **Job Seeker Portal:** Emerald / Cyan theme (`--seeker-*`).
  * **Employer Portal:** Blue / Indigo / Cyan theme (`--employer-*`).
  * **Admin Portal:** Violet / Indigo theme (`--admin-*`).
* **Visual Polish:** Glassmorphism cards (`glass-card`), subtle CSS micro-animations, accessible contrast ratios, and responsive touch targets for mobile devices.

---

## 15. Complete Route & Page Inventory

### Public Pages
* `/` — Platform Homepage (Hero, SearchHub, Featured, Stats, Live ticker)
* `/jobs` — Searchable Job Directory with filters
* `/jobs/[id]` — Dynamic Job Detail & Application View
* `/businesses` — Business Directory
* `/businesses/[category]` — Category Filtered Business Listings
* `/companies` & `/companies/[slug]` — Company Profile directory
* `/company/[slug]` & `/[companySlug]` — Public Business Profile & Catalog
* `/company/register` & `/register-business` — Business Registration Onboarding
* `/services` — Local Services Marketplace
* `/marketplace` — Product Marketplace
* `/marketplace/[type]/[companySlug]/[itemId]` — Product & Service Detail View
* `/portfolio/[username]` — Public Business Website View
* `/portfolio/seeker/[id]` — Public Seeker Portfolio View
* `/pricing` — Subscription Plans & Feature Matrix
* `/daily-jobs` — Daily Stream of New Jobs
* `/jobs-in-theni` (+ categories) — Theni District Local Jobs
* `/jobs-in-andipatti` (+ categories) — Andipatti Local Jobs
* `/jobs-in-bodinayakanur` (+ categories) — Bodinayakanur Local Jobs
* `/jobs-in-chinnamanur` (+ categories) — Chinnamanur Local Jobs
* `/jobs-in-cumbum` (+ categories) — Cumbum Valley Local Jobs
* `/jobs-in-periyakulam` (+ categories) — Periyakulam Local Jobs
* `/jobs-in-uthamapalayam` (+ categories) — Uthamapalayam Local Jobs
* `/jobs-in-madurai` (+ categories) — Madurai Region Jobs
* `/jobs-in-dindigul` (+ categories) — Dindigul Region Jobs
* `/about` — About Us & Mission
* `/contact` — Contact Details, Office Address & Support Form
* `/privacy` — Privacy Policy & Data Handling
* `/terms` — Terms of Service
* `/cookies` — Cookie Policy

### Auth Routes
* `/login` — Unified Login (Email, Phone OTP, Google OAuth)
* `/register` — 3-Step Multi-role Registration Wizard
* `/forgot-password` — Password Recovery

### Job Seeker Routes (`/seeker/*`)
* `/seeker/dashboard` — Seeker Overview, Stats, Strength Gauge
* `/seeker/profile` — Full Profile & Skills Editor
* `/seeker/resume` — Resume Vault & Download
* `/seeker/resume/builder` — Dual-Mode High-Definition ATS Resume Builder
* `/seeker/resume/analyze` — AI ATS Resume Analyzer
* `/seeker/jobs` & `/seeker/jobs/recommended` — Job Search & AI Matches
* `/seeker/applications` — Application Status Pipeline
* `/seeker/interviews` — Scheduled Interviews
* `/seeker/saved-jobs` — Bookmarked Listings
* `/seeker/job-alerts` — Notification Preferences
* `/seeker/ai` & `/seeker/ai-coach` & `/seeker/ai-chat` — AI Career Suite
* `/seeker/id-card` — Digital Seeker Identity Card & QR Code
* `/seeker/website` — Seeker Portfolio Website Editor
* `/seeker/subscription` — Profile Visibility Subscription
* `/seeker/become-employer` — Upgrade Account Role
* `/seeker/notifications` — Notification Feed
* `/seeker/messages` — Employer Messaging
* `/seeker/settings` — Account Settings

### Employer Routes (`/employer/*`)
* `/employer/dashboard` — Employer Overview & Analytics
* `/employer/post-job` — Multi-Step Job Posting Engine
* `/employer/jobs` & `/employer/jobs/[id]` — Manage Posted Jobs & Applicants
* `/employer/candidates` — Candidate ATS Pipeline
* `/employer/interviews` — Schedule & Manage Candidate Interviews
* `/employer/talent-search` — Candidate Resume Database Search
* `/employer/company-profile` — Company Profile, Logo, Banners, Media
* `/employer/website` — Business Website Builder
* `/employer/website/editor` — Visual Website Section Editor
* `/employer/website/templates` — 15 Business Templates Switcher
* `/employer/website/settings` — Website SEO & Domain Settings
* `/employer/id-card` — Digital Visiting Card & Staff ID Generator
* `/employer/leads` — Inbound Customer Inquiries & CRM
* `/employer/messages` — Candidate Direct Messages
* `/employer/billing` & `/employer/subscription` — Razorpay Checkout & Invoices
* `/employer/ai` — AI Job Description & Matching Engine
* `/employer/reports` — Analytics on Views & Applicants
* `/employer/reviews` — Company Reviews & Ratings Management
* `/employer/settings` — Company Account Settings

### Admin Routes (`/admin/*`)
* `/admin/login` — Dedicated Admin Authentication Screen
* `/admin/dashboard` — Platform KPIs, Approvals, Health Stats
* `/admin/users` & `/admin/users/create` — User Ledger & Verification
* `/admin/businesses` — Business Directory Moderation
* `/admin/businesses/import` — Bulk Excel/CSV Business Importer
* `/admin/businesses/website-health` — Portfolio Website Health Monitor
* `/admin/businesses/[id]/website`, `profile`, `jobs` — Deep Company Controls
* `/admin/jobs` — Job Listing Moderation & Flags
* `/admin/leads` — Platform-wide Leads Overview
* `/admin/services` — Service Directory Moderation
* `/admin/subscriptions` — Transactions & Plan Activations
* `/admin/ambassadors` — Village Ambassador Network & UPI Payouts Processing
* `/admin/reviews` — Content Moderation
* `/admin/reports` — Financial & Growth Analytics
* `/admin/ai-settings` & `/admin/ai-analytics` — AI Gateways & Usage Limits
* `/admin/notifications` — System Broadcast Announcements
* `/admin/security` — Activity Logs & IP Audit Trail
* `/admin/seo` — Global SEO & Structured Data Schema
* `/admin/errors` — Crash Logs & Error Diagnostics
* `/admin/settings` — Platform Parameters & Master Controls

### Ambassador & Referral Routes
* `/ambassador` — Public Village Ambassador Landing & 1-Minute Registration
* `/ambassador/dashboard` — Ambassador Portal (Referral Link, WhatsApp Sharing Kit, Earnings & UPI Payouts)

---
*Document automatically compiled for the THENIJOBS Project (`d:\project\thenijobs-web-main\thenijobs-web-main`).*
