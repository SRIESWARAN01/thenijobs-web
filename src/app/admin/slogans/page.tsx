'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles, RotateCcw, Plus, Search, Check, RefreshCw,
  Globe, Languages, FileText, CheckCircle2, AlertCircle,
  Eye, Edit3, Trash2, Power, Layers, ArrowUpRight,
  Star, Sliders, X, Printer, ShieldCheck, Tag
} from 'lucide-react';
import {
  BillingSlogan,
  SloganRotationState,
  SloganCategory,
  SloganLanguage,
  SLOGAN_CATEGORIES,
  BILLING_MODELS,
} from '@/lib/billing/sloganLibrary';
import { auth } from '@/lib/firebase/config';

export default function AdminSlogansPage() {
  const [loading, setLoading] = useState(true);
  const [slogans, setSlogans] = useState<BillingSlogan[]>([]);
  const [rotationState, setRotationState] = useState<SloganRotationState | null>(null);
  const [modelMappings, setModelMappings] = useState<Record<string, { sloganIdTa: string; sloganIdEn: string }>>({});

  // Active view tab
  const [activeTab, setActiveTab] = useState<'library' | 'models'>('library');

  // Filters
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState<'all' | 'ta' | 'en'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Add / Edit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSlogan, setEditingSlogan] = useState<BillingSlogan | null>(null);
  const [formText, setFormText] = useState('');
  const [formLang, setFormLang] = useState<SloganLanguage>('ta');
  const [formCategory, setFormCategory] = useState<SloganCategory>('business_growth');
  const [formBillingModel, setFormBillingModel] = useState<string>('');
  const [formIsDefault, setFormIsDefault] = useState<boolean>(false);

  // Live Preview Modal State
  const [previewSlogan, setPreviewSlogan] = useState<BillingSlogan | null>(null);
  const [previewDocType, setPreviewDocType] = useState<'invoice' | 'receipt' | 'bill' | 'quotation'>('invoice');

  // Operational state
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    let currentUser = auth.currentUser;
    if (!currentUser) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      currentUser = auth.currentUser;
    }
    const token = await currentUser?.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchSlogans = async () => {
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/admin/slogans', {
        headers: authHeaders,
      });
      let data: any = {};
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
      if (data.success) {
        setSlogans(data.slogans || []);
        setRotationState(data.rotationState || null);
        setModelMappings(data.modelMappings || {});
      } else if (data.error) {
        console.error('Failed to load slogans:', data.error);
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
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  const handleSeedMaster = async (reseed = false) => {
    const confirmMsg = reseed
      ? 'Sync & overwrite all 100 master slogans and billing model defaults from code library?'
      : 'Seed missing master slogans and defaults into Firestore? Existing records will be preserved.';
    if (!confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/admin/slogans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ action: reseed ? 'reseed' : 'seed' }),
      });
      let data: any = {};
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
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
    if (!confirm(`Reset slogan rotation and advance to Cycle ${nextCycle}? All 100 slogans will become available again.`)) return;
    try {
      setActionLoading(true);
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/admin/slogans/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ cycle: nextCycle }),
      });
      let data: any = {};
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
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
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/admin/slogans/${slogan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ isActive: !slogan.isActive }),
      });
      let data: any = {};
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
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

  const handleSetDefault = async (slogan: BillingSlogan) => {
    try {
      setActionLoading(true);
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/admin/slogans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ action: 'set_default', sloganId: slogan.id }),
      });
      let data: any = {};
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
      if (data.success) {
        showFeedback(data.message);
        fetchSlogans();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert('Failed to set default: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveModelMapping = async (modelId: string, sloganIdTa: string, sloganIdEn: string) => {
    try {
      setActionLoading(true);
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/admin/slogans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          action: 'assign_model',
          modelId,
          sloganIdTa,
          sloganIdEn,
        }),
      });
      let data: any = {};
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
      if (data.success) {
        showFeedback(data.message);
        setModelMappings(data.modelMappings);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert('Failed to save mapping: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSlogan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) return;

    try {
      setActionLoading(true);
      const authHeaders = await getAuthHeaders();
      if (editingSlogan) {
        // Update existing slogan
        const res = await fetch(`/api/admin/slogans/${editingSlogan.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({
            text: formText.trim(),
            language: formLang,
            category: formCategory,
            billingModel: formBillingModel || null,
            isDefault: formIsDefault,
          }),
        });
        let data: any = {};
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
        if (data.success) {
          showFeedback('Slogan updated successfully.');
          setIsAddModalOpen(false);
          setEditingSlogan(null);
          fetchSlogans();
        } else {
          alert(data.error);
        }
      } else {
        // Create new slogan
        const res = await fetch('/api/admin/slogans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({
            text: formText.trim(),
            language: formLang,
            category: formCategory,
            billingModel: formBillingModel || null,
            isDefault: formIsDefault,
            sloganNumber: slogans.length + 1,
          }),
        });
        let data: any = {};
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
        if (data.success) {
          showFeedback('New slogan added to library.');
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
    if (!confirm(`Delete Slogan #${slogan.sloganNumber}: "${slogan.text.substring(0, 35)}..."?`)) return;
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/admin/slogans/${slogan.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      let data: any = {};
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
      if (data.success) {
        setSlogans((prev) => prev.filter((s) => s.id !== slogan.id));
        showFeedback('Slogan removed from library.');
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Filtered slogans
  const filtered = slogans.filter((s) => {
    const matchesSearch =
      s.text.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      (s.billingModel && s.billingModel.toLowerCase().includes(search.toLowerCase()));
    const matchesLang = langFilter === 'all' || s.language === langFilter;
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    const matchesModel = modelFilter === 'all' || s.billingModel === modelFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.isActive) ||
      (statusFilter === 'inactive' && !s.isActive);
    return matchesSearch && matchesLang && matchesCategory && matchesModel && matchesStatus;
  });

  const totalActive = slogans.filter((s) => s.isActive).length;
  const tamilCount = slogans.filter((s) => s.language === 'ta').length;
  const englishCount = slogans.filter((s) => s.language === 'en').length;
  const usedInCurrentCycle = rotationState?.usedSloganIds?.length || 0;

  const categoryBadgeColors: Record<string, string> = {
    business_growth: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    recruitment: 'bg-blue-50 text-blue-800 border-blue-200',
    trust_quality: 'bg-purple-50 text-purple-800 border-purple-200',
    theni_pride: 'bg-amber-50 text-amber-900 border-amber-200',
    custom: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>THENIJOBS Dynamic Slogan Library & Billing Models</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Billing Slogans & Tagline Library
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            100 Authoritative Slogans (50 Tamil + 50 English) mapped to 14 Billing Models, 5 Categories & Document Prints.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleSeedMaster(false)}
            disabled={actionLoading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Seed missing master slogans"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync 100 Slogans</span>
          </button>

          <button
            onClick={() => handleSeedMaster(true)}
            disabled={actionLoading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Reseed all master slogans to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            <span>Reseed Defaults</span>
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
              setFormCategory('business_growth');
              setFormBillingModel('');
              setFormIsDefault(false);
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
            Authoritative Library
          </span>
          <div className="text-3xl font-black text-slate-900">{slogans.length}</div>
          <p className="text-xs text-slate-500 mt-1">
            {tamilCount} Tamil • {englishCount} English
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Active in Engine
          </span>
          <div className="text-3xl font-black text-emerald-600">{totalActive}</div>
          <p className="text-xs text-slate-500 mt-1">Ready for invoice assignment</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-blue-200 bg-blue-50/40 shadow-xs">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block mb-1">
            Rotation Cycle
          </span>
          <div className="text-3xl font-black text-blue-900">
            Cycle {rotationState?.cycle || 1}
          </div>
          <p className="text-xs text-blue-700 mt-1">
            {usedInCurrentCycle} / {totalActive} slogans used in cycle
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Invoices Tagged
          </span>
          <div className="text-3xl font-black text-slate-900">
            {rotationState?.totalAssignedCount || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Deterministic & snapshots safe</p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'library'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Slogan Library ({slogans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'models'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Billing Models & Mappings ({BILLING_MODELS.length})</span>
        </button>
      </div>

      {/* TAB 1: SLOGAN LIBRARY VIEW */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col lg:flex-row items-center justify-between gap-3">
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search slogans, IDs..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
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

              {/* Category filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {SLOGAN_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} ({cat.labelTa})
                  </option>
                ))}
              </select>

              {/* Billing model filter */}
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Billing Models</option>
                {BILLING_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>

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
                      <th className="py-3 px-4 font-bold">Billing Model</th>
                      <th className="py-3 px-4 font-bold">Usage</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((slogan) => (
                      <tr key={slogan.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <span>{slogan.sloganNumber}</span>
                            {slogan.isDefault && (
                              <span title="Category Default">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-md">
                          <div className="leading-snug">{slogan.text}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
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
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg border font-bold capitalize ${
                              categoryBadgeColors[slogan.category] || 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {slogan.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {slogan.billingModel ? (
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200">
                              {slogan.billingModel}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">None</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                          <span className="font-bold text-slate-900">{slogan.usageCount || 0}</span> times
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
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
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setPreviewSlogan(slogan)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all cursor-pointer"
                              title="Preview on Invoice / Receipt"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => handleSetDefault(slogan)}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                slogan.isDefault
                                  ? 'text-amber-500 bg-amber-50'
                                  : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                              }`}
                              title={slogan.isDefault ? 'Default Slogan' : 'Make Default for Category'}
                            >
                              <Star size={15} className={slogan.isDefault ? 'fill-amber-400' : ''} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingSlogan(slogan);
                                setFormText(slogan.text);
                                setFormLang(slogan.language);
                                setFormCategory(slogan.category);
                                setFormBillingModel(slogan.billingModel || '');
                                setFormIsDefault(Boolean(slogan.isDefault));
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
        </div>
      )}

      {/* TAB 2: BILLING MODEL MAPPINGS VIEW */}
      {activeTab === 'models' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">14 Supported Billing Models & Services</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Each service automatically resolves to its assigned slogan in the invoice’s requested language (Tamil / English).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BILLING_MODELS.map((model) => {
              const currentTa = modelMappings[model.id]?.sloganIdTa || model.defaultSloganIdTa;
              const currentEn = modelMappings[model.id]?.sloganIdEn || model.defaultSloganIdEn;

              const taSlogan = slogans.find((s) => s.id === currentTa) || slogans.find((s) => s.id === model.defaultSloganIdTa);
              const enSlogan = slogans.find((s) => s.id === currentEn) || slogans.find((s) => s.id === model.defaultSloganIdEn);

              return (
                <div
                  key={model.id}
                  className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {model.id}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border capitalize ${
                          categoryBadgeColors[model.suggestedCategory] || 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {model.suggestedCategory.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{model.label}</h3>

                    {/* Slogan Pair Previews */}
                    <div className="mt-3 space-y-2">
                      <div className="text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span className="font-bold text-amber-800">தமிழ் Slogan:</span>
                          <span className="font-mono">{currentTa}</span>
                        </div>
                        <div className="font-semibold text-slate-800 leading-snug">
                          “{taSlogan?.text || '—'}”
                        </div>
                      </div>

                      <div className="text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span className="font-bold text-blue-800">English Slogan:</span>
                          <span className="font-mono">{currentEn}</span>
                        </div>
                        <div className="font-semibold text-slate-800 leading-snug">
                          “{enSlogan?.text || '—'}”
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Model Slogan Selectors */}
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Change தமிழ் Slogan
                      </label>
                      <select
                        value={currentTa}
                        onChange={(e) => handleSaveModelMapping(model.id, e.target.value, currentEn)}
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        {slogans
                          .filter((s) => s.language === 'ta' && s.isActive)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              #{s.sloganNumber}: {s.text.slice(0, 30)}...
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Change English Slogan
                      </label>
                      <select
                        value={currentEn}
                        onChange={(e) => handleSaveModelMapping(model.id, currentTa, e.target.value)}
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        {slogans
                          .filter((s) => s.language === 'en' && s.isActive)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              #{s.sloganNumber}: {s.text.slice(0, 30)}...
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIVE INVOICE & RECEIPT PREVIEW MODAL */}
      {previewSlogan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">
                  Live Document Preview — Slogan #{previewSlogan.sloganNumber}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={previewDocType}
                  onChange={(e) => setPreviewDocType(e.target.value as any)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700"
                >
                  <option value="invoice">Tax Invoice</option>
                  <option value="receipt">Payment Receipt</option>
                  <option value="bill">Bill of Supply</option>
                  <option value="quotation">Quotation / Estimate</option>
                </select>
                <button
                  onClick={() => setPreviewSlogan(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Document Representation */}
            <div className="p-6 bg-slate-100">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                {/* Header Row */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm">
                        TJ
                      </div>
                      <span className="font-black text-xl tracking-tight text-slate-900">
                        THENI<span className="text-blue-600">JOBS</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tamil Nadu&apos;s Hyperlocal Job & Business Network Platform
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Uthamapalayam, Theni District, Tamil Nadu - 625533
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg mb-1">
                      {previewDocType === 'invoice'
                        ? 'TAX INVOICE'
                        : previewDocType === 'quotation'
                        ? 'QUOTATION / ESTIMATE'
                        : previewDocType === 'bill'
                        ? 'BILL OF SUPPLY'
                        : 'PAYMENT RECEIPT'}
                    </span>
                    <div className="text-xs text-slate-500 font-mono">THENI-REC-928174</div>
                    <div className="text-[10px] text-emerald-600 font-bold">✓ PAID / ACTIVE</div>
                  </div>
                </div>

                {/* Customer Row */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-500 uppercase text-[10px] block">Billed To:</span>
                    <div className="font-bold text-slate-900">Theni Green Agrotech</div>
                    <div className="text-slate-600">contact@thenigreen.in • +91 98421 00000</div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase text-[10px] block">Plan & Subscription:</span>
                    <div className="font-bold text-slate-900">Standard Plan (Annual)</div>
                    <div className="text-slate-600">Valid: 24 Oct 2026 – 24 Oct 2027</div>
                  </div>
                </div>

                {/* SLOGAN BADGE (EXACT CANVAS SIMULATION) */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center space-y-1">
                  <div className="font-bold italic text-blue-700 text-sm sm:text-base leading-snug">
                    “{previewSlogan.text}”
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    Thank you for choosing THENIJOBS.
                  </div>
                  <div className="pt-1 flex items-center justify-center gap-2 text-[10px] text-blue-600 font-mono">
                    <span>ID: {previewSlogan.id}</span>
                    <span>•</span>
                    <span className="capitalize">Category: {previewSlogan.category.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>Lang: {previewSlogan.language.toUpperCase()}</span>
                  </div>
                </div>

                {/* Line Item & Total */}
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-50 px-3 py-2 font-bold text-slate-600 flex justify-between">
                    <span>Description</span>
                    <span>Amount (INR)</span>
                  </div>
                  <div className="px-3 py-2.5 flex justify-between border-t border-slate-100">
                    <div>
                      <div className="font-bold text-slate-900">Standard Plan Annual Subscription</div>
                      <div className="text-slate-500 text-[11px]">10 Active Jobs, Verified Profile, WhatsApp Inquiries</div>
                    </div>
                    <div className="font-bold text-slate-900">₹1,800.00</div>
                  </div>
                  <div className="bg-slate-50 px-3 py-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
                    <span>Total Paid (Tax Inclusive):</span>
                    <span className="text-emerald-600">₹1,800.00</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400">
                  Electronically generated by THENIJOBS. Slogan is permanently preserved in this document’s snapshot.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setPreviewSlogan(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

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
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="business_growth">Business Growth</option>
                    <option value="recruitment">Recruitment</option>
                    <option value="trust_quality">Trust & Quality</option>
                    <option value="theni_pride">Theni Pride</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Associated Billing Model (Optional)
                </label>
                <select
                  value={formBillingModel}
                  onChange={(e) => setFormBillingModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">None (Generic / Category Pool)</option>
                  {BILLING_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.label} ({model.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsDefault"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="formIsDefault" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Set as default slogan for this category and language
                </label>
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
