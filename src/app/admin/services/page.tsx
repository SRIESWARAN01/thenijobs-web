'use client';

import { useState } from 'react';
import {
  Star, Clock, CheckCircle, XCircle, Eye, Search, Loader2,
  Pencil, RotateCcw, Trash2, X, Save, AlertTriangle,
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';

// ===== TYPES =====
interface ServiceDoc {
  id: string;
  name: string;
  description?: string;
  providerName?: string;
  provider?: string; // fallback
  providerId?: string;
  category?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
  price?: string; // fallback
  status?: 'active' | 'pending' | 'paused' | 'rejected' | 'deleted';
  rating?: number;
  reviewsCount?: number;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-400',
  paused: 'bg-gray-500/10 text-gray-400',
  rejected: 'bg-rose-500/10 text-rose-400',
  deleted: 'bg-red-500/10 text-red-500',
};

const TABS = [
  { key: 'all', label: 'All Services' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'paused', label: 'Paused' },
  { key: 'deleted', label: 'Deleted' },
];

export default function ServicesPage() {
  const { data: services, loading } = useCollection<ServiceDoc>('services');
  const [tab, setTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editService, setEditService] = useState<ServiceDoc | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    category: string;
    district: string;
    priceMin: string;
    priceMax: string;
    description: string;
    status: string;
  }>({ name: '', category: '', district: '', priceMin: '', priceMax: '', description: '', status: '' });
  const [editSaving, setEditSaving] = useState(false);

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
      alert('Failed to approve service.');
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
      alert('Failed to reject service.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDocument('services', id, { status: 'active' });
    } catch (err) {
      console.error('Restore service error:', err);
      alert('Failed to restore service.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service? This will mark it as deleted.')) return;
    setActionLoading(id);
    try {
      await updateDocument('services', id, { status: 'deleted' });
    } catch (err) {
      console.error('Delete service error:', err);
      alert('Failed to delete service.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('⚠️ PERMANENT DELETE: This cannot be undone. Are you absolutely sure?')) return;
    setActionLoading(id);
    try {
      await deleteDocument('services', id);
    } catch (err) {
      console.error('Permanent delete service error:', err);
      alert('Failed to permanently delete service.');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (s: ServiceDoc) => {
    setEditService(s);
    setEditForm({
      name: s.name || '',
      category: s.category || '',
      district: s.district || '',
      priceMin: s.priceMin?.toString() || '',
      priceMax: s.priceMax?.toString() || '',
      description: s.description || '',
      status: s.status || 'pending',
    });
  };

  const handleEditSave = async () => {
    if (!editService) return;
    setEditSaving(true);
    try {
      const updates: Record<string, any> = {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        district: editForm.district.trim(),
        description: editForm.description.trim(),
        status: editForm.status,
      };
      if (editForm.priceMin) updates.priceMin = Number(editForm.priceMin);
      if (editForm.priceMax) updates.priceMax = Number(editForm.priceMax);

      await updateDocument('services', editService.id, updates);
      setEditService(null);
    } catch (err: any) {
      console.error('Edit service error:', err);
      alert('Failed to save changes: ' + (err.message || err));
    } finally {
      setEditSaving(false);
    }
  };

  // Dynamic statistics
  const totalCount = services.length;
  const activeCount = services.filter(s => s.status === 'active').length;
  const pendingCount = services.filter(s => (s.status || 'pending') === 'pending').length;
  const rejectedCount = services.filter(s => s.status === 'rejected').length;
  const deletedCount = services.filter(s => s.status === 'deleted').length;
  const providersCount = new Set(services.map(s => s.providerId).filter(Boolean)).size;

  const stats = [
    { label: 'Total Services', value: totalCount, color: 'violet' },
    { label: 'Active', value: activeCount, color: 'emerald' },
    { label: 'Pending', value: pendingCount, color: 'amber' },
    { label: 'Rejected / Deleted', value: rejectedCount + deletedCount, color: 'rose' },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white font-outfit">Service Marketplace</h1>
        <p className="text-sm text-gray-400 mt-1">Manage service listings and providers</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const colors = colorMap[s.color];
          return (
            <div key={s.label} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-white font-outfit">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
                <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <Star size={16} className={colors.text} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-all ${tab === t.key ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20' : 'text-gray-400 hover:bg-white/[0.04]'}`}>
              {t.label}
              {t.key === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold">{pendingCount}</span>
              )}
              {t.key === 'rejected' && rejectedCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-bold">{rejectedCount}</span>
              )}
              {t.key === 'deleted' && deletedCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold">{deletedCount}</span>
              )}
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
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
                <Search size={20} className="text-gray-500" />
              </div>
              <p className="text-sm text-gray-400">No services found in this category.</p>
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
                  const isDeleted = sStatus === 'deleted';
                  const isRejected = sStatus === 'rejected';

                  return (
                    <tr key={s.id} className={`hover:bg-white/[0.02] transition-colors ${isDeleted ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-3.5">
                        <p className={`text-sm font-medium ${isDeleted ? 'text-gray-500 line-through' : 'text-white'}`}>{s.name}</p>
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
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[sStatus] || statusColors.pending}`}>{sStatus}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {actionLoading === s.id ? (
                            <Loader2 size={14} className="text-violet-400 animate-spin" />
                          ) : (
                            <>
                              {/* Edit — Available for ALL statuses */}
                              <button
                                onClick={() => openEditModal(s)}
                                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                title="Edit Service"
                              >
                                <Pencil size={14} />
                              </button>

                              {/* Approve — for pending */}
                              {sStatus === 'pending' && (
                                <button
                                  onClick={() => handleApprove(s.id)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                  title="Approve Service"
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}

                              {/* Reject — for pending or active */}
                              {(sStatus === 'pending' || sStatus === 'active') && (
                                <button
                                  onClick={() => handleReject(s.id)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                                  title="Reject Service"
                                >
                                  <XCircle size={14} />
                                </button>
                              )}

                              {/* Restore — for rejected or deleted */}
                              {(isRejected || isDeleted) && (
                                <button
                                  onClick={() => handleRestore(s.id)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                  title="Restore / Reactivate"
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}

                              {/* Soft Delete — for active, pending, rejected, paused */}
                              {!isDeleted && (
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                  title="Delete Service"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}

                              {/* Permanent Delete — only for already-deleted services */}
                              {isDeleted && (
                                <button
                                  onClick={() => handlePermanentDelete(s.id)}
                                  className="p-1.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                                  title="Permanently Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}

                              {/* View */}
                              <button className="p-1.5 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] transition-colors" title="View Details">
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

      {/* ===== EDIT SERVICE MODAL ===== */}
      {editService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setEditService(null)}>
          <div className="glass-card w-full max-w-lg rounded-2xl border border-violet-500/20 p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-400">Edit Service</p>
                <h2 className="mt-1 text-lg font-bold text-white">{editService.name}</h2>
                <p className="text-[10px] text-gray-500 mt-0.5">ID: {editService.id}</p>
              </div>
              <button onClick={() => setEditService(null)} className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]">
                <X size={16} />
              </button>
            </div>

            {/* Status Warning */}
            {(editForm.status === 'deleted' || editForm.status === 'rejected') && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                <p className="text-[11px] text-amber-300">
                  This service is currently <strong>{editForm.status}</strong>. You can change the status below to reactivate it.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Service Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-sm rounded-xl text-white placeholder:text-gray-600 focus:border-violet-500/30 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Category</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-sm rounded-xl text-white placeholder:text-gray-600 focus:border-violet-500/30 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">District</label>
                  <input
                    type="text"
                    value={editForm.district}
                    onChange={e => setEditForm(f => ({ ...f, district: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-sm rounded-xl text-white placeholder:text-gray-600 focus:border-violet-500/30 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Min Price (₹)</label>
                  <input
                    type="number"
                    value={editForm.priceMin}
                    onChange={e => setEditForm(f => ({ ...f, priceMin: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-sm rounded-xl text-white placeholder:text-gray-600 focus:border-violet-500/30 outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Max Price (₹)</label>
                  <input
                    type="number"
                    value={editForm.priceMax}
                    onChange={e => setEditForm(f => ({ ...f, priceMax: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-sm rounded-xl text-white placeholder:text-gray-600 focus:border-violet-500/30 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-sm rounded-xl text-white placeholder:text-gray-600 focus:border-violet-500/30 outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-white/[0.08] px-3 py-2 text-sm rounded-xl text-white focus:border-violet-500/30 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="paused">Paused</option>
                  <option value="rejected">Rejected</option>
                  <option value="deleted">Deleted</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleEditSave}
                disabled={editSaving || !editForm.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {editSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditService(null)}
                className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-semibold text-gray-400 hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
