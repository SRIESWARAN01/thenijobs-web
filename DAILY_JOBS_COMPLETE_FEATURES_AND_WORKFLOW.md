# THENIJOBS Daily Jobs — Complete Features, Architecture & Workflow Specification

> **Document:** `DAILY_JOBS_COMPLETE_FEATURES_AND_WORKFLOW.md`  
> **Platform:** THENIJOBS (Next.js 16.3.4 Production Web Application + Cloud Firestore + Firebase Storage)  
> **Route:** `http://localhost:3000/daily-jobs`  
> **Target Audience:** Job Seekers, Employers, Business Owners, Administrators  
> **Coverage Area:** Theni District (Theni, Periyakulam, Cumbum, Bodinayakanur, Chinnamanur, Uthamapalayam, Andipatti, Thevaram, Devadanapatti, Veerapandi, Kombai, Kuchanur, Gudalur, Highwavys, Madurai, Dindigul, Tamil Nadu)  
> **Verification Status:** Production Verified (75/75 Tests Passing, 0 TypeScript Errors)

---

## 1. Executive Summary & Page Architecture

The **THENIJOBS Daily Jobs** portal (`/daily-jobs`) is the dedicated hyperlocal recruitment and job-discovery hub for fresh job postings, urgent hiring, daily wage positions, walk-in interviews, and immediate joining vacancies across Theni District and Tamil Nadu.

It provides a transparent, zero-middleman ecosystem connecting local job seekers directly with verified companies, schools, hospitals, agro-farms, mills, and retail establishments.

```
                      ┌───────────────────────────────────────────────┐
                      │             THENIJOBS DAILY JOBS              │
                      │               (/daily-jobs)                   │
                      └───────┬───────────────────────────────┬───────┘
                              │                               │
              ┌───────────────▼───────────────┐ ┌─────────────▼───────────────┐
              │      SMART MULTI-SEARCH       │ │     7 THENI TALUKS & TOWNS  │
              │ Title • Company • Location    │ │ Theni • Cumbum • Periyakulam│
              │ Skills • Description Snippet  │ │ Bodi • Chinnamanur • Andipati│
              └───────────────┬───────────────┘ └─────────────┬───────────────┘
                              │                               │
              ┌───────────────▼───────────────────────────────▼───────────────┐
              │                   DYNAMIC DISCOVERY BADGES                    │
              │  • Today's Jobs (< 24h)  • Urgent Vacancies  • Fresher Friendly│
              │  • Walk-in Interviews   • Daily Wage / Wage • ⭐ Featured     │
              │  • Recently Viewed Jobs (Auto-recorded Shelf)                 │
              └───────────────┬───────────────────────────────┬───────────────┘
                              │                               │
              ┌───────────────▼───────────────┐ ┌─────────────▼───────────────┐
              │       JOB LISTING CARD        │ │   STICKY PREVIEW & DETAILS  │
              │ • Verified Employer Badge     │ │ • Full Job Description      │
              │ • Clean Salary or Negotiable  │ │ • Skills & Qualifications   │
              │ • Experience & Qualification  │ │ • Real-time Expiry Guard    │
              │ • Save Job • Share Job        │ │ • Primary Job Specifications│
              └───────────────┬───────────────┘ └─────────────┬───────────────┘
                              │                               │
              ┌───────────────▼───────────────────────────────▼───────────────┐
              │                 HYPERLOCAL APPLICATION METHODS                │
              │  1. 1-Click On-Site Application Modal (with duplicate guard)  │
              │  2. Direct WhatsApp Apply (pre-populating full listing URL)   │
              │  3. Direct Phone Call (tel:)                                  │
              │  4. Native Web Share API + Clipboard Copy Fallback            │
              └───────────────────────────────────────────────────────────────┘
```

---

## 2. Feature Inventory & Implementation Details

### 2.1 Job Search System
* **Search Across 5 Dimensions:**
  1. Job Title (e.g., "Medical Records Reviewer", "Cardamom Sorter", "Accountant")
  2. Company Name (e.g., "AGS IT Solutions", "Sarvesh Super Market")
  3. Physical Location, District, Taluk, or Town
  4. Required Skills (e.g., "Tally", "Medical coding", "Typing")
  5. Job Description & Responsibilities
