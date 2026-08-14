'use client';

import { useState, useEffect } from 'react';
import { MapPin, Grid3X3, Users, Sparkles, DollarSign, Wrench, Plus, Trash2, Loader2 } from 'lucide-react';
import { useDocument } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';

const DEFAULT_DISTRICTS = [
  'Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul',
  'Thanjavur', 'Ranipet', 'Sivaganga', 'Virudhunagar', 'Namakkal', 'Theni', 'Villupuram', 'Nagapattinam', 'Kancheepuram', 'Tiruppur',
];

const DEFAULT_CATEGORIES = ['Agriculture', 'Construction', 'Manufacturing', 'Textile', 'IT & Software', 'Education', 'Healthcare', 'Retail', 'Transportation'];

const FRANCHISE_DATA = [
  { district: 'Theni', manager: 'Tamilselvan K', phone: '9876543210', status: 'active', businesses: 45, revenue: '₹12,400' },
  { district: 'Madurai', manager: 'Rajesh Kumar', phone: '9876543211', status: 'active', businesses: 38, revenue: '₹9,800' },
  { district: 'Dindigul', manager: 'Pending', phone: '-', status: 'pending', businesses: 12, revenue: '₹3,200' },
];

export default function SettingsPage() {
  const { data: remoteSettings, loading } = useDocument<any>('platformSettings', 'global');
  const [activeTab, setActiveTab] = useState('districts');
  const [saveLoading, setSaveLoading] = useState(false);

  // Local state initialized on mount or when remoteSettings loads
  const [districts, setDistricts] = useState<string[]>(DEFAULT_DISTRICTS);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [aiFeatures, setAiFeatures] = useState({ recommendations: true, resumeAnalysis: true, smartSearch: false });
  const [maintenance, setMaintenance] = useState(false);
  const [revenueShare, setRevenueShare] = useState('30');
  const [features, setFeatures] = useState({
    registrationEnabled: true,
    jobPostingEnabled: true,
    reviewsEnabled: true,
    leadFormsEnabled: true });

  const [newDistrict, setNewDistrict] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Load from database if exists
  useEffect(() => {
    if (remoteSettings) {
      if (remoteSettings.districts) setDistricts(remoteSettings.districts);
      if (remoteSettings.categories) setCategories(remoteSettings.categories);
      if (remoteSettings.aiFeatures) setAiFeatures(remoteSettings.aiFeatures);
      if (remoteSettings.maintenance !== undefined) setMaintenance(remoteSettings.maintenance);
      if (remoteSettings.revenueShare) setRevenueShare(remoteSettings.revenueShare);
      if (remoteSettings.features) setFeatures(remoteSettings.features);
    }
  }, [remoteSettings]);

  const handleSave = async (updatedFields: any) => {
    setSaveLoading(true);
    try {
      await updateDocument('platformSettings', 'global', updatedFields);
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
    handleSave({ districts: list });
  };

  const removeDistrict = (d: string) => {
    const list = districts.filter(x => x !== d);
    setDistricts(list);
    handleSave({ districts: list });
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
    { id: 'districts', label: 'Districts', icon: MapPin },
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
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">Platform Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure districts, categories, franchise, and platform options</p>
        </div>
        {saveLoading && (
          <div className="flex items-center gap-2 text-violet-400 text-sm">
            <Loader2 size={16} className="animate-spin" />
            <span>Saving settings...</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-violet-500/20 text-violet-400 border border-violet-200' : 'text-gray-400 hover:text-white hover:bg-white'}`}>
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
          {/* Districts */}
          {activeTab === 'districts' && (
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Districts ({districts.length})</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    placeholder="New district name..."
                    className="search-input text-xs px-3 py-1.5 w-40"
                  />
                  <button onClick={addDistrict} className="px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-semibold hover:bg-violet-500/20 transition-colors flex items-center gap-1">
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {districts.map(d => (
                  <div key={d} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02] border border-gray-100 hover:border-white/[0.12] transition-all">
                    <span className="text-sm text-gray-300">{d}</span>
                    <button onClick={() => removeDistrict(d)} className="text-gray-600 hover:text-rose-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Business Categories ({categories.length})</h2>
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
                  <div key={cat} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-gray-100 hover:border-white/[0.12] transition-all group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-5">{i + 1}.</span>
                      <span className="text-sm text-gray-300">{cat}</span>
                    </div>
                    <button onClick={() => removeCategory(cat)} className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-red-100">
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
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Franchise Management</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
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
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{f.district}</td>
                        <td className="px-3 py-3 text-sm text-gray-400">{f.manager}</td>
                        <td className="px-3 py-3 text-sm text-gray-500 hidden sm:table-cell">{f.phone}</td>
                        <td className="px-3 py-3 text-sm text-center text-gray-400">{f.businesses}</td>
                        <td className="px-3 py-3 text-sm text-center text-emerald-400 font-medium">{f.revenue}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${f.status === 'active' ? 'bg-emerald-100 text-emerald-400' : 'bg-amber-100 text-amber-400'}`}>{f.status}</span>
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
              <h2 className="text-sm font-bold text-gray-900 mb-4">AI Features Configuration</h2>
              <div className="space-y-4">
                {[
                  { key: 'recommendations', label: 'AI Job Recommendations', desc: 'Suggest jobs based on seeker profiles' },
                  { key: 'resumeAnalysis', label: 'Resume Analysis', desc: 'AI-powered resume scoring and tips' },
                  { key: 'smartSearch', label: 'Smart Search', desc: 'Natural language job search with AI' },
                ].map(f => (
                  <div key={f.key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div>
                      <p className="text-sm text-gray-900 font-bold">{f.label}</p>
                      <p className="text-[10px] text-gray-500">{f.desc}</p>
                    </div>
                    <button onClick={() => toggleAi(f.key)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${aiFeatures[f.key as keyof typeof aiFeatures] ? 'bg-emerald-600' : 'bg-gray-200'}`}>
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
              <h2 className="text-sm font-bold text-gray-900 mb-4">Revenue Sharing</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm font-bold text-gray-900 mb-2">Franchise Revenue Share</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={revenueShare}
                      onChange={e => setRevenueShare(e.target.value)}
                      onMouseUp={() => handleSave({ revenueShare })}
                      className="flex-1 accent-blue-600"
                    />
                    <span className="text-lg font-bold text-blue-600 w-12 text-right">{revenueShare}%</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">Platform keeps {100 - parseInt(revenueShare)}%, Franchise admin gets {revenueShare}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Platform */}
          {activeTab === 'platform' && (
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Platform Configuration</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200">
                  <div>
                    <p className="text-sm text-red-900 font-bold">Maintenance Mode</p>
                    <p className="text-[10px] text-red-700">Take platform offline for maintenance</p>
                  </div>
                  <button onClick={() => {
                    const next = !maintenance;
                    setMaintenance(next);
                    handleSave({ maintenance: next });
                  }}
                    className={`w-11 h-6 rounded-full transition-colors relative ${maintenance ? 'bg-rose-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${maintenance ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                {[
                  { key: 'registrationEnabled', label: 'Enable Registration', desc: 'Allow new user signups' },
                  { key: 'jobPostingEnabled', label: 'Enable Job Posting', desc: 'Allow employers to post jobs' },
                  { key: 'reviewsEnabled', label: 'Enable Reviews', desc: 'Allow users to submit reviews' },
                  { key: 'leadFormsEnabled', label: 'Enable Lead Forms', desc: 'Show enquiry forms on listings' },
                ].map(f => (
                  <div key={f.key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div>
                      <p className="text-sm text-gray-900 font-bold">{f.label}</p>
                      <p className="text-[10px] text-gray-500">{f.desc}</p>
                    </div>
                    <button onClick={() => toggleFeature(f.key)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${features[f.key as keyof typeof features] ? 'bg-emerald-600' : 'bg-gray-200'}`}>
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
