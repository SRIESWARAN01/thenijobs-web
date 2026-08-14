'use client';

import { useState } from 'react';
import {
  CreditCard, Search, ChevronDown, Eye, Download,
  TrendingUp, Clock, ArrowUpRight, Loader2
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { orderBy, limit } from 'firebase/firestore';

// ===== TYPES =====
interface SubscriptionDoc {
  id: string;
  businessName?: string;
  companyName?: string; // fallback
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
  companyName?: string; // fallback
  amount: number;
  plan?: string;
  paymentMethod?: string;
  status: string;
  createdAt?: any;
}

type PlanType = 'free' | 'basic' | 'premium' | 'enterprise';

// ===== CONSTANTS =====
const PLAN_CONFIG: Record<PlanType, { label: string; bg: string; text: string; price: string }> = {
  free: { label: 'Free', bg: 'bg-gray-500/15', text: 'text-gray-400', price: '₹0' },
  basic: { label: 'Basic', bg: 'bg-cyan-500/15', text: 'text-cyan-400', price: '₹40/mo' },
  premium: { label: 'Premium', bg: 'bg-violet-500/15', text: 'text-violet-400', price: '₹100/mo' },
  enterprise: { label: 'Enterprise', bg: 'bg-amber-500/15', text: 'text-amber-400', price: '₹190/mo' } };

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active: { label: 'Active', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  expired: { label: 'Expired', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-rose-500/15', text: 'text-rose-400', dot: 'bg-rose-400' } };

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

export default function SubscriptionsPage() {
  const { data: subscriptions, loading: subsLoading } = useCollection<SubscriptionDoc>('subscriptions');
  const { data: payments, loading: paymentsLoading } = useCollection<PaymentDoc>('payments', [
    orderBy('createdAt', 'desc'),
    limit(10)
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CO';
  };

  const getInitialColor = (name?: string) => {
    const code = (name || '').charCodeAt(0) || 0;
    return INITIAL_COLORS[code % INITIAL_COLORS.length];
  };

  const filteredSubs = subscriptions.filter((sub) => {
    const name = sub.businessName || sub.companyName || 'Unknown Company';
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const subPlan = sub.plan || 'free';
    const matchPlan = planFilter === 'all' || subPlan === planFilter;
    
    const subStatus = sub.status || 'active';
    const matchStatus = statusFilter === 'all' || subStatus === statusFilter;
    
    return matchSearch && matchPlan && matchStatus;
  });

  // Dynamic statistics
  const activeSubs = subscriptions.filter((s) => (s.status || 'active') === 'active');
  const activeCount = activeSubs.length;
  const expiredCount = subscriptions.filter((s) => s.status === 'expired' || s.status === 'cancelled').length;
  
  const monthlyRevenue = activeSubs.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) + monthlyRevenue * 6; // approximate projection + history

  const stats = [
    { label: 'Total Estimated Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'violet', trend: 'Live' },
    { label: 'Monthly MRR', value: `₹${monthlyRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'emerald', trend: 'Live' },
    { label: 'Active Subscriptions', value: activeCount, icon: CreditCard, color: 'cyan', trend: 'Live' },
    { label: 'Inactive Subscriptions', value: expiredCount, icon: Clock, color: 'rose', trend: 'Live' },
  ];

  const statColorMap: Record<string, { bg: string; text: string }> = {
    violet: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
    rose: { bg: 'bg-rose-500/15', text: 'text-rose-400' } };

  // Plan Distribution
  const basicCount = subscriptions.filter((s) => s.plan === 'basic').length;
  const premiumCount = subscriptions.filter((s) => s.plan === 'premium').length;
  const enterpriseCount = subscriptions.filter((s) => s.plan === 'enterprise').length;
  const freeCount = subscriptions.filter((s) => s.plan === 'free' || !s.plan).length;
  const totalCount = subscriptions.length || 1;

  const planDistribution = [
    { plan: 'Free', count: freeCount, pct: Math.round((freeCount / (totalCount || 1)) * 100), color: 'bg-gray-500', textColor: 'text-gray-400' },
    { plan: 'Basic (₹40)', count: basicCount, pct: Math.round((basicCount / (totalCount || 1)) * 100), color: 'bg-cyan-500', textColor: 'text-cyan-400' },
    { plan: 'Premium (₹100)', count: premiumCount, pct: Math.round((premiumCount / (totalCount || 1)) * 100), color: 'bg-violet-500', textColor: 'text-violet-400' },
    { plan: 'Enterprise (₹190)', count: enterpriseCount, pct: Math.round((enterpriseCount / (totalCount || 1)) * 100), color: 'bg-amber-500', textColor: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">Subscription Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage billing, plans, and revenue tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-300 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const colors = statColorMap[stat.color];
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-4 hover:border-white/[0.15] transition-all">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <Icon size={18} className={colors.text} />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-gray-400">
                  {stat.trend}
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-3 font-outfit">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Plan Distribution */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Plan Distribution</h2>
        {/* Bar */}
        <div className="w-full h-4 rounded-full bg-white overflow-hidden flex mb-4">
          {planDistribution.map((p) => (
            <div key={p.plan} className={`h-full ${p.color} transition-all duration-1000`} style={{ width: `${p.pct || 5}%` }} title={`${p.plan}: ${p.count}`} />
          ))}
        </div>
        {/* Legend */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {planDistribution.map((p) => (
            <div key={p.plan} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${p.color}`} />
              <span className="text-xs text-gray-400">{p.plan}</span>
              <span className={`text-xs font-bold ${p.textColor}`}>{p.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by business name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white border border-white/[0.1] text-sm text-gray-300 outline-none focus:border-violet-500/40 transition-all cursor-pointer">
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white border border-white/[0.1] text-sm text-gray-300 outline-none focus:border-violet-500/40 transition-all cursor-pointer">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Subscribers</h2>
        </div>
        <div className="overflow-x-auto">
          {subsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
              <p className="text-sm text-gray-400">Loading subscribers...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Business</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Amount</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Period</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Auto-Renew</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredSubs.map((sub) => {
                  const subPlan = sub.plan || 'free';
                  const planCfg = PLAN_CONFIG[subPlan] || PLAN_CONFIG.free;
                  const subStatus = sub.status || 'active';
                  const statusCfg = STATUS_CONFIG[subStatus] || STATUS_CONFIG.active;
                  const name = sub.businessName || sub.companyName || 'Unknown';
                  const initials = getInitials(name);
                  const initialBg = getInitialColor(name);

                  return (
                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${initialBg} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-xs font-bold">{initials}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                            <p className="text-[10px] text-gray-500">{sub.paymentMethod || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${planCfg.bg} ${planCfg.text}`}>
                          {planCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="text-sm text-white font-medium">₹{sub.amount || 0}</span>
                        <span className="text-xs text-gray-600">/mo</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-xs text-gray-400">
                          {sub.startDate ? new Date(sub.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : 'N/A'}
                          <span className="text-gray-600"> → </span>
                          {sub.endDate ? new Date(sub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : 'Forever'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-center">
                        <span className={`text-xs ${sub.autoRenew ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {sub.autoRenew ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white transition-all" title="View">
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!subsLoading && filteredSubs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4">
              <CreditCard size={28} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-400">No subscriptions found</p>
            <p className="text-xs text-gray-600 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent Payments</h2>
        </div>
        {paymentsLoading ? (
          <div className="p-5 flex justify-center">
            <Loader2 size={24} className="text-violet-400 animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs">
            No payments recorded yet. Active subscription MRR will count towards total estimates.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight size={16} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{payment.businessName || payment.companyName || 'Business'}</p>
                  <p className="text-[10px] text-gray-500">{payment.plan || 'Plan'} · {payment.paymentMethod || 'UPI'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-400">₹{payment.amount}</p>
                  <p className="text-[10px] text-gray-500">
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
