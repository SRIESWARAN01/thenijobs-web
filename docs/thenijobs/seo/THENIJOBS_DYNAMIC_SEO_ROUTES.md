# THENIJOBS – Public Routes & Dynamic SEO Inventory

**Project:** THENIJOBS  
**Canonical Domain:** `https://www.thenijobs.com`  
**Date:** October 24, 2026  
**Document:** Public Routes & Dynamic SEO Inventory  

---

## 1. Static Public Hub Routes

| Route Path | Canonical URL | Title Strategy | Meta Description Strategy | Indexing Status |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `https://www.thenijobs.com/` | `THENIJOBS – Latest Jobs in Theni \| Private Jobs, Fresher Jobs & Vacancies` | Hyperlocal overview connecting job seekers with verified employers across Theni taluks. | `index, follow` |
| `/jobs` | `https://www.thenijobs.com/jobs` | `Jobs in Theni, Cumbum & Tamil Nadu \| Latest Vacancies \| THENIJOBS` | Filterable job search directory across verified companies in Theni district. | `index, follow` |
| `/daily-jobs` | `https://www.thenijobs.com/daily-jobs` | `Daily Jobs in Theni \| Urgent Hiring & Immediate Joining \| THENIJOBS` | Fresh 24-hour job postings, urgent hiring, and walk-in interview vacancies. | `index, follow` |
| `/marketplace` | `https://www.thenijobs.com/marketplace` | `Marketplace Theni \| Local Products, Services & B2B Deals \| THENIJOBS` | B2B catalog, local products, and commercial services directory. | `index, follow` |
| `/marketplace?type=services` | `https://www.thenijobs.com/marketplace` (Canonical) | `Marketplace Theni \| Local Products, Services & B2B Deals \| THENIJOBS` | Services tab view; canonical points to clean base URL to prevent duplicate indexation. | `index, follow` |
| `/businesses` | `https://www.thenijobs.com/businesses` | `Business Directory Theni \| Verified Companies & Services \| THENIJOBS` | Verified business directory for shops, manufacturing, and trade firms. | `index, follow` |
| `/pricing` | `https://www.thenijobs.com/pricing` | `Employer Subscription Plans & Pricing \| THENIJOBS` | Transparent pricing for job postings, candidate database, and verified company badge. | `index, follow` |
| `/about` | `https://www.thenijobs.com/about` | `About THENIJOBS \| Theni District's Local Job & Business Platform` | Platform mission, coverage of Theni taluks, and trust verification standards. | `index, follow` |
| `/contact` | `https://www.thenijobs.com/contact` | `Contact THENIJOBS \| Support & Business Inquiries` | Direct customer support, office locations, and helpline numbers. | `index, follow` |
| `/privacy` | `https://www.thenijobs.com/privacy` | `Privacy Policy \| THENIJOBS` | Data security, phone privacy, and compliance documentation. | `index, follow` |
| `/terms` | `https://www.thenijobs.com/terms` | `Terms of Service \| THENIJOBS` | User agreements, employer obligations, and anti-fraud policies. | `index, follow` |

---

## 2. Localized Theni Taluk & Category Hub Routes

All 7 primary taluks of Theni district are mapped with dedicated, crawlable SEO hubs:

