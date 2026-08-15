'use client';

import { useState } from 'react';
import { Search, Play, Pause, Trash2, Loader2, Megaphone, Eye, MousePointerClick, TrendingUp } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';

interface AdDoc {
  id: string;
  title: string;
  type: 'Banner' | 'Sponsored' | 'Featured';
  placement: string;
  status: 'active' | 'paused' | 'ended' | 'draft';
  startDate?: any;
  endDate?: any;
  impressions?: number;
  clicks?: number;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  active:  { bg: '#ECFDF5', text: '#059669', label: 'Active & Live' },
  paused:  { bg: '#FFFBEB', text: '#D97706', label: 'Paused' },
  ended:   { bg: '#F1F5F9', text: '#64748B', label: 'Ended' },
  draft:   { bg: '#EFF6FF', text: '#2563EB', label: 'Draft' },
};

const typeColors: Record<string, { bg: string; text: string }> = {
  Banner:    { bg: '#EFF6FF', text: '#2563EB' },
  Sponsored: { bg: '#F5F3FF', text: '#7C3AED' },
  Featured:  { bg: '#FFFBEB', text: '#D97706' },
};

export default function AdsPage() {
  const toast = useToast();
  const { data: ads, loading } = useCollection<AdDoc>('advertisements');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = ads.filter(a => {
    const title = a.title || '';
    const placement = a.placement || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      placement.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const next = currentStatus === 'active' ? 'paused' : 'active';
    setActionLoading(id);
    try {
      await updateDocument('advertisements', id, { status: next });
      toast.success(next === 'active' ? 'Campaign activated' : 'Campaign paused');
    } catch (err: any) {
      console.error('Toggle ad status error:', err);
      toast.error('Failed to update campaign');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this ad campaign?')) return;
    setActionLoading(id);
    try {
      await deleteDocument('advertisements', id);
      toast.info('Ad campaign deleted');
    } catch (err: any) {
      console.error('Delete ad campaign error:', err);
      toast.error('Failed to delete ad');
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = ads.filter(a => a.status === 'active').length;
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) + '%' : '0.0%';

  const stats = [
    { label: 'Active Campaigns', value: activeCount, icon: Megaphone, bg: '#EFF6FF', color: '#2563EB' },
    { label: 'Total Views / Impressions', value: totalImpressions.toLocaleString('en-IN'), icon: Eye, bg: '#F5F3FF', color: '#7C3AED' },
    { label: 'Total Clicks & Leads', value: totalClicks.toLocaleString('en-IN'), icon: MousePointerClick, bg: '#ECFDF5', color: '#059669' },
    { label: 'Average CTR', value: avgCtr, icon: TrendingUp, bg: '#FFFBEB', color: '#D97706' },
  ];

  return (
    <div className="space-y-6 font-outfit text-gray-900 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">Advertisement &amp; Banner Campaigns</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage sponsored banners, promoted listings, and click tracking metrics</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style={{ background: s.bg }}>
                  <Icon size={20} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 font-bold">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search campaigns or placements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-medium"
        />
      </div>

      {/* Campaigns Table & Responsive Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-blue-600 animate-spin" />
          <p className="text-xs text-gray-500 font-semibold">Loading campaigns...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-xs">
          <Megaphone size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-700">No campaigns found</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards (md:hidden) */}
          <div className="md:hidden space-y-3">
            {filtered.map(ad => {
              const st = statusColors[ad.status] || statusColors.draft;
              const tp = typeColors[ad.type] || typeColors.Banner;

              return (
                <div key={ad.id} className="bg-white rounded-3xl p-4 border border-gray-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{ad.title}</h3>
                      <p className="text-[11px] text-gray-500 font-medium">Placement: {ad.placement}</p>
                    </div>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold"
                      style={{ background: st.bg, color: st.text }}
                    >
                      {st.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-2xl text-center border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Type</span>
                      <span className="text-xs font-bold" style={{ color: tp.text }}>{ad.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Views</span>
                      <span className="text-xs font-bold text-gray-900">{ad.impressions || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Clicks</span>
                      <span className="text-xs font-bold text-emerald-700">{ad.clicks || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(ad.id, ad.status)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1"
                    >
                      {ad.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                      <span>{ad.status === 'active' ? 'Pause' : 'Activate'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ad.id)}
                      className="p-1.5 rounded-xl text-red-700 bg-red-50 hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                    </button>
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
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign</th>
                    <th className="text-center px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Placement</th>
                    <th className="text-center px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Impressions</th>
                    <th className="text-center px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Clicks</th>
                    <th className="text-center px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(ad => {
                    const st = statusColors[ad.status] || statusColors.draft;
                    const tp = typeColors[ad.type] || typeColors.Banner;

                    return (
                      <tr key={ad.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-sm text-gray-900">{ad.title}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: tp.bg, color: tp.text }}>
                            {ad.type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600 font-medium">{ad.placement}</td>
                        <td className="px-4 py-3.5 text-xs text-center font-bold text-gray-900">{(ad.impressions || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5 text-xs text-center font-black text-emerald-700">{(ad.clicks || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: st.bg, color: st.text }}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(ad.id, ad.status)}
                              className="p-2 rounded-xl text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                              title={ad.status === 'active' ? 'Pause Campaign' : 'Activate Campaign'}
                            >
                              {ad.status === 'active' ? <Pause size={15} /> : <Play size={15} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(ad.id)}
                              className="p-2 rounded-xl text-gray-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
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
