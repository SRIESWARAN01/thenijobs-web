'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin, Phone, Mail, Globe, MessageCircle, Share2, Heart, X,
  Star, BadgeCheck, Clock, Users, Eye, TrendingUp, ChevronRight,
  Briefcase, Building2, Calendar, ShoppingBag, Search,
  Image as ImageIcon, Filter, ArrowRight, Quote, Check,
  CheckCircle, Lock, AlertCircle, Award, Sparkles, ChevronDown,
  User, Send, BookOpen
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Preset themes color variables mapping
export const getThemeStyles = (themeName = 'classic-blue', customPrimaryColor?: string, isDarkMode = false) => {
  const presets: Record<string, { primary: string; secondary: string; accent: string; bg: string; card: string; text: string; border: string; darkBg: string; darkCard: string; darkText: string; darkBorder: string }> = {
    'classic-blue': {
      primary: '#2563EB',
      secondary: '#1D4ED8',
      accent: '#3B82F6',
      bg: '#F8FAFC',
      card: '#FFFFFF',
      text: '#111827',
      border: 'rgba(0, 0, 0, 0.08)',
      darkBg: '#0B0F19',
      darkCard: '#161B26',
      darkText: '#F9FAFB',
      darkBorder: 'rgba(255, 255, 255, 0.08)',
    },
    'emerald-growth': {
      primary: '#10B981',
      secondary: '#059669',
      accent: '#34D399',
      bg: '#F0FDF4',
      card: '#FFFFFF',
      text: '#14532D',
      border: 'rgba(0, 0, 0, 0.08)',
      darkBg: '#061F0E',
      darkCard: '#0B3016',
      darkText: '#ECFDF5',
      darkBorder: 'rgba(255, 255, 255, 0.08)',
    },
    'royal-purple': {
      primary: '#7C3AED',
      secondary: '#A855F7',
      accent: '#EC4899',
      bg: '#FAF5FF',
      card: '#FFFFFF',
      text: '#2E1065',
      border: 'rgba(0, 0, 0, 0.08)',
      darkBg: '#0F0A1E',
      darkCard: '#1B1233',
      darkText: '#FAF5FF',
      darkBorder: 'rgba(255, 255, 255, 0.08)',
    },
    'sunset-amber': {
      primary: '#F59E0B',
      secondary: '#D97706',
      accent: '#FDBA74',
      bg: '#FFF7ED',
      card: '#FFFFFF',
      text: '#78350F',
      border: 'rgba(0, 0, 0, 0.08)',
      darkBg: '#1C0F02',
      darkCard: '#2D1905',
      darkText: '#FFFBEB',
      darkBorder: 'rgba(255, 255, 255, 0.08)',
    },
    'royal-gold': {
      primary: '#D4AF37',
      secondary: '#B8860B',
      accent: '#FFD700',
      bg: '#FFFDF5',
      card: '#FFFFFF',
      text: '#45350B',
      border: 'rgba(0, 0, 0, 0.08)',
      darkBg: '#14120D',
      darkCard: '#242017',
      darkText: '#FFFDF5',
      darkBorder: 'rgba(255, 255, 255, 0.08)',
    },
  };

  const theme = presets[themeName] || presets['classic-blue'];
  const primaryColor = customPrimaryColor || theme.primary;

  const resolved = isDarkMode ? {
    bg: theme.darkBg,
    card: theme.darkCard,
    text: theme.darkText,
    border: theme.darkBorder,
  } : {
    bg: theme.bg,
    card: theme.card,
    text: theme.text,
    border: theme.border,
  };

  return {
    '--theme-primary': primaryColor,
    '--theme-secondary': theme.secondary,
    '--theme-accent': theme.accent,
    '--theme-bg': resolved.bg,
    '--theme-card': resolved.card,
    '--theme-text': resolved.text,
    '--theme-border': resolved.border,
  } as React.CSSProperties;
};

export const getCardStyles = (cardStyle: 'flat' | 'elevated' | 'glass', isDarkMode: boolean) => {
  if (cardStyle === 'elevated') {
    return {
      '--theme-card-bg': 'var(--theme-card)',
      '--theme-card-border': '1px solid var(--theme-border)',
      '--theme-card-shadow': isDarkMode 
        ? '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.3)' 
        : '0 10px 30px -10px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)',
      '--theme-card-blur': 'none',
    } as React.CSSProperties;
  } else if (cardStyle === 'glass') {
    return {
      '--theme-card-bg': isDarkMode ? 'rgba(22, 27, 38, 0.45)' : 'rgba(255, 255, 255, 0.45)',
      '--theme-card-border': isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
      '--theme-card-shadow': isDarkMode 
        ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' 
        : '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
      '--theme-card-blur': 'blur(16px)',
    } as React.CSSProperties;
  } else {
    // flat
    return {
      '--theme-card-bg': 'var(--theme-card)',
      '--theme-card-border': '1px solid var(--theme-border)',
      '--theme-card-shadow': 'none',
      '--theme-card-blur': 'none',
    } as React.CSSProperties;
  }
};

export const googleFontsUrls: Record<string, string> = {
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap',
  'Outfit': 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap',
  'Playfair Display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&display=swap',
  'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap',
};

const fontFamilies: Record<string, string> = {
  'Inter': "'Inter', sans-serif",
  'Roboto': "'Roboto', sans-serif",
  'Outfit': "'Outfit', sans-serif",
  'Playfair Display': "'Playfair Display', serif",
  'Poppins': "'Poppins', sans-serif",
};

