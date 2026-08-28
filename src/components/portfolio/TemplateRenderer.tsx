'use client';

import dynamic from 'next/dynamic';
import type { PortfolioSite } from '@/lib/types/portfolio';

// Dynamic imports for all templates
const templates: Record<string, React.ComponentType<{ site: PortfolioSite }>> = {
  'seeker-modern-pro': dynamic(() => import('./templates/SeekerPortfolioRenderer')),
  'seeker-creative': dynamic(() => import('./templates/SeekerPortfolioRenderer')),
  'seeker-executive': dynamic(() => import('./templates/SeekerPortfolioRenderer')),
  'seeker-minimal': dynamic(() => import('./templates/SeekerPortfolioRenderer')),
  'classic-business': dynamic(() => import('./templates/ClassicBusiness')),
  'clean-corporate': dynamic(() => import('./templates/CleanCorporate')),
  'modern-services': dynamic(() => import('./templates/ModernServices')),
  'professional-company': dynamic(() => import('./templates/ProfessionalCompany')),
  'business-showcase': dynamic(() => import('./templates/BusinessShowcase')),
  'local-business-pro': dynamic(() => import('./templates/LocalBusinessPro')),
  'corporate-premium': dynamic(() => import('./templates/CorporatePremium')),
  'product-marketplace': dynamic(() => import('./templates/ProductMarketplace')),
  'service-marketplace': dynamic(() => import('./templates/ServiceMarketplace')),
  'executive-company': dynamic(() => import('./templates/ExecutiveCompany')),
  'creative-business': dynamic(() => import('./templates/CreativeBusiness')),
  'enterprise-corporate': dynamic(() => import('./templates/EnterpriseCorporate')),
  'luxury-brand': dynamic(() => import('./templates/LuxuryBrand')),
  'business-careers': dynamic(() => import('./templates/BusinessCareers')),
  'ultimate-business-pro': dynamic(() => import('./templates/UltimateBusinessPro')),
};

interface TemplateRendererProps {
  site: PortfolioSite;
  isPreview?: boolean;
}

export default function TemplateRenderer({ site, isPreview }: TemplateRendererProps) {
  // If this is a seeker portfolio or has seeker sections, prefer SeekerPortfolioRenderer
  const isSeeker = site.ownerType === 'seeker' ||
    site.templateId?.startsWith('seeker-') ||
    site.sections?.some(s => ['skills', 'experience', 'education'].includes(s.type));

  const Template = isSeeker
    ? (templates[site.templateId] || templates['seeker-modern-pro'])
    : (templates[site.templateId] || templates['classic-business']);


  if (!Template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Template not found</p>
          <p className="text-sm text-gray-500 mt-1">Template ID: {site.templateId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={isPreview ? 'pointer-events-none select-none' : ''}>
      <Template site={site} />
    </div>
  );
}
