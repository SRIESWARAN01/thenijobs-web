'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles, RotateCcw, Plus, Search, Check, RefreshCw,
  Globe, Languages, FileText, CheckCircle2, AlertCircle,
  Eye, Edit3, Trash2, Power, Layers, ArrowUpRight
} from 'lucide-react';
import type { BillingSlogan, SloganRotationState } from '@/lib/billing/sloganLibrary';

export default function AdminSlogansPage() {
  const [loading, setLoading] = useState(true);
  const [slogans, setSlogans] = useState<BillingSlogan[]>([]);
  const [rotationState, setRotationState] = useState<SloganRotationState | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState<'all' | 'ta' | 'en'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals & Actions
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSlogan, setEditingSlogan] = useState<BillingSlogan | null>(null);
  const [formText, setFormText] = useState('');
  const [formLang, setFormLang] = useState<'ta' | 'en'>('ta');
  const [formCategory, setFormCategory] = useState('business');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchSlogans = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/slogans');
      const data = await res.json();
      if (data.success) {
        setSlogans(data.slogans || []);
        setRotationState(data.rotationState || null);
      }
    } catch (err) {
      console.error('Failed to load slogans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlogans();
  }, []);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleSeedMaster = async () => {
    if (!confirm('Sync/Seed all 100 approved THENIJOBS master slogans into library? Existing custom slogans will be preserved.')) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/slogans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message);
        fetchSlogans();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert('Seed failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetCycle = async () => {
    const nextCycle = (rotationState?.cycle || 1) + 1;
    if (!confirm(`Reset slogan rotation and advance to Cycle ${nextCycle}? All 100 slogans will be available again.`)) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/slogans/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycle: nextCycle }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message);
        fetchSlogans();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (slogan: BillingSlogan) => {
    try {
      const res = await fetch(`/api/admin/slogans/${slogan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !slogan.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setSlogans((prev) =>
          prev.map((s) => (s.id === slogan.id ? { ...s, isActive: !s.isActive } : s))
        );
        showFeedback(`Slogan #${slogan.sloganNumber} set to ${!slogan.isActive ? 'Active' : 'Inactive'}.`);
      }
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };

  const handleSaveSlogan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) return;

    try {
      setActionLoading(true);
      if (editingSlogan) {
        // Update
        const res = await fetch(`/api/admin/slogans/${editingSlogan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: formText.trim(),
            language: formLang,
            category: formCategory,
          }),
        });
        const data = await res.json();
        if (data.success) {
          showFeedback('Slogan updated successfully.');
          setIsAddModalOpen(false);
          setEditingSlogan(null);
          fetchSlogans();
        } else {
          alert(data.error);
        }
      } else {
        // Create
        const res = await fetch('/api/admin/slogans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: formText.trim(),
            language: formLang,
            category: formCategory,
            sloganNumber: slogans.length + 1,
          }),
        });
        const data = await res.json();
        if (data.success) {
          showFeedback('New slogan added to rotation library.');
          setIsAddModalOpen(false);
          fetchSlogans();
        } else {
          alert(data.error);
        }
      }
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (slogan: BillingSlogan) => {
    if (!confirm(`Delete Slogan #${slogan.sloganNumber}: "${slogan.text.substring(0, 30)}..."?`)) return;
    try {
      const res = await fetch(`/api/admin/slogans/${slogan.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSlogans((prev) => prev.filter((s) => s.id !== slogan.id));
        showFeedback('Slogan removed.');
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Filtered List
  const filtered = slogans.filter((s) => {
    const matchesSearch = s.text.toLowerCase().includes(search.toLowerCase());
    const matchesLang = langFilter === 'all' || s.language === langFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.isActive) ||
      (statusFilter === 'inactive' && !s.isActive);
    return matchesSearch && matchesLang && matchesStatus;
  });

  const totalActive = slogans.filter((s) => s.isActive).length;
  const tamilCount = slogans.filter((s) => s.language === 'ta').length;
  const englishCount = slogans.filter((s) => s.language === 'en').length;
  const usedInCurrentCycle = rotationState?.usedSloganIds?.length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>THENIJOBS Invoice Dynamic Slogan Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Billing Slogan Library & Rotation
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Every new employer subscription bill automatically rotates through approved slogans (50 Tamil + 50 English) with PDF & print formatting.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSeedMaster}
            disabled={actionLoading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync 100 Slogans</span>
          </button>

          <button
            onClick={handleResetCycle}
            disabled={actionLoading}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Cycle</span>
          </button>

          <button
            onClick={() => {
              setEditingSlogan(null);
              setFormText('');
              setFormLang('ta');
              setFormCategory('business');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slogan</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {feedbackMsg}
        </div>
      )}

      {/* METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Library Size
          </span>
          <div className="text-3xl font-black text-slate-900">{slogans.length}</div>
          <p className="text-xs text-slate-500 mt-1">
            {tamilCount} Tamil • {englishCount} English
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Active in Rotation
          </span>
          <div className="text-3xl font-black text-emerald-600">{totalActive}</div>
          <p className="text-xs text-slate-500 mt-1">Eligible for assignment</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-blue-200 bg-blue-50/40 shadow-xs">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block mb-1">
            Current Rotation Cycle
          </span>
          <div className="text-3xl font-black text-blue-900">
            Cycle {rotationState?.cycle || 1}
          </div>
          <p className="text-xs text-blue-700 mt-1">
            {usedInCurrentCycle} / {totalActive} slogans used
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Slogans Assigned
          </span>
          <div className="text-3xl font-black text-slate-900">
            {rotationState?.totalAssignedCount || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Invoices with dynamic slogans</p>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search slogan keywords..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Language filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setLangFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                langFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setLangFilter('ta')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                langFilter === 'ta' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              தமிழ் (50)
            </button>
            <button
              onClick={() => setLangFilter('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                langFilter === 'en' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              English (50)
            </button>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* SLOGANS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
            Loading slogan library...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No slogans match the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold w-16">#</th>
                  <th className="py-3 px-4 font-bold">Slogan Text</th>
                  <th className="py-3 px-4 font-bold">Language</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">Usage</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((slogan) => (
                  <tr key={slogan.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-500">
                      {slogan.sloganNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-md">
                      <div className="leading-snug">{slogan.text}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {slogan.language === 'ta' ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          தமிழ்
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          English
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono">
                        {slogan.category || 'general'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      <span className="font-bold text-slate-900">{slogan.usageCount || 0}</span> times
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(slogan)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          slogan.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <Power size={11} />
                        {slogan.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingSlogan(slogan);
                            setFormText(slogan.text);
                            setFormLang(slogan.language);
                            setFormCategory(slogan.category || 'business');
                            setIsAddModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                          title="Edit Slogan"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(slogan)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          title="Delete Slogan"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {editingSlogan ? `Edit Slogan #${editingSlogan.sloganNumber}` : 'Add New Billing Slogan'}
            </h3>
            <p className="text-slate-600 text-xs mb-4">
              Enter the tagline to be printed and displayed on invoices and receipts.
            </p>

            <form onSubmit={handleSaveSlogan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Slogan Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="e.g. தேனியின் தொழில் வளர்ப்பில் உங்கள் நம்பகமான பங்குதாரர்."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Language
                  </label>
                  <select
                    value={formLang}
                    onChange={(e) => setFormLang(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="business">Business Growth</option>
                    <option value="recruitment">Recruitment</option>
                    <option value="trust">Trust & Quality</option>
                    <option value="community">Theni Pride</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : editingSlogan ? 'Update Slogan' : 'Add to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
