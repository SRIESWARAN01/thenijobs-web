'use client';

import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Grid3X3, Loader2, MapPin, Plus, Sparkles, Trash2, Users, Wrench } from 'lucide-react';
import { useDocument } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';
import {
  Button, Card, CardBody, CardHeader, DataTable, PageHeader, PageShell, Pill,
  SettingRow, Switch, Tabs, type Column,
} from '@/components/dashboard';

const DEFAULT_DISTRICTS = [
  'Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul',
  'Thanjavur', 'Ranipet', 'Sivaganga', 'Virudhunagar', 'Namakkal', 'Theni', 'Villupuram', 'Nagapattinam', 'Kancheepuram', 'Tiruppur',
];

const DEFAULT_CATEGORIES = ['Agriculture', 'Construction', 'Manufacturing', 'Textile', 'IT & Software', 'Education', 'Healthcare', 'Retail', 'Transportation'];

interface FranchiseRow {
  id: string;
  district: string;
  manager: string;
  phone: string;
  status: string;
  businesses: number;
  revenue: string;
}

/**
 * Placeholder rows. These are NOT read from Firestore — they are literals that
 * have always lived in this file, and the table below is labelled as such so an
 * administrator does not mistake them for a real franchise ledger.
 */
const FRANCHISE_DATA: FranchiseRow[] = [
  { id: 'theni', district: 'Theni', manager: 'Tamilselvan K', phone: '9876543210', status: 'active', businesses: 45, revenue: '₹12,400' },
  { id: 'madurai', district: 'Madurai', manager: 'Rajesh Kumar', phone: '9876543211', status: 'active', businesses: 38, revenue: '₹9,800' },
  { id: 'dindigul', district: 'Dindigul', manager: 'Pending', phone: '-', status: 'pending', businesses: 12, revenue: '₹3,200' },
];

interface PlatformSettingsDoc {
  id: string;
  districts?: string[];
  categories?: string[];
  aiFeatures?: { recommendations: boolean; resumeAnalysis: boolean; smartSearch: boolean };
  maintenance?: boolean;
  revenueShare?: string;
  features?: {
    registrationEnabled: boolean;
    jobPostingEnabled: boolean;
    reviewsEnabled: boolean;
    leadFormsEnabled: boolean;
  };
}

type SettingsPatch = Partial<Omit<PlatformSettingsDoc, 'id'>>;

const AI_FEATURES = [
  { key: 'recommendations', label: 'AI job recommendations', desc: 'Auto-suggest relevant jobs from seeker profile keywords' },
  { key: 'resumeAnalysis', label: 'AI resume scoring & ATS optimisation', desc: 'Resume strength breakdown and keyword suggestions' },
  { key: 'smartSearch', label: 'Gemini semantic search', desc: 'Natural-language intent mapping in search' },
] as const;

const PLATFORM_FEATURES = [
  { key: 'registrationEnabled', label: 'User & business registration', desc: 'Allow visitors to create candidate and business accounts' },
  { key: 'jobPostingEnabled', label: 'Job opening submissions', desc: 'Enable employers to create new vacancies' },
  { key: 'reviewsEnabled', label: 'Public reviews & feedback', desc: 'Allow job seekers to rate companies' },
  { key: 'leadFormsEnabled', label: 'Marketplace enquiry forms', desc: 'Show WhatsApp enquiry and product order forms' },
] as const;

