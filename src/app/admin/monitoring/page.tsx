'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock, Search, Phone, Mail, MessageSquare, AlertTriangle,
  Crown, Briefcase, ChevronRight, Loader2, CalendarClock, ExternalLink
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';

function getWhatsAppLink(phone: any, text: string) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (!cleanPhone) return '#';
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

export default function ExpiryMonitoringPage() {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'jobs'>('subscriptions');
  const [searchQuery, setSearchQuery] = useState('');
  const [daysFilter, setDaysFilter] = useState<'all' | 'critical' | 'soon' | 'expired'>('all');

  // Fetch all subscriptions, jobs, and companies
  const { data: subscriptions, loading: subLoading } = useCollection<any>('subscriptions');
  const { data: jobs, loading: jobsLoading } = useCollection<any>('jobs');
  const { data: companies, loading: companiesLoading } = useCollection<any>('companies');

  const loading = subLoading || jobsLoading || companiesLoading;

  // Map companies by ID for fast lookup
  const companiesMap = useMemo(() => {
    const map: Record<string, any> = {};
    companies.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [companies]);

  // Subscriptions processing
  const subscriptionItems = useMemo(() => {
    return subscriptions.map((sub: any) => {
      const company = sub.companyId ? companiesMap[sub.companyId] : null;
      
      // Calculate days remaining if not set or dynamic
      let days = sub.daysRemaining;
      if (days === undefined && sub.endDate) {
        const expiry = sub.endDate.toDate ? sub.endDate.toDate() : new Date(sub.endDate);
        const diff = expiry.getTime() - Date.now();
        days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      const email = sub.email || sub.requesterEmail || company?.email || '';
      const phone = sub.phone || sub.mobile || sub.requesterPhone || company?.phone || '';
      const ownerName = sub.userName || sub.requesterName || company?.ownerName || 'Company Owner';
      const companyName = sub.companyName || sub.businessName || company?.name || 'Unknown Business';

      return {
        ...sub,
        companyName,
        ownerName,
        phone,
        email,
        daysRemaining: days !== undefined ? days : -1,
      };
    });
  }, [subscriptions, companiesMap]);

  // Jobs processing
  const jobItems = useMemo(() => {
    return jobs.map((job: any) => {
      const company = job.companyId ? companiesMap[job.companyId] : null;

      // Calculate days remaining
      let days = -1;
      if (job.expiresAt) {
        const expiry = job.expiresAt.toDate ? job.expiresAt.toDate() : new Date(job.expiresAt);
        const diff = expiry.getTime() - Date.now();
        days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      const email = company?.email || '';
      const phone = company?.phone || '';
      const ownerName = company?.ownerName || 'Company Owner';
      const companyName = job.companyName || company?.name || 'Unknown Business';

      // Check if expired
      const isExpired = job.status === 'expired' || (days !== -1 && days <= 0);

      return {
        ...job,
        companyName,
        ownerName,
        phone,
        email,
        daysRemaining: days,
        isExpired,
      };
    });
  }, [jobs, companiesMap]);

  // Statistics
  const stats = useMemo(() => {
    const expiredSubs = subscriptionItems.filter(s => s.daysRemaining <= 0).length;
    const expiringSoonSubs = subscriptionItems.filter(s => s.daysRemaining > 0 && s.daysRemaining <= 100).length;
    
    const expiredJobs = jobItems.filter(j => j.isExpired).length;
    const expiringSoonJobs = jobItems.filter(j => !j.isExpired && j.daysRemaining > 0 && j.daysRemaining <= 7).length;

    return {
      expiredSubs,
      expiringSoonSubs,
      expiredJobs,
      expiringSoonJobs
    };
  }, [subscriptionItems, jobItems]);

  // Filter items
  const filteredSubscriptions = useMemo(() => {
    return subscriptionItems.filter((sub) => {
      const matchesSearch = 
        sub.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.planName || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (daysFilter === 'expired') {
        return sub.daysRemaining <= 0;
      }
      if (daysFilter === 'critical') {
        return sub.daysRemaining > 0 && sub.daysRemaining <= 5;
      }
      if (daysFilter === 'soon') {
        return sub.daysRemaining > 5 && sub.daysRemaining <= 100;
      }
      return true;
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [subscriptionItems, searchQuery, daysFilter]);

  const filteredJobs = useMemo(() => {
    return jobItems.filter((job) => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (daysFilter === 'expired') {
        return job.isExpired;
      }
      if (daysFilter === 'critical') {
        return !job.isExpired && job.daysRemaining > 0 && job.daysRemaining <= 2;
      }
      if (daysFilter === 'soon') {
        return !job.isExpired && job.daysRemaining > 2 && job.daysRemaining <= 7;
      }
      return true;
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [jobItems, searchQuery, daysFilter]);

  return (
    <div className="space-y-6 font-outfit text-white animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Expiry & Renewal Monitoring</h1>
        <p className="text-sm text-gray-400 mt-1">
          Monitor expiring subscriptions and job postings. Call, WhatsApp or email business owners directly to manage renewals.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-white/[0.06] relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <Crown size={20} className="text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.expiredSubs}</p>
              <p className="text-xs text-gray-400 mt-0.5">Expired Subscriptions</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/[0.06] relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Crown size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.expiringSoonSubs}</p>
              <p className="text-xs text-gray-400 mt-0.5">Expiring Subscriptions (≤100d)</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/[0.06] relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <Briefcase size={20} className="text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.expiredJobs}</p>
              <p className="text-xs text-gray-400 mt-0.5">Expired Job Posts</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/[0.06] relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.expiringSoonJobs}</p>
              <p className="text-xs text-gray-400 mt-0.5">Expiring Jobs (≤7d)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06] w-full md:w-auto">
          <button
            onClick={() => { setActiveTab('subscriptions'); setDaysFilter('all'); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all w-full md:w-auto ${
              activeTab === 'subscriptions'
                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Subscriptions ({subscriptionItems.length})
          </button>
          <button
            onClick={() => { setActiveTab('jobs'); setDaysFilter('all'); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all w-full md:w-auto ${
              activeTab === 'jobs'
                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Job Postings ({jobItems.length})
          </button>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-violet-500/40 outline-none transition-all"
          >
            <option value="all">All Days Remaining</option>
            {activeTab === 'subscriptions' ? (
              <>
                <option value="expired">Expired (≤ 0 days)</option>
                <option value="critical">Critical (1 - 5 days)</option>
                <option value="soon">Expiring Soon (6 - 100 days)</option>
              </>
            ) : (
              <>
                <option value="expired">Expired (≤ 0 days)</option>
                <option value="critical">Critical (1 - 2 days)</option>
                <option value="soon">Expiring Soon (3 - 7 days)</option>
              </>
            )}
          </select>

          <div className="relative max-w-sm w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder={activeTab === 'subscriptions' ? 'Search by business, plan...' : 'Search by job title, company...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-500 focus:border-violet-500/40 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading monitoring data...</p>
        </div>
      ) : activeTab === 'subscriptions' ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Business / Owner</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Plan Details</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Validity Period</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Remaining Days</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      No subscription accounts found matching your selection.
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((sub) => {
                    const days = sub.daysRemaining;
                    const statusClass = 
                      days <= 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      days <= 5 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                      days <= 100 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';

                    const messageText = `Hello ${sub.ownerName}, your THENIJOBS Subscription (${sub.planName || 'Plan'}) is ${days <= 0 ? 'expired' : `expiring in ${days} days`}. Please contact us or visit your dashboard to renew the plan. Thank you!`;

                    return (
                      <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-white">{sub.companyName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{sub.ownerName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-400 uppercase">
                            {sub.planName || 'Yearly Plan'}
                          </span>
                          <p className="text-[10px] text-gray-500 mt-1">Amount: ₹{(sub.amount || 0).toLocaleString('en-IN')}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          <p>Start: {sub.startDate ? (sub.startDate.toDate ? sub.startDate.toDate() : new Date(sub.startDate)).toLocaleDateString('en-IN') : 'N/A'}</p>
                          <p className="mt-0.5">End: {sub.endDate ? (sub.endDate.toDate ? sub.endDate.toDate() : new Date(sub.endDate)).toLocaleDateString('en-IN') : 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}`}>
                            {days <= 0 ? 'Expired' : `${days} days left`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {sub.phone && (
                              <>
                                <a
                                  href={`tel:${sub.phone}`}
                                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-cyan-400 hover:text-cyan-300 transition-colors"
                                  title="Call Owner"
                                >
                                  <Phone size={14} />
                                </a>
                                <a
                                  href={getWhatsAppLink(sub.phone, messageText)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors"
                                  title="WhatsApp Owner"
                                >
                                  <MessageSquare size={14} />
                                </a>
                              </>
                            )}
                            {sub.email && (
                              <a
                                href={`mailto:${sub.email}?subject=THENIJOBS Subscription Renewal Alert&body=${encodeURIComponent(messageText)}`}
                                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-violet-400 hover:text-violet-300 transition-colors"
                                title="Email Owner"
                              >
                                <Mail size={14} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Job Posting</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Company Name</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Expiry Date</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Remaining Days</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      No job postings found matching your selection.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => {
                    const days = job.daysRemaining;
                    const statusClass = 
                      job.isExpired ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      days <= 2 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                      days <= 7 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';

                    const messageText = `Hello ${job.ownerName}, your Job Posting "${job.title}" on THENIJOBS is ${job.isExpired ? 'expired' : `expiring in ${days} days`}. Please let us know if you would like to renew or extend the posting. Thank you!`;

                    return (
                      <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">{job.title}</p>
                            {job.isUrgent && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/10 text-rose-400 uppercase">Urgent</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">Type: {job.jobType || 'Full Time'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-white">{job.companyName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{job.ownerName}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {job.expiresAt ? (job.expiresAt.toDate ? job.expiresAt.toDate() : new Date(job.expiresAt)).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}`}>
                            {job.isExpired ? 'Expired' : `${days} days left`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {job.phone && (
                              <>
                                <a
                                  href={`tel:${job.phone}`}
                                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-cyan-400 hover:text-cyan-300 transition-colors"
                                  title="Call Owner"
                                >
                                  <Phone size={14} />
                                </a>
                                <a
                                  href={getWhatsAppLink(job.phone, messageText)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors"
                                  title="WhatsApp Owner"
                                >
                                  <MessageSquare size={14} />
                                </a>
                              </>
                            )}
                            {job.email && (
                              <a
                                href={`mailto:${job.email}?subject=THENIJOBS Job Post Renewal Alert&body=${encodeURIComponent(messageText)}`}
                                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-violet-400 hover:text-violet-300 transition-colors"
                                  title="Email Owner"
                              >
                                <Mail size={14} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
