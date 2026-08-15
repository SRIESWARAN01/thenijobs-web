'use client';

import { useState } from 'react';
import {
  Building2, Search, CheckCircle, XCircle,
  Star, Crown, MapPin, BadgeCheck, Clock, Loader2, Download
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { approveCompany, rejectCompany, featureCompany, updateDocument } from '@/lib/firebase/firestoreService';

interface BusinessDoc {
  id: string; name: string; category?: string; district?: string;
  ownerName?: string; phone?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  isActive?: boolean; isFeatured?: boolean; isPremium?: boolean;
  createdAt?: any; description?: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:  { bg: '#FFFBEB', text: '#D97706', label: 'Pending' },
  verified: { bg: '#ECFDF5', text: '#059669', label: 'Verified' },
  rejected: { bg: '#FEF2F2', text: '#DC2626', label: 'Rejected' } };

const TABS = ['All', 'Pending', 'Verified', 'Rejected', 'Featured'] as const;
const CATEGORIES = ['All Categories', 'IT & Software', 'Agriculture', 'Food & Beverage', 'Healthcare', 'Education', 'Retail', 'Construction', 'Transport', 'Manufacturing', 'Textiles'];
const DISTRICTS = ['All Districts', 'Theni', 'Madurai', 'Dindigul', 'Chennai', 'Coimbatore', 'Trichy', 'Salem'];

const BG_PALETTE = ['#EFF6FF','#ECFDF5','#FFFBEB','#F5F3FF','#FFF1F2','#F0F9FF'];
const COLOR_PALETTE = ['#2563EB','#059669','#D97706','#7C3AED','#E11D48','#0284C7'];

export default function BusinessesPage() {
  const { user: currentUser } = useAuth();
  const { data: businesses, loading } = useCollection<BusinessDoc>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CO';
  const getColors = (name?: string) => {
    const idx = (name?.charCodeAt(0) || 0) % BG_PALETTE.length;
    return { bg: BG_PALETTE[idx], color: COLOR_PALETTE[idx] };
  };

  const pendingCount = businesses.filter(b => (b.verificationStatus || 'pending') === 'pending').length;
  const verifiedCount = businesses.filter(b => b.verificationStatus === 'verified').length;
  const premiumCount = businesses.filter(b => b.isPremium || b.isFeatured).length;

  const filtered = businesses.filter(biz => {
    const matchSearch = biz.name.toLowerCase().includes(searchQuery.toLowerCase()) || (biz.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const status = biz.verificationStatus || 'pending';
    let matchTab = activeTab === 'All';
    if (activeTab === 'Featured') matchTab = !!biz.isFeatured;
    else if (activeTab === 'Verified') matchTab = status === 'verified';
    else if (activeTab !== 'All') matchTab = status === activeTab.toLowerCase();
    const matchCategory = categoryFilter === 'All Categories' || biz.category === categoryFilter;
    const matchDistrict = districtFilter === 'All Districts' || biz.district === districtFilter;
    return matchSearch && matchTab && matchCategory && matchDistrict;
  });

  const doApprove = async (id: string) => {
    setActionLoading(id);
    try { await approveCompany(id, currentUser?.uid || 'admin'); }
    catch (e) { console.error(e); } finally { setActionLoading(null); }
  };
  const doReject = async (id: string) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;
    setActionLoading(id);
    try { await rejectCompany(id, currentUser?.uid || 'admin', reason); }
    catch (e) { console.error(e); } finally { setActionLoading(null); }
  };
  const doToggleFeatured = async (id: string, cur?: boolean) => {
    setActionLoading(id);
    try { await featureCompany(id, !cur); }
    catch (e) { console.error(e); } finally { setActionLoading(null); }
  };
  const doTogglePremium = async (id: string, cur?: boolean) => {
    setActionLoading(id);
    try { await updateDocument('companies', id, { isPremium: !cur }); }
    catch (e) { console.error(e); } finally { setActionLoading(null); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Business Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage business listings, approvals and featured status</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
          <Download size={15} /> <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: businesses.length, icon: Building2, bg: '#EFF6FF', color: '#2563EB' },
          { label: 'Pending', value: pendingCount, icon: Clock, bg: '#FFFBEB', color: '#D97706' },
          { label: 'Verified', value: verifiedCount, icon: BadgeCheck, bg: '#ECFDF5', color: '#059669' },
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
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 overflow-x-auto no-scrollbar w-fit">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}>
            {tab}
            {tab === 'Pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-white text-[9px] font-bold" style={{ background: '#D97706' }}>
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
          <input type="text" placeholder="Search businesses or owners..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 outline-none cursor-pointer">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 outline-none cursor-pointer">
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
            const st = STATUS_STYLES[bizStatus];
            const { bg, color } = getColors(biz.name);
            return (
              <div key={biz.id} className={`bg-white rounded-2xl p-5 shadow-sm transition-all hover:shadow-md border ${
                bizStatus === 'pending' ? 'border-amber-200' : 'border-gray-100'
              }`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: bg, color }}>
                    {getInitials(biz.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{biz.name}</h3>
                      {bizStatus === 'verified' && <BadgeCheck size={13} className="text-emerald-500 flex-shrink-0" />}
                      {biz.isPremium && <Crown size={13} className="text-amber-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{biz.category || 'General'} · <MapPin size={9} className="inline" /> {biz.district || 'Theni'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Owner: {biz.ownerName || '—'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                    style={{ background: st.bg, color: st.text }}>
                    {st.label}
                  </span>
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{biz.description || 'No description provided.'}</p>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                  {actionLoading === biz.id ? (
                    <Loader2 size={16} className="animate-spin text-blue-500 mx-auto" />
                  ) : (
                    <>
                      {bizStatus === 'pending' && (
                        <>
                          <button onClick={() => doApprove(biz.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 shadow-xs"
                            style={{ background: '#10B981' }}>
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button onClick={() => doReject(biz.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-all">
                            <XCircle size={13} /> Reject
                          </button>
                        </>
                      )}
                      <button onClick={() => doToggleFeatured(biz.id, biz.isFeatured)}
                        className={`p-2 rounded-lg transition-all ${biz.isFeatured ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-400 hover:text-amber-500'}`}
                        title={biz.isFeatured ? 'Remove Featured' : 'Feature Business'}>
                        <Star size={15} />
                      </button>
                      <button onClick={() => doTogglePremium(biz.id, biz.isPremium)}
                        className={`p-2 rounded-lg transition-all ${biz.isPremium ? 'bg-purple-50 text-purple-500' : 'bg-gray-50 text-gray-400 hover:text-purple-500'}`}
                        title={biz.isPremium ? 'Remove Premium' : 'Make Premium'}>
                        <Crown size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
