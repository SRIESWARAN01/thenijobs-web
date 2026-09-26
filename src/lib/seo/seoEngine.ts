/**
 * THENIJOBS — Centralized SEO Engine
 *
 * Master SEO utility module for generating metadata, structured data,
 * canonical URLs, image SEO, and validation across all entity types.
 *
 * Entity types: COMPANY, JOB, PRODUCT, SERVICE, IMAGE, CATEGORY, LOCATION
 */

import type { Metadata } from 'next';
import type { ServerCompanyData } from '@/lib/firebase/firestoreServer';
import { slugify } from './jobSlug';

const BASE_URL = 'https://thenijobs.com';
const SITE_NAME = 'THENIJOBS';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;

// ─── Canonical URL Helpers ────────────────────────────────────────────────────

export function canonicalCompanyUrl(slug: string): string {
  return `${BASE_URL}/company/${slug}`;
}

export function canonicalJobUrl(slugOrId: string): string {
  return `${BASE_URL}/jobs/${slugOrId}`;
}

export function canonicalProductUrl(companySlug: string, itemId: string): string {
  return `${BASE_URL}/marketplace/product/${companySlug}/${itemId}`;
}

export function canonicalServiceUrl(companySlug: string, itemId: string): string {
  return `${BASE_URL}/marketplace/service/${companySlug}/${itemId}`;
}

export function canonicalMarketplaceUrl(): string {
  return `${BASE_URL}/marketplace`;
}

// ─── Image SEO Utilities ──────────────────────────────────────────────────────

/**
 * Generate meaningful alt text from entity context.
 * Never returns empty — uses entity information to create descriptive text.
 */
export function generateImageAlt(params: {
  entityType: 'company-logo' | 'company-cover' | 'product' | 'service' | 'job' | 'gallery';
  entityName: string;
  companyName?: string;
  location?: string;
  category?: string;
}): string {
  const { entityType, entityName, companyName, location } = params;
  const loc = location ? ` in ${location}` : '';

  switch (entityType) {
    case 'company-logo':
      return `${entityName} company logo${loc}`;
    case 'company-cover':
      return `${entityName} business${loc}`;
    case 'product':
      return companyName
        ? `${entityName} from ${companyName}${loc}`
        : `${entityName}${loc}`;
    case 'service':
      return companyName
        ? `${entityName} by ${companyName}${loc}`
        : `${entityName}${loc}`;
    case 'job':
      return companyName
        ? `${entityName} at ${companyName}${loc}`
        : `${entityName}${loc}`;
    case 'gallery':
      return companyName
        ? `${companyName} — ${entityName}${loc}`
        : `${entityName}${loc}`;
    default:
      return entityName || 'Image';
  }
}

/**
 * Generate an SEO-friendly filename from entity context.
 */
export function generateSeoFilename(params: {
  entityName: string;
  companyName?: string;
  location?: string;
  suffix?: string;
  extension?: string;
}): string {
  const parts = [
    params.entityName,
    params.companyName,
    params.location,
    params.suffix,
  ].filter(Boolean).map(s => slugify(s!));

  const name = parts.join('-') || 'image';
  const ext = params.extension || 'webp';
  return `${name}.${ext}`;
}

// ─── Company SEO ──────────────────────────────────────────────────────────────

export function generateCompanySEO(company: ServerCompanyData): Metadata {
  const name = company.name || 'Business';
  const category = company.category || '';
  const district = company.district || 'Theni';
  const description = company.description || '';
  const slug = company.slug || slugify(name);
  const canonical = canonicalCompanyUrl(slug);
  const logoUrl = company.logoUrl || company.coverUrl || '';
  const ogImage = logoUrl || DEFAULT_OG_IMAGE;

  const title = `${name}${category ? ` — ${category}` : ''} in ${district} | ${SITE_NAME}`;
  const metaDesc = description
    ? description.substring(0, 155) + (description.length > 155 ? '…' : '')
    : `View ${name}'s verified company profile on ${SITE_NAME}. See job openings, products, services, and contact information in ${district}, Tamil Nadu.`;

  const keywords = [
    name,
    `${name} ${district}`,
    category ? `${category} ${district}` : '',
    `${name} jobs`,
    `${name} products`,
    `${name} services`,
    `businesses in ${district}`,
    district,
    'Tamil Nadu',
    SITE_NAME,
  ].filter(Boolean);

  return {
    title,
    description: metaDesc,
    keywords,
    alternates: { canonical },
    robots: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1, 'max-video-preview': -1 },
    openGraph: {
      title: `${name}${category ? ` — ${category}` : ''} in ${district}`,
      description: metaDesc,
      url: canonical,
      type: 'website',
      locale: 'en_IN',
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: generateImageAlt({ entityType: 'company-logo', entityName: name, location: district }) }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | ${SITE_NAME}`,
      description: metaDesc,
      images: [ogImage],
    },
  };
}

/**
 * Generate Organization/LocalBusiness JSON-LD for an individual company page.
 */
export function generateCompanySchema(company: ServerCompanyData) {
  const slug = company.slug || slugify(company.name);
  const companyUrl = canonicalCompanyUrl(slug);

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${companyUrl}/#organization`,
    name: company.name,
    description: company.description || `${company.name} in ${company.district || 'Theni'}, Tamil Nadu`,
    url: companyUrl,
  };

  if (company.logoUrl) schema.logo = company.logoUrl;
  if (company.coverUrl || company.logoUrl) schema.image = company.coverUrl || company.logoUrl;
  if (company.phone) schema.telephone = company.phone;
  if (company.email) schema.email = company.email;
  if (company.website) schema.sameAs = [company.website, company.facebook, company.instagram, company.linkedin, company.youtube].filter(Boolean);
  if (company.foundedYear) schema.foundingDate = String(company.foundedYear);

  if (company.address || company.district) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: company.address || company.district || 'Theni',
      addressLocality: company.district || 'Theni',
      addressRegion: company.state || 'Tamil Nadu',
      addressCountry: 'IN',
    };
  }

  return schema;
}