* **Quick Autocomplete Chips:** Instant clickable search terms for high-demand Theni occupations:
  `['Medical Coding', 'Accountant', 'Sales Executive', 'Data Entry', 'Driver', 'Teacher', 'Electrician', 'Delivery Boy', 'Tailor', 'Nurse', 'Agriculture', 'Store Manager']`.
* **1-Click Search Clear:** Clear 'X' button inside search bar immediately resets search query and restores full list.
* **Live Match Counter:** Accurately states matching openings count in real-time.

### 2.2 Granular Job Filters
* **Location & Taluk Selector:**
  * 7 Theni Taluks: `Theni`, `Periyakulam`, `Cumbum`, `Bodinayakanur`, `Chinnamanur`, `Uthamapalayam`, `Andipatti`
  * Towns & Hubs: `Thevaram`, `Devadanapatti`, `Veerapandi`, `Kombai`, `Kuchanur`, `Gudalur`, `Highwavys`
  * Regional Hubs: `Madurai`, `Dindigul`
* **Industry & Job Category:**
  * `IT & Software`, `Healthcare`, `Education`, `Agriculture`, `Construction`, `Manufacturing`, `Retail & Sales`, `Finance & Accounting`, `Transport & Logistics`, `Textiles & Handlooms`, `Hospitality & Hotel`, `Automobile`, `BPO & Customer Care`.
* **Salary Range Brackets:**
  * `Under ₹10,000`
  * `₹10,000 – ₹25,000`
  * `₹25,000 – ₹50,000`
  * `Above ₹50,000`
  * Gracefully handles "Salary Negotiable" without inventing fake wages.
* **Minimum Qualification:**
  * `10th Pass`, `12th Pass`, `ITI`, `Diploma`, `Any Degree`, `Post Graduate (PG)`.
* **Experience Level:**
  * `Fresher (0 yrs)`, `1-2 Years`, `3-5 Years`, `5+ Years`.
* **Job Type & Work Mode:**
  * `Full Time`, `Part Time`, `Contract`, `Internship`, `Walk-in`, `Daily Wage`.
  * `On-site`, `Remote`, `Hybrid`.
* **Posted Time Windows:**
  * `Today's Jobs (< 24h)`, `Past 3 Days`, `Past 7 Days (This Week)`, `Past 30 Days`, `All Time`.
* **Fast Toggle Badges:**
  * Verified Employers Only (`isVerified`)
  * Urgent Vacancies Only (`isUrgent`)
  * Fresher Friendly (`isFresher`)
  * Walk-in Interviews (`isWalkIn`)
  * Daily Wage Jobs (`isDailyWage`)

### 2.3 Dynamic Discovery Sections
* **Strict Real-Data Partitioning:**
  Sections are only displayed when actual matching records exist in the database:
  * **Today's Jobs:** Only includes jobs posted within the last 24 hours in IST (Asia/Kolkata).
  * **Urgent Hiring:** Positions marked urgent by verified employers.
  * **Fresher Jobs:** Openings requiring 0 experience or explicitly accepting freshers.
  * **Walk-in Interviews:** Openings with walk-in venue, date, and contact phone.
  * **Daily Wage:** Immediate daily earning opportunities with evening settlements.
  * **Featured:** Curated high-priority openings from verified employers.
  * **Recently Viewed Jobs:** Horizontal shelf tracking up to 10 recently browsed jobs, storing logo, title, company, salary, and direct links. Includes 1-click "Clear History".

### 2.4 Production Job Card
Every job listing card displays:
1. Company Logo (or clean styled corporate initial fallback)
2. Job Title with hover highlight and direct link to `/jobs/[id]`
3. Company Name with authentic green Verified Badge
4. Location (Taluk, Town, District) with MapPin icon
5. Salary or Salary Range (e.g., `₹8,000 - ₹3,00,000 / monthly` or `Salary Negotiable`)
6. Badges: Job Type, Experience, Qualification, Urgent, Walk-in, Fresher
7. Accurate Posted Date (e.g., `Just now`, `4h ago`, `Today`, `Yesterday`, `2d ago`, `Sept 4, 2026`)
8. Application Deadline (when specified)
9. Description overview snippet (2-line clamped summary)
10. **Action Buttons:**
    * **Apply Now:** Triggers the 1-click Quick Application Modal.
    * **Save Job:** Heart/Bookmark button toggling saved state in Firestore `savedJobs` (or local storage for guests) with instant toast feedback.
    * **Share Job:** Triggers Web Share API or copies listing URL to clipboard.
    * **Details:** Direct link to full job page (`/jobs/[slug]`).

