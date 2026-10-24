# THENIJOBS – Structured Data (JSON-LD) Audit & Implementation Report

**Project:** THENIJOBS  
**Standard:** Schema.org / Google Search Central Rich Results  
**Format:** Server-rendered JSON-LD (`application/ld+json`)  
**Date:** October 24, 2026  
**Document:** Structured Data Implementation & Validation Report  

---

## 1. Summary of Implemented JSON-LD Types

| Schema Type | Target Routes | Primary Purpose | Validation Status |
| :--- | :--- | :--- | :--- |
| **`WebSite`** | `/` (Homepage) | Enables Google Sitelinks Search Box via `SearchAction` | **VALID** (Complies with Google spec) |
| **`Organization`** | `/`, `/company/[slug]` | Establishes platform and company entity identity, logos, and socials | **VALID** (Zero missing required fields) |
| **`LocalBusiness`** | `/`, `/company/[slug]` | Provides geo-targeted address, district, state, and contact details | **VALID** (Valid PostalAddress) |
| **`JobPosting`** | `/jobs/[id]` | Powers Google for Jobs rich cards with direct apply links | **VALID** (Strict salary and expiry rules) |
| **`Product`** | `/marketplace/product/*` | Renders rich product snippets with pricing and in-stock offers | **VALID** (Includes brand, seller, offer) |
| **`Service`** | `/marketplace/service/*` | Renders commercial service cards with provider attribution | **VALID** (Valid service provider) |
| **`BreadcrumbList`** | All public pages | Generates structured breadcrumb navigation in Google SERPs | **VALID** (Continuous 1-indexed hierarchy) |
| **`FAQPage`** | `/` (Homepage) | Renders collapsible FAQ accordion rich snippets in search results | **VALID** (Compliant Question/Answer pairs) |

---

## 2. Detailed Schema Property Specifications

### A. Google `JobPosting` Schema (`src/lib/seo/jobSchema.ts`)
```json
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "Senior Sales Executive",
  "description": "<p>Full job description matching visible page text...</p>",
  "identifier": {
    "@type": "PropertyValue",
    "name": "THENIJOBS",
    "value": "job-101"
  },
  "datePosted": "2026-10-15T09:00:00.000Z",
  "validThrough": "2026-11-15T23:59:59.000Z",
  "employmentType": "FULL_TIME",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "Theni Commercial Traders",
    "sameAs": "https://www.thenijobs.com/company/theni-commercial-traders",
    "logo": "https://www.thenijobs.com/uploads/logo.png"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Bazaar Street",
      "addressLocality": "Theni",
      "addressRegion": "Tamil Nadu",
      "addressCountry": "IN"
    }
  },
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "INR",
    "value": {
      "@type": "QuantitativeValue",
      "minValue": 18000,
      "maxValue": 25000,
      "unitText": "MONTH"
    }
  },
  "directApply": true
}
```

#### Strict Guardrails Enforced:
1. **No Fabricated Salaries:** If the employer selected "Negotiable" or left salary empty, the `baseSalary` node is omitted entirely rather than generating dummy numbers.
2. **Immediate Expiry Suppression:** If `isJobExpired(job)` evaluates to `true`, the `JobPosting` script tag is completely omitted from the HTML output, preventing Google's "Expired job posting still marked up" search console warning.
3. **Exact Visible Match:** Description in JSON-LD matches the rendered HTML body.

---

### B. `LocalBusiness` / `Organization` Schema (`src/lib/seo/seoEngine.ts`)
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://www.thenijobs.com/company/theni-textiles/#organization",
  "name": "Theni Textiles Pvt Ltd",
  "description": "Leading textile and garment manufacturing unit in Theni, Tamil Nadu.",
  "url": "https://www.thenijobs.com/company/theni-textiles",
  "logo": "https://www.thenijobs.com/uploads/textile-logo.png",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Madurai Main Road",
    "addressLocality": "Theni",
    "addressRegion": "Tamil Nadu",
    "addressCountry": "IN"
  },
  "telephone": "+919876543210",
  "foundingDate": "2018"
}
```

---

### C. `Product` & `Service` Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Organic Cardamom Premium Grade 500g",
  "description": "Fresh green cardamom sourced directly from Bodinayakanur plantations.",
  "url": "https://www.thenijobs.com/marketplace/product/bodi-spices/cardamom-500g",
  "image": ["https://www.thenijobs.com/uploads/cardamom.jpg"],
  "brand": {
    "@type": "Organization",
    "name": "Bodi Spices Ltd"
  },
  "offers": {
    "@type": "Offer",
    "price": "1250",
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock",
    "url": "https://www.thenijobs.com/marketplace/product/bodi-spices/cardamom-500g",
    "seller": {
      "@type": "Organization",
      "name": "Bodi Spices Ltd"
    }
  }
}
```

---

### D. `BreadcrumbList` Schema
Continuous hierarchical trail across all deep routes:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.thenijobs.com" },
    { "@type": "ListItem", "position": 2, "name": "Jobs", "item": "https://www.thenijobs.com/jobs" },
    { "@type": "ListItem", "position": 3, "name": "Jobs in Theni", "item": "https://www.thenijobs.com/jobs-in-theni" },
    { "@type": "ListItem", "position": 4, "name": "Senior Accountant", "item": "https://www.thenijobs.com/jobs/senior-accountant-theni-ab12" }
  ]
}
```

---

## 3. Validation Methodology & Automated Invariant Tests

All schemas have been validated using:
1. **Google Rich Results Test Guidelines:** Verified required vs recommended properties for JobPosting, LocalBusiness, and BreadcrumbList.
2. **Schema.org Context Compliance:** Uses standard `@context: "https://schema.org"` with valid object graphs.
3. **Automated Unit Tests (`tests/seo.test.mjs`):**
   * Confirms `JobPosting` attributes, currency formatting, and numeric bounds.
   * Confirms `BreadcrumbList` continuous positional increments (`1, 2, 3, ...`).
   * Confirms suppression of sensitive internal keys (`adminNotes`, `status`).

---

## 4. Remaining Items for Production Review
* **Employer Logos:** When an employer posts a job without a company logo, the fallback site logo `/og-image.jpg` is used. Employers should be encouraged during onboarding to upload high-resolution square logos (1:1 aspect ratio, min 112x112px) to optimize Google for Jobs card rendering.