// ─── Product SEO ──────────────────────────────────────────────────────────────

export function generateProductSEO(product: {
  id: string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
}, company: ServerCompanyData): Metadata {
  const name = product.name || 'Product';
  const companyName = company.name || 'Local Business';
  const district = company.district || 'Theni';
  const companySlug = company.slug || slugify(companyName);
  const canonical = canonicalProductUrl(companySlug, product.id);
  const ogImage = product.imageUrl || company.logoUrl || DEFAULT_OG_IMAGE;

  const title = `${name} — ${companyName} in ${district} | ${SITE_NAME} Marketplace`;
  const metaDesc = product.description
    ? product.description.substring(0, 155) + (product.description.length > 155 ? '…' : '')
    : `${name} offered by ${companyName} in ${district}, Tamil Nadu. View details, pricing, and contact directly on ${SITE_NAME}.`;

  return {
    title,
    description: metaDesc,
    keywords: [name, `${name} ${district}`, companyName, `products in ${district}`, product.category || ''].filter(Boolean),
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${name} — ${companyName}`,
      description: metaDesc,
      url: canonical,
      type: 'website',
      locale: 'en_IN',
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: generateImageAlt({ entityType: 'product', entityName: name, companyName, location: district }) }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | ${companyName} | ${SITE_NAME}`,
      description: metaDesc,
      images: [ogImage],
    },
  };
}

/**
 * Generate Product JSON-LD structured data.
 * Only includes price/availability when real data exists.
 */
