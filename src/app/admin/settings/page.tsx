'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Users, Wrench } from 'lucide-react';
import { useDocument } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useToast } from '@/contexts/ToastContext';
import {
  Card, CardBody, CardHeader, DataTable, PageHeader, PageShell, Pill,
  SettingRow, Switch, Tabs, type Column,
} from '@/components/dashboard';

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

interface PlatformFeatures {
  registrationEnabled: boolean;
  jobPostingEnabled: boolean;
  reviewsEnabled: boolean;
}

interface PlatformSettingsDoc {
  id: string;
  // DOC2-1: `districts`, `categories`, `aiFeatures`, `revenueShare`, and `features.leadFormsEnabled`
  // were removed from here (and from the UI below) — grepped and confirmed nothing in the app
  // outside this one file ever read any of them (the real district list is the separate, static
  // `TN_DISTRICTS` constant baked into deploy-time `jobs-in-<district>` routes; no AI-feature gate,
  // marketplace-commission calculation, or lead-write path exists anywhere to wire them to). A
  // write that says "saved" but changes nothing is worse than no control at all. `maintenance` is
  // deliberately left exactly as it was — untouched, still not wired to anything — split into its
  // own future phase given it can gate the entire site for every visitor if built with any bug.
  maintenance?: boolean;
  features?: PlatformFeatures;
}

type SettingsPatch = Partial<Omit<PlatformSettingsDoc, 'id'>>;

const PLATFORM_FEATURES = [
  { key: 'registrationEnabled', label: 'User & business registration', desc: 'Allow visitors to create candidate and business accounts' },
  { key: 'jobPostingEnabled', label: 'Job opening submissions', desc: 'Enable employers to create new vacancies' },
  { key: 'reviewsEnabled', label: 'Public reviews & feedback', desc: 'Allow job seekers to rate companies' },
] as const;

export default function SettingsPage() {
  const toast = useToast();
  const { data: remoteSettings, loading } = useDocument<PlatformSettingsDoc>('platformSettings', 'global');
  const [activeTab, setActiveTab] = useState('platform');
  const [saveLoading, setSaveLoading] = useState(false);

  const [maintenance, setMaintenance] = useState(false);
  const [features, setFeatures] = useState<PlatformFeatures>({
    registrationEnabled: true,
    jobPostingEnabled: true,
    reviewsEnabled: true,
  });

  useEffect(() => {
    if (remoteSettings) {
      if (remoteSettings.maintenance !== undefined) setMaintenance(remoteSettings.maintenance);
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

  // DOC2-1: `platformSettings/global` stays admin-only-readable (unchanged), but `/register`,
  // `/register-business`, and a public company page's review section are all reachable by
  // unauthenticated visitors who cannot read it. Mirror `features` into a separate, narrowly
  // public-readable doc whenever it changes, so these killswitches have somewhere to actually be
  // read from. `setDoc(..., {merge:true})` rather than `updateDocument` since this doc may not
  // exist yet on the very first save.
  const syncPublicFeatures = async (next: PlatformFeatures) => {
    await setDoc(doc(db, 'platformSettings', 'public'), { features: next, updatedAt: serverTimestamp() }, { merge: true });
  };

  const toggleFeature = (key: keyof PlatformFeatures) => {
    const next = { ...features, [key]: !features[key] };
    setFeatures(next);
    handleSave({ features: next });
    syncPublicFeatures(next).catch(err => console.error('[admin/settings] public features sync failed:', err));
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
    { id: 'platform', label: 'Platform controls', icon: Wrench },
    { id: 'franchise', label: 'Franchise hub', icon: Users },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Platform settings"
        description="Maintenance mode and platform feature toggles."
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
