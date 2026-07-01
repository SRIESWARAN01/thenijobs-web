'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin, Phone, Mail, Globe, MessageCircle, Share2, Heart, X,
  Star, BadgeCheck, Clock, Users, Eye, TrendingUp, ChevronRight,
  Briefcase, Building2, Calendar, ShoppingBag, Search,
  Image as ImageIcon, Filter, ArrowRight, Quote, Check,
  CheckCircle, Lock, AlertCircle, Award, Sparkles, ChevronDown,
  User, Send, BookOpen, HeartHandshake, Home, ArrowUpRight, ArrowUp
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function getCleanCallUrl(num: string | undefined | null): string {
  const clean = String(num || '').replace(/[^\d+]/g, '');
  return `tel:${clean}`;
}

function getCleanWhatsAppUrl(num: string | undefined | null, text: string): string {
  const clean = String(num || '').replace(/\D/g, '');
  const formatted = clean.length === 10 ? `91${clean}` : clean;
  return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
}

function formatWhatsAppMessage(company: any, item: any, type: 'product' | 'service' | 'booking'): string {
  const visitor = 'Customer';
  if (type === 'booking') {
    return [
      `*APPOINTMENT BOOKING REQUEST*`,
      `--------------------------------`,
      `*Company:* ${company.name}`,
      `*Customer Name:* ${item.customerName || visitor}`,
      `*Service:* ${item.serviceName}`,
      `*Date:* ${item.date}`,
      `*Time Slot:* ${item.timeSlot}`,
      `--------------------------------`,
      `Sent via THENIJOBS Enterprise Website Builder.`
    ].join('\n');
  }
  if (type === 'service') {
    return [
      `*SERVICE ENQUIRY*`,
      `--------------------------------`,
      `*Company:* ${company.name}`,
      `*Service Name:* ${item.name}`,
      `--------------------------------`,
      `Hello, I would like to request more details and a quote for this service. Thank you!`,
      `Sent via THENIJOBS Enterprise Website Builder.`
    ].join('\n');
  }
  return [
    `*PRODUCT ENQUIRY*`,
    `--------------------------------`,
    `*Company:* ${company.name}`,
    `*Product Name:* ${item.name}`,
    `*Price:* ₹${item.price || 'Request Quote'}`,
    `--------------------------------`,
    `Hello, I am interested in purchasing this product. Please let me know the availability and next steps.`,
    `Sent via THENIJOBS Enterprise Website Builder.`
  ].join('\n');
}

// 12 Preset Themes
export const PRESET_THEMES: Record<string, {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  card: string;
  text: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  darkBg: string;
  darkCard: string;
  darkText: string;
  darkBorder: string;
  gradient: string;
}> = {
  'classic-blue': {
    name: 'Classic Blue',
    primary: '#2563EB',
    secondary: '#1D4ED8',
    accent: '#3B82F6',
    bg: '#F8FAFC',
    card: '#FFFFFF',
    text: '#111827',
    border: 'rgba(0, 0, 0, 0.08)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    darkBg: '#0F172A',
    darkCard: '#1E293B',
    darkText: '#F8FAFC',
    darkBorder: 'rgba(255, 255, 255, 0.08)',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)'
  },
  'emerald-growth': {
    name: 'Emerald Growth',
    primary: '#10B981',
    secondary: '#059669',
    accent: '#34D399',
    bg: '#F0FDF4',
    card: '#FFFFFF',
    text: '#14532D',
    border: 'rgba(0, 0, 0, 0.08)',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    darkBg: '#061F0E',
    darkCard: '#0B3016',
    darkText: '#ECFDF5',
    darkBorder: 'rgba(255, 255, 255, 0.08)',
    gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)'
  },
  'royal-purple': {
    name: 'Royal Purple',
    primary: '#7C3AED',
    secondary: '#A855F7',
    accent: '#EC4899',
    bg: '#FAF5FF',
    card: '#FFFFFF',
    text: '#2E1065',
    border: 'rgba(0, 0, 0, 0.08)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    darkBg: '#0F0A1E',
    darkCard: '#1B1233',
    darkText: '#FAF5FF',
    darkBorder: 'rgba(255, 255, 255, 0.08)',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)'
  },
  'sunset-amber': {
    name: 'Sunset Amber',
    primary: '#F59E0B',
    secondary: '#D97706',
    accent: '#FDBA74',
    bg: '#FFF7ED',
    card: '#FFFFFF',
    text: '#78350F',
    border: 'rgba(0, 0, 0, 0.08)',
    success: '#10B981',
    warning: '#D97706',
    error: '#EF4444',
    darkBg: '#1C0F02',
    darkCard: '#2D1905',
    darkText: '#FFFBEB',
    darkBorder: 'rgba(255, 255, 255, 0.08)',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FDBA74 100%)'
  },
  'royal-gold': {
    name: 'Royal Gold',
    primary: '#D4AF37',
    secondary: '#B8860B',
    accent: '#FFD700',
    bg: '#FFFDF5',
    card: '#FFFFFF',
    text: '#45350B',
    border: 'rgba(0, 0, 0, 0.08)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    darkBg: '#14120D',
    darkCard: '#242017',
    darkText: '#FFFDF5',
    darkBorder: 'rgba(255, 255, 255, 0.08)',
    gradient: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
  },
  'ocean-cyan': {
    name: 'Ocean Cyan',
    primary: '#06B6D4',
    secondary: '#0891B2',
    accent: '#22D3EE',
    bg: '#F0FDFA',
    card: '#FFFFFF',
    text: '#115E59',
    border: 'rgba(0, 0, 0, 0.08)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    darkBg: '#081C24',
    darkCard: '#0E2E3A',
    darkText: '#E6F4F8',
    darkBorder: 'rgba(255, 255, 255, 0.08)',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)'
  },
  'ruby-red': {
    name: 'Ruby Red',
    primary: '#E11D48',
    secondary: '#BE123C',
    accent: '#FB7185',
    bg: '#FFF1F2',
    card: '#FFFFFF',
    text: '#4C0519',
    border: 'rgba(0, 0, 0, 0.08)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    darkBg: '#1F040E',
    darkCard: '#330819',
    darkText: '#FFE4E6',
    darkBorder: 'rgba(255, 255, 255, 0.08)',
    gradient: 'linear-gradient(135deg, #E11D48 0%, #FB7185 100%)'
  },
  'midnight-dark': {
    name: 'Midnight Dark',
    primary: '#6366F1',
    secondary: '#4F46E5',
    accent: '#818CF8',
    bg: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    border: 'rgba(255, 255, 255, 0.08)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    darkBg: '#090D1A',
    darkCard: '#121829',
    darkText: '#F1F5F9',
    darkBorder: 'rgba(255, 255, 255, 0.06)',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)'
  },
  'forest-green': {
    name: 'Forest Green',
    primary: '#15803D',
    secondary: '#166534',
    accent: '#4ADE80',
    bg: '#F0FDF4',
    card: '#FFFFFF',
    text: '#14532D',
    border: 'rgba(0, 0, 0, 0.08)',
    success: '#166534',
    warning: '#F59E0B',
    error: '#EF4444',
    darkBg: '#04140B',
    darkCard: '#0A2617',
    darkText: '#F0FDF4',
    darkBorder: 'rgba(255, 255, 255, 0.08)',
    gradient: 'linear-gradient(135deg, #15803D 0%, #4ADE80 100%)'
  },
  'modern-gray': {
    name: 'Modern Gray',
    primary: '#4B5563',
    secondary: '#374151',
    accent: '#9CA3AF',
    bg: '#F3F4F6',
    card: '#FFFFFF',
    text: '#1F2937',
    border: 'rgba(0, 0, 0, 0.08)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    darkBg: '#111827',
    darkCard: '#1F2937',
    darkText: '#F9FAFB',
    darkBorder: 'rgba(255, 255, 255, 0.08)',
    gradient: 'linear-gradient(135deg, #4B5563 0%, #9CA3AF 100%)'
  },
  'rose-pink': {
    name: 'Rose Pink',
    primary: '#EC4899',
    secondary: '#DB2777',
    accent: '#F472B6',
    bg: '#FFF5F7',
    card: '#FFFFFF',
    text: '#500730',
    border: 'rgba(0, 0, 0, 0.08)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    darkBg: '#1F0314',
    darkCard: '#330823',
    darkText: '#FCE7F3',
    darkBorder: 'rgba(255, 255, 255, 0.08)',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)'
  },
  'indigo': {
    name: 'Indigo',
    primary: '#4F46E5',
    secondary: '#3730A3',
    accent: '#6366F1',
    bg: '#EEF2FF',
    card: '#FFFFFF',
    text: '#1E1B4B',
    border: 'rgba(0, 0, 0, 0.08)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    darkBg: '#0A081E',
    darkCard: '#120F36',
    darkText: '#EEF2FF',
    darkBorder: 'rgba(255, 255, 255, 0.08)',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'
  }
};