interface Customization {
  websiteTheme: 'classic-blue' | 'emerald-growth' | 'royal-purple' | 'sunset-amber' | 'royal-gold';
  websiteTemplate: 'classic-directory' | 'modern-portfolio' | 'ecommerce-storefront' | 'service-booking';
  customPrimaryColor?: string;
  fontFamily: 'Inter' | 'Roboto' | 'Outfit' | 'Playfair Display' | 'Poppins';
  buttonStyle: 'rounded' | 'square' | 'pill';
  cardStyle: 'flat' | 'elevated' | 'glass';
  borderRadius: string; // e.g. "0px", "4px", "8px", "12px", "16px", "24px"
  enableDarkMode: boolean;
  enableAnimations: boolean;
  sectionsVisible?: {
    products?: boolean;
    services?: boolean;
    reviews?: boolean;
    gallery?: boolean;
    team?: boolean;
    faq?: boolean;
  };
}

interface CustomTemplateWrapperProps {
  company: any;
  jobs: any[];
  reviews: any[];
  customization: Customization;
  isPreview?: boolean;
}

export function CustomTemplateWrapper({
  company,
  jobs,
  reviews,
  customization,
  isPreview = false
}: CustomTemplateWrapperProps) {
  const themeStyles = useMemo(() => {
    return getThemeStyles(
      customization.websiteTheme,
      customization.customPrimaryColor,
      customization.enableDarkMode
    );
  }, [customization.websiteTheme, customization.customPrimaryColor, customization.enableDarkMode]);

  const cardStyles = useMemo(() => {
    return getCardStyles(customization.cardStyle, customization.enableDarkMode);
  }, [customization.cardStyle, customization.enableDarkMode]);

  const borderRadiusVal = customization.borderRadius || '12px';
  const buttonRadiusVal = customization.buttonStyle === 'square' 
    ? '0px' 
    : customization.buttonStyle === 'pill' 
    ? '9999px' 
    : borderRadiusVal;

  const fontStyle = fontFamilies[customization.fontFamily] || fontFamilies['Inter'];

  return (
    <div
      className={`theme-custom-root w-full min-h-screen text-[var(--theme-text)] bg-[var(--theme-bg)] transition-colors duration-300 overflow-x-hidden ${customization.enableAnimations ? 'animations-enabled' : ''}`}
      style={{
        ...themeStyles,
        ...cardStyles,
        '--theme-border-radius': borderRadiusVal,
        '--theme-btn-radius': buttonRadiusVal,
        '--theme-font-family': fontStyle
      } as React.CSSProperties}
    >
      <link rel="stylesheet" href={googleFontsUrls[customization.fontFamily] || googleFontsUrls['Inter']} />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .theme-custom-root {
          font-family: var(--theme-font-family);
        }
        .theme-btn-primary {
          border-radius: var(--theme-btn-radius);
          background-color: var(--theme-primary);
          color: #ffffff !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .theme-btn-primary:hover {
          background-color: var(--theme-secondary);
          opacity: 0.95;
        }
        .animations-enabled .theme-btn-primary:hover {
          transform: translateY(-1px);
        }
        .theme-btn-secondary {
          border-radius: var(--theme-btn-radius);
          background-color: transparent;
          color: var(--theme-primary);
          border: 1px solid var(--theme-primary);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .theme-btn-secondary:hover {
          background-color: var(--theme-primary);
          color: #ffffff !important;
        }
        .theme-card-custom {
          border-radius: var(--theme-border-radius);
          background: var(--theme-card-bg);
          border: var(--theme-card-border);
          box-shadow: var(--theme-card-shadow);
          backdrop-filter: var(--theme-card-blur);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animations-enabled .theme-card-custom:hover {
          transform: translateY(-2px);
        }
        
        .royal-purple-glow {
          box-shadow: 0 0 25px rgba(124, 58, 237, 0.15);
        }
        .sunset-amber-glow {
          box-shadow: 0 0 25px rgba(245, 158, 11, 0.15);
        }
        .royal-gold-border {
          border-color: #D4AF37 !important;
        }
        
        /* Smooth transitions */
        .smooth-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}} />

      {customization.websiteTemplate === 'modern-portfolio' && (
        <TemplateModernPortfolio company={company} jobs={jobs} reviews={reviews} customization={customization} isPreview={isPreview} />
      )}
      {customization.websiteTemplate === 'ecommerce-storefront' && (
        <TemplateEcommerceStorefront company={company} jobs={jobs} reviews={reviews} customization={customization} isPreview={isPreview} />
      )}
      {customization.websiteTemplate === 'service-booking' && (
        <TemplateServiceBookingPortal company={company} jobs={jobs} reviews={reviews} customization={customization} isPreview={isPreview} />
      )}
      {(customization.websiteTemplate === 'classic-directory' || !customization.websiteTemplate) && (
        <TemplateClassicDirectory company={company} jobs={jobs} reviews={reviews} customization={customization} isPreview={isPreview} />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// SHARED COMMON SUBCOMPONENTS & LOGIC
// ──────────────────────────────────────────────────────────────────

function getCleanCallUrl(num: string | null | undefined): string {
  const clean = String(num || '').replace(/[^\d+]/g, '');
  return `tel:${clean}`;
}

function getCleanWhatsAppUrl(num: string | null | undefined, text: string): string {
  const clean = String(num || '').replace(/\D/g, '');
  const formatted = clean.length === 10 ? `91${clean}` : clean;
  return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
}

// Format custom whatsapp inquiry texts
function formatWhatsAppMessage(company: any, productOrService: any, type: 'product' | 'service' | 'booking') {
  const name = company.name || 'Business';
  if (type === 'booking') {
    return `Hello ${name}, I would like to book an appointment for: ${productOrService.serviceName} on ${productOrService.date} at ${productOrService.timeSlot}. Customer name: ${productOrService.customerName}. Please confirm.`;
  }
  return `Hello ${name}, I am interested in your ${type}: "${productOrService.name}". Can you please provide more details?`;
}

// ── Template 1: Classic Directory ──
function TemplateClassicDirectory({ company, jobs, reviews, customization, isPreview }: { company: any; jobs: any[]; reviews: any[]; customization: Customization; isPreview: boolean }) {
  const [activeTab, setActiveTab] = useState('about');
  
  const hasProducts = customization.sectionsVisible?.products !== false && company.products && company.products.length > 0;
  const hasServices = customization.sectionsVisible?.services !== false && company.services && company.services.length > 0;
  const hasGallery = customization.sectionsVisible?.gallery !== false && company.galleryImages && company.galleryImages.length > 0;
  const hasReviews = customization.sectionsVisible?.reviews !== false;

  const tabs = [
    { id: 'about', label: 'About' },
    ...(hasProducts ? [{ id: 'products', label: `Products (${company.products.length})` }] : []),
    ...(hasServices ? [{ id: 'services', label: `Services (${company.services.length})` }] : []),
    ...(hasGallery ? [{ id: 'gallery', label: 'Gallery' }] : []),
    ...(hasReviews ? [{ id: 'reviews', label: `Reviews (${reviews.length})` }] : []),
    { id: 'contact', label: 'Contact' }
  ];

  return (
    <div className="w-full">
      {/* Cover Banner */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900 flex items-center justify-center border-b border-[var(--theme-border)]">
        {company.coverImageUrl ? (
          <img src={company.coverImageUrl} alt={company.name} className="w-full h-full object-cover opacity-75" />
        ) : (
          <div className="text-white/20 text-sm font-medium">No cover image uploaded</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20 -mt-16 sm:-mt-24 relative z-10">
        {/* Brand Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div className="flex items-end gap-4">
            <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-2xl border-4 border-[var(--theme-card)] bg-[var(--theme-card)] shadow-lg overflow-hidden shrink-0 flex items-center justify-center">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 size={48} className="text-[var(--theme-primary)]" />
              )}
            </div>
            <div className="mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--theme-text)] flex items-center gap-1.5 leading-tight">
                {company.name}
                {company.verificationStatus === 'verified' && (
                  <BadgeCheck size={24} className="text-blue-500 fill-blue-500/10 shrink-0" />
                )}
              </h1>
              <p className="text-xs text-[var(--theme-text)]/60 font-semibold mt-1">
                {company.category} • {company.district}, {company.state}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:mb-2 w-full md:w-auto">
            <a href={getCleanCallUrl(company.phone)} className="flex-1 md:flex-none py-2 px-4 text-xs font-bold text-center theme-btn-primary flex items-center justify-center gap-1.5 shadow-sm animate-fade-in">
              <Phone size={14} /> Call Us
            </a>
            <a href={getCleanWhatsAppUrl(company.whatsapp || company.phone, `Hello ${company.name}, I found your website on THENIJOBS!`)} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none py-2 px-4 text-xs font-bold text-center text-white bg-[#25D366] hover:bg-[#128C7E] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm" style={{ borderRadius: 'var(--theme-btn-radius)' }}>
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>
        </div>

        {/* Sticky tabs row */}
        <div className="sticky top-0 z-20 bg-[var(--theme-bg)]/80 backdrop-blur-md border-b border-[var(--theme-border)] py-3 mb-6 flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 px-4 text-xs font-bold whitespace-nowrap transition-all rounded-lg ${
                activeTab === tab.id
                  ? 'bg-[var(--theme-primary)] text-white shadow-sm'
                  : 'text-[var(--theme-text)]/60 hover:text-[var(--theme-text)] hover:bg-[var(--theme-card)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic content rendering */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'about' && (
              <div className="theme-card-custom p-6 space-y-4">
                <h3 className="text-lg font-bold text-[var(--theme-text)]">About Company</h3>
                <p className="text-sm text-[var(--theme-text)]/80 leading-relaxed whitespace-pre-wrap">
                  {company.description || 'No description provided by the company.'}
                </p>
                {company.tagline && (
                  <div className="p-4 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] italic text-sm text-[var(--theme-text)]/70">
                    "{company.tagline}"
                  </div>
                )}
              </div>
            )}

            {activeTab === 'products' && hasProducts && (
              <ProductsGrid company={company} isPreview={isPreview} />
            )}

            {activeTab === 'services' && hasServices && (
              <ServicesGrid company={company} isPreview={isPreview} />
            )}

            {activeTab === 'gallery' && hasGallery && (
              <GalleryView company={company} />
            )}

            {activeTab === 'reviews' && hasReviews && (
              <ReviewsSection company={company} reviews={reviews} isPreview={isPreview} />
            )}

            {activeTab === 'contact' && (
              <ContactSection company={company} isPreview={isPreview} />
            )}
          </div>

          {/* Sidebar / Business details */}
          <div className="space-y-6">
            <div className="theme-card-custom p-6 space-y-4">
              <h3 className="text-sm font-bold text-[var(--theme-text)] uppercase tracking-wider border-b border-[var(--theme-border)] pb-2">Business Information</h3>
              <div className="space-y-3 text-xs">
                {company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-[var(--theme-primary)] shrink-0" />
                    <div>
                      <p className="font-semibold text-[var(--theme-text)]/60">Phone</p>
                      <a href={`tel:${company.phone}`} className="text-[var(--theme-text)] font-medium hover:underline">{company.phone}</a>
                    </div>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-[var(--theme-primary)] shrink-0" />
                    <div>
                      <p className="font-semibold text-[var(--theme-text)]/60">Email</p>
                      <a href={`mailto:${company.email}`} className="text-[var(--theme-text)] font-medium hover:underline">{company.email}</a>
                    </div>
                  </div>
                )}
                {company.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[var(--theme-primary)] shrink-0" />
                    <div>
                      <p className="font-semibold text-[var(--theme-text)]/60">Address</p>
                      <span className="text-[var(--theme-text)] font-medium">{company.address}</span>
                    </div>
                  </div>
                )}
                {company.workingHours && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[var(--theme-primary)] shrink-0" />
                    <div>
                      <p className="font-semibold text-[var(--theme-text)]/60">Business Hours</p>
                      <span className="text-[var(--theme-text)] font-medium">{company.workingHours}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Google maps location block */}
            {company.mapEmbedUrl && (
              <div className="theme-card-custom overflow-hidden h-60 relative">
                <iframe
                  src={company.mapEmbedUrl}
                  className="w-full h-full border-none"
                  allowFullScreen
                  loading="lazy"
                  title="Google Maps Location"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-[var(--theme-text)]/50 border-t border-[var(--theme-border)] mt-20">
        <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
        <p className="mt-1 text-[10px]">Powered by THENIJOBS Custom Site Builder</p>
      </footer>
    </div>
  );
}

// ── Template 2: Modern Portfolio ──
function TemplateModernPortfolio({ company, jobs, reviews, customization, isPreview }: { company: any; jobs: any[]; reviews: any[]; customization: Customization; isPreview: boolean }) {
  const hasServices = customization.sectionsVisible?.services !== false && company.services && company.services.length > 0;
  const hasGallery = customization.sectionsVisible?.gallery !== false && company.galleryImages && company.galleryImages.length > 0;
  const hasReviews = customization.sectionsVisible?.reviews !== false;
  const hasFaq = customization.sectionsVisible?.faq !== false;

  // Custom glassmorphism variables
  const glassStyle = {
    background: customization.enableDarkMode ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.45)',
    backdropFilter: 'blur(16px)',
    border: customization.enableDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)'
  };

  return (
    <div className="w-full relative">
      {/* Dynamic Animated/Gradient Background blobs if enabled */}
      {customization.enableAnimations && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--theme-primary)]/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[var(--theme-accent)]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Hero Header Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-4 py-20 border-b border-[var(--theme-border)] bg-gradient-to-b from-[var(--theme-primary)]/5 to-transparent overflow-hidden">
        <div className="max-w-4xl text-center space-y-6 relative z-10 animate-fade-up">
          {company.logoUrl && (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-[var(--theme-border)] shadow-xl overflow-hidden mx-auto bg-[var(--theme-card)] flex items-center justify-center">
              <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
            </div>
          )}
          <span className="inline-block px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-primary)] bg-[var(--theme-primary)]/10 rounded-full">
            {company.category}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[var(--theme-text)]">
            {company.name}
          </h1>
          <p className="text-base sm:text-lg text-[var(--theme-text)]/70 max-w-2xl mx-auto font-medium">
            {company.tagline || 'Leading innovation & delivering premium digital solutions directly from ' + company.district}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <a href="#services" className="py-2.5 px-6 text-xs font-bold theme-btn-primary shadow-lg shadow-[var(--theme-primary)]/20 flex items-center gap-1">
              Explore Services <ArrowRight size={13} />
            </a>
            <a href="#contact" className="py-2.5 px-6 text-xs font-bold theme-btn-secondary">
              Let's Talk
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-24 relative z-10">
        
        {/* Intro / About Section */}
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--theme-text)] leading-tight">
              We design & build the future of our industry
            </h2>
            <div className="w-12 h-1 bg-[var(--theme-primary)] rounded-full" />
            <p className="text-sm text-[var(--theme-text)]/80 leading-relaxed">
              {company.description || 'No description provided yet. We are committed to rendering top-notch solutions.'}
            </p>
          </div>
          <div className="theme-card-custom p-6 text-center space-y-4" style={glassStyle}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text)]/60">Business Integrity Score</h4>
            <div className="text-5xl font-black text-[var(--theme-primary)]">
              {company.trustScore || '95'}%
            </div>
            <p className="text-xs text-[var(--theme-text)]/60">
              Verified active listings, verified address, and client satisfaction guarantee.
            </p>
          </div>
        </section>

        {/* Counter/Stats Showcase */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="theme-card-custom p-5 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-[var(--theme-primary)]">{company.viewCount || '1.2K'}+</span>
            <p className="text-[10px] uppercase font-bold text-[var(--theme-text)]/50">Profile Views</p>
          </div>
          <div className="theme-card-custom p-5 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-[var(--theme-primary)]">{jobs.length}</span>
            <p className="text-[10px] uppercase font-bold text-[var(--theme-text)]/50">Active Jobs</p>
          </div>
          <div className="theme-card-custom p-5 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-[var(--theme-primary)]">{company.products?.length || 0}</span>
            <p className="text-[10px] uppercase font-bold text-[var(--theme-text)]/50">Catalog Products</p>
          </div>
          <div className="theme-card-custom p-5 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-[var(--theme-primary)]">{reviews.length}+</span>
            <p className="text-[10px] uppercase font-bold text-[var(--theme-text)]/50">Client Reviews</p>
          </div>
        </section>

        {/* Featured Services Grid */}
        {hasServices && (
          <section id="services" className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--theme-text)]">Our Services</h2>
              <p className="text-xs text-[var(--theme-text)]/60">What we bring to our clients and customers</p>
            </div>
            <ServicesGrid company={company} isPreview={isPreview} />
          </section>
        )}

        {/* Portfolio Gallery */}
        {hasGallery && (
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--theme-text)]">Creative Gallery</h2>
              <p className="text-xs text-[var(--theme-text)]/60">A glimpse into our works and workspaces</p>
            </div>
            <GalleryView company={company} />
          </section>
        )}

        {/* Testimonials (Reviews) */}
        {hasReviews && (
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--theme-text)]">Client Testimonials</h2>
              <p className="text-xs text-[var(--theme-text)]/60">Hear directly from clients who work with us</p>
            </div>
            <ReviewsSection company={company} reviews={reviews} isPreview={isPreview} />
          </section>
        )}

        {/* FAQs */}
        {hasFaq && (
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--theme-text)]">FAQs</h2>
              <p className="text-xs text-[var(--theme-text)]/60">Frequently Asked Questions about our business</p>
            </div>
            <FaqAccordion company={company} />
          </section>
        )}

        {/* Contact Form Section */}
        <section id="contact" className="space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--theme-text)]">Work with Us</h2>
            <p className="text-xs text-[var(--theme-text)]/60">Submit your requirements and get a quote instantly</p>
          </div>
          <ContactSection company={company} isPreview={isPreview} />
        </section>
      </div>

      {/* Footer */}
      <footer className="w-full py-10 text-center text-xs text-[var(--theme-text)]/50 border-t border-[var(--theme-border)] mt-24 bg-gradient-to-t from-[var(--theme-primary)]/5 to-transparent">
        <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
        <p className="mt-1 text-[10px]">Powered by THENIJOBS Custom Site Builder</p>
      </footer>
    </div>
  );
}

