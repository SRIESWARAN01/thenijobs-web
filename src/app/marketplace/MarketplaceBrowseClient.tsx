'use client';

import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { createLead } from '@/lib/firebase/firestoreService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import {
  Search, MapPin, Package, Wrench, Building2, Phone, MessageCircle,
  ExternalLink, BadgeCheck, Star, Filter, ArrowRight, Sparkles,
  ShoppingBag, Check, Layers, ChevronRight, X, Briefcase, Navigation,
  Clock, ShieldCheck, Share2, Send, SlidersHorizontal, ArrowUpDown,
  Tag, AlertCircle, CheckCircle, Globe, RefreshCw, Loader2, Heart,
  Scale, Trash2, Eye, History
} from 'lucide-react';
import {
  getWishlist,
  toggleWishlist,
  isInWishlist,
  removeFromWishlist,
  getRecentlyViewed,
  clearRecentlyViewed,
  getCompareItems,
  isInCompare,
  toggleCompareItem,
  removeFromCompare,
  clearCompare,
  MarketplaceSavedItem
} from '@/lib/marketplaceStore';

const LOCATIONS = [
  'All Locations', 'Theni', 'Cumbum', 'Periyakulam', 'Bodinayakanur',
  'Chinnamanur', 'Uthamapalayam', 'Andipatti', 'Thevaram', 'Devadanapatti',
  'Veerapandi', 'Kombai', 'Kuchanur', 'Gudalur', 'Highwavys', 'Madurai', 'Dindigul'
];

const CATEGORIES = [
  'All Categories', 'Agriculture & Farming', 'Retail & Supermarket',
  'Automobile & Services', 'Manufacturing & Industry', 'IT & Software',
  'Healthcare & Hospital', 'Education & Training', 'Hotel & Restaurant',
  'Professional & Corporate', 'Local Shops & Business'
];

const SUBCATEGORIES_MAP: Record<string, string[]> = {
  'Agriculture & Farming': ['All Subcategories', 'Spices & Cardamom', 'Grapes & Fruits', 'Seeds & Fertilizers', 'Farm Machinery', 'Dairy & Livestock', 'Irrigation'],
  'Retail & Supermarket': ['All Subcategories', 'Groceries & Provisions', 'Textiles & Garments', 'Electrical & Sanitary', 'Hardware & Tools', 'Home Appliances'],
  'Automobile & Services': ['All Subcategories', 'Two Wheeler Service', 'Car Care & Mechanic', 'Auto Spare Parts', 'Commercial Vehicles', 'Tractor Repair'],
  'Manufacturing & Industry': ['All Subcategories', 'Textile Mills', 'Food Processing', 'Rice Mills', 'Packaging', 'Metal Fabrication'],
  'IT & Software': ['All Subcategories', 'Website Development', 'Software Solutions', 'Digital Marketing', 'Computer Sales', 'CCTV & Security'],
  'Healthcare & Hospital': ['All Subcategories', 'Clinics & Hospitals', 'Pharmacies & Medicals', 'Diagnostic Labs', 'Dental Care', 'Ayurveda & Siddha'],
  'Education & Training': ['All Subcategories', 'Schools & Colleges', 'Tuition & Coaching', 'Skill Development', 'Computer Institutes'],
  'Hotel & Restaurant': ['All Subcategories', 'Restaurants & Mess', 'Banquets & Catering', 'Lodging & Resorts', 'Bakeries & Sweets'],
  'Professional & Corporate': ['All Subcategories', 'Auditing & Tax', 'Legal & Advocate', 'Architects & Engineers', 'Real Estate & Land'],
  'Local Shops & Business': ['All Subcategories', 'Printers & Xerox', 'Event Management', 'Beauty Salons', 'Courier & Logistics']
};

const SERVICE_CATEGORIES = [
  'All Categories',
  'Home & Appliance Repairs',
  'Automobile & Vehicle Services',
  'IT, Digital & Software',
  'Agriculture & Farm Machinery',
  'Building & Construction Services',
  'Professional & Corporate',
  'Events, Photography & Catering',
  'Healthcare & Wellness',
  'Transport & Logistics'
];

const SERVICE_SUBCATEGORIES_MAP: Record<string, string[]> = {
  'Home & Appliance Repairs': ['All Subcategories', 'Electrical Works', 'Plumbing & Water Tanks', 'AC Repair & Service', 'Painting & Whitewashing', 'Carpentry & Woodwork'],
  'Automobile & Vehicle Services': ['All Subcategories', 'Two Wheeler Service', 'Car Care & Wash', 'Tractor & Harvester Repair', 'Auto Electricals', 'Tyre & Alignment'],
  'IT, Digital & Software': ['All Subcategories', 'Website Development', 'Software Solutions', 'Digital Marketing', 'CCTV Installation', 'Computer & Laptop Repair'],
  'Agriculture & Farm Machinery': ['All Subcategories', 'Tractor Rental / Hiring', 'Drip Irrigation Installation', 'Borewell Drilling & Flushing', 'Solar Pump Maintenance', 'Farm Labor Services'],
  'Building & Construction Services': ['All Subcategories', 'Civil Engineering & Plan', 'Masonry & Plastering', 'Tiles & Granite Laying', 'Welding & Fabrication', 'Interior Designing'],
  'Professional & Corporate': ['All Subcategories', 'Auditing & GST Filing', 'Legal & Documentation', 'Surveyor & Land Registration', 'Printing & Design'],
  'Events, Photography & Catering': ['All Subcategories', 'Wedding & Event Photography', 'Catering & Food Orders', 'Stage Decoration & Sound', 'Shamiana & Tent Hire'],
  'Healthcare & Wellness': ['All Subcategories', 'Home Nursing', 'Physiotherapy', 'Diagnostic Services', 'Dental Clinic'],
  'Transport & Logistics': ['All Subcategories', 'Mini Truck / Goods Transport', 'Tempo & Lorry Booking', 'Packers & Movers', 'Taxi & Cab Services']
};

const SERVICE_SUGGESTIONS = [
  'AC Repair', 'Electrician', 'Plumber', 'CCTV Installation',
  'Tractor Repair', 'Website Development', 'Solar Service', 'Car Wash', 'Event Catering'
];


const PRICE_RANGES = [
  { id: 'all', labelEn: 'All Prices', labelTa: 'அனைத்து விலைகள்' },
  { id: 'under-500', labelEn: 'Under ₹500', labelTa: '₹500க்கு கீழ்', min: 0, max: 500 },
  { id: '500-2000', labelEn: '₹500 – ₹2,000', labelTa: '₹500 – ₹2,000', min: 500, max: 2000 },
  { id: '2000-10000', labelEn: '₹2,000 – ₹10,000', labelTa: '₹2,000 – ₹10,000', min: 2000, max: 10000 },
  { id: 'above-10000', labelEn: 'Above ₹10,000', labelTa: '₹10,000க்கு மேல்', min: 10000, max: Infinity },
];