export const getThemeStyles = (themeName = 'classic-blue', customPrimaryColor?: string, isDarkMode = false) => {
  const theme = PRESET_THEMES[themeName] || PRESET_THEMES['classic-blue'];
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
    '--theme-success': theme.success,
    '--theme-warning': theme.warning,
    '--theme-error': theme.error,
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
    return {
      '--theme-card-bg': 'var(--theme-card)',
      '--theme-card-border': '1px solid var(--theme-border)',
      '--theme-card-shadow': 'none',
      '--theme-card-blur': 'none',
    } as React.CSSProperties;
  }
};

export const googleFontsUrls: Record<string, string> = {
  'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap',
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap',
  'Open Sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap',
  'Nunito': 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800;900&display=swap',
  'Lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap',
  'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap',
};

const fontFamilies: Record<string, string> = {
  'Poppins': "'Poppins', sans-serif",
  'Inter': "'Inter', sans-serif",
  'Roboto': "'Roboto', sans-serif",
  'Open Sans': "'Open Sans', sans-serif",
  'Nunito': "'Nunito', sans-serif",
  'Lato': "'Lato', sans-serif",
  'Montserrat': "'Montserrat', sans-serif",
};

interface Customization {
  websiteTheme: string;
  websiteTemplate: string;
  customPrimaryColor: string;
  fontFamily: string;
  buttonStyle: 'rounded' | 'square' | 'pill';
  cardStyle: 'flat' | 'elevated' | 'glass';
  borderRadius: string;
  enableDarkMode: boolean;
  enableAnimations: boolean;
  sectionsVisible?: Record<string, boolean>;
  homepageSectionsOrder?: string[];
  // Typography overrides
  fontSize?: string; // e.g. "14px"
  headingSize?: string; // e.g. "28px"
  lineHeight?: string; // e.g. "1.6"
  letterSpacing?: string; // e.g. "0.05em"
  fontWeight?: string; // e.g. "500"
  uppercaseToggle?: boolean;
  // Header options
  stickyHeader?: boolean;
  transparentHeader?: boolean;
  logoPosition?: 'left' | 'center' | 'right';
  menuPosition?: 'left' | 'center' | 'right';
  showHeaderSearch?: boolean;
  showHeaderWhatsApp?: boolean;
  showHeaderCall?: boolean;
  showHeaderLanguage?: boolean;
  showHeaderThemeSwitch?: boolean;
  showHeaderLogin?: boolean;
  // Footer options
  footerAbout?: boolean;
  footerHours?: boolean;
  footerLinks?: boolean;
  footerProducts?: boolean;
  footerServices?: boolean;
  footerMap?: boolean;
  footerSocials?: boolean;
  footerNewsletter?: boolean;
  footerPrivacyLinks?: boolean;
  footerQuickLinksList?: { label: string; href: string }[];
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

  const fontStyle = fontFamilies[customization.fontFamily] || fontFamilies['Poppins'];

  // Default section ordering based on templates (if ordering is not modified)
  const defaultOrders: Record<string, string[]> = {
    'classic-directory': ['about', 'stats', 'products', 'services', 'gallery', 'reviews', 'faq', 'team', 'contact'],
    'corporate': ['hero', 'about', 'stats', 'services', 'reviews', 'contact'],
    'startup': ['hero', 'about', 'stats', 'services', 'faq', 'contact'],
    'portfolio': ['hero', 'gallery', 'stats', 'reviews', 'contact'],
    'agency': ['hero', 'services', 'gallery', 'stats', 'reviews', 'contact'],
    'construction': ['hero', 'about', 'services', 'gallery', 'reviews', 'contact'],
    'agriculture': ['hero', 'about', 'products', 'gallery', 'contact'],
    'hospital': ['hero', 'booking', 'services', 'team', 'reviews', 'faq', 'contact'],
    'education': ['hero', 'about', 'services', 'team', 'gallery', 'faq', 'contact'],
    'restaurant': ['hero', 'products', 'reviews', 'contact'],
    'ecommerce-storefront': ['hero', 'products', 'reviews', 'faq', 'contact'],
    'service-booking': ['hero', 'booking', 'services', 'reviews', 'faq', 'contact'],
    'real-estate': ['hero', 'products', 'about', 'contact']
  };