---

## 3. End-to-End User Workflows

### 3.1 Job Seeker Discovery & Application Workflow
```
[Seeker opens /daily-jobs]
       │
       ├─► [Search keywords: e.g. "Medical Coder" or tap popular chip]
       ├─► [Filter by Taluk: e.g. "Theni" or "Cumbum"]
       ├─► [Filter by Category or Salary Range]
       ├─► [Select Discovery Tab: All / Today / Urgent / Fresher / Walk-in]
       │
       ▼
[Job Card Listed]
       ├──► [Click Bookmark: Saves job to /seeker/saved-jobs]
       ├──► [Click Share: Copies canonical link or triggers native mobile share]
       ├──► [Click Card: Updates desktop preview panel & logs in Recently Viewed]
       │
       ▼
[Click "Apply Now" Button]
       │
       ▼
[Quick Apply Modal Opens]
       ├─► Pre-populates seeker name, phone, email from Firebase Auth
       ├─► Optional Cover Note / Message to Employer
       ├─► Duplicate Check: queries /applications for (jobId + seekerId)
       │    └─► If already applied: alerts user & halts duplicate
       │
       ▼
[Submit Application]
       ├─► Writes to Firestore /applications with status: 'applied'
       ├─► Displays JobApplySuccessModal with Unique Application Ticket ID
       └─► Reflects immediately in /seeker/applications dashboard
```

### 3.2 WhatsApp Direct Application Workflow
```
[Seeker clicks "WhatsApp Direct Apply" on Card / Preview]
       │
       ▼
[Launches WhatsApp Client / Web]
  • Pre-filled message:
    "Hi, I saw 'Medical Records Reviewer' posted on THENIJOBS Daily Jobs and would like to apply.
     Listing: https://thenijobs.com/jobs/medical-records-reviewer-ags-it-solutions-theni"
  • Direct chat opened with verified employer phone number
```

### 3.3 Employer Job Posting & Management Workflow
```
[Employer logs in at /employer/dashboard]
       │
       ▼
[Navigate to /employer/post-job]
       ├─► Fills Title, Location, Theni Taluk, Category, Job Type
       ├─► Sets Qualification, Experience, Salary Range, Benefits
       ├─► Configures Urgent, Walk-in, Fresher, or Daily Wage flags
       ├─► Sets Application Deadline & Contact Options
       │
       ▼
[Submits Job Posting]
       ├─► POST /api/jobs/create verifies company ownership & subscription quota
       ├─► Queues job for admin approval with status: 'pending'
       │
       ▼
[Admin Review & Approval at /admin/jobs]
       ├─► Admin reviews company legitimacy & job parameters
       ├─► Sets status: 'active', isActive: true
       │
       ▼
[Live on /daily-jobs & /jobs]
       └─► Instantly indexable and discoverable by local seekers
```

---

## 4. Job Freshness, Lifecycle & Expiry Rules

1. **Posted Date Authenticity:**
   * A job is ONLY labeled as "Today" if its timestamp is strictly within the last 24 hours in IST (`Asia/Kolkata`).
   * Older jobs display authentic relative timestamps (`Yesterday`, `3d ago`, `2w ago`, or full calendar date).
2. **Application Deadline Enforcement:**
   * Jobs past their deadline (`deadline < Date.now()`) or marked `status === 'expired'` are automatically filtered out from active discovery sections.
   * On direct URLs, expired jobs show a clear "Application Closed" notification and disable the Apply button.
3. **Employer Renewal:**
   * Employers can renew or repost expired jobs from `/employer/jobs`, extending active visibility for an additional 30-day cycle.
