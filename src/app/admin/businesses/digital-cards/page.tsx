'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CreditCard, Search, Eye, Download, RefreshCw, CheckCircle,
  XCircle, Loader2, Building2, QrCode, MapPin, Phone, Crown,
  ShieldCheck, ExternalLink, Clock
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import { toDate, getDaysUntilExpiry } from '@/lib/subscriptions';

interface CompanyDoc {
  id: string;
  name?: string;
  businessName?: string;
  slug?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  district?: string;
  category?: string;
  ownerId?: string;
  ownerName?: string;
  website?: string;
  verificationStatus?: string;
  isPremium?: boolean;
  isActive?: boolean;
  subscriptionPlan?: string;
  digitalCardStatus?: 'pending' | 'approved' | 'rejected' | 'not_generated';
  digitalCardGeneratedAt?: any;
  createdAt?: any;
}

interface SubscriptionDoc {
  id: string;
  companyId?: string;
  userId?: string;
  plan?: string;
  status?: string;
  endDate?: any;
  expiresAt?: any;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  approved: { label: 'Approved', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  pending: { label: 'Pending', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  rejected: { label: 'Rejected', bg: 'bg-rose-500/15', text: 'text-rose-400', dot: 'bg-rose-400' },
  not_generated: { label: 'Not Generated', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
};

export default function AdminDigitalCardsPage() {
  const { data: companies, loading } = useCollection<CompanyDoc>('companies');
  const { data: subscriptions } = useCollection<SubscriptionDoc>('subscriptions');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'not_generated' | 'rejected'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Build subscription lookup by companyId
  const subByCompany = useMemo(() => {
    const map: Record<string, SubscriptionDoc> = {};
    subscriptions.forEach(s => {
      if (s.companyId) map[s.companyId] = s;
    });
    return map;
  }, [subscriptions]);

  const filtered = useMemo(() => {
    return companies.filter(c => {
      const name = c.name || c.businessName || '';
      const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.district || '').toLowerCase().includes(searchQuery.toLowerCase());

      const cardStatus = c.digitalCardStatus || 'not_generated';
      const matchStatus = statusFilter === 'all' || cardStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [companies, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: companies.length,
    approved: companies.filter(c => c.digitalCardStatus === 'approved').length,
    pending: companies.filter(c => c.digitalCardStatus === 'pending').length,
    notGenerated: companies.filter(c => !c.digitalCardStatus || c.digitalCardStatus === 'not_generated').length,
  }), [companies]);

  const handleApproveCard = async (companyId: string) => {
    setActionLoading(companyId + '_approve');
    try {
      await updateDocument('companies', companyId, {
        digitalCardStatus: 'approved',
        digitalCardApprovedAt: new Date(),
      });
    } catch (err: any) {
      alert('Failed to approve: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCard = async (companyId: string) => {
    const reason = window.prompt('Reason for rejection (optional):');
    if (reason === null) return; // cancelled
    setActionLoading(companyId + '_reject');
    try {
      await updateDocument('companies', companyId, {
        digitalCardStatus: 'rejected',
        digitalCardRejectedAt: new Date(),
        digitalCardRejectionReason: reason || 'Rejected by admin',
      });
    } catch (err: any) {
      alert('Failed to reject: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerateCard = async (companyId: string) => {
    setActionLoading(companyId + '_regen');
    try {
      await updateDocument('companies', companyId, {
        digitalCardStatus: 'pending',
        digitalCardGeneratedAt: new Date(),
        digitalCardApprovedAt: null,
      });
    } catch (err: any) {
      alert('Failed to regenerate: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getCardUrl = (company: CompanyDoc) => {
    const slug = company.slug || company.id;
    return `/id/company/${slug}`;
  };

  const formatDate = (val?: any) => {
    const d = toDate(val);
    return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Digital ID Cards</h1>
          <p className="text-sm text-gray-400 mt-1">Manage business digital ID cards — approve, reject, view, and download</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Companies', value: stats.total, icon: Building2, bg: 'bg-violet-500/15', text: 'text-violet-400' },
          { label: 'Approved Cards', value: stats.approved, icon: CheckCircle, bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
          { label: 'Pending Approval', value: stats.pending, icon: Clock, bg: 'bg-amber-500/15', text: 'text-amber-400' },
          { label: 'Not Generated', value: stats.notGenerated, icon: QrCode, bg: 'bg-gray-500/15', text: 'text-gray-400' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon size={18} className={stat.text} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white font-outfit">{stat.value}</p>
                  <p className="text-[10px] text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by company name, email or district..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto no-scrollbar">
          {(['all', 'approved', 'pending', 'not_generated', 'rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all capitalize ${statusFilter === s ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'}`}
            >
              {s === 'not_generated' ? 'Not Generated' : s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
            <p className="text-sm text-gray-400">Loading companies...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Category / District</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Plan & Expiry</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Card Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden xl:table-cell">Generated</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map(company => {
                  const cardStatus = company.digitalCardStatus || 'not_generated';
                  const statusConf = STATUS_CONFIG[cardStatus] || STATUS_CONFIG.not_generated;
                  const sub = subByCompany[company.id];
                  const expiresAt = sub?.endDate || sub?.expiresAt;
                  const daysLeft = expiresAt ? getDaysUntilExpiry(expiresAt) : null;
                  const isLoading = actionLoading?.startsWith(company.id);

                  return (
                    <tr key={company.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Company */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                            {company.logoUrl ? (
                              <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
                            ) : (
                              <Building2 size={16} className="text-gray-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-white truncate">{company.name || company.businessName || 'Unnamed'}</p>
                              {company.isPremium && <Crown size={12} className="text-amber-400 shrink-0" />}
                              {company.verificationStatus === 'verified' && <ShieldCheck size={12} className="text-emerald-400 shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{company.email || company.phone || 'No contact'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category / District */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-sm text-gray-300">{company.category || 'General'}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <MapPin size={10} /> {company.district || 'Theni'}
                        </p>
                      </td>

                      {/* Plan & Expiry */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-sm text-white font-medium capitalize">{sub?.plan || company.subscriptionPlan || 'Free'}</p>
                        {daysLeft !== null ? (
                          <p className={`text-xs mt-0.5 font-semibold ${daysLeft <= 7 ? 'text-rose-400' : daysLeft <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-0.5">No expiry</p>
                        )}
                      </td>

                      {/* Card Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConf.bg} ${statusConf.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Generated At */}
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <p className="text-xs text-gray-400">{formatDate(company.digitalCardGeneratedAt)}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {isLoading ? (
                            <Loader2 size={16} className="text-violet-400 animate-spin" />
                          ) : (
                            <>
                              {/* View Card */}
                              <Link
                                href={getCardUrl(company)}
                                target="_blank"
                                className="p-2 rounded-lg text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                                title="View Digital ID Card"
                              >
                                <Eye size={15} />
                              </Link>

                              {/* Approve */}
                              {cardStatus !== 'approved' && (
                                <button
                                  onClick={() => handleApproveCard(company.id)}
                                  className="p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                  title="Approve Card"
                                >
                                  <CheckCircle size={15} />
                                </button>
                              )}

                              {/* Reject */}
                              {cardStatus !== 'rejected' && (
                                <button
                                  onClick={() => handleRejectCard(company.id)}
                                  className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                  title="Reject Card"
                                >
                                  <XCircle size={15} />
                                </button>
                              )}

                              {/* Regenerate */}
                              <button
                                onClick={() => handleRegenerateCard(company.id)}
                                className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                                title="Regenerate / Reset Card"
                              >
                                <RefreshCw size={15} />
                              </button>

                              {/* Open External */}
                              <Link
                                href={getCardUrl(company)}
                                target="_blank"
                                className="p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                                title="Open Card Page"
                              >
                                <ExternalLink size={14} />
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <CreditCard size={28} className="text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-400">No companies found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/[0.06] border border-violet-500/20">
        <QrCode size={16} className="text-violet-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-violet-300">Digital ID Card Policy</p>
          <p className="text-xs text-gray-400 mt-1">
            Every business profile requires an approved Digital ID Card to be fully active.
            Cards are viewable at <code className="text-violet-300">/id/company/[slug]</code> and can be downloaded/shared by the business owner.
            Use <strong>Approve</strong> to make the card publicly visible, <strong>Reject</strong> to flag issues,
            and <strong>Regenerate</strong> to reset and re-request the card.
          </p>
        </div>
      </div>
    </div>
  );
}
