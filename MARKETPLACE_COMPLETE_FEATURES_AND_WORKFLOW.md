# THENIJOBS MARKETPLACE — COMPLETE FEATURES, ARCHITECTURE & WORKFLOW SPECIFICATION

> **Document:** `MARKETPLACE_COMPLETE_FEATURES_AND_WORKFLOW.md`  
> **Platform:** THENIJOBS (Next.js 16.3.4 Production Web Platform + Cloud Firestore + Firebase Storage)  
> **Module:** Hyperlocal Product & Service Marketplace (`/marketplace`, `/services`, `/marketplace/[type]/[companySlug]/[itemId]`)  
> **Target Geos:** Theni District, Cumbum Valley, Periyakulam, Bodinayakanur, Chinnamanur, Uthamapalayam, Andipatti, Thevaram, Devadanapatti, Veerapandi, Kombai, Kuchanur, Gudalur, Highwavys, Madurai, Dindigul, Tamil Nadu  
> **Implementation Status:** Fully Implemented, Verified, and Tested (59/59 Tests Passing)  

---

## 1. Executive Summary & Marketplace Architecture

The **THENIJOBS Marketplace** is the dedicated hyperlocal B2B and B2C product and service commerce discovery engine for Theni District and Tamil Nadu. It bridges local consumers, corporate procurement buyers, farmers, and contractors directly with verified local businesses, manufacturers, agricultural producers, and licensed service technicians without commission or middleman fees.

### Unified Architecture: Single Marketplace Engine
The platform consolidates both general marketplace commerce and dedicated service technician discovery into a single, high-performance engine:
- **Marketplace Hub:** `/marketplace` — Displays all catalog offerings (Products, Services, and Verified Businesses).
- **Services Dedicated View:** `/marketplace?type=services` — Filters exclusively to professional service listings with specialized service categories, subcategories, and search chips.
- **Legacy Route Preservation:** Requests to `/services` automatically redirect to `/marketplace?type=services` with canonical SEO pointing to `/marketplace`.
- **Browser History Integration:** Full support for browser **Back** and **Forward** navigation via Next.js `router.push()` with URL query synchronization, zero page refreshes, and zero layout shift.

