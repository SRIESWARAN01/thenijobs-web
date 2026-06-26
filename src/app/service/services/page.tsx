'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import {
  Plus, Edit2, Loader2, Search, Wrench, Check, X,
  Sparkles, MapPin, ClipboardList, Info,
  Lock, ChevronRight, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { createDocument, updateDocument } from '@/lib/firebase/firestoreService';
import { LAUNCH_DISTRICT, THENI_LAUNCH_LOCATIONS } from '@/lib/types';
import { getCompanyActivePlan } from '@/lib/subscriptions';
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptionPlans';

interface ServiceDoc {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  district: string;
  location: string;
  status: 'pending' | 'active' | 'rejected';
  isFeatured: boolean;
  providerId: string;
  viewCount?: number;
  uniqueVisitorCount?: number;
  whatsappClickCount?: number;
  callClickCount?: number;
  shareCount?: number;
  enquiryCount?: number;
}

const STATUS_CONFIG = {
  pending: { label: 'Pending Approval', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  active: { label: 'Active / Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  rejected: { label: 'Rejected', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' }
};

export default function ServiceProviderServicesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDoc | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    location: '',
  });

  // 1. Fetch company / profile to check if setup is complete
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // Compute active subscription plan badge (free, basic / Standard, premium)
  const subscriptionBadge = getCompanyActivePlan(company);

  // 2. Fetch service provider's services
  const { data: services, loading: servicesLoading } = useCollection<any>('services', [
    where('providerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const limit = SUBSCRIPTION_PLANS.find(p => p.slug === subscriptionBadge)?.serviceLimit ?? 0;
  const reachedLimit = limit !== -1 && services.length >= limit;

  const handleOpenAddModal = () => {
    if (reachedLimit) {
      alert(`Service limit reached. Your plan allows up to ${limit} services. Please upgrade your subscription.`);
      return;
    }
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      location: company?.location || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: ServiceDoc) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      category: service.category,
      location: service.location,
    });
    setIsModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    if (!editingService && reachedLimit) {
      alert(`Service limit reached! Your plan allows a maximum of ${limit} services. Please upgrade your subscription.`);
      return;
    }

    setActionLoading('save');
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        district: LAUNCH_DISTRICT,
        location: formData.location,
        providerId: user.uid,
      };

      if (editingService) {
        // According to security rules, keep status & isFeatured unchanged for provider edits
        await updateDocument('services', editingService.id, {
          ...payload,
          status: editingService.status,
          isFeatured: editingService.isFeatured,
        });
        alert('Service listing updated successfully!');
      } else {
        // New service must start as pending & isFeatured = false
        await createDocument('services', {
          ...payload,
          status: 'pending',
          isFeatured: false,
          createdAt: new Date(),
        });
        alert('Service listing submitted successfully! It is now pending admin approval.');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save service');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = services.filter((s: any) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === 'active') return matchesSearch && s.status === 'active';
    if (activeTab === 'pending') return matchesSearch && s.status === 'pending';
    return matchesSearch;
  });

  const loading = companyLoading || servicesLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <Wrench size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold">Setup Portfolio Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please setup your service provider portfolio profile first to add and manage your service listings.</p>
        <Link href="/employer/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold hover:opacity-90">
          Setup Portfolio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Services</h1>
          <p className="text-sm text-gray-400 mt-1 font-outfit">Manage the services you offer to local clients in {LAUNCH_DISTRICT}</p>
          {!loading && (
            <p className="text-xs text-rose-455 font-semibold mt-1">
              Active: {services.length} / {limit} services limit ({subscriptionBadge === 'free' ? 'Free Plan' : subscriptionBadge === 'basic' ? 'Standard Plan' : 'Premium Plan'})
            </p>
          )}
        </div>
        <button
          onClick={handleOpenAddModal}
          disabled={reachedLimit}
          className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity ${reachedLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Plus size={16} /> Add Service Listing
        </button>
      </div>

      {reachedLimit && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-550/10 text-xs text-amber-300 font-semibold flex items-center gap-2">
          <ShieldAlert size={14} className="text-amber-400" />
          Service listing limit reached ({services.length}/{limit}). Please delete existing services or upgrade your plan.
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-rose-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading services...</p>
        </div>
      ) : (
        <>
          {/* Tabs & Search */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-x-auto no-scrollbar max-w-xs">
              {(['all', 'active', 'pending'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                    activeTab === tab
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-rose-500/40 outline-none transition-all"
              />
            </div>
          </div>

          {/* List Area */}
          {filtered.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Wrench size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No service listings found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((service: ServiceDoc) => {
                const statusCfg = STATUS_CONFIG[service.status] || STATUS_CONFIG.pending;
                return (
                  <div key={service.id} className="glass-card rounded-2xl p-5 hover:border-white/15 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                        <Wrench size={20} className="text-rose-400" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white">{service.name}</h3>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                            {statusCfg.label}
                          </span>
                          {service.isFeatured && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Sparkles size={8} /> Featured
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">{service.description}</p>

                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-rose-500" /> {service.location}, {service.district}</span>
                          <span className="flex items-center gap-1"><ClipboardList size={12} className="text-rose-500" /> Category: {service.category}</span>
                          <span className="text-sm font-bold text-white">Estimated cost: ₹{service.price}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] border-t border-white/5 pt-2 text-gray-400">
                          <span>Views: <strong className="text-white">{service.viewCount || 0}</strong> ({service.uniqueVisitorCount || 0} unique)</span>
                          <span>•</span>
                          <span>WhatsApp Clicks: <strong className="text-green-400 font-bold">{service.whatsappClickCount || 0}</strong></span>
                          <span>•</span>
                          <span>Calls: <strong className="text-cyan-400 font-medium">{service.callClickCount || 0}</strong></span>
                          <span>•</span>
                          <span>Shares: <strong className="text-slate-300">{service.shareCount || 0}</strong></span>
                          <span>•</span>
                          <span>Bookings: <strong className="text-amber-400 font-bold">{service.enquiryCount || 0}</strong></span>
                          <span>•</span>
                          <span className="text-rose-400 font-bold">
                            Conv. Rate: {(service.viewCount || 0) > 0 ? ((( (service.whatsappClickCount || 0) + (service.callClickCount || 0) + (service.enquiryCount || 0) ) / (service.viewCount || 1)) * 100).toFixed(1) : '0'}%
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0">
                        <button
                          onClick={() => handleOpenEditModal(service)}
                          className="px-3.5 py-2 rounded-xl border border-white/[0.08] hover:border-rose-500/30 text-gray-400 hover:text-rose-300 bg-white/[0.02] text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <Edit2 size={12} /> Edit Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e0e22] border border-white/[0.08] rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles size={16} className="text-rose-400" />
                {editingService ? 'Edit Service Listing' : 'Add New Service Listing'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 overflow-y-auto space-y-4 no-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Service Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-rose-500/45 focus:bg-white/[0.06] outline-none transition-all"
                    placeholder="E.g. Professional Electrical Wiring & Fitting"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-rose-500/45 focus:bg-white/[0.06] outline-none transition-all resize-none leading-relaxed"
                    placeholder="Describe what is included in your service, your experience, tools used, and safety measures..."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Estimated Cost / Starting Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.price}
                      onChange={(e) => setFormData(p => ({ ...p, price: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-rose-500/45 focus:bg-white/[0.06] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Service Category *</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-rose-500/45 focus:bg-white/[0.06] outline-none transition-all"
                      placeholder="E.g. Electrical, Plumbing, Tutoring"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Service Location *</label>
                  <select
                    required
                    value={formData.location}
                    onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-rose-500/45 focus:bg-white/[0.06] outline-none transition-all bg-[#0e0e22]"
                  >
                    <option value="">Select Area / Town</option>
                    {THENI_LAUNCH_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-3">
                  <Info size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    New services and major edits are sent to the admin team for approval to maintain directory quality. Approved listings appear instantly on the public services board.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="submit"
                  disabled={actionLoading === 'save'}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading === 'save' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  {editingService ? 'Update Listing' : 'Submit Listing'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl bg-white/[0.06] text-gray-400 text-xs font-medium hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