const SORT_OPTIONS = [
  { id: 'featured', labelEn: 'Featured First', labelTa: 'சிறப்பு முன்னுரிமை' },
  { id: 'price-low', labelEn: 'Price: Low to High', labelTa: 'விலை: குறைவு - அதிகம்' },
  { id: 'price-high', labelEn: 'Price: High to Low', labelTa: 'விலை: அதிகம் - குறைவு' },
  { id: 'name', labelEn: 'Name: A to Z', labelTa: 'பெயர்: அ - ஃ' },
  { id: 'newest', labelEn: 'Newest Listings', labelTa: 'சமீபத்தியவை' },
];

const POPULAR_SUGGESTIONS = [
  'Cardamom', 'AC Repair', 'Spices', 'Organic Vegetables',
  'CCTV Installation', 'Website Development', 'Tiles & Sanitary',
  'Plumbing', 'Electrical Works', 'Rice Mill', 'Tractor Repair'
];

type TabType = 'all' | 'products' | 'services' | 'businesses' | 'wishlist';

function MarketplaceContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();

  const [language, setLanguage] = useState<'en' | 'ta'>('en');

  // Derive initial tab directly from URL search params so initial SSR / hydration matches immediately
  const initialType = searchParams ? (searchParams.get('type') || searchParams.get('tab')) : null;
  const [activeTab, setActiveTab] = useState<TabType>(
    initialType === 'services' ? 'services' :
    initialType === 'products' ? 'products' :
    initialType === 'businesses' || initialType === 'companies' ? 'businesses' :
    initialType === 'wishlist' ? 'wishlist' : 'all'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All Subcategories');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedSort, setSelectedSort] = useState('featured');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Store states
  const [wishlistItems, setWishlistItems] = useState<MarketplaceSavedItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<MarketplaceSavedItem[]>([]);
  const [compareItems, setCompareItems] = useState<MarketplaceSavedItem[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Autocomplete suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Pagination / Load More
  const [visibleCount, setVisibleCount] = useState(24);

  // Inquiry Modal State
  const [inquiryModalItem, setInquiryModalItem] = useState<any | null>(null);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmitting, setInquirySubmitting] = useState(false);

  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Refresh store on mount and when changed
  const refreshLocalStores = () => {
    setWishlistItems(getWishlist());
    setRecentlyViewed(getRecentlyViewed());
    setCompareItems(getCompareItems());
  };

  useEffect(() => {
    refreshLocalStores();
    const handleStoreChange = () => refreshLocalStores();
    window.addEventListener('thenijobs_marketplace_store_change', handleStoreChange);
    return () => window.removeEventListener('thenijobs_marketplace_store_change', handleStoreChange);
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for browser Back and Forward button navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const typeParam = url.searchParams.get('type') || url.searchParams.get('tab');
        if (typeParam === 'services') setActiveTab('services');
        else if (typeParam === 'products') setActiveTab('products');
        else if (typeParam === 'businesses' || typeParam === 'companies') setActiveTab('businesses');
        else if (typeParam === 'wishlist') setActiveTab('wishlist');
        else setActiveTab('all');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync URL query parameters when searchParams change
  useEffect(() => {
    const typeParam = searchParams.get('type') || searchParams.get('tab');
    if (typeParam === 'services') {
      setActiveTab('services');
    } else if (typeParam === 'products') {
      setActiveTab('products');
    } else if (typeParam === 'businesses' || typeParam === 'companies') {
      setActiveTab('businesses');
    } else if (typeParam === 'wishlist') {
      setActiveTab('wishlist');
    } else {
      setActiveTab('all');
    }

    const catParam = searchParams.get('category');
    if (catParam) {
      const allPossibleCats = [...CATEGORIES, ...SERVICE_CATEGORIES];
      const matched = allPossibleCats.find(c => c.toLowerCase() === catParam.toLowerCase() || c.toLowerCase().includes(catParam.toLowerCase()));
      setSelectedCategory(matched || catParam);
    }

    const locParam = searchParams.get('location') || searchParams.get('district') || searchParams.get('taluk');
    if (locParam) {
      const matched = LOCATIONS.find(l => l.toLowerCase() === locParam.toLowerCase());
      if (matched) setSelectedLocation(matched);
    }

    const qParam = searchParams.get('q') || searchParams.get('search');
    if (qParam) setSearchQuery(qParam);

    const priceParam = searchParams.get('price');
    if (priceParam && PRICE_RANGES.some(p => p.id === priceParam)) {
      setSelectedPriceRange(priceParam);
    }

    const sortParam = searchParams.get('sort');
    if (sortParam && SORT_OPTIONS.some(s => s.id === sortParam)) {
      setSelectedSort(sortParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // If switching between services and other tabs, reset category so incompatible filters don't hide items
    if ((tab === 'services' && activeTab !== 'services') || (tab !== 'services' && activeTab === 'services')) {
      setSelectedCategory('All Categories');
      setSelectedSubcategory('All Subcategories');
    }

    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (tab === 'all') {
      params.delete('type');
      params.delete('tab');
    } else {
      params.set('type', tab);
    }
    const query = params.toString();
    const targetUrl = query ? `${pathname}?${query}` : pathname;
    router.push(targetUrl);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('All Locations');
    setSelectedCategory('All Categories');
    setSelectedSubcategory('All Subcategories');
    setSelectedPriceRange('all');
    setSelectedSort('featured');
    setVerifiedOnly(false);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.delete('q');
    params.delete('search');
    params.delete('category');
    params.delete('location');
    params.delete('district');
    params.delete('taluk');
    params.delete('price');
    params.delete('sort');
    const query = params.toString();
    const targetUrl = query ? `${pathname}?${query}` : pathname;
    router.push(targetUrl);
    toast.info('All filters cleared.');
  };

  const openInquiryModal = (item: any) => {
    setInquiryModalItem(item);
    setInquiryName(user?.displayName || '');
    setInquiryPhone(user?.phone || '');
    setInquiryEmail(user?.email || '');
    const listingUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/marketplace/${item.type}/${item.company.slug}/${item.id}`
      : `https://www.thenijobs.com/marketplace/${item.type}/${item.company.slug}/${item.id}`;

    setInquiryMessage(
      `Hello ${item.company.name}, I found your ${item.type} "${item.name}" on THENIJOBS Marketplace: ${listingUrl}\nPlease share pricing and availability details.`
    );
  };

  const submitDirectInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim()) {
      toast.warning('Please enter your full name.');
      return;
    }
    if (!inquiryPhone.trim()) {
      toast.warning('Please enter your phone number.');
      return;
    }
    if (!inquiryMessage.trim()) {
      toast.warning('Please write a brief inquiry message.');
      return;
    }

    setInquirySubmitting(true);
    try {
      await createLead({
        companyId: inquiryModalItem.company.id,
        name: inquiryName.trim(),
        customerName: inquiryName.trim(),
        customerPhone: inquiryPhone.trim(),
        customerEmail: inquiryEmail.trim() || undefined,
        message: inquiryMessage.trim(),
        service: `${inquiryModalItem.type === 'service' ? 'Service' : 'Product'}: ${inquiryModalItem.name}`,
        source: 'marketplace_direct_inquiry_modal',
        itemId: inquiryModalItem.id,
        itemType: inquiryModalItem.type,
        buyerUid: user?.uid || undefined,
      });

      toast.success(
        language === 'en'
          ? 'Inquiry Sent! The business owner will contact you shortly.'
          : 'உங்கள் விசாரணை அனுப்பப்பட்டது! வணிக உரிமையாளர் உங்களை தொடர்பு கொள்வார்.'
      );
      setInquiryModalItem(null);
    } catch (err: any) {
      console.error('Failed to submit direct inquiry:', err);
      toast.error('Submission Failed', err?.message || 'Could not send inquiry. Please try WhatsApp.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  const handleToggleWishlistFromCard = (item: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isNowIn = toggleWishlist({
      id: item.id,
      type: item.type,
      name: item.name,
      price: item.price,
      priceRange: item.priceRange,
      unit: item.unit,
      availability: item.availability,
      category: item.category,
      imageUrl: item.imageUrl,
      description: item.description,
      companyName: item.company.name,
      companySlug: item.company.slug,
      district: item.company.district,
      phone: item.company.phone,
      whatsapp: item.company.whatsapp,
      isVerified: item.company.isVerified,
    });
    setWishlistItems(getWishlist());
    toast.success(isNowIn ? 'Added to Wishlist' : 'Removed from Wishlist');
  };

  const handleToggleCompareFromCard = (item: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = toggleCompareItem({
      id: item.id,
      type: 'product',
      name: item.name,
      price: item.price,
      priceRange: item.priceRange,
      unit: item.unit,
      availability: item.availability,
      category: item.category,
      imageUrl: item.imageUrl,
      description: item.description,
      companyName: item.company.name,
      companySlug: item.company.slug,
      district: item.company.district,
      phone: item.company.phone,
      whatsapp: item.company.whatsapp,
      isVerified: item.company.isVerified,
    });
    if (res.limitReached) {
      toast.warning('Comparison limit reached (Max 3 items)');
      return;
    }
    setCompareItems(getCompareItems());
    toast.info(res.added ? 'Added to comparison list' : 'Removed from comparison');
  };

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setLoading(false);
    }, 10000);

    async function loadMarketplaceData() {
      try {
        setLoading(true);
        const qComp = query(
          collection(db, 'companies'),
          where('isActive', '==', true),
          limit(100)
        );
        const snap = await getDocs(qComp);
        if (cancelled) return;
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCompanies(data);
      } catch (err) {
        console.error('Error fetching marketplace companies:', err);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    }
    loadMarketplaceData();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  // Aggregate all products with company metadata
  const allProducts = useMemo(() => {
    const list: any[] = [];
    companies.forEach(company => {
      if (company.products && Array.isArray(company.products)) {
        company.products.forEach((prod: any, idx: number) => {
          list.push({
            id: typeof prod === 'object' && prod.id ? prod.id : `${company.id}-prod-${idx}`,
            key: `${company.id}-prod-${idx}`,
            name: typeof prod === 'string' ? prod : prod.name || prod.title,
            description: typeof prod === 'object' ? prod.description : '',
            price: typeof prod === 'object' ? prod.price : null,
            priceRange: typeof prod === 'object' ? prod.priceRange : null,
            unit: typeof prod === 'object' ? prod.unit : undefined,
            availability: typeof prod === 'object' ? prod.availability : 'in_stock',
            category: typeof prod === 'object' ? prod.category || company.category : company.category,
            imageUrl: typeof prod === 'object' ? prod.imageUrl : null,
            featured: typeof prod === 'object' && prod.featured === true,
            type: 'product' as const,
            company: {
              id: company.id,
              name: company.name,
              slug: company.slug,
              district: company.district || 'Theni',
              taluk: company.taluk,
              phone: company.phone,
              whatsapp: company.whatsapp || company.phone,
              isVerified: company.verificationStatus === 'verified' || company.isVerified === true,
              logoUrl: company.logoUrl,
            }
          });
        });
      }
    });
    return list;
  }, [companies]);

  // Aggregate all services with company metadata
  const allServices = useMemo(() => {
    const list: any[] = [];
    companies.forEach(company => {
      if (company.services && Array.isArray(company.services)) {
        company.services.forEach((srv: any, idx: number) => {
          list.push({
            id: typeof srv === 'object' && srv.id ? srv.id : `${company.id}-srv-${idx}`,
            key: `${company.id}-srv-${idx}`,
            name: typeof srv === 'string' ? srv : srv.title || srv.name,
            description: typeof srv === 'object' ? srv.description || srv.desc : '',
            price: typeof srv === 'object' ? srv.startingPrice || srv.price : null,
            category: typeof srv === 'object' ? srv.category || company.category : company.category,
            imageUrl: typeof srv === 'object' ? (srv.bannerImageUrl || srv.imageUrl) : null,
            featured: typeof srv === 'object' && srv.featured === true,
            availability: typeof srv === 'object' ? srv.availability : 'available',
            pricingType: typeof srv === 'object' ? srv.pricingType : undefined,
            serviceArea: typeof srv === 'object' ? srv.serviceArea : undefined,
            type: 'service' as const,
            company: {
              id: company.id,
              name: company.name,
              slug: company.slug,
              district: company.district || 'Theni',
              taluk: company.taluk,
              phone: company.phone,
              whatsapp: company.whatsapp || company.phone,
              isVerified: company.verificationStatus === 'verified' || company.isVerified === true,
              logoUrl: company.logoUrl,
            }
          });
        });
      }
    });
    return list;
  }, [companies]);

  // Sorting function
  const applySort = (a: any, b: any) => {
    if (selectedSort === 'featured') {
      if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    }
    if (selectedSort === 'price-low') {
      const pA = a.price ?? Number.MAX_SAFE_INTEGER;
      const pB = b.price ?? Number.MAX_SAFE_INTEGER;
      return pA - pB;
    }
    if (selectedSort === 'price-high') {
      const pA = a.price ?? 0;
      const pB = b.price ?? 0;
      return pB - pA;
    }
    if (selectedSort === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (selectedSort === 'newest') {
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    }
    return 0;
  };

  // Price Range Checker
  const checkPriceRange = (price: number | null | undefined) => {
    if (selectedPriceRange === 'all') return true;
    const matchCfg = PRICE_RANGES.find(p => p.id === selectedPriceRange);
    if (!matchCfg) return true;
    if (price == null || isNaN(Number(price))) return false;
    return price >= (matchCfg.min ?? 0) && price <= (matchCfg.max ?? Infinity);
  };

  // Filtered lists
  const filteredProducts = useMemo(() => {
    return allProducts.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchSearch = searchQuery === '' ||
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.company.name?.toLowerCase().includes(q);

      const matchLoc = selectedLocation === 'All Locations' ||
        item.company.district?.toLowerCase() === selectedLocation.toLowerCase() ||
        item.company.taluk?.toLowerCase() === selectedLocation.toLowerCase();

      const matchCat = selectedCategory === 'All Categories' || item.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchSub = selectedSubcategory === 'All Subcategories' || item.name?.toLowerCase().includes(selectedSubcategory.toLowerCase()) || item.category?.toLowerCase().includes(selectedSubcategory.toLowerCase());
      const matchVer = !verifiedOnly || item.company.isVerified;
      const matchPrice = checkPriceRange(item.price);

      return matchSearch && matchLoc && matchCat && matchSub && matchVer && matchPrice;
    }).sort(applySort);
  }, [allProducts, searchQuery, selectedLocation, selectedCategory, selectedSubcategory, verifiedOnly, selectedPriceRange, selectedSort]);

  const filteredServices = useMemo(() => {
    return allServices.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchSearch = searchQuery === '' ||
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.company.name?.toLowerCase().includes(q);

      const matchLoc = selectedLocation === 'All Locations' ||
        item.company.district?.toLowerCase() === selectedLocation.toLowerCase() ||
        item.company.taluk?.toLowerCase() === selectedLocation.toLowerCase() ||
        (item.serviceArea && item.serviceArea.toLowerCase().includes(selectedLocation.toLowerCase()));

      const matchCat = selectedCategory === 'All Categories' ||
        item.category?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        selectedCategory.toLowerCase().includes(item.category?.toLowerCase() || '');

      const matchSub = selectedSubcategory === 'All Subcategories' ||
        item.name?.toLowerCase().includes(selectedSubcategory.toLowerCase()) ||
        item.description?.toLowerCase().includes(selectedSubcategory.toLowerCase()) ||
        item.category?.toLowerCase().includes(selectedSubcategory.toLowerCase()) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(selectedSubcategory.toLowerCase()));

      const matchVer = !verifiedOnly || item.company.isVerified;
      const matchPrice = checkPriceRange(item.price);

      return matchSearch && matchLoc && matchCat && matchSub && matchVer && matchPrice;
    }).sort(applySort);
  }, [allServices, searchQuery, selectedLocation, selectedCategory, selectedSubcategory, verifiedOnly, selectedPriceRange, selectedSort]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const q = searchQuery.toLowerCase();
      const matchSearch = searchQuery === '' ||
        company.name?.toLowerCase().includes(q) ||
        company.category?.toLowerCase().includes(q) ||
        company.description?.toLowerCase().includes(q);

      const matchLoc = selectedLocation === 'All Locations' ||
        company.district?.toLowerCase() === selectedLocation.toLowerCase() ||
        company.taluk?.toLowerCase() === selectedLocation.toLowerCase();

      const matchCat = selectedCategory === 'All Categories' || company.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchVer = !verifiedOnly || (company.verificationStatus === 'verified' || company.isVerified === true);

      return matchSearch && matchLoc && matchCat && matchVer;
    });
  }, [companies, searchQuery, selectedLocation, selectedCategory, verifiedOnly]);

  const hasActiveFilters = searchQuery !== '' || selectedLocation !== 'All Locations' || selectedCategory !== 'All Categories' || selectedSubcategory !== 'All Subcategories' || selectedPriceRange !== 'all' || verifiedOnly;

  const currentCategories = activeTab === 'services' ? SERVICE_CATEGORIES : CATEGORIES;
  const currentSubcategoriesMap = activeTab === 'services' ? SERVICE_SUBCATEGORIES_MAP : SUBCATEGORIES_MAP;
  const currentSubcategories = selectedCategory !== 'All Categories' ? (currentSubcategoriesMap[selectedCategory] || []) : [];
  const currentSuggestions = activeTab === 'services' ? SERVICE_SUGGESTIONS : POPULAR_SUGGESTIONS;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />

      {/* ── Marketplace Hero Banner ── */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-white shadow-xs">
              {activeTab === 'services' ? (
                <>
                  <Wrench size={14} className="text-teal-300" />
                  <span>
                    {language === 'en'
                      ? 'Verified Professional Services Directory • Theni & Tamil Nadu'
                      : 'சரிபார்க்கப்பட்ட தொழில்முறை சேவைகள் • தேனி & தமிழ்நாடு'}
                  </span>
                </>
              ) : activeTab === 'products' ? (
                <>
                  <Package size={14} className="text-amber-300" />
                  <span>
                    {language === 'en'
                      ? 'Local Products & B2B Wholesale Market • Theni District'
                      : 'உள்ளூர் பொருட்கள் & மொத்த விற்பனை சந்தை • தேனி மாவட்டம்'}
                  </span>
                </>
              ) : activeTab === 'businesses' ? (
                <>
                  <Building2 size={14} className="text-indigo-300" />
                  <span>
                    {language === 'en'
                      ? 'Verified Companies & Stores Directory • Theni District'
                      : 'சரிபார்க்கப்பட்ட வணிக நிறுவனங்கள் அடைவு • தேனி மாவட்டம்'}
                  </span>
                </>
              ) : (
                <>
                  <ShoppingBag size={14} className="text-amber-300" />
                  <span>
                    {language === 'en'
                      ? 'Local Business Marketplace & Services • Theni & Tamil Nadu'
                      : 'உள்ளூர் வணிக சந்தை & சேவைகள் • தேனி & தமிழ்நாடு'}
                  </span>
                </>
              )}
            </div>

            {/* Language Switcher & Wishlist quick counter */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTabChange('wishlist')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  activeTab === 'wishlist'
                    ? 'bg-rose-500 border-rose-400 text-white shadow-xs'
                    : 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20'
                }`}
              >
                <Heart size={14} className={wishlistItems.length > 0 ? 'fill-rose-400 text-rose-400' : ''} />
                <span>{language === 'en' ? 'Wishlist' : 'விருப்பங்கள்'}</span>
                {wishlistItems.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-black">
                    {wishlistItems.length}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition-colors ${
                    language === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ta')}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition-colors ${
                    language === 'ta' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  தமிழ்
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {activeTab === 'services'
                ? (language === 'en' ? 'Hire Verified Local Services in Theni' : 'தேனியில் தொழில்முறை சேவைகளை உடனடியாக பெறுங்கள்')
                : activeTab === 'products'
                ? (language === 'en' ? 'Shop Authentic Local Products in Theni' : 'தேனியின் பிரத்யேக தயாரிப்புகளை வாங்குங்கள்')
                : activeTab === 'businesses'
                ? (language === 'en' ? 'Explore Local Companies & Stores in Theni' : 'தேனி மாவட்டத்தின் உள்ளூர் நிறுவனங்களை கண்டறியுங்கள்')
                : (language === 'en' ? 'Discover Products, Services & Verified Businesses' : 'பொருட்கள், சேவைகள் மற்றும் சரிபார்க்கப்பட்ட வணிகங்கள்')}
            </h1>

            <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed font-normal">
              {activeTab === 'services'
                ? (language === 'en'
                    ? 'Book certified electricians, plumbers, AC technicians, agricultural machinery, and corporate service providers across Theni district without middleman commission.'
                    : 'தேனி மாவட்டம் முழுவதும் சான்றளிக்கப்பட்ட தொழில்நுட்ப வல்லுநர்கள், எலக்ட்ரீஷியன்கள், பிளம்பர்கள், விவசாய இயந்திர சேவைகளுடன் இடைத்தரகர் இன்றி நேரடியாக இணையுங்கள்.')
                : (language === 'en'
                    ? 'Order products directly from local suppliers, book professional technicians, and connect with trusted companies across Theni district without middleman commission.'
                    : 'தேனி மாவட்டத்தின் உள்ளூர் உற்பத்தியாளர்களிடம் நேரடியாக பொருட்களை ஆர்டர் செய்யுங்கள், தொழில்முறை சேவைகளை முன்பதிவு செய்யுங்கள்.')}
            </p>
          </div>

          {/* Unified Search & Filters */}
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20 max-w-5xl shadow-xl space-y-2.5">
            <div className="flex flex-col md:flex-row gap-2">
              {/* Keyword Search with Autocomplete */}
              <div className="relative flex-1" ref={searchBoxRef}>
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  aria-label="Search products, services, businesses"
                  placeholder={
                    activeTab === 'services'
                      ? (language === 'en'
                          ? 'Search electrician, plumbing, AC repair, tractor, solar, digital marketing...'
                          : 'எலக்ட்ரீஷியன், பிளம்பிங், ஏசி பழுது, டிராக்டர், சோலார் சேவைகளை தேடுக...')
                      : (language === 'en'
                          ? 'Search products, AC repair, cardamom, hospitals, groceries...'
                          : 'பொருட்கள், ஏசி பழுது, ஏலக்காய், மருத்துவமனை, கடைகளை தேடுக...')
                  }
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-xl text-sm text-slate-900 placeholder-slate-500 focus:outline-none font-medium shadow-2xs"
                />

                {/* Autocomplete Dropdown */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 text-slate-900">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {activeTab === 'services'
                        ? (language === 'en' ? 'Popular Services in Theni' : 'தேனியில் பிரபலமான சேவைகள்')
                        : (language === 'en' ? 'Popular Searches in Theni' : 'தேனியில் பிரபலமான தேடல்கள்')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentSuggestions.map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            setSearchQuery(sug);
                            setShowSuggestions(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-xs font-semibold transition-colors text-slate-700"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Location: Taluk / Town */}
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="px-3.5 py-3 bg-white rounded-xl text-sm text-slate-900 font-bold focus:outline-none shadow-2xs cursor-pointer"
              >
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === 'All Locations' && language === 'ta' ? 'அனைத்து இடங்கள்' : loc}
                  </option>
                ))}
              </select>

              {/* Category */}
              <select
                value={selectedCategory}
                onChange={e => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory('All Subcategories');
                }}
                className="px-3.5 py-3 bg-white rounded-xl text-sm text-slate-900 font-bold focus:outline-none shadow-2xs cursor-pointer"
              >
                {currentCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'All Categories' && language === 'ta' ? 'அனைத்து வகைகள்' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategories bar if category is selected */}
            {currentSubcategories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider shrink-0">
                  {language === 'en' ? 'Subcategory:' : 'துணைப்பிரிவு:'}
                </span>
                {currentSubcategories.map(sub => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                      selectedSubcategory === sub
                        ? 'bg-blue-500 text-white shadow-xs'
                        : 'bg-white/10 hover:bg-white/20 text-slate-100 border border-white/15'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            {/* Filter Bar: Price Range & Sort */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/10 text-xs text-white">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold flex items-center gap-1 text-slate-200">
                  <Tag size={13} /> {language === 'en' ? 'Price:' : 'விலை:'}
                </span>
                {PRICE_RANGES.map(pr => (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => setSelectedPriceRange(pr.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedPriceRange === pr.id
                        ? 'bg-amber-400 text-amber-950 shadow-xs'
                        : 'bg-white/15 hover:bg-white/25 text-white border border-white/15'
                    }`}
                  >
                    {language === 'en' ? pr.labelEn : pr.labelTa}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold flex items-center gap-1 text-slate-200">
                  <ArrowUpDown size={13} /> {language === 'en' ? 'Sort:' : 'வரிசைப்படுத்து:'}
                </span>
                <select
                  value={selectedSort}
                  onChange={e => setSelectedSort(e.target.value)}
                  className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-bold focus:outline-none cursor-pointer border border-white/20"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id} className="text-slate-900 bg-white">
                      {language === 'en' ? opt.labelEn : opt.labelTa}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Marketplace Filter Tabs & Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-200/80 overflow-x-auto no-scrollbar w-fit max-w-full">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-700 hover:text-slate-900 font-semibold'
              }`}
            >
              {language === 'en' ? 'All Items' : 'அனைத்தும்'} ({filteredProducts.length + filteredServices.length + filteredCompanies.length})
            </button>
            <button
              onClick={() => handleTabChange('products')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-700 hover:text-slate-900 font-semibold'
              }`}
            >
              🛒 {language === 'en' ? 'Products' : 'பொருட்கள்'} ({filteredProducts.length})
            </button>
            <button
              onClick={() => handleTabChange('services')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'services' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-700 hover:text-slate-900 font-semibold'
              }`}
            >
              🔧 {language === 'en' ? 'Services' : 'சேவைகள்'} ({filteredServices.length})
            </button>
            <button
              onClick={() => handleTabChange('businesses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'businesses' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-700 hover:text-slate-900 font-semibold'
              }`}
            >
              🏢 {language === 'en' ? 'Businesses' : 'நிறுவனங்கள்'} ({filteredCompanies.length})
            </button>
            <button
              onClick={() => handleTabChange('wishlist')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'wishlist' ? 'bg-white text-rose-700 shadow-xs font-black' : 'text-slate-700 hover:text-rose-600 font-semibold'
              }`}
            >
              <Heart size={13} className={wishlistItems.length > 0 ? 'fill-rose-500 text-rose-500' : ''} />
              <span>{language === 'en' ? 'Wishlist' : 'விருப்பங்கள்'}</span>
              <span>({wishlistItems.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <X size={14} /> {language === 'en' ? 'Clear Filters' : 'வடிகட்டிகளை நீக்கு'}
              </button>
            )}

            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={e => setVerifiedOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <BadgeCheck size={16} className="text-blue-600" />
              <span>{language === 'en' ? 'Verified Only' : 'சரிபார்க்கப்பட்டவை மட்டும்'}</span>
            </label>
          </div>
        </div>

        {/* ── WISHLIST TAB VIEW ── */}
        {activeTab === 'wishlist' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Heart size={18} className="fill-rose-500 text-rose-500" />
                <span>{language === 'en' ? 'Your Saved Items & Wishlist' : 'உங்கள் விருப்பப்பட்டியல்'}</span>
              </h2>
            </div>

            {wishlistItems.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
                <Heart size={36} className="mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">
                  {language === 'en' ? 'No items saved to your wishlist yet.' : 'விருப்பப்பட்டியலில் எந்த பொருட்களும் சேர்க்கப்படவில்லை.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleTabChange('products')}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                >
                  {language === 'en' ? 'Explore Products & Services' : 'பொருட்கள் & சேவைகளை பார்க்க'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {wishlistItems.map(item => {
                  const detailHref = `/marketplace/${item.type}/${item.companySlug}/${item.id}`;
                  const listingUrl = typeof window !== 'undefined'
                    ? `${window.location.origin}${detailHref}`
                    : `https://www.thenijobs.com${detailHref}`;
                  const waText = encodeURIComponent(`Hi ${item.companyName}, I found your ${item.type} "${item.name}" on THENIJOBS Marketplace.\nListing: ${listingUrl}`);

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between"
                    >
                      <Link href={detailHref} className="h-44 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-blue-50/50 flex items-center justify-center text-blue-400">
                            {item.type === 'service' ? <Wrench size={32} /> : <Package size={32} />}
                          </div>
                        )}
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-white/90 backdrop-blur-md text-slate-900 shadow-xs">
                          {item.category || item.type}
                        </span>
                      </Link>

                      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <Link href={detailHref}>
                            <h3 className="text-sm font-bold text-slate-900 line-clamp-1 hover:text-blue-600">{item.name}</h3>
                          </Link>
                          <p className="text-xs text-blue-600 font-semibold mt-0.5">{item.companyName}</p>
                          <p className="text-xs font-black text-emerald-700 mt-1">
                            {item.price ? `₹${Number(item.price).toLocaleString('en-IN')}${item.unit ? ` / ${item.unit}` : ''}` : item.priceRange || 'Rate on request'}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            {item.whatsapp && (
                              <a
                                href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}?text=${waText}`}
                                target="_blank"
                                rel="noreferrer"
                                className="py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                                style={{ background: '#25D366' }}
                              >
                                <MessageCircle size={12} /> WhatsApp
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                removeFromWishlist(item.id);
                                setWishlistItems(getWishlist());
                                toast.info('Removed from Wishlist');
                              }}
                              className="py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCTS SECTION ── */}
        {(activeTab === 'all' || activeTab === 'products') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package size={18} className="text-blue-600" />
                <span>{language === 'en' ? 'Verified Local Products' : 'சரிபார்க்கப்பட்ட உள்ளூர் பொருட்கள்'}</span>
              </h2>
              {activeTab === 'all' && (
                <button
                  onClick={() => handleTabChange('products')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  {language === 'en' ? `View all products (${filteredProducts.length}) →` : `அனைத்து பொருட்கள் (${filteredProducts.length}) →`}
                </button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
                <Package size={36} className="mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">
                  {language === 'en' ? 'No products found matching your search.' : 'தேடலுக்குரிய பொருட்கள் எதுவும் கிடைக்கவில்லை.'}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    {language === 'en' ? 'Clear Filters' : 'வடிகட்டிகளை நீக்கு'}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredProducts.slice(0, activeTab === 'all' ? 8 : visibleCount).map(prod => {
                  const detailHref = prod.id ? `/marketplace/product/${prod.company.slug}/${prod.id}` : null;
                  const isWish = isInWishlist(prod.id);
                  const isComp = isInCompare(prod.id);

                  const listingUrl = typeof window !== 'undefined'
                    ? `${window.location.origin}/marketplace/product/${prod.company.slug}/${prod.id}`
                    : `https://www.thenijobs.com/marketplace/product/${prod.company.slug}/${prod.id}`;
                  const waText = encodeURIComponent(`Hi ${prod.company.name}, I am interested in ordering your product "${prod.name}" (₹${prod.price || 'quote'}) listed on THENIJOBS Marketplace.\nListing: ${listingUrl}`);

                  return (
                  <div
                    key={prod.key}
                    className="bg-white rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group relative"
                  >
                    {/* Quick Wishlist & Compare floating buttons */}
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleToggleWishlistFromCard(prod, e)}
                        className={`p-1.5 rounded-full backdrop-blur-md shadow-xs transition-transform active:scale-90 ${
                          isWish ? 'bg-rose-50 text-rose-600' : 'bg-white/80 text-slate-700 hover:bg-white'
                        }`}
                        title="Add to Wishlist"
                      >
                        <Heart size={14} className={isWish ? 'fill-rose-500 text-rose-500' : ''} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleToggleCompareFromCard(prod, e)}
                        className={`p-1.5 rounded-full backdrop-blur-md shadow-xs transition-transform active:scale-90 ${
                          isComp ? 'bg-blue-600 text-white' : 'bg-white/80 text-slate-700 hover:bg-white'
                        }`}
                        title="Compare Product"
                      >
                        <Scale size={13} />
                      </button>
                    </div>

                    {detailHref ? (
                      <Link href={detailHref} className="h-44 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full bg-blue-50/50 flex items-center justify-center text-blue-400">
                            <Package size={32} />
                          </div>
                        )}
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-white/90 backdrop-blur-md text-slate-900 shadow-xs">
                          {prod.category || 'Product'}
                        </span>
                      </Link>
                    ) : (
                      <div className="h-44 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-blue-50/50 flex items-center justify-center text-blue-400">
                            <Package size={32} />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        {detailHref ? (
                          <Link href={detailHref}>
                            <h3 className="text-sm font-bold text-slate-900 line-clamp-1 hover:text-blue-600">{prod.name}</h3>
                          </Link>
                        ) : (
                          <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{prod.name}</h3>
                        )}

                        <Link
                          href={`/${prod.company.slug}`}
                          className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1 line-clamp-1"
                        >
                          <span>{prod.company.name}</span>
                          {prod.company.isVerified && <BadgeCheck size={12} className="text-blue-600 shrink-0" />}
                        </Link>

                        <p className="text-[11px] text-slate-500 line-clamp-2">{prod.description || 'Quality product from verified local seller.'}</p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-700">
                            {prod.price ? `₹${Number(prod.price).toLocaleString('en-IN')}${prod.unit ? ` / ${prod.unit}` : ''}` : prod.priceRange || 'Price on request'}
                          </span>
                          <span className="text-[10px] text-slate-400">{prod.company.taluk || prod.company.district}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          {prod.company.whatsapp && (
                            <a
                              href={`https://wa.me/${prod.company.whatsapp.replace(/\D/g, '')}?text=${waText}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs hover:opacity-95 transition-opacity"
                              style={{ background: '#25D366' }}
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => openInquiryModal(prod)}
                            className="py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Send size={11} /> {language === 'en' ? 'Inquire' : 'விசாரிக்க'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          {prod.company.phone && (
                            <a
                              href={`tel:${prod.company.phone}`}
                              className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1"
                              title="Direct Call"
                            >
                              <Phone size={11} /> Call
                            </a>
                          )}
                          {detailHref && (
                            <Link
                              href={detailHref}
                              className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold text-center"
                            >
                              {language === 'en' ? 'Details' : 'விவரங்கள்'}
                            </Link>
                          )}
                          <Link
                            href={`/${prod.company.slug}`}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                            title="Visit Official Company Website"
                          >
                            <ExternalLink size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SERVICES SECTION ── */}
        {(activeTab === 'all' || activeTab === 'services') && (
          <div className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench size={18} className="text-teal-600" />
                <span>{language === 'en' ? 'Professional Services' : 'தொழில்முறை சேவைகள்'}</span>
              </h2>
              {activeTab === 'all' && (
                <button
                  onClick={() => handleTabChange('services')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  {language === 'en' ? `View all services (${filteredServices.length}) →` : `அனைத்து சேவைகள் (${filteredServices.length}) →`}
                </button>
              )}
            </div>

            {filteredServices.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
                <Wrench size={36} className="mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">
                  {language === 'en' ? 'No services found matching your search.' : 'தேடலுக்குரிய சேவைகள் எதுவும் கிடைக்கவில்லை.'}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    {language === 'en' ? 'Clear Filters' : 'வடிகட்டிகளை நீக்கு'}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredServices.slice(0, activeTab === 'all' ? 8 : visibleCount).map(srv => {
                  const detailHref = srv.id ? `/marketplace/service/${srv.company.slug}/${srv.id}` : null;
                  const isWish = isInWishlist(srv.id);

                  const listingUrl = typeof window !== 'undefined'
                    ? `${window.location.origin}/marketplace/service/${srv.company.slug}/${srv.id}`
                    : `https://www.thenijobs.com/marketplace/service/${srv.company.slug}/${srv.id}`;
                  const waText = encodeURIComponent(`Hi ${srv.company.name}, I would like to book your service "${srv.name}" listed on THENIJOBS Marketplace.\nListing: ${listingUrl}`);

                  return (
                  <div
                    key={srv.key}
                    className="bg-white rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group relative"
                  >
                    <div className="absolute top-2.5 left-2.5 z-20">
                      <button
                        type="button"
                        onClick={(e) => handleToggleWishlistFromCard(srv, e)}
                        className={`p-1.5 rounded-full backdrop-blur-md shadow-xs transition-transform active:scale-90 ${
                          isWish ? 'bg-rose-50 text-rose-600' : 'bg-white/80 text-slate-700 hover:bg-white'
                        }`}
                        title="Add to Wishlist"
                      >
                        <Heart size={14} className={isWish ? 'fill-rose-500 text-rose-500' : ''} />
                      </button>
                    </div>

                    {detailHref ? (
                      <Link href={detailHref} className="h-44 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                        {srv.imageUrl ? (
                          <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full bg-teal-50/50 flex items-center justify-center text-teal-400">
                            <Wrench size={32} />
                          </div>
                        )}
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-white/90 backdrop-blur-md text-slate-900 shadow-xs">
                          {srv.category || 'Service'}
                        </span>
                      </Link>
                    ) : (
                      <div className="h-44 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                        {srv.imageUrl ? (
                          <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-teal-50/50 flex items-center justify-center text-teal-400">
                            <Wrench size={32} />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        {detailHref ? (
                          <Link href={detailHref}>
                            <h3 className="text-sm font-bold text-slate-900 line-clamp-1 hover:text-blue-600">{srv.name}</h3>
                          </Link>
                        ) : (
                          <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{srv.name}</h3>
                        )}

                        <Link
                          href={`/${srv.company.slug}`}
                          className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1 line-clamp-1"
                        >
                          <span>{srv.company.name}</span>
                          {srv.company.isVerified && <BadgeCheck size={12} className="text-blue-600 shrink-0" />}
                        </Link>

                        <p className="text-[11px] text-slate-500 line-clamp-2">{srv.description || 'Verified local service.'}</p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-blue-700">
                            {srv.price ? `Starts ₹${Number(srv.price).toLocaleString('en-IN')}` : (srv.pricingType || 'Rate on request')}
                          </span>
                          <span className="text-[10px] text-slate-400">{srv.company.taluk || srv.company.district}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          {srv.company.whatsapp && (
                            <a
                              href={`https://wa.me/${srv.company.whatsapp.replace(/\D/g, '')}?text=${waText}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs hover:opacity-95 transition-opacity"
                              style={{ background: '#25D366' }}
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => openInquiryModal(srv)}
                            className="py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Send size={11} /> {language === 'en' ? 'Book' : 'முன்பதிவு'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          {srv.company.phone && (
                            <a
                              href={`tel:${srv.company.phone}`}
                              className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1"
                              title="Direct Call"
                            >
                              <Phone size={11} /> Call
                            </a>
                          )}
                          {detailHref && (
                            <Link
                              href={detailHref}
                              className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold text-center"
                            >
                              {language === 'en' ? 'Details' : 'விவரங்கள்'}
                            </Link>
                          )}
                          <Link
                            href={`/${srv.company.slug}`}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                            title="Visit Official Company Website"
                          >
                            <ExternalLink size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── BUSINESSES / COMPANIES SECTION ── */}
        {(activeTab === 'all' || activeTab === 'businesses') && (
          <div className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-indigo-600" />
                <span>{language === 'en' ? 'Verified Local Businesses' : 'சரிபார்க்கப்பட்ட உள்ளூர் நிறுவனங்கள்'}</span>
              </h2>
              {activeTab === 'all' && (
                <button
                  onClick={() => handleTabChange('businesses')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  {language === 'en' ? `View all businesses (${filteredCompanies.length}) →` : `அனைத்து நிறுவனங்கள் (${filteredCompanies.length}) →`}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.slice(0, activeTab === 'all' ? 6 : visibleCount).map(c => {
                const isVer = c.verificationStatus === 'verified' || c.isVerified === true;
                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="font-bold text-indigo-600 text-lg">{(c.name || 'C')[0]}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 truncate">{c.name}</h3>
                          {isVer && <BadgeCheck size={15} className="text-blue-600 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{c.category || 'Business'} • {c.taluk || c.district || 'Theni'}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {c.description || `${c.name} is a verified business serving ${c.district || 'Theni'} district.`}
                    </p>

                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <Link
                        href={`/${c.slug}`}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>{language === 'en' ? 'Official Website' : 'வலைத்தளம்'}</span> <ArrowRight size={12} />
                      </Link>

                      <Link
                        href={`/company/${c.slug}`}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
                        title="Directory Profile"
                      >
                        {language === 'en' ? 'Profile' : 'விவரம்'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RECENTLY VIEWED SHELF ── */}
        {recentlyViewed.length > 0 && activeTab === 'all' && (
          <div className="pt-8 border-t border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <History size={16} className="text-slate-500" />
                <span>{language === 'en' ? 'Recently Viewed Listings' : 'சமீபத்தில் பார்த்தவை'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  clearRecentlyViewed();
                  setRecentlyViewed([]);
                }}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                {language === 'en' ? 'Clear History' : 'வரலாற்றை அழி'}
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {recentlyViewed.map(rv => (
                <Link
                  key={rv.id}
                  href={`/marketplace/${rv.type}/${rv.companySlug}/${rv.id}`}
                  className="w-48 bg-white p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs shrink-0 transition-all flex flex-col justify-between"
                >
                  <div className="h-24 rounded-xl bg-slate-100 overflow-hidden mb-2">
                    {rv.imageUrl ? (
                      <img src={rv.imageUrl} alt={rv.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        {rv.type === 'service' ? <Wrench size={24} /> : <Package size={24} />}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{rv.name}</h4>
                    <p className="text-[10px] text-slate-500 truncate">{rv.companyName}</p>
                    <p className="text-xs font-black text-emerald-700 mt-1">
                      {rv.price ? `₹${Number(rv.price).toLocaleString('en-IN')}` : rv.priceRange || 'Rate on request'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Load More Button */}
        {activeTab !== 'all' && activeTab !== 'wishlist' && (
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setVisibleCount(prev => prev + 24)}
              className="px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              {language === 'en' ? 'Load More Listings' : 'மேலும் பார்க்க'}
            </button>
          </div>
        )}
      </main>

      {/* ── FLOATING PRODUCT COMPARISON DOCK ── */}
      {compareItems.length > 0 && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in max-w-lg w-full mx-auto">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Scale size={18} className="text-amber-400 shrink-0" />
            <div className="flex -space-x-2 overflow-hidden shrink-0">
              {compareItems.map(item => (
                <div key={item.id} className="w-8 h-8 rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={14} className="m-auto text-slate-400 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs font-bold truncate">
              {compareItems.length} {language === 'en' ? 'selected to compare' : 'பொருட்கள் தேர்வு செய்யப்பட்டுள்ளன'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompareModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              {language === 'en' ? 'Compare Now' : 'ஒப்பிடு'}
            </button>
            <button
              type="button"
              onClick={() => {
                clearCompare();
                setCompareItems([]);
              }}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Clear comparison"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── PRODUCT COMPARISON MODAL ── */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale size={20} className="text-blue-600" />
                <h3 className="text-base font-black text-slate-900">
                  {language === 'en' ? 'Product Comparison' : 'பொருட்கள் ஒப்பீடு'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {compareItems.map(item => {
                const detailHref = `/marketplace/product/${item.companySlug}/${item.id}`;
                const listingUrl = typeof window !== 'undefined'
                  ? `${window.location.origin}${detailHref}`
                  : `https://www.thenijobs.com${detailHref}`;
                const waText = encodeURIComponent(`Hi ${item.companyName}, I am comparing your product "${item.name}" on THENIJOBS Marketplace.\nListing: ${listingUrl}\nPlease share availability.`);

                return (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="h-36 bg-slate-200 rounded-xl overflow-hidden relative">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Package size={32} />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            removeFromCompare(item.id);
                            setCompareItems(getCompareItems());
                          }}
                          className="absolute top-2 right-2 p-1 rounded-full bg-white/90 text-slate-600 hover:text-red-600 shadow-xs"
                          title="Remove item"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{item.name}</h4>
                      <p className="text-xs text-blue-600 font-semibold">{item.companyName}</p>
                      
                      <div className="text-base font-black text-emerald-700">
                        {item.price ? `₹${Number(item.price).toLocaleString('en-IN')}${item.unit ? ` / ${item.unit}` : ''}` : item.priceRange || 'Quote on request'}
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                        <p><span className="font-bold text-slate-400">Category:</span> {item.category}</p>
                        <p><span className="font-bold text-slate-400">Location:</span> {item.district}</p>
                        <p><span className="font-bold text-slate-400">Status:</span> {item.availability || 'In Stock'}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      {item.whatsapp && (
                        <a
                          href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}?text=${waText}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                          style={{ background: '#25D366' }}
                        >
                          <MessageCircle size={13} /> Order on WhatsApp
                        </a>
                      )}
                      <Link
                        href={detailHref}
                        className="w-full py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold text-center block"
                      >
                        View Full Specifications
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Direct On-Site Inquiry Modal ── */}
      {inquiryModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'en' ? 'Send Direct Inquiry' : 'நேரடி விசாரணை அனுப்பு'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {inquiryModalItem.company.name} • {inquiryModalItem.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInquiryModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitDirectInquiry} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'en' ? 'Your Name *' : 'உங்கள் பெயர் *'}
                </label>
                <input
                  type="text"
                  required
                  value={inquiryName}
                  onChange={e => setInquiryName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'en' ? 'Phone Number *' : 'தொலைபேசி எண் *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={inquiryPhone}
                    onChange={e => setInquiryPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-600 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'en' ? 'Email (Optional)' : 'மின்னஞ்சல் (விருப்பத்தேர்வு)'}
                  </label>
                  <input
                    type="email"
                    value={inquiryEmail}
                    onChange={e => setInquiryEmail(e.target.value)}
                    placeholder="e.g. ramesh@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'en' ? 'Inquiry Message *' : 'விசாரணை செய்தி *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={inquiryMessage}
                  onChange={e => setInquiryMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-600 font-medium resize-none leading-relaxed"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                {language === 'en'
                  ? 'Your contact details will be sent directly to the verified seller\'s CRM dashboard.'
                  : 'உங்கள் தொடர்பு விவரங்கள் நேரடியாக விற்பனையாளரின் டாஷ்போர்டிற்கு அனுப்பப்படும்.'}
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInquiryModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  {language === 'en' ? 'Cancel' : 'ரத்து செய்'}
                </button>
                <button
                  type="submit"
                  disabled={inquirySubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {inquirySubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>{language === 'en' ? 'Sending…' : 'அனுப்புகிறது…'}</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>{language === 'en' ? 'Send Inquiry' : 'விசாரணை அனுப்பு'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default function MarketplaceBrowseClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm font-medium animate-pulse">Loading Marketplace...</div>
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