```
                      ┌───────────────────────────────────────────────┐
                      │             THENIJOBS MARKETPLACE            │
                      │               (/marketplace)                  │
                      └───────┬───────────────────────────────┬───────┘
                              │                               │
              ┌───────────────▼───────────────┐ ┌─────────────▼───────────────┐
              │         PRODUCTS TAB          │ │        SERVICES TAB         │
              │   (/marketplace?type=products)│ │  (/marketplace?type=services)│
              └───────────────┬───────────────┘ └─────────────┬───────────────┘
                              │                               │
              ┌───────────────▼───────────────────────────────▼───────────────┐
              │             UNIFIED SEARCH, FILTERS & TALUKS                  │
              │  • Keyword Autocomplete • Taluk & Town Dropdown • Categories  │
              │  • Subcategory Filters  • Price Range Filters   • 5-Way Sort  │
              │  • ❤️ Wishlist (N)      • 🕒 Recently Viewed    • ⚖️ Compare  │
              └───────────────┬───────────────────────────────┬───────────────┘
                              │                               │
              ┌───────────────▼───────────────┐ ┌─────────────▼───────────────┐
              │    PRODUCT DETAIL PAGE        │ │    SERVICE DETAIL PAGE      │
              │ /marketplace/product/[slug]/id│ │ /marketplace/service/[slug]/id│
              └───────────────┬───────────────┘ └─────────────┬───────────────┘
                              │                               │
              ┌───────────────▼───────────────────────────────▼───────────────┐
              │               HYPERLOCAL LEAD CONVERSION                     │
              │  • Direct WhatsApp Order (with full listing URL)              │
              │  • On-Site Direct Inquiry Modal (<= 15 keys Firestore rule)   │
              │  • Click-to-Call Direct Line (tel:)                           │
              │  • Web Share API + Clipboard Copy Fallback                    │
              └───────────────┬───────────────────────────────┬───────────────┘
                              │                               │
              ┌───────────────▼───────────────┐ ┌─────────────▼───────────────┐
              │       EMPLOYER DASHBOARD      │ │        ADMIN PORTAL         │
              │   • Inbound Leads CRM         │ │   • Business Verification   │
              │   • Product & Service Manager │ │   • Marketplace Moderation  │
              │   • WebP Storage Uploader     │ │   • Live Listing Previews   │
              └───────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. Source Code Inventory & File Responsibilities

| File Path | Role & Responsibilities |
|---|---|
| `src/app/marketplace/page.tsx` | Server-rendered entry point for `/marketplace`. Houses static Breadcrumb JSON-LD schema, canonical meta, and Open Graph tags. |
| `src/app/marketplace/MarketplaceBrowseClient.tsx` | Public browse client with tab switching (`all`, `products`, `services`, `companies`, `wishlist`), live search, subcategory & taluk filters, price range filters, 5-way sorting, recently viewed tray, comparison dock/modal, and WhatsApp inquiry triggers. |
| `src/lib/marketplaceStore.ts` | Reactive SSR-safe client storage engine managing **Wishlist**, **Recently Viewed** (up to 12 items), and **Product Comparison** (up to 3 items) with custom event dispatching (`thenijobs_marketplace_store_change`). |
| `src/app/marketplace/[type]/[companySlug]/[itemId]/page.tsx` | Dynamic SSR route for product and service item pages. Executes `getMarketplaceItemServer` to fetch real data from Firestore REST and injects JSON-LD Product/Service schema. |
| `src/app/marketplace/[type]/[companySlug]/[itemId]/MarketplaceItemPageClient.tsx` | Client view for product and service items. Features recently viewed recording, wishlist toggle, compare toggle, multi-image gallery with zoom, seller verification badge, WhatsApp lead generation (embedding full listing URL), direct call button, inquiry modal, and related items. |
| `src/app/services/page.tsx` | Clean redirect route forwarding `/services` to `/marketplace?type=services`. |
| `src/components/company/CompanyProductsManager.tsx` | Employer dashboard component for adding, updating, and removing product listings in `companies.products`. Features WebP image upload, unit dropdown, stock availability, and AI description generation. |
| `src/components/company/CompanyServicesManager.tsx` | Employer dashboard component for managing service listings in `companies.services`. Includes WebP image optimization and live preview links. |
| `src/components/company/editor/CompanyProfileEditor.tsx` | Full business editor managing company branding, contact details, coordinates, products catalogue, and services directory. |
| `src/app/employer/company-profile/page.tsx` | Employer route rendering `CompanyProfileEditor` connected to the active authenticated user's company document. |
| `src/app/employer/dashboard/page.tsx` | Employer hub displaying company verification status, real-time metrics, active jobs, recent applications, and quick actions. |
| `src/app/employer/leads/page.tsx` | Inbound CRM lead management interface for business owners to view, qualify, and update customer inquiries. |
| `src/app/admin/businesses/page.tsx` | Admin business moderation engine for approving, rejecting, suspending, and verifying registered companies. |
| `src/app/admin/services/page.tsx` | Admin service and marketplace moderation portal for reviewing and previewing all company-embedded products and services. |
| `src/app/admin/leads/page.tsx` | Admin leads oversight displaying inbound inquiries across all companies and service requests. |
| `src/lib/firebase/firestoreServer.ts` | Server-side Firestore REST query utilities for SEO metadata generation and sitemap param collection. |
| `src/lib/firebase/firestoreService.ts` | Client-side Firestore SDK helpers (`createLead`, `updateLeadStatus`, `fetchCollection`, etc.). |
| `firestore.rules` | Security rules enforcing RBAC, owner validation, safe lead creation (&le; 15 keys), and data boundary protection. |
| `storage.rules` | Cloud Storage security rules restricting file extensions, sizes, and ownership for product and service images. |
| `tests/marketplace.test.mjs` | Automated unit and integration test suite covering tab sync, taluk filters, price boundaries, sorting, lead rules, WhatsApp encoding, client store, and subcategories. |

---

## 3. Comprehensive Feature Matrix

### 3.1 Customer Features
1. **Smart Universal Search:** Real-time search across product names, service names, business names, categories, and descriptions.
2. **Interactive Search Autocomplete:** Quick-tap chips for popular Theni specialties (Cardamom, Silk Dhotis, Drip Irrigation, Farm Labor, Solar, CCTV, Honey).
3. **Hyperlocal Location Filters:**
   - 7 Theni Taluks: Theni, Periyakulam, Cumbum, Bodinayakanur, Chinnamanur, Uthamapalayam, Andipatti.
   - Key Towns & Service Hubs: Thevaram, Devadanapatti, Veerapandi, Kombai, Kuchanur, Gudalur, Highwavys.
   - Regional Hubs: Madurai, Dindigul.
4. **Hierarchical Category & Subcategory Filtering:**
   - **Agriculture:** Seeds & Plants, Fertilizers & Pesticides, Farm Tools, Irrigation, Animal Feed.
   - **Textiles & Handlooms:** Sarees & Dhotis, Handloom Towels, Fabrics & Yarn, Garments.
   - **Food & Groceries:** Spices & Cardamom, Cold Pressed Oils, Honey & Natural Foods, Rice & Grains, Dairy & Beverages.
   - **Electronics & Hardware:** Electricals, Plumbing, Mobile & Computers, Solar & Power.
   - **Building & Construction:** Brick & Cement, Steel & Hardware, Painting & Tiles.
   - **Services:** Home Repairs, Transport & Logistics, Professional Services, Events & Catering, Automotive.
5. **Price Range Filters:**
   - Under ₹500
   - ₹500 – ₹2,000
   - ₹2,000 – ₹10,000
   - Above ₹10,000
6. **5-Way Sorting:**
   - Featured (Admin curated first)
   - Price: Low to High
   - Price: High to Low
   - Name: A to Z
   - Newest Added
7. **Wishlist / Favorites:**
   - 1-click heart icon on cards and detail pages.
   - Dedicated `❤️ Wishlist (N)` filter tab in the browse interface.
   - Persistent client-side storage across sessions.
8. **Recently Viewed Listings:**
   - Horizontal scrollable tray on `/marketplace`.
   - Tracks up to 12 most recently visited products and services with automatic deduplication.
   - 1-click "Clear History" action.
9. **Side-by-Side Product Comparison:**
   - Compare up to 3 products simultaneously.
   - Floating compare dock displays selected item count and 1-click "Compare Now" trigger.
   - Comprehensive Comparison Modal displaying: Thumbnail, Product Name, Price, Unit, Availability, Category, Seller Name, Location, Verified Status, Specifications, and Direct WhatsApp Action.
10. **Direct WhatsApp Inquiry with Listing URL:**
    - Instant click-to-chat with the verified merchant.
    - Pre-populates the WhatsApp message with:
      - Seller Business Name
      - Product/Service Name
      - Price & Unit
      - Full Canonical Listing URL (`Listing: ${listingUrl}`)
      - Prompt for stock availability and delivery.
11. **Direct Click-to-Call:**
    - Native `tel:${company.phone}` button for buyers who prefer immediate phone conversations.
12. **On-Site Lead Inquiry Form:**
    - Modal for direct online lead submission.
    - Ingests customer name, phone number, and custom message.
    - Strictly compliant with Firestore security rule (&le; 15 keys).
13. **Verified Merchant Badging:**
    - Authentic blue verification badge with tooltip indicating verified Theni business status.
14. **Bilingual English + Tamil UI:**
    - Instant 1-click language switcher (`EN` / `தமிழ்`).

---

### 3.2 Product & Service Management (Business Owner)
1. **Product Specifications & Details:** Name, description, category, subcategory, unit price, unit type (Piece, Kg, Box, Liter, Pack, Meter, Set, Ton), and availability status (`in_stock`, `made_to_order`, `available`, `out_of_stock`).
2. **Direct Image Upload & WebP Compression:** Real file upload to Firebase Storage under `companies/{companyId}/products/`.
3. **Service Management:** Service name, starting price, pricing type (Fixed, Hourly, Starting at, Per Sq.Ft, Quote), service coverage area, and proof-of-work images.
4. **Live Marketplace Previews:** Direct external links from the management modals to view exactly how the listing renders to public buyers.
5. **Inbound Leads CRM:** Real-time lead tracking under `/employer/leads` showing customer contact info, inquiry message, source listing, and qualification stages.

---

### 3.3 Administrator Moderation & Oversight
1. **Unified Listing Inspection:** Portal at `/admin/services` aggregating products, company services, and standalone services.
2. **Business Verification Review:** Under `/admin/businesses`, administrators verify business legitimacy, GST/MSME certificates, and enable the verified badge.
3. **Live Preview Links:** 1-click navigation to inspect any merchant listing directly on the live storefront.
4. **Audit Trail & Governance:** Maintains role-based access control protecting merchant and seeker data boundaries.

---

## 4. End-to-End User Workflows

### 4.1 Customer Product Discovery & Conversion Workflow
```
[Customer on /marketplace]
       │
       ├─► [Search keywords or tap autocomplete chip]
       ├─► [Select Tab: All / Products / Services / Businesses / Wishlist]
       ├─► [Filter by Theni Taluk / Town]
       ├─► [Filter by Category & Subcategory]
       ├─► [Filter by Price Range (e.g. ₹500 - ₹2,000)]
       ├─► [Sort by: Price Low to High / Newest]
       │
       ▼
