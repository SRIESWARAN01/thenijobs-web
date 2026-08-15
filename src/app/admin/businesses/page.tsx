'use client';

import { useState } from 'react';
import {
  Building2, Search, CheckCircle, XCircle,
  Star, Crown, MapPin, BadgeCheck, Clock, Loader2, Download,
  Phone, MessageCircle, AlertCircle, X, Send, Eye, RefreshCw
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
  phone?: string;
  whatsapp?: string;
  email?: string;
  verificationStatus?: 'pending' | 'under_review' | 'verified' | 'rejected';
  rejectionReason?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  createdAt?: any;
  description?: string;
  proofType?: string;
  proofNumber?: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:      { bg: '#FFFBEB', text: '#D97706', label: 'Pending Verification' },
  under_review: { bg: '#EFF6FF', text: '#2563EB', label: 'Under Review' },
  verified:     { bg: '#ECFDF5', text: '#059669', label: 'Verified & Active' },
  rejected:     { bg: '#FEF2F2', text: '#DC2626', label: 'Rejected' },
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
    <div className="p-4 sm:p-6 space-y-5 font-outfit" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Business &amp; Employer Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review employer applications, verify registrations, make calls &amp; WhatsApp verification
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Businesses', value: businesses.length, icon: Building2, bg: '#EFF6FF', color: '#2563EB' },
          { label: 'Pending Review', value: pendingCount, icon: Clock, bg: '#FFFBEB', color: '#D97706' },
          { label: 'Verified & Active', value: verifiedCount, icon: BadgeCheck, bg: '#ECFDF5', color: '#059669' },
          { label: 'Premium / Featured', value: premiumCount, icon: Crown, bg: '#F5F3FF', color: '#7C3AED' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}>
            {tab}
            {tab === 'Pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-white text-[9px] font-bold bg-amber-500">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by business name, phone, or owner..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none cursor-pointer">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none cursor-pointer">
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Business cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading businesses...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl flex flex-col items-center justify-center py-16 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            <Building2 size={28} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No businesses found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search</p>
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
              <div key={biz.id} className={`bg-white rounded-3xl p-5 shadow-sm transition-all hover:shadow-md border flex flex-col justify-between gap-3 ${
                bizStatus === 'pending' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-200'
              }`}>
                <div>
                  {/* Top Row: Avatar & Status */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs"
                      style={{ background: bg, color }}>
                      {getInitials(biz.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{biz.name}</h3>
                        {bizStatus === 'verified' && <BadgeCheck size={14} className="text-emerald-600 shrink-0" />}
                        {biz.isPremium && <Crown size={14} className="text-amber-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{biz.category || 'General'}</p>
                      <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                        <MapPin size={11} className="text-gray-400" /> {biz.district || 'Theni'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold flex-shrink-0"
                      style={{ background: st.bg, color: st.text }}>
                      {st.label}
                    </span>
                  </div>

                  {/* Owner & Proof Details */}
                  <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-700 space-y-1 mb-3 border border-gray-100">
                    <p className="flex justify-between">
                      <span className="text-gray-500">Contact:</span>
                      <span className="font-semibold text-gray-900">{biz.contactPerson || biz.ownerName || '—'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span className="font-mono font-bold text-gray-900">{biz.phone || '—'}</span>
                    </p>
                    {biz.proofNumber && (
                      <p className="flex justify-between">
                        <span className="text-gray-500">{biz.proofType || 'Proof'}:</span>
                        <span className="font-mono text-[11px] font-bold text-blue-700">{biz.proofNumber}</span>
                      </p>
                    )}
                  </div>

                  {/* Rejection Note if Rejected */}
                  {bizStatus === 'rejected' && biz.rejectionReason && (
                    <p className="text-[11px] text-red-700 bg-red-50 p-2 rounded-xl border border-red-200 mb-3">
                      <strong>Rejection Reason:</strong> {biz.rejectionReason}
                    </p>
                  )}

                  {/* Description */}
                  <p className="text-xs text-gray-500 line-clamp-2">{biz.description || biz.address || 'No description.'}</p>
                </div>

                {/* Bottom Actions */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {/* Direct Contact Buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {cleanPhone ? (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-indigo-200 cursor-pointer"
                      >
                        <Phone size={12} /> Call Owner
                      </a>
                    ) : (
                      <span className="py-1.5 text-center text-[10px] text-gray-400">No Phone</span>
                    )}

                    {cleanWa ? (
                      <a
                        href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi ${biz.name}, this is THENIJOBS Admin regarding your business verification request on our platform.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        style={{ background: '#25D366' }}
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                    ) : (
                      <span className="py-1.5 text-center text-[10px] text-gray-400">No WhatsApp</span>
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
                            onClick={() => doApprove(biz)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer hover:opacity-90"
                            style={{ background: '#10B981' }}
                          >
                            <CheckCircle size={13} /> Approve
                          </button>
                        )}
                        {bizStatus !== 'rejected' && (
                          <button
                            onClick={() => openRejectModal(biz)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        )}
                        <button
                          onClick={() => doToggleFeatured(biz.id, biz.isFeatured)}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${biz.isFeatured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400 hover:text-amber-500'}`}
                          title={biz.isFeatured ? 'Remove Featured' : 'Feature Business'}
                        >
                          <Star size={14} />
                        </button>
                        <button
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
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 text-left border border-gray-200 transition-colors"
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
                className="py-2.5 px-3 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-all"
              >
                Save &amp; Reject Only
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReject(true)}
                className="py-2.5 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                style={{ background: '#25D366' }}
              >
                <MessageCircle size={13} /> Reject &amp; Send on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