| Route Path | Canonical URL | Title Pattern | Target Search Intent |
| :--- | :--- | :--- | :--- |
| `/jobs-in-theni` | `https://www.thenijobs.com/jobs-in-theni` | `Jobs in Theni \| Latest Theni Job Vacancies & Openings \| THENIJOBS` | "Jobs in Theni", "Theni job vacancy" |
| `/jobs-in-cumbum` | `https://www.thenijobs.com/jobs-in-cumbum` | `Jobs in Cumbum \| Latest Cumbum Job Vacancies & Openings \| THENIJOBS` | "Jobs in Cumbum", "Cumbum jobs" |
| `/jobs-in-periyakulam` | `https://www.thenijobs.com/jobs-in-periyakulam` | `Jobs in Periyakulam \| Latest Periyakulam Job Vacancies \| THENIJOBS` | "Jobs in Periyakulam" |
| `/jobs-in-bodinayakanur` | `https://www.thenijobs.com/jobs-in-bodinayakanur` | `Jobs in Bodinayakanur \| Latest Bodinayakanur Job Vacancies \| THENIJOBS` | "Bodinayakanur cardamon trade jobs" |
| `/jobs-in-chinnamanur` | `https://www.thenijobs.com/jobs-in-chinnamanur` | `Jobs in Chinnamanur \| Latest Chinnamanur Job Vacancies \| THENIJOBS` | "Jobs in Chinnamanur" |
| `/jobs-in-uthamapalayam` | `https://www.thenijobs.com/jobs-in-uthamapalayam` | `Jobs in Uthamapalayam \| Latest Uthamapalayam Vacancies \| THENIJOBS` | "Jobs in Uthamapalayam" |
| `/jobs-in-andipatti` | `https://www.thenijobs.com/jobs-in-andipatti` | `Jobs in Andipatti \| Latest Andipatti Job Vacancies \| THENIJOBS` | "Jobs in Andipatti handloom/textile" |
| `/jobs-in-madurai` | `https://www.thenijobs.com/jobs-in-madurai` | `Jobs in Madurai \| Regional Openings \| THENIJOBS` | Regional commute jobs |
| `/jobs-in-dindigul` | `https://www.thenijobs.com/jobs-in-dindigul` | `Jobs in Dindigul \| Regional Openings \| THENIJOBS` | Regional commute jobs |

### Taluk $\times$ Category Combinations (`/jobs-in-{location}/{category}`)
* Example: `/jobs-in-theni/freshers` $\rightarrow$ Canonical: `https://www.thenijobs.com/jobs-in-theni/freshers`
* Title: `Freshers Jobs in Theni | Vacancies & Openings | THENIJOBS`
* Categories supported: `freshers`, `it-software`, `sales`, `accounting`, `teaching`, `healthcare`, `engineering`, `drivers`, `hotel-restaurant`, etc.

---

## 3. Dynamic Entity Routes

### A. Individual Job Openings (`/jobs/[id]`)
* **Route Format:** `/jobs/{slug}` (e.g., `/jobs/senior-react-developer-theni-tech-solutions-ab12`)
* **Canonical URL:** `https://www.thenijobs.com/jobs/{slug}`
* **Title Rule:** `{job.title} in {job.district} | {job.companyName} | THENIJOBS`
* **Meta Description Rule:** Derived from authentic job description, salary range, and requirements.
* **Legacy Redirection:** If accessed via old document ID, permanently redirected (308) to canonical slug.
* **Expiry Rule:** Expired jobs return `robots: { index: false, follow: true }` and display an expired notification with recommendations for active jobs.

### B. Company Profiles & Landing Pages (`/company/[slug]` & `/[slug]`)
* **Route Format:** `/company/{slug}` and `/{slug}`
* **Canonical URL:** `https://www.thenijobs.com/company/{slug}`
* **Title Rule:** `{company.name} — {company.category} in {company.district} | THENIJOBS`
* **Verification Rule:** Only approved, verified businesses are indexable; unverified profiles return 404 to public crawlers.
* **Schema:** `LocalBusiness` / `Organization` JSON-LD.

### C. Individual Marketplace Products (`/marketplace/product/[companySlug]/[itemId]`)
* **Canonical URL:** `https://www.thenijobs.com/marketplace/product/{companySlug}/{itemId}`
* **Title Rule:** `{product.name} — {company.name} in {district} | THENIJOBS Marketplace`
* **Schema:** `Product` JSON-LD with authentic pricing and seller organization.

### D. Individual Marketplace Services (`/marketplace/service/[companySlug]/[itemId]`)
* **Canonical URL:** `https://www.thenijobs.com/marketplace/service/{companySlug}/{itemId}`
* **Title Rule:** `{service.name} — {company.name} in {district} | THENIJOBS Marketplace`
* **Schema:** `Service` JSON-LD with provider details.

---

## 4. Protected Private Routes (Shielded from Indexing)

The following routes are explicitly shielded via `robots.ts` and Next.js authentication guards:
* `/admin/*`: Administrator operations, governance, analytics.
* `/employer/*`: Employer post-job portal, candidate tracking, billing.
* `/seeker/*`: Job seeker applied jobs, saved profiles, alerts.
* `/api/*`: Internal backend endpoints and payment callbacks.
* `/login`, `/register`, `/register-business`, `/forgot-password`: Authentication forms.
