'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MapPin, Phone, Mail, Globe, MessageCircle, Share2, Heart,
  Star, BadgeCheck, Clock, Users, Eye, TrendingUp, ChevronRight,
  Briefcase, Navigation, ShieldCheck, Smartphone, FileCheck, Award, ExternalLink,
  Send, Quote, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Building2,
  Calendar, Check, AlertCircle, ArrowUpRight, ArrowRight, Stethoscope,
  GraduationCap, Factory, Code2, Sprout, UtensilsCrossed, ShoppingBag,
  Wrench, Landmark, Store, X, HelpCircle, MapPinOff, Tag, Package,
  Layers, Compass, Flame, Shield, CheckCircle, BedDouble, Wifi, Car,
  BookOpen, UserCheck, HardHat, Cpu, Truck, CheckSquare, PhoneCall
} from 'lucide-react';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

// ─── 10 INDUSTRY TEMPLATE IDENTIFIERS ───────────────────────────────────────
export type IndustryTemplateKey =
  | 'healthcare-hospital'
  | 'education-college'
  | 'manufacturing-industry'
  | 'it-software'
  | 'agriculture-farming'
  | 'hotel-hospitality'
  | 'retail-supermarket'
  | 'service-business'
  | 'corporate-professional'
  | 'local-business';

interface IndustryTheme {
  key: IndustryTemplateKey;
  name: string;
  categoryMatch: string[];
  primary: string;
  primaryHover: string;
  gradient: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  heroBadge: string;
  heroTaglineDefault: string;
  icon: typeof Stethoscope;
  featuresTitle: string;
  serviceBadge: string;
  jobCtaText: string;
}

