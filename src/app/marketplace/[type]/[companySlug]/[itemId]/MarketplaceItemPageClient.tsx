'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, Package, Wrench, MessageCircle, BadgeCheck, ArrowLeft,
  ExternalLink, MapPin, Sparkles, ShoppingBag,
} from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { resolveCompanyBySlug } from '@/lib/companySlug';

type ItemType = 'product' | 'service';

export default function MarketplaceItemPageClient({
  type: typeProp,
  companySlug: companySlugProp,
  itemId: itemIdProp,
}: {
  type: string;
  companySlug: string;
  itemId: string;
}) {
  // CRITICAL: read the real segments from the URL, not the server props — vercel.json
  // rewrites unknown /marketplace/product|service/* URLs to the _fallback pair, so the
  // props can be '_fallback' while the browser's own URL carries the real values.
  // Mirrors CompanyProfilePageClient.tsx's exact pattern.
  const pathname = usePathname();
  const segments = pathname?.split('/').filter(Boolean) || [];
  // segments: ['marketplace', type, companySlug, itemId]
  const urlType = segments[1] || '';
  const urlCompanySlug = segments[2] || '';
  const urlItemId = segments[3] || '';

  const type: ItemType = (urlType === 'service' || urlType === 'product' ? urlType : typeProp) as ItemType;
  const companySlug = (urlCompanySlug && urlCompanySlug !== '_fallback') ? urlCompanySlug : companySlugProp;
  const itemId = (urlItemId && urlItemId !== '_fallback') ? urlItemId : itemIdProp;

  const [company, setCompany] = useState<any | null>(null);
  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (!companySlug || companySlug === '_fallback' || !itemId || itemId === '_fallback') return;

    async function loadItem() {
      try {
        setLoading(true);
        setNotFoundState(false);

        const docData: any = await resolveCompanyBySlug(companySlug, { includeNameMatch: true });
        if (!docData) {
          setNotFoundState(true);
          setLoading(false);
          return;
        }

        const list: any[] = Array.isArray(docData[type === 'service' ? 'services' : 'products'])
          ? docData[type === 'service' ? 'services' : 'products']
          : [];
        const found = list.find((entry: any) => entry && typeof entry === 'object' && entry.id === itemId);

        if (!found) {
          setNotFoundState(true);
          setLoading(false);
          return;
        }

        setCompany(docData);
        setItem(found);
      } catch (err) {
        console.error('Error loading marketplace item:', err);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [type, companySlug, itemId]);

  // --- Client-side SEO enhancement, same approach as CompanyProfilePageClient.tsx ---
  useEffect(() => {
    if (!company || !item) return;

    const itemName = item.name || item.title || (type === 'service' ? 'Service' : 'Product');
    const companyName = company.name || '';
    const district = company.district || '';
    const description = item.description || item.desc || '';
    const imageUrl = item.imageUrl || company.logoUrl || '';
    const canonicalUrl = `https://www.thenijobs.com/marketplace/${type}/${companySlug}/${itemId}`;

    const title = `${itemName} — ${companyName} | THENIJOBS Marketplace`;
    document.title = title;

    const setMeta = (name: string, content: string, property?: boolean) => {
      if (!content) return;
      const attr = property ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const setLink = (rel: string, href: string) => {
      if (!href) return;
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    const metaDesc = (description || `${itemName} offered by ${companyName} in ${district || 'Theni'}, Tamil Nadu — view on THENIJOBS Marketplace.`).substring(0, 160);

    setMeta('description', metaDesc);
    setMeta('robots', 'index, follow');
    setLink('canonical', canonicalUrl);

    setMeta('og:title', title, true);
    setMeta('og:description', metaDesc, true);
    setMeta('og:type', 'product', true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:site_name', 'THENIJOBS', true);
    if (imageUrl) setMeta('og:image', imageUrl, true);

    setMeta('twitter:card', 'summary');
    setMeta('twitter:title', title);
    setMeta('twitter:description', metaDesc);
    if (imageUrl) setMeta('twitter:image', imageUrl);

    const price = item.price || item.startingPrice || null;
    const jsonLd: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': type === 'service' ? 'Service' : 'Product',
      name: itemName,
      description: description || undefined,
      image: imageUrl || undefined,
      ...(type === 'product'
        ? {
            offers: {
              '@type': 'Offer',
              price: price ? String(price) : undefined,
              priceCurrency: price ? 'INR' : undefined,
              availability: 'https://schema.org/InStock',
              url: canonicalUrl,
            },
          }
        : {
            provider: {
              '@type': 'LocalBusiness',
              name: companyName,
            },
            areaServed: district || 'Theni',
          }),
    };

    const cleanJsonLd = JSON.parse(JSON.stringify(jsonLd));
    let scriptTag = document.getElementById('marketplace-item-jsonld') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'marketplace-item-jsonld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(cleanJsonLd);

    return () => {
      document.getElementById('marketplace-item-jsonld')?.remove();
      document.querySelector('link[rel="canonical"]')?.remove();
    };
  }, [company, item, type, companySlug, itemId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] text-[#111827]">
        <Loader2 size={36} className="text-[#2563EB] animate-spin mb-4" />
        <p className="text-sm text-slate-500">Loading listing...</p>
      </div>
    );
  }

  if (notFoundState || !company || !item) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] text-[#111827]" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-5">
            {type === 'service' ? <Wrench size={36} className="text-gray-300" /> : <Package size={36} className="text-gray-300" />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h1>
          <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
            This product or service is no longer listed, or the link is incorrect.
          </p>
          <Link href="/marketplace" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            <ArrowLeft size={15} /> Back to Marketplace
          </Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  const isVerified = company.verificationStatus === 'verified' || company.isVerified === true;
  const itemName = item.name || item.title || (type === 'service' ? 'Service' : 'Product');
  const description = item.description || item.desc || '';
  const imageUrl = item.imageUrl || '';
  const whatsapp = company.whatsapp || company.phone || '';
  const waMessage = type === 'service'
    ? `Hi ${company.name}, I would like to book your service "${itemName}" listed on THENIJOBS Marketplace.`
    : `Hi ${company.name}, I am interested in ordering your product "${itemName}" listed on THENIJOBS Marketplace.`;
  const priceLabel = type === 'service'
    ? (item.startingPrice || item.price ? `Starts ₹${Number(item.startingPrice || item.price).toLocaleString('en-IN')}` : 'Rate on inquiry')
    : (item.price ? `₹${Number(item.price).toLocaleString('en-IN')}` : item.priceRange || 'Price on request');

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#111827] pb-24" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-5">
          <ArrowLeft size={14} /> Back to Marketplace
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="h-64 sm:h-80 bg-slate-100 relative flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt={itemName} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${type === 'service' ? 'bg-teal-50/50 text-teal-500' : 'bg-blue-50/50 text-blue-400'}`}>
                {type === 'service' ? <Wrench size={48} /> : <Package size={48} />}
              </div>
            )}
            {item.featured === true && (
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 shadow-xs flex items-center gap-1">
                <Sparkles size={11} /> Featured
              </span>
            )}
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black bg-white/90 backdrop-blur-md text-slate-900 shadow-xs">
              {item.category || (type === 'service' ? 'Service' : 'Product')}
            </span>
          </div>

          <div className="p-5 sm:p-8 space-y-6">
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{itemName}</h1>
              <Link
                href={`/company/${company.slug || companySlug}`}
                className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <span>{company.name}</span>
                {isVerified && <BadgeCheck size={13} className="text-blue-600 shrink-0" />}
              </Link>
              {company.district && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin size={11} /> {company.district}
                </p>
              )}
            </div>

            {description && (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{description}</p>
            )}

            <div className={`text-lg font-black ${type === 'service' ? 'text-blue-700' : 'text-emerald-700'}`}>
              {priceLabel}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-slate-100">
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-2xs"
                  style={{ background: type === 'service' ? '#2563EB' : '#25D366' }}
                >
                  <MessageCircle size={15} /> {type === 'service' ? 'Book on WhatsApp' : 'Order on WhatsApp'}
                </a>
              )}
              <Link
                href={`/${company.slug || companySlug}`}
                className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center justify-center gap-2"
              >
                <ExternalLink size={15} /> Visit Official Website
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
            <ShoppingBag size={14} /> Browse more on THENIJOBS Marketplace
          </Link>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
