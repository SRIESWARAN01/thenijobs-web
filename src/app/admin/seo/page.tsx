'use client';

import { useState } from 'react';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import {
  Search, Globe, Edit3, Save, Eye, AlertTriangle,
  CheckCircle, Loader2, ExternalLink, X
} from 'lucide-react';
import { matchesSearch } from '@/lib/search';

interface CompanySEO {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  verificationStatus?: string;
}

export default function AdminSEOPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [saving, setSaving] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<{ updated: number; skipped: number; errors: number } | null>(null);

  const { data: companies, loading } = useCollection<CompanySEO>('companies');

  const missingSlugs = companies.filter((c) => !c.slug).length;

  const handleBackfillSlugs = async () => {
    if (!confirm(`This will generate clean SEO slugs for ${missingSlugs} companies without slugs. Continue?`)) return;
    setBackfilling(true);
    setBackfillResult(null);
    try {
      const res = await fetch('/api/admin/backfill-slugs', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBackfillResult(data.summary);
        alert(`✅ Slug backfill complete!\n\nUpdated: ${data.summary.updated}\nSkipped: ${data.summary.skipped}\nErrors: ${data.summary.errors}`);
      } else {
        alert('❌ Slug backfill failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Backfill error:', err);
      alert('❌ Network error during slug backfill');
    } finally {
      setBackfilling(false);
    }
  };

  const filtered = companies.filter((c) =>
    !searchQuery || matchesSearch(searchQuery, [c.name, c.slug, c.seoTitle])
  );

  const startEdit = (company: CompanySEO) => {
    setEditingId(company.id);
    setSeoTitle(company.seoTitle || '');
    setSeoDescription(company.seoDescription || '');
    setSeoKeywords(company.seoKeywords || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSeoTitle('');
    setSeoDescription('');
    setSeoKeywords('');
  };

  const handleSave = async (companyId: string) => {
    setSaving(true);
    try {
      await updateDocument('companies', companyId, {
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        seoKeywords: seoKeywords.trim() || null,
      });
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save SEO:', err);
      alert('Failed to save SEO data');
    } finally {
      setSaving(false);
    }
  };

  const getSEOStatus = (company: CompanySEO): { label: string; color: string; icon: any } => {
    const hasTitle = !!company.seoTitle || !!company.name;
    const hasDesc = !!company.seoDescription || !!company.description;
    if (hasTitle && hasDesc) return { label: 'Good', color: 'text-emerald-400', icon: CheckCircle };
    if (hasTitle || hasDesc) return { label: 'Partial', color: 'text-amber-400', icon: AlertTriangle };
    return { label: 'Missing', color: 'text-rose-400', icon: AlertTriangle };
  };

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe size={22} className="text-emerald-400" />
            SEO Controls
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage meta titles, descriptions, and keywords for business profiles</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-2 text-center">
          <p className="text-lg font-bold text-white">{companies.length}</p>
          <p className="text-[10px] text-gray-500">Total Businesses</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search businesses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input w-full pl-11 pr-4 py-3 text-sm"
        />
      </div>

      {/* SEO Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Good SEO', count: companies.filter((c) => getSEOStatus(c).label === 'Good').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Partial SEO', count: companies.filter((c) => getSEOStatus(c).label === 'Partial').length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Missing SEO', count: companies.filter((c) => getSEOStatus(c).label === 'Missing').length, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-[10px] text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Companies List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="text-emerald-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((company) => {
            const status = getSEOStatus(company);
            const StatusIcon = status.icon;
            const isEditing = editingId === company.id;

            return (
              <div key={company.id} className="glass-card rounded-2xl p-5 hover:border-white/15 transition-all">
                {/* Company Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{company.name?.charAt(0) || 'B'}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{company.name}</h3>
                      {company.slug && (
                        <a href={`/company/${company.slug}`} target="_blank" className="text-[10px] text-emerald-400 flex items-center gap-0.5 hover:underline">
                          /company/{company.slug} <ExternalLink size={8} />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${status.color}`}>
                      <StatusIcon size={10} /> {status.label}
                    </span>
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(company)}
                        className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Current SEO Preview */}
                {!isEditing && (
                  <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04] space-y-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Google Preview</p>
                    <p className="text-sm text-blue-400 font-medium truncate">
                      {company.seoTitle || company.name || 'Untitled'} — THENIJOBS
                    </p>
                    <p className="text-[11px] text-gray-400 line-clamp-2">
                      {company.seoDescription || company.description?.slice(0, 160) || 'No description available'}
                    </p>
                    <p className="text-[10px] text-emerald-500">
                      thenijobs.com/company/{company.slug || company.id}
                    </p>
                  </div>
                )}

                {/* Edit Form */}
                {isEditing && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Meta Title</label>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        placeholder={company.name || 'Business Name'}
                        maxLength={70}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/40"
                      />
                      <p className="text-[10px] text-gray-500 text-right">{seoTitle.length}/70</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Meta Description</label>
                      <textarea
                        rows={2}
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        placeholder="Brief description for search engines..."
                        maxLength={160}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/40 resize-none"
                      />
                      <p className="text-[10px] text-gray-500 text-right">{seoDescription.length}/160</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Keywords</label>
                      <input
                        type="text"
                        value={seoKeywords}
                        onChange={(e) => setSeoKeywords(e.target.value)}
                        placeholder="keyword1, keyword2, keyword3"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/40"
                      />
                    </div>

                    {/* Google Preview */}
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04] space-y-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Eye size={10} /> Preview</p>
                      <p className="text-sm text-blue-400 font-medium truncate">{seoTitle || company.name} — THENIJOBS</p>
                      <p className="text-[11px] text-gray-400 line-clamp-2">{seoDescription || company.description?.slice(0, 160) || 'No description'}</p>
                      <p className="text-[10px] text-emerald-500">thenijobs.com/company/{company.slug || company.id}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(company.id)}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Save SEO
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 rounded-lg bg-white/[0.06] text-gray-400 text-xs font-medium hover:text-white transition-colors flex items-center gap-1"
                      >
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