/** A removable chip used for the districts and categories lists. */
function TokenChip({ label, index, onRemove }: { label: string; index?: number; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition-colors hover:border-slate-300">
      <span className="flex min-w-0 items-center gap-2">
        {index !== undefined && <span className="text-xs font-semibold text-slate-400">{index + 1}.</span>}
        <span className="truncate text-xs font-semibold text-slate-800">{label}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="tap-target-auto -m-1 shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const { data: remoteSettings, loading } = useDocument<PlatformSettingsDoc>('platformSettings', 'global');
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

  const handleSave = async (updatedFields: SettingsPatch) => {
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

  const toggleAi = (key: keyof typeof aiFeatures) => {
    const next = { ...aiFeatures, [key]: !aiFeatures[key] };
    setAiFeatures(next);
    handleSave({ aiFeatures: next });
  };

  const toggleFeature = (key: keyof typeof features) => {
    const next = { ...features, [key]: !features[key] };
    setFeatures(next);
    handleSave({ features: next });
  };

  const franchiseColumns = useMemo<Column<FranchiseRow>[]>(() => [
    { key: 'district', header: 'District', card: 'title', sortValue: f => f.district, render: f => <span className="font-semibold text-slate-900">{f.district}</span> },
    { key: 'manager', header: 'Franchise head', sortValue: f => f.manager },
    { key: 'phone', header: 'Phone', hideBelow: 'lg', sortValue: f => f.phone },
    { key: 'businesses', header: 'Businesses', align: 'center', sortValue: f => f.businesses, render: f => <span className="font-semibold tabular-nums">{f.businesses}</span> },
    { key: 'revenue', header: 'Revenue', align: 'right', hideBelow: 'xl', sortValue: f => f.revenue },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortValue: f => f.status,
      render: f => <Pill tone={f.status === 'active' ? 'success' : 'warning'} dot>{f.status}</Pill>,
    },
  ], []);

  const tabs = [
    { id: 'districts', label: 'Districts', icon: MapPin, count: districts.length },
    { id: 'categories', label: 'Categories', icon: Grid3X3, count: categories.length },
    { id: 'franchise', label: 'Franchise hub', icon: Users },
    { id: 'ai', label: 'AI features', icon: Sparkles },
    { id: 'revenue', label: 'Revenue share', icon: DollarSign },
    { id: 'platform', label: 'Platform controls', icon: Wrench },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Platform settings"
        description="Districts, business categories, franchise commissions and feature toggles."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Settings' }]}
        actions={saveLoading ? <Pill tone="info"><Loader2 size={12} className="animate-spin" /> Saving…</Pill> : undefined}
      />

      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} label="Settings sections" />

      {loading ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-16">
            <Loader2 size={28} className="animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading platform settings…</p>
          </CardBody>
        </Card>
      ) : (
        <>
          {activeTab === 'districts' && (
            <Card>
              <CardHeader
                title={`Supported districts (${districts.length})`}
                action={
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <input
                      type="text"
                      value={newDistrict}
                      onChange={(e) => setNewDistrict(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addDistrict()}
                      placeholder="New district name…"
                      aria-label="New district name"
                      className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-48 sm:flex-none sm:text-sm"
                    />
                    <Button variant="primary" onClick={addDistrict}><Plus size={14} /> Add</Button>
                  </div>
                }
              />
              <CardBody>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                  {districts.map(d => <TokenChip key={d} label={d} onRemove={() => removeDistrict(d)} />)}
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'categories' && (
            <Card>
              <CardHeader
                title={`Business & industry categories (${categories.length})`}
                action={
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCategory()}
                      placeholder="New category…"
                      aria-label="New category name"
                      className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-48 sm:flex-none sm:text-sm"
                    />
                    <Button variant="primary" onClick={addCategory}><Plus size={14} /> Add</Button>
                  </div>
                }
              />
              <CardBody>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((cat, i) => (
                    <TokenChip key={cat} label={cat} index={i} onRemove={() => removeCategory(cat)} />
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'franchise' && (
            <Card>
              <CardHeader
                title="District franchise directory"
                description="Placeholder rows held in the page source — not yet backed by Firestore"
                action={<Pill tone="warning">Sample data</Pill>}
              />
              <CardBody className="p-0">
                <DataTable
                  label="District franchise directory"
                  className="rounded-none border-0"
                  columns={franchiseColumns}
                  rows={FRANCHISE_DATA}
                  getRowId={f => f.id}
                />
              </CardBody>
            </Card>
          )}

          {activeTab === 'ai' && (
            <Card>
              <CardHeader title="AI capabilities" description="Which AI features are offered to users" />
              <CardBody className="space-y-3">
                {AI_FEATURES.map(f => (
                  <SettingRow
                    key={f.key}
                    title={f.label}
                    description={f.desc}
                    control={
                      <Switch
                        checked={aiFeatures[f.key]}
                        onChange={() => toggleAi(f.key)}
                        label={f.label}
                      />
                    }
                  />
                ))}
              </CardBody>
            </Card>
          )}

          {activeTab === 'revenue' && (
            <Card>
              <CardHeader title="Franchise revenue distribution" />
              <CardBody>
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <label htmlFor="revenue-share" className="block text-sm font-semibold text-slate-900">
                    Franchise commission split
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="revenue-share"
                      type="range"
                      min="10"
                      max="50"
                      value={revenueShare}
                      onChange={e => setRevenueShare(e.target.value)}
                      onMouseUp={() => handleSave({ revenueShare })}
                      onTouchEnd={() => handleSave({ revenueShare })}
                      className="tap-target-auto h-2 flex-1 accent-blue-600"
                    />
                    <span className="w-14 text-right text-base font-bold tabular-nums text-[#1D4ED8]">{revenueShare}%</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Platform keeps {100 - parseInt(revenueShare, 10)}%; the franchise partner receives {revenueShare}% on localised business onboarding.
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'platform' && (
            <Card>
              <CardHeader title="System modules & feature toggles" />
              <CardBody className="space-y-3">
                <SettingRow
                  className="border-rose-200 bg-[#FEF2F2]"
                  title="Maintenance mode"
                  description="Temporarily restrict public access for platform upgrades"
                  control={
                    <Switch
                      checked={maintenance}
                      label="Maintenance mode"
                      onChange={(next) => {
                        setMaintenance(next);
                        handleSave({ maintenance: next });
                      }}
                    />
                  }
                />
                {PLATFORM_FEATURES.map(f => (
                  <SettingRow
                    key={f.key}
                    title={f.label}
                    description={f.desc}
                    control={
                      <Switch
                        checked={features[f.key]}
                        onChange={() => toggleFeature(f.key)}
                        label={f.label}
                      />
                    }
                  />
                ))}
              </CardBody>
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}