[Product Listing Card]
       ├──► [Click Heart: Adds to Wishlist]
       ├──► [Click Compare (Products only): Adds to Comparison Dock (Max 3)]
       ├──► [Click WhatsApp: Opens chat with prefilled message & listing URL]
       ├──► [Click Inquire: Opens on-site Lead Modal -> saves to /leads]
       │
       ▼
[Click Card / Details -> Product Detail Page]
       ├─► Auto-logged in Recently Viewed Tray
       ├─► View Multi-Image Gallery with zoom
       ├─► Check Unit Price, Stock Availability, & Specifications
       ├─► View Verified Seller Card & Theni Taluk
       ├─► Share via Web Share API or Copy Link
       ├─► Related Products from same category
       └─► Primary Actions: Direct WhatsApp (with listing URL) | Call Seller | Send Inquiry
```

### 4.2 Product Comparison Workflow
```
[Customer browsing Products]
       │
       ▼
[Click "Compare" icon on Product 1] ──► Dock appears: "1 product selected"
       │
       ▼
[Click "Compare" icon on Product 2] ──► Dock updates: "2 products selected"
       │
       ▼
[Click "Compare" icon on Product 3] ──► Dock updates: "3 products selected (Max reached)"
       │
       ▼
[Click "Compare Now" on Floating Dock]
       │
       ▼
[Comparison Modal Opens Side-by-Side Table]
  • Image & Product Name
  • Price & Unit (Highlighting best value)
  • Stock Availability
  • Category & Subcategory
  • Seller Company & Verified Badge
  • Location (Taluk / District)
  • Description / Specifications
  • Direct WhatsApp Order button for each item
```

---

## 5. Automated Testing & Verification Sign-Off

All marketplace logic and integrations are backed by automated tests in `tests/marketplace.test.mjs`:
- **59 / 59 Test Assertions Passing (100%)**
- **0 TypeScript Compilation Errors (`npx tsc --noEmit`)**
- **0 ESLint Errors (`npm run lint`)**
- **Clean Turbopack execution on `http://localhost:3000/marketplace` and `http://localhost:3000/marketplace?type=services`**
