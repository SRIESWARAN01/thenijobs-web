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

  const handleDownloadGSTInvoice = async (item: any) => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const invNum = `INV-TNJ-${String(item.id || Date.now()).slice(-6).toUpperCase()}`;
      const amount = Number(item.amount) || 999;
      const baseAmount = Math.round(amount / 1.18);
      const gstAmount = amount - baseAmount;
      const cgst = Math.round(gstAmount / 2);
      const sgst = gstAmount - cgst;
      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      // Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42);
      pdf.text('TAX INVOICE', 105, 25, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(5, 150, 105);
      pdf.text('THENIJOBS DIGITAL PRIVATE LIMITED', 20, 38);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Reg Office: NRT Road, Theni District, Tamil Nadu - 625531', 20, 44);
      pdf.text('GSTIN: 33AAAAA0000A1Z5 | Support: support@thenijobs.com', 20, 49);

      // Invoice Meta
      pdf.setDrawColor(226, 232, 240);
      pdf.line(20, 55, 190, 55);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`Invoice No: ${invNum}`, 20, 64);
      pdf.text(`Invoice Date: ${dateStr}`, 140, 64);

      pdf.text('Billed To (Customer):', 20, 75);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Company: ${item.businessName || item.companyName || 'Registered Employer'}`, 20, 81);
      pdf.text('State: Tamil Nadu (Code: 33)', 20, 86);

      // Table Header
      pdf.setFillColor(241, 245, 249);
      pdf.rect(20, 95, 170, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Description / Service Plan', 24, 100);
      pdf.text('HSN / SAC', 110, 100);
      pdf.text('Amount (INR)', 160, 100);

      // Table Item
      pdf.setFont('helvetica', 'normal');
      pdf.text(`THENIJOBS — ${(item.plan || 'Standard').toUpperCase()} Annual Subscription`, 24, 110);
      pdf.text('998314', 110, 110);
      pdf.text(`₹${baseAmount.toLocaleString('en-IN')}`, 160, 110);

      pdf.line(20, 116, 190, 116);

      // Totals Breakdown
      pdf.text('Taxable Base Amount:', 110, 125);
      pdf.text(`₹${baseAmount.toLocaleString('en-IN')}`, 165, 125);

      pdf.text('CGST (9%):', 110, 131);
      pdf.text(`₹${cgst.toLocaleString('en-IN')}`, 165, 131);

      pdf.text('SGST (9%):', 110, 137);
      pdf.text(`₹${sgst.toLocaleString('en-IN')}`, 165, 137);

      pdf.line(110, 142, 190, 142);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Total Paid Amount:', 110, 150);
      pdf.text(`₹${amount.toLocaleString('en-IN')}`, 165, 150);

      // Footer
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('This is a computer-generated tax invoice and requires no physical signature.', 105, 270, { align: 'center' });

      pdf.save(`${invNum}-invoice.pdf`);
    } catch (e) {
      console.error('Invoice error:', e);
    }
  };

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
                    <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice</th>
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
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDownloadGSTInvoice(sub)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                            title="Download GST Tax Invoice PDF"
                          >
                            <Download size={12} /> Tax Invoice
                          </button>
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
