'use client';

import { useState, useEffect } from 'react';
import { MapPin, Grid3X3, Users, Sparkles, DollarSign, Wrench, Plus, Trash2, Loader2, Save, Pencil } from 'lucide-react';
import { useDocument } from '@/hooks/useFirestore';
import { upsertDocument } from '@/lib/firebase/firestoreService';
import { useAuth } from '@/hooks/useAuth';
import { LAUNCH_DISTRICT, THENI_LAUNCH_LOCATIONS } from '@/lib/types';

const DEFAULT_LOCATIONS = [...THENI_LAUNCH_LOCATIONS];

const DEFAULT_CATEGORIES = ['Agriculture', 'Construction', 'Manufacturing', 'Textile', 'IT & Software', 'Education', 'Healthcare', 'Retail', 'Transportation'];

const FRANCHISE_DATA = [
  { district: 'Theni', manager: 'Tamilselvan K', phone: '9876543210', status: 'active', businesses: 45, revenue: '₹12,400' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const canManageSettings = user?.role === 'super_admin';
  const { data: remoteSettings, loading } = useDocument<any>('platformSettings', 'global');
  const [activeTab, setActiveTab] = useState('districts');
  const [saveLoading, setSaveLoading] = useState(false);

  // Local state initialized on mount or when remoteSettings loads
  const [districts, setDistricts] = useState<string[]>(DEFAULT_LOCATIONS);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [aiFeatures, setAiFeatures] = useState({ recommendations: true, resumeAnalysis: true, smartSearch: false });
  const [maintenance, setMaintenance] = useState(false);
  const [revenueShare, setRevenueShare] = useState('30');
  const [features, setFeatures] = useState({
    registrationEnabled: true,
    jobPostingEnabled: true,
    reviewsEnabled: true,
    leadFormsEnabled: true,
  });

  const [newDistrict, setNewDistrict] = useState('');
  const [editingDistrict, setEditingDistrict] = useState<string | null>(null);
  const [editingDistrictValue, setEditingDistrictValue] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Load from database if exists
  useEffect(() => {
    if (remoteSettings) {
      if (remoteSettings.locations) setDistricts(remoteSettings.locations);
      else if (remoteSettings.districts) setDistricts(remoteSettings.districts);
      if (remoteSettings.categories) setCategories(remoteSettings.categories);
      if (remoteSettings.aiFeatures) setAiFeatures(remoteSettings.aiFeatures);
      if (remoteSettings.maintenance !== undefined) setMaintenance(remoteSettings.maintenance);
      if (remoteSettings.revenueShare) setRevenueShare(remoteSettings.revenueShare);
      if (remoteSettings.features) setFeatures(remoteSettings.features);
    }
  }, [remoteSettings]);

  const handleSave = async (updatedFields: any) => {
    if (!canManageSettings) return;
    setSaveLoading(true);
    try {
      await upsertDocument('platformSettings', 'global', updatedFields);
    } catch (err) {
      console.error('Save settings error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const addDistrict = () => {
    if (!newDistrict) return;
    const list = [...districts, newDistrict];
    setDistricts(list);
    setNewDistrict('');
    handleSave({ locations: list, launchDistrict: LAUNCH_DISTRICT });
  };

  const removeDistrict = (d: string) => {
    const list = districts.filter(x => x !== d);
    setDistricts(list);
    handleSave({ locations: list, launchDistrict: LAUNCH_DISTRICT });
  };

  const startEditDistrict = (d: string) => {
    setEditingDistrict(d);
    setEditingDistrictValue(d);
  };

  const saveDistrictEdit = () => {
    if (!editingDistrict || !editingDistrictValue.trim()) return;
    const list = districts.map((item) => item === editingDistrict ? editingDistrictValue.trim() : item);
    setDistricts(list);
    setEditingDistrict(null);
    setEditingDistrictValue('');
    handleSave({ locations: list, launchDistrict: LAUNCH_DISTRICT });
  };

  const addCategory = () => {
    if (!newCategory) return;
    const list = [...categories, newCategory];
    setCategories(list);
    setNewCategory('');
    handleSave({ categories: list });
  };

  const removeCategory = (c: string) => {
    const list = categories.filter(x => x !== c);
    setCategories(list);
    handleSave({ categories: list });
  };

  const toggleAi = (key: string) => {
    const next = { ...aiFeatures, [key]: !aiFeatures[key as keyof typeof aiFeatures] };
    setAiFeatures(next);
    handleSave({ aiFeatures: next });
  };

  const toggleFeature = (key: string) => {
    const next = { ...features, [key]: !features[key as keyof typeof features] };
    setFeatures(next);
    handleSave({ features: next });
  };

  const tabs = [
    { id: 'districts', label: 'Locations', icon: MapPin },
    { id: 'categories', label: 'Categories', icon: Grid3X3 },
    { id: 'franchise', label: 'Franchise', icon: Users },
    { id: 'ai', label: 'AI Settings', icon: Sparkles },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'platform', label: 'Platform', icon: Wrench },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Platform Settings</h1>
          <p className="text-sm text-gray-400 mt-1">Configure locations, categories, franchise, and platform options</p>
        </div>
        {saveLoading && (
          <div className="flex items-center gap-2 text-violet-400 text-sm">
            <Loader2 size={16} className="animate-spin" />
            <span>Saving settings...</span>
          </div>
        )}
      </div>
      {!canManageSettings && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-300">
          Super admin access is required to change platform settings.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20' : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'}`}>
              <Icon size={16} />{tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading settings from database...</p>
        </div>
      ) : (
        <>
          {/* Locations */}
          {activeTab === 'districts' && (
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Launch Locations ({districts.length})</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    placeholder="New location name..."
                    className="search-input text-xs px-3 py-1.5 w-40"
                  />
                  <button onClick={addDistrict} className="px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-semibold hover:bg-violet-500/20 transition-colors flex items-center gap-1">
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {districts.map(d => (
                  <div key={d} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all">
                    {editingDistrict === d ? (
                      <input
                        value={editingDistrictValue}
                        onChange={(e) => setEditingDistrictValue(e.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
                      />
                    ) : (
                      <span className="min-w-0 truncate text-sm text-gray-300">{d}</span>
                    )}
                    <div className="ml-2 flex items-center gap-2">
                      {editingDistrict === d ? (
                        <button onClick={saveDistrictEdit} className="text-emerald-400 hover:text-emerald-300 transition-colors" aria-label={`Save ${d}`}>
                          <Save size={14} />
                        </button>
                      ) : (
                        <button onClick={() => startEditDistrict(d)} className="text-gray-600 hover:text-cyan-400 transition-colors" aria-label={`Edit ${d}`}>
                          <Pencil size={14} />
                        </button>
                      )}
                      <button onClick={() => removeDistrict(d)} className="text-gray-600 hover:text-rose-400 transition-colors" aria-label={`Delete ${d}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Business Categories ({categories.length})</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category name..."
                    className="search-input text-xs px-3 py-1.5 w-40"
                  />
                  <button onClick={addCategory} className="px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-semibold hover:bg-violet-500/20 transition-colors flex items-center gap-1">
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {categories.map((cat, i) => (
                  <div key={cat} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-5">{i + 1}.</span>
                      <span className="text-sm text-gray-300">{cat}</span>
                    </div>
                    <button onClick={() => removeCategory(cat)} className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Franchise */}
          {activeTab === 'franchise' && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white">Franchise Management</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500">District</th>
                      <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Manager</th>
                      <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 hidden sm:table-cell">Phone</th>
                      <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Businesses</th>
                      <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Revenue</th>
                      <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {FRANCHISE_DATA.map(f => (
                      <tr key={f.district} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 text-sm font-medium text-white">{f.district}</td>
                        <td className="px-3 py-3 text-sm text-gray-400">{f.manager}</td>
                        <td className="px-3 py-3 text-sm text-gray-500 hidden sm:table-cell">{f.phone}</td>
                        <td className="px-3 py-3 text-sm text-center text-gray-400">{f.businesses}</td>
                        <td className="px-3 py-3 text-sm text-center text-emerald-400 font-medium">{f.revenue}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${f.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{f.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Settings */}
          {activeTab === 'ai' && (
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">AI Features Configuration</h2>
              <div className="space-y-4">
                {[
                  { key: 'recommendations', label: 'AI Job Recommendations', desc: 'Suggest jobs based on seeker profiles' },
                  { key: 'resumeAnalysis', label: 'Resume Analysis', desc: 'AI-powered resume scoring and tips' },
                  { key: 'smartSearch', label: 'Smart Search', desc: 'Natural language job search with AI' },
                ].map(f => (
                  <div key={f.key} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div>
                      <p className="text-sm text-white">{f.label}</p>
                      <p className="text-[10px] text-gray-500">{f.desc}</p>
                    </div>
                    <button onClick={() => toggleAi(f.key)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${aiFeatures[f.key as keyof typeof aiFeatures] ? 'bg-emerald-600' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${aiFeatures[f.key as keyof typeof aiFeatures] ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revenue */}
          {activeTab === 'revenue' && (
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Revenue Sharing</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-sm text-white mb-2">Franchise Revenue Share</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={revenueShare}
                      onChange={e => setRevenueShare(e.target.value)}
                      onMouseUp={() => handleSave({ revenueShare })}
                      className="flex-1 accent-violet-500"
                    />
                    <span className="text-lg font-bold text-violet-400 w-12 text-right">{revenueShare}%</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">Platform keeps {100 - parseInt(revenueShare)}%, Franchise admin gets {revenueShare}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Platform */}
          {activeTab === 'platform' && (
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Platform Configuration</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/5 border border-rose-500/15">
                  <div>
                    <p className="text-sm text-white">Maintenance Mode</p>
                    <p className="text-[10px] text-gray-500">Take platform offline for maintenance</p>
                  </div>
                  <button onClick={() => {
                    const next = !maintenance;
                    setMaintenance(next);
                    handleSave({ maintenance: next });
                  }}
                    className={`w-11 h-6 rounded-full transition-colors relative ${maintenance ? 'bg-rose-600' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${maintenance ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                {[
                  { key: 'registrationEnabled', label: 'Enable Registration', desc: 'Allow new user signups' },
                  { key: 'jobPostingEnabled', label: 'Enable Job Posting', desc: 'Allow employers to post jobs' },
                  { key: 'reviewsEnabled', label: 'Enable Reviews', desc: 'Allow users to submit reviews' },
                  { key: 'leadFormsEnabled', label: 'Enable Lead Forms', desc: 'Show enquiry forms on listings' },
                ].map(f => (
                  <div key={f.key} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div>
                      <p className="text-sm text-white">{f.label}</p>
                      <p className="text-[10px] text-gray-500">{f.desc}</p>
                    </div>
                    <button onClick={() => toggleFeature(f.key)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${features[f.key as keyof typeof features] ? 'bg-emerald-600' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${features[f.key as keyof typeof features] ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
