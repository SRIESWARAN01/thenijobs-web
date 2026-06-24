'use client';

import { useState } from 'react';
import {
  Building2, Search, ChevronDown, Eye, CheckCircle, XCircle,
  Star, Crown, MapPin, Phone, Globe, LayoutGrid, List,
  Download, BadgeCheck, Clock, Loader2, Ban, Check, Settings, Ticket
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import {
  approveCompany,
  rejectCompany,
  featureCompany,
  updateDocument,
} from '@/lib/firebase/firestoreService';
import { LAUNCH_DISTRICT, THENI_LAUNCH_LOCATIONS } from '@/lib/types';
import { matchesSearch } from '@/lib/search';
import { Modal } from '@/components/ui/Modal';
import { Timestamp } from 'firebase/firestore';

// ===== TYPES =====
interface BusinessDoc {
  id: string;
  name: string;
  category?: string;
  district?: string;
  location?: string;
  services?: string[];
  ownerName?: string;
  phone?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  isActive?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  createdAt?: any;
  description?: string;
  assignedCoupons?: string[];
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionStartsAt?: any;
  subscriptionEndsAt?: any;
};

// ===== CONSTANTS =====
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  verified: { label: 'Verified', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  rejected: { label: 'Rejected', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/20' },
};

const TABS = ['All', 'Pending', 'Verified', 'Rejected', 'Featured'] as const;
const CATEGORIES = ['All Categories', 'IT & Software', 'Agriculture', 'Food & Beverage', 'Healthcare', 'Education', 'Retail', 'Construction', 'Transport', 'Manufacturing', 'Textiles'];
const DISTRICTS = ['All Areas', ...THENI_LAUNCH_LOCATIONS];

const INITIAL_COLORS = [
  'from-violet-500 to-indigo-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-purple-500 to-violet-500',
  'from-blue-500 to-cyan-500',
  'from-teal-500 to-emerald-500',
];

export default function BusinessesPage() {
  const { user: currentUser } = useAuth();
  const { data: businesses, loading } = useCollection<BusinessDoc>('companies');
  const { data: coupons } = useCollection<any>('coupons');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [districtFilter, setDistrictFilter] = useState('All Areas');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Phase 5 states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<BusinessDoc | null>(null);
  const [couponToAssign, setCouponToAssign] = useState<string>('');

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CO';
  };

  const getInitialColor = (name?: string) => {
    const code = (name || '').charCodeAt(0) || 0;
    return INITIAL_COLORS[code % INITIAL_COLORS.length];
  };

  const filteredBusinesses = businesses.filter((biz) => {
    const matchSearch = matchesSearch(searchQuery, [
      { value: biz.name || '', weight: 3 },
      { value: biz.ownerName || '', weight: 2 },
      biz.category,
      biz.description,
      biz.services || [],
    ]);
    
    const status = biz.verificationStatus || 'pending';
    let matchTab = activeTab === 'All';
    if (activeTab === 'Featured') {
      matchTab = !!biz.isFeatured;
    } else if (activeTab === 'Verified') {
      matchTab = status === 'verified';
    } else {
      matchTab = status === activeTab.toLowerCase();
    }

    const matchCategory = categoryFilter === 'All Categories' || biz.category === categoryFilter;
    const district = biz.district || LAUNCH_DISTRICT;
    const location = biz.location || district;
    const matchDistrict = districtFilter === 'All Areas' || location === districtFilter || district === districtFilter;
    
    return matchSearch && matchTab && matchCategory && matchDistrict;
  });

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveCompany(id, currentUser?.uid || 'admin');
    } catch (err) {
      console.error('Approve company error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason === null) return;
    setActionLoading(id);
    try {
      await rejectCompany(id, currentUser?.uid || 'admin', reason);
    } catch (err) {
      console.error('Reject company error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured?: boolean) => {
    setActionLoading(id);
    try {
      await featureCompany(id, !currentFeatured);
    } catch (err) {
      console.error('Feature company error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePremium = async (id: string, currentPremium?: boolean) => {
    setActionLoading(id);
    try {
      await updateDocument('companies', id, { isPremium: !currentPremium });
    } catch (err) {
      console.error('Premium toggle error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (id: string, currentActive?: boolean) => {
    setActionLoading(id);
    try {
      await updateDocument('companies', id, { isActive: !currentActive });
    } catch (err) {
      console.error('Active toggle error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'suspend' | 'activate') => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to ${action} ${selectedIds.length} selected businesses?`)) return;
    
    setActionLoading('bulk');
    try {
      const promises = selectedIds.map(async (id) => {
        if (action === 'approve') {
          await approveCompany(id, currentUser?.uid || 'admin');
        } else if (action === 'suspend') {
          await updateDocument('companies', id, { isActive: false });
        } else if (action === 'activate') {
          await updateDocument('companies', id, { isActive: true });
        }
      });
      await Promise.all(promises);
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk action error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleForcePlanChange = async (bizId: string, planSlug: string) => {
    setActionLoading(bizId);
    try {
      const now = new Date();
      const oneYear = new Date();
      oneYear.setFullYear(now.getFullYear() + 1);

      await updateDocument('companies', bizId, {
        isPremium: planSlug === 'premium',
        subscriptionPlan: planSlug,
        subscriptionStatus: 'active',
        subscriptionStartsAt: Timestamp.fromDate(now),
        subscriptionEndsAt: Timestamp.fromDate(oneYear),
      });

      if (selectedBiz && selectedBiz.id === bizId) {
        setSelectedBiz(prev => prev ? {
          ...prev,
          isPremium: planSlug === 'premium',
          subscriptionPlan: planSlug,
          subscriptionStatus: 'active',
        } : null);
      }
      alert(`Subscription plan updated to ${planSlug.toUpperCase()}`);
    } catch (err) {
      console.error('Force plan change error:', err);
      alert('Failed to update subscription plan.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignCoupon = async (bizId: string, couponCode: string) => {
    if (!couponCode) return;
    setActionLoading(bizId);
    try {
      const biz = businesses.find(b => b.id === bizId);
      const assigned = biz?.assignedCoupons || [];
      if (assigned.includes(couponCode)) {
        alert('Coupon already assigned to this business.');
        return;
      }
      const updatedCoupons = [...assigned, couponCode];
      await updateDocument('companies', bizId, {
        assignedCoupons: updatedCoupons,
      });

      if (selectedBiz && selectedBiz.id === bizId) {
        setSelectedBiz(prev => prev ? {
          ...prev,
          assignedCoupons: updatedCoupons,
        } : null);
      }
      setCouponToAssign('');
      alert('Coupon assigned successfully.');
    } catch (err) {
      console.error('Assign coupon error:', err);
      alert('Failed to assign coupon.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveCoupon = async (bizId: string, couponCode: string) => {
    setActionLoading(bizId);
    try {
      const biz = businesses.find(b => b.id === bizId);
      const assigned = biz?.assignedCoupons || [];
      const updatedCoupons = assigned.filter(c => c !== couponCode);
      await updateDocument('companies', bizId, {
        assignedCoupons: updatedCoupons,
      });

      if (selectedBiz && selectedBiz.id === bizId) {
        setSelectedBiz(prev => prev ? {
          ...prev,
          assignedCoupons: updatedCoupons,
        } : null);
      }
      alert('Coupon removed successfully.');
    } catch (err) {
      console.error('Remove coupon error:', err);
      alert('Failed to remove coupon.');
    } finally {
      setActionLoading(null);
    }
  };

  // Dynamic stats
  const totalCount = businesses.length;
  const pendingCount = businesses.filter((b) => (b.verificationStatus || 'pending') === 'pending').length;
  const verifiedCount = businesses.filter((b) => b.verificationStatus === 'verified').length;
  const premiumCount = businesses.filter((b) => b.isPremium || b.isFeatured).length;

  const stats = [
    { label: 'Total Businesses', value: totalCount, icon: Building2, color: 'violet' },
    { label: 'Pending Approval', value: pendingCount, icon: Clock, color: 'amber' },
    { label: 'Verified', value: verifiedCount, icon: BadgeCheck, color: 'emerald' },
    { label: 'Premium / Featured', value: premiumCount, icon: Crown, color: 'cyan' },
  ];

  const statColorMap: Record<string, { bg: string; text: string }> = {
    violet: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Business Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage business listings, approvals, and featured status</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const colors = statColorMap[stat.color];
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-4 hover:border-white/[0.15] transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <Icon size={18} className={colors.text} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white font-outfit">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            {tab}


            {tab === 'Pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-gray-300 outline-none focus:border-violet-500/40 transition-all cursor-pointer"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-gray-300 outline-none focus:border-violet-500/40 transition-all cursor-pointer"
            >
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-violet-500/20 text-violet-400' : 'text-gray-500 hover:text-white'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-violet-500/20 text-violet-400' : 'text-gray-500 hover:text-white'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {filteredBusinesses.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={filteredBusinesses.length > 0 && selectedIds.length === filteredBusinesses.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds(filteredBusinesses.map((b) => b.id));
                } else {
                  setSelectedIds([]);
                }
              }}
              className="rounded border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
            />
            <span className="text-gray-400 font-medium">
              {selectedIds.length} of {filteredBusinesses.length} selected
            </span>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <span className="text-gray-500 mr-1 hidden sm:inline">Bulk Actions:</span>
              <button
                onClick={() => handleBulkAction('approve')}
                disabled={actionLoading === 'bulk'}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCircle size={13} /> Approve
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                disabled={actionLoading === 'bulk'}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Ban size={13} /> Suspend
              </button>
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={actionLoading === 'bulk'}
                className="px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-all font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Check size={13} /> Activate
              </button>
            </div>
          )}
        </div>
      )}

      {/* Business Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading businesses from Firestore...</p>
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
          {filteredBusinesses.map((biz) => {
            const bizStatus = biz.verificationStatus || 'pending';
            const statusCfg = STATUS_CONFIG[bizStatus] || STATUS_CONFIG.pending;
            const initials = getInitials(biz.name);
            const initialBg = getInitialColor(biz.name);
            const isSelected = selectedIds.includes(biz.id);

            return (
              <div
                key={biz.id}
                className={`glass-card rounded-2xl p-5 hover:border-white/[0.15] transition-all relative ${
                  bizStatus === 'pending' ? 'border-amber-500/25' : ''
                } ${biz.isActive === false ? 'border-rose-500/20 opacity-75' : ''} ${
                  viewMode === 'list' ? 'flex items-center gap-4' : ''
                }`}
              >
                {/* Checkbox selector */}
                <div className={`absolute top-4 left-4 z-10 flex items-center ${viewMode === 'list' ? 'relative top-auto left-auto' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setSelectedIds((prev) => [...prev, biz.id]);
                      } else {
                        setSelectedIds((prev) => prev.filter((id) => id !== biz.id));
                      }
                    }}
                    className="rounded border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
                  />
                </div>

                <div className={`flex items-start gap-4 flex-1 min-w-0 ${viewMode === 'list' ? '' : 'pl-6 mb-4'}`}>
                  {/* Logo/Avatar */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${initialBg} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-sm font-bold">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white truncate">{biz.name}</h3>
                      {bizStatus === 'verified' && <BadgeCheck size={14} className="text-cyan-400 flex-shrink-0" />}
                      {biz.isPremium && <Crown size={14} className="text-amber-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{biz.category || 'General'} · {biz.location || biz.district || 'Theni'}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Owner: {biz.ownerName || 'User'}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusCfg.bg} ${statusCfg.text} flex-shrink-0`}>
                    {statusCfg.label}
                  </span>
                </div>

                {viewMode === 'grid' && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-4 pl-6">{biz.description || 'No description provided.'}</p>
                )}

                {/* Actions */}
                <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'border-t border-white/[0.06] pt-4 pl-6 font-outfit' : ''}`}>
                  {actionLoading === biz.id ? (
                    <Loader2 size={16} className="text-violet-400 animate-spin mx-auto" />
                  ) : (
                    <>
                      {bizStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(biz.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(biz.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleToggleFeatured(biz.id, biz.isFeatured)}
                        className={`p-2 rounded-lg transition-all ${biz.isFeatured ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-gray-400 hover:text-amber-400 hover:bg-amber-500/10'}`}
                        title={biz.isFeatured ? 'Remove Featured' : 'Feature Business'}
                      >
                        <Star size={15} />
                      </button>
                      <button
                        onClick={() => handleTogglePremium(biz.id, biz.isPremium)}
                        className={`p-2 rounded-lg transition-all ${biz.isPremium ? 'text-violet-400 bg-violet-500/10 hover:bg-violet-500/20' : 'text-gray-400 hover:text-violet-400 hover:bg-violet-500/10'}`}
                        title={biz.isPremium ? 'Remove Premium' : 'Make Premium'}
                      >
                        <Crown size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(biz.id, biz.isActive !== false)}
                        className={`p-2 rounded-lg transition-all ${
                          biz.isActive === false
                            ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                            : 'text-gray-400 hover:text-rose-400 hover:bg-rose-500/10'
                        }`}
                        title={biz.isActive === false ? 'Activate Business' : 'Suspend Business'}
                      >
                        <Ban size={15} />
                      </button>
                      <button
                        onClick={() => setSelectedBiz(biz)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all ml-auto"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
            <Building2 size={28} className="text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-400">No businesses found</p>
          <p className="text-xs text-gray-600 mt-1">Try adjusting your filters or search query</p>
        </div>
      )}

      {/* Detailed View Modal */}
      {selectedBiz && (
        <Modal
          open={!!selectedBiz}
          onClose={() => setSelectedBiz(null)}
          title="Business Details"
        >
          <div className="space-y-6 text-gray-300 font-outfit max-h-[75vh] overflow-y-auto pr-2">
            {/* Hero Header */}
            <div className="relative rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.08] p-5">
              <div className="flex gap-4 items-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getInitialColor(selectedBiz.name)} flex items-center justify-center flex-shrink-0 text-white text-xl font-bold`}>
                  {getInitials(selectedBiz.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-white truncate">{selectedBiz.name}</h3>
                  <p className="text-xs text-violet-400">{selectedBiz.category || 'General'} · {selectedBiz.location || selectedBiz.district || 'Theni'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      (STATUS_CONFIG[selectedBiz.verificationStatus || 'pending'] || STATUS_CONFIG.pending).bg
                    } ${(STATUS_CONFIG[selectedBiz.verificationStatus || 'pending'] || STATUS_CONFIG.pending).text}`}>
                      {selectedBiz.verificationStatus || 'pending'}
                    </span>
                    {selectedBiz.isActive === false && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400">
                        Suspended
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Owner Details</h4>
                <p className="text-sm font-semibold text-white">{selectedBiz.ownerName || 'N/A'}</p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5"><Phone size={12} /> {selectedBiz.phone || 'N/A'}</p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Platform Details</h4>
                <p className="text-sm font-semibold text-white flex items-center gap-1">
                  Plan: <span className="text-amber-400 capitalize">{selectedBiz.subscriptionPlan || 'Free'}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Status: <span className="capitalize">{selectedBiz.subscriptionStatus || 'N/A'}</span>
                </p>
              </div>
            </div>

            {/* Services & Description */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">About Business</h4>
                <p className="text-sm text-gray-400 bg-white/[0.01] border border-white/[0.05] p-3.5 rounded-xl leading-relaxed whitespace-pre-line">
                  {selectedBiz.description || 'No description provided.'}
                </p>
              </div>
              {selectedBiz.services && selectedBiz.services.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Services Offered</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBiz.services.map((s) => (
                      <span key={s} className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06] text-xs text-gray-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Plan & Coupon Settings */}
            <div className="border-t border-white/[0.08] pt-5 space-y-4">
              <h3 className="text-sm font-bold text-white">Admin Controls</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Force Subscription Change */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400">Force Subscription Plan</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedBiz.subscriptionPlan || 'free'}
                      onChange={(e) => handleForcePlanChange(selectedBiz.id, e.target.value)}
                      className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                    >
                      <option value="free">Free Plan</option>
                      <option value="basic">Basic Plan</option>
                      <option value="premium">Premium Plan</option>
                    </select>
                  </div>
                </div>

                {/* Assign Coupon */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400">Assign Coupon Code</label>
                  <div className="flex gap-2">
                    <select
                      value={couponToAssign}
                      onChange={(e) => setCouponToAssign(e.target.value)}
                      className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                    >
                      <option value="">Select coupon...</option>
                      {coupons?.filter((c: any) => c.isActive).map((c: any) => (
                        <option key={c.id} value={c.code}>{c.code} ({c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`} Off)</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssignCoupon(selectedBiz.id, couponToAssign)}
                      disabled={!couponToAssign}
                      className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-bold text-white transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>

              {/* Assigned Coupons List */}
              {selectedBiz.assignedCoupons && selectedBiz.assignedCoupons.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400">Currently Assigned Coupons</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedBiz.assignedCoupons.map((code) => (
                      <span key={code} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-400">
                        <Ticket size={12} />
                        {code}
                        <button
                          onClick={() => handleRemoveCoupon(selectedBiz.id, code)}
                          className="text-rose-400 hover:text-rose-300 font-bold ml-1"
                          title="Remove coupon"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Close & Action Buttons */}
            <div className="flex justify-end gap-2 border-t border-white/[0.08] pt-4 mt-6">
              <button
                onClick={() => setSelectedBiz(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-gray-300 hover:bg-white/[0.08] transition-colors"
              >
                Close
              </button>
              {selectedBiz.verificationStatus === 'pending' && (
                <>
                  <button
                    onClick={() => { handleApprove(selectedBiz.id); setSelectedBiz(null); }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => { handleReject(selectedBiz.id); setSelectedBiz(null); }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                  >
                    <Ban size={14} /> Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