export const INDUSTRY_THEMES: Record<IndustryTemplateKey, IndustryTheme> = {
  'healthcare-hospital': {
    key: 'healthcare-hospital',
    name: 'Healthcare & Hospital',
    categoryMatch: ['Healthcare & Hospital', 'Hospital', 'Clinic', 'Pharmacy', 'Medical', 'Diagnostics'],
    primary: '#0D9488', // Medical Teal
    primaryHover: '#0F766E',
    gradient: 'linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #115E59 100%)',
    accentBg: '#F0FDFA',
    accentBorder: '#99F6E4',
    accentText: '#0F766E',
    heroBadge: '🏥 24/7 Medical Care & Healthcare Services',
    heroTaglineDefault: 'Providing advanced diagnosis, dedicated medical specialists, and compassionate patient care in Theni district.',
    icon: Stethoscope,
    featuresTitle: 'Medical Specialities & Clinical Departments',
    serviceBadge: 'Clinical Care',
    jobCtaText: 'Doctor, Nurse & Healthcare Staff Openings',
  },
  'education-college': {
    key: 'education-college',
    name: 'Education & College',
    categoryMatch: ['Education & Training', 'School', 'College', 'Institute', 'Academy', 'Coaching'],
    primary: '#1E40AF', // Academic Navy
    primaryHover: '#1D4ED8',
    gradient: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 60%, #312E81 100%)',
    accentBg: '#EFF6FF',
    accentBorder: '#BFDBFE',
    accentText: '#1E40AF',
    heroBadge: '🎓 Admissions Open • Academic Excellence',
    heroTaglineDefault: 'Shaping future leaders through disciplined learning, accredited degree programs, and modern smart campus facilities.',
    icon: GraduationCap,
    featuresTitle: 'Courses, Programs & Academic Labs',
    serviceBadge: 'Curriculum & Courses',
    jobCtaText: 'Faculty, Teaching & Administrative Vacancies',
  },
  'manufacturing-industry': {
    key: 'manufacturing-industry',
    name: 'Manufacturing & Industry',
    categoryMatch: ['Manufacturing & Industry', 'Textiles & Garments', 'Factory', 'Mill', 'Industrial', 'Engineering'],
    primary: '#0369A1', // Steel Blue
    primaryHover: '#075985',
    gradient: 'linear-gradient(135deg, #0F172A 0%, #0369A1 60%, #0284C7 100%)',
    accentBg: '#F0F9FF',
    accentBorder: '#BAE6FD',
    accentText: '#0369A1',
    heroBadge: '🏭 ISO Certified Production & Industrial Plant',
    heroTaglineDefault: 'Precision manufacturing, advanced industrial machinery, and consistent production output for global & domestic markets.',
    icon: Factory,
    featuresTitle: 'Production Capabilities & Machinery',
    serviceBadge: 'Plant Machinery',
    jobCtaText: 'Technician, Operator & Engineering Jobs',
  },
  'it-software': {
    key: 'it-software',
    name: 'IT & Software / Digital',
    categoryMatch: ['IT, Software & Digital', 'IT & Software', 'Software', 'Technology', 'Digital Marketing', 'Web Development'],
    primary: '#6366F1', // Indigo Tech
    primaryHover: '#4F46E5',
    gradient: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4F46E5 100%)',
    accentBg: '#EEF2FF',
    accentBorder: '#C7D2FE',
    accentText: '#4338CA',
    heroBadge: '⚡ Cloud, Mobile & Modern Tech Solutions',
    heroTaglineDefault: 'Architecting scalable software, custom enterprise applications, and AI-powered digital products for modern business.',
    icon: Code2,
    featuresTitle: 'Digital Solutions & Technology Stack',
    serviceBadge: 'Tech Stack',
    jobCtaText: 'Developer, QA & Remote Tech Careers',
  },
  'agriculture-farming': {
    key: 'agriculture-farming',
    name: 'Agriculture & Farming',
    categoryMatch: ['Agriculture & Farming', 'Agriculture', 'Farm', 'Agro', 'Poultry', 'Horticulture', 'Seeds'],
    primary: '#15803D', // Agro Emerald
    primaryHover: '#166534',
    gradient: 'linear-gradient(135deg, #14532D 0%, #15803D 60%, #166534 100%)',
    accentBg: '#F0FDF4',
    accentBorder: '#BBF7D0',
    accentText: '#15803D',
    heroBadge: '🌾 Fresh Agricultural Produce & Agro-Services',
    heroTaglineDefault: 'Sustainable farming methods, fertile agro-produce, high-yield seeds, and expert consultation from the heart of Theni.',
    icon: Sprout,
    featuresTitle: 'Seasonal Harvest Produce & Farm Services',
    serviceBadge: 'Agri Harvest',
    jobCtaText: 'Field Supervisor & Agronomist Careers',
  },
  'hotel-hospitality': {
    key: 'hotel-hospitality',
    name: 'Hotel & Hospitality',
    categoryMatch: ['Hotel, Food & Restaurant', 'Hotel', 'Restaurant', 'Resort', 'Catering', 'Hospitality', 'Bakery'],
    primary: '#BE123C', // Luxury Rose/Amber
    primaryHover: '#9F1239',
    gradient: 'linear-gradient(135deg, #881337 0%, #BE123C 60%, #E11D48 100%)',
    accentBg: '#FFF1F2',
    accentBorder: '#FECDD3',
    accentText: '#BE123C',
    heroBadge: '🏨 Premium Stays, Dining & Banquets',
    heroTaglineDefault: 'Warm hospitality, authentic multi-cuisine dining, and comfortable luxury rooms tailored for your family stay.',
    icon: UtensilsCrossed,
    featuresTitle: 'Suites, Dining & Guest Amenities',
    serviceBadge: 'Guest Amenities',
    jobCtaText: 'Chef, Front Desk & Hospitality Careers',
  },
  'retail-supermarket': {
    key: 'retail-supermarket',
    name: 'Retail & Supermarket',
    categoryMatch: ['Retail, Shop & Supermarket', 'Retail', 'Supermarket', 'Showroom', 'Clothing Store', 'Jewellery', 'Groceries'],
    primary: '#EA580C', // Retail Orange
    primaryHover: '#C2410C',
    gradient: 'linear-gradient(135deg, #7C2D12 0%, #EA580C 60%, #F97316 100%)',
    accentBg: '#FFF7ED',
    accentBorder: '#FED7AA',
    accentText: '#C2410C',
    heroBadge: '🛍️ Daily Special Offers & Store Aisles',
    heroTaglineDefault: 'Wide range of daily essentials, verified quality brands, wholesale pricing, and convenient local home delivery.',
    icon: ShoppingBag,
    featuresTitle: 'Supermarket Aisles & Today’s Specials',
    serviceBadge: 'Store Aisles',
    jobCtaText: 'Billing Staff, Cashier & Sales Vacancies',
  },
  'service-business': {
    key: 'service-business',
    name: 'Service Business & Repairs',
    categoryMatch: ['Automobile & Transport', 'Services', 'Automobile', 'Transport', 'Electrician', 'Plumbing', 'Construction'],
    primary: '#2563EB', // Service Blue
    primaryHover: '#1D4ED8',
    gradient: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)',
    accentBg: '#EFF6FF',
    accentBorder: '#BFDBFE',
    accentText: '#1D4ED8',
    heroBadge: '🔧 On-Demand Repairs & Trusted Service Guarantee',
    heroTaglineDefault: 'Prompt on-site technicians, transparent price estimation, and verified warranty on all repair services in Theni.',
    icon: Wrench,
    featuresTitle: 'Service Packages & Emergency Repairs',
    serviceBadge: 'Repair Service',
    jobCtaText: 'Electrician, Plumber & Technician Jobs',
  },
  'corporate-professional': {
    key: 'corporate-professional',
    name: 'Corporate & Professional',
    categoryMatch: ['Professional & Business Services', 'Banking & Finance', 'Corporate', 'Consultancy', 'Auditing', 'Legal', 'Agency'],
    primary: '#0F172A', // Slate/Navy Corporate
    primaryHover: '#1E293B',
    gradient: 'linear-gradient(135deg, #020617 0%, #0F172A 60%, #1E293B 100%)',
    accentBg: '#F8FAFC',
    accentBorder: '#E2E8F0',
    accentText: '#0F172A',
    heroBadge: '🏢 Strategic Corporate Advisory & Compliance',
    heroTaglineDefault: 'Providing expert corporate consulting, certified financial auditing, and business advisory services with strict integrity.',
    icon: Landmark,
    featuresTitle: 'Corporate Practice Areas & Advisory',
    serviceBadge: 'Advisory Practice',
    jobCtaText: 'Consultant, Executive & Associate Careers',
  },
  'local-business': {
    key: 'local-business',
    name: 'Local Shop & Business',
    categoryMatch: ['General Business', 'Shop', 'Local', 'Store', 'Vendor', 'Business'],
    primary: '#4338CA', // Indigo
    primaryHover: '#3730A3',
    gradient: 'linear-gradient(135deg, #1E1B4B 0%, #3730A3 60%, #4338CA 100%)',
    accentBg: '#EEF2FF',
    accentBorder: '#C7D2FE',
    accentText: '#3730A3',
    heroBadge: '🏪 Open Daily • Trusted Neighborhood Store',
    heroTaglineDefault: 'Serving our community with personalized service, trusted products, and dependable local support in Theni.',
    icon: Store,
    featuresTitle: 'Featured Offerings & Local Specialities',
    serviceBadge: 'Store Speciality',
    jobCtaText: 'Store Assistant, Delivery & Helper Jobs',
  },
};

