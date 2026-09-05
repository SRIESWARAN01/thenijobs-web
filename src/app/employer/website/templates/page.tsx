'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe, Eye, Lock, Check, ChevronRight, ArrowLeft, Monitor, Laptop, Tablet, Smartphone,
  X, Loader2, Sparkles, Crown, Shield, Diamond, Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { createDocument, updateDocument } from '@/lib/firebase/firestoreService';
import { PORTFOLIO_TEMPLATES } from '@/lib/constants';
import { canAccessTemplate, getRequiredPlanForTemplate } from '@/lib/plans';
import type { PortfolioTemplate, PlanTier, PortfolioSite, PortfolioSection } from '@/lib/types/portfolio';
import { DEFAULT_THEME, DEVICE_SIZES } from '@/lib/types/portfolio';
import TemplateRenderer from '@/components/portfolio/TemplateRenderer';
import { Button, PageHeader, PageShell, Tabs } from '@/components/dashboard';

const PLAN_COLORS: Record<PlanTier, { bg: string; text: string; label: string; icon: any }> = {
  free: { bg: '#F3F4F6', text: '#6B7280', label: 'Free', icon: Shield },
  standard: { bg: '#ECFDF5', text: '#059669', label: 'Standard', icon: Crown },
  premium: { bg: '#FFFBEB', text: '#D97706', label: 'Premium', icon: Sparkles },
  enterprise: { bg: '#F5F3FF', text: '#7C3AED', label: 'Enterprise', icon: Diamond },
};

const FILTER_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Free', value: 'free' },
  { label: 'Standard', value: 'standard' },
  { label: 'Premium', value: 'premium' },
  { label: 'Enterprise', value: 'enterprise' },
];

