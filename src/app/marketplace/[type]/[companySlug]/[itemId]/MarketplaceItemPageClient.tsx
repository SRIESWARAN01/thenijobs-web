'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, Package, Wrench, MessageCircle, BadgeCheck, ArrowLeft,
  ExternalLink, MapPin, Sparkles, ShoppingBag, ChevronRight,
  Phone, Share2, Send, CheckCircle2, X, Tag, ShieldCheck,
  Calendar, Layers, Check, Globe, Heart, Scale
} from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { resolveCompanyBySlug } from '@/lib/companySlug';
import { createLead } from '@/lib/firebase/firestoreService';
import { useAuth } from '@/hooks/useAuth';
import PosterStudioModal from '@/components/employer/poster/PosterStudioModal';
import { PosterData } from '@/lib/poster/types';
import {
  addRecentlyViewed,
  isInWishlist,
  toggleWishlist,
  isInCompare,
  toggleCompareItem
} from '@/lib/marketplaceStore';

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
  const pathname = usePathname();
  const segments = pathname?.split('/').filter(Boolean) || [];
  const urlType = segments[1] || '';
  const urlCompanySlug = segments[2] || '';
  const urlItemId = segments[3] || '';

  const type: ItemType = (urlType === 'service' || urlType === 'product' ? urlType : typeProp) as ItemType;
  const companySlug = (urlCompanySlug && urlCompanySlug !== '_fallback') ? urlCompanySlug : companySlugProp;
  const itemId = (urlItemId && urlItemId !== '_fallback') ? urlItemId : itemIdProp;

  const { user } = useAuth();

  const [company, setCompany] = useState<any | null>(null);
  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Wishlist & Compare State
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCompared, setIsCompared] = useState(false);

  // Inquiry Modal State
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  // Share Toast
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);

  // Bilingual Language Toggle (EN / TA)
  const [lang, setLang] = useState<'en' | 'ta'>('en');

  useEffect(() => {
    if (user) {
      if (user.displayName) setCustomerName(user.displayName);
      if (user.phone) setCustomerPhone(user.phone);
      if (user.email) setCustomerEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    setIsWishlisted(isInWishlist(itemId));
    setIsCompared(isInCompare(itemId));
  }, [itemId]);

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

        // Record to Recently Viewed
        addRecentlyViewed({
          id: itemId,
          type,
          name: found.name || found.title || (type === 'service' ? 'Service' : 'Product'),
          price: found.price || found.startingPrice || null,
          priceRange: found.priceRange || null,
          unit: found.unit,
          availability: found.availability,
          category: found.category || docData.category,
          imageUrl: found.imageUrl || (Array.isArray(found.images) && found.images[0]) || docData.logoUrl || null,
          description: found.description || found.desc || '',
          companyName: docData.name,
          companySlug: docData.slug || companySlug,
          district: docData.district || 'Theni',
          phone: docData.phone,
          whatsapp: docData.whatsapp || docData.phone,
          isVerified: docData.verificationStatus === 'verified' || docData.isVerified === true,
        });
      } catch (err) {
        console.error('Error loading marketplace item:', err);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [type, companySlug, itemId]);

  // Client-side SEO enhancement
  useEffect(() => {
    if (!company || !item) return;

    const itemName = item.name || item.title || (type === 'service' ? 'Service' : 'Product');
    const companyName = company.name || '';
    const district = company.district || '';
    const description = item.description || item.desc || '';
    const imageUrl = item.imageUrl || (Array.isArray(item.images) && item.images[0]) || company.logoUrl || '';
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

    setMeta('twitter:card', 'summary_large_image');
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
              availability: item.availability === 'out_of_stock' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
              url: canonicalUrl,
            },
          }
        : {
            provider: {
              '@type': 'LocalBusiness',
              name: companyName,
            },
            areaServed: item.serviceArea || district || 'Theni District',
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
        <p className="text-sm text-slate-500 font-medium">Loading listing details...</p>
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
  
  // Image gallery compilation
  const galleryImages: string[] = [];
  if (item.imageUrl) galleryImages.push(item.imageUrl);
  if (Array.isArray(item.images)) {
    item.images.forEach((img: string) => {
      if (img && !galleryImages.includes(img)) galleryImages.push(img);
    });
  }

  const activeImage = galleryImages[activeImageIndex] || galleryImages[0] || '';

  const whatsapp = company.whatsapp || company.phone || '';
  const directPhone = company.phone || company.whatsapp || '';

  // Actual listing URL embedded directly in the WhatsApp message
  const listingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/marketplace/${type}/${company.slug || companySlug}/${itemId}`
    : `https://www.thenijobs.com/marketplace/${type}/${company.slug || companySlug}/${itemId}`;

  const waMessage = type === 'service'
    ? `Hello ${company.name}, I am interested in your service "${itemName}" listed on THENIJOBS Marketplace.\nListing: ${listingUrl}\nPlease share pricing and availability.`
    : `Hello ${company.name}, I am interested in ordering your product "${itemName}" (₹${item.price || 'quote'}) listed on THENIJOBS Marketplace.\nListing: ${listingUrl}\nPlease let me know its availability and delivery details.`;

  const priceFormatted = item.price ? `₹${Number(item.price).toLocaleString('en-IN')}` : null;
  const startingPriceFormatted = item.startingPrice ? `Starts ₹${Number(item.startingPrice).toLocaleString('en-IN')}` : null;

  const priceLabel = type === 'service'
    ? (startingPriceFormatted || priceFormatted || (item.pricingType ? `Pricing: ${item.pricingType}` : 'Rate on inquiry'))
    : (priceFormatted ? `${priceFormatted}${item.unit ? ` / ${item.unit}` : ''}` : item.priceRange || 'Price on request');

  const otherItems: any[] = (Array.isArray(company[type === 'service' ? 'services' : 'products'])
    ? company[type === 'service' ? 'services' : 'products']
    : []
  ).filter((entry: any) => entry && typeof entry === 'object' && entry.id !== itemId).slice(0, 4);

  const itemPosterData: PosterData | null = useMemo(() => {
    if (!company || !item) return null;
    return {
      id: itemId,
      type: type as 'product' | 'service',
      title: itemName,
      companyName: company.name,
      companyLogoUrl: company.logoUrl || company.logo,
      category: item.category || company.category || (type === 'service' ? 'Professional Service' : 'Retail Product'),
      location: company.address || company.district || 'Theni District',
      district: company.district || 'Theni District',
      salaryText: priceLabel,
      jobType: type === 'service' ? 'Service Showcase' : 'Product Catalogue',
      experience: 'Special Offers & Inquiries',
      education: 'Scan to View Full Details',
      highlights: [
        description ? description.slice(0, 75) + '...' : `${itemName} available at ${company.name}`,
        'Direct WhatsApp inquiry and order booking available',
        'Verified local business on THENIJOBS Marketplace'
      ],
      publicUrl: listingUrl,
      isVerified: isVerified,
      isFeatured: true,
      itemPrice: priceLabel,
    };
  }, [company, item, type, itemName, priceLabel, description, listingUrl, isVerified, itemId]);

  const handleWhatsAppOrder = async () => {
    if (company?.id) {
      try {
        await createLead({
          companyId: company.id,
          name: customerName || 'WhatsApp Marketplace Customer',
          customerName: customerName || 'WhatsApp Marketplace Customer',
          phone: customerPhone || directPhone,
          message: waMessage,
          service: `${type === 'service' ? 'Service' : 'Product'}: ${itemName}`,
          source: `marketplace_${type}`,
          itemId,
          itemType: type,
        });
      } catch (e) {
        console.warn('Inbound lead capture notice:', e);
      }
    }
  };

  const handleSendLeadInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      setInquiryError(lang === 'ta' ? 'பெயர் மற்றும் தொடர்பு எண் அவசியம்' : 'Name and phone number are required');
      return;
    }

    try {
      setSubmittingInquiry(true);
      setInquiryError('');

      await createLead({
        companyId: company.id,
        name: customerName.trim(),
        customerName: customerName.trim(),
        phone: customerPhone.trim(),
        customerPhone: customerPhone.trim(),
        message: inquiryMessage.trim() || `Inquiry for ${itemName} on THENIJOBS Marketplace: ${listingUrl}`,
        service: `${type === 'service' ? 'Service' : 'Product'}: ${itemName}`,
        source: `marketplace_${type}_inquiry`,
        itemId,
        itemType: type,
        status: 'new',
      });

      setInquirySuccess(true);
      setTimeout(() => {
        setInquirySuccess(false);
        setInquiryModalOpen(false);
        setInquiryMessage('');
      }, 2500);
    } catch (err: any) {
      console.error('Error submitting lead:', err);
      setInquiryError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handleToggleWishlist = () => {
    const saved = toggleWishlist({
      id: itemId,
      type,
      name: itemName,
      price: item.price || item.startingPrice || null,
      priceRange: item.priceRange || null,
      unit: item.unit,
      availability: item.availability,
      category: item.category || company.category,
      imageUrl: item.imageUrl || (Array.isArray(item.images) && item.images[0]) || company.logoUrl || null,
      description: item.description || item.desc || '',
      companyName: company.name,
      companySlug: company.slug || companySlug,
      district: company.district || 'Theni',
      phone: company.phone,
      whatsapp: company.whatsapp || company.phone,
      isVerified,
    });
    setIsWishlisted(saved);
  };

  const handleToggleCompare = () => {
    const result = toggleCompareItem({
      id: itemId,
      type: 'product',
      name: itemName,
      price: item.price || null,
      priceRange: item.priceRange || null,
      unit: item.unit,
      availability: item.availability,
      category: item.category || company.category,
      imageUrl: item.imageUrl || (Array.isArray(item.images) && item.images[0]) || company.logoUrl || null,
      description: item.description || '',
      companyName: company.name,
      companySlug: company.slug || companySlug,
      district: company.district || 'Theni',
      phone: company.phone,
      whatsapp: company.whatsapp || company.phone,
      isVerified,
    });
    setIsCompared(result.added);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: `${itemName} — ${company.name}`,
      text: `Check out ${itemName} on THENIJOBS Marketplace:`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or unsupported
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#111827] pb-24" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* Breadcrumbs & Controls */}
        <div className="flex items-center justify-between gap-2 mb-5 flex-wrap">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap" aria-label="Breadcrumbs">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <ChevronRight size={11} className="text-slate-400" />
            <Link href={`/marketplace?type=${type === 'service' ? 'services' : 'products'}`} className="hover:text-blue-600 transition-colors">
              Marketplace
            </Link>
            <ChevronRight size={11} className="text-slate-400" />
            <Link href={`/company/${company.slug || companySlug}`} className="hover:text-blue-600 transition-colors font-medium">
              {company.name}
            </Link>
            <ChevronRight size={11} className="text-slate-400" />
            <span className="text-slate-900 font-bold truncate max-w-[200px]">{itemName}</span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}
              className="text-[11px] font-bold px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 shadow-2xs"
            >
              <Globe size={11} className="text-blue-600" />
              {lang === 'en' ? 'தமிழ்' : 'English'}
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-2xs transition-colors ${
                isWishlisted
                  ? 'bg-rose-50 border-rose-300 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart size={14} className={isWishlisted ? 'fill-rose-500 text-rose-500' : ''} />
              <span className="hidden sm:inline">{isWishlisted ? (lang === 'ta' ? 'விருப்பப்பட்டியல்' : 'Saved') : (lang === 'ta' ? 'சேமி' : 'Save')}</span>
            </button>

            {/* Product Compare Button */}
            {type === 'product' && (
              <button
                type="button"
                onClick={handleToggleCompare}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-2xs transition-colors ${
                  isCompared
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title={isCompared ? 'Remove from Compare' : 'Add to Compare'}
              >
                <Scale size={14} />
                <span className="hidden sm:inline">{isCompared ? (lang === 'ta' ? 'ஒப்பிடுகிறீர்கள்' : 'Comparing') : (lang === 'ta' ? 'ஒப்பிடு' : 'Compare')}</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Share listing"
            >
              {shareSuccess ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
              <span>{shareSuccess ? (lang === 'ta' ? 'இணைப்பு நகலெடுக்கப்பட்டது' : 'Copied!') : (lang === 'ta' ? 'பகிர்' : 'Share')}</span>
            </button>

            <button
              onClick={() => setShowPosterModal(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Generate Promotional Posters"
            >
              <Sparkles size={13} className="text-indigo-600" />
              <span>{lang === 'ta' ? 'விளம்பர போஸ்டர் (10)' : 'Posters (10)'}</span>
            </button>
          </div>
        </div>

        {/* Main Item Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Main Hero Gallery View */}
          <div className="h-64 sm:h-96 bg-slate-100 relative flex items-center justify-center overflow-hidden">
            {activeImage ? (
              <img src={activeImage} alt={itemName} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${type === 'service' ? 'bg-teal-50/50 text-teal-500' : 'bg-blue-50/50 text-blue-400'}`}>
                {type === 'service' ? <Wrench size={54} /> : <Package size={54} />}
              </div>
            )}

            {item.featured === true && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-black bg-amber-400 text-amber-950 shadow-xs flex items-center gap-1">
                <Sparkles size={12} /> {lang === 'ta' ? 'சிறப்பு' : 'Featured'}
              </span>
            )}

            {/* Badges */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {item.availability && (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md shadow-xs ${
                  item.availability === 'out_of_stock'
                    ? 'bg-red-500/90 text-white'
                    : item.availability === 'made_to_order'
                    ? 'bg-amber-500/90 text-white'
                    : 'bg-emerald-600/90 text-white'
                }`}>
                  {item.availability === 'out_of_stock'
                    ? (lang === 'ta' ? 'இருப்பு இல்லை' : 'Out of Stock')
                    : item.availability === 'made_to_order'
                    ? (lang === 'ta' ? 'ஆர்டர் மூலம்' : 'Made to Order')
                    : (lang === 'ta' ? 'இருப்பில் உள்ளது' : 'In Stock')}
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white/90 backdrop-blur-md text-slate-900 shadow-xs">
                {item.category || (type === 'service' ? 'Service' : 'Product')}
              </span>
            </div>
          </div>

          {/* Multiple Image Thumbnails if applicable */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100 overflow-x-auto">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx ? 'border-blue-600 shadow-xs scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${itemName} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Item Content & Action Row */}
          <div className="p-5 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{itemName}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/company/${company.slug || companySlug}`}
                    className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{company.name}</span>
                    {isVerified && <BadgeCheck size={14} className="text-blue-600 shrink-0" />}
                  </Link>
                  {company.district && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin size={11} /> {company.district} {company.taluk ? `(${company.taluk})` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Price & Unit Box */}
              <div className="text-left sm:text-right shrink-0 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl">
                <div className={`text-2xl sm:text-3xl font-black ${type === 'service' ? 'text-blue-700' : 'text-emerald-700'}`}>
                  {priceLabel}
                </div>
                {item.quantity && (
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    {lang === 'ta' ? 'கிடைக்கக்கூடிய அளவு' : 'Available qty'}: {item.quantity} {item.unit || ''}
                  </p>
                )}
                {item.serviceArea && (
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5 flex items-center sm:justify-end gap-1">
                    <MapPin size={11} /> {lang === 'ta' ? 'சேவை பகுதி' : 'Area'}: {item.serviceArea}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            {description && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {lang === 'ta' ? 'விளக்கம்' : 'Description'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{description}</p>
              </div>
            )}

            {/* Specifications / Highlights if available */}
            {Array.isArray(item.features) && item.features.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {lang === 'ta' ? 'சிறப்பம்சங்கள்' : 'Key Highlights'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.features.map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seller Contact & Inquiries */}
            <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    {lang === 'ta' ? 'விற்பனையாளர் தகவல்' : 'Verified Merchant'}
                  </h4>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{company.name}</p>
                </div>
                {isVerified && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 flex items-center gap-1">
                    <ShieldCheck size={12} /> {lang === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Verified'}
                  </span>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                {/* 1. WhatsApp Button with Direct Product Link */}
                {whatsapp ? (
                  <a
                    href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleWhatsAppOrder}
                    className="py-3 px-4 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-[0.98]"
                    style={{ background: '#25D366' }}
                  >
                    <MessageCircle size={16} /> {lang === 'ta' ? 'வாட்ஸ்அப் ஆர்டர்' : 'WhatsApp Inquiry'}
                  </a>
                ) : null}

                {/* 2. Direct Call Button */}
                {directPhone ? (
                  <a
                    href={`tel:${directPhone}`}
                    className="py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors"
                  >
                    <Phone size={15} className="text-blue-600" /> {lang === 'ta' ? 'தொலைபேசி அழைப்பு' : 'Direct Call'}
                  </a>
                ) : null}

                {/* 3. Send Web Inquiry Button */}
                <button
                  type="button"
                  onClick={() => setInquiryModalOpen(true)}
                  className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Send size={15} /> {lang === 'ta' ? 'விசாரணை அனுப்பு' : 'Send Inquiry'}
                </button>
              </div>

              {/* Company Website Link */}
              <div className="pt-2 text-center sm:text-left">
                <Link
                  href={`/${company.slug || companySlug}`}
                  className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1.5"
                >
                  <ExternalLink size={13} /> {lang === 'ta' ? 'நிறுவனத்தின் அதிகாரப்பூர்வ தளத்திற்கு செல்லவும்' : `Visit ${company.name}'s Official Website`}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* More from this Company Section */}
        {otherItems.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {lang === 'ta' ? `${company.name} இலிருந்து கூடுதல் விவரங்கள்` : `More from ${company.name}`}
              </h2>
              <Link
                href={`/company/${company.slug || companySlug}`}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                {lang === 'ta' ? 'முழு விவரம் →' : 'View Profile →'}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherItems.map((other: any) => {
                const otherPrice = other.price ? `₹${Number(other.price).toLocaleString('en-IN')}` : (other.startingPrice ? `Starts ₹${Number(other.startingPrice).toLocaleString('en-IN')}` : other.priceRange || '');
                return (
                  <Link
                    key={other.id || other.name}
                    href={`/marketplace/${type}/${company.slug || companySlug}/${other.id}`}
                    className="flex items-center gap-3.5 p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all group"
                  >
                    <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {other.imageUrl ? (
                        <img
                          src={other.imageUrl}
                          alt={other.name || 'Item'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        type === 'service' ? <Wrench size={24} className="text-slate-400" /> : <Package size={24} className="text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {other.name}
                      </h3>
                      {otherPrice && (
                        <p className={`text-xs font-bold mt-0.5 ${type === 'service' ? 'text-blue-600' : 'text-emerald-600'}`}>
                          {otherPrice} {other.unit ? `/ ${other.unit}` : ''}
                        </p>
                      )}
                      {other.category && (
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{other.category}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
            <ShoppingBag size={14} /> {lang === 'ta' ? 'தேனி சந்தைக்கு திரும்பு' : 'Browse more on THENIJOBS Marketplace'}
          </Link>
        </div>
      </div>

      {/* Direct Inquiry Modal */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setInquiryModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            {inquirySuccess ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto animate-bounce" />
                <h3 className="text-lg font-black text-slate-900">
                  {lang === 'ta' ? 'விசாரணை வெற்றிகரமாக அனுப்பப்பட்டது!' : 'Inquiry Sent Successfully!'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {lang === 'ta'
                    ? `${company.name} விரைவில் உங்களை தொடர்புகொள்வர்.`
                    : `${company.name} has received your inquiry and will contact you directly.`}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendLeadInquiry} className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {lang === 'ta' ? 'விற்பனையாளருக்கு செய்தி அனுப்பவும்' : `Inquire about ${itemName}`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === 'ta' ? `விற்பனையாளர்: ${company.name}` : `Offered by ${company.name}`}
                  </p>
                </div>

                {inquiryError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-100">
                    {inquiryError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ta' ? 'உங்கள் பெயர் *' : 'Your Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Anand"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ta' ? 'தொலைபேசி எண் *' : 'Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ta' ? 'மின்னஞ்சல் (விருப்பத்தேர்வு)' : 'Email (Optional)'}
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. anand@gmail.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ta' ? 'செய்தி அல்லது தேவைகள்' : 'Inquiry Message'}
                  </label>
                  <textarea
                    rows={3}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder={lang === 'ta' ? 'உங்கள் தேவைகள், அளவு, விநியோக கேள்விகள்...' : 'Ask about quantity, delivery location, or timeline...'}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInquiryModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
                  >
                    {lang === 'ta' ? 'ரத்து' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInquiry}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submittingInquiry ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>{lang === 'ta' ? 'அனுப்பு' : 'Submit'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Promotional Poster Studio Modal */}
      {showPosterModal && itemPosterData && (
        <PosterStudioModal
          isOpen={showPosterModal}
          onClose={() => setShowPosterModal(false)}
          data={itemPosterData}
        />
      )}

      <BottomNav />
    </main>
  );
}
