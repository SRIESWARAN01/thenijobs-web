/**
 * THENIJOBS — Centralized Structured Data Generators
 *
 * Provides reusable generators for Schema.org JSON-LD markup used across pages.
 * All contact info is sourced from SITE_CONTACT to stay consistent.
 */

import { SITE_CONTACT } from '@/lib/constants';

const BASE_URL = 'https://thenijobs.com';

/**
 * Schema.org Organization for THENIJOBS.
 *
 * Used on the homepage `@graph` and anywhere the platform needs to identify itself
 * (as opposed to a listed company). Includes social profiles so Google's Knowledge
 * Panel can link to them.
 */
export function generateOrganizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: 'THENIJOBS',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Local Job Portal & Business Directory for Theni District, Tamil Nadu',
    foundingDate: '2024',
    sameAs: [
      BASE_URL,
      `https://wa.me/${SITE_CONTACT.whatsapp}`,
      'https://www.linkedin.com/company/thenijobs',
      'https://www.youtube.com/@thenijobs',
    ].filter(Boolean),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: SITE_CONTACT.phone1,
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['Tamil', 'English'],
      },
      {
        '@type': 'ContactPoint',
        telephone: SITE_CONTACT.phone2,
        contactType: 'sales',
        areaServed: 'IN',
        availableLanguage: ['Tamil', 'English'],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONTACT.fullAddress,
      addressLocality: 'Uthamapalayam',
      addressRegion: 'Tamil Nadu',
      postalCode: '625533',
      addressCountry: 'IN',
    },
  };
}

/**
 * Schema.org LocalBusiness for THENIJOBS's own office.
 *
 * This represents THENIJOBS as a local business entity (employment agency / web portal)
 * rather than a company listed on the platform. Used on `/contact` and optionally on `/`.
 */
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EmploymentAgency',
    '@id': `${BASE_URL}/#localbusiness`,
    name: 'THENIJOBS',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    image: `${BASE_URL}/og-image.jpg`,
    description:
      'THENIJOBS is the #1 local job portal and business directory for Theni District, Tamil Nadu. We connect job seekers with verified employers and help local businesses grow.',
    telephone: SITE_CONTACT.phone1,
    email: SITE_CONTACT.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONTACT.fullAddress,
      addressLocality: 'Uthamapalayam',
      addressRegion: 'Tamil Nadu',
      postalCode: '625533',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 9.8064,
      longitude: 77.3316,
    },
    areaServed: [
      { '@type': 'City', name: 'Theni' },
      { '@type': 'City', name: 'Cumbum' },
      { '@type': 'City', name: 'Periyakulam' },
      { '@type': 'City', name: 'Bodinayakanur' },
      { '@type': 'City', name: 'Uthamapalayam' },
      { '@type': 'City', name: 'Chinnamanur' },
      { '@type': 'City', name: 'Andipatti' },
      { '@type': 'AdministrativeArea', name: 'Theni District' },
      { '@type': 'State', name: 'Tamil Nadu' },
    ],
    priceRange: 'Free – ₹5,000/year',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '18:00',
    },
    sameAs: [
      BASE_URL,
      `https://wa.me/${SITE_CONTACT.whatsapp}`,
      'https://www.linkedin.com/company/thenijobs',
      'https://www.youtube.com/@thenijobs',
    ],
  };
}

/**
 * Helper to build breadcrumb items from simple path segments.
 *
 * Example:
 *   buildBreadcrumbItems([
 *     { name: 'Home', path: '/' },
 *     { name: 'Jobs', path: '/jobs' },
 *     { name: 'Software Developer', path: '/jobs/abc123' },
 *   ])
 */
export function buildBreadcrumbItems(
  items: { name: string; path: string }[]
): { name: string; url: string }[] {
  return items.map((item) => ({
    name: item.name,
    url: item.path.startsWith('http') ? item.path : `${BASE_URL}${item.path}`,
  }));
}

/**
 * Generates Schema.org BreadcrumbList JSON-LD object.
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}

/**
 * Generates Schema.org FAQPage JSON-LD object.
 */
export function generateFaqSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

/**
 * Generates Schema.org Product JSON-LD object for Marketplace products.
 */
export function generateProductSchema(product: {
  id?: string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  companyName: string;
  companySlug?: string;
  district?: string;
}) {
  const url = product.companySlug && product.id
    ? `${BASE_URL}/marketplace/product/${product.companySlug}/${product.id}`
    : `${BASE_URL}/marketplace`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} offered by ${product.companyName}`,
    image: product.imageUrl ? [product.imageUrl] : undefined,
    offers: {
      '@type': 'Offer',
      price: product.price ? String(product.price) : '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url,
      seller: {
        '@type': 'Organization',
        name: product.companyName,
      },
    },
  };
}

/**
 * Generates Schema.org Service JSON-LD object for Marketplace services.
 */
export function generateServiceSchema(service: {
  id?: string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  companyName: string;
  companySlug?: string;
  district?: string;
}) {
  const url = service.companySlug && service.id
    ? `${BASE_URL}/marketplace/service/${service.companySlug}/${service.id}`
    : `${BASE_URL}/marketplace`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description || `${service.name} by ${service.companyName}`,
    image: service.imageUrl ? [service.imageUrl] : undefined,
    provider: {
      '@type': 'LocalBusiness',
      name: service.companyName,
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: service.district ? `${service.district} District` : 'Theni District',
    },
    offers: service.price ? {
      '@type': 'Offer',
      price: String(service.price),
      priceCurrency: 'INR',
      url,
    } : undefined,
  };
}

/**
 * Generates Schema.org Organization / LocalBusiness JSON-LD for individual companies.
 */
export function generateCompanyOrganizationSchema(company: {
  id?: string;
  slug?: string;
  name: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  phone?: string;
  email?: string;
  district?: string;
  address?: string;
  website?: string;
}) {
  const companyUrl = company.slug ? `${BASE_URL}/company/${company.slug}` : BASE_URL;

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${companyUrl}/#organization`,
    name: company.name,
    description: company.description || `${company.name} in ${company.district || 'Theni'}, Tamil Nadu`,
    url: companyUrl,
    logo: company.logoUrl || `${BASE_URL}/logo.png`,
    image: company.coverUrl || company.logoUrl || undefined,
    telephone: company.phone || undefined,
    email: company.email || undefined,
    address: company.address ? {
      '@type': 'PostalAddress',
      streetAddress: company.address,
      addressLocality: company.district || 'Theni',
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
    } : undefined,
  };
}
