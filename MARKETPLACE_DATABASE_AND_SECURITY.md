# THENIJOBS Marketplace — Database Architecture & Security Specifications

## 1. Executive Summary

This document defines the production database schemas, entity relationships, access control models, client storage models, and security rules for the **THENIJOBS Hyperlocal Product & Service Marketplace**. The architecture is built on **Google Cloud Firestore** and **Firebase Storage**, designed to handle real business operations across Theni district while ensuring strict privacy, cross-company isolation, and tamper resistance.

---

## 2. Firestore Collections & Document Schemas

### 2.1 Collection: `companies`
Primary source of truth for registered businesses, suppliers, and service providers. Products and company services are stored as embedded sub-arrays to optimize read throughput, transactional integrity, and atomic publication.

**Document Path:** `/companies/{companyId}`

| Field Name | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique company identifier (matches document ID) |
| `name` | `string` | Yes | Registered business name in English / Tamil |
| `slug` | `string` | Yes | SEO-friendly URL slug (e.g., `theni-organic-farm`) |
| `ownerUid` | `string` | Yes | Firebase Auth UID of the owning merchant |
| `category` | `string` | Yes | Primary business category |
| `district` | `string` | Yes | District (e.g., `Theni`, `Madurai`, `Dindigul`) |
| `taluk` | `string` | No | Theni Taluk (`Theni`, `Periyakulam`, `Cumbum`, `Bodinayakanur`, `Chinnamanur`, `Uthamapalayam`, `Andipatti`) |
| `town` | `string` | No | Town or village (`Thevaram`, `Devadanapatti`, `Veerapandi`, `Kombai`, `Kuchanur`, `Gudalur`, `Highwavys`, etc.) |
| `address` | `string` | Yes | Physical shop / office address |
| `phone` | `string` | Yes | Contact phone number for direct buyer calls |
| `whatsapp` | `string` | No | WhatsApp number for direct hyperlocal orders |
| `email` | `string` | No | Official contact email |
| `website` | `string` | No | Custom domain or external link |
| `logoUrl` | `string` | No | Storage URL for company brand logo |
| `coverUrl` | `string` | No | Storage URL for profile/storefront header banner |
| `verificationStatus` | `string` | Yes | `pending` \| `under_review` \| `verified` \| `rejected` |
| `isVerified` | `boolean` | No | Legacy / boolean flag for quick badge rendering |
| `isFeatured` | `boolean` | No | Admin curation flag for marketplace spotlight |
| `isActive` | `boolean` | Yes | Whether the merchant is active and publicly indexable |
| `products` | `array<ProductItem>` | Yes | Array of product listings (see schema below) |
| `services` | `array<ServiceItem>` | Yes | Array of service listings (see schema below) |
| `createdAt` | `timestamp` | Yes | Document creation timestamp |
| `updatedAt` | `timestamp` | Yes | Last update timestamp |

#### Embedded `ProductItem` Object
```typescript
interface ProductItem {
  id: string;               // Unique ID generated via Date.now() or UUID
  name: string;             // Product title (e.g., "Organic Paneer Grapes 5Kg")
  price?: number;           // Unit price in INR
  priceRange?: string;      // Optional human-readable price range (e.g., "₹500 - ₹750")
  unit?: string;            // Unit (Piece, Kg, Grams, Box, Pack, Liter, Meter, Set, Ton, Dozen, Bundle)
  availability?: string;    // 'in_stock' | 'available' | 'made_to_order' | 'out_of_stock'
  category?: string;        // Product classification (Agriculture, Textiles, etc.)
  subcategory?: string;     // Specific classification (Seeds, Irrigation, Sarees, etc.)
  imageUrl?: string;        // Primary display image
  images?: string[];        // Multi-image gallery URLs
  description?: string;     // Specifications, features, terms
  specifications?: Record<string, string>; // Optional key-value technical specifications
  featured?: boolean;       // Highlighting within store
  createdAt?: string;       // ISO 8601 string
}
```

#### Embedded `ServiceItem` Object
```typescript
interface ServiceItem {
  id: string;               // Unique service identifier
  name: string;             // Service name (e.g., "CCTV Installation & Maintenance")
  price?: number;           // Fixed or base charge in INR
  startingPrice?: number;   // Starting price for quotes
  pricingType?: string;     // 'Fixed' | 'Hourly' | 'Starting at' | 'Per Sq.Ft' | 'Quote upon inspection'
  serviceArea?: string;     // Coverage area (e.g., "Theni & 30km radius")
  category?: string;        // Service domain
  subcategory?: string;     // Service sub-domain
  imageUrl?: string;        // Primary banner / proof of work image
  images?: string[];        // Additional gallery photos
  description?: string;     // Service scope, warranty, terms
  featured?: boolean;       // Featured flag
  createdAt?: string;       // ISO 8601 string
}
```

---

### 2.2 Collection: `leads`
Captures inbound customer inquiries, WhatsApp click-throughs, and quote requests. Connects buyers directly to merchants and feeds the Employer CRM dashboard.

**Document Path:** `/leads/{leadId}`

