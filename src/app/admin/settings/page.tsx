'use client';

import { useState, useEffect } from 'react';
import { MapPin, Grid3X3, Users, Sparkles, DollarSign, Wrench, Plus, Trash2, Loader2, Check } from 'lucide-react';
import { useDocument } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';

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
  const toast = useToast();
  const { data: remoteSettings, loading } = useDocument<any>('platformSettings', 'global');
  const [activeTab, setActiveTab] = useState('districts');
  const [saveLoading, setSaveLoading] = useState(false);

  const [districts, setDistricts] = useState<string[]>(DEFAULT_DISTRICTS);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [aiFeatures, setAiFeatures] = useState({ recommendations: true, resumeAnalysis: true, smartSearch: false });
  const [maintenance, setMaintenance] = useState(false);
  const [revenueShare, setRevenueShare] = useState('30');
  const [features, setFeatures] = useState({
    registrationEnabled: true,
    jobPostingEnabled: true,
    reviewsEnabled: true,
    leadFormsEnabled: true
  });

  const [newDistrict, setNewDistrict] = useState('');
  const [newCategory, setNewCategory] = useState('');

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
      toast.success('Settings saved to database');
    } catch (err) {
      console.error('Save settings error:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaveLoading(false);
    }
  };

  const addDistrict = () => {
    if (!newDistrict.trim()) return;
    const list = [...districts, newDistrict.trim()];
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
    if (!newCategory.trim()) return;
    const list = [...categories, newCategory.trim()];
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
    { id: 'franchise', label: 'Franchise Hub', icon: Users },
    { id: 'ai', label: 'AI Features', icon: Sparkles },
    { id: 'revenue', label: 'Revenue Share', icon: DollarSign },
    { id: 'platform', label: 'Platform Controls', icon: Wrench },
  ];

  return (
    <div className="space-y-6 font-outfit text-gray-900 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Platform Settings</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Configure districts, business categories, franchise commissions, and feature toggles</p>
        </div>
        {saveLoading && (
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
            <Loader2 size={14} className="animate-spin" />
            <span>Saving changes...</span>
          </div>
        )}
      </div>

      {/* Tabs (Touch-Scrollable) */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl bg-gray-100/80 overflow-x-auto no-scrollbar w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-blue-600 animate-spin" />
          <p className="text-xs text-gray-500 font-semibold">Loading platform settings...</p>
        </div>
      ) : (
        <>
          {/* Districts */}
          {activeTab === 'districts' && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <h2 className="text-sm font-bold text-gray-900">Supported Districts ({districts.length})</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addDistrict()}
                    placeholder="New district name..."
                    className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 outline-none focus:border-blue-600 font-medium w-44"
                  />
                  <button
                    type="button"
                    onClick={addDistrict}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {districts.map(d => (
                  <div key={d} className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all">
                    <span className="text-xs font-bold text-gray-800">{d}</span>
                    <button
                      type="button"
                      onClick={() => removeDistrict(d)}
                      className="text-slate-500 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <h2 className="text-sm font-bold text-gray-900">Business &amp; Industry Categories ({categories.length})</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCategory()}
                    placeholder="New category..."
                    className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 outline-none focus:border-blue-600 font-medium w-44"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {categories.map((cat, i) => (
                  <div key={cat} className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-slate-500 font-bold">{i + 1}.</span>
                      <span className="text-xs font-bold text-gray-800 truncate">{cat}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCategory(cat)}
                      className="p-1 text-slate-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Franchise */}
          {activeTab === 'franchise' && (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">District Franchise Directory</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200">
                      <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">District</th>
                      <th className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Franchise Head</th>
                      <th className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                      <th className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Businesses</th>
                      <th className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {FRANCHISE_DATA.map(f => (
                      <tr key={f.district} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3 text-xs font-bold text-gray-900">{f.district}</td>
                        <td className="px-3 py-3 text-xs text-gray-700 font-medium">{f.manager}</td>
                        <td className="px-3 py-3 text-xs text-gray-500 hidden sm:table-cell">{f.phone}</td>
                        <td className="px-3 py-3 text-xs text-center font-bold text-gray-900">{f.businesses}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${f.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {f.status}
                          </span>
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
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-gray-900">AI Capabilities Configuration</h2>
              <div className="space-y-3">
                {[
                  { key: 'recommendations', label: 'AI Job Recommendations', desc: 'Auto-suggest relevant jobs based on seeker profile keywords' },
                  { key: 'resumeAnalysis', label: 'AI Resume Scoring & ATS Optimization', desc: 'Provide resume strength breakdown and keyword suggestions' },
                  { key: 'smartSearch', label: 'Gemini Semantic Search', desc: 'Enable natural language AI intent mapping in search' },
                ].map(f => (
                  <div key={f.key} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-900">{f.label}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{f.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAi(f.key)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${aiFeatures[f.key as keyof typeof aiFeatures] ? 'bg-emerald-600' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${aiFeatures[f.key as keyof typeof aiFeatures] ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revenue */}
          {activeTab === 'revenue' && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-gray-900">Franchise Revenue Distribution</h2>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <p className="text-xs font-bold text-gray-900">Franchise Commission Split</p>
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
                  <span className="text-base font-black text-blue-700 w-12 text-right">{revenueShare}%</span>
                </div>
                <p className="text-[11px] text-gray-500">Platform keeps {100 - parseInt(revenueShare)}%, Franchise partner receives {revenueShare}% on localized business onboarding.</p>
              </div>
            </div>
          )}

          {/* Platform */}
          {activeTab === 'platform' && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-gray-900">System Modules &amp; Feature Toggles</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-red-50 border border-red-200">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-red-950">Maintenance Mode</p>
                    <p className="text-[11px] text-red-700 mt-0.5">Temporarily restrict public access for platform upgrades</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !maintenance;
                      setMaintenance(next);
                      handleSave({ maintenance: next });
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${maintenance ? 'bg-red-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${maintenance ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {[
                  { key: 'registrationEnabled', label: 'User & Business Registration', desc: 'Allow visitors to create new candidate and business accounts' },
                  { key: 'jobPostingEnabled', label: 'Job Opening Submissions', desc: 'Enable employers to create new job vacancies' },
                  { key: 'reviewsEnabled', label: 'Public Reviews & Feedback', desc: 'Allow job seekers to submit ratings for companies' },
                  { key: 'leadFormsEnabled', label: 'Marketplace Enquiry Forms', desc: 'Show WhatsApp inquiry and product order forms' },
                ].map(f => (
                  <div key={f.key} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-900">{f.label}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{f.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFeature(f.key)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${features[f.key as keyof typeof features] ? 'bg-emerald-600' : 'bg-gray-300'}`}
                    >
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