export function generateProductSchemaLD(product: {
  id: string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
}, company: ServerCompanyData) {
  const companySlug = company.slug || slugify(company.name);
  const url = canonicalProductUrl(companySlug, product.id);

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} by ${company.name}`,
    url,
  };

  if (product.imageUrl) schema.image = [product.imageUrl];

  schema.brand = {
    '@type': 'Organization',
    name: company.name,
  };

  // Only include Offer when real price exists — never fabricate
  if (product.price && product.price > 0) {
    schema.offers = {
      '@type': 'Offer',
      price: String(product.price),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url,
      seller: { '@type': 'Organization', name: company.name },
    };
  }

  return schema;
}

// ─── Service SEO ──────────────────────────────────────────────────────────────

export function generateServiceSEO(service: {
  id: string;
  name: string;
  description?: string;
  startingPrice?: number;
  imageUrl?: string;
  bannerImageUrl?: string;
  category?: string;
}, company: ServerCompanyData): Metadata {
  const name = service.name || 'Service';
  const companyName = company.name || 'Local Business';
  const district = company.district || 'Theni';
  const companySlug = company.slug || slugify(companyName);
  const canonical = canonicalServiceUrl(companySlug, service.id);
  const ogImage = service.bannerImageUrl || service.imageUrl || company.logoUrl || DEFAULT_OG_IMAGE;

  const title = `${name} — ${companyName} in ${district} | ${SITE_NAME} Marketplace`;
  const metaDesc = service.description
    ? service.description.substring(0, 155) + (service.description.length > 155 ? '…' : '')
    : `${name} provided by ${companyName} in ${district}, Tamil Nadu. View details, pricing, and contact directly on ${SITE_NAME}.`;

  return {
    title,
    description: metaDesc,
    keywords: [name, `${name} ${district}`, companyName, `services in ${district}`, service.category || ''].filter(Boolean),
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${name} — ${companyName}`,
      description: metaDesc,
      url: canonical,
      type: 'website',
      locale: 'en_IN',
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: generateImageAlt({ entityType: 'service', entityName: name, companyName, location: district }) }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | ${companyName} | ${SITE_NAME}`,
      description: metaDesc,
      images: [ogImage],
    },
  };
}

/**
 * Generate Service JSON-LD structured data.
 */
export function generateServiceSchemaLD(service: {
  id: string;
  name: string;
  description?: string;
  startingPrice?: number;
  imageUrl?: string;
  bannerImageUrl?: string;
}, company: ServerCompanyData) {
  const companySlug = company.slug || slugify(company.name);
  const url = canonicalServiceUrl(companySlug, service.id);

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description || `${service.name} by ${company.name}`,
    url,
    provider: {
      '@type': 'LocalBusiness',
      name: company.name,
      url: canonicalCompanyUrl(companySlug),
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: company.district ? `${company.district} District` : 'Theni District',
    },
  };

  const imageUrl = service.bannerImageUrl || service.imageUrl;
  if (imageUrl) schema.image = [imageUrl];

  if (service.startingPrice && service.startingPrice > 0) {
    schema.offers = {
      '@type': 'Offer',
      price: String(service.startingPrice),
      priceCurrency: 'INR',
      url,
    };
  }

  return schema;
}

// ─── SEO Validation ───────────────────────────────────────────────────────────

export type SEOStatus = 'PASS' | 'WARNING' | 'ERROR';

export interface SEOValidationResult {
  status: SEOStatus;
  field: string;
  message: string;
}

/**
 * Validate SEO readiness for a page/entity.
 */
export function validateSEOPage(params: {
  title?: string;
  description?: string;
  canonical?: string;
  imageUrl?: string;
  imageAlt?: string;
  h1?: string;
  structuredData?: boolean;
}): SEOValidationResult[] {
  const results: SEOValidationResult[] = [];

  // Title
  if (!params.title) {
    results.push({ status: 'ERROR', field: 'title', message: 'Missing page title' });
  } else if (params.title.length > 70) {
    results.push({ status: 'WARNING', field: 'title', message: `Title too long (${params.title.length} chars, recommended ≤70)` });
  } else {
    results.push({ status: 'PASS', field: 'title', message: 'Title present and correct length' });
  }

  // Description
  if (!params.description) {
    results.push({ status: 'ERROR', field: 'description', message: 'Missing meta description' });
  } else if (params.description.length > 160) {
    results.push({ status: 'WARNING', field: 'description', message: `Description too long (${params.description.length} chars, recommended ≤160)` });
  } else {
    results.push({ status: 'PASS', field: 'description', message: 'Description present and correct length' });
  }

  // Canonical
  if (!params.canonical) {
    results.push({ status: 'ERROR', field: 'canonical', message: 'Missing canonical URL' });
  } else if (params.canonical.includes('www.')) {
    results.push({ status: 'WARNING', field: 'canonical', message: 'Canonical uses www. — should match primary domain' });
  } else {
    results.push({ status: 'PASS', field: 'canonical', message: 'Canonical URL present' });
  }

  // Image
  if (!params.imageUrl) {
    results.push({ status: 'WARNING', field: 'image', message: 'No primary image URL' });
  } else {
    results.push({ status: 'PASS', field: 'image', message: 'Image URL present' });
  }

  // Alt text
  if (params.imageUrl && !params.imageAlt) {
    results.push({ status: 'WARNING', field: 'imageAlt', message: 'Image present but missing alt text' });
  }

  // Structured data
  if (!params.structuredData) {
    results.push({ status: 'WARNING', field: 'structuredData', message: 'No structured data (JSON-LD)' });
  } else {
    results.push({ status: 'PASS', field: 'structuredData', message: 'Structured data present' });
  }

  return results;
}

/**
 * Validate image SEO attributes.
 */
export function validateImageSEO(params: {
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
}): SEOValidationResult[] {
  const results: SEOValidationResult[] = [];

  if (!params.url) {
    results.push({ status: 'ERROR', field: 'imageUrl', message: 'Missing image URL' });
  } else if (!params.url.startsWith('https://')) {
    results.push({ status: 'WARNING', field: 'imageUrl', message: 'Image URL is not HTTPS' });
  } else {
    results.push({ status: 'PASS', field: 'imageUrl', message: 'Image URL valid and HTTPS' });
  }

  if (!params.alt) {
    results.push({ status: 'ERROR', field: 'imageAlt', message: 'Missing alt text' });
  } else if (params.alt.length < 5) {
    results.push({ status: 'WARNING', field: 'imageAlt', message: 'Alt text too short' });
  } else {
    results.push({ status: 'PASS', field: 'imageAlt', message: 'Alt text present' });
  }

  if (!params.width || !params.height) {
    results.push({ status: 'WARNING', field: 'dimensions', message: 'Missing width/height (may cause CLS)' });
  }

  return results;
}

/**
 * Indexing readiness check — returns true only when all critical criteria pass.
 */
export function checkIndexingReadiness(params: {
  isPublic: boolean;
  hasCanonical: boolean;
  robotsAllow: boolean;
  inSitemap: boolean;
  hasContent: boolean;
  hasStructuredData: boolean;
  imagesAccessible: boolean;
}): { ready: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!params.isPublic) reasons.push('Page is not public');
  if (!params.hasCanonical) reasons.push('Missing canonical URL');
  if (!params.robotsAllow) reasons.push('Blocked by robots');
  if (!params.inSitemap) reasons.push('Not in sitemap');
  if (!params.hasContent) reasons.push('No content');
  if (!params.hasStructuredData) reasons.push('No structured data');
  if (!params.imagesAccessible) reasons.push('Images not accessible');

  return { ready: reasons.length === 0, reasons };
}
