'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { Bell, CheckCircle, Loader2, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import {
  Button, Card, CardBody, CardHeader, EmptyState, PageHeader, PageShell, Pill,
  SettingRow, Switch,
} from '@/components/dashboard';

interface CompanyDoc { id: string; name?: string }

const NOTIF_ITEMS = [
  { key: 'applications', label: 'New job applications', desc: 'When a candidate submits their resume to your job' },
  { key: 'leads', label: 'Business service leads', desc: 'When a customer submits an enquiry' },
  { key: 'reviews', label: 'Reviews & feedback', desc: 'When someone rates or reviews your company' },
  { key: 'interviews', label: 'Interviews & schedules', desc: 'Schedule updates, cancellations and confirmations' },
  { key: 'system', label: 'System announcements', desc: 'General notifications about product updates' },
] as const;

export default function EmployerSettingsPage() {
  const { user } = useAuth();

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

  const toggleNotif = (key: keyof typeof notifs) => {
    setNotifs(p => ({ ...p, [key]: !p[key] }));
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
              action={<Pill tone="warning">Not saved yet</Pill>}
            />
            <CardBody className="space-y-3">
              {/*
                These switches are session-only. There is no persistence behind
                this page: the previous Save button ran `await new
                Promise(r => setTimeout(r, 800))` and then raised the toast
                "Settings updated successfully!" without writing anything, so
                every preference silently reset on the next page load while the
                employer had been told it was stored. The banner below says so
                plainly rather than repeating the claim.
              */}
              <p className="rounded-xl border border-amber-200 bg-[#FFFBEB] p-3 text-xs leading-relaxed text-[#92400E]">
                These preferences are not stored yet — they apply to this browser session only and
                reset when you reload. Notification delivery is unaffected.
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

          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Bell size={12} aria-hidden />
            Wiring these preferences to the company record is still to do.
          </p>
        </>
      )}
    </PageShell>
  );
}
