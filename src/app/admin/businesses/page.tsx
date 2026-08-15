'use client';

import { useState } from 'react';
import {
  Building2, Search, CheckCircle, XCircle,
  Star, Crown, MapPin, BadgeCheck, Clock, Loader2, Download,
  Phone, MessageCircle, AlertCircle, X, Send, Eye, RefreshCw,
  Globe, Mail, ShieldCheck, User, ExternalLink, FileText, Check
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { approveCompany, rejectCompany, featureCompany, updateDocument } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';

interface BusinessDoc {
  id: string;
  name: string;
  category?: string;
  district?: string;
  address?: string;
  ownerName?: string;
  contactPerson?: string;
  designation?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
  services?: string[];
  employeeCount?: string;
  verificationStatus?: 'pending' | 'under_review' | 'verified' | 'rejected';
  rejectionReason?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  createdAt?: any;
  description?: string;
  tagline?: string;
  proofType?: string;
  proofNumber?: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:      { bg: '#FFFBEB', text: '#D97706', label: 'Pending Verification' },
  under_review: { bg: '#EFF6FF', text: '#2563EB', label: 'Under Review' },
  verified:     { bg: '#ECFDF5', text: '#059669', label: 'Verified & Active' },
  rejected:     { bg: '#FEF2F2', text: '#DC2626', label: 'Rejected / Needs Revision' },
};

const TABS = ['All', 'Pending', 'Verified', 'Rejected', 'Featured'] as const;
const CATEGORIES = ['All Categories', 'Agriculture & Farming', 'Automobile & Transport', 'Banking & Finance', 'Construction & Real Estate', 'Education & Training', 'Healthcare & Hospital', 'Hotel, Food & Restaurant', 'IT, Software & Digital', 'Manufacturing & Industry', 'Retail, Shop & Supermarket', 'Textiles & Garments', 'Security & Facility', 'Professional & Business Services'];
const DISTRICTS = ['All Districts', 'Theni', 'Periyakulam', 'Cumbum', 'Bodinayakanur', 'Chinnamanur', 'Andipatti', 'Madurai', 'Dindigul', 'Chennai', 'Coimbatore'];

const BG_PALETTE = ['#EFF6FF','#ECFDF5','#FFFBEB','#F5F3FF','#FFF1F2','#F0F9FF'];
const COLOR_PALETTE = ['#2563EB','#059669','#D97706','#7C3AED','#E11D48','#0284C7'];

const QUICK_REJECTION_REASONS = [
  'Please provide a valid shop/office address in Theni district.',
  'Phone number was unreachable during verification check.',
  'Please submit MSME/Udyam or Shop License proof number.',
  'Duplicate company profile already exists.',
  'Business details and category are incomplete.'
];

export default function BusinessesPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const { data: businesses, loading } = useCollection<BusinessDoc>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Preview Modal State
  const [previewBiz, setPreviewBiz] = useState<BusinessDoc | null>(null);

  // Reject Modal State
  const [rejectingBiz, setRejectingBiz] = useState<BusinessDoc | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CO';
  const getColors = (name?: string) => {
    const idx = (name?.charCodeAt(0) || 0) % BG_PALETTE.length;
    return { bg: BG_PALETTE[idx], color: COLOR_PALETTE[idx] };
  };

  const pendingCount = businesses.filter(b => (b.verificationStatus || 'pending') === 'pending').length;
  const verifiedCount = businesses.filter(b => b.verificationStatus === 'verified').length;
  const premiumCount = businesses.filter(b => b.isPremium || b.isFeatured).length;

  const filtered = businesses.filter(biz => {
    const matchSearch = biz.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (biz.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (biz.contactPerson || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (biz.phone || '').includes(searchQuery);
    const status = biz.verificationStatus || 'pending';
    let matchTab = activeTab === 'All';
    if (activeTab === 'Featured') matchTab = !!biz.isFeatured;
    else if (activeTab === 'Verified') matchTab = status === 'verified';
    else if (activeTab !== 'All') matchTab = status === activeTab.toLowerCase();
    const matchCategory = categoryFilter === 'All Categories' || biz.category === categoryFilter;
    const matchDistrict = districtFilter === 'All Districts' || biz.district === districtFilter;
    return matchSearch && matchTab && matchCategory && matchDistrict;
  });

  const doApprove = async (biz: BusinessDoc) => {
    setActionLoading(biz.id);
    try {
      await approveCompany(biz.id, currentUser?.uid || 'admin');
      toast.success('Business Approved! 🎉', `${biz.name} is now verified. Employer access enabled.`);

      // Optional WhatsApp congratulatory trigger
      const cleanWa = (biz.whatsapp || biz.phone || '').replace(/[^0-9]/g, '');
      if (cleanWa) {
        const msg = `🎉 *CONGRATULATIONS FROM THENIJOBS!*\n\nYour business *"${biz.name}"* has been approved and verified.\n\nYou can now post jobs and manage applicants on https://thenijobs.com/employer/dashboard`;
        window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`, '_blank');
      }

      if (previewBiz?.id === biz.id) {
        setPreviewBiz({ ...previewBiz, verificationStatus: 'verified' });
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Approval failed', e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (biz: BusinessDoc) => {
    setRejectingBiz(biz);
    setRejectionReason(QUICK_REJECTION_REASONS[0]);
  };

  const handleConfirmReject = async (sendOnWhatsApp = false) => {
    if (!rejectingBiz) return;
    if (!rejectionReason.trim()) {
      toast.warning('Please enter a rejection reason.');
      return;
    }

    setActionLoading(rejectingBiz.id);
    try {
      await rejectCompany(rejectingBiz.id, currentUser?.uid || 'admin', rejectionReason.trim());
      toast.info('Application Rejected', `Reason saved for ${rejectingBiz.name}`);

      if (sendOnWhatsApp) {
        const cleanWa = (rejectingBiz.whatsapp || rejectingBiz.phone || '').replace(/[^0-9]/g, '');
        if (cleanWa) {
          const msg = `⚠️ *THENIJOBS Business Verification Update*\n\nRegarding your registration for *"${rejectingBiz.name}"*:\n\n*Status:* Requires Revision\n*Reason:* ${rejectionReason.trim()}\n\nPlease update your details and resubmit on https://thenijobs.com/seeker/become-employer`;
          window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`, '_blank');
        }
      }

      if (previewBiz?.id === rejectingBiz.id) {
        setPreviewBiz({ ...previewBiz, verificationStatus: 'rejected', rejectionReason: rejectionReason.trim() });
      }

      setRejectingBiz(null);
      setRejectionReason('');
    } catch (e: any) {
      console.error(e);
      toast.error('Rejection failed', e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const doToggleFeatured = async (id: string, cur?: boolean) => {
    setActionLoading(id);
    try {
      await featureCompany(id, !cur);
      toast.success(cur ? 'Removed from Featured' : 'Marked as Featured');
    } catch (e) { console.error(e); } finally { setActionLoading(null); }
  };

  const doTogglePremium = async (id: string, cur?: boolean) => {
    setActionLoading(id);
    try {
      await updateDocument('companies', id, { isPremium: !cur });
      toast.success(cur ? 'Removed Premium' : 'Marked as Premium Business');
    } catch (e) { console.error(e); } finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6 font-outfit text-gray-900 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">
          Business &amp; Employer Management
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Review employer applications, verify registrations, make calls &amp; WhatsApp verification
        </p>
      </div>

      {/* KPI stats matching Dashboard standard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { label: 'Total Businesses', value: businesses.length, icon: Building2, bg: '#EFF6FF', color: '#2563EB' },
          { label: 'Pending Review', value: pendingCount, icon: Clock, bg: '#FFFBEB', color: '#D97706' },
          { label: 'Verified & Active', value: verifiedCount, icon: BadgeCheck, bg: '#ECFDF5', color: '#059669' },
          { label: 'Premium / Featured', value: premiumCount, icon: Crown, bg: '#F5F3FF', color: '#7C3AED' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style={{ background: s.bg }}>
                  <Icon size={20} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 font-bold">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl bg-gray-100/80 overflow-x-auto no-scrollbar w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
            {tab === 'Pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-white text-[9px] font-black bg-amber-500">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Select Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by business name, phone, or contact person..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Business Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-blue-600 animate-spin" />
          <p className="text-xs text-gray-500 font-semibold">Loading business applications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-xs">
          <Building2 size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-700">No businesses match your filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(biz => {
            const bizStatus = biz.verificationStatus || 'pending';
            const st = STATUS_STYLES[bizStatus] || STATUS_STYLES.pending;
            const { bg, color } = getColors(biz.name);
            const cleanPhone = (biz.phone || '').replace(/[^0-9+]/g, '');
            const cleanWa = (biz.whatsapp || biz.phone || '').replace(/[^0-9]/g, '');

            return (
              <div
                key={biz.id}
                className={`bg-white rounded-3xl p-5 shadow-xs transition-all hover:shadow-md border flex flex-col justify-between gap-3.5 ${
                  bizStatus === 'pending' ? 'border-amber-300 ring-2 ring-amber-100/50' : 'border-gray-200'
                }`}
              >
                <div>
                  {/* Top Row: Avatar & Status */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow-xs"
                      style={{ background: bg, color }}
                    >
                      {getInitials(biz.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{biz.name}</h3>
                        {bizStatus === 'verified' && <BadgeCheck size={15} className="text-emerald-600 shrink-0" />}
                        {biz.isPremium && <Crown size={15} className="text-amber-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{biz.category || 'General'}</p>
                      <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1 font-medium">
                        <MapPin size={11} className="text-gray-400" /> {biz.district || 'Theni'}
                      </p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-extrabold flex-shrink-0"
                      style={{ background: st.bg, color: st.text }}
                    >
                      {st.label}
                    </span>
                  </div>

                  {/* Owner & Proof Info */}
                  <div className="bg-gray-50 rounded-2xl p-3 text-xs text-gray-700 space-y-1.5 mb-3 border border-gray-100 font-medium">
                    <p className="flex justify-between">
                      <span className="text-gray-500">Contact:</span>
                      <span className="font-bold text-gray-900">{biz.contactPerson || biz.ownerName || '—'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span className="font-mono font-bold text-gray-900">{biz.phone || '—'}</span>
                    </p>
                    {biz.proofNumber && (
                      <p className="flex justify-between">
                        <span className="text-gray-500">{biz.proofType || 'Govt Proof'}:</span>
                        <span className="font-mono text-[11px] font-bold text-blue-700">{biz.proofNumber}</span>
                      </p>
                    )}
                  </div>

                  {/* Rejection Note */}
                  {bizStatus === 'rejected' && biz.rejectionReason && (
                    <p className="text-[11px] text-red-700 bg-red-50 p-2.5 rounded-2xl border border-red-200 mb-3 leading-relaxed">
                      <strong>Rejection Note:</strong> {biz.rejectionReason}
                    </p>
                  )}

                  {/* Description */}
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {biz.description || biz.address || 'Local business registered on THENIJOBS.'}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {/* Direct Contact Buttons */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewBiz(biz)}
                      className="py-2 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Eye size={13} /> Details
                    </button>

                    {cleanPhone ? (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="py-2 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1 transition-all border border-indigo-200 cursor-pointer"
                      >
                        <Phone size={13} /> Call
                      </a>
                    ) : (
                      <span className="py-2 text-center text-[10px] text-gray-400">No Phone</span>
                    )}

                    {cleanWa ? (
                      <a
                        href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi ${biz.name}, this is THENIJOBS Admin regarding your business verification request.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
                        style={{ background: '#25D366' }}
                      >
                        <MessageCircle size={13} /> WhatsApp
                      </a>
                    ) : (
                      <span className="py-2 text-center text-[10px] text-gray-400">No WA</span>
                    )}
                  </div>

                  {/* Approval / Rejection Row */}
                  <div className="flex items-center gap-1.5">
                    {actionLoading === biz.id ? (
                      <div className="py-2 w-full text-center">
                        <Loader2 size={16} className="animate-spin text-blue-500 mx-auto" />
                      </div>
                    ) : (
                      <>
                        {bizStatus !== 'verified' && (
                          <button
                            type="button"
                            onClick={() => doApprove(biz)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                        )}
                        {bizStatus !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => openRejectModal(biz)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => doToggleFeatured(biz.id, biz.isFeatured)}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${biz.isFeatured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400 hover:text-amber-500'}`}
                          title={biz.isFeatured ? 'Remove Featured' : 'Feature Business'}
                        >
                          <Star size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => doTogglePremium(biz.id, biz.isPremium)}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${biz.isPremium ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400 hover:text-purple-500'}`}
                          title={biz.isPremium ? 'Remove Premium' : 'Make Premium'}
                        >
                          <Crown size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL BUSINESS PREVIEW MODAL */}
      {previewBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-outfit" onClick={() => setPreviewBiz(null)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-6 sm:p-8 space-y-5 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-100">
                  {getInitials(previewBiz.name)}
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">{previewBiz.name}</h2>
                  <p className="text-xs text-gray-500">{previewBiz.category} • {previewBiz.district}</p>
                </div>
              </div>
              <button onClick={() => setPreviewBiz(null)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {/* Banner preview if available */}
            {previewBiz.bannerUrl && (
              <div className="w-full h-36 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                <img src={previewBiz.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                <span className="text-gray-400 font-bold block">Contact Person</span>
                <span className="font-bold text-gray-900 text-sm">{previewBiz.contactPerson || previewBiz.ownerName || '—'}</span>
                <span className="text-[11px] text-gray-500 block">{previewBiz.designation || 'Owner / Representative'}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                <span className="text-gray-400 font-bold block">Calling &amp; WhatsApp</span>
                <span className="font-mono font-bold text-gray-900 text-sm">{previewBiz.phone || '—'}</span>
                <span className="text-[11px] text-gray-500 block">WA: {previewBiz.whatsapp || previewBiz.phone || '—'}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1 sm:col-span-2">
                <span className="text-gray-400 font-bold block">Office Address</span>
                <span className="font-semibold text-gray-900">{previewBiz.address || '—'}</span>
              </div>
              {previewBiz.proofNumber && (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 space-y-1 sm:col-span-2 text-blue-900">
                  <span className="text-blue-600 font-bold block">Government Verification Proof ({previewBiz.proofType})</span>
                  <span className="font-mono font-bold text-blue-950 text-sm">{previewBiz.proofNumber}</span>
                </div>
              )}
            </div>

            {/* Description & Services */}
            {previewBiz.description && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-700">About Business</span>
                <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100 leading-relaxed">
                  {previewBiz.description}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                {previewBiz.phone && (
                  <a
                    href={`tel:${previewBiz.phone}`}
                    className="py-2 px-3 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 flex items-center gap-1"
                  >
                    <Phone size={13} /> Call
                  </a>
                )}
                {previewBiz.phone && (
                  <a
                    href={`https://wa.me/${previewBiz.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                    style={{ background: '#25D366' }}
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {previewBiz.verificationStatus !== 'verified' && (
                  <button
                    type="button"
                    onClick={() => doApprove(previewBiz)}
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle size={14} /> Approve Business
                  </button>
                )}
                {previewBiz.verificationStatus !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => { setPreviewBiz(null); openRejectModal(previewBiz); }}
                    className="py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle size={14} /> Reject Application
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL WITH WHATSAPP NOTIFY */}
      {rejectingBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-outfit" onClick={() => setRejectingBiz(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 p-6 space-y-4 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <h3 className="font-bold text-gray-900 text-base">Reject Business Application</h3>
              </div>
              <button onClick={() => setRejectingBiz(null)} className="p-1 rounded-xl text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div>
              <p className="text-xs text-gray-600">
                Rejecting application for <strong className="text-gray-900">{rejectingBiz.name}</strong> ({rejectingBiz.phone}). Please specify why this application cannot be verified:
              </p>
            </div>

            {/* Quick Reason Suggestions */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-gray-500 uppercase">Quick Reason Suggestions:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REJECTION_REASONS.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRejectionReason(r)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 text-left border border-gray-200 transition-colors cursor-pointer"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Custom Rejection Reason / Instructions *</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Explain what details need to be updated..."
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 outline-none focus:bg-white focus:border-red-400 resize-none font-medium"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleConfirmReject(false)}
                className="py-2.5 px-3 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
              >
                Save &amp; Reject Only
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReject(true)}
                className="py-2.5 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                style={{ background: '#25D366' }}
              >
                <MessageCircle size={13} /> Reject &amp; WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