export default function TemplateGalleryPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState<PortfolioTemplate | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'laptop' | 'tablet' | 'mobile'>('desktop');
  const [selecting, setSelecting] = useState(false);

  const { data: companies } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const company = companies?.[0];

  const { data: sites } = useCollection<any>('portfolioSites', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const currentSite = sites?.[0] as PortfolioSite | undefined;

  const planSlug = company?.planSlug || 'free';

  const filteredTemplates = PORTFOLIO_TEMPLATES.filter(t => filter === 'all' || t.plan === filter);

  const handleSelectTemplate = async (templateId: string) => {
    if (!user?.uid || !company) return;
    setSelecting(true);
    try {
      if (currentSite?.id) {
        // Update existing site
        await updateDocument('portfolioSites', currentSite.id, {
          templateId,
          updatedAt: new Date(),
        });
      } else {
        // Create new site
        const defaultSections: PortfolioSection[] = (
          PORTFOLIO_TEMPLATES.find(t => t.id === templateId)?.sections || []
        ).map((type, i) => ({
          id: `section-${type}-${Date.now()}`,
          type,
          title: type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' '),
          visible: true,
          order: i,
          data: {},
        }));

        await createDocument('portfolioSites', {
          ownerId: user.uid,
          ownerType: 'company',
          companyId: company.id,
          templateId,
          status: 'draft',
          visibility: 'private',
          googleIndex: false,
          customUrl: company.slug || '',
          theniJobsId: '',
          planSlug,
          theme: DEFAULT_THEME,
          branding: {
            logo: company.logoUrl || '',
            favicon: '',
            coverImage: company.coverImageUrl || '',
            companyName: company.name || '',
            tagline: company.tagline || '',
          },
          sections: defaultSections,
          seo: {
            title: `${company.name} - Portfolio`,
            description: company.description || '',
            keywords: [],
            ogImage: '',
            canonicalUrl: '',
            structuredDataType: 'LocalBusiness',
          },
          analytics: { totalViews: 0, uniqueVisitors: 0, enquiries: 0, lastViewedAt: null },
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedAt: null,
        });
      }
      setPreviewTemplate(null);
    } catch (err) {
      console.error('Failed to select template:', err);
    } finally {
      setSelecting(false);
    }
  };

  // Build a mock PortfolioSite for preview
  const buildPreviewSite = (template: PortfolioTemplate): PortfolioSite => ({
    id: 'preview',
    ownerId: user?.uid || '',
    ownerType: 'company',
    companyId: company?.id || '',
    templateId: template.id,
    status: 'draft',
    visibility: 'private',
    googleIndex: false,
    customUrl: '',
    theniJobsId: '',
    planSlug,
    theme: { ...DEFAULT_THEME, primaryColor: template.plan === 'enterprise' ? '#7C3AED' : template.plan === 'premium' ? '#D97706' : template.plan === 'standard' ? '#059669' : '#2563EB' },
    branding: {
      logo: company?.logoUrl || '',
      favicon: '',
      coverImage: '',
      companyName: company?.name || 'Your Company',
      tagline: company?.tagline || 'Professional services for your needs',
    },
    sections: template.sections.map((type, i) => ({
      id: `preview-${type}`,
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      visible: true,
      order: i,
      data: getMockData(type, company),
    })),
    seo: { title: '', description: '', keywords: [], ogImage: '', canonicalUrl: '', structuredDataType: 'LocalBusiness' },
    analytics: { totalViews: 0, uniqueVisitors: 0, enquiries: 0, lastViewedAt: null },
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: null,
  });

  return (
    <PageShell>
      <PageHeader
        title="Choose template"
        description={`${PORTFOLIO_TEMPLATES.length} templates available · ${canAccessTemplate(planSlug, 'ultimate-business-pro') ? 'All unlocked' : `${filteredTemplates.filter(t => canAccessTemplate(planSlug, t.id)).length} unlocked in your plan`}`}
        breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'Website', href: '/employer/website' }, { label: 'Templates' }]}
        actions={
          <Link href="/employer/website">
            <Button variant="secondary" size="icon" aria-label="Back to website">
              <ArrowLeft size={16} />
            </Button>
          </Link>
        }
      />

      <Tabs
        label="Template filter"
        value={filter}
        onChange={(v) => setFilter(v as typeof filter)}
        tabs={FILTER_TABS.map(t => ({ id: t.value, label: t.label }))}
      />

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map(template => {
          const isAccessible = canAccessTemplate(planSlug, template.id);
          const isCurrent = currentSite?.templateId === template.id;
          const planStyle = PLAN_COLORS[template.plan];
          const PlanIcon = planStyle.icon;

          return (
            <div key={template.id} className={`bg-white border overflow-hidden transition-all hover:shadow-lg ${isCurrent ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'}`} style={{ borderRadius: '16px' }}>
              {/* Template Preview Area */}
              <div className="relative h-44 flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${planStyle.bg}, #FFFFFF)` }}>
                <div className="text-center">
                  <Globe size={28} className="mx-auto" style={{ color: planStyle.text, opacity: 0.3 }} />
                  <p className="text-[10px] mt-1 font-medium" style={{ color: planStyle.text, opacity: 0.6 }}>{template.name}</p>
                </div>

                {/* Plan Badge */}
                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1" style={{ background: planStyle.bg, color: planStyle.text }}>
                  <PlanIcon size={10} /> {planStyle.label}
                </div>

                {/* Current Badge */}
                {isCurrent && (
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-blue-600 text-white text-[9px] font-bold flex items-center gap-1">
                    <Check size={10} /> Active
                  </div>
                )}

                {/* Lock Overlay */}
                {!isAccessible && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <Lock size={20} className="mx-auto text-slate-500 mb-1" />
                      <p className="text-[10px] font-bold text-gray-500">Upgrade to {template.plan.toUpperCase()}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-900">{template.name}</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">{template.bestFor}</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{template.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {template.features.slice(0, 3).map(f => (
                    <span key={f} className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-gray-50 text-gray-500 border border-gray-100">{f}</span>
                  ))}
                  {template.features.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-gray-50 text-gray-500">+{template.features.length - 3}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Eye size={13} /> Preview
                  </button>
                  {isAccessible ? (
                    <button
                      onClick={() => handleSelectTemplate(template.id)}
                      disabled={isCurrent || selecting}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${isCurrent ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      {selecting ? <Loader2 size={13} className="animate-spin" /> : isCurrent ? <><Check size={13} /> Active</> : <><Zap size={13} /> Select</>}
                    </button>
                  ) : (
                    <Link href="/employer/subscription" className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-500 flex items-center justify-center gap-1.5">
                      <Lock size={13} /> Upgrade
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewTemplate(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Preview Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{previewTemplate.name}</h3>
                <p className="text-[10px] text-gray-500">{previewTemplate.description}</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Device Switcher */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                  {([
                    { key: 'desktop', icon: Monitor },
                    { key: 'laptop', icon: Laptop },
                    { key: 'tablet', icon: Tablet },
                    { key: 'mobile', icon: Smartphone },
                  ] as const).map(d => {
                    const Icon = d.icon;
                    return (
                      <button key={d.key} onClick={() => setPreviewDevice(d.key)}
                        className={`p-1.5 rounded-md transition-all ${previewDevice === d.key ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-gray-600'}`}>
                        <Icon size={14} />
                      </button>
                    );
                  })}
                </div>
                {canAccessTemplate(planSlug, previewTemplate.id) && (
                  <button
                    onClick={() => handleSelectTemplate(previewTemplate.id)}
                    disabled={selecting}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5"
                  >
                    {selecting ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />} Use This Template
                  </button>
                )}
                <button onClick={() => setPreviewTemplate(null)} className="p-2 rounded-lg hover:bg-gray-100 text-slate-500">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto bg-gray-100 flex items-start justify-center p-6">
              <div className="bg-white shadow-xl overflow-auto transition-all duration-300" style={{
                width: DEVICE_SIZES[previewDevice].width,
                maxWidth: '100%',
                height: previewDevice === 'mobile' ? '680px' : previewDevice === 'tablet' ? '700px' : 'auto',
                borderRadius: '12px',
                border: '8px solid #1F2937',
              }}>
                <div style={{ transform: previewDevice === 'desktop' ? 'scale(0.7)' : previewDevice === 'laptop' ? 'scale(0.8)' : 'scale(1)', transformOrigin: 'top left', width: previewDevice === 'desktop' ? '142.8%' : previewDevice === 'laptop' ? '125%' : '100%' }}>
                  <TemplateRenderer site={buildPreviewSite(previewTemplate)} isPreview />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

// Mock data generator for template preview
function getMockData(sectionType: string, company?: any): any {
  const name = company?.name || 'Your Company';
  switch (sectionType) {
    case 'hero': return { headline: `Welcome to ${name}`, subheadline: 'Professional services tailored to your needs', ctaText: 'Get Started', ctaLink: '#contact', backgroundImage: '' };
    case 'about': return { content: `${name} is a leading company providing top-quality products and services. With years of experience, we are committed to delivering excellence to our customers.`, image: '', founded: '2020', industry: 'Business', employees: '50+', mission: 'Delivering excellence through innovation' };
    case 'services': return { items: [
      { id: '1', name: 'Web Development', description: 'Professional web solutions for your business needs', image: '', icon: '', ctaText: 'Learn More', ctaLink: '#', price: '' },
      { id: '2', name: 'Digital Marketing', description: 'Grow your business with targeted digital strategies', image: '', icon: '', ctaText: 'Learn More', ctaLink: '#', price: '' },
      { id: '3', name: 'Consulting', description: 'Expert guidance for your business decisions', image: '', icon: '', ctaText: 'Learn More', ctaLink: '#', price: '' },
    ]};
    case 'products': return { items: [
      { id: '1', name: 'Premium Package', description: 'Our best-selling package', image: '', price: '5,999', category: 'Featured', inStock: true, whatsappLink: '' },
      { id: '2', name: 'Standard Package', description: 'Great value for money', image: '', price: '2,999', category: 'Popular', inStock: true, whatsappLink: '' },
    ]};
    case 'contact': return { address: 'Theni, Tamil Nadu, India', phone: '+91 93605 19460', email: 'info@thenijobs.com', whatsapp: '919360519460', googleMapsEmbed: '', showForm: true, socialLinks: [] };
    case 'testimonials': return { items: [
      { id: '1', name: 'Raj Kumar', role: 'Business Owner', company: 'Tech Solutions', photo: '', content: 'Excellent service! They delivered exactly what we needed.', rating: 5 },
      { id: '2', name: 'Priya S', role: 'Manager', company: 'Local Business', photo: '', content: 'Very professional and reliable. Highly recommended!', rating: 5 },
    ]};
    case 'team': return { members: [
      { id: '1', name: 'Founder', role: 'CEO & Founder', photo: '', bio: '', socialLinks: [] },
      { id: '2', name: 'Team Lead', role: 'Operations Manager', photo: '', bio: '', socialLinks: [] },
    ]};
    case 'gallery': return { images: [] };
    case 'faq': return { items: [
      { id: '1', question: 'What services do you offer?', answer: 'We offer a wide range of professional services tailored to your business needs.' },
      { id: '2', question: 'How can I contact you?', answer: 'You can reach us via phone, WhatsApp, or email. Visit our contact section for details.' },
    ]};
    default: return {};
  }
}
