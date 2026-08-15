'use client';

import { useState } from 'react';
import {
  CreditCard, Search, ChevronDown, Eye, Download,
  TrendingUp, Clock, ArrowUpRight, Loader2, CheckCircle2, XCircle, Users2
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { orderBy, limit } from 'firebase/firestore';

interface SubscriptionDoc {
  id: string;
  businessName?: string;
  companyName?: string;
  plan: PlanType;
  amount: number;
  status: 'active' | 'expired' | 'cancelled';
  startDate?: any;
  endDate?: any;
  autoRenew?: boolean;
  paymentMethod?: string;
}

interface PaymentDoc {
  id: string;
  businessName?: string;
  companyName?: string;
  amount: number;
  plan?: string;
  paymentMethod?: string;
  status: string;
  createdAt?: any;
}

type PlanType = 'free' | 'basic' | 'standard' | 'premium' | 'enterprise';

const PLAN_CONFIG: Record<string, { label: string; bg: string; text: string; price: string }> = {
  free:       { label: 'Free', bg: '#F1F5F9', text: '#475569', price: '₹0' },
  basic:      { label: 'Basic', bg: '#EFF6FF', text: '#2563EB', price: '₹40/mo' },
  standard:   { label: 'Standard', bg: '#EFF6FF', text: '#2563EB', price: '₹999/yr' },
  premium:    { label: 'Premium', bg: '#F5F3FF', text: '#7C3AED', price: '₹2,499/yr' },
  enterprise: { label: 'Enterprise', bg: '#FFFBEB', text: '#D97706', price: '₹4,999/yr' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active:    { label: 'Active', bg: '#ECFDF5', text: '#059669', dot: '#059669' },
  expired:   { label: 'Expired', bg: '#F1F5F9', text: '#64748B', dot: '#64748B' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626' },
};

export default function SubscriptionsPage() {
  const { data: subscriptions, loading: subsLoading } = useCollection<SubscriptionDoc>('subscriptions');
  const { data: payments, loading: paymentsLoading } = useCollection<PaymentDoc>('payments', [
    orderBy('createdAt', 'desc'),
    limit(15)
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredSubs = subscriptions.filter((sub) => {
    const name = sub.businessName || sub.companyName || 'Company';
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const subPlan = sub.plan || 'free';
    const matchPlan = planFilter === 'all' || subPlan === planFilter;
    const subStatus = sub.status || 'active';
    const matchStatus = statusFilter === 'all' || subStatus === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const activeSubs = subscriptions.filter((s) => (s.status || 'active') === 'active');
  const activeCount = activeSubs.length;
  const expiredCount = subscriptions.filter((s) => s.status === 'expired' || s.status === 'cancelled').length;
  const monthlyRevenue = activeSubs.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const stats = [
    { label: 'Active Subscriptions', value: activeCount, icon: CreditCard, bg: '#EFF6FF', color: '#2563EB' },
    { label: 'Active MRR / Volume', value: `₹${monthlyRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, bg: '#ECFDF5', color: '#059669' },
    { label: 'Total Subscriber Base', value: subscriptions.length, icon: Users2, bg: '#F5F3FF', color: '#7C3AED' },
    { label: 'Expired / Lapsed', value: expiredCount, icon: Clock, bg: '#FEF2F2', color: '#DC2626' },
  ];

  return (
    <div className="space-y-6 font-outfit text-gray-900 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">Subscription &amp; Billing Management</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track company subscriptions, recurring revenue, and payment invoices</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style={{ background: stat.bg }}>
                  <Icon size={20} style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 font-bold">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by company or business name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="standard">Standard (₹999)</option>
            <option value="premium">Premium (₹2,499)</option>
            <option value="enterprise">Enterprise (₹4,999)</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Subscribers Grid / Table */}
      {subsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-blue-600 animate-spin" />
          <p className="text-xs text-gray-500 font-semibold">Loading subscription records...</p>
        </div>
      ) : filteredSubs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-xs">
          <CreditCard size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-700">No active subscriptions match this filter</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards (md:hidden) */}
          <div className="md:hidden space-y-3">
            {filteredSubs.map(sub => {
              const name = sub.businessName || sub.companyName || 'Company';
              const planCfg = PLAN_CONFIG[sub.plan || 'free'] || PLAN_CONFIG.free;
              const statusCfg = STATUS_CONFIG[sub.status || 'active'] || STATUS_CONFIG.active;

              return (
                <div key={sub.id} className="bg-white rounded-3xl p-4 border border-gray-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center shrink-0 border border-blue-100">
                        {name[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 truncate">{name}</h4>
                        <span className="text-xs font-bold" style={{ color: planCfg.text }}>
                          {planCfg.label} Plan
                        </span>
                      </div>
                    </div>

                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1"
                      style={{ background: statusCfg.bg, color: statusCfg.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot }} />
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-2xl text-xs border border-gray-100 font-medium">
                    <span className="text-gray-500">Billed Amount:</span>
                    <span className="font-bold text-emerald-700">₹{sub.amount || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (hidden md:block) */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Business</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Subscription Tier</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSubs.map(sub => {
                    const name = sub.businessName || sub.companyName || 'Company';
                    const planCfg = PLAN_CONFIG[sub.plan || 'free'] || PLAN_CONFIG.free;
                    const statusCfg = STATUS_CONFIG[sub.status || 'active'] || STATUS_CONFIG.active;

                    return (
                      <tr key={sub.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                              {name[0]?.toUpperCase() || 'C'}
                            </div>
                            <span className="text-sm font-bold text-gray-900 truncate">{name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: planCfg.bg, color: planCfg.text }}
                          >
                            {planCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-black text-emerald-700">
                          ₹{sub.amount || 0}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: statusCfg.bg, color: statusCfg.text }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot }} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-medium text-gray-600">
                          {sub.paymentMethod || 'Razorpay / UPI'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
