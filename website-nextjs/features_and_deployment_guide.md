# THENIJOBS — Complete Features, Functions, Pending Works & Deployment Guide

Welcome to the comprehensive documentation for **THENIJOBS**, a localized job marketplace and business directory platform custom-tailored for the Theni district, Tamil Nadu. This application is built as a single-codebase Next.js web application paired with Firebase services (Authentication, Firestore, Storage, Cloud Functions, and Hosting).

---

## 1. Key Features & User Workflows

THENIJOBS supports six primary user roles. Below is a breakdown of their features and key journeys:

### 1.1 Job Seeker (`/seeker/*`)
* **Profile Building**: Create detailed profiles specifying contact details, district, experience, education, skills, and resume upload.
* **Resume Management**: A built-in multi-section resume builder generates standardized resumes and supports PDF export.
* **Job Tracking & Applications**: Search jobs with district/category filters, apply with custom cover letters, track status (Applied → Shortlisted → Interview → Selected/Rejected).
* **Interviews**: View upcoming interviews scheduled by employers, including meeting links (Google Meet, etc.) or venue details.
* **AI Career Coach**: An AI-powered mock interview helper and coach (integrated with a waitlist queue).

### 1.2 Employer (`/employer/*`)
* **Company Profile**: Manage business logo, details, gallery, social media links, and verification status.
* **Job Postings**: Create job listings with skill requirements, location/district filters, and salary range. Postings are gated by plan quotas.
* **Applicant Pipelines**: Review applicants, shortlist candidates, message seekers, and schedule interviews.
* **Talent Search**: Search the public database of job seekers who are "Open to Work."

### 1.3 Business Owner & Entrepreneur (`/business/*`)
* **Directory Listings**: Create public business profiles visible in `/businesses`.
* **Lead Dashboard**: Collect, view, and track inbound client leads/enquiries (New → Contacted → Qualified → Converted → Lost).
* **Reviews & Feedback**: Manage ratings and feedback left by customers on the public profile.

### 1.4 Supplier (`/supplier/*`)
* **B2B Showcase**: List products and details for business-to-business commerce.
* **RFQs**: Receive requests for quotations from potential buyers.

### 1.5 Service Provider (`/service/*`)
* **Local Services**: List repair, maintenance, or other local services in the `/services` catalog.
* **Request Management**: Receive and track local service bookings.

### 1.6 Admin Control Panel (`/admin/*`)
* **Dashboard**: Monitor real-time platform metrics (revenue, total jobs, registered companies, active users).
* **Moderation Queues**: Approve or reject company registrations, check GST details, and moderate job postings before they go live.
* **Operational Control**: Configure districts, manage advertisements (banners & sponsored links), and send platform-wide notification broadcasts.

---

## 2. Pending Works & Technical Audit (Roadmap)

A professional software audit identified the following critical vulnerabilities and design limitations that need to be resolved. Below is the master list of pending works:

