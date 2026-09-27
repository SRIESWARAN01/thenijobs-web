'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';
import { where } from 'firebase/firestore';
import { Bell, CheckCircle, Loader2, Save, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import {
  Button, Card, CardBody, CardHeader, EmptyState, PageHeader, PageShell, Pill,
  SettingRow, Switch,
} from '@/components/dashboard';

interface CompanyDoc {
  id: string;
  name?: string;
  notificationPreferences?: Record<string, boolean>;
}

const NOTIF_ITEMS = [
  { key: 'applications', label: 'New job applications', desc: 'When a candidate submits their resume to your job' },
  { key: 'leads', label: 'Business service leads', desc: 'When a customer submits an enquiry' },
  { key: 'reviews', label: 'Reviews & feedback', desc: 'When someone rates or reviews your company' },
  { key: 'interviews', label: 'Interviews & schedules', desc: 'Schedule updates, cancellations and confirmations' },
  { key: 'system', label: 'System announcements', desc: 'General notifications about product updates' },
] as const;

export default function EmployerSettingsPage() {
  const { user } = useAuth();
  const toast = useToast();

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<CompanyDoc>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  const [notifs, setNotifs] = useState({
    applications: true,
    leads: true,
    reviews: true,
    interviews: true,
    system: true
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);

  // Sync saved preferences from Firestore
  useEffect(() => {
    if (company?.notificationPreferences) {
      setNotifs(prev => ({
        ...prev,
        ...company.notificationPreferences,
      }));
      setSaved(true);
    }
  }, [company]);

  const toggleNotif = (key: keyof typeof notifs) => {
    setSaved(false);
    setNotifs(p => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateDocument('companies', companyId, {
        notificationPreferences: notifs,
      });
      setSaved(true);
      toast.success('Notification preferences saved successfully!');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (!companyId && !companyLoading) {
    return (
      <PageShell>
        <EmptyState
          icon={Settings}
          title="No company profile yet"
          description="Register your company profile before adjusting employer settings."
          action={
            <Link href="/employer/company-profile">
              <Button variant="primary">Set up company profile</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-2xl">
      <PageHeader
        title="Settings"
        description="Employer portal preferences."
        breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'Settings' }]}
        actions={
          <Button
            onClick={handleSave}
            disabled={saving}
            className="border-0 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle size={15} /> : <Save size={15} />}
            {saving ? 'Saving...' : saved ? 'Preferences saved' : 'Save preferences'}
          </Button>
        }
      />

      {companyLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 size={30} className="animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Loading settings…</p>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader
              title="Notification preferences"
              description="Choose when you are notified about recruitment activity"
              action={<Pill tone={saved ? 'success' : 'warning'}>{saved ? 'Saved' : 'Unsaved changes'}</Pill>}
            />
            <CardBody className="space-y-3">
              <p className="rounded-xl border border-emerald-200 bg-[#ECFDF5] p-3 text-xs leading-relaxed text-[#065F46] flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                These preferences are synced with your company profile and control real-time alerts.
              </p>
              {NOTIF_ITEMS.map(item => (
                <SettingRow
                  key={item.key}
                  title={item.label}
                  description={item.desc}
                  control={
                    <Switch
                      checked={notifs[item.key]}
                      onChange={() => toggleNotif(item.key)}
                      label={item.label}
                    />
                  }
                />
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Portal security" action={<Shield size={16} className="text-slate-400" aria-hidden />} />
            <CardBody>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Registered account email</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email}</p>
                </div>
                <Pill tone="success">
                  <CheckCircle size={12} aria-hidden /> Verified
                </Pill>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </PageShell>
  );
}
