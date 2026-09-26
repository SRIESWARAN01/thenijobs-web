'use client';

import { useState, useRef } from 'react';
import { ServiceItem } from '@/lib/types';
import { hasFeaturePermission } from '@/lib/plans';
import {
  Wrench, Plus, Trash2, Edit3, Lock, Sparkles,
  Phone, MessageCircle, Check, X, ExternalLink,
  Upload, Image as ImageIcon, Loader2, RefreshCw, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { requestAIService } from '@/lib/ai/aiClient';
import { useUploadFile } from '@/hooks/useStorage';
import { optimizeImageForUpload, validateImageFile } from '@/lib/storage/imageOptimizer';

interface CompanyServicesManagerProps {
  services: (ServiceItem | string)[];
  planSlug?: string;
  companyName?: string;
  companySlug?: string;
  phone?: string;
  whatsapp?: string;
  district?: string;
  onChange: (services: ServiceItem[]) => void;
}

const PLAN_SERVICE_LIMITS: Record<string, number> = {
  free: 3,
  basic: 3,
  standard: 10,
  premium: 50,
  enterprise: 999
};

export default function CompanyServicesManager({
  services = [],
  planSlug = 'free',
  companyName = 'Company',
  companySlug = '',
  phone = '9360519460',
  whatsapp = '9360519460',
  district = 'Theni',
  onChange,
}: CompanyServicesManagerProps) {
  const toast = useToast();
  const { user } = useAuth();
  const maxLimit = PLAN_SERVICE_LIMITS[planSlug.toLowerCase()] || 3;

  // Storage upload hook for service banners
  const { uploadFile, progress: uploadProgress, loading: uploading } = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [urlDraft, setUrlDraft] = useState('');

  // Normalize string[] or ServiceItem[] to ServiceItem[]
  const normalizedServices: ServiceItem[] = services.map((s, idx) => {
    if (typeof s === 'string') {
      return { id: `svc_${idx}`, name: s, category: 'Services', startingPrice: undefined };
    }
    return s;
  });

  const isLimitReached = normalizedServices.length >= maxLimit;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  const [form, setForm] = useState<Partial<ServiceItem>>({
    name: '',
    description: '',
    startingPrice: undefined,
    priceRange: '',
    category: '',
    imageUrl: '',
    bannerImageUrl: '',
    details: [''],
    keywords: [],
    websiteUrl: '',
    whatsappEnquiry: true,
    featured: false,
  });

  // Handle banner image file upload
  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1. Validate image (JPG, JPEG, PNG, WEBP, up to 10MB)
      validateImageFile(file, { maxBytes: 10 * 1024 * 1024, label: 'Service Banner' });

      // 2. Client-side compression to high-efficiency WebP (500KB-1.2MB target)
      toast.info('Compressing and optimizing service banner…');
      const optimized = await optimizeImageForUpload(file, {
        maxWidth: 1600,
        maxHeight: 900,
        quality: 0.84,
        maxInputBytes: 10 * 1024 * 1024,
        label: 'Service Banner',
      });

      // 3. Upload to Firebase Storage: services/{serviceId}/banner/{filename}
      const srvId = editingId || `svc_${Date.now()}`;
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
      const storagePath = `services/${srvId}/banner/${Date.now()}_${safeName}.webp`;

      const downloadUrl = await uploadFile(optimized, storagePath);
      setForm(prev => ({
        ...prev,
        imageUrl: downloadUrl,
        bannerImageUrl: downloadUrl,
      }));
      setUrlDraft(downloadUrl);
      toast.success('Service banner uploaded successfully!');
    } catch (err: any) {
      console.error('[Service banner upload error]', err);
      const isQuota =
        err?.code === 'storage/quota-exceeded' ||
        err?.message?.toLowerCase().includes('quota') ||
        err?.message?.includes('403');
      if (isQuota) {
        toast.error(
          'Image upload is temporarily unavailable because storage capacity has been reached. Please try again later.'
        );
      } else {
        toast.error(err?.message || 'Failed to upload service banner image.');
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle manual banner URL application
  const handleApplyBannerUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) {
      toast.warning('Please enter an image URL.');
      return;
    }
    if (!trimmed.startsWith('https://')) {
      toast.error('URL must begin with https:// for security.');
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      toast.error('Please enter a valid URL.');
      return;
    }
    setForm(prev => ({
      ...prev,
      imageUrl: trimmed,
      bannerImageUrl: trimmed,
    }));
    toast.success('Service banner URL applied!');
  };

  // Remove banner image
  const handleRemoveBanner = () => {
    setForm(prev => ({
      ...prev,
      imageUrl: '',
      bannerImageUrl: '',
    }));
    setUrlDraft('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Banner image removed.');
  };

  const handleSaveService = () => {
    if (!form.name?.trim()) {
      toast.warning('Please enter a service name.');
      return;
    }

    if (!editingId && isLimitReached) {
      toast.error(`Service Limit Reached (${maxLimit} Max)`, `Your current ${planSlug.toUpperCase()} plan allows up to ${maxLimit} services. Please upgrade to add more.`);
      return;
    }

    const cleanDetails = (form.details || []).filter(d => d && d.trim() !== '');
    const finalImageUrl = form.imageUrl || form.bannerImageUrl || '';

    if (editingId) {
      const updated = normalizedServices.map(s =>
        s.id === editingId
          ? {
              ...s,
              ...form,
              imageUrl: finalImageUrl,
              bannerImageUrl: finalImageUrl,
              details: cleanDetails,
              id: editingId,
            } as ServiceItem
          : s
      );
      onChange(updated);
      toast.success('Service updated successfully!');
    } else {
      const newItem: ServiceItem = {
        id: Date.now().toString(),
        name: form.name.trim(),
        description: form.description || '',
        startingPrice: form.startingPrice,
        priceRange: form.priceRange || '',
        category: form.category || 'Professional Services',
        imageUrl: finalImageUrl,
        bannerImageUrl: finalImageUrl,
        details: cleanDetails,
        websiteUrl: form.websiteUrl || '',
        whatsappEnquiry: form.whatsappEnquiry !== false,
        featured: form.featured === true,
      };
      onChange([...normalizedServices, newItem]);
      toast.success('New service added to your directory!');
    }

    resetForm();
  };

  const handleEdit = (s: ServiceItem) => {
    setEditingId(s.id);
    const existingImg = s.imageUrl || s.bannerImageUrl || '';
    setForm({
      ...s,
      imageUrl: existingImg,
      bannerImageUrl: existingImg,
      details: s.details && s.details.length > 0 ? s.details : ['']
    });
    setUrlDraft(existingImg);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this service?')) {
      onChange(normalizedServices.filter(s => s.id !== id));
      toast.info('Service removed.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      description: '',
      startingPrice: undefined,
      priceRange: '',
      category: '',
      imageUrl: '',
      bannerImageUrl: '',
      details: [''],
      keywords: [],
      websiteUrl: '',
      whatsappEnquiry: true,
      featured: false,
    });
    setUrlDraft('');
    setShowAddForm(false);
  };

  const handleGenerateDescription = async () => {
    if (!form.name?.trim() || aiGenerating) return;
    setAiGenerating(true);
    try {
      const res = await requestAIService<{ description?: string }>({
        feature: 'service_product_description',
        userId: user?.uid,
        userRole: 'COMPANY',
        payload: {
          companyName,
          category: form.category || 'General',
          district,
          keyDetails: `${form.name}${form.startingPrice ? ` -- Starting price: ₹${form.startingPrice}` : ''}`,
          contentType: 'service_product_description',
        },
      });

      if (!res.success || !res.data?.description) {
        toast.error(res.error || 'AI is temporarily unavailable. Please try again.');
        return;
      }

      setForm(prev => ({
        ...prev,
        description: res.data!.description!,
      }));
      toast.success('Generated service details with AI!');
    } catch {
      toast.error('AI assistant currently unavailable. Please write description manually.');
    } finally {
      setAiGenerating(false);
    }
  };

  const currentBanner = form.imageUrl || form.bannerImageUrl;

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Wrench size={18} className="text-blue-600" />
              Company Services &amp; Offerings
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {normalizedServices.length} / {maxLimit === 999 ? 'Unlimited' : maxLimit}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Showcase your business services, consulting packages, hourly rates, and booking options to customers across Tamil Nadu.
          </p>
        </div>

        {!showAddForm && (
          <button
            type="button"
            onClick={() => {
              if (isLimitReached) {
                toast.error(`Service Limit Reached (${maxLimit} Max)`, `Your current ${planSlug.toUpperCase()} plan allows up to ${maxLimit} services. Please upgrade to add more.`);
                return;
              }
              resetForm();
              setShowAddForm(true);
            }}
            disabled={isLimitReached}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              isLimitReached
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10 cursor-pointer'
            }`}
          >
            {isLimitReached ? <Lock size={14} /> : <Plus size={14} />}
            Add Service
          </button>
        )}
      </div>

      {/* Plan upgrade notice when limit reached */}
      {isLimitReached && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-900">
              Service Limit Reached ({maxLimit} Max on {planSlug.toUpperCase()} Plan)
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Upgrade your subscription to Standard, Premium, or Enterprise to list unlimited company services and featured catalog items.
            </p>
            <Link
              href="/employer/subscription"
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:underline"
            >
              View Upgrade Plans <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}

      {/* Add / Edit Form Panel */}
      {showAddForm && (
        <div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-6 space-y-5 animate-fade-in shadow-sm">
          <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Wrench size={16} className="text-blue-600" />
              {editingId ? 'Edit Service' : 'Add New Service'}
            </h4>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company-services-name" className="text-xs font-bold text-gray-700 block mb-1">Service Name *</label>
              <input
                id="company-services-name"
                type="text"
                value={form.name || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. GST Filing & Accounting / Solar Installation"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-base sm:text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label htmlFor="company-services-category" className="text-xs font-bold text-gray-700 block mb-1">Category</label>
              <input
                id="company-services-category"
                type="text"
                value={form.category || ''}
                onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Financial / Construction / Technical"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-base sm:text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="company-services-price" className="text-xs font-bold text-gray-700 block mb-1">Starting Price (₹) or Range</label>
              <input
                id="company-services-price"
                type="text"
                value={form.priceRange || (form.startingPrice ? `₹${form.startingPrice}` : '')}
                onChange={e => {
                  const val = e.target.value;
                  const num = Number(val.replace(/[^0-9]/g, ''));
                  setForm({ ...form, priceRange: val, startingPrice: isNaN(num) || num === 0 ? undefined : num });
                }}
                placeholder="e.g. Starts from ₹999 or ₹1,500/day"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-base sm:text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* ─── DUAL SERVICE BANNER SECTION: Upload Image OR Image URL ─── */}
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-blue-600" />
                  Service Banner Image
                </label>
                <span className="text-[11px] text-gray-500 font-medium">
                  Choose Upload or Web URL
                </span>
              </div>

              {/* Banner Preview if image exists */}
              {currentBanner ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs group">
                  <div className="w-full h-36 sm:h-44 bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={currentBanner}
                      alt={form.name || 'Service Banner Preview'}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white/95 text-slate-800 font-bold text-xs shadow-md flex items-center gap-1 hover:bg-white transition-colors cursor-pointer"
                    >
                      <RefreshCw size={12} /> Replace Image
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveBanner}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/95 text-white font-bold text-xs shadow-md flex items-center gap-1 hover:bg-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                  <div className="p-2.5 bg-white flex items-center justify-between text-[11px] text-slate-600 font-medium border-t border-slate-100">
                    <span className="truncate max-w-xs">{currentBanner}</span>
                    <button
                      type="button"
                      onClick={handleRemoveBanner}
                      className="text-rose-600 font-bold hover:underline shrink-0 ml-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                /* Dual choice when no banner is set */
                <div className="bg-white rounded-2xl border border-gray-200 p-3.5 space-y-3">
                  {/* Selector tabs */}
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        imageInputMode === 'upload'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Upload size={12} /> Upload Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        imageInputMode === 'url'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ExternalLink size={12} /> Image URL
                    </button>
                  </div>

                  {/* Mode 1: File Upload */}
                  {imageInputMode === 'upload' && (
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleBannerFileSelect}
                        className="hidden"
                        id="service-banner-file-input"
                      />
                      <label
                        htmlFor="service-banner-file-input"
                        className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          uploading
                            ? 'border-blue-300 bg-blue-50/50'
                            : 'border-gray-300 hover:border-blue-400 bg-gray-50/50 hover:bg-blue-50/30'
                        }`}
                      >
                        {uploading ? (
                          <>
                            <Loader2 size={24} className="animate-spin text-blue-600" />
                            <span className="text-xs font-bold text-blue-800">
                              Uploading banner ({uploadProgress}%)…
                            </span>
                            <div className="w-48 h-1.5 bg-blue-100 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload size={22} className="text-gray-400" />
                            <span className="text-xs font-bold text-gray-700">
                              Click to choose service banner image
                            </span>
                            <span className="text-[10px] text-gray-400">
                              PNG, JPG, or WebP up to 10 MB (auto-compressed to ~500KB-1.2MB)
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  )}

                  {/* Mode 2: Image URL */}
                  {imageInputMode === 'url' && (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={urlDraft}
                        onChange={e => setUrlDraft(e.target.value)}
                        placeholder="https://example.com/service-banner.jpg"
                        className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-base sm:text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleApplyBannerUrl}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                      >
                        Apply URL
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="company-services-booking" className="text-xs font-bold text-gray-700 block mb-1">Service Page / Booking Link (Optional)</label>
              <input
                id="company-services-booking"
                type="url"
                value={form.websiteUrl || ''}
                onChange={e => setForm({ ...form, websiteUrl: e.target.value })}
                placeholder="https://yourcompany.com/service-booking"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-base sm:text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="company-services-description" className="text-xs font-bold text-gray-700">Service Description</label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={!form.name?.trim() || aiGenerating}
                  aria-label="Generate service description with AI"
                  title={!form.name?.trim() ? 'Add a service name first' : 'Generate draft description with AI'}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Sparkles size={12} /> {aiGenerating ? 'Generating…' : 'Generate with AI'}
                </button>
              </div>
              <textarea
                id="company-services-description"
                rows={3}
                value={form.description || ''}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your service scope, turnaround time, guarantee, and client benefits..."
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-base sm:text-xs text-gray-900 outline-none focus:border-blue-500 font-medium resize-none leading-relaxed"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Key Inclusions / Highlights</label>
              {(form.details || ['']).map((det, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={det}
                    onChange={e => {
                      const copy = [...(form.details || [])];
                      copy[i] = e.target.value;
                      setForm({ ...form, details: copy });
                    }}
                    placeholder={`e.g. Free Inspection / 100% Genuine Spare Parts / 6-Month Warranty`}
                    className="flex-1 px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-base sm:text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
                  />
                  {(form.details || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const copy = (form.details || []).filter((_, idx) => idx !== i);
                        setForm({ ...form, details: copy });
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-xl border border-gray-200 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {(form.details || []).length < 5 && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, details: [...(form.details || []), ''] })}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <Plus size={12} /> Add Highlight
                </button>
              )}
            </div>

            <div className="sm:col-span-2 flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.whatsappEnquiry !== false}
                  onChange={e => setForm({ ...form, whatsappEnquiry: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <span className="text-xs font-semibold text-gray-700">Enable direct WhatsApp enquiry button</span>
              </label>

              {hasFeaturePermission(planSlug, 'featuredCompany') && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.featured === true}
                    onChange={e => setForm({ ...form, featured: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                    <Sparkles size={12} /> Feature this service on Marketplace Homepage
                  </span>
                </label>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-blue-200/60">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveService}
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check size={14} />
              {editingId ? 'Update Service' : 'Add to Services'}
            </button>
          </div>
        </div>
      )}

      {/* Services List / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {normalizedServices.length === 0 ? (
          <div className="col-span-full py-12 px-4 rounded-3xl border-2 border-dashed border-gray-200 text-center bg-gray-50/50">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Wrench size={24} />
            </div>
            <h4 className="text-sm font-bold text-gray-900">No Services Listed Yet</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
              Add your primary trade, repair, consulting, or corporate services to appear in the Theni Marketplace directory.
            </p>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
            >
              Add First Service
            </button>
          </div>
        ) : (
          normalizedServices.map((service) => {
            const banner = service.imageUrl || service.bannerImageUrl;
            return (
              <div
                key={service.id}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {banner && (
                  <div className="w-full h-32 bg-slate-100 overflow-hidden relative">
                    <img
                      src={banner}
                      alt={service.name}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                    {service.featured && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <Sparkles size={10} /> Featured
                      </span>
                    )}
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                          {service.category || 'Service'}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 mt-0.5">{service.name}</h4>
                      </div>
                      <div className="text-right shrink-0">
                        {service.startingPrice || service.priceRange ? (
                          <span className="text-xs font-extrabold text-emerald-600 block">
                            {service.priceRange || `Starts ₹${service.startingPrice}`}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {service.description && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>
                    )}

                    {service.details && service.details.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {service.details.map((d, i) => (
                          <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            • {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-xs">
                    <div className="flex items-center gap-2">
                      {service.whatsappEnquiry !== false && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <MessageCircle size={11} /> WhatsApp
                        </span>
                      )}
                      {service.websiteUrl && (
                        <a
                          href={service.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink size={10} /> Booking Link
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(service)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit Service"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(service.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Service"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