  const templateId = customization.websiteTemplate || 'classic-directory';
  const sectionOrder = customization.homepageSectionsOrder || defaultOrders[templateId] || defaultOrders['classic-directory'];

  return (
    <div
      className={`theme-custom-root w-full min-h-screen text-[var(--theme-text)] bg-[var(--theme-bg)] transition-colors duration-300 overflow-x-hidden ${customization.enableAnimations ? 'animations-enabled' : ''}`}
      style={{
        ...themeStyles,
        ...cardStyles,
        '--theme-border-radius': borderRadiusVal,
        '--theme-btn-radius': buttonRadiusVal,
        '--theme-font-family': fontStyle,
        '--theme-font-size': customization.fontSize || '14px',
        '--theme-heading-size': customization.headingSize || '32px',
        '--theme-line-height': customization.lineHeight || '1.6',
        '--theme-letter-spacing': customization.letterSpacing || 'normal',
        '--theme-font-weight': customization.fontWeight || 'normal'
      } as React.CSSProperties}
    >
      <link rel="stylesheet" href={googleFontsUrls[customization.fontFamily] || googleFontsUrls['Poppins']} />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .theme-custom-root {
          font-family: var(--theme-font-family);
          font-size: var(--theme-font-size);
          line-height: var(--theme-line-height);
          letter-spacing: var(--theme-letter-spacing);
          font-weight: var(--theme-font-weight);
        }
        h1, h2, h3, h4, h5, h6 {
          text-transform: ${customization.uppercaseToggle ? 'uppercase' : 'none'};
        }
        h1 {
          font-size: var(--theme-heading-size);
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
        .animations-enabled .animate-fade-up {
          animation: fadeUpIn 0.6s ease-out forwards;
        }
        @keyframes fadeUpIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {/* Header element */}
      <HeaderBuilderComponent company={company} customization={customization} />

      {/* Render layout sections sequentially based on sectionOrder weight */}
      <div className="w-full flex flex-col pt-16">
        {sectionOrder.map((sectionKey) => {
          // Check section visibility configurations
          const isVisible = customization.sectionsVisible?.[sectionKey] !== false;
          if (!isVisible) return null;

          return (
            <div key={sectionKey} className="w-full">
              {sectionKey === 'hero' && (
                <HeroSection company={company} customization={customization} />
              )}
              {sectionKey === 'about' && (
                <AboutSection company={company} customization={customization} />
              )}
              {sectionKey === 'stats' && (
                <StatsSection company={company} jobs={jobs} reviews={reviews} customization={customization} />
              )}
              {sectionKey === 'services' && (
                <ServicesSection company={company} customization={customization} isPreview={isPreview} />
              )}
              {sectionKey === 'products' && (
                <ProductsSection company={company} customization={customization} isPreview={isPreview} />
              )}
              {sectionKey === 'jobs' && (
                <JobsSection company={company} jobs={jobs} customization={customization} />
              )}
              {sectionKey === 'gallery' && (
                <GallerySection company={company} customization={customization} />
              )}
              {sectionKey === 'reviews' && (
                <ReviewsSection company={company} reviews={reviews} customization={customization} isPreview={isPreview} />
              )}
              {sectionKey === 'faq' && (
                <FaqSection company={company} customization={customization} />
              )}
              {sectionKey === 'booking' && (
                <BookingSection company={company} customization={customization} isPreview={isPreview} />
              )}
              {sectionKey === 'team' && (
                <TeamSection company={company} customization={customization} />
              )}
              {sectionKey === 'contact' && (
                <ContactSection company={company} customization={customization} isPreview={isPreview} />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer element */}
      <FooterBuilderComponent company={company} customization={customization} />

      {/* Floating Action Buttons for Mobile Screen */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 md:hidden">
        {/* WhatsApp Button */}
        <a
          href={getCleanWhatsAppUrl(company.whatsapp || company.phone, `Hello ${company.name}, I'm browsing your mobile website and want to enquire.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-all border border-white/10"
        >
          <MessageCircle size={22} />
        </a>

        {/* Call Button */}
        {company.phone && (
          <a
            href={`tel:${company.phone}`}
            className="w-12 h-12 rounded-full bg-[var(--theme-primary)] text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-all border border-white/10"
          >
            <Phone size={22} />
          </a>
        )}

        {/* Share Button */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && navigator.share) {
              navigator.share({
                title: company.name,
                text: company.tagline,
                url: window.location.href,
              }).catch(err => console.log(err));
            } else if (typeof window !== 'undefined') {
              navigator.clipboard.writeText(window.location.href);
              alert('Copied link to clipboard!');
            }
          }}
          className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-all border border-white/10"
        >
          <Share2 size={22} />
        </button>

        {/* Back to Top */}
        <button
          type="button"
          onClick={() => typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-12 h-12 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-all border border-white/10"
        >
          <ArrowUp size={22} />
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// HEADER BUILDER COMPONENT
// ──────────────────────────────────────────────────────────────────
function HeaderBuilderComponent({ company, customization }: { company: any; customization: Customization }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTransparent, setIsTransparent] = useState(customization.transparentHeader);

  useEffect(() => {
    if (!customization.transparentHeader) {
      setIsTransparent(false);
      return;
    }
    const handleScroll = () => {
      setIsTransparent(window.scrollY < 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [customization.transparentHeader]);

  const logoAlign = customization.logoPosition || 'left';
  const menuAlign = customization.menuPosition || 'right';

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Products', href: '#products' },
    { label: 'Services', href: '#services' },
    { label: 'Reviews', href: '#reviews' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`${customization.stickyHeader ? 'sticky' : 'absolute'} top-0 left-0 right-0 z-40 transition-all duration-300 h-16 flex items-center px-6 border-b ${
        isTransparent
          ? 'bg-transparent border-transparent'
          : 'bg-[var(--theme-card)] border-[var(--theme-border)] shadow-sm'
      }`}
    >
      <div className={`w-full max-w-7xl mx-auto flex items-center justify-between ${
        logoAlign === 'center' ? 'flex-row-reverse md:flex-row' : ''
      }`}>
        
        {/* Brand logo/name */}
        <div className={`flex items-center gap-2 ${logoAlign === 'center' ? 'md:mx-auto' : ''}`}>
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="w-8 h-8 rounded-full object-cover border border-[var(--theme-border)]" />
          ) : (
            <Building2 size={20} className="text-[var(--theme-primary)]" />
          )}
          <span className="font-extrabold text-sm tracking-tight text-[var(--theme-text)]">{company.name}</span>
        </div>

        {/* Desktop Menu links */}
        <nav className={`hidden md:flex items-center gap-6 text-xs font-semibold ${
          menuAlign === 'center' ? 'mx-auto' : menuAlign === 'left' ? 'mr-auto ml-10' : 'ml-auto mr-10'
        }`}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-[var(--theme-text)]/70 hover:text-[var(--theme-primary)] transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-2">
          {customization.showHeaderWhatsApp && (
            <a
              href={getCleanWhatsAppUrl(company.whatsapp || company.phone, `Hello ${company.name}, I want to enquire about your services.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-[#25D366] text-white hover:opacity-90"
            >
              <MessageCircle size={14} />
            </a>
          )}
          {customization.showHeaderCall && (
            <a href={getCleanCallUrl(company.phone)} className="p-2 rounded-full bg-[var(--theme-primary)] text-white hover:opacity-90">
              <Phone size={14} />
            </a>
          )}
          {customization.showHeaderLogin && (
            <button className="py-1.5 px-4 text-xs font-bold border border-[var(--theme-border)] hover:bg-[var(--theme-card)] rounded-lg">
              Sign In
            </button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-[var(--theme-text)]/60 hover:text-[var(--theme-text)]"
        >
          <ChevronDown size={20} className={`transform transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[var(--theme-card)] border-b border-[var(--theme-border)] shadow-xl p-4 flex flex-col gap-3 z-50 md:hidden animate-fade-up">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold text-[var(--theme-text)]/75 py-1 hover:text-[var(--theme-primary)]"
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-2 pt-2 border-t border-[var(--theme-border)]">
            {customization.showHeaderWhatsApp && (
              <a
                href={getCleanWhatsAppUrl(company.whatsapp || company.phone, `Hello ${company.name}, I want to enquire.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 text-center text-xs font-extrabold text-white bg-[#25D366] hover:bg-[#128C7E] rounded-xl flex items-center justify-center gap-1.5"
              >
                <MessageCircle size={12} /> WhatsApp
              </a>
            )}
            {customization.showHeaderCall && (
              <a href={getCleanCallUrl(company.phone)} className="flex-1 py-2 text-center text-xs font-extrabold text-white bg-[var(--theme-primary)] rounded-xl flex items-center justify-center gap-1.5">
                <Phone size={12} /> Call
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

// ──────────────────────────────────────────────────────────────────
// FOOTER BUILDER COMPONENT
// ──────────────────────────────────────────────────────────────────
function FooterBuilderComponent({ company, customization }: { company: any; customization: Customization }) {
  const showPrivacy = customization.footerPrivacyLinks !== false;
  const showHours = customization.footerHours !== false;
  const showMap = customization.footerMap !== false;

  return (
    <footer className="w-full bg-[var(--theme-card)] border-t border-[var(--theme-border)] py-12 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
        
        {/* About column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <Building2 size={18} className="text-[var(--theme-primary)]" />
            )}
            <span className="font-extrabold text-sm tracking-tight text-[var(--theme-text)]">{company.name}</span>
          </div>
          {customization.footerAbout !== false && (
            <p className="text-xs text-[var(--theme-text)]/60 leading-relaxed">
              {company.description ? company.description.slice(0, 120) + '...' : 'Premium business listing verified on THENIJOBS.'}
            </p>
          )}
        </div>

        {/* Hours / Schedule column */}
        {showHours && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text)]/50">Working Hours</h4>
            <div className="space-y-2 text-xs text-[var(--theme-text)]/75">
              <div className="flex justify-between">
                <span>Mon - Fri</span>
                <span className="font-semibold">{company.workingHours || '09:00 AM - 06:00 PM'}</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday</span>
                <span className="font-semibold">09:00 AM - 01:00 PM</span>
              </div>
              <div className="flex justify-between text-rose-500 font-semibold">
                <span>Sunday</span>
                <span>Closed</span>
              </div>
            </div>
          </div>
        )}

        {/* Links column */}
        {customization.footerLinks !== false && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text)]/50">Quick Links</h4>
            <div className="flex flex-col gap-2 text-xs text-[var(--theme-text)]/70">
              <a href="#about" className="hover:text-[var(--theme-primary)]">About Us</a>
              <a href="#products" className="hover:text-[var(--theme-primary)]">Products Catalogue</a>
              <a href="#services" className="hover:text-[var(--theme-primary)]">Services & Expertise</a>
              <a href="#reviews" className="hover:text-[var(--theme-primary)]">Client Reviews</a>
            </div>
          </div>
        )}

        {/* Maps Embed column */}
        {showMap && company.mapEmbedUrl && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text)]/50">Location</h4>
            <div className="h-32 rounded-xl overflow-hidden border border-[var(--theme-border)]">
              <iframe
                src={company.mapEmbedUrl}
                className="w-full h-full border-none"
                loading="lazy"
                title="Footer Maps Location"
              />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto border-t border-[var(--theme-border)] mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[var(--theme-text)]/40 font-medium">
        <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
        
        {showPrivacy && (
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms & Conditions</a>
          </div>
        )}
      </div>
    </footer>
  );
}

// ──────────────────────────────────────────────────────────────────
// SECTION COMPONENTS IMPLEMENTATIONS
// ──────────────────────────────────────────────────────────────────

// ── 1. Hero / Banner Section ──
function HeroSection({ company, customization }: { company: any; customization: Customization }) {
  const tpl = customization.websiteTemplate;

  // Startup template Hero
  if (tpl === 'startup') {
    return (
      <section className="relative py-28 px-6 text-center bg-gradient-to-b from-[var(--theme-primary)]/10 via-[var(--theme-primary)]/5 to-transparent border-b border-[var(--theme-border)] overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10 animate-fade-up">
          <span className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)] bg-[var(--theme-primary)]/15 rounded-full">
            Next-Gen SaaS System
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[var(--theme-text)] tracking-tight leading-tight">
            Deploy your Enterprise Business and Grow Seamlessly
          </h1>
          <p className="text-base sm:text-lg text-[var(--theme-text)]/75 max-w-2xl mx-auto leading-relaxed">
            {company.tagline || 'We orchestrate workflow architectures, manage inventory products, and schedule bookings.'}
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <a href="#contact" className="py-2.5 px-6 text-xs font-bold theme-btn-primary shadow-lg shadow-[var(--theme-primary)]/20">
              Get Started Free
            </a>
            <a href="#services" className="py-2.5 px-6 text-xs font-bold theme-btn-secondary">
              Learn More
            </a>
          </div>
        </div>
      </section>
    );
  }

  // Restaurant template Hero
  if (tpl === 'restaurant') {
    return (
      <section className="relative py-32 px-6 flex items-center justify-center bg-slate-950 text-white min-h-[60vh]">
        {company.coverImageUrl && (
          <img src={company.coverImageUrl} alt={company.name} className="absolute inset-0 w-full h-full object-cover opacity-45" />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="max-w-2xl text-center space-y-6 relative z-10 animate-fade-up">
          <span className="inline-block px-3.5 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--theme-primary)] bg-[var(--theme-primary)]/30 border border-[var(--theme-primary)]/40 rounded-full">
            Delicious Dining Experience
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight font-serif text-[var(--theme-primary)]">
            {company.name}
          </h1>
          <p className="text-sm sm:text-base text-gray-200 font-medium">
            {company.tagline || 'Gourmet delicacies, locally sourced ingredients, and instant WhatsApp dining order tables.'}
          </p>
          <div className="pt-4">
            <a href="#products" className="py-3 px-8 text-xs font-bold theme-btn-primary tracking-wider uppercase">
              Explore Our Menu
            </a>
          </div>
        </div>
      </section>
    );
  }

  // Hospital Hero
  if (tpl === 'hospital') {
    return (
      <section className="relative py-20 px-6 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-b border-[var(--theme-border)]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 animate-fade-up">
            <span className="inline-block px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 rounded-full">
              24/7 Verified Healthcare Portal
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--theme-text)] leading-tight">
              Compassionate Care, Close to Home
            </h1>
            <p className="text-xs sm:text-sm text-[var(--theme-text)]/70 leading-relaxed">
              {company.description ? company.description.slice(0, 200) + '...' : 'Access local clinical consultants, medical checkup schedules, and direct appointments.'}
            </p>
            <div className="flex gap-3">
              <a href="#booking" className="py-2.5 px-6 text-xs font-bold theme-btn-primary flex items-center gap-1.5 shadow-md">
                <Calendar size={14} /> Schedule Appointment
              </a>
              <a href={getCleanCallUrl(company.phone)} className="py-2.5 px-6 text-xs font-bold theme-btn-secondary flex items-center gap-1.5">
                <Phone size={14} /> Emergency Contact
              </a>
            </div>
          </div>
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[var(--theme-border)] bg-slate-900 flex items-center justify-center">
            {company.coverImageUrl ? (
              <img src={company.coverImageUrl} alt="Hospital" className="w-full h-full object-cover" />
            ) : (
              <Building2 size={64} className="text-white/20" />
            )}
          </div>
        </div>
      </section>
    );
  }

  // Standard Directory / Corporate cover Hero
  return (
    <section className="relative h-64 sm:h-96 w-full bg-slate-900 border-b border-[var(--theme-border)] flex items-center justify-center overflow-hidden">
      {company.coverImageUrl ? (
        <img src={company.coverImageUrl} alt={company.name} className="w-full h-full object-cover opacity-75" />
      ) : (
        <div className="text-white/25 text-sm font-semibold uppercase tracking-widest">Enterprise Partner Banner</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
      
      <div className="absolute bottom-6 left-6 flex items-center gap-4 relative z-10">
        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-4 border-[var(--theme-card)] bg-[var(--theme-card)] shadow-lg overflow-hidden flex items-center justify-center shrink-0">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
          ) : (
            <Building2 size={36} className="text-[var(--theme-primary)]" />
          )}
        </div>
        <div className="text-white">
          <h1 className="text-xl sm:text-3xl font-extrabold flex items-center gap-1.5 leading-tight text-white drop-shadow-md">
            {company.name}
            {company.verificationStatus === 'verified' && (
              <BadgeCheck size={24} className="text-blue-400 fill-blue-500/10 shrink-0" />
            )}
          </h1>
          <p className="text-xs text-white/80 font-bold mt-1 drop-shadow">
            {company.category} • {company.district}, {company.state}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── 2. About Section ──
function AboutSection({ company, customization }: { company: any; customization: Customization }) {
  return (
    <section id="about" className="py-16 px-6 max-w-7xl mx-auto grid md:grid-cols-5 gap-8 items-center border-b border-[var(--theme-border)] animate-fade-up">
      <div className="md:col-span-3 space-y-4">
        <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] border-l-4 border-[var(--theme-primary)] pl-3">
          About Our Business
        </h2>
        <p className="text-xs sm:text-sm text-[var(--theme-text)]/75 leading-relaxed whitespace-pre-wrap">
          {company.description || 'Welcome to our official business profile page. We are committed to rendering the best services.'}
        </p>
        {company.tagline && (
          <div className="p-4 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-xs text-[var(--theme-text)]/70 italic">
            "{company.tagline}"
          </div>
        )}
      </div>

      <div className="md:col-span-2 theme-card-custom p-6 space-y-4 bg-gradient-to-br from-[var(--theme-primary)]/5 to-transparent">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text)]/60">Company Overview</h3>
        <div className="space-y-2 text-xs">
          {company.establishedYear && (
            <div className="flex justify-between py-1.5 border-b border-[var(--theme-border)]">
              <span className="text-[var(--theme-text)]/60">Established</span>
              <span className="font-extrabold text-[var(--theme-text)]">{company.establishedYear}</span>
            </div>
          )}
          {company.companySize && (
            <div className="flex justify-between py-1.5 border-b border-[var(--theme-border)]">
              <span className="text-[var(--theme-text)]/60">Team Size</span>
              <span className="font-extrabold text-[var(--theme-text)]">{company.companySize}</span>
            </div>
          )}
          <div className="flex justify-between py-1.5 border-b border-[var(--theme-border)]">
            <span className="text-[var(--theme-text)]/60">Location Type</span>
            <span className="font-extrabold text-[var(--theme-text)]">Corporate Office</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 3. Stats Section ──
function StatsSection({ company, jobs, reviews, customization }: { company: any; jobs: any[]; reviews: any[]; customization: Customization }) {
  return (
    <section className="py-12 bg-gradient-to-r from-[var(--theme-primary)]/5 to-transparent border-b border-[var(--theme-border)]">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="theme-card-custom p-5 text-center space-y-1">
          <Users className="w-5 h-5 text-[var(--theme-primary)] mx-auto" />
          <span className="text-xl sm:text-2xl font-black text-[var(--theme-text)] block">{company.viewCount || '250'}+</span>
          <p className="text-[9px] uppercase font-extrabold text-[var(--theme-text)]/40 tracking-wider">Page Views</p>
        </div>
        <div className="theme-card-custom p-5 text-center space-y-1">
          <Briefcase className="w-5 h-5 text-[var(--theme-primary)] mx-auto" />
          <span className="text-xl sm:text-2xl font-black text-[var(--theme-text)] block">{jobs?.length || 0}</span>
          <p className="text-[9px] uppercase font-extrabold text-[var(--theme-text)]/40 tracking-wider">Active Jobs</p>
        </div>
        <div className="theme-card-custom p-5 text-center space-y-1">
          <ShoppingBag className="w-5 h-5 text-[var(--theme-primary)] mx-auto" />
          <span className="text-xl sm:text-2xl font-black text-[var(--theme-text)] block">{company.products?.length || 0}</span>
          <p className="text-[9px] uppercase font-extrabold text-[var(--theme-text)]/40 tracking-wider">Products</p>
        </div>
        <div className="theme-card-custom p-5 text-center space-y-1">
          <Star className="w-5 h-5 text-[var(--theme-primary)] mx-auto fill-[var(--theme-primary)]/10" />
          <span className="text-xl sm:text-2xl font-black text-[var(--theme-text)] block">{reviews?.length || 0}</span>
          <p className="text-[9px] uppercase font-extrabold text-[var(--theme-text)]/40 tracking-wider">Client Reviews</p>
        </div>
      </div>
    </section>
  );
}

// ── 4. Services Showcase Grid ──
function ServicesSection({ company, customization, isPreview }: { company: any; customization: Customization; isPreview: boolean }) {
  const services = company.services || [];
  if (services.length === 0) return null;

  return (
    <section id="services" className="py-16 px-6 max-w-7xl mx-auto border-b border-[var(--theme-border)] space-y-8 animate-fade-up">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)]">Our Services & Solutions</h2>
        <div className="w-8 h-1 bg-[var(--theme-primary)] rounded-full mx-auto" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((srv: any, idx: number) => (
          <div key={idx} className="theme-card-custom p-5 flex flex-col justify-between h-48 border border-[var(--theme-border)]">
            <div>
              <h4 className="text-xs font-bold text-[var(--theme-text)]">{srv.name || srv}</h4>
              <p className="text-[10px] text-[var(--theme-text)]/60 line-clamp-3 mt-1.5 leading-relaxed">
                {srv.description || 'Professional catalog service solution custom-tailored to requirements.'}
              </p>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-[var(--theme-border)] mt-auto">
              <span className="text-[10px] font-black text-[var(--theme-primary)]">
                {srv.price ? `₹${srv.price}` : 'Quote on request'}
              </span>
              <a
                href={getCleanWhatsAppUrl(company.whatsapp || company.phone, formatWhatsAppMessage(company, { name: srv.name || srv }, 'service'))}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-3 rounded-lg text-[9px] font-bold bg-[#25D366] text-white hover:opacity-95 flex items-center gap-1 shadow-sm"
              >
                <MessageCircle size={10} /> Enquire
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 5. Products Catalogue Grid ──
function ProductsSection({ company, customization, isPreview }: { company: any; customization: Customization; isPreview: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);

  const products = company.products || [];
  const tpl = customization.websiteTemplate;

  // Extract categories dynamically
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p: any) => {
      if (p.category) cats.add(p.category);
    });
    return ['All', ...Array.from(cats)];
  }, [products]);

  // Filter products
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

  if (products.length === 0) return null;

  // Real Estate template (Property Listings)
  if (tpl === 'real-estate') {
    return (
      <section id="products" className="py-16 px-6 max-w-7xl mx-auto border-b border-[var(--theme-border)] space-y-8 animate-fade-up">
        <div className="flex justify-between items-end border-b border-[var(--theme-border)] pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)]">Available Properties</h2>
            <p className="text-[10px] text-[var(--theme-text)]/60 mt-1">Browse active property listings mapped to local parameters.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((prop: any, idx: number) => (
            <div key={idx} className="theme-card-custom overflow-hidden flex flex-col justify-between border border-[var(--theme-border)] group">
              <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center border-b border-[var(--theme-border)]">
                {prop.imageUrl ? (
                  <img src={prop.imageUrl} alt={prop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <Home size={32} className="text-white/20" />
                )}
                <span className="absolute top-2 right-2 px-2.5 py-0.5 text-[8px] font-black uppercase text-white bg-[var(--theme-primary)] rounded">
                  FOR SALE
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <span className="text-[8px] font-extrabold uppercase text-[var(--theme-primary)]">{prop.category || 'Real Estate'}</span>
                  <h4 className="text-xs font-bold text-[var(--theme-text)] truncate mt-0.5">{prop.name}</h4>
                  <p className="text-[10px] text-[var(--theme-text)]/60 line-clamp-2 mt-1 leading-relaxed">{prop.description}</p>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-[var(--theme-border)]">
                  <span className="text-sm font-black text-[var(--theme-primary)]">₹{prop.price || 'Price on request'}</span>
                  <button
                    onClick={() => handleOrderWhatsApp(prop)}
                    className="py-1 px-3 text-[9px] font-extrabold text-white bg-[#25D366] hover:bg-[#128C7E] rounded-xl flex items-center gap-1 shadow-sm"
                  >
                    <MessageCircle size={10} /> Enquire
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Restaurant template (Menu items list)
  if (tpl === 'restaurant') {
    return (
      <section id="products" className="py-16 px-6 max-w-3xl mx-auto border-b border-[var(--theme-border)] space-y-8 animate-fade-up">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] font-serif">Our Dining Menu</h2>
          <p className="text-xs text-[var(--theme-text)]/60 font-medium">Select delicious dishes and order via WhatsApp</p>
        </div>

        <div className="space-y-6">
          {products.map((food: any, idx: number) => (
            <div key={idx} className="flex gap-4 items-start py-3 border-b border-dashed border-[var(--theme-border)]">
              {food.imageUrl && (
                <img src={food.imageUrl} alt={food.name} className="w-14 h-14 rounded-lg object-cover border border-[var(--theme-border)] shrink-0 bg-slate-900" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <h4 className="text-xs font-bold text-[var(--theme-text)] truncate">{food.name}</h4>
                  <div className="flex-1 border-b border-dotted border-[var(--theme-border)] mx-2" />
                  <span className="text-xs font-black text-[var(--theme-primary)] shrink-0">₹{food.price}</span>
                </div>
                <p className="text-[10px] text-[var(--theme-text)]/60 mt-1 leading-relaxed">{food.description}</p>
                
                <button
                  onClick={() => handleOrderWhatsApp(food)}
                  className="mt-2 text-[8px] font-black text-[#25D366] hover:underline flex items-center gap-1"
                >
                  <MessageCircle size={10} /> Order Dish on WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Standard Shopping storefront catalog
  return (
    <section id="products" className="py-16 px-6 max-w-7xl mx-auto border-b border-[var(--theme-border)] space-y-8 animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[var(--theme-border)] pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)]">Products Catalogue</h2>
          <p className="text-[10px] text-[var(--theme-text)]/60 mt-1">Browse and filter products list</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search catalogue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 sm:w-48 bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--theme-text)] outline-none"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--theme-text)] outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {filteredProducts.map((p: any) => (
          <div key={p.id} className="theme-card-custom overflow-hidden flex flex-col justify-between border border-[var(--theme-border)] group">
            <div className="relative aspect-square bg-slate-900 overflow-hidden flex items-center justify-center">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <ShoppingBag size={24} className="text-white/20" />
              )}
            </div>
            <div className="p-4 space-y-3">
              <div>
                <span className="text-[8px] font-extrabold uppercase text-[var(--theme-primary)]">{p.category || 'Catalogue'}</span>
                <h4 className="text-xs font-bold text-[var(--theme-text)] truncate mt-0.5">{p.name}</h4>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[var(--theme-border)]">
                <span className="text-xs font-black text-[var(--theme-primary)]">₹{p.price}</span>
                <button
                  onClick={() => handleOrderWhatsApp(p)}
                  className="py-1 px-2.5 text-[8px] font-extrabold text-white bg-[#25D366] hover:bg-[#128C7E] rounded-lg flex items-center gap-1 transition-colors"
                >
                  <MessageCircle size={8} /> Order
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 6. Active Jobs Section ──
function JobsSection({ company, jobs, customization }: { company: any; jobs: any[]; customization: Customization }) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <section id="jobs" className="py-16 px-6 max-w-7xl mx-auto border-b border-[var(--theme-border)] space-y-8 animate-fade-up">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)]">Active Careers & Jobs</h2>
        <p className="text-xs text-[var(--theme-text)]/60">Join our growing professional team</p>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="theme-card-custom p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-[var(--theme-border)]">
            <div>
              <h4 className="text-xs font-bold text-[var(--theme-text)]">{job.title}</h4>
              <div className="flex items-center gap-3 text-[10px] text-[var(--theme-text)]/50 mt-1 font-semibold">
                <span>{job.type}</span>
                <span>•</span>
                <span>{job.salary}</span>
                <span>•</span>
                <span>Posted {job.posted}</span>
              </div>
            </div>
            <a
              href={`/jobs/${job.id}`}
              className="w-full sm:w-auto py-2 px-5 text-center text-xs font-bold theme-btn-primary shadow-sm"
            >
              Apply Now
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 7. Gallery Section ──
function GallerySection({ company, customization }: { company: any; customization: Customization }) {
  const gallery = company.galleryImages || [];
  if (gallery.length === 0) return null;

  return (
    <section className="py-16 px-6 max-w-7xl mx-auto border-b border-[var(--theme-border)] space-y-8 animate-fade-up">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)]">Photo & Video Gallery</h2>
        <p className="text-xs text-[var(--theme-text)]/60">A dynamic view inside our company workspace</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {gallery.map((url: string, idx: number) => (
          <div key={idx} className="aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-[var(--theme-border)] bg-slate-900">
            <img src={url} alt="Gallery item" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 8. Reviews Grid Section ──
function ReviewsSection({ company, reviews, customization, isPreview }: { company: any; reviews: any[]; customization: Customization; isPreview: boolean }) {
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
    <section id="reviews" className="py-16 px-6 max-w-7xl mx-auto border-b border-[var(--theme-border)] grid md:grid-cols-5 gap-8 items-start animate-fade-up">
      
      {/* Testimonials list */}
      <div className="md:col-span-3 space-y-6">
        <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)]">What Clients Say</h2>
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-xs text-[var(--theme-text)]/50 italic py-4">No reviews recorded yet.</p>
          ) : (
            reviews.map((rev, idx) => (
              <div key={idx} className="theme-card-custom p-5 space-y-3 border border-[var(--theme-border)] bg-gradient-to-br from-white/[0.01] to-transparent">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[var(--theme-text)]">{rev.userName || rev.name || 'Client review'}</span>
                  <span className="text-[10px] text-[var(--theme-text)]/40 font-semibold">{rev.date || 'verified'}</span>
                </div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className={i < (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-400'} />
                  ))}
                </div>
                <p className="text-xs text-[var(--theme-text)]/80 leading-relaxed italic">
                  "{rev.comment || rev.content}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Leave review form */}
      <div className="md:col-span-2">
        <div className="theme-card-custom p-6 space-y-4 bg-gradient-to-br from-[var(--theme-primary)]/5 to-transparent">
          <h3 className="text-sm font-bold text-[var(--theme-text)]">Write an Honest Review</h3>
          
          {submitted ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center">
              Review submitted! It will appear publicly after approval.
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Rating Score</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-amber-400 focus:outline-none"
                    >
                      <Star size={20} className={star <= rating ? 'fill-amber-400' : 'text-slate-400'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Comments</label>
                <textarea
                  rows={3}
                  required
                  placeholder="What was your experience?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none resize-none"
                />
              </div>

              <button type="submit" className="py-2.5 px-6 text-xs font-bold theme-btn-primary w-full shadow-md">
                Post Review Feedback
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ── 9. FAQ Accordions Section ──
function FaqSection({ company, customization }: { company: any; customization: Customization }) {
  const faqs = company.faqs || [
    { q: 'What is your service coverage area?', a: 'We serve all of Theni district and surrounding areas in Tamil Nadu.' },
    { q: 'How can I place an order?', a: 'You can explore our products catalogue or services booking system, and click "Order on WhatsApp" to coordinate instantly.' },
    { q: 'What are your operational hours?', a: 'We are open Monday through Friday from 9 AM to 6 PM, and Saturday from 9 AM to 1 PM.' }
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-16 px-6 max-w-3xl mx-auto border-b border-[var(--theme-border)] space-y-8 animate-fade-up">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)]">Frequently Asked Questions</h2>
        <p className="text-xs text-[var(--theme-text)]/60">Find quick responses to general enquiries</p>
      </div>

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
    </section>
  );
}

// ── 10. Service Booking Portal Form Section ──
function BookingSection({ company, customization, isPreview }: { company: any; customization: Customization; isPreview: boolean }) {
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const services = company.services || [];
  const timeslots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

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
        await addDoc(collection(db, 'bookings'), bookingData);
      }
      setBookingSuccess(true);
    } catch (err) {
      console.error('Error saving booking:', err);
      alert('Failed to save booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const triggerWhatsAppBooking = () => {
    if (!selectedService) return;
    const text = formatWhatsAppMessage(company, { serviceName: selectedService.name || selectedService, date: bookingDate, timeSlot: bookingTime, customerName }, 'booking');
    window.open(getCleanWhatsAppUrl(company.whatsapp || company.phone, text), '_blank');
  };

  return (
    <section id="booking" className="py-16 px-6 max-w-3xl mx-auto border-b border-[var(--theme-border)] space-y-6 animate-fade-up">
      <div className="theme-card-custom p-6 space-y-6">
        <h2 className="text-lg font-bold text-[var(--theme-text)] border-b border-[var(--theme-border)] pb-2 flex items-center gap-1.5">
          <Calendar size={18} className="text-[var(--theme-primary)]" /> Book an Appointment Slot
        </h2>

        {bookingSuccess ? (
          <div className="text-center py-10 space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle size={28} />
            </div>
            <h3 className="text-base font-extrabold text-[var(--theme-text)]">Booking Request Logged!</h3>
            <p className="text-xs text-[var(--theme-text)]/70 max-w-sm mx-auto">
              Your appointment is recorded. Please notify us on WhatsApp to confirm immediately.
            </p>
            <div className="flex flex-col gap-2 pt-4 max-w-xs mx-auto">
              <button
                onClick={triggerWhatsAppBooking}
                className="w-full py-2.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#128C7E] flex items-center justify-center gap-1.5"
                style={{ borderRadius: 'var(--theme-btn-radius)' }}
              >
                <MessageCircle size={14} /> Send WhatsApp Alert
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            {/* Service dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--theme-text)]/75">Select Service</label>
              <select
                className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                value={selectedService ? JSON.stringify(selectedService) : ''}
                onChange={(e) => setSelectedService(e.target.value ? JSON.parse(e.target.value) : null)}
              >
                {services.map((srv: any, idx: number) => (
                  <option key={idx} value={JSON.stringify(srv)}>
                    {srv.name || srv} {srv.price ? `(₹${srv.price})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--theme-text)]/75">Date</label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
              />
            </div>

            {/* TimeSlot chooser */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--theme-text)]/75">Select Time</label>
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

            {/* Customer info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--theme-text)]/75">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--theme-text)]/75">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full py-3 text-xs font-bold uppercase tracking-wider theme-btn-primary shadow-md">
              {submitting ? 'Scheduling appointment...' : 'Confirm Appointment'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// ── 11. Team/Faculty Members section ──
function TeamSection({ company, customization }: { company: any; customization: Customization }) {
  const team = company.team || [
    { name: 'Dr. S. Eswaran', role: 'Chief Executive Officer', photoUrl: '', bio: '12+ years experience in corporate operations and strategy.' },
    { name: 'Mrs. K. Priya', role: 'Business Development Manager', photoUrl: '', bio: 'Handles client success and local community relations.' }
  ];

  return (
    <section className="py-16 px-6 max-w-7xl mx-auto border-b border-[var(--theme-border)] space-y-8 animate-fade-up">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)]">Our Professional Team</h2>
        <p className="text-xs text-[var(--theme-text)]/60">Meet the experts behind our success</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {team.map((member: any, idx: number) => (
          <div key={idx} className="theme-card-custom p-5 flex gap-4 items-center border border-[var(--theme-border)]">
            <div className="w-16 h-16 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 border border-[var(--theme-border)]">
              {member.photoUrl ? (
                <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <User size={28} className="text-white/20" />
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-[var(--theme-text)]">{member.name}</h4>
              <span className="text-[9px] font-black uppercase text-[var(--theme-primary)] block mt-0.5">{member.role}</span>
              <p className="text-[10px] text-[var(--theme-text)]/60 mt-1 leading-relaxed">{member.bio}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 12. Contact Center & Enquiry Section ──
function ContactSection({ company, customization, isPreview }: { company: any; customization: Customization; isPreview: boolean }) {
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
    <section id="contact" className="py-16 px-6 max-w-7xl mx-auto border-b border-[var(--theme-border)] grid md:grid-cols-5 gap-8 items-start animate-fade-up">
      
      {/* Contact details */}
      <div className="md:col-span-2 space-y-6">
        <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)]">Contact Center</h2>
        <div className="space-y-4 text-xs font-medium">
          {company.phone && (
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] shrink-0">
                <Phone size={14} />
              </div>
              <div>
                <p className="text-[10px] text-[var(--theme-text)]/50 uppercase font-bold">Helpline Phone</p>
                <a href={`tel:${company.phone}`} className="text-[var(--theme-text)] hover:underline">{company.phone}</a>
              </div>
            </div>
          )}
          {company.email && (
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] shrink-0">
                <Mail size={14} />
              </div>
              <div>
                <p className="text-[10px] text-[var(--theme-text)]/50 uppercase font-bold">Official Email</p>
                <a href={`mailto:${company.email}`} className="text-[var(--theme-text)] hover:underline">{company.email}</a>
              </div>
            </div>
          )}
          {company.address && (
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] shrink-0">
                <MapPin size={14} />
              </div>
              <div>
                <p className="text-[10px] text-[var(--theme-text)]/50 uppercase font-bold">Business Location</p>
                <span className="text-[var(--theme-text)]">{company.address}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enquiry Form */}
      <div className="md:col-span-3">
        <div className="theme-card-custom p-6 space-y-4 bg-gradient-to-br from-[var(--theme-primary)]/5 to-transparent">
          <h3 className="text-sm font-bold text-[var(--theme-text)]">Submit Instant Enquiry</h3>
          
          {submitted ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center">
              Enquiry submitted! We will contact you soon.
            </div>
          ) : (
            <form onSubmit={handleSubmitEnquiry} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Message</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell us what you need"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none resize-none"
                />
              </div>

              <button type="submit" className="py-2.5 px-6 text-xs font-bold theme-btn-primary w-full shadow-md">
                Send Message Enquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
