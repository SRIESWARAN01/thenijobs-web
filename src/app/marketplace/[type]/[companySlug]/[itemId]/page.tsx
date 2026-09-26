import MarketplaceItemPageClient from './MarketplaceItemPageClient';
import { getAllMarketplaceItemParamsServer, getMarketplaceItemServer } from '@/lib/firebase/firestoreServer';
import { generateBreadcrumbSchema } from '@/lib/seo/schemas';
import {
  generateProductSEO, generateServiceSEO,
  generateProductSchemaLD, generateServiceSchemaLD,
  canonicalProductUrl, canonicalServiceUrl,
} from '@/lib/seo/seoEngine';
import { toJsonLdScript } from '@/lib/seo/jsonLd';
import type { Metadata } from 'next';

// vercel.json rewrites any unknown /marketplace/product/* or /marketplace/service/*
// URL to the matching _fallback pair below; the client component then resolves the
// real segments from the URL itself (see MarketplaceItemPageClient.tsx).
const STATIC_FALLBACK_PARAMS = [
  { type: 'product', companySlug: '_fallback', itemId: '_fallback' },
  { type: 'service', companySlug: '_fallback', itemId: '_fallback' },
];

export async function generateStaticParams() {
  const dynamicParams = await getAllMarketplaceItemParamsServer().catch(() => []);
  const seen = new Set(STATIC_FALLBACK_PARAMS.map((p) => `${p.type}/${p.companySlug}/${p.itemId}`));
  const merged = [...STATIC_FALLBACK_PARAMS];
  for (const p of dynamicParams) {
    const key = `${p.type}/${p.companySlug}/${p.itemId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(p);
  }
  return merged;
}

/**
 * SEO-CRITICAL: Server-side metadata generation using REAL Firebase data.
 * Google crawlers receive actual product/service names, descriptions, and images.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; companySlug: string; itemId: string }>;
}): Promise<Metadata> {
  const { type, companySlug, itemId } = await params;
  const kind = type === 'service' ? 'Service' : 'Product';

  if (companySlug === '_fallback') {
    return {
      title: `${kind} Details | THENIJOBS Marketplace`,
      description: 'Browse products and services from verified local businesses on THENIJOBS Marketplace.',
      robots: { index: false, follow: true },
    };
  }

  // Fetch real item data from Firebase
  const itemType = type === 'service' ? 'service' : 'product';
  const result = await getMarketplaceItemServer(itemType, companySlug, itemId).catch(() => null);

  if (result) {
    const { company, item } = result;
    if (type === 'service') {
      return generateServiceSEO(item, company);
    }
    return generateProductSEO(item, company);
  }

  // Fallback: item not found server-side (may resolve client-side)
  const displayCompany = companySlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const canonical = type === 'service'
    ? canonicalServiceUrl(companySlug, itemId)
    : canonicalProductUrl(companySlug, itemId);

  return {
    title: `${kind} from ${displayCompany} | THENIJOBS Marketplace`,
    description: `View this ${kind.toLowerCase()} offered by ${displayCompany} on THENIJOBS Marketplace. Contact directly via WhatsApp or call to order or enquire.`,
    openGraph: {
      title: `${kind} from ${displayCompany} | THENIJOBS Marketplace`,
      description: `View this ${kind.toLowerCase()} offered by ${displayCompany} on THENIJOBS Marketplace.`,
      url: canonical,
      type: 'website',
      siteName: 'THENIJOBS',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${kind} from ${displayCompany} | THENIJOBS`,
      description: `View this ${kind.toLowerCase()} on THENIJOBS Marketplace.`,
    },
    alternates: { canonical },
    robots: { index: true, follow: true },
  };
}

export default async function MarketplaceItemPage({
  params,
}: {
  params: Promise<{ type: string; companySlug: string; itemId: string }>;
}) {
  const { type, companySlug, itemId } = await params;
  const kind = type === 'service' ? 'Service' : 'Product';

  // Fetch real data for server-side structured data
  const itemType = type === 'service' ? 'service' : 'product';
  const result = await getMarketplaceItemServer(itemType, companySlug, itemId).catch(() => null);

  const displayCompany = result?.company?.name || companySlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const itemName = result?.item?.name || `${kind} Details`;

  // Breadcrumb with real names
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://thenijobs.com' },
    { name: 'Marketplace', url: 'https://thenijobs.com/marketplace' },
    { name: displayCompany, url: `https://thenijobs.com/company/${companySlug}` },
    { name: itemName, url: `https://thenijobs.com/marketplace/${type}/${companySlug}/${itemId}` },
  ]);

  // Product or Service JSON-LD — only when real data exists
  let entitySchema = null;
  if (result) {
    const { company, item } = result;
    entitySchema = type === 'service'
      ? generateServiceSchemaLD(item, company)
      : generateProductSchemaLD(item, company);
  }

  return (
    <>
      {/* BreadcrumbList JSON-LD — always rendered server-side */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbSchema) }}
      />
      {/* Product/Service JSON-LD — server-side for Google */}
      {entitySchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLdScript(entitySchema) }}
        />
      )}
      <MarketplaceItemPageClient type={type} companySlug={companySlug} itemId={itemId} />
    </>
  );
}