| Field Name | Type | Required | Description |
|---|---|---|---|
| `companyId` | `string` | Yes | Target company ID receiving the inquiry |
| `name` | `string` | Yes | Customer name |
| `customerName` | `string` | Yes | Alias for UI compatibility |
| `contactName` | `string` | Yes | Alias for CRM compatibility |
| `phone` | `string` | No | Customer phone number |
| `customerPhone` | `string` | No | Alias for CRM tables |
| `message` | `string` | Yes | Inquiry text or WhatsApp intent payload |
| `service` | `string` | Yes | Subject item (e.g., `Product: Paneer Grapes`) |
| `source` | `string` | Yes | Source identifier (e.g., `marketplace_product`, `marketplace_service`) |
| `itemId` | `string` | No | ID of the specific product or service |
| `itemType` | `string` | No | `product` or `service` |
| `status` | `string` | Yes | `new` \| `contacted` \| `in_progress` \| `converted` \| `closed` \| `rejected` |
| `buyerUid` | `string` | No | Firebase Auth UID if buyer was authenticated |
| `createdAt` | `timestamp` | Yes | Firestore `serverTimestamp()` |
| `updatedAt` | `timestamp` | Yes | Firestore `serverTimestamp()` |

> **Security Rule Constraint:** `firestore.rules` enforces that lead documents cannot exceed **15 keys** upon creation and must include `companyId`, `name`, and `message`.

---

### 2.3 Client-Side Storage Schema (`localStorage`)
The client marketplace store (`src/lib/marketplaceStore.ts`) provides persistent offline storage for customer utility features without requiring authentication or incurring unnecessary database reads:

```typescript
export interface MarketplaceSavedItem {
  id: string;
  type: 'product' | 'service';
  name: string;
  price?: number | null;
  priceRange?: string | null;
  unit?: string;
  availability?: string;
  category?: string;
  imageUrl?: string | null;
  description?: string;
  companyName: string;
  companySlug: string;
  district: string;
  phone?: string;
  whatsapp?: string;
  isVerified?: boolean;
  savedAt?: number;
}
```

- **Wishlist Key:** `thenijobs_marketplace_wishlist` (Unbounded array of customer favorites)
- **Recently Viewed Key:** `thenijobs_marketplace_recently_viewed` (FIFO queue capped at 12 items with duplicate elimination)
- **Product Compare Key:** `thenijobs_marketplace_compare` (Capped at 3 products with atomic add/remove guard)
- **Reactive Bus:** Dispatches `thenijobs_marketplace_store_change` event across all components on update.

---

## 3. Firebase Security Rules Audit

### 3.1 Firestore Access Control (`firestore.rules`)
```javascript
// Rule 1: Public Read for Companies & Embedded Marketplace Catalogue
match /companies/{companyId} {
  allow read: if true; // Public marketplace visitors can browse verified items
  allow create: if request.auth != null;
  allow update, delete: if request.auth != null && (
    request.auth.uid == resource.data.ownerUid ||
    request.auth.token.role == 'admin' ||
    request.auth.token.role == 'super_admin'
  );
}

// Rule 2: Inbound Leads / Inquiries Creation
match /leads/{leadId} {
  allow create: if request.resource.data.keys().hasAll(['companyId', 'name', 'message'])
                && request.resource.data.keys().size() <= 15
                && exists(/databases/$(database)/documents/companies/$(request.resource.data.companyId));
  allow read, update, delete: if request.auth != null && (
    request.auth.uid == resource.data.companyOwnerUid ||
    isEmployerInCompany(resource.data.companyId) ||
    request.auth.token.role == 'admin'
  );
}
```

### 3.2 Firebase Storage Rules (`storage.rules`)
```javascript
// Rule 1: Product Images
match /companies/{companyId}/products/{fileName} {
  allow read: if true;
  allow write: if request.auth != null && (
    isCompanyOwner(companyId) ||
    isAdmin()
  ) && request.resource.size < 10 * 1024 * 1024
    && request.resource.contentType.matches('image/.*');
}

// Rule 2: Service Images
match /companies/{companyId}/services/{fileName} {
  allow read: if true;
  allow write: if request.auth != null && (
    isCompanyOwner(companyId) ||
    isAdmin()
  ) && request.resource.size < 10 * 1024 * 1024
    && request.resource.contentType.matches('image/.*');
}

// Rule 3: Standalone Service Banners
match /services/{serviceId}/banner/{fileName} {
  allow read: if true;
  allow write: if request.auth != null && (
    isServiceOwner(serviceId) ||
    isAdmin()
  ) && request.resource.size < 10 * 1024 * 1024
    && request.resource.contentType.matches('image/.*');
}
```

---

## 4. Sensitive Data Protection & Privacy Guardrails

1. **No Client-Side Secret Leakage:** Firebase Admin credentials, Razorpay secret keys, and AI platform keys are never loaded into client bundles.
2. **Contact Number Safeguards:** Only official business numbers approved by merchants during onboarding are surfaced on public cards.
3. **Inquiry Masking:** Buyer email addresses are optional and never publicly displayed; they are transmitted only to the designated merchant's private CRM inbox.
4. **Zero Demo / Fake Data:** Strict prohibition against mock documents in production collections. Listings must be backed by real Firestore records.
