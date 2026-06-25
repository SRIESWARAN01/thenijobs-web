'use client';

import { useState } from 'react';
import { Star, Clock, CheckCircle, XCircle, Eye, Search, Loader2 } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';

// ===== TYPES =====
interface ServiceDoc {
  id: string;
  name: string;
  providerName?: string;
  provider?: string; // fallback
  providerId?: string;
  category?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
  price?: string; // fallback
  status?: 'active' | 'pending' | 'paused' | 'rejected';
  rating?: number;
  reviewsCount?: number;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-400',
  paused: 'bg-gray-500/10 text-gray-400',
  rejected: 'bg-rose-500/10 text-rose-400',
};

export default function ServicesPage() {
  const { data: services, loading } = useCollection<ServiceDoc>('services');
  const [tab, setTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = services.filter(s => {
    const serviceStatus = s.status || 'pending';
    const matchTab = tab === 'all' ? true : serviceStatus === tab;

    const name = s.name || '';
    const provider = s.providerName || s.provider || 'Unknown';
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.toLowerCase().includes(searchQuery.toLowerCase());

    return matchTab && matchSearch;
  });

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDocument('services', id, { status: 'active' });
    } catch (err) {
      console.error('Approve service error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDocument('services', id, { status: 'rejected' });
    } catch (err) {
      console.error('Reject service error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Dynamic statistics
  const totalCount = services.length;
  const activeCount = services.filter(s => s.status === 'active').length;
  const pendingCount = services.filter(s => (s.status || 'pending') === 'pending').length;
  const providersCount = new Set(services.map(s => s.providerId).filter(Boolean)).size;

  const stats = [
    { label: 'Total Services', value: totalCount, color: 'violet' },
    { label: 'Active', value: activeCount, color: 'emerald' },
    { label: 'Pending', value: pendingCount, color: 'amber' },
    { label: 'Providers', value: providersCount, color: 'cyan' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white font-outfit">Service Marketplace</h1>
        <p className="text-sm text-gray-400 mt-1">Manage service listings and providers</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4">
            <p className="text-2xl font-bold text-white font-outfit">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['all', 'active', 'pending'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-all ${tab === t ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20' : 'text-gray-400 hover:bg-white/[0.04]'}`}>
              {t === 'all' ? 'All Services' : t}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input w-full pl-9 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
              <p className="text-sm text-gray-400">Loading services from Firestore...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500">Service</th>
                  <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 hidden md:table-cell">Provider</th>
                  <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 hidden lg:table-cell">District</th>
                  <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Price</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Rating</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Status</th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map(s => {
                  const sStatus = s.status || 'pending';
                  const priceText = s.priceMin && s.priceMax ? `₹${s.priceMin.toLocaleString('en-IN')} - ₹${s.priceMax.toLocaleString('en-IN')}` : s.price || 'Price N/A';

                  return (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-white">{s.name}</p>
                        <p className="text-[10px] text-gray-500">{s.category || 'General'}</p>
                      </td>
                      <td className="px-3 py-3.5 text-sm text-gray-400 hidden md:table-cell">{s.providerName || s.provider || 'Unknown'}</td>
                      <td className="px-3 py-3.5 text-sm text-gray-500 hidden lg:table-cell">{s.district || 'Theni'}</td>
                      <td className="px-3 py-3.5 text-sm text-gray-300">{priceText}</td>
                      <td className="px-3 py-3.5 text-center">
                        {s.rating && s.rating > 0 ? (
                          <span className="flex items-center justify-center gap-1 text-sm text-amber-400">
                            <Star size={12} className="fill-amber-400" />{s.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">N/A</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[sStatus]}`}>{sStatus}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {actionLoading === s.id ? (
                            <Loader2 size={14} className="text-violet-400 animate-spin" />
                          ) : (
                            <>
                              {sStatus === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(s.id)}
                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                    title="Approve Service"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleReject(s.id)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                                    title="Reject Service"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </>
                              )}
                              <button className="p-1.5 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]" title="View Details">
                                <Eye size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
