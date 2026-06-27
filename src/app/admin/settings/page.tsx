'use client';

import { useState, useEffect } from 'react';
import { MapPin, Grid3X3, Users, Sparkles, DollarSign, Wrench, Plus, Trash2, Loader2, Save, Pencil, Crown, Check, X, Shield } from 'lucide-react';
import { useDocument } from '@/hooks/useFirestore';
import { upsertDocument } from '@/lib/firebase/firestoreService';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_LOCATION_HIERARCHY, LocationHierarchy } from '@/hooks/useLocations';

const DEFAULT_CATEGORIES = ['Agriculture', 'Construction', 'Manufacturing', 'Textile', 'IT & Software', 'Education', 'Healthcare', 'Retail', 'Transportation'];

const FRANCHISE_DATA = [
  { district: 'Theni', manager: 'Tamilselvan K', phone: '9876543210', status: 'active', businesses: 45, revenue: '₹12,400' },
];

export interface PlanConfig {
  slug: string;
  name: string;
  maxProducts: number;
  maxServices: number;
  maxGallery: number;
  maxJobs: number;
  hasSEO: boolean;
  hasBranding: boolean;
  hasCEO: boolean;
  hasTimeline: boolean;
  hasTestimonials: boolean;
  hasBlog: boolean;
  hasAnalytics: boolean;
  hasVerification: boolean;
  hasBranchManagement: boolean;
  badgeType: 'none' | 'silver' | 'gold';
}

const DEFAULT_PLANS_CONFIG: Record<string, PlanConfig> = {
  free: {
    slug: 'free',
    name: 'Free Plan',
    maxProducts: 3,
    maxServices: 3,
    maxGallery: 1,
    maxJobs: 1,
    hasSEO: false,
    hasBranding: false,
    hasCEO: false,
    hasTimeline: false,
    hasTestimonials: false,
    hasBlog: false,
    hasAnalytics: false,
    hasVerification: false,
    hasBranchManagement: false,
    badgeType: 'none'
  },
  basic: {
    slug: 'basic',
    name: 'Standard Plan',
    maxProducts: 20,
    maxServices: 10,
    maxGallery: 4,
    maxJobs: 10,
    hasSEO: true,
    hasBranding: true,
    hasCEO: false,
    hasTimeline: false,
    hasTestimonials: false,
    hasBlog: false,
    hasAnalytics: true,
    hasVerification: true,
    hasBranchManagement: false,
    badgeType: 'silver'
  },
  premium: {
    slug: 'premium',
    name: 'Premium Plan',
    maxProducts: 100,
    maxServices: 50,
    maxGallery: 12,
    maxJobs: 50,
    hasSEO: true,
    hasBranding: true,
    hasCEO: true,
    hasTimeline: true,
    hasTestimonials: true,
    hasBlog: true,
    hasAnalytics: true,
    hasVerification: true,
    hasBranchManagement: false,
    badgeType: 'gold'
  },
  enterprise: {
    slug: 'enterprise',
    name: 'Enterprise Plan',
    maxProducts: 99999,
    maxServices: 99999,
    maxGallery: 99999,
    maxJobs: 99999,
    hasSEO: true,
    hasBranding: true,
    hasCEO: true,
    hasTimeline: true,
    hasTestimonials: true,
    hasBlog: true,
    hasAnalytics: true,
    hasVerification: true,
    hasBranchManagement: true,
    badgeType: 'gold'
  }
};

