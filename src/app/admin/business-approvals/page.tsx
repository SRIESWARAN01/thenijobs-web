'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  BadgeCheck, Users, Clock, CheckCircle2, XCircle, AlertTriangle,
  Search, Mail, Phone, ExternalLink, ShieldCheck, Eye, RefreshCw,
  X, Check, Loader2, MessageCircle, Calendar, ArrowRight, Building2,
  AlertCircle, ShieldAlert, Sparkles, CreditCard, Gift, FileText
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { approveBusinessOwner, rejectBusinessOwner } from '@/lib/firebase/firestoreService';
import { SITE_CONTACT } from '@/lib/constants';

interface BusinessOwnerDoc {
  id?: string;
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string;
  phone?: string;
  mobileNumber?: string;
  countryCode?: string;
  role: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  accountStatus?: string;
  isEmployer?: boolean;
  canPostJobs?: boolean;
  companyId?: string;
  companyName?: string;
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'not_required' | 'unpaid' | string;
  selectedPlan?: 'trial' | 'basic' | 'standard' | 'premium' | 'enterprise' | string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  trialRequested?: boolean;
  trialEligible?: boolean;
  hasUsedFreeTrial?: boolean;
  trialDurationDays?: number;
  trialStartedAt?: any;
  trialEndsAt?: any;
  trialStartDate?: any;
  trialEndDate?: any;
  trialActivatedAt?: any;
  trialActivatedBy?: string;
  planStartDate?: any;
  planEndDate?: any;
  paymentOrderId?: string;
  paymentId?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentReceiptNumber?: string;
  createdAt?: any;
  updatedAt?: any;
  approvedAt?: any;
  approvedBy?: string;
  rejectedAt?: any;
  rejectedBy?: string;
  rejectionReason?: string;
  companyDoc?: any;
}

type TabType = 'pending' | 'approved' | 'rejected' | 'all';

const QUICK_REJECTION_REASONS = [
  'Incomplete or unverifiable registration information.',
  'Invalid or unreachable mobile contact number.',
  'Duplicate business owner account.',
  'Business name and details require official documentation.',
  'Prohibited business category or unverified enterprise.',
];