export function resolveTemplateTheme(category?: string, explicitTemplate?: string): IndustryTheme {
  if (explicitTemplate && INDUSTRY_THEMES[explicitTemplate as IndustryTemplateKey]) {
    return INDUSTRY_THEMES[explicitTemplate as IndustryTemplateKey];
  }
  if (!category) return INDUSTRY_THEMES['local-business'];

  const catLower = category.toLowerCase();
  for (const key of Object.keys(INDUSTRY_THEMES) as IndustryTemplateKey[]) {
    const t = INDUSTRY_THEMES[key];
    if (t.categoryMatch.some(m => catLower.includes(m.toLowerCase()))) {
      return t;
    }
  }
  return INDUSTRY_THEMES['local-business'];
}

// ─── MAIN LANDING WEBSITE COMPONENT ─────────────────────────────────────────
interface CompanyLandingWebsiteProps {
  company: any;
  jobs?: any[];
  reviews?: any[];
  isDraftPreview?: boolean;
}

export default function CompanyLandingWebsite({
  company,
  jobs = [],
  reviews = [],
  isDraftPreview = false,
}: CompanyLandingWebsiteProps) {
  const theme = resolveTemplateTheme(company.category, company.templateId);
  const IconComponent = theme.icon;

  // Active Tab for Offerings
  const [offeringTab, setOfferingTab] = useState<'products' | 'services'>('products');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Lead Form State
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', message: '', service: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const cleanPhone = (company.phone || '').replace(/[^0-9+]/g, '');
  const cleanWa = (company.whatsapp || company.phone || '').replace(/[^0-9]/g, '');
  const isVerified = company.verificationStatus === 'verified' || company.isVerified === true;

  // Google Maps direction URL
  const googleMapsUrl = company.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${company.name} ${company.address || ''} ${company.district || 'Theni'} Tamil Nadu`)}`;

  const productsList = company.products || [];
  const servicesList = company.services || [];

  const defaultFaqs = [
    {
      q: `What are the operating hours for ${company.name}?`,
      a: company.businessHours || `${company.name} is open Monday through Saturday from 9:00 AM to 8:00 PM. Please contact directly for holiday timings.`,
    },
    {
      q: `How can I apply for job vacancies at ${company.name}?`,
      a: `You can view all current career openings in the 'Careers & Open Jobs' section below and apply directly through THENIJOBS with your resume.`,
    },
    {
      q: `Where is ${company.name} located and how do I get directions?`,
      a: `${company.address || `${company.name}, ${company.district || 'Theni'} District, Tamil Nadu`}. You can tap 'Get Directions' to open turn-by-turn navigation on Google Maps.`,
    },
    {
      q: `How can I place an order or request a service quote?`,
      a: `You can submit the inquiry form on this page or tap the direct WhatsApp button to connect directly with our customer desk.`,
    },
  ];

  const faqs = (company.faqs && company.faqs.length > 0) ? company.faqs : defaultFaqs;

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) return;
    setFormStatus('submitting');

    setTimeout(() => {
      setFormStatus('success');
      if (cleanWa) {
        const msg = `👋 *NEW ENQUIRY via THENIJOBS OFFICIAL WEBSITE*\n\n*Company:* ${company.name}\n*Name:* ${leadForm.name}\n*Phone:* ${leadForm.phone}\n*Interest:* ${leadForm.service || 'General Enquiry'}\n*Message:* ${leadForm.message || 'I would like to know more.'}`;
        window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    }, 600);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${company.name} — Official Website`,
        text: company.tagline || `Check out ${company.name} in ${company.district || 'Theni'} on THENIJOBS`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-0 bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Top Bar / Verified Header ── */}
      {isDraftPreview && (
        <div className="bg-amber-500 text-slate-950 text-xs font-bold py-2 px-4 text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-2">
          <AlertCircle size={14} />
          <span>Draft Mode — This website is under moderation review by THENIJOBS admin.</span>
        </div>
      )}

      {/* ── Brand Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Logo & Company Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full rounded-xl flex items-center justify-center text-white font-extrabold text-base" style={{ background: theme.primary }}>
                  {(company.name || 'C')[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {company.name}
                </span>
                {isVerified && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <BadgeCheck size={12} className="text-emerald-600" /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">{company.category || 'Business'} • {company.district || 'Theni'}</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#about" className="hover:text-slate-900 transition-colors">About</a>
            <a href="#marketplace" className="hover:text-slate-900 transition-colors">Products &amp; Services</a>
            {jobs.length > 0 && (
              <a href="#jobs" className="hover:text-slate-900 transition-colors flex items-center gap-1 text-emerald-700 font-extrabold">
                <Briefcase size={13} /> Careers ({jobs.length})
              </a>
            )}
            <a href="#faqs" className="hover:text-slate-900 transition-colors">FAQs</a>
            <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Share Website"
            >
              {copiedLink ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
            </button>

            {cleanWa && (
              <a
                href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi ${company.name}, I am contacting you through your official website on THENIJOBS.`)}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:opacity-95"
                style={{ background: '#25D366' }}
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}

            {cleanPhone && (
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:opacity-95"
                style={{ background: theme.primary }}
              >
                <Phone size={14} /> Call Now
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── 1. BESPOKE INDUSTRY HERO SECTION ── */}
      <section className="relative text-white overflow-hidden" style={{ background: theme.gradient }}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-xs">
                <IconComponent size={14} />
                <span>{company.heroBadge || theme.heroBadge}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {company.tagline || company.name}
              </h1>

              <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-2xl">
                {company.description || theme.heroTaglineDefault}
              </p>

              {/* Badges / Metrics Strip */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
                  <MapPin size={13} className="text-amber-300" />
                  <span>{company.district || 'Theni'}, Tamil Nadu</span>
                </div>
                {company.employeeCount && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
                    <Users size={13} className="text-emerald-300" />
                    <span>{company.employeeCount} Staff</span>
                  </div>
                )}
                {company.foundedYear && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
                    <Clock size={13} className="text-blue-300" />
                    <span>Est. {company.foundedYear}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <a
                  href="#contact"
                  className="px-6 py-3.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <span>Book / Enquire</span> <ArrowRight size={15} />
                </a>

                {jobs.length > 0 && (
                  <a
                    href="#jobs"
                    className="px-6 py-3.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm backdrop-blur-md border border-white/30 transition-all flex items-center gap-2"
                  >
                    <Briefcase size={15} /> <span>{jobs.length} Open Careers</span>
                  </a>
                )}

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur-md border border-white/20 flex items-center gap-1.5"
                >
                  <Navigation size={13} /> Get Directions
                </a>
              </div>
            </div>

            {/* Right Card / Specific Category Feature */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl border border-white/40 space-y-6">
                
                {/* Specific Category Highlight Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Verified Business</span>
                    <h2 className="text-xl font-bold text-slate-900">{company.name}</h2>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-extrabold text-lg" style={{ color: theme.primary }}>
                        {(company.name || 'C')[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Specific Category Feature Box */}
                {theme.key === 'healthcare-hospital' && (
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-teal-900">
                      <Stethoscope size={16} className="text-teal-600" />
                      <span>Specialist Care &amp; Doctors Desk</span>
                    </div>
                    <p className="text-teal-700 text-[11px]">
                      General Medicine • Pediatrics • Orthopedics • 24/7 Pharmacy
                    </p>
                  </div>
                )}

                {theme.key === 'education-college' && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-blue-900">
                      <GraduationCap size={16} className="text-blue-600" />
                      <span>Admissions &amp; Course Consultation</span>
                    </div>
                    <p className="text-blue-700 text-[11px]">
                      Degree Programs • Smart Classrooms • Placement Support
                    </p>
                  </div>
                )}

                {theme.key === 'manufacturing-industry' && (
                  <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-sky-900">
                      <Factory size={16} className="text-sky-600" />
                      <span>Production Capability &amp; Bulk Orders</span>
                    </div>
                    <p className="text-sky-700 text-[11px]">
                      High Capacity Output • ISO Compliance • Factory Dispatch
                    </p>
                  </div>
                )}

                {theme.key === 'it-software' && (
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-indigo-900">
                      <Code2 size={16} className="text-indigo-600" />
                      <span>Custom Software &amp; Tech Engineering</span>
                    </div>
                    <p className="text-indigo-700 text-[11px]">
                      Full-Stack Web • Mobile Apps • AI &amp; Cloud Infrastructure
                    </p>
                  </div>
                )}

                {theme.key === 'agriculture-farming' && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                      <Sprout size={16} className="text-emerald-600" />
                      <span>Fresh Harvest &amp; Farm Supply</span>
                    </div>
                    <p className="text-emerald-700 text-[11px]">
                      Organic Produce • Quality Seeds • Direct Farmer Sourcing
                    </p>
                  </div>
                )}

                {theme.key === 'hotel-hospitality' && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-rose-900">
                      <BedDouble size={16} className="text-rose-600" />
                      <span>Room Reservations &amp; Banquets</span>
                    </div>
                    <p className="text-rose-700 text-[11px]">
                      AC Deluxe Rooms • Multi-Cuisine Restaurant • Free WiFi
                    </p>
                  </div>
                )}

                {theme.key === 'retail-supermarket' && (
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-orange-900">
                      <ShoppingBag size={16} className="text-orange-600" />
                      <span>Supermarket Aisles &amp; Daily Offers</span>
                    </div>
                    <p className="text-orange-700 text-[11px]">
                      Groceries • Household Items • Instant Billing • Home Delivery
                    </p>
                  </div>
                )}

                {theme.key === 'service-business' && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-blue-900">
                      <Wrench size={16} className="text-blue-600" />
                      <span>Express Service &amp; Technician Booking</span>
                    </div>
                    <p className="text-blue-700 text-[11px]">
                      On-site Visits • Certified Technicians • Service Warranty
                    </p>
                  </div>
                )}

                {theme.key === 'corporate-professional' && (
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Landmark size={16} className="text-slate-700" />
                      <span>Corporate Advisory &amp; Legal Audit</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Financial Advisory • Legal Compliance • Strategy
                    </p>
                  </div>
                )}

                {theme.key === 'local-business' && (
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-indigo-900">
                      <Store size={16} className="text-indigo-600" />
                      <span>Local Neighborhood Store</span>
                    </div>
                    <p className="text-indigo-700 text-[11px]">
                      Convenient Location • Direct WhatsApp Orders • Best Rates
                    </p>
                  </div>
                )}

                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{company.address || `${company.name}, ${company.district || 'Theni'}, Tamil Nadu`}</span>
                  </div>
                  {cleanPhone && (
                    <div className="flex items-center gap-2.5">
                      <Phone size={15} className="text-slate-400 shrink-0" />
                      <span className="font-mono font-bold text-slate-900">{company.phone}</span>
                    </div>
                  )}
                </div>

                <a
                  href="#contact"
                  className="w-full py-3 rounded-xl text-center font-bold text-white text-xs block transition-all shadow-sm"
                  style={{ background: theme.primary }}
                >
                  Send Direct Enquiry
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. ABOUT US & COMPANY STORY ── */}
      <section id="about" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: theme.primary }}>
              Company Story &amp; Leadership
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Committed to Exceptional Service in {company.district || 'Theni'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {company.aboutStory || company.description || `${company.name} is an esteemed organization in ${company.district || 'Theni'}, Tamil Nadu. Dedicated to providing dependable quality, customer satisfaction, and professional excellence, we combine modern industry standards with attentive customer care while creating rewarding local jobs.`}
            </p>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10">
            <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white" style={{ background: theme.primary }}>
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Verified Business</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Reviewed and registered on THENIJOBS with confirmed direct contact numbers.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white">
                <Award size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Local Authority</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Deeply rooted in {company.district || 'Theni'}, serving the local community with reliable care.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
                <Users size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Active Hiring</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Direct resume submission and fast interview scheduling via THENIJOBS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. LOCAL MARKETPLACE: PRODUCTS & SERVICES ── */}
      <section id="marketplace" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: theme.primary }}>
                Local Business Marketplace
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Products &amp; Services by {company.name}
              </h2>
            </div>

            {/* Toggle Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-200/80 w-fit">
              <button
                type="button"
                onClick={() => setOfferingTab('products')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  offeringTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🛒 Products ({productsList.length})
              </button>
              <button
                type="button"
                onClick={() => setOfferingTab('services')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  offeringTab === 'services' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔧 Services ({servicesList.length})
              </button>
            </div>
          </div>

          {/* PRODUCTS TAB */}
          {offeringTab === 'products' && (
            productsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {productsList.map((prod: any, idx: number) => {
                  const title = typeof prod === 'string' ? prod : prod.name || prod.title;
                  const price = typeof prod === 'object' ? prod.price : null;
                  const priceRange = typeof prod === 'object' ? prod.priceRange : null;
                  const img = typeof prod === 'object' ? prod.imageUrl : null;
                  const desc = typeof prod === 'object' ? prod.description : `High quality ${title} available from ${company.name}.`;

                  return (
                    <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="h-44 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                        {img ? (
                          <img src={img} alt={title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1" style={{ background: theme.accentBg }}>
                            <Package size={32} style={{ color: theme.accentText }} />
                            <span className="text-[10px] font-bold text-slate-500">Product Image</span>
                          </div>
                        )}
                        <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/90 backdrop-blur-md text-slate-900 shadow-xs">
                          {prod.category || 'Product'}
                        </span>
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-bold text-slate-900">{title}</h3>
                            {(price || priceRange) && (
                              <span className="text-sm font-black text-emerald-700 shrink-0">
                                {price ? `₹${Number(price).toLocaleString('en-IN')}` : priceRange}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{desc}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                          {cleanWa && (
                            <a
                              href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi ${company.name}, I would like to order / enquire about the product "${title}".`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs"
                              style={{ background: '#25D366' }}
                            >
                              <MessageCircle size={13} /> WhatsApp Order
                            </a>
                          )}
                          {cleanPhone && (
                            <a
                              href={`tel:${cleanPhone}`}
                              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1"
                            >
                              <Phone size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
                <Package size={36} className="mx-auto mb-2 text-slate-300" />
                <h3 className="text-base font-bold text-slate-900">Custom Products on Order</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Contact our customer desk to receive the complete product catalog, wholesale pricing, and availability.
                </p>
              </div>
            )
          )}

          {/* SERVICES TAB */}
          {offeringTab === 'services' && (
            servicesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {servicesList.map((srv: any, idx: number) => {
                  const title = typeof srv === 'string' ? srv : srv.title || srv.name;
                  const price = typeof srv === 'object' ? srv.startingPrice || srv.price : null;
                  const img = typeof srv === 'object' ? srv.imageUrl : null;
                  const desc = typeof srv === 'object' ? srv.description || srv.desc : `Comprehensive ${title} service provided by ${company.name}.`;

                  return (
                    <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="h-40 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                        {img ? (
                          <img src={img} alt={title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1" style={{ background: theme.accentBg }}>
                            <Wrench size={32} style={{ color: theme.accentText }} />
                            <span className="text-[10px] font-bold text-slate-500">Service Banner</span>
                          </div>
                        )}
                        <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/90 backdrop-blur-md text-slate-900 shadow-xs">
                          {srv.category || 'Service'}
                        </span>
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-bold text-slate-900">{title}</h3>
                            {price && (
                              <span className="text-xs font-black text-blue-700 shrink-0">
                                Starts ₹{Number(price).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{desc}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                          {cleanWa && (
                            <a
                              href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi ${company.name}, I would like to book / enquire about the service "${title}".`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs"
                              style={{ background: theme.primary }}
                            >
                              <Wrench size={13} /> Book Service
                            </a>
                          )}
                          {cleanPhone && (
                            <a
                              href={`tel:${cleanPhone}`}
                              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1"
                            >
                              <Phone size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
                <Wrench size={36} className="mx-auto mb-2 text-slate-300" />
                <h3 className="text-base font-bold text-slate-900">Customized Services Available</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Contact our customer desk to book specialized services, estimate rates, or request on-site appointments.
                </p>
              </div>
            )
          )}

        </div>
      </section>

      {/* ── 4. LIVE JOBS & HIRING PIPELINE ── */}
      <section id="jobs" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold mb-2">
                <Briefcase size={13} /> Careers at {company.name}
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {theme.jobCtaText}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Apply directly with your THENIJOBS profile and resume for fast-track interview scheduling.
              </p>
            </div>

            <Link
              href="/jobs"
              className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1"
            >
              Browse All Theni Jobs <ArrowRight size={13} />
            </Link>
          </div>

          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-slate-50 rounded-3xl p-6 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all flex flex-col justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                        {job.type || 'Full Time'}
                      </span>
                      <span className="text-[11px] text-slate-400">{job.posted || 'Recent'}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-2">{job.title}</h3>

                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="font-semibold text-emerald-700">{job.salary}</span>
                      <span>•</span>
                      <span>{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <Link
                    href={`/jobs/${job.id}`}
                    className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>View &amp; Apply</span> <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl p-10 text-center border border-slate-200">
              <Briefcase size={36} className="mx-auto mb-2 text-slate-300" />
              <h3 className="text-base font-bold text-slate-900">No Open Vacancies Right Now</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {company.name} is not actively advertising open positions at this moment. You can still send a general inquiry below.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── 5. GALLERY ── */}
      {(company.galleryImages?.length > 0 || company.gallery?.length > 0) && (
        <section id="gallery" className="py-16 sm:py-20 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: theme.primary }}>
                Photo Gallery
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Inside {company.name}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...(company.galleryImages || []), ...(company.gallery || [])].slice(0, 12).map((imgUrl: string, idx: number) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                  <img
                    src={imgUrl}
                    alt={`${company.name} gallery image ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. CUSTOMER REVIEWS ── */}
      {reviews.length > 0 && (
        <section id="reviews" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: theme.primary }}>
                Customer Reviews
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                What People Say About {company.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map((review: any) => (
                <div key={review.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < (review.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                      />
                    ))}
                    <span className="text-[10px] text-slate-400 ml-1">{review.date}</span>
                  </div>
                  {review.title && <h3 className="text-sm font-bold text-slate-900">{review.title}</h3>}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">{review.content}</p>
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                      {(review.name || 'A')[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{review.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 7. FAQS ACCORDION ── */}
      <section id="faqs" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: theme.primary }}>
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Common Questions &amp; Answers
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq: any, idx: number) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 cursor-pointer"
                  >
                    <span>{faq.q || faq.question}</span>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 mt-1 pt-3">
                      {faq.a || faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. LEAD FORM & GOOGLE MAPS DIRECTIONS ── */}
      <section id="contact" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left: Contact Form */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: theme.primary }}>
                  Get In Touch
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Send an Enquiry to {company.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Fill out the form below. Your request is delivered directly to the business owner via WhatsApp/Phone.
                </p>
              </div>

              {formStatus === 'success' ? (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-6 text-center space-y-2">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                  <h3 className="text-base font-bold text-emerald-900">Enquiry Sent Successfully!</h3>
                  <p className="text-xs text-emerald-700">
                    Thank you for reaching out. {company.name} will respond to you promptly.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setFormStatus('idle'); setLeadForm({ name: '', phone: '', message: '', service: '' }); }}
                    className="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-white border border-emerald-200 cursor-pointer"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-3.5 bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Saravanan K"
                      value={leadForm.name}
                      onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number (WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={leadForm.phone}
                      onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Product / Service Interest</label>
                    <input
                      type="text"
                      placeholder="e.g. Order, Consultation, Service Booking, Careers"
                      value={leadForm.service}
                      onChange={e => setLeadForm({ ...leadForm, service: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Message</label>
                    <textarea
                      rows={3}
                      placeholder="Describe your requirements..."
                      value={leadForm.message}
                      onChange={e => setLeadForm({ ...leadForm, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formStatus === 'submitting'}
                    className="w-full py-3.5 rounded-xl font-extrabold text-xs sm:text-sm text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: theme.primary }}
                  >
                    <Send size={15} />
                    <span>{formStatus === 'submitting' ? 'Sending...' : 'Send Direct Enquiry'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Right: Location & Google Maps Card */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Location &amp; Visiting Hours</h3>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-extrabold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Open in Maps <ExternalLink size={12} />
                  </a>
                </div>
                
                <div className="space-y-2 text-xs text-slate-600">
                  <p className="flex items-start gap-2">
                    <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="font-semibold text-slate-900">{company.address || `${company.name}, ${company.district || 'Theni'}, Tamil Nadu`}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400 shrink-0" />
                    <span>{company.businessHours || 'Monday - Saturday: 9:00 AM – 8:00 PM'}</span>
                  </p>
                </div>

                {/* Google Map Embed */}
                <div className="w-full h-56 rounded-2xl overflow-hidden bg-slate-200 border border-slate-300 relative flex items-center justify-center">
                  <iframe
                    title="Google Map Location"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${company.name} ${company.address || ''} ${company.district || 'Theni'} Tamil Nadu`)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full border-0"
                  />
                </div>

                <div className="flex gap-2">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Navigation size={13} /> Get Directions
                  </a>

                  {cleanPhone && (
                    <a
                      href={`tel:${cleanPhone}`}
                      className="px-4 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                      style={{ background: theme.primary }}
                    >
                      <Phone size={13} /> Call
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. FOOTER ── */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-sm">{company.name}</span>
            <span>•</span>
            <span>Verified Official Website</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">
              Powered by <strong className="text-blue-400">THENIJOBS</strong>
            </Link>
            <span>•</span>
            <Link href={`/company/${company.slug}`} className="hover:text-white transition-colors">
              Directory Profile
            </Link>
            <span>•</span>
            <Link href="/marketplace" className="hover:text-white transition-colors">
              Marketplace
            </Link>
          </div>
        </div>
      </footer>

      {/* ── Sticky Mobile Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 flex items-center justify-around gap-2 sm:hidden shadow-lg">
        {cleanPhone && (
          <a
            href={`tel:${cleanPhone}`}
            className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
            style={{ background: theme.primary }}
          >
            <Phone size={14} /> Call
          </a>
        )}

        {cleanWa && (
          <a
            href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi ${company.name}, I am contacting you via your official website on THENIJOBS.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
            style={{ background: '#25D366' }}
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
        )}

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
        >
          <Navigation size={14} /> Directions
        </a>
      </div>
    </div>
  );
}