export default function SettingsPage() {
  const { user } = useAuth();
  const canManageSettings = user?.role === 'super_admin' || user?.role === 'admin';
  const { data: remoteSettings, loading } = useDocument<any>('platformSettings', 'global');
  const [activeTab, setActiveTab] = useState('locations');
  const [saveLoading, setSaveLoading] = useState(false);

  // States
  const [locationHierarchy, setLocationHierarchy] = useState<LocationHierarchy>(DEFAULT_LOCATION_HIERARCHY);
  const [selectedState, setSelectedState] = useState<string>('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Theni');

  const [newStateName, setNewStateName] = useState('');
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');

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

  // Plans config states
  const [plansConfig, setPlansConfig] = useState<Record<string, PlanConfig>>(DEFAULT_PLANS_CONFIG);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string>('free');

  const [newCategory, setNewCategory] = useState('');

  // Load from database if exists
  useEffect(() => {
    if (remoteSettings) {
      if (remoteSettings.locationHierarchy) {
        setLocationHierarchy(remoteSettings.locationHierarchy);
        const states = Object.keys(remoteSettings.locationHierarchy);
        if (states.length > 0) {
          setSelectedState(states[0]);
          const dists = Object.keys(remoteSettings.locationHierarchy[states[0]] || {});
          if (dists.length > 0) {
            setSelectedDistrict(dists[0]);
          }
        }
      }
      if (remoteSettings.plansConfig) {
        setPlansConfig(remoteSettings.plansConfig);
      }
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

  // Location Hierarchy Mutators
  const addState = () => {
    if (!newStateName.trim()) return;
    const sName = newStateName.trim();
    if (locationHierarchy[sName]) return;
    const next = { ...locationHierarchy, [sName]: {} };
    setLocationHierarchy(next);
    setSelectedState(sName);
    setSelectedDistrict('');
    setNewStateName('');
    handleSave({ locationHierarchy: next });
  };

  const removeState = (sName: string) => {
    if (!window.confirm(`Are you sure you want to delete state "${sName}" and all its districts/areas?`)) return;
    const next = { ...locationHierarchy };
    delete next[sName];
    setLocationHierarchy(next);
    if (selectedState === sName) {
      const remaining = Object.keys(next);
      setSelectedState(remaining[0] || '');
      setSelectedDistrict('');
    }
    handleSave({ locationHierarchy: next });
  };

  const addDistrict = () => {
    if (!selectedState || !newDistrictName.trim()) return;
    const dName = newDistrictName.trim();
    if (locationHierarchy[selectedState]?.[dName]) return;
    const next = {
      ...locationHierarchy,
      [selectedState]: {
        ...(locationHierarchy[selectedState] || {}),
        [dName]: []
      }
    };
    setLocationHierarchy(next);
    setSelectedDistrict(dName);
    setNewDistrictName('');
    handleSave({ locationHierarchy: next });
  };

  const removeDistrict = (dName: string) => {
    if (!selectedState) return;
    if (!window.confirm(`Are you sure you want to delete district "${dName}" and all its areas?`)) return;
    const next = {
      ...locationHierarchy,
      [selectedState]: { ...(locationHierarchy[selectedState] || {}) }
    };
    delete next[selectedState][dName];
    setLocationHierarchy(next);
    if (selectedDistrict === dName) {
      const remaining = Object.keys(next[selectedState]);
      setSelectedDistrict(remaining[0] || '');
    }
    handleSave({ locationHierarchy: next });
  };

  const addArea = () => {
    if (!selectedState || !selectedDistrict || !newAreaName.trim()) return;
    const aName = newAreaName.trim();
    const currentAreas = locationHierarchy[selectedState]?.[selectedDistrict] || [];
    if (currentAreas.includes(aName)) return;
    const next = {
      ...locationHierarchy,
      [selectedState]: {
        ...(locationHierarchy[selectedState] || {}),
        [selectedDistrict]: [...currentAreas, aName]
      }
    };
    setLocationHierarchy(next);
    setNewAreaName('');
    handleSave({ locationHierarchy: next });
  };

  const removeArea = (aName: string) => {
    if (!selectedState || !selectedDistrict) return;
    const currentAreas = locationHierarchy[selectedState]?.[selectedDistrict] || [];
    const next = {
      ...locationHierarchy,
      [selectedState]: {
        ...(locationHierarchy[selectedState] || {}),
        [selectedDistrict]: currentAreas.filter((a: string) => a !== aName)
      }
    };
    setLocationHierarchy(next);
    handleSave({ locationHierarchy: next });
  };

  // Plan Config Handlers
  const handleUpdatePlanLimit = (key: keyof PlanConfig, value: any) => {
    const next = {
      ...plansConfig,
      [selectedPlanSlug]: {
        ...plansConfig[selectedPlanSlug],
        [key]: value
      }
    };
    setPlansConfig(next);
    handleSave({ plansConfig: next });
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
    { id: 'locations', label: 'Locations (Tree)', icon: MapPin },
    { id: 'plans', label: 'Plan Control', icon: Crown },
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
          <p className="text-sm text-gray-400 mt-1 font-outfit">Configure dynamic locations, plan limits, categories, and platform options</p>
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
          {/* Dynamic Hierarchical Locations Tab */}
          {activeTab === 'locations' && (
            <div className="grid gap-6 md:grid-cols-3">
              {/* States Column */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-outfit">
                    <MapPin size={16} className="text-violet-400" /> States
                  </h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add state..."
                    value={newStateName}
                    onChange={e => setNewStateName(e.target.value)}
                    className="search-input text-xs px-3 py-1.5 flex-1"
                  />
                  <button onClick={addState} className="p-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-400">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                  {Object.keys(locationHierarchy).map(state => (
                    <div key={state} onClick={() => { setSelectedState(state); setSelectedDistrict(Object.keys(locationHierarchy[state] || {})[0] || ''); }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all border ${selectedState === state ? 'bg-violet-500/15 border-violet-500/30 text-white' : 'bg-white/[0.01] border-white/[0.05] text-gray-400 hover:bg-white/[0.03]'}`}>
                      <span className="text-xs truncate">{state}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeState(state); }} className="text-gray-500 hover:text-rose-400 transition-colors p-1">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Districts Column */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-outfit">
                    <MapPin size={16} className="text-cyan-400" /> Districts in <span className="text-violet-400 font-semibold">{selectedState || 'None'}</span>
                  </h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add district..."
                    value={newDistrictName}
                    onChange={e => setNewDistrictName(e.target.value)}
                    disabled={!selectedState}
                    className="search-input text-xs px-3 py-1.5 flex-1 disabled:opacity-50"
                  />
                  <button onClick={addDistrict} disabled={!selectedState} className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 disabled:opacity-50">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                  {selectedState && Object.keys(locationHierarchy[selectedState] || {}).map(dist => (
                    <div key={dist} onClick={() => setSelectedDistrict(dist)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all border ${selectedDistrict === dist ? 'bg-cyan-500/15 border-cyan-500/30 text-white' : 'bg-white/[0.01] border-white/[0.05] text-gray-400 hover:bg-white/[0.03]'}`}>
                      <span className="text-xs truncate">{dist}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeDistrict(dist); }} className="text-gray-500 hover:text-rose-400 transition-colors p-1">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {(!selectedState || Object.keys(locationHierarchy[selectedState] || {}).length === 0) && (
                    <p className="text-[11px] text-gray-500 text-center py-8">No districts added yet.</p>
                  )}
                </div>
              </div>

              {/* Areas/Villages Column */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-outfit">
                    <MapPin size={16} className="text-emerald-400" /> Areas/Villages in <span className="text-cyan-400 font-semibold">{selectedDistrict || 'None'}</span>
                  </h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add area/village..."
                    value={newAreaName}
                    onChange={e => setNewAreaName(e.target.value)}
                    disabled={!selectedDistrict}
                    className="search-input text-xs px-3 py-1.5 flex-1 disabled:opacity-50"
                  />
                  <button onClick={addArea} disabled={!selectedDistrict} className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 disabled:opacity-50">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                  {selectedState && selectedDistrict && (locationHierarchy[selectedState]?.[selectedDistrict] || []).map(area => (
                    <div key={area}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.01] border border-white/[0.05] text-gray-300">
                      <span className="text-xs truncate">{area}</span>
                      <button onClick={() => removeArea(area)} className="text-gray-500 hover:text-rose-400 transition-colors p-1">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {(!selectedDistrict || (locationHierarchy[selectedState]?.[selectedDistrict] || []).length === 0) && (
                    <p className="text-[11px] text-gray-500 text-center py-8">No areas added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Plan Control Tab */}
          {activeTab === 'plans' && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2 font-outfit">Subscription Plans Access & Feature Control</h3>
                <p className="text-xs text-gray-400 font-outfit">Configure limits and features dynamically active for each subscription tier</p>
              </div>

              {/* Plan selectors */}
              <div className="grid grid-cols-4 gap-2 border-b border-white/[0.06] pb-4">
                {Object.values(plansConfig).map(p => (
                  <button key={p.slug} onClick={() => setSelectedPlanSlug(p.slug)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${selectedPlanSlug === p.slug ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/10' : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.04]'}`}>
                    {p.name}
                  </button>
                ))}
              </div>

              {/* Limits and feature config */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Limits */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-outfit">Limits</h4>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] text-gray-400 block font-medium font-outfit">Max Active Products</label>
                    <input
                      type="number"
                      value={plansConfig[selectedPlanSlug]?.maxProducts}
                      onChange={e => handleUpdatePlanLimit('maxProducts', parseInt(e.target.value) || 0)}
                      className="search-input text-xs px-3 py-2 w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-gray-400 block font-medium font-outfit">Max Active Services</label>
                    <input
                      type="number"
                      value={plansConfig[selectedPlanSlug]?.maxServices}
                      onChange={e => handleUpdatePlanLimit('maxServices', parseInt(e.target.value) || 0)}
                      className="search-input text-xs px-3 py-2 w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-gray-400 block font-medium font-outfit">Max Gallery Images</label>
                    <input
                      type="number"
                      value={plansConfig[selectedPlanSlug]?.maxGallery}
                      onChange={e => handleUpdatePlanLimit('maxGallery', parseInt(e.target.value) || 0)}
                      className="search-input text-xs px-3 py-2 w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-gray-400 block font-medium font-outfit">Max Active Jobs</label>
                    <input
                      type="number"
                      value={plansConfig[selectedPlanSlug]?.maxJobs}
                      onChange={e => handleUpdatePlanLimit('maxJobs', parseInt(e.target.value) || 0)}
                      className="search-input text-xs px-3 py-2 w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-gray-400 block font-medium font-outfit">Verified Badge Rank</label>
                    <select
                      value={plansConfig[selectedPlanSlug]?.badgeType}
                      onChange={e => handleUpdatePlanLimit('badgeType', e.target.value)}
                      className="search-input text-xs px-3 py-2 w-full cursor-pointer appearance-none bg-slate-900 border-white/[0.08]"
                    >
                      <option value="none">None</option>
                      <option value="silver">Silver Badge (Standard)</option>
                      <option value="gold">Gold Badge (Premium/Enterprise)</option>
                    </select>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-outfit">Features</h4>
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { key: 'hasSEO', label: 'Advanced SEO settings' },
                      { key: 'hasBranding', label: 'Theme Customization' },
                      { key: 'hasCEO', label: 'CEO / Founder Section' },
                      { key: 'hasTimeline', label: 'Company Timeline Section' },
                      { key: 'hasTestimonials', label: 'Testimonials' },
                      { key: 'hasBlog', label: 'Company Blog/Announcements' },
                      { key: 'hasAnalytics', label: 'Visits Analytics Dashboard' },
                      { key: 'hasVerification', label: 'Verification Request' },
                      { key: 'hasBranchManagement', label: 'Multi-Branch Management' }
                    ].map(feat => (
                      <button
                        key={feat.key}
                        type="button"
                        onClick={() => handleUpdatePlanLimit(feat.key as keyof PlanConfig, !plansConfig[selectedPlanSlug]?.[feat.key as keyof PlanConfig])}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${plansConfig[selectedPlanSlug]?.[feat.key as keyof PlanConfig] ? 'bg-violet-500/10 border-violet-500/30 text-white' : 'bg-white/[0.01] border-white/[0.06] text-gray-400'}`}
                      >
                        <span className="text-xs font-semibold">{feat.label}</span>
                        {plansConfig[selectedPlanSlug]?.[feat.key as keyof PlanConfig] ? <Check size={14} className="text-violet-400" /> : <X size={14} className="text-gray-600" />}
                      </button>
                    ))}
                  </div>
                </div>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat, i) => (
                  <div key={cat} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all group">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-gray-600 shrink-0">{i + 1}.</span>
                      <span className="text-xs text-gray-300 truncate">{cat}</span>
                    </div>
                    <button onClick={() => removeCategory(cat)} className="p-1 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 shrink-0">
                      <Trash2 size={12} />
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
                <h2 className="text-sm font-semibold text-white font-outfit">Franchise Management</h2>
              </div>
              <div className="overflow-x-auto font-outfit">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500">District</th>
                      <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Manager</th>
                      <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold hidden sm:table-cell">Phone</th>
                      <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Businesses</th>
                      <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Revenue</th>
                      <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Status</th>
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
              <h2 className="text-sm font-semibold text-white mb-4 font-outfit">AI Features Configuration</h2>
              <div className="space-y-4 font-outfit">
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
              <h2 className="text-sm font-semibold text-white mb-4 font-outfit">Revenue Sharing</h2>
              <div className="space-y-4 font-outfit">
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
              <h2 className="text-sm font-semibold text-white mb-4 font-outfit">Platform Configuration</h2>
              <div className="space-y-4 font-outfit">
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