| ID | Component | Severity | Finding Description | Impact | Solution Status / Recommended Fix |
|---|---|---|---|---|---|
| **E-01** | Security | **CRITICAL** | Any visitor can self-register as an "employer" and read all job-seekers' public profile data. | Job-seeker PII leak risk. | **SOLVED** (Gated `publicProfiles` read rules in `firestore.rules` behind `hasVerifiedEmployerAccess()`). |
| **E-02** | Notifications | **HIGH** | Seeker application notifications fail silently because client code is blocked from writing directly to another user's notifications. | Employers miss new applications. | **SOLVED** (Client code routes notification writes through the secure `createNotification` Cloud Function callable). |
| **E-03** | Architecture / SEO | **HIGH** | Static export (`output: 'export'`) prevents dynamic routes (jobs, companies) from being crawled. | Pages show empty shells to Google, blocking organic acquisition. | *Pending / Recommended* (Migrate to SSR/ISR on Firebase or use standard Next.js dynamic routing without the `'export'` target). |
| **E-04** | Payments | **HIGH** | No payment gateway integration; plan upgrades require manual admin approval. | Friction in monetizing subscriptions. | *Pending / Recommended* (Integrrate Razorpay/Cashfree API and write a `verifyPayment` callable function to automatically stamp paid subscriptions). |
| **E-05** | Data/Privacy | **MEDIUM** | Company documentation (GST & registration numbers) is co-located with public company data. | Leak of sensitive business registration info. | **SOLVED** (Separated writes into `/companies/{companyId}/private/verification` subcollection, which is gated in `firestore.rules` to admin and owners only). |
| **E-06** | UI Styling | **MEDIUM** | Dynamic Tailwind class names (`bg-${r.color}-500/20`) do not compile under Tailwind v4. | Selected role styling is missing in the registration UI. | **SOLVED** (Mapped dynamic colors to a static color/tint dictionary in `register/page.tsx`). |
| **E-07** | Functions | **MEDIUM** | Dead status ternary (`status: plan === 'free' ? 'active' : 'active'`) inside `index.ts`. | Subscription expiration checks fail to compute status accurately. | **SOLVED** (Derived status values dynamically from `endDate` using `getEffectiveSubscriptionStatus()`). |
| **E-08** | Security | **MEDIUM** | Permissive `leads` creation rules; no App Check enforcement on callables. | Spam/abuse vector for listings. | **SOLVED** (Added strict validation constraints on fields in `firestore.rules` for leads and enabled callable checking). |
| **E-09** | Performance | **MEDIUM** | Unbounded list reads; lack of query pagination limits. | Slower page load and high read costs as data grows. | **SOLVED** (Added default query boundaries (`limit(24)`) and implemented bulk operation batching via `writeBatch(db)`). |
| **E-10** | Accessibility | **MEDIUM** | Low contrast text, tiny font sizes, and lack of motion control guards. | Fails WCAG AA standards. | **SOLVED** (Increased `--muted-foreground` lightness to `72%` in `globals.css` and adjusted badge font sizes to `12px` for readability). |

---

## 3. Local Execution & Testing Instructions

To run the application and execute the test suites locally, follow these guidelines:

### 3.1 Prerequisite Setup
Ensure you have **Node.js (v20+)** installed on your system.

1. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```
2. **Install Cloud Functions Dependencies**:
   ```bash
   npm --prefix functions install
   ```

### 3.2 Running the Development Server
Launch the local Next.js dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser to interact with the frontend.

### 3.3 Running Local Unit and Integration Tests
The project uses **Vitest** for component and logic testing.

* **Execute all tests (local run only)**:
  If script execution is disabled on Windows (Powershell execution policy restriction), run the tests by bypassing the restriction:
  ```powershell
  powershell -ExecutionPolicy Bypass -Command "npm run test"
  ```
  This runs all test files (e.g., `sample.test.tsx`, `reminders.test.tsx`, `dashboards.test.tsx`) in headless mode and outputs the pass/fail results.

---

## 4. Firebase Deployment Guide

Once verification passes locally, deploy the application configuration, security rules, functions, and frontend using the following steps:

### 4.1 Prerequisites
1. Install the Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```
2. Authenticate the Firebase CLI with your Google Account:
   ```bash
   firebase login
   ```

### 4.2 Automated Deployment Script
For convenience, a deployment script is provided at `deploy.bat` which handles building the frontend, compiling Cloud Functions, verifying dependencies, and executing the deployment.

* **To run the deployment script**:
  Open a command prompt (CMD) in the directory `e:\thenijobs-main\website-nextjs` and run:
  ```cmd
  deploy.bat
  ```
  *This script will:*
  1. Build the Next.js static files (`npm run build`).
  2. Compile the TypeScript Cloud Functions.
  3. Deploy Hosting, Functions, Firestore Rules, Firestore Indexes, and Storage Rules to Firebase project **`thenijobs-9f01d`**.

### 4.3 Manual Step-by-Step Deployment
If you prefer to deploy components individually:

1. **Build and Deploy Frontend (Hosting)**:
   ```bash
   npm run build
   firebase deploy --only hosting --project thenijobs-9f01d
   ```
2. **Build and Deploy Cloud Functions**:
   ```bash
   npm --prefix functions run build
   firebase deploy --only functions --project thenijobs-9f01d
   ```
3. **Deploy Security Rules and Indexes**:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage --project thenijobs-9f01d
   ```

Live URLs after successful deployment:
* **Production App**: [https://thenijobs-9f01d.web.app](https://thenijobs-9f01d.web.app)
* **Secondary Mirror**: [https://thenijobs-9f01d.firebaseapp.com](https://thenijobs-9f01d.firebaseapp.com)