export default function BusinessApprovalsPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  // Firestore Data
  const { data: users = [], loading: usersLoading, refresh: refreshUsers } = useCollection<any>('users');
  const { data: companies = [], loading: companiesLoading } = useCollection<any>('companies');

  // Filters & State
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modals State
  const [detailsUser, setDetailsUser] = useState<BusinessOwnerDoc | null>(null);
  const [approvingUser, setApprovingUser] = useState<BusinessOwnerDoc | null>(null);
  const [rejectingUser, setRejectingUser] = useState<BusinessOwnerDoc | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Map company by ownerId for fast lookup
  const companyByOwnerId = useMemo(() => {
    const map = new Map<string, any>();
    companies.forEach((comp: any) => {
      if (comp.ownerId) {
        map.set(comp.ownerId, comp);
      }
    });
    return map;
  }, [companies]);

  // Filter all business owners
  const businessOwners: BusinessOwnerDoc[] = useMemo(() => {
    return users
      .filter((u: any) => u.role === 'business_owner' || u.approvalStatus !== undefined)
      .map((u: any) => {
        const uid = u.uid || u.id;
        const linkedCompany = companyByOwnerId.get(uid);
        return {
          ...u,
          uid,
          companyName: linkedCompany?.name || u.companyName || u.businessName,
          companyDoc: linkedCompany,
        };
      })
      .sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
  }, [users, companyByOwnerId]);

  // Counts
  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    businessOwners.forEach(u => {
      if (u.approvalStatus === 'rejected' || u.accountStatus === 'rejected') {
        rejected++;
      } else if (u.approvalStatus === 'approved' || u.accountStatus === 'active') {
        approved++;
      } else {
        pending++;
      }
    });

    return {
      total: businessOwners.length,
      pending,
      approved,
      rejected,
    };
  }, [businessOwners]);

  // Filtered List based on tab and search
  const filteredUsers = useMemo(() => {
    return businessOwners.filter(u => {
      // Tab Filter
      if (activeTab === 'pending') {
        const isApproved = u.approvalStatus === 'approved' || u.accountStatus === 'active';
        const isRejected = u.approvalStatus === 'rejected' || u.accountStatus === 'rejected';
        if (isApproved || isRejected) return false;
      } else if (activeTab === 'approved') {
        if (u.approvalStatus !== 'approved' && u.accountStatus !== 'active') return false;
      } else if (activeTab === 'rejected') {
        if (u.approvalStatus !== 'rejected' && u.accountStatus !== 'rejected') return false;
      }

      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (u.fullName || u.displayName || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const mobile = (u.mobileNumber || u.phone || '').toLowerCase();
        const company = (u.companyName || '').toLowerCase();
        const uid = (u.uid || '').toLowerCase();

        return (
          name.includes(q) ||
          email.includes(q) ||
          mobile.includes(q) ||
          company.includes(q) ||
          uid.includes(q)
        );
      }

      return true;
    });
  }, [businessOwners, activeTab, searchQuery]);

  // Format Date Helper
  const formatDate = (val: any) => {
    if (!val) return '—';
    try {
      const d = val?.seconds ? new Date(val.seconds * 1000) : new Date(val);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  // Status Pill Component
  const renderStatusBadge = (u: BusinessOwnerDoc) => {
    if (u.approvalStatus === 'rejected' || u.accountStatus === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
          <XCircle size={13} className="text-red-500" />
          Requires Revision
        </span>
      );
    }
    if (u.approvalStatus === 'approved' || u.accountStatus === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={13} className="text-emerald-500" />
          Approved &amp; Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
        <Clock size={13} className="text-amber-500" />
        Pending Review
      </span>
    );
  };

  // Plan Badge Component
  const renderPlanBadge = (u: BusinessOwnerDoc) => {
    const rawPlan = (u.selectedPlan || u.subscriptionPlan || (u.trialRequested ? 'trial' : '')).toLowerCase();
    switch (rawPlan) {
      case 'trial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
            🎁 15-Day Free Trial
          </span>
        );
      case 'basic':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-sky-50 text-sky-800 border border-sky-200">
            ⚡ Basic (₹999/yr)
          </span>
        );
      case 'standard':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
            ⭐ Standard (₹1,800/yr)
          </span>
        );
      case 'premium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
            👑 Premium (₹3,500/yr)
          </span>
        );
      case 'enterprise':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-300">
            🏆 Enterprise (₹5,000/yr)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            Not Selected
          </span>
        );
    }
  };

  // Payment Status Badge Component
  const renderPaymentBadge = (u: BusinessOwnerDoc) => {
    const isPaid = u.paymentStatus === 'paid';
    const isTrial = u.selectedPlan === 'trial' || u.trialRequested || u.paymentStatus === 'not_required';

    if (isPaid) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} className="text-emerald-500" />
          Paid &amp; Verified
        </span>
      );
    }
    if (isTrial) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Gift size={12} className="text-blue-500" />
          Trial (No Payment)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={12} className="text-amber-500" />
        Unpaid / Pending
      </span>
    );
  };

  // Trial Status Badge Component
  const renderTrialBadge = (u: BusinessOwnerDoc) => {
    const isTrial = u.selectedPlan === 'trial' || u.trialRequested || u.subscriptionStatus === 'trial';
    if (!isTrial) {
      return <span className="text-xs text-gray-400 font-medium">N/A (Paid Plan)</span>;
    }

    const isApproved = u.approvalStatus === 'approved' || u.accountStatus === 'active';
    if (!isApproved) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock size={12} className="text-amber-600" />
          Trial Requested (Awaits Approval)
        </span>
      );
    }

    // If approved and trial
    const endDate = u.trialEndsAt?.seconds
      ? new Date(u.trialEndsAt.seconds * 1000)
      : (u.trialEndDate ? new Date(u.trialEndDate) : null);
    const now = new Date();
    if (endDate && endDate > now) {
      const diffDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={12} className="text-emerald-500" />
          Trial Active ({diffDays}d left)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
        Trial Expired
      </span>
    );
  };

  // Handle Approve
  const handleConfirmApprove = async () => {
    if (!approvingUser) return;
    const adminId = currentUser?.uid || 'admin';
    setActionLoading(approvingUser.uid);

    try {
      await approveBusinessOwner(approvingUser.uid, adminId);
      toast.success(`Approved business owner "${approvingUser.fullName || approvingUser.displayName || approvingUser.email}"! Dashboard access unlocked.`);
      setApprovingUser(null);
      if (detailsUser?.uid === approvingUser.uid) {
        setDetailsUser(prev => prev ? { ...prev, approvalStatus: 'approved', accountStatus: 'active', canPostJobs: true } : null);
      }
      refreshUsers();
    } catch (err: any) {
      console.error('Approval failed:', err);
      toast.error(err?.message || 'Failed to approve business owner.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    const trimmed = rejectionReason.trim();
    if (!trimmed) {
      setRejectionError('Please provide a specific rejection reason for the business owner.');
      return;
    }

    const adminId = currentUser?.uid || 'admin';
    setActionLoading(rejectingUser.uid);

    try {
      await rejectBusinessOwner(rejectingUser.uid, adminId, trimmed);
      toast.success(`Registration marked as rejected. Business owner notified.`);
      setRejectingUser(null);
      setRejectionReason('');
      setRejectionError(null);
      if (detailsUser?.uid === rejectingUser.uid) {
        setDetailsUser(prev => prev ? { ...prev, approvalStatus: 'rejected', accountStatus: 'rejected', rejectionReason: trimmed } : null);
      }
      refreshUsers();
    } catch (err: any) {
      console.error('Rejection failed:', err);
      toast.error(err?.message || 'Failed to reject registration.');
    } finally {
      setActionLoading(null);
    }
  };

  const isLoading = usersLoading || companiesLoading;

  return (
    <div className="space-y-6 font-outfit text-gray-900 pb-20 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <BadgeCheck size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Business Owner Approvals
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Mandatory verification and review queue for registered business owners
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => refreshUsers()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { label: 'Pending Approvals', count: counts.pending, icon: Clock, bg: '#FFFBEB', color: '#D97706', active: activeTab === 'pending', tab: 'pending' as TabType },
          { label: 'Approved Owners', count: counts.approved, icon: CheckCircle2, bg: '#ECFDF5', color: '#059669', active: activeTab === 'approved', tab: 'approved' as TabType },
          { label: 'Requires Revision', count: counts.rejected, icon: XCircle, bg: '#FEF2F2', color: '#DC2626', active: activeTab === 'rejected', tab: 'rejected' as TabType },
          { label: 'Total Business Owners', count: counts.total, icon: Users, bg: '#EFF6FF', color: '#2563EB', active: activeTab === 'all', tab: 'all' as TabType },
        ].map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => setActiveTab(s.tab)}
              className={`bg-white border rounded-3xl p-4 sm:p-5 text-left transition-all cursor-pointer shadow-xs ${
                s.active ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-md -translate-y-0.5' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style={{ background: s.bg }}>
                  <Icon size={20} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-gray-900">{s.count}</p>
                  <p className="text-xs text-gray-500 font-bold">{s.label}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-2xl overflow-x-auto no-scrollbar">
            {[
              { id: 'pending', label: 'Pending Approvals', badge: counts.pending },
              { id: 'approved', label: 'Approved', badge: counts.approved },
              { id: 'rejected', label: 'Requires Revision', badge: counts.rejected },
              { id: 'all', label: 'All Owners', badge: counts.total },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by owner name, email, mobile, or business..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-gray-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Table / List */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-semibold text-gray-600">Loading business owner approvals...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            {activeTab === 'pending' ? <CheckCircle2 size={32} /> : <Search size={32} />}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {activeTab === 'pending'
                ? 'Queue is Clear! No Pending Approvals'
                : 'No Business Owners Found'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {searchQuery
                ? `No registrations matched "${searchQuery}". Try searching by another keyword.`
                : activeTab === 'pending'
                ? 'All registered business owners have been reviewed. New submissions will appear here automatically.'
                : 'No business owners match the selected tab filter.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-5">Business Owner</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Business / Company</th>
                  <th className="py-3.5 px-4">Selected Plan</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Trial Status</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredUsers.map(u => {
                  const name = u.fullName || u.displayName || 'Unnamed Owner';
                  const isApproved = u.approvalStatus === 'approved' || u.accountStatus === 'active';
                  const isRejected = u.approvalStatus === 'rejected' || u.accountStatus === 'rejected';
                  const isPending = !isApproved && !isRejected;

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                      {/* Owner info */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100 border border-indigo-200 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-snug">{name}</p>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">UID: {u.uid.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <a
                            href={`mailto:${u.email}`}
                            className="flex items-center gap-1.5 text-gray-700 hover:text-indigo-600 font-medium"
                          >
                            <Mail size={12} className="text-gray-400 shrink-0" />
                            <span className="truncate max-w-[170px]">{u.email}</span>
                          </a>
                          {(u.mobileNumber || u.phone) ? (
                            <a
                              href={`tel:+91${u.mobileNumber || u.phone}`}
                              className="flex items-center gap-1.5 text-gray-500 hover:text-emerald-700 text-[11px]"
                            >
                              <Phone size={11} className="text-gray-400 shrink-0" />
                              <span>+91 {u.mobileNumber || u.phone}</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">No mobile provided</span>
                          )}
                        </div>
                      </td>

                      {/* Business */}
                      <td className="py-3.5 px-4">
                        {u.companyName ? (
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                              <Building2 size={13} className="text-gray-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{u.companyName}</span>
                            </div>
                            {(u.companyDoc?.aiEnhanced || (u as any).aiEnhanced) && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-extrabold mt-1">
                                <Sparkles size={10} className="text-purple-600" />
                                AI Enhanced
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Not created yet</span>
                        )}
                      </td>

                      {/* Selected Plan */}
                      <td className="py-3.5 px-4">
                        {renderPlanBadge(u)}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        {renderPaymentBadge(u)}
                      </td>

                      {/* Trial Status */}
                      <td className="py-3.5 px-4">
                        {renderTrialBadge(u)}
                      </td>

                      {/* Submission Date */}
                      <td className="py-3.5 px-4 text-gray-500 text-[11px] whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(u)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailsUser(u)}
                            title="View Full Registration Details"
                            className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => setApprovingUser(u)}
                                disabled={actionLoading === u.uid}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                              >
                                <Check size={13} />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingUser(u);
                                  setRejectionReason('');
                                  setRejectionError(null);
                                }}
                                disabled={actionLoading === u.uid}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-all cursor-pointer"
                              >
                                <X size={13} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingUser(u);
                                setRejectionReason('');
                                setRejectionError(null);
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-[11px] font-semibold transition-all cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}

                          {isRejected && (
                            <button
                              type="button"
                              onClick={() => setApprovingUser(u)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                            >
                              <Check size={13} />
                              <span>Re-Approve</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="block lg:hidden divide-y divide-gray-100">
            {filteredUsers.map(u => {
              const name = u.fullName || u.displayName || 'Unnamed Owner';
              const isApproved = u.approvalStatus === 'approved' || u.accountStatus === 'active';
              const isRejected = u.approvalStatus === 'rejected' || u.accountStatus === 'rejected';
              const isPending = !isApproved && !isRejected;

              return (
                <div key={u.uid} className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{name}</h4>
                        <p className="text-[11px] text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div>{renderStatusBadge(u)}</div>
                  </div>

                  {/* Plan & Payment Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div>{renderPlanBadge(u)}</div>
                    <div>{renderPaymentBadge(u)}</div>
                    <div>{renderTrialBadge(u)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <div>
                      <span className="text-gray-400 block text-[10px] font-bold uppercase">Mobile</span>
                      <span className="font-semibold text-gray-800">
                        {u.mobileNumber || u.phone ? `+91 ${u.mobileNumber || u.phone}` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] font-bold uppercase">Business</span>
                      <span className="font-semibold text-gray-800 truncate block">
                        {u.companyName || 'Not created'}
                      </span>
                      {(u.companyDoc?.aiEnhanced || (u as any).aiEnhanced) && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-extrabold mt-0.5">
                          <Sparkles size={9} className="text-purple-600" />
                          AI Enhanced
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 pt-1 border-t border-gray-200/60 flex justify-between text-[11px]">
                      <span className="text-gray-400">Registered:</span>
                      <span className="font-medium text-gray-600">{formatDate(u.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDetailsUser(u)}
                      className="flex-1 py-2 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </button>

                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => setApprovingUser(u)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingUser(u);
                            setRejectionReason('');
                            setRejectionError(null);
                          }}
                          className="py-2 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-all"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingUser(u);
                          setRejectionReason('');
                          setRejectionError(null);
                        }}
                        className="py-2 px-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold"
                      >
                        Revoke Access
                      </button>
                    )}

                    {isRejected && (
                      <button
                        type="button"
                        onClick={() => setApprovingUser(u)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>Re-Approve</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL 1: VIEW DETAILS MODAL ─────────────────────────────────────── */}
      {detailsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center">
                  {(detailsUser.fullName || detailsUser.displayName || 'B').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {detailsUser.fullName || detailsUser.displayName || 'Business Owner Details'}
                  </h3>
                  <p className="text-xs text-gray-500">Registration &amp; Verification Dossier</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsUser(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-200/60 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
              {/* Status Header */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Approval Status</span>
                <div>{renderStatusBadge(detailsUser)}</div>
              </div>

              {/* Account Data */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  Account Registration Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="text-gray-500 block">Full Name</span>
                    <span className="font-bold text-gray-900">{detailsUser.fullName || detailsUser.displayName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Email Address</span>
                    <span className="font-bold text-gray-900">{detailsUser.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Mobile Number</span>
                    <span className="font-bold text-gray-900">
                      {detailsUser.mobileNumber ? `+91 ${detailsUser.mobileNumber}` : (detailsUser.phone || 'Not provided')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Assigned Role</span>
                    <span className="font-bold text-indigo-700 uppercase">{detailsUser.role}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">User UID</span>
                    <span className="font-mono text-[11px] text-gray-700">{detailsUser.uid}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Can Post Jobs</span>
                    <span className={`font-bold ${detailsUser.canPostJobs ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {detailsUser.canPostJobs ? 'Yes (Enabled)' : 'No (Pending Approval)'}
                    </span>
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-500 block">Registration Timestamp</span>
                    <span className="font-medium text-gray-800">{formatDate(detailsUser.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Linked Company Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  Business Entity Information
                </h4>
                {detailsUser.companyName ? (
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-indigo-900 font-bold text-sm">{detailsUser.companyName}</span>
                      <span className="text-indigo-600 font-semibold text-[11px]">Active Profile</span>
                    </div>
                    {detailsUser.companyId && (
                      <p className="text-[11px] text-gray-500 font-mono">Company ID: {detailsUser.companyId}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-500 italic">
                    The owner has not established a company profile yet. Once approved, they can complete company setup from their dashboard.
                  </div>
                )}
              </div>

              {/* Subscription, Trial & Payment Dossier */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  Subscription, Trial &amp; Payment Dossier
                </h4>
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 text-xs space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-500 block">Selected Plan</span>
                      <div className="mt-1">{renderPlanBadge(detailsUser)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Payment Status</span>
                      <div className="mt-1">{renderPaymentBadge(detailsUser)}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-500 block">Trial Status</span>
                      <div className="mt-1">{renderTrialBadge(detailsUser)}</div>
                    </div>
                  </div>

                  {detailsUser.paymentStatus === 'paid' && (
                    <div className="pt-2 border-t border-gray-200 space-y-1.5 text-[11px] text-gray-700">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Order ID:</span>
                        <span className="font-mono font-bold text-gray-900">{detailsUser.paymentOrderId || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment ID:</span>
                        <span className="font-mono font-bold text-gray-900">{detailsUser.paymentId || '—'}</span>
                      </div>
                      {detailsUser.paymentReceiptNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Receipt No:</span>
                          <span className="font-mono text-gray-900">{detailsUser.paymentReceiptNumber}</span>
                        </div>
                      )}
                      {detailsUser.paymentAmount && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Amount Paid:</span>
                          <span className="font-bold text-emerald-700">₹{detailsUser.paymentAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-200 text-[11px] text-gray-500">
                    <p className="flex items-center gap-1 font-semibold text-slate-700">
                      <ShieldCheck size={12} className="text-indigo-600" />
                      Activation Policy:
                    </p>
                    <p className="mt-0.5">
                      • <strong>15-Day Free Trial</strong>: Activated for 15 days upon Admin approval.
                      <br />
                      • <strong>Annual Paid Plans</strong>: Activated for 365 days upon Admin approval.
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Enhancement Dossier & Anti-Fabrication Review */}
              {(detailsUser.companyDoc?.aiEnhanced || (detailsUser as any).aiEnhanced) && (
                <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900">
                      <Sparkles size={15} className="text-purple-600" />
                      <span>Gemini AI Profile Enhancement Dossier</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900 text-[10px] font-extrabold">
                      AI Generated
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-2">
                    <p className="font-bold text-purple-950 text-xs">
                      {detailsUser.companyDoc?.aiEnhancedAt
                        ? `Generated on: ${formatDate(detailsUser.companyDoc.aiEnhancedAt)}`
                        : 'Enhanced with Gemini AI'}
                    </p>
                    {detailsUser.companyDoc?.aiOriginalContent && (
                      <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-purple-100">
                        <p className="font-bold text-slate-700">Original User Input vs AI Content:</p>
                        <p className="italic text-slate-500">
                          Original: &quot;{detailsUser.companyDoc.aiOriginalContent.shortDescription || detailsUser.companyDoc.description || 'Basic profile submitted'}&quot;
                        </p>
                      </div>
                    )}
                    <p className="text-[10px] text-purple-700 font-medium">
                      🛡️ Zero-Fabrication verified: All enhancement is strictly constrained to provided business name, category, and location.
                    </p>
                  </div>
                </div>
              )}

              {/* Rejection Information (if rejected) */}
              {(detailsUser.approvalStatus === 'rejected' || detailsUser.rejectionReason) && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-red-900">
                    <AlertTriangle size={14} className="text-red-600" />
                    <span>Rejection Reason &amp; Audit</span>
                  </div>
                  <p className="p-3 bg-white rounded-xl border border-red-100 text-red-800 font-medium whitespace-pre-wrap">
                    {detailsUser.rejectionReason || 'No specific reason recorded.'}
                  </p>
                  <div className="flex justify-between text-[11px] text-red-700/80 pt-1">
                    <span>Rejected At: {formatDate(detailsUser.rejectedAt)}</span>
                    {detailsUser.rejectedBy && <span>Admin ID: {detailsUser.rejectedBy.slice(0, 8)}...</span>}
                  </div>
                </div>
              )}

              {/* Approval Audit (if approved) */}
              {detailsUser.approvalStatus === 'approved' && detailsUser.approvedAt && (
                <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex justify-between items-center">
                  <div>
                    <span className="font-bold block">Approved On</span>
                    <span className="text-[11px]">{formatDate(detailsUser.approvedAt)}</span>
                  </div>
                  {detailsUser.approvedBy && (
                    <div className="text-right">
                      <span className="font-bold block">Approved By Admin</span>
                      <span className="text-[11px] font-mono">{detailsUser.approvedBy.slice(0, 10)}...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDetailsUser(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition-all cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {detailsUser.approvalStatus !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => {
                      setApprovingUser(detailsUser);
                      setDetailsUser(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Approve Account</span>
                  </button>
                )}

                {detailsUser.approvalStatus !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingUser(detailsUser);
                      setRejectionReason('');
                      setRejectionError(null);
                      setDetailsUser(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-all cursor-pointer"
                  >
                    <X size={14} />
                    <span>Reject</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CONFIRM APPROVAL MODAL ─────────────────────────────────── */}
      {approvingUser && (() => {
        const isTrial = approvingUser.selectedPlan === 'trial' || approvingUser.trialRequested;
        const isPaid = approvingUser.paymentStatus === 'paid';
        const planName = (approvingUser.selectedPlan || approvingUser.subscriptionPlan || 'standard').toUpperCase();

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={30} />
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  Approve Business Owner Account?
                </h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  You are about to approve <strong>{approvingUser.fullName || approvingUser.displayName || approvingUser.email}</strong>.
                </p>
              </div>

              {/* Contextual Plan / Trial Notice */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-left space-y-2 text-xs text-emerald-950">
                <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  {isTrial && !isPaid ? 'Activating 15-Day Free Trial (₹0)' : `Activating Annual Plan: ${planName}`}
                </p>
                <ul className="space-y-1 text-emerald-800 text-[11px]">
                  <li>✓ Set account status to <strong>Active</strong> and approval to <strong>Approved</strong></li>
                  <li>✓ Grant immediate access to Business Owner Dashboard</li>
                  {isTrial && !isPaid ? (
                    <li>✓ Start <strong>15-Day Free Trial</strong> beginning immediately today</li>
                  ) : (
                    <li>✓ Activate <strong>1-Year Paid Subscription</strong> (valid for 365 days)</li>
                  )}
                  <li>✓ Enable job posting and company profile tools</li>
                  <li>✓ Record your Admin UID and timestamp in the audit log</li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingUser(null)}
                  disabled={actionLoading === approvingUser.uid}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  disabled={actionLoading === approvingUser.uid}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {actionLoading === approvingUser.uid ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-white" />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Confirm Approval</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 3: REJECT WITH REASON MODAL ─────────────────────────────────── */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="max-w-lg w-full bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <XCircle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Reject Business Owner Registration
                  </h3>
                  <p className="text-xs text-gray-500">
                    For: {rejectingUser.fullName || rejectingUser.displayName || rejectingUser.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Please specify the revision reason. The business owner will view this message when attempting to log in, along with steps to contact admin.
            </p>

            {/* Quick Suggestions */}
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Quick Reason Suggestions:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REJECTION_REASONS.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setRejectionReason(r);
                      setRejectionError(null);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-all text-left"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Rejection Reason * <span className="text-red-500">(Required)</span>
              </label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={e => {
                  setRejectionReason(e.target.value);
                  setRejectionError(null);
                }}
                placeholder="Enter a clear reason explaining why this registration was not approved..."
                className="w-full p-3 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              />
              {rejectionError && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{rejectionError}</span>
                </p>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                disabled={actionLoading === rejectingUser.uid}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading === rejectingUser.uid}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 transition-all cursor-pointer"
              >
                {actionLoading === rejectingUser.uid ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-white" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X size={14} />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
