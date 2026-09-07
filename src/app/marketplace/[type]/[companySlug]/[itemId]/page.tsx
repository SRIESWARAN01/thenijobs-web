import MarketplaceItemPageClient from './MarketplaceItemPageClient';
import { getAllMarketplaceItemParamsServer } from '@/lib/firebase/firestoreServer';

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; companySlug: string; itemId: string }>;
}) {
  const { type, companySlug, itemId } = await params;
  const kind = type === 'service' ? 'Service' : 'Product';

  if (companySlug === '_fallback') {
    return {
      title: `${kind} Details | THENIJOBS Marketplace`,
      description: 'Browse products and services from verified local businesses on THENIJOBS Marketplace.',
    };
  }

  // Same crude, no-fetch slug-to-title guess used by company/[slug]/page.tsx — the real
  // name is set client-side once MarketplaceItemPageClient resolves the actual item.
  const displayCompany = companySlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return {
    title: `${kind} from ${displayCompany} | THENIJOBS Marketplace`,
    description: `View this ${kind.toLowerCase()} offered by ${displayCompany} on THENIJOBS Marketplace. Contact directly via WhatsApp or call to order or enquire.`,
    alternates: {
      canonical: `https://thenijobs.com/marketplace/${type}/${companySlug}/${itemId}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function MarketplaceItemPage({
  params,
}: {
  params: Promise<{ type: string; companySlug: string; itemId: string }>;
}) {
  const { type, companySlug, itemId } = await params;
  return <MarketplaceItemPageClient type={type} companySlug={companySlug} itemId={itemId} />;
}
