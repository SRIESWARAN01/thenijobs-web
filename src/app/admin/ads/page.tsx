'use client';

import { useState } from 'react';
import { Megaphone, Eye, Search, Play, Pause, Trash2, Loader2, Plus } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';

// ===== TYPES =====
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

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  paused: 'bg-amber-500/10 text-amber-400',
  ended: 'bg-gray-500/10 text-gray-400',
  draft: 'bg-cyan-500/10 text-cyan-400',
};

const typeColors: Record<string, string> = {
  Banner: 'bg-violet-500/10 text-violet-400',
  Sponsored: 'bg-cyan-500/10 text-cyan-400',
  Featured: 'bg-amber-500/10 text-amber-400',
};

export default function AdsPage() {
  const { data: ads, loading } = useCollection<AdDoc>('advertisements');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = ads.filter(a => {
    const title = a.title || '';
    const placement = a.placement || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      placement.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handlePause = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDocument('advertisements', id, { status: 'paused' });
    } catch (err) {
      console.error('Pause ad campaign error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePlay = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDocument('advertisements', id, { status: 'active' });
    } catch (err) {
      console.error('Play ad campaign error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this ad campaign?')) return;
    setActionLoading(id);
    try {
      await deleteDocument('advertisements', id);
    } catch (err) {
      console.error('Delete ad campaign error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Dynamic statistics
  const activeCount = ads.filter(a => a.status === 'active').length;
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) + '%' : '0.0%';

  const formatLargeNum = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const stats = [
    { label: 'Active Campaigns', value: activeCount, color: 'violet' },
    { label: 'Total Impressions', value: formatLargeNum(totalImpressions), color: 'cyan' },
    { label: 'Total Clicks', value: totalClicks.toLocaleString(), color: 'emerald' },
    { label: 'Avg. CTR', value: avgCtr, color: 'amber' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Advertisement Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage banner ads, sponsored listings, and campaigns</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4">
            <p className="text-2xl font-bold text-white font-outfit">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Campaigns</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input pl-9 pr-4 py-2 text-sm w-48"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
              <p className="text-sm text-gray-400">Loading ad campaigns...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500">Campaign</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 hidden sm:table-cell">Type</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 hidden md:table-cell">Period</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Impressions</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Clicks</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 hidden sm:table-cell">CTR</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Status</th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map(c => {
                  const adStatus = c.status || 'draft';
                  const impressions = c.impressions || 0;
                  const clicks = c.clicks || 0;
                  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) + '%' : '0.0%';

                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-white">{c.title || 'Untitled Campaign'}</p>
                        <p className="text-[10px] text-gray-500">{c.placement || 'Other'}</p>
                      </td>
                      <td className="px-3 py-3.5 text-center hidden sm:table-cell">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${typeColors[c.type] || 'bg-gray-500/10 text-gray-400'}`}>{c.type}</span>
                      </td>
                      <td className="px-3 py-3.5 text-center hidden md:table-cell">
                        <p className="text-[10px] text-gray-400">{c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN') : 'Recent'}</p>
                        <p className="text-[10px] text-gray-600">to {c.endDate ? new Date(c.endDate).toLocaleDateString('en-IN') : 'Ongoing'}</p>
                      </td>
                      <td className="px-3 py-3.5 text-center text-sm text-gray-300">{impressions.toLocaleString()}</td>
                      <td className="px-3 py-3.5 text-center text-sm text-cyan-400 font-medium">{clicks.toLocaleString()}</td>
                      <td className="px-3 py-3.5 text-center text-sm text-emerald-400 font-medium hidden sm:table-cell">{ctr}</td>
                      <td className="px-3 py-3.5 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[adStatus] || 'bg-gray-500/10 text-gray-400'}`}>{adStatus}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {actionLoading === c.id ? (
                            <Loader2 size={14} className="text-violet-400 animate-spin" />
                          ) : (
                            <>
                              {adStatus === 'active' ? (
                                <button
                                  onClick={() => handlePause(c.id)}
                                  className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                  title="Pause Campaign"
                                >
                                  <Pause size={14} />
                                </button>
                              ) : adStatus !== 'ended' ? (
                                <button
                                  onClick={() => handlePlay(c.id)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                  title="Resume Campaign"
                                >
                                  <Play size={14} />
                                </button>
                              ) : null}
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                                title="Delete Campaign"
                              >
                                <Trash2 size={14} />
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
