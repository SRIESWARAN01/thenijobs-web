'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe, Eye, Edit3, Palette, Settings2, ExternalLink,
  Loader2, Plus, Lock, Sparkles, BarChart3, QrCode,
  Share2, Copy, Check, ArrowUpRight, Zap, Shield, Crown,
  Building2, BadgeCheck, MessageSquare, Bot, AlertTriangle,
  Stethoscope, GraduationCap, Factory, Code2, Sprout,
  UtensilsCrossed, ShoppingBag, Wrench, Landmark, Store,
  Send, FileText, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { useCollection } from '@/hooks/useFirestore';
import { where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { INDUSTRY_THEMES, type IndustryTemplateKey } from '@/components/company/CompanyLandingWebsite';

export default function EmployerWebsitePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [copiedStandard, setCopiedStandard] = useState(false);
  const [copiedLanding, setCopiedLanding] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string>('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // AI Assistant Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedStory, setAiGeneratedStory] = useState('');
  const [aiGeneratedFaqs, setAiGeneratedFaqs] = useState<{ q: string; a: string }[]>([]);
  const [aiGeneratedSeo, setAiGeneratedSeo] = useState({ title: '', desc: '', keywords: '' });

  // Fetch company
  const { data: companies, loading: compLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const company = companies?.[0];

  const planSlug = (company?.subscriptionPlan || 'free').toLowerCase();
  const companySlug = company?.slug || '';
  const standardProfileUrl = companySlug ? `https://thenijobs.com/company/${companySlug}` : '';
  const landingWebsiteUrl = companySlug ? `https://thenijobs.com/${companySlug}` : '';

  const isVerified = company?.verificationStatus === 'verified' || company?.isVerified === true;
  const currentTemplate = company?.templateId || 'local-business';

  const handleCopy = (text: string, type: 'standard' | 'landing') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'standard') {
      setCopiedStandard(true);
      setTimeout(() => setCopiedStandard(false), 2000);
    } else {
      setCopiedLanding(true);
      setTimeout(() => setCopiedLanding(false), 2000);
    }
  };

  const handleSelectTemplate = async (templateKey: string) => {
    if (!company?.id) return;
    setSavingTemplate(true);
    try {
      await updateDoc(doc(db, 'companies', company.id), {
        templateId: templateKey,
        updatedAt: new Date().toISOString(),
      });
      setActiveTemplate(templateKey);
      toast.success(`Template updated to ${INDUSTRY_THEMES[templateKey as IndustryTemplateKey]?.name || templateKey}!`);
    } catch (err: any) {
      toast.error('Failed to update template: ' + err.message);
    } finally {
      setSavingTemplate(false);
    }
  };

  const runAIAssistant = () => {
    if (!company) return;
    setAiLoading(true);
    setAiModalOpen(true);

    setTimeout(() => {
      const cName = company.name || 'Our Company';
      const cCategory = company.category || 'Local Business';
      const cLocation = company.district || 'Theni';

      const story = `${cName} is a premier ${cCategory} situated in ${cLocation}, Tamil Nadu. Dedicated to providing dependable quality, client satisfaction, and professional excellence, we combine modern industry standards with attentive customer care. Through THENIJOBS, we proudly foster career opportunities for skilled local talent.`;

      const faqs = [
        {
          q: `What services does ${cName} offer in ${cLocation}?`,
          a: `${cName} specializes in high-quality ${cCategory} solutions customized to meet the requirements of both residential and commercial clients across ${cLocation}.`
        },
        {
          q: `How can job seekers apply for open vacancies at ${cName}?`,
          a: `Candidates can browse our verified career openings directly on our THENIJOBS official landing website and submit their resume in one click.`
        },
        {
          q: `What are the operating hours and location of ${cName}?`,
          a: `We are located in ${cLocation}, Tamil Nadu, operating Monday through Saturday from 9:00 AM to 8:00 PM.`
        }
      ];

      const seo = {
        title: `${cName} – ${cCategory} in ${cLocation} | THENIJOBS Official Website`,
        desc: `Visit the official website of ${cName} in ${cLocation}. Discover top ${cCategory} services, client reviews, and apply for open career opportunities.`,
        keywords: `${cName}, ${cCategory} in ${cLocation}, Theni jobs, ${cName} careers, Tamil Nadu business`
      };

      setAiGeneratedStory(story);
      setAiGeneratedFaqs(faqs);
      setAiGeneratedSeo(seo);
      setAiLoading(false);
    }, 750);
  };

  const handleApplyAISuggestions = async () => {
    if (!company?.id) return;
    try {
      await updateDoc(doc(db, 'companies', company.id), {
        aboutStory: aiGeneratedStory,
        faqs: aiGeneratedFaqs,
        seoTitle: aiGeneratedSeo.title,
        seoDescription: aiGeneratedSeo.desc,
        seoKeywords: aiGeneratedSeo.keywords,
        updatedAt: new Date().toISOString(),
      });
      toast.success('AI suggestions applied to your website!');
      setAiModalOpen(false);
    } catch (err: any) {
      toast.error('Failed to apply suggestions: ' + err.message);
    }
  };

  if (compLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-500">Loading website manager...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Two-Layer Company Website Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your business is published across two distinct experiences: a high-speed Directory Profile and a standalone Landing Website.
          </p>
        </div>

        <button
          type="button"
          onClick={runAIAssistant}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Bot size={15} /> AI Content Generator
        </button>
      </div>

      {/* ── Verification Notice ── */}
      {!isVerified && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-900">Verification Pending</p>
            <p className="text-amber-700 mt-0.5">
              Only verified companies with verified phone numbers receive full Google indexing and public trust badges. You can still preview your live landing website below.
            </p>
          </div>
        </div>
      )}

      {/* ── Two Website URL Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Layer 1: Standard Company Profile */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 size={18} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Layer 1</span>
                <h2 className="text-base font-bold text-slate-900">Standard Directory Profile</h2>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700">
              Directory Card
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Clean, tabbed company card with quick contact buttons, Google Maps location, active jobs, and verified rating badge.
          </p>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-700 truncate">{standardProfileUrl || 'Generating URL...'}</span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(standardProfileUrl, 'standard')}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                title="Copy Link"
              >
                {copiedStandard ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
              {standardProfileUrl && (
                <a
                  href={`/company/${companySlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-blue-600 transition-colors"
                  title="Visit Profile"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Layer 2: Professional Company Landing Website */}
        <div className="bg-white rounded-3xl p-6 border-2 border-indigo-200 shadow-xs space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-bl-xl uppercase tracking-wider">
            Standalone Landing Site
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Globe size={18} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500">Layer 2 (Primary)</span>
                <h2 className="text-base font-bold text-slate-900">Professional Landing Website</h2>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Unique, standalone landing page with industry hero banner, company story, services, live careers pipeline, FAQs, and WhatsApp lead form.
          </p>

          <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold text-indigo-900 truncate">{landingWebsiteUrl || 'Generating URL...'}</span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(landingWebsiteUrl, 'landing')}
                className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-700 transition-colors"
                title="Copy Link"
              >
                {copiedLanding ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
              {landingWebsiteUrl && (
                <a
                  href={`/${companySlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-700 transition-colors"
                  title="Visit Website"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── 10 Industry-Specific Category Templates Library ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Industry Category Template Library</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the optimal visual theme and layout tailored for your business category.
            </p>
          </div>
          {savingTemplate && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">
              <Loader2 size={13} className="animate-spin" /> Saving template...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {(Object.keys(INDUSTRY_THEMES) as IndustryTemplateKey[]).map((key) => {
            const tmpl = INDUSTRY_THEMES[key];
            const Icon = tmpl.icon;
            const isSelected = (activeTemplate || currentTemplate) === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectTemplate(key)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs" style={{ background: tmpl.primary }}>
                    <Icon size={16} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{tmpl.name}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-2">{tmpl.heroBadge}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="font-bold" style={{ color: tmpl.accentText }}>
                    {isSelected ? '✓ Active Theme' : 'Click to Apply'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── AI Assistant Modal ── */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">AI Company Website Generator</h3>
                  <p className="text-xs text-slate-500">Auto-craft compelling story, FAQs, and local SEO</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* AI Fact Guardrail Alert */}
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900">
              <Shield size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Verification Rule:</strong> AI-generated content (establishment date, awards, specialties) must be checked and confirmed by you before publishing.
              </span>
            </div>

            {aiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="animate-spin text-purple-600" />
                <p className="text-xs font-bold text-slate-600">Synthesizing local SEO &amp; company story...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs max-h-96 overflow-y-auto pr-1">
                {/* About Story */}
                <div>
                  <label htmlFor="employer-website-company-story-and-about-us" className="font-bold text-slate-700 block mb-1">Company Story &amp; About Us</label>
                  <textarea id="employer-website-company-story-and-about-us"
                    rows={3}
                    value={aiGeneratedStory}
                    onChange={e => setAiGeneratedStory(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-base sm:text-xs text-slate-900"
                  />
                </div>

                {/* SEO Metadata */}
                <div className="space-y-2">
                  <label htmlFor="employer-website-dynamic-local-seo-title-and-description" className="font-bold text-slate-700 block">Dynamic Local SEO Title &amp; Description</label>
                  <input id="employer-website-dynamic-local-seo-title-and-description"
                    type="text"
                    value={aiGeneratedSeo.title}
                    onChange={e => setAiGeneratedSeo({ ...aiGeneratedSeo, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-base sm:text-xs text-slate-900"
                    placeholder="SEO Title"
                  />
                  <textarea
                    rows={2}
                    value={aiGeneratedSeo.desc}
                    onChange={e => setAiGeneratedSeo({ ...aiGeneratedSeo, desc: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-base sm:text-xs text-slate-900"
                    aria-label="Meta Description" placeholder="Meta Description"
                  />
                </div>

                {/* FAQs */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Generated FAQs (3)</label>
                  {aiGeneratedFaqs.map((faq, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-800">Q: {faq.q}</p>
                      <p className="text-slate-600">A: {faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={aiLoading}
                onClick={handleApplyAISuggestions}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
              >
                Apply to My Official Website
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
