'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Globe, Eye, QrCode, CreditCard, Shield, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import type { PortfolioSite } from '@/lib/types/portfolio';
import TheniJobsIdCard from '@/components/identity/TheniJobsIdCard';
import QRCodeCard from '@/components/identity/QRCodeCard';

export default function WebsiteSettingsPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: companies } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const company = companies?.[0];

  const { data: sites, loading } = useCollection<any>('portfolioSites', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const initialSite = sites?.[0] as PortfolioSite | undefined;

  const [site, setSite] = useState<PortfolioSite | null>(null);

  useEffect(() => {
    if (initialSite && !site) setSite(initialSite);
  }, [initialSite, site]);

  const handleSave = async () => {
    if (!site?.id) return;
    setSaving(true);
    try {
      await updateDocument('portfolioSites', site.id, {
        customUrl: site.customUrl,
        googleIndex: site.googleIndex,
        visibility: site.visibility,
        seo: site.seo,
        updatedAt: new Date(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Globe size={32} className="text-slate-500" />
        <p className="text-sm text-gray-500">No website found. Please select a template first.</p>
        <Link href="/employer/website/templates" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">
          Choose Template
        </Link>
      </div>
    );
  }

  const siteUrl = `https://thenijobs.com/portfolio/${site.customUrl}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/employer/website" className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Website Settings
            </h1>
            <p className="text-xs text-gray-500">Manage URL, Google SEO visibility, digital ID cards, and QR codes</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-sm"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Settings
        </button>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <Check size={16} /> Settings saved successfully!
        </div>
      )}

      {/* Grid Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column — URL & SEO */}
        <div className="space-y-6">
          {/* Custom URL */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Globe size={16} className="text-blue-600" /> Public Website URL
            </h3>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Username / Slug</label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden text-xs">
                <span className="bg-gray-50 px-3 py-2 text-slate-500 border-r border-gray-200">thenijobs.com/portfolio/</span>
                <input
                  type="text"
                  value={site.customUrl}
                  onChange={e => setSite({ ...site, customUrl: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="flex-1 px-3 py-2 font-mono text-gray-900 font-semibold focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">Unique URL for sharing your website. Only letters, numbers, and hyphens.</p>
          </div>

          {/* Search Indexing */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Eye size={16} className="text-blue-600" /> Search Engine Visibility
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">Google Search Indexing</p>
                <p className="text-[10px] text-gray-500">Allow Google & Bing to discover your website</p>
              </div>
              <button
                onClick={() => setSite({ ...site, googleIndex: !site.googleIndex })}
                className={`w-11 h-6 rounded-full transition-all relative ${site.googleIndex ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${site.googleIndex ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            {!site.googleIndex && (
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 text-[10px] flex items-center gap-1.5">
                <AlertCircle size={12} className="flex-shrink-0" /> Site includes noindex tag. Search engines won&apos;t list it.
              </div>
            )}
          </div>

          {/* SEO Details */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Shield size={16} className="text-blue-600" /> Meta Tags
            </h3>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Page Title</label>
              <input
                type="text"
                value={site.seo?.title || ''}
                onChange={e => setSite({ ...site, seo: { ...site.seo, title: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-xs"
              />
            </div>
            <div>
              <label htmlFor="employer-website-settings-page-description" className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Page Description</label>
              <textarea id="employer-website-settings-page-description"
                value={site.seo?.description || ''}
                onChange={e => setSite({ ...site, seo: { ...site.seo, description: e.target.value } })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column — Identity Cards & QR */}
        <div className="space-y-6">
          {/* Digital Visiting Card Preview */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CreditCard size={16} className="text-blue-600" /> Digital Visiting Card
            </h3>
            <TheniJobsIdCard
              name={company?.name || site.branding.companyName || 'Company Name'}
              theniJobsId={site.theniJobsId || 'TJ-C-00001'}
              registrationNumber="TNJ-2026-00001"
              roleOrTagline={company?.tagline || site.branding.tagline || 'Company'}
              logoUrl={company?.logoUrl || site.branding.logo}
              plan={company?.planSlug || 'free'}
              district={company?.district || 'Theni'}
              phone={company?.phone}
              email={company?.email}
              portfolioUrl={siteUrl}
            />
          </div>

          {/* QR Code Export */}
          <QRCodeCard
            url={siteUrl}
            title="Portfolio QR Code"
            subtitle="Scan with smartphone to open public website"
            theniJobsId={site.theniJobsId || 'TJ-C-00001'}
          />
        </div>
      </div>
    </div>
  );
}
