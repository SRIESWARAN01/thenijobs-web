'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin, Phone, Mail, Globe, MessageCircle, Share2, Heart, X,
  Star, BadgeCheck, Clock, Users, Eye, TrendingUp, ChevronRight,
  Briefcase, Building2, Calendar, ShoppingBag, Search,
  Image as ImageIcon, Filter, ArrowRight, Quote, Check,
  CheckCircle, Lock, AlertCircle, Award, Sparkles, ChevronDown,
  User, Send, BookOpen, HeartHandshake, Home, ArrowUpRight, ArrowUp, FileText
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, query, where, limit, getDocs } from 'firebase/firestore';
import { downloadVCard } from '@/lib/vcf';

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
    'business-directory': ['about', 'stats', 'products', 'services', 'gallery', 'reviews', 'faq', 'team', 'contact'],
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
      {templateId === 'business-directory' ? (
        <BusinessDirectoryTemplate
          company={company}
          jobs={jobs}
          reviews={reviews}
          customization={customization}
          isPreview={isPreview}
        />
      ) : (
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
      )}

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

// ──────────────────────────────────────────────────────────────────
// BUSINESS DIRECTORY TEMPLATE (⭐ NEW)
// ──────────────────────────────────────────────────────────────────
export function BusinessDirectoryTemplate({
  company,
  jobs,
  reviews: initialReviews,
  customization,
  isPreview = false
}: {
  company: any;
  jobs: any[];
  reviews: any[];
  customization: any;
  isPreview?: boolean;
}) {
  // State for products and services
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  // Gallery states
  const [galleryTab, setGalleryTab] = useState<'photos' | 'videos' | '360'>('photos');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Reviews states
  const [reviews, setReviews] = useState<any[]>(initialReviews || []);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});

  // Enquiry states
  const [enqName, setEnqName] = useState('');
  const [enqMobile, setEnqMobile] = useState('');
  const [enqEmail, setEnqEmail] = useState('');
  const [enqSubject, setEnqSubject] = useState('');
  const [enqMessage, setEnqMessage] = useState('');
  const [enqSubmitted, setEnqSubmitted] = useState(false);
  const [enqSubmitting, setEnqSubmitting] = useState(false);

  // Booking states (Enterprise feature)
  const [bookingService, setBookingService] = useState<string>('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Live Chat (Enterprise feature)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'agent'; text: string; time: string }[]>([
    { sender: 'agent', text: `Welcome to ${company.name || 'our office'}! How can we help you today?`, time: 'Now' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Related businesses state
  const [relatedCompanies, setRelatedCompanies] = useState<any[]>([]);

  const isEnterprise = company.subscriptionBadge === 'enterprise';

  // Load related businesses
  useEffect(() => {
    if (!company.category || isPreview) return;
    const fetchRelated = async () => {
      try {
        const q = query(
          collection(db, 'companies'),
          where('category', '==', company.category),
          where('isActive', '==', true),
          limit(5)
        );
        const snap = await getDocs(q);
        const list = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => c.id !== company.id)
          .slice(0, 3);
        setRelatedCompanies(list);
      } catch (err) {
        console.error('Error fetching related companies:', err);
      }
    };
    fetchRelated();
  }, [company.category, company.id, isPreview]);

  // Load reviews on initial load and handle updates
  useEffect(() => {
    if (initialReviews) {
      setReviews(initialReviews);
    }
  }, [initialReviews]);

  // Sorting Reviews
  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      if (sortBy === 'highest') return (b.rating || 5) - (a.rating || 5);
      if (sortBy === 'lowest') return (a.rating || 5) - (b.rating || 5);
      
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.date || a.createdAt || 0).getTime();
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.date || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [reviews, sortBy]);

  // Extract products categories
  const products = company.products || [];
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

  // Business Hours status calculations
  const scheduleStatus = useMemo(() => {
    // Mon-Sat 9 AM - 6 PM fallback
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const scheduleText = company.workingHours || '09:00 AM - 06:00 PM';
    const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi;
    const matches = [...scheduleText.matchAll(timeRegex)];
    
    let startHour = 9, startMin = 0, endHour = 18, endMin = 0;
    if (matches.length >= 2) {
      const startH = parseInt(matches[0][1]);
      const startM = parseInt(matches[0][2]);
      const startAmPm = matches[0][3].toUpperCase();
      
      const endH = parseInt(matches[1][1]);
      const endM = parseInt(matches[1][2]);
      const endAmPm = matches[1][3].toUpperCase();

      startHour = startAmPm === 'PM' && startH !== 12 ? startH + 12 : (startAmPm === 'AM' && startH === 12 ? 0 : startH);
      startMin = startM;
      
      endHour = endAmPm === 'PM' && endH !== 12 ? endH + 12 : (endAmPm === 'AM' && endH === 12 ? 0 : endH);
      endMin = endM;
    }

    const startTimeInMinutes = startHour * 60 + startMin;
    const endTimeInMinutes = endHour * 60 + endMin;

    const startMatch = matches[0];
    const endMatch = matches[1];
    const startStr = startMatch ? startMatch[0] : '09:00 AM';
    const endStr = endMatch ? endMatch[0] : '06:00 PM';

    if (currentDay === 0) {
      return { label: 'Closed Now', detail: `Opens Monday at ${startStr}`, isHoliday: true, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    }

    if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
      return { label: 'Open Now', detail: `Closes at ${endStr}`, isHoliday: false, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    } else if (currentTimeInMinutes < startTimeInMinutes) {
      return { label: 'Closed Now', detail: `Opens today at ${startStr}`, isHoliday: false, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    } else {
      const nextDayLabel = currentDay === 6 ? 'Monday' : 'tomorrow';
      return { label: 'Closed Now', detail: `Opens ${nextDayLabel} at ${startStr}`, isHoliday: false, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    }
  }, [company.workingHours]);

  // Handle Enquiry submission
  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enqName || !enqMobile || !enqMessage) return;

    setEnqSubmitting(true);
    try {
      const profileUrl = typeof window !== 'undefined' ? window.location.href : `https://thenijobs.com/company/${company.slug || company.id}`;
      const payload = {
        name: enqName,
        phone: enqMobile,
        email: enqEmail || '',
        subject: enqSubject || 'General Directory Enquiry',
        message: enqMessage,
        companyId: company.id,
        companyName: company.name,
        companySlug: company.slug || '',
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN'),
        reference: 'THENIJOBS Business Directory Template',
        createdAt: new Date()
      };

      if (!isPreview) {
        await addDoc(collection(db, 'enquiries'), payload);
      }
      setEnqSubmitted(true);
    } catch (err) {
      console.error('Error submitting enquiry:', err);
    } finally {
      setEnqSubmitting(false);
    }
  };

  // WhatsApp Enquiry
  const handleWhatsAppEnquiry = () => {
    const profileUrl = typeof window !== 'undefined' ? window.location.href : `https://thenijobs.com/company/${company.slug || company.id}`;
    const text = [
      `*BUSINESS DIRECTORY ENQUIRY*`,
      `--------------------------------`,
      `*To:* ${company.name}`,
      `*Name:* ${enqName || 'Customer'}`,
      `*Mobile:* ${enqMobile || 'N/A'}`,
      `*Email:* ${enqEmail || 'N/A'}`,
      `*Subject:* ${enqSubject || 'General Enquiry'}`,
      `*Message:* ${enqMessage || 'Hello, I want to connect.'}`,
      `--------------------------------`,
      `*Date:* ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`,
      `*Source:* ${profileUrl}`,
      `*Ref:* THENIJOBS Reference`
    ].join('\n');
    window.open(getCleanWhatsAppUrl(company.whatsapp || company.phone, text), '_blank');
  };

  // Save review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;

    try {
      const newRev = {
        userName: reviewName,
        name: reviewName,
        rating: reviewRating,
        comment: reviewComment,
        content: reviewComment,
        date: 'Just Now',
        createdAt: new Date(),
        status: 'approved'
      };

      if (!isPreview) {
        await addDoc(collection(db, 'reviews'), {
          companyId: company.id,
          userName: reviewName,
          rating: reviewRating,
          comment: reviewComment,
          status: 'pending',
          createdAt: new Date()
        });
      }

      setReviews(prev => [newRev, ...prev]);
      setReviewSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Copy Contact Info
  const copyContactToClipboard = () => {
    const info = `
Business: ${company.name}
Phone: ${company.phone || 'N/A'}
WhatsApp: ${company.whatsapp || company.phone || 'N/A'}
Email: ${company.email || 'N/A'}
Address: ${company.address || 'N/A'}
Website: ${company.website || 'N/A'}
    `.trim();
    navigator.clipboard.writeText(info);
    alert('Contact details copied to clipboard!');
  };

  // Send Chat message
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg = { sender: 'user' as const, text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');

    // Simulated reply
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: 'agent',
        text: `Thank you for your message! Our representatives will contact you shortly, or you can click the WhatsApp button to chat instantly.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  // Appointment booking logic
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingService || !bookingDate || !bookingTime || !bookingName || !bookingPhone) {
      alert('Please fill out all booking slots.');
      return;
    }
    setBookingSubmitting(true);
    try {
      const data = {
        serviceName: bookingService,
        date: bookingDate,
        timeSlot: bookingTime,
        customerName: bookingName,
        customerPhone: bookingPhone,
        companyId: company.id,
        createdAt: new Date(),
        status: 'pending'
      };
      if (!isPreview) {
        await addDoc(collection(db, 'bookings'), data);
      }
      setBookingSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Helpful votes function
  const handleHelpfulVote = (reviewId: string) => {
    setHelpfulCounts(prev => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1
    }));
  };

  // Related businesses fallback
  const fallbackRelated = [
    { id: '1', name: 'Theni Medical Center', category: 'Healthcare', district: 'Theni', state: 'Tamil Nadu', rating: 4.8, logoUrl: '' },
    { id: '2', name: 'Elite Residency & Hotel', category: 'Hotels', district: 'Theni', state: 'Tamil Nadu', rating: 4.5, logoUrl: '' },
    { id: '3', name: 'Jeyam Super Market', category: 'Shops & Retail', district: 'Theni', state: 'Tamil Nadu', rating: 4.7, logoUrl: '' }
  ];
  const displayRelated = relatedCompanies.length > 0 ? relatedCompanies : fallbackRelated;

  const currentYear = new Date().getFullYear();
  const yearsInBusiness = company.establishedYear ? Math.max(1, currentYear - Number(company.establishedYear)) : 5;

  // Fallbacks for address segments
  const pinCode = company.pinCode || company.pin || (company.address?.match(/\b\d{6}\b/)?.[0] || '625531');
  const landmark = company.landmark || 'Near Main Center';
  const area = company.area || company.location || 'Theni Town';
  const village = company.village || company.location || 'Theni';
  const district = company.district || 'Theni';
  const state = company.state || 'Tamil Nadu';
  const displayAddress = company.address || `${village}, ${district}, ${state} - ${pinCode}`;

  // Gallery items fallback
  const galleryImages = company.galleryImages && company.galleryImages.length > 0
    ? company.galleryImages 
    : [
        'https://images.unsplash.com/photo-1542744173-8e089687446a?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=60'
      ];

  const galleryVideos = company.galleryVideos && company.galleryVideos.length > 0 
    ? company.galleryVideos 
    : ['https://www.w3schools.com/html/mov_bbb.mp4'];

  // SEO schema scripts configuration
  const schemaList = [
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': company.name,
      'description': company.description || company.tagline || 'Verified business listing on THENIJOBS',
      'image': company.logoUrl || undefined,
      'telephone': company.phone || undefined,
      'email': company.email || undefined,
      'priceRange': '₹₹',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': displayAddress,
        'addressLocality': district,
        'addressRegion': state,
        'addressCountry': 'IN',
        'postalCode': pinCode
      },
      'openingHoursSpecification': [
        {
          '@type': 'OpeningHoursSpecification',
          'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          'opens': '09:00',
          'closes': '18:00'
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': company.name,
      'logo': company.logoUrl || undefined,
      'url': typeof window !== 'undefined' ? window.location.href : '',
      'sameAs': [
        company.facebook || undefined,
        company.instagram || undefined,
        company.linkedin || undefined,
        company.youtube || undefined
      ].filter(Boolean)
    }
  ];

  return (
    <div className="w-full flex flex-col pt-16 bg-[var(--theme-bg)] pb-24 relative select-none">
      {/* Dynamic SEO JSON-LD scripts */}
      {schemaList.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 1: HERO BANNER */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="relative w-full border-b border-[var(--theme-border)]">
        {/* Cover image or video */}
        <div className="relative h-64 sm:h-96 w-full bg-slate-950 overflow-hidden flex items-center justify-center">
          {isEnterprise && company.videoBannerUrl ? (
            <video
              src={company.videoBannerUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-70"
            />
          ) : company.coverImageUrl ? (
            <img
              src={company.coverImageUrl}
              alt={company.name}
              className="absolute inset-0 w-full h-full object-cover opacity-75"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 via-indigo-950/60 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        </div>

        {/* Brand layout info */}
        <div className="max-w-7xl mx-auto px-6 -mt-20 sm:-mt-24 pb-8 relative z-10 flex flex-col md:flex-row gap-6 md:items-end justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Logo */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-[var(--theme-card)] bg-[var(--theme-card)] shadow-2xl overflow-hidden flex items-center justify-center shrink-0">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 size={44} className="text-[var(--theme-primary)]" />
              )}
            </div>

            {/* Info details */}
            <div className="text-white space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-4xl font-extrabold flex items-center gap-1.5 leading-tight drop-shadow-md text-white">
                  {company.name}
                </h1>
                {(company.verificationStatus === 'verified' || company.verificationBadges?.businessVerified) && (
                  <span className="inline-flex items-center justify-center p-1 rounded-full bg-blue-500 text-white shrink-0 shadow" title="Verified Business">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
                {company.subscriptionBadge && (
                  <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    {company.subscriptionBadge}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm font-semibold text-white/95 italic drop-shadow-sm max-w-lg">
                {company.tagline || 'Welcome to our verified business directory portal page.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 font-medium">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10">{company.category}</span>
                <span>•</span>
                <span>{district}, {state}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-yellow-300">
                  <Star size={12} className="fill-yellow-300 text-yellow-300" />
                  {company.rating || 5.0} ({reviews.length} Reviews)
                </span>
                <span>•</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-black">
                  {yearsInBusiness} Yrs in Business
                </span>
              </div>
            </div>
          </div>

          {/* Trust Score Radial Indicator */}
          <div className="shrink-0 flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="24" className="stroke-white/10" strokeWidth="4" fill="transparent" />
                <circle cx="28" cy="28" r="24" className="stroke-purple-500" strokeWidth="4" fill="transparent"
                  strokeDasharray={150.7} strokeDashoffset={150.7 - (150.7 * (company.trustScore || 85)) / 100} />
              </svg>
              <span className="absolute text-xs font-black text-white">{company.trustScore || 85}%</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-white/50 tracking-wider block">Trust Score</span>
              <span className="text-xs font-bold text-emerald-400">High Trust Rating</span>
            </div>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="bg-[var(--theme-card)] border-t border-[var(--theme-border)] py-4 px-6">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-2.5 items-center justify-start">
            <a href={getCleanCallUrl(company.phone)} className="theme-btn-primary min-h-[48px] px-5 flex items-center justify-center gap-2 text-xs font-bold shadow-md">
              <Phone size={14} /> Call Now
            </a>
            <a href={getCleanWhatsAppUrl(company.whatsapp || company.phone, `Hello ${company.name}, I found your website on THENIJOBS directory and want to enquire.`)} target="_blank" rel="noopener noreferrer" className="min-h-[48px] px-5 rounded-xl bg-[#25D366] text-white hover:opacity-90 flex items-center justify-center gap-2 text-xs font-bold shadow-md">
              <MessageCircle size={14} /> WhatsApp
            </a>
            <a href="#location-map" className="theme-btn-secondary min-h-[48px] px-5 flex items-center justify-center gap-2 text-xs font-bold">
              <MapPin size={14} /> Get Directions
            </a>
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="theme-btn-secondary min-h-[48px] px-5 flex items-center justify-center gap-2 text-xs font-bold">
                <Globe size={14} /> Visit Website
              </a>
            )}
            <button type="button" onClick={() => {
              if (navigator.share) {
                navigator.share({ title: company.name, text: company.tagline, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Profile link copied!');
              }
            }} className="theme-btn-secondary min-h-[48px] px-5 flex items-center justify-center gap-2 text-xs font-bold">
              <Share2 size={14} /> Share Business
            </button>
            <button type="button" onClick={() => downloadVCard({
              name: company.name,
              organization: company.name,
              phone: company.phone,
              whatsapp: company.whatsapp,
              email: company.email,
              website: company.website,
              address: displayAddress,
              district: district,
              category: company.category
            })} className="theme-btn-secondary min-h-[48px] px-5 flex items-center justify-center gap-2 text-xs font-bold">
              <Heart size={14} /> Save Contact
            </button>
            {isEnterprise && company.brochureUrl && (
              <a href={company.brochureUrl} download className="min-h-[48px] px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 text-xs font-bold shadow" title="Download brochure catalog pdf">
                <FileText size={14} className="shrink-0" /> Download Brochure
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 2: BUSINESS OVERVIEW */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="py-12 max-w-7xl mx-auto px-6 w-full grid md:grid-cols-3 gap-8 items-start border-b border-[var(--theme-border)]">
        <div className="md:col-span-2 space-y-5">
          <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center gap-2">
            <Building2 className="text-[var(--theme-primary)]" size={22} /> About Company
          </h2>
          <p className="text-xs sm:text-sm text-[var(--theme-text)]/75 leading-relaxed whitespace-pre-wrap">
            {company.description || 'Welcome to our official business profile page. We are committed to rendering the best services.'}
          </p>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text)]/50">Business Highlights</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-lg bg-[var(--theme-primary)]/5 border border-[var(--theme-primary)]/10 text-xs font-semibold text-[var(--theme-primary)]">✓ Verified Partner</span>
              <span className="px-3 py-1 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-xs font-semibold text-yellow-600 dark:text-yellow-400">✓ Customer Recommended</span>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ Highly Responsive</span>
              {company.gstNumber && <span className="px-3 py-1 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs font-semibold text-blue-600 dark:text-blue-400">✓ GST Registered</span>}
            </div>
          </div>
        </div>

        {/* Profile Facts Grid */}
        <div className="theme-card-custom p-6 space-y-4 bg-gradient-to-br from-[var(--theme-primary)]/5 to-transparent">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text)]/60 border-b border-[var(--theme-border)] pb-2">Business Specifications</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-[var(--theme-border)]/50">
              <span className="text-[var(--theme-text)]/65">Establishment Year</span>
              <span className="font-extrabold text-[var(--theme-text)]">{company.establishedYear || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--theme-border)]/50">
              <span className="text-[var(--theme-text)]/65">Business Type</span>
              <span className="font-extrabold text-[var(--theme-text)]">{company.businessType || 'SME Enterprise'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--theme-border)]/50">
              <span className="text-[var(--theme-text)]/65">Industry Category</span>
              <span className="font-extrabold text-[var(--theme-text)]">{company.category}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--theme-border)]/50">
              <span className="text-[var(--theme-text)]/65">Number of Employees</span>
              <span className="font-extrabold text-[var(--theme-text)]">{company.teamSize || company.companySize || '5-20 Members'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--theme-text)]/65">Languages Spoken</span>
              <span className="font-extrabold text-[var(--theme-text)]">{company.languagesSpoken || 'Tamil, English'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 3: PRODUCTS GRID */}
      {/* ──────────────────────────────────────────────────────── */}
      {products.length > 0 && (
        <section className="py-12 max-w-7xl mx-auto px-6 w-full border-b border-[var(--theme-border)] space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[var(--theme-border)] pb-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center gap-2">
                <ShoppingBag className="text-[var(--theme-primary)]" size={22} /> Products Showcase
              </h2>
              <p className="text-xs text-[var(--theme-text)]/60">Browse through our product catalog grid</p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 sm:w-48 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text)] outline-none"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text)] outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredProducts.map((p: any) => (
              <div key={p.id} className="theme-card-custom overflow-hidden flex flex-col justify-between border border-[var(--theme-border)] group">
                <div className="relative aspect-square bg-slate-900 overflow-hidden flex items-center justify-center">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <ShoppingBag size={32} className="text-white/20" />
                  )}
                </div>
                <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] font-extrabold uppercase text-[var(--theme-primary)] bg-[var(--theme-primary)]/10 px-2 py-0.5 rounded">{p.category || 'Product'}</span>
                    <h4 className="text-xs font-bold text-[var(--theme-text)] truncate mt-1.5">{p.name}</h4>
                    <p className="text-[10px] text-[var(--theme-text)]/60 line-clamp-2 mt-1 leading-relaxed">{p.description || 'Verified product listing'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2.5 items-center justify-between pt-2 border-t border-[var(--theme-border)] mt-4">
                    <span className="text-xs font-black text-[var(--theme-primary)]">₹{p.price || 'N/A'}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="py-1 px-2.5 text-[9px] font-bold border border-[var(--theme-border)] hover:bg-[var(--theme-bg)] rounded-lg"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => {
                          const text = formatWhatsAppMessage(company, p, 'product');
                          window.open(getCleanWhatsAppUrl(company.whatsapp || company.phone, text), '_blank');
                        }}
                        className="py-1 px-2.5 text-[9px] font-bold text-white bg-[#25D366] hover:bg-[#128C7E] rounded-lg flex items-center gap-1"
                      >
                        <MessageCircle size={8} /> Order
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="theme-card-custom w-full max-w-xl bg-[var(--theme-card)] overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/45 text-white hover:opacity-80 z-10"
            >
              <X size={16} />
            </button>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="aspect-square bg-slate-950 flex items-center justify-center">
                {selectedProduct.imageUrl ? (
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag size={48} className="text-white/20" />
                )}
              </div>
              <div className="p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[9px] font-black uppercase text-[var(--theme-primary)] bg-[var(--theme-primary)]/10 px-2 py-0.5 rounded-full">{selectedProduct.category || 'Product'}</span>
                  <h3 className="text-base font-extrabold text-[var(--theme-text)]">{selectedProduct.name}</h3>
                  <p className="text-xs text-[var(--theme-text)]/75 leading-relaxed whitespace-pre-wrap">{selectedProduct.description || 'Professional product catalog specifications.'}</p>
                  
                  {selectedProduct.variants && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[var(--theme-text)]/50">Available Variants</span>
                      <p className="text-xs font-semibold text-[var(--theme-text)]">{selectedProduct.variants}</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-[var(--theme-border)] flex items-center justify-between">
                  <span className="text-sm font-black text-[var(--theme-primary)]">₹{selectedProduct.price || 'Request Quote'}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const text = formatWhatsAppMessage(company, selectedProduct, 'product');
                        window.open(getCleanWhatsAppUrl(company.whatsapp || company.phone, text), '_blank');
                        setSelectedProduct(null);
                      }}
                      className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#128C7E] flex items-center gap-1.5 shadow"
                    >
                      <MessageCircle size={12} /> WhatsApp Enquiry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 4: SERVICES */}
      {/* ──────────────────────────────────────────────────────── */}
      {company.services && company.services.length > 0 && (
        <section className="py-12 max-w-7xl mx-auto px-6 w-full border-b border-[var(--theme-border)] space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center gap-2">
              <Briefcase className="text-[var(--theme-primary)]" size={22} /> Services & Solutions
            </h2>
            <p className="text-xs text-[var(--theme-text)]/60">Services offered by {company.name}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {company.services.map((srv: any, idx: number) => (
              <div key={idx} className="theme-card-custom p-5 flex flex-col justify-between h-52 border border-[var(--theme-border)]">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-[var(--theme-text)]">{srv.name || srv}</h4>
                    <span className="text-[9px] font-black uppercase text-[var(--theme-primary)] bg-[var(--theme-primary)]/10 px-2 py-0.5 rounded">Service</span>
                  </div>
                  <p className="text-[10px] text-[var(--theme-text)]/65 line-clamp-3 leading-relaxed">
                    {srv.description || 'Expert customized solutions tailored directly to customer requirements.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--theme-border)] mt-4">
                  <div className="flex items-center justify-between text-[10px] text-[var(--theme-text)]/50 pb-2.5">
                    <span>Duration: {srv.duration || '30-60 Mins'}</span>
                    <span>Availability: {srv.availability || 'Mon - Sat'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-[var(--theme-primary)]">
                      {srv.price ? `₹${srv.price}` : 'Quote on request'}
                    </span>
                    <div className="flex gap-1.5">
                      <a href="#appointment-booking" className="py-1 px-3 text-[9px] font-extrabold text-[var(--theme-primary)] border border-[var(--theme-primary)] rounded-lg hover:bg-[var(--theme-primary)]/10">
                        Book Now
                      </a>
                      <a
                        href={getCleanWhatsAppUrl(company.whatsapp || company.phone, formatWhatsAppMessage(company, { name: srv.name || srv }, 'service'))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1 px-3 rounded-lg text-[9px] font-bold bg-[#25D366] text-white hover:opacity-95 flex items-center gap-1 shadow-sm"
                      >
                        <MessageCircle size={10} /> WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 5: PHOTO GALLERY */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="py-12 max-w-7xl mx-auto px-6 w-full border-b border-[var(--theme-border)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--theme-border)] pb-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center gap-2">
              <ImageIcon className="text-[var(--theme-primary)]" size={22} /> Multimedia Gallery
            </h2>
            <p className="text-xs text-[var(--theme-text)]/60">Take a visual tour inside our business workspace</p>
          </div>

          {/* Album categorizer */}
          <div className="flex gap-1 bg-[var(--theme-card)] border border-[var(--theme-border)] p-1 rounded-xl">
            <button
              onClick={() => setGalleryTab('photos')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg ${galleryTab === 'photos' ? 'bg-[var(--theme-primary)] text-white shadow-sm' : 'text-[var(--theme-text)]/75 hover:bg-[var(--theme-bg)]'}`}
            >
              Photos
            </button>
            <button
              onClick={() => setGalleryTab('videos')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg ${galleryTab === 'videos' ? 'bg-[var(--theme-primary)] text-white shadow-sm' : 'text-[var(--theme-text)]/75 hover:bg-[var(--theme-bg)]'}`}
            >
              Videos
            </button>
            <button
              onClick={() => setGalleryTab('360')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg ${galleryTab === '360' ? 'bg-[var(--theme-primary)] text-white shadow-sm' : 'text-[var(--theme-text)]/75 hover:bg-[var(--theme-bg)]'}`}
            >
              360° Virtual Tour
            </button>
          </div>
        </div>

        {/* Tab content */}
        {galleryTab === 'photos' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {galleryImages.map((url: string, idx: number) => (
              <div
                key={idx}
                onClick={() => { setLightboxIndex(idx); setZoomLevel(1); }}
                className="aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-[var(--theme-border)] bg-slate-900 cursor-zoom-in relative group"
              >
                <img src={url} alt="Gallery image" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <Search size={22} className="text-white" />
                </div>
              </div>
            ))}
          </div>
        )}

        {galleryTab === 'videos' && (
          <div className="grid sm:grid-cols-2 gap-4">
            {galleryVideos.map((url: string, idx: number) => (
              <div key={idx} className="aspect-video rounded-2xl overflow-hidden border border-[var(--theme-border)] bg-slate-950 relative group">
                <video src={url} controls className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {galleryTab === '360' && (
          <div className="theme-card-custom overflow-hidden border border-[var(--theme-border)] bg-slate-950 relative flex items-center justify-center aspect-video max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
              <Sparkles size={40} className="text-purple-400 animate-spin-slow" />
              <h4 className="text-sm font-extrabold text-white">Interactive 360° Virtual Office Tour</h4>
              <p className="text-xs text-gray-300 max-w-sm">Drag and rotate to navigate a complete high fidelity 3D panorama simulation of our operations floor.</p>
              <button
                type="button"
                onClick={() => alert('Launching immersive panoramic view...')}
                className="py-2 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Start Immersive Tour
              </button>
            </div>
            <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&auto=format&fit=crop&q=80" alt="360 view placeholder" className="w-full h-full object-cover filter blur-sm" />
          </div>
        )}
      </section>

      {/* Lightbox full screen viewer */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 select-none">
          {/* Lightbox Controls header */}
          <div className="absolute top-4 left-0 right-0 px-6 flex justify-between items-center text-white z-20 bg-black/40 py-2">
            <span className="text-xs font-bold">{lightboxIndex + 1} / {galleryImages.length}</span>
            <div className="flex gap-4">
              <button onClick={() => setZoomLevel(prev => prev === 1 ? 1.5 : 1)} className="hover:text-purple-400 font-semibold text-xs">
                Zoom {zoomLevel > 1 ? 'Out' : 'In'}
              </button>
              <a href={galleryImages[lightboxIndex]} target="_blank" rel="noopener noreferrer" download className="hover:text-purple-400 font-semibold text-xs">
                Download
              </a>
              <button onClick={() => setLightboxIndex(null)} className="hover:text-purple-400">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lightbox content */}
          <div className="w-full max-w-3xl flex items-center justify-between gap-2 relative">
            <button
              onClick={() => {
                setLightboxIndex(prev => prev !== null && prev > 0 ? prev - 1 : galleryImages.length - 1);
                setZoomLevel(1);
              }}
              className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 shrink-0 select-none z-10"
            >
              &larr;
            </button>

            <div className="flex-1 flex justify-center items-center overflow-hidden transition-all duration-300">
              <img
                src={galleryImages[lightboxIndex]}
                alt="Fullscreen view"
                className="max-h-[80vh] max-w-full object-contain rounded transition-transform"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>

            <button
              onClick={() => {
                setLightboxIndex(prev => prev !== null && prev < galleryImages.length - 1 ? prev + 1 : 0);
                setZoomLevel(1);
              }}
              className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 shrink-0 select-none z-10"
            >
              &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 6 & 7: BUSINESS & CONTACT INFORMATION */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="py-12 max-w-7xl mx-auto px-6 w-full border-b border-[var(--theme-border)] grid md:grid-cols-2 gap-8 items-start">
        {/* Business address Details */}
        <div className="space-y-5">
          <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center gap-2">
            <MapPin className="text-[var(--theme-primary)]" size={22} /> Location Address
          </h2>
          
          <div className="theme-card-custom p-6 space-y-4 border border-[var(--theme-border)]">
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-[var(--theme-primary)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-[var(--theme-text)] block">Full Address</span>
                  <p className="text-[var(--theme-text)]/75 mt-0.5 leading-relaxed">{displayAddress}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--theme-border)]/50">
                <div>
                  <span className="text-[var(--theme-text)]/50 font-bold block uppercase text-[9px] tracking-wider">Landmark</span>
                  <span className="font-extrabold text-[var(--theme-text)]">{landmark}</span>
                </div>
                <div>
                  <span className="text-[var(--theme-text)]/50 font-bold block uppercase text-[9px] tracking-wider">Area / Village</span>
                  <span className="font-extrabold text-[var(--theme-text)]">{area}</span>
                </div>
                <div>
                  <span className="text-[var(--theme-text)]/50 font-bold block uppercase text-[9px] tracking-wider">District / State</span>
                  <span className="font-extrabold text-[var(--theme-text)]">{district}, {state}</span>
                </div>
                <div>
                  <span className="text-[var(--theme-text)]/50 font-bold block uppercase text-[9px] tracking-wider">PIN Code</span>
                  <span className="font-extrabold text-[var(--theme-text)]">{pinCode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact details */}
        <div className="space-y-5">
          <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center gap-2">
            <Phone className="text-[var(--theme-primary)]" size={22} /> Contact Details
          </h2>

          <div className="theme-card-custom p-6 space-y-5 border border-[var(--theme-border)]">
            <div className="space-y-3 text-xs">
              {company.phone && (
                <div className="flex items-center justify-between py-1 border-b border-[var(--theme-border)]/40">
                  <div className="flex items-center gap-2.5">
                    <Phone size={14} className="text-[var(--theme-primary)]" />
                    <span className="font-bold text-[var(--theme-text)]">{company.phone}</span>
                  </div>
                  <a href={`tel:${company.phone}`} className="text-[var(--theme-primary)] hover:underline font-extrabold">Call</a>
                </div>
              )}

              {company.whatsapp && (
                <div className="flex items-center justify-between py-1 border-b border-[var(--theme-border)]/40">
                  <div className="flex items-center gap-2.5">
                    <MessageCircle size={14} className="text-emerald-500" />
                    <span className="font-bold text-[var(--theme-text)]">{company.whatsapp}</span>
                  </div>
                  <a href={getCleanWhatsAppUrl(company.whatsapp, 'Hello')} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline font-extrabold">WhatsApp</a>
                </div>
              )}

              {company.email && (
                <div className="flex items-center justify-between py-1 border-b border-[var(--theme-border)]/40">
                  <div className="flex items-center gap-2.5">
                    <Mail size={14} className="text-amber-500" />
                    <span className="font-bold text-[var(--theme-text)] truncate max-w-[180px]">{company.email}</span>
                  </div>
                  <a href={`mailto:${company.email}`} className="text-amber-500 hover:underline font-extrabold">Email</a>
                </div>
              )}
            </div>

            {/* Social media connections */}
            <div className="flex gap-2">
              <button
                onClick={copyContactToClipboard}
                className="flex-1 py-2 px-3 border border-[var(--theme-border)] rounded-xl text-xs font-bold hover:bg-[var(--theme-bg)] transition-colors"
              >
                Copy Details
              </button>
              <button
                onClick={() => downloadVCard({
                  name: company.name,
                  organization: company.name,
                  phone: company.phone,
                  whatsapp: company.whatsapp,
                  email: company.email,
                  website: company.website,
                  address: displayAddress,
                  district: district,
                  category: company.category
                })}
                className="flex-1 py-2 px-3 border border-[var(--theme-border)] rounded-xl text-xs font-bold hover:bg-[var(--theme-bg)] transition-colors"
              >
                Share Contact
              </button>
            </div>

            {/* Social profiles svg rendering */}
            <div className="flex items-center gap-3 pt-3 border-t border-[var(--theme-border)] justify-center">
              {company.facebook && (
                <a href={company.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-[var(--theme-bg)] text-blue-600 transition-colors">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                  </svg>
                </a>
              )}
              {company.instagram && (
                <a href={company.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-[var(--theme-bg)] text-pink-600 transition-colors">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              )}
              {company.linkedin && (
                <a href={company.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-[var(--theme-bg)] text-blue-800 transition-colors">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              )}
              {company.youtube && (
                <a href={company.youtube} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-[var(--theme-bg)] text-red-600 transition-colors">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 8 & 9: BUSINESS HOURS & LOCATION MAP */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="py-12 max-w-7xl mx-auto px-6 w-full border-b border-[var(--theme-border)] grid md:grid-cols-2 gap-8 items-start">
        {/* Business hours scheduler status */}
        <div className="space-y-5">
          <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center gap-2">
            <Clock className="text-[var(--theme-primary)]" size={22} /> Operation Hours
          </h2>

          <div className="theme-card-custom p-6 space-y-4 border border-[var(--theme-border)]">
            <div className="flex justify-between items-center bg-[var(--theme-bg)] border border-[var(--theme-border)] p-3 rounded-xl">
              <div>
                <span className={`px-2 py-0.5 text-xs font-black rounded-lg border ${scheduleStatus.color}`}>
                  {scheduleStatus.label}
                </span>
                <p className="text-[10px] text-[var(--theme-text)]/50 font-bold mt-1.5">{scheduleStatus.detail}</p>
              </div>
              <Clock size={20} className="text-[var(--theme-text)]/40" />
            </div>

            <div className="space-y-2 text-xs">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <div key={day} className="flex justify-between py-1 border-b border-[var(--theme-border)]/40 font-medium">
                  <span className="text-[var(--theme-text)]/75">{day}</span>
                  <span className="font-bold">{company.workingHours || '9:00 AM - 6:00 PM'}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 font-bold text-rose-500">
                <span>Sunday</span>
                <span>Closed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location Maps */}
        <div id="location-map" className="space-y-5">
          <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center gap-2">
            <Globe className="text-[var(--theme-primary)]" size={22} /> Geo Location Location
          </h2>

          <div className="theme-card-custom p-4 border border-[var(--theme-border)] space-y-4">
            <div className="h-64 rounded-xl overflow-hidden bg-slate-900 border border-[var(--theme-border)] relative">
              {company.mapEmbedUrl ? (
                <iframe
                  src={company.mapEmbedUrl}
                  className="w-full h-full border-none"
                  loading="lazy"
                  title="Google Maps Location Embed"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white bg-slate-900 space-y-2">
                  <MapPin size={32} className="text-[var(--theme-primary)] animate-pulse" />
                  <h4 className="text-xs font-extrabold">Interactive Google Map Placeholder</h4>
                  <p className="text-[10px] text-gray-400 max-w-xs">Configure your Google Maps embed code in your profile to display direct street maps here.</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <a
                href={company.mapEmbedUrl ? company.mapEmbedUrl : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.name + ' ' + displayAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 bg-[var(--theme-primary)] text-white hover:opacity-90 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow"
              >
                <MapPin size={12} /> Open Maps
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.name + ' ' + displayAddress)}`);
                  alert('Map coordinates link copied!');
                }}
                className="flex-1 py-2 px-3 border border-[var(--theme-border)] hover:bg-[var(--theme-bg)] rounded-xl text-xs font-bold text-center"
              >
                Share Location
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 10: CUSTOMER REVIEWS */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="py-12 max-w-7xl mx-auto px-6 w-full border-b border-[var(--theme-border)] grid md:grid-cols-3 gap-8 items-start">
        {/* Review list */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--theme-border)] pb-3">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center gap-2">
              <Star className="text-amber-400 fill-amber-400" size={22} /> Customer Reviews
            </h2>

            {/* Sort reviewer */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--theme-text)] outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>

          <div className="space-y-4">
            {sortedReviews.length === 0 ? (
              <p className="text-xs text-[var(--theme-text)]/50 italic py-6">No reviews logged yet. Write one on the right!</p>
            ) : (
              sortedReviews.map((rev: any, idx: number) => (
                <div key={rev.id || idx} className="theme-card-custom p-5 space-y-3.5 border border-[var(--theme-border)] bg-gradient-to-br from-white/[0.01] to-transparent">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 border border-[var(--theme-border)]">
                        {rev.photoURL ? (
                          <img src={rev.photoURL} alt={rev.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={18} className="text-white/20" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[var(--theme-text)] block">{rev.name || rev.userName}</span>
                        <span className="text-[9px] text-[var(--theme-text)]/40 font-semibold">{rev.date || 'Verified User'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} className={i < (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-400'} />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--theme-text)]/80 leading-relaxed italic">
                    "{rev.content || rev.comment}"
                  </p>

                  {/* Business reply */}
                  {(rev.reply || isPreview) && (
                    <div className="pl-4 border-l-2 border-purple-500 bg-purple-500/5 p-3 rounded-r-xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400">Business Reply</span>
                      <p className="text-xs text-[var(--theme-text)]/75 leading-relaxed italic">
                        {rev.reply || "Thank you for sharing your feedback! We look forward to serving you again."}
                      </p>
                    </div>
                  )}

                  {/* Helpful votes */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--theme-border)]/30 text-[10px]">
                    <span className="text-[var(--theme-text)]/45">Was this review helpful?</span>
                    <button
                      onClick={() => handleHelpfulVote(rev.id || idx.toString())}
                      className="px-2.5 py-1 rounded-lg border border-[var(--theme-border)] hover:bg-[var(--theme-bg)] font-bold text-[var(--theme-text)] flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      👍 Helpful ({helpfulCounts[rev.id || idx.toString()] || rev.helpfulVotes || 0})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Aggregate Ratings & Form */}
        <div className="space-y-6">
          <div className="theme-card-custom p-5 text-center border border-[var(--theme-border)] space-y-3 bg-gradient-to-br from-[var(--theme-primary)]/5 to-transparent">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text)]/65">Rating Dashboard</h3>
            <span className="text-4xl sm:text-5xl font-black text-[var(--theme-text)] block">{company.rating || 5.0}</span>
            
            <div className="flex items-center justify-center gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} className={i < Math.round(company.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-400'} />
              ))}
            </div>

            <p className="text-[10px] text-[var(--theme-text)]/50 font-bold uppercase">Based on {reviews.length} total reviews</p>
          </div>

          <div className="theme-card-custom p-6 space-y-4 border border-[var(--theme-border)] bg-gradient-to-br from-[var(--theme-primary)]/5 to-transparent">
            <h3 className="text-sm font-bold text-[var(--theme-text)] border-b border-[var(--theme-border)] pb-2">Submit a Review</h3>
            {reviewSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center">
                Review submitted successfully!
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Rajesh Kumar"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--theme-text)]/60 block">Rating Score</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-amber-400 focus:outline-none"
                      >
                        <Star size={22} className={star <= reviewRating ? 'fill-amber-400' : 'text-slate-400'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Review Comments</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Write details about your experience..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none resize-none"
                  />
                </div>

                <button type="submit" className="py-3 px-6 text-xs font-bold theme-btn-primary w-full shadow-md">
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 11: ENQUIRY FORM */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="py-12 max-w-3xl mx-auto px-6 w-full border-b border-[var(--theme-border)] space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center justify-center gap-2">
            <Send className="text-[var(--theme-primary)]" size={22} /> Send Enquiry Message
          </h2>
          <p className="text-xs text-[var(--theme-text)]/60 max-w-sm mx-auto">Get in touch with us directly for custom pricing, orders or general clarifications.</p>
        </div>

        <div className="theme-card-custom p-6 border border-[var(--theme-border)] space-y-4 bg-gradient-to-br from-[var(--theme-primary)]/5 to-transparent">
          {enqSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center space-y-3">
              <CheckCircle size={28} className="mx-auto text-emerald-400" />
              <p>Enquiry logged successfully! We will coordinate with you shortly.</p>
              <button
                onClick={handleWhatsAppEnquiry}
                className="mt-3 py-2 px-5 bg-[#25D366] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 mx-auto hover:opacity-90"
              >
                <MessageCircle size={12} /> Notify via WhatsApp
              </button>
            </div>
          ) : (
            <form onSubmit={handleEnquirySubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={enqName}
                    onChange={(e) => setEnqName(e.target.value)}
                    className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-Digit Mobile"
                    value={enqMobile}
                    onChange={(e) => setEnqMobile(e.target.value)}
                    className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Email Address</label>
                  <input
                    type="email"
                    placeholder="Optional email"
                    value={enqEmail}
                    onChange={(e) => setEnqEmail(e.target.value)}
                    className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Subject</label>
                  <input
                    type="text"
                    placeholder="General Business Enquiry"
                    value={enqSubject}
                    onChange={(e) => setEnqSubject(e.target.value)}
                    className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Detailed Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="What details are you looking for?"
                  value={enqMessage}
                  onChange={(e) => setEnqMessage(e.target.value)}
                  className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={enqSubmitting}
                  className="flex-1 py-3 text-xs font-bold theme-btn-primary shadow-md flex items-center justify-center gap-1.5"
                >
                  <Send size={12} /> {enqSubmitting ? 'Sending...' : 'Send Enquiry'}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppEnquiry}
                  className="flex-1 py-3 text-xs font-bold text-white bg-[#25D366] hover:bg-[#128C7E] rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                >
                  <MessageCircle size={12} /> WhatsApp Enquiry
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 12: FEATURED JOBS */}
      {/* ──────────────────────────────────────────────────────── */}
      {jobs && jobs.length > 0 && (
        <section className="py-12 max-w-7xl mx-auto px-6 w-full border-b border-[var(--theme-border)] space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center justify-center gap-2">
              <Briefcase size={22} className="text-[var(--theme-primary)]" /> Career Opportunities
            </h2>
            <p className="text-xs text-[var(--theme-text)]/60">Join our growing professional operational team</p>
          </div>

          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="theme-card-custom p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-[var(--theme-border)]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center border border-[var(--theme-border)] shrink-0">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={22} className="text-white/20" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--theme-text)]">{job.title}</h4>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--theme-text)]/50 mt-1 font-bold">
                      <span>{job.type}</span>
                      <span>•</span>
                      <span>{job.salary}</span>
                      <span>•</span>
                      <span>Posted {job.posted}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={`/jobs/${job.id}`}
                  className="w-full sm:w-auto py-2.5 px-6 text-center text-xs font-bold theme-btn-primary shadow-sm"
                >
                  Apply Now
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 13: RELATED BUSINESSES */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="py-12 max-w-7xl mx-auto px-6 w-full border-b border-[var(--theme-border)] space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center gap-2">
            <Users className="text-[var(--theme-primary)]" size={22} /> Recommended Businesses
          </h2>
          <p className="text-xs text-[var(--theme-text)]/60">Similar service providers in the category "{company.category}"</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {displayRelated.map((c: any) => (
            <a href={`/company/${c.slug || c.id}`} key={c.id} className="theme-card-custom p-4 flex items-center gap-3 border border-[var(--theme-border)] hover:bg-[var(--theme-card)]/40">
              <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 border border-[var(--theme-border)]">
                {c.logoUrl ? (
                  <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={22} className="text-white/20" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[8px] font-black uppercase text-[var(--theme-primary)] bg-[var(--theme-primary)]/10 px-1.5 py-0.5 rounded">{c.category || 'Business'}</span>
                <h4 className="text-xs font-bold text-[var(--theme-text)] truncate mt-1">{c.name}</h4>
                <p className="text-[9px] text-[var(--theme-text)]/50 mt-0.5">{c.district || district}, {c.state || state}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 14: CERTIFICATES & VERIFICATION */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="py-12 max-w-7xl mx-auto px-6 w-full border-b border-[var(--theme-border)] space-y-6">
        <div className="space-y-1 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center justify-center gap-2">
            <Award className="text-[var(--theme-primary)]" size={22} /> Verification & Trust Badges
          </h2>
          <p className="text-xs text-[var(--theme-text)]/60">Credentials verified by the THENIJOBS administration</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="theme-card-custom p-4 text-center border border-[var(--theme-border)] flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Check size={20} strokeWidth={3} />
            </div>
            <span className="text-xs font-black text-[var(--theme-text)]">GST Verified</span>
            <p className="text-[9px] text-[var(--theme-text)]/50">Tax registration active</p>
          </div>

          <div className="theme-card-custom p-4 text-center border border-[var(--theme-border)] flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Check size={20} strokeWidth={3} />
            </div>
            <span className="text-xs font-black text-[var(--theme-text)]">Email Verified</span>
            <p className="text-[9px] text-[var(--theme-text)]/50">Owner email address validated</p>
          </div>

          <div className="theme-card-custom p-4 text-center border border-[var(--theme-border)] flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Check size={20} strokeWidth={3} />
            </div>
            <span className="text-xs font-black text-[var(--theme-text)]">Phone Verified</span>
            <p className="text-[9px] text-[var(--theme-text)]/50">Helpline phone validated</p>
          </div>

          <div className="theme-card-custom p-4 text-center border border-[var(--theme-border)] flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Check size={20} strokeWidth={3} />
            </div>
            <span className="text-xs font-black text-[var(--theme-text)]">Profile Checked</span>
            <p className="text-[9px] text-[var(--theme-text)]/50">Business existence checked</p>
          </div>

          <div className="theme-card-custom p-4 text-center border border-[var(--theme-border)] flex flex-col items-center justify-center space-y-2 col-span-2 md:col-span-1">
            <span className="text-xl font-black text-[var(--theme-primary)]">{company.trustScore || 85}/100</span>
            <span className="text-xs font-black text-[var(--theme-text)]">Trust Index</span>
            <p className="text-[9px] text-[var(--theme-text)]/50">Based on data parameters</p>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* ENTERPRISE ONLY SECTIONS */}
      {/* ──────────────────────────────────────────────────────── */}
      {isEnterprise ? (
        <div className="w-full space-y-12">
          {/* APPOINTMENT BOOKING SLOT FORM */}
          <section id="appointment-booking" className="py-12 max-w-3xl mx-auto px-6 w-full border-b border-[var(--theme-border)] space-y-6 scroll-mt-20">
            <div className="text-center space-y-2">
              <span className="text-[9px] font-black text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Enterprise Feature</span>
              <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center justify-center gap-2">
                <Calendar className="text-[var(--theme-primary)]" size={22} /> Book Appointment Slot
              </h2>
              <p className="text-xs text-[var(--theme-text)]/60">Reserve a consultation slot directly with our advisors</p>
            </div>

            <div className="theme-card-custom p-6 border border-[var(--theme-border)] bg-gradient-to-br from-purple-500/5 to-transparent">
              {bookingSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <CheckCircle size={36} className="text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-extrabold text-[var(--theme-text)]">Appointment Request Received!</h4>
                  <p className="text-xs text-[var(--theme-text)]/70 max-w-sm mx-auto">Your booking request has been successfully registered. Click the WhatsApp button to alert our representatives immediately.</p>
                  <button
                    onClick={() => {
                      const text = formatWhatsAppMessage(company, { serviceName: bookingService, date: bookingDate, timeSlot: bookingTime, customerName: bookingName }, 'booking');
                      window.open(getCleanWhatsAppUrl(company.whatsapp || company.phone, text), '_blank');
                    }}
                    className="py-2.5 px-6 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <MessageCircle size={14} /> Send WhatsApp Alert
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Choose Service</label>
                    <select
                      value={bookingService}
                      onChange={(e) => setBookingService(e.target.value)}
                      required
                      className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                    >
                      <option value="">Select a service...</option>
                      {(company.services || []).map((srv: any, i: number) => (
                        <option key={i} value={srv.name || srv}>{srv.name || srv}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Preferred Date</label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Preferred Time Slot</label>
                      <select
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        required
                        className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                      >
                        <option value="">Choose slot...</option>
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="04:00 PM">04:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Rajesh"
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--theme-text)]/60">Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit number"
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        className="w-full p-3 text-xs bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text)] outline-none"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={bookingSubmitting} className="w-full py-3 theme-btn-primary text-xs font-bold uppercase tracking-wider">
                    {bookingSubmitting ? 'Booking slot...' : 'Reserve Slots Appointment'}
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* STAFF DIRECTORY */}
          <section className="py-12 max-w-7xl mx-auto px-6 w-full border-b border-[var(--theme-border)] space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] flex items-center justify-center gap-2">
                <Users size={22} className="text-[var(--theme-primary)]" /> Management & Staff Directory
              </h2>
              <p className="text-xs text-[var(--theme-text)]/60">Our organizational board & certified practitioners</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {(company.team || [
                { name: 'Dr. S. Eswaran', role: 'Chief Executive Officer', bio: '12+ years experience in corporate operations and strategy.' },
                { name: 'Mrs. K. Priya', role: 'Business Development Manager', bio: 'Handles client success and local community relations.' }
              ]).map((member: any, i: number) => (
                <div key={i} className="theme-card-custom p-5 flex gap-4 items-center border border-[var(--theme-border)]">
                  <div className="w-14 h-14 rounded-full bg-purple-600/10 flex items-center justify-center text-[var(--theme-primary)] text-xl font-bold shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--theme-text)]">{member.name}</h4>
                    <span className="text-[9px] font-black uppercase text-[var(--theme-primary)] block mt-0.5">{member.role}</span>
                    <p className="text-[10px] text-[var(--theme-text)]/60 mt-1.5 leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* TIMELINE */}
          <section className="py-12 max-w-3xl mx-auto px-6 w-full border-b border-[var(--theme-border)] space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] text-center">Business Timeline</h2>
            <div className="relative border-l border-[var(--theme-border)] ml-4 space-y-8 py-2">
              {[
                { year: '2018', title: 'Corporate Foundation', desc: 'Successfully started operations in Theni district.' },
                { year: '2021', title: 'Local expansion', desc: 'Expanded catalog to over 20+ products and services.' },
                { year: '2025', title: 'Digitalization Milestone', desc: 'Verified status and official website builder integration on THENIJOBS.' }
              ].map((item, i) => (
                <div key={i} className="relative pl-6">
                  <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[var(--theme-primary)]" />
                  <span className="text-[10px] font-black text-[var(--theme-primary)]">{item.year}</span>
                  <h4 className="text-xs font-bold text-[var(--theme-text)] mt-0.5">{item.title}</h4>
                  <p className="text-[10px] text-[var(--theme-text)]/65 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* MULTI-BRANCH LOCATIONS */}
          <section className="py-12 max-w-7xl mx-auto px-6 w-full border-b border-[var(--theme-border)] space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] text-center">Multi-Branch Locations</h2>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="theme-card-custom p-4 border border-[var(--theme-border)]">
                <span className="text-[10px] font-black text-[var(--theme-primary)] bg-[var(--theme-primary)]/10 px-2 py-0.5 rounded uppercase">Headquarters</span>
                <h4 className="text-xs font-bold text-[var(--theme-text)] mt-2">Theni Main Branch</h4>
                <p className="text-[10px] text-[var(--theme-text)]/60 mt-1">{displayAddress}</p>
              </div>
              <div className="theme-card-custom p-4 border border-[var(--theme-border)]">
                <span className="text-[10px] font-black text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded uppercase">Branch Office</span>
                <h4 className="text-xs font-bold text-[var(--theme-text)] mt-2">Madurai Branch</h4>
                <p className="text-[10px] text-[var(--theme-text)]/60 mt-1">10A, Bypass Road, Madurai, Tamil Nadu - 625001</p>
              </div>
            </div>
          </section>

          {/* AWARDS & CERTIFICATIONS */}
          <section className="py-12 max-w-7xl mx-auto px-6 w-full border-b border-[var(--theme-border)] space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text)] text-center">Awards & Recognition</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {[
                { title: 'Best Local SME Award 2024', issuer: 'Theni Chamber of Commerce' },
                { title: 'ISO 9001:2015 Quality Certified', issuer: 'Standardization Board' }
              ].map((award, i) => (
                <div key={i} className="theme-card-custom p-4 border border-[var(--theme-border)] text-center max-w-xs space-y-1.5">
                  <Award size={24} className="text-amber-500 mx-auto" />
                  <h4 className="text-xs font-bold text-[var(--theme-text)]">{award.title}</h4>
                  <p className="text-[9px] text-[var(--theme-text)]/50">{award.issuer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* Free Tier Upgrade teaser for gated features */
        <section className="py-8 max-w-7xl mx-auto px-6 w-full text-center">
          <div className="theme-card-custom p-6 border border-dashed border-[var(--theme-border)] max-w-md mx-auto space-y-3 bg-[var(--theme-card)]/30">
            <Lock size={20} className="text-purple-400 mx-auto" />
            <h4 className="text-xs font-black text-[var(--theme-text)]">Enterprise Capabilities Teaser</h4>
            <p className="text-[10px] text-[var(--theme-text)]/60">Upgrade to our Enterprise subscription plan to unlock Appointment Scheduling slots, custom PDF brochures, live chat widget, timelines and management directories.</p>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* MOBILE ACTION BUTTONS (FLOATING FOOTER BAR) */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--theme-card)]/90 backdrop-blur-md border-t border-[var(--theme-border)] py-3 px-4 flex justify-around items-center md:hidden gap-2">
        <a href={getCleanCallUrl(company.phone)} className="flex-1 flex flex-col items-center justify-center text-[var(--theme-text)] font-semibold text-[10px] min-h-[48px] hover:text-[var(--theme-primary)]">
          <Phone size={18} />
          <span className="mt-1">Call</span>
        </a>
        <a href={getCleanWhatsAppUrl(company.whatsapp || company.phone, 'Hello, I want to enquire.')} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center text-emerald-500 font-semibold text-[10px] min-h-[48px] hover:opacity-85">
          <MessageCircle size={18} />
          <span className="mt-1">WhatsApp</span>
        </a>
        <a href="#location-map" className="flex-1 flex flex-col items-center justify-center text-[var(--theme-text)] font-semibold text-[10px] min-h-[48px] hover:text-[var(--theme-primary)]">
          <MapPin size={18} />
          <span className="mt-1">Directions</span>
        </a>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: company.name, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Copied link!');
            }
          }}
          className="flex-1 flex flex-col items-center justify-center text-[var(--theme-text)] font-semibold text-[10px] min-h-[48px] hover:text-[var(--theme-primary)]"
        >
          <Share2 size={18} />
          <span className="mt-1">Share</span>
        </button>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex-1 flex flex-col items-center justify-center text-[var(--theme-text)] font-semibold text-[10px] min-h-[48px] hover:text-[var(--theme-primary)]"
        >
          <ArrowUp size={18} />
          <span className="mt-1">Top</span>
        </button>
      </div>

      {/* WhatsApp Floating Widget (Enterprise feature) */}
      {isEnterprise && (
        <a
          href={getCleanWhatsAppUrl(company.whatsapp || company.phone, `Hello ${company.name}, I want to chat.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all border border-white/20"
          title="WhatsApp Floating Widget"
        >
          <MessageCircle size={24} className="animate-pulse" />
        </a>
      )}

      {/* Simulated Live Chat (Enterprise feature) */}
      {isEnterprise && (
        <div className="fixed bottom-6 left-6 z-40">
          {chatOpen ? (
            <div className="w-72 h-96 rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] shadow-2xl flex flex-col overflow-hidden animate-fade-up">
              <div className="bg-[var(--theme-primary)] text-white p-3.5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-white">Live Office Support</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-white hover:text-gray-200">
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 no-scrollbar bg-[var(--theme-bg)]">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-2.5 rounded-2xl max-w-[85%] text-xs ${msg.sender === 'user' ? 'bg-[var(--theme-primary)] text-white' : 'bg-[var(--theme-card)] text-[var(--theme-text)] border border-[var(--theme-border)]'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-[var(--theme-text)]/40 mt-1">{msg.time}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-[var(--theme-border)] bg-[var(--theme-card)] flex gap-1">
                <input
                  type="text"
                  placeholder="Type query..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--theme-text)] outline-none"
                />
                <button onClick={handleSendMessage} className="p-2 bg-[var(--theme-primary)] text-white rounded-xl hover:opacity-90">
                  <Send size={12} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setChatOpen(true)}
              className="w-12 h-12 rounded-full bg-[var(--theme-primary)] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all border border-white/20"
              title="Live Chat Support"
            >
              <MessageCircle size={22} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