// ── Template 3: E-Commerce Storefront ──
function TemplateEcommerceStorefront({ company, jobs, reviews, customization, isPreview }: { company: any; jobs: any[]; reviews: any[]; customization: Customization; isPreview: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);

  const products = company.products || [];
  
  // Extract categories dynamically
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p: any) => {
      if (p.category) cats.add(p.category);
    });
    return ['All', ...Array.from(cats)];
  }, [products]);

  // Filter products based on search term & category
  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleOrderWhatsApp = (product: any) => {
    const text = formatWhatsAppMessage(company, product, 'product');
    window.open(getCleanWhatsAppUrl(company.whatsapp || company.phone, text), '_blank');
  };

  return (
    <div className="w-full">
      {/* Hero Banner with Product Search */}
      <section className="relative py-24 px-4 bg-gradient-to-r from-[var(--theme-primary)]/10 via-[var(--theme-primary)]/5 to-transparent border-b border-[var(--theme-border)] flex items-center justify-center">
        <div className="max-w-3xl text-center space-y-6">
          <span className="inline-block px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-[var(--theme-primary)] bg-[var(--theme-primary)]/10 rounded-full">
            E-Commerce Storefront
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--theme-text)]">
            Explore our Product Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-[var(--theme-text)]/60 max-w-lg mx-auto">
            Order directly via WhatsApp for fast support, secure billing, and local delivery.
          </p>

          {/* Search Box */}
          <div className="max-w-md mx-auto relative bg-[var(--theme-card)] rounded-xl border border-[var(--theme-border)] overflow-hidden shadow-sm flex items-center">
            <Search className="absolute left-4 text-[var(--theme-text)]/40 shrink-0" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pl-11 pr-4 bg-transparent text-sm text-[var(--theme-text)] outline-none border-none placeholder:text-[var(--theme-text)]/30"
            />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-4 gap-8">
        
        {/* Left Column: Categories sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="theme-card-custom p-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--theme-text)] uppercase tracking-wider flex items-center gap-1.5 border-b border-[var(--theme-border)] pb-2">
              <Filter size={14} /> Categories
            </h3>
            <div className="flex flex-col gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full py-2 px-3 text-left text-xs font-bold rounded-lg transition-all ${
                    selectedCategory === cat
                      ? 'bg-[var(--theme-primary)] text-white shadow-sm'
                      : 'text-[var(--theme-text)]/60 hover:text-[var(--theme-text)] hover:bg-[var(--theme-bg)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp Support Box */}
          <div className="theme-card-custom p-5 space-y-3 bg-gradient-to-br from-[#25D366]/10 to-transparent border-[#25D366]/20">
            <h4 className="text-xs font-extrabold text-[#25D366] flex items-center gap-1 uppercase tracking-wider">
              <MessageCircle size={14} /> WhatsApp Assistance
            </h4>
            <p className="text-[10px] text-[var(--theme-text)]/70">
              Need help? Feel free to contact our customer helpline directly.
            </p>
            <a
              href={getCleanWhatsAppUrl(company.whatsapp || company.phone, `Hello ${company.name}, I need help placing an order.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 text-xs font-extrabold text-center text-white bg-[#25D366] hover:bg-[#128C7E] rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
              style={{ borderRadius: 'var(--theme-btn-radius)' }}
            >
              <MessageCircle size={12} /> Contact Us
            </a>
          </div>
        </div>

        {/* Right Column: Products showcase */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--theme-border)] pb-3">
            <h2 className="text-lg font-bold text-[var(--theme-text)]">
              Products ({filteredProducts.length})
            </h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 space-y-4 theme-card-custom p-10">
              <ShoppingBag size={48} className="mx-auto text-[var(--theme-text)]/30" />
              <h3 className="text-sm font-bold">No products found</h3>
              <p className="text-xs text-[var(--theme-text)]/60">Try modifying your category selection or search keywords.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((product: any) => {
                const discount = product.originalPrice && product.price 
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0;

                return (
                  <div key={product.id} className="theme-card-custom overflow-hidden flex flex-col justify-between group">
                    <div className="relative aspect-square w-full bg-slate-900 overflow-hidden flex items-center justify-center border-b border-[var(--theme-border)]">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <ShoppingBag size={32} className="text-white/20" />
                      )}
                      
                      {/* Price badges */}
                      {discount > 0 && (
                        <span className="absolute top-2 left-2 bg-rose-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded uppercase">
                          {discount}% OFF
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[8px] text-[var(--theme-text)]/50 uppercase tracking-widest font-extrabold block">
                          {product.category || 'Catalogue'}
                        </span>
                        <h4 className="text-xs font-bold text-[var(--theme-text)] truncate">{product.name}</h4>
                        <p className="text-[10px] text-[var(--theme-text)]/60 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-black text-[var(--theme-primary)]">
                            ₹{product.price || '0'}
                          </span>
                          {product.originalPrice && (
                            <span className="text-[10px] line-through text-[var(--theme-text)]/40">
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => setQuickViewProduct(product)}
                            className="w-full py-1.5 text-[9px] font-bold uppercase tracking-wider theme-btn-secondary"
                          >
                            Quick View
                          </button>
                          <button
                            onClick={() => handleOrderWhatsApp(product)}
                            className="w-full py-1.5 text-[9px] font-bold uppercase tracking-wider text-white bg-[#25D366] hover:bg-[#128C7E] flex items-center justify-center gap-1"
                            style={{ borderRadius: 'var(--theme-btn-radius)', transition: 'all 0.2s' }}
                          >
                            <MessageCircle size={10} /> Order on WA
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
      </div>

      {/* Quick View Modal Overlay */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="theme-card-custom max-w-lg w-full overflow-hidden shadow-2xl relative animate-fade-up">
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white z-10"
            >
              <X size={14} />
            </button>

            <div className="grid sm:grid-cols-2">
              <div className="relative aspect-square sm:aspect-auto sm:h-full bg-slate-950 flex items-center justify-center">
                {quickViewProduct.imageUrl ? (
                  <img src={quickViewProduct.imageUrl} alt={quickViewProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag size={48} className="text-white/20" />
                )}
              </div>
              <div className="p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[8px] text-[var(--theme-primary)] font-extrabold uppercase tracking-widest block">
                    {quickViewProduct.category || 'Catalogue'}
                  </span>
                  <h3 className="text-sm font-extrabold text-[var(--theme-text)]">{quickViewProduct.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-black text-[var(--theme-primary)]">
                      ₹{quickViewProduct.price || '0'}
                    </span>
                    {quickViewProduct.originalPrice && (
                      <span className="text-xs line-through text-[var(--theme-text)]/40 font-semibold">
                        ₹{quickViewProduct.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--theme-text)]/80 leading-relaxed overflow-y-auto max-h-36 no-scrollbar">
                    {quickViewProduct.description}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-[var(--theme-border)]">
                  <button
                    onClick={() => {
                      handleOrderWhatsApp(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="w-full py-2.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#128C7E] rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                    style={{ borderRadius: 'var(--theme-btn-radius)' }}
                  >
                    <MessageCircle size={14} /> Place Order via WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Template 4: Service Booking Portal ──
function TemplateServiceBookingPortal({ company, jobs, reviews, customization, isPreview }: { company: any; jobs: any[]; reviews: any[]; customization: Customization; isPreview: boolean }) {
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const services = company.services || [];

  // Default timeslots
  const timeslots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  useEffect(() => {
    if (services.length > 0) {
      setSelectedService(services[0]);
    }
  }, [services]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !bookingDate || !bookingTime || !customerName || !customerPhone) {
      alert('Please fill out all booking details.');
      return;
    }

    setSubmitting(true);
    try {
      const bookingData = {
        serviceId: selectedService.id || 'custom',
        serviceName: selectedService.name || selectedService,
        date: bookingDate,
        timeSlot: bookingTime,
        customerName,
        customerPhone,
        serviceProviderId: company.id,
        companyId: company.id,
        status: 'pending',
        createdAt: new Date(),
      };

      if (!isPreview) {
        // Save to Firestore bookings collection
        await addDoc(collection(db, 'bookings'), bookingData);
      }

      setBookingSuccess(true);
    } catch (err) {
      console.error('Error saving booking:', err);
      alert('Failed to save booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const triggerWhatsAppBookingMessage = () => {
    if (!selectedService) return;
    const bookingDetails = {
      serviceName: selectedService.name || selectedService,
      date: bookingDate,
      timeSlot: bookingTime,
      customerName,
    };
    const text = formatWhatsAppMessage(company, bookingDetails, 'booking');
    window.open(getCleanWhatsAppUrl(company.whatsapp || company.phone, text), '_blank');
  };

  return (
    <div className="w-full">
      {/* Hero Header */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-[var(--theme-primary)]/10 to-transparent border-b border-[var(--theme-border)] text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="inline-block px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-[var(--theme-primary)] bg-[var(--theme-primary)]/10 rounded-full">
            Service Booking Portal
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--theme-text)] leading-tight">
            Schedule an Appointment
          </h1>
          <p className="text-xs sm:text-sm text-[var(--theme-text)]/70 max-w-md mx-auto">
            Book slots instantly online. We will notify you with the confirmation details.
          </p>
          <a href="#book-form" className="inline-block py-2.5 px-6 text-xs font-bold theme-btn-primary shadow-lg shadow-[var(--theme-primary)]/20 animate-fade-in">
            Book Appointment Now
          </a>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-5 gap-8">
        
        {/* Left Columns: Booking Form */}
        <div id="book-form" className="lg:col-span-3 space-y-6">
          <div className="theme-card-custom p-6 space-y-6">
            <h2 className="text-lg font-bold text-[var(--theme-text)] border-b border-[var(--theme-border)] pb-2 flex items-center gap-1.5">
              <Calendar size={18} className="text-[var(--theme-primary)]" /> Appointment Scheduler
            </h2>

            {bookingSuccess ? (
              <div className="text-center py-10 space-y-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-base font-extrabold text-[var(--theme-text)]">Appointment Request Received!</h3>
                <p className="text-xs text-[var(--theme-text)]/70 max-w-sm mx-auto">
                  Your appointment for <span className="font-bold text-[var(--theme-primary)]">{selectedService?.name || selectedService}</span> has been noted on {bookingDate} at {bookingTime}.
                </p>
                <div className="flex flex-col gap-2 pt-4 max-w-xs mx-auto">
                  <button
                    onClick={triggerWhatsAppBookingMessage}
                    className="w-full py-2.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#128C7E] flex items-center justify-center gap-1.5"
                    style={{ borderRadius: 'var(--theme-btn-radius)', transition: 'all 0.2s' }}
                  >
                    <MessageCircle size={14} /> Send WhatsApp Confirmation
                  </button>
                  <button
                    onClick={() => {
                      setBookingSuccess(false);
                      setBookingDate('');
                      setBookingTime('');
                      setCustomerName('');
                      setCustomerPhone('');
                    }}
                    className="w-full py-2.5 text-xs font-bold theme-btn-secondary"
                  >
                    Book Another Slot
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {/* Step 1: Select Service */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--theme-text)]/70">Select Service</label>
                  <select
                    className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] focus:border-[var(--theme-primary)] outline-none"
                    value={selectedService ? JSON.stringify(selectedService) : ''}
                    onChange={(e) => setSelectedService(e.target.value ? JSON.parse(e.target.value) : null)}
                  >
                    {services.map((srv: any, idx: number) => (
                      <option key={idx} value={JSON.stringify(srv)}>
                        {srv.name || srv} {srv.price ? `(Starting at ₹${srv.price})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Select Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--theme-text)]/70">Preferred Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] focus:border-[var(--theme-primary)] outline-none"
                  />
                </div>

                {/* Step 3: Choose Time Slot */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--theme-text)]/70">Select Available Time</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {timeslots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setBookingTime(slot)}
                        className={`py-2 px-3 text-xs font-bold text-center border rounded-xl transition-all ${
                          bookingTime === slot
                            ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)] text-white shadow-sm'
                            : 'bg-transparent border-[var(--theme-border)] text-[var(--theme-text)]/70 hover:bg-[var(--theme-bg)]'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 4: Contact Details */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--theme-text)]/70">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] focus:border-[var(--theme-primary)] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--theme-text)]/70">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] focus:border-[var(--theme-primary)] outline-none"
                    />
                  </div>
                </div>

                {/* Submit Booking */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 text-xs font-bold uppercase tracking-wider theme-btn-primary shadow-lg shadow-[var(--theme-primary)]/20 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Requesting booking...' : 'Book Appointment Slot'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Columns: Working Schedule & Contact details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Services Offered Card */}
          <div className="theme-card-custom p-6 space-y-4">
            <h3 className="text-sm font-bold text-[var(--theme-text)] uppercase tracking-wider border-b border-[var(--theme-border)] pb-2 flex items-center gap-1.5">
              <BookOpen size={14} className="text-[var(--theme-primary)]" /> Service Rates
            </h3>
            <div className="divide-y divide-[var(--theme-border)]">
              {services.map((srv: any, idx: number) => (
                <div key={idx} className="py-2.5 flex justify-between gap-4 text-xs">
                  <span className="font-semibold text-[var(--theme-text)]/80">{srv.name || srv}</span>
                  <span className="font-bold text-[var(--theme-primary)] text-right shrink-0">
                    {srv.price ? `₹${srv.price}` : 'Quote on request'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Hour */}
          <div className="theme-card-custom p-6 space-y-4">
            <h3 className="text-sm font-bold text-[var(--theme-text)] uppercase tracking-wider border-b border-[var(--theme-border)] pb-2 flex items-center gap-1.5">
              <Clock size={14} className="text-[var(--theme-primary)]" /> Working Hours
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--theme-text)]/60">Monday - Friday</span>
                <span className="font-bold text-[var(--theme-text)]">{company.workingHours || '09:00 AM - 06:00 PM'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--theme-text)]/60">Saturday</span>
                <span className="font-bold text-[var(--theme-text)]">09:00 AM - 01:00 PM</span>
              </div>
              <div className="flex justify-between text-rose-500 font-semibold">
                <span>Sunday</span>
                <span>Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews, Location map & Footer */}
      <div className="max-w-6xl mx-auto px-4 pb-20 space-y-16">
        <ReviewsSection company={company} reviews={reviews} isPreview={isPreview} />
        <ContactSection company={company} isPreview={isPreview} />
      </div>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs text-[var(--theme-text)]/50 border-t border-[var(--theme-border)] mt-24">
        <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
        <p className="mt-1 text-[10px]">Powered by THENIJOBS Custom Site Builder</p>
      </footer>
    </div>
  );
}

// ── Products Grid ──
function ProductsGrid({ company, isPreview }: { company: any; isPreview: boolean }) {
  const products = company.products || [];
  return (
    <div className="theme-card-custom p-6 space-y-6 animate-fade-up">
      <h3 className="text-base font-bold text-[var(--theme-text)] border-b border-[var(--theme-border)] pb-2">Products Catalogue</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {products.map((product: any) => (
          <div key={product.id} className="p-4 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] flex gap-4">
            <div className="h-16 w-16 bg-slate-900 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag size={20} className="text-white/20" />
              )}
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-[var(--theme-text)] truncate">{product.name}</h4>
                <p className="text-[10px] text-[var(--theme-text)]/60 line-clamp-2 mt-0.5">{product.description}</p>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs font-black text-[var(--theme-primary)]">₹{product.price || '0'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Services Grid ──
function ServicesGrid({ company, isPreview }: { company: any; isPreview: boolean }) {
  const services = company.services || [];
  return (
    <div className="theme-card-custom p-6 space-y-6 animate-fade-up">
      <h3 className="text-base font-bold text-[var(--theme-text)] border-b border-[var(--theme-border)] pb-2">Services & Expertise</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {services.map((service: any) => (
          <div key={service.id} className="p-4 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] flex gap-4">
            <div className="h-16 w-16 bg-slate-900 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
              {service.imageUrl ? (
                <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
              ) : (
                <Briefcase size={20} className="text-white/20" />
              )}
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-[var(--theme-text)] truncate">{service.name}</h4>
                <p className="text-[10px] text-[var(--theme-text)]/60 line-clamp-2 mt-0.5">{service.description}</p>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs font-black text-[var(--theme-primary)]">
                  {service.price ? `Starting at ₹${service.price}` : 'Price on request'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Gallery View ──
function GalleryView({ company }: { company: any }) {
  const gallery = company.galleryImages || [];
  return (
    <div className="theme-card-custom p-6 space-y-6 animate-fade-up">
      <h3 className="text-base font-bold text-[var(--theme-text)] border-b border-[var(--theme-border)] pb-2">Photo & Video Gallery</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {gallery.map((url: string, idx: number) => (
          <div key={idx} className="aspect-video sm:aspect-square bg-slate-900 rounded-xl overflow-hidden border border-[var(--theme-border)]">
            <img src={url} alt="Gallery" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FAQ Accordion ──
function FaqAccordion({ company }: { company: any }) {
  const faqs = company.faqs || [
    { q: 'What is your service coverage area?', a: 'We serve all of Theni district and surrounding areas in Tamil Nadu.' },
    { q: 'How can I place an order?', a: 'You can explore our products catalogue or services booking system, and click "Order on WhatsApp" to coordinate instantly.' },
    { q: 'What are your operational hours?', a: 'We are open Monday through Friday from 9 AM to 6 PM, and Saturday from 9 AM to 1 PM.' }
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="theme-card-custom p-6 space-y-4 animate-fade-up">
      <h3 className="text-base font-bold text-[var(--theme-text)] border-b border-[var(--theme-border)] pb-2">FAQs</h3>
      <div className="divide-y divide-[var(--theme-border)]">
        {faqs.map((faq: any, idx: number) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="py-3.5 space-y-2">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between text-left text-xs font-bold text-[var(--theme-text)]"
              >
                <span>{faq.q || faq.question}</span>
                <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <p className="text-xs text-[var(--theme-text)]/75 leading-relaxed pl-1 pr-6 pt-1 animate-fade-up">
                  {faq.a || faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Reviews Section ──
function ReviewsSection({ company, reviews, isPreview }: { company: any; reviews: any[]; isPreview: boolean }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !comment) return;

    try {
      if (!isPreview) {
        await addDoc(collection(db, 'reviews'), {
          companyId: company.id,
          userName,
          rating,
          comment,
          status: 'pending',
          createdAt: new Date(),
        });
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting review:', err);
    }
  };

  return (
    <div className="theme-card-custom p-6 space-y-6 animate-fade-up">
      <h3 className="text-base font-bold text-[var(--theme-text)] border-b border-[var(--theme-border)] pb-2">Client Reviews & Ratings</h3>
      
      {/* Review Submission Form */}
      {submitted ? (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center">
          Review submitted! It will appear publicly after approval.
        </div>
      ) : (
        <form onSubmit={handleSubmitReview} className="p-4 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] space-y-3">
          <h4 className="text-xs font-bold text-[var(--theme-text)]">Write a Review</h4>
          
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Your Name</label>
              <input
                type="text"
                required
                placeholder="Enter name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full p-2.5 text-xs bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg text-[var(--theme-text)] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Rating</label>
              <div className="flex items-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-amber-400 focus:outline-none"
                  >
                    <Star size={18} className={star <= rating ? 'fill-amber-400' : 'text-slate-400'} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Review Comments</label>
            <textarea
              rows={3}
              required
              placeholder="What was your experience?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2.5 text-xs bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg text-[var(--theme-text)] outline-none resize-none"
            />
          </div>

          <button type="submit" className="py-2 px-4 text-xs font-bold theme-btn-primary">
            Submit Review
          </button>
        </form>
      )}

      {/* Review List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-xs text-[var(--theme-text)]/50 italic text-center py-4">No approved reviews yet. Be the first to write one!</p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="p-4 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[var(--theme-text)]">{rev.name || rev.userName}</span>
                <span className="text-[10px] text-[var(--theme-text)]/50">{rev.date}</span>
              </div>
              <div className="flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={11} className={i < (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-500'} />
                ))}
              </div>
              <p className="text-xs text-[var(--theme-text)]/85 leading-relaxed">{rev.content || rev.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Contact Section ──
function ContactSection({ company, isPreview }: { company: any; isPreview: boolean }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) return;

    try {
      if (!isPreview) {
        await addDoc(collection(db, 'enquiries'), {
          name,
          phone,
          companyId: company.id,
          message,
          createdAt: new Date(),
        });
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting enquiry:', err);
    }
  };

  return (
    <div className="theme-card-custom p-6 space-y-6 animate-fade-up">
      <h3 className="text-base font-bold text-[var(--theme-text)] border-b border-[var(--theme-border)] pb-2">Get in Touch / Quick Enquiry</h3>
      {submitted ? (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center">
          Enquiry submitted successfully! We will get back to you shortly.
        </div>
      ) : (
        <form onSubmit={handleSubmitEnquiry} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Your Name</label>
              <input
                type="text"
                required
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Phone Number</label>
              <input
                type="tel"
                required
                placeholder="10-digit phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Enquiry details / Message</label>
            <textarea
              rows={3}
              required
              placeholder="What are you looking for?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2.5 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none resize-none"
            />
          </div>
          <button type="submit" className="py-2.5 px-6 text-xs font-bold theme-btn-primary w-full shadow-md">
            Send Quick Enquiry
          </button>
        </form>
      )}
    </div>
  );
}
