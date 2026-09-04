'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle, Key, Loader2, Shield, Users, XCircle } from 'lucide-react';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import { orderBy, limit, where } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import {
  Card,
  CardBody,
  CardHeader,
  DataTable,
  FilterSelect,
  PageHeader,
  PageShell,
  Pill,
  SettingRow,
  Switch,
  type Column,
  type PillTone,
} from '@/components/dashboard';

interface PermissionRow {
  id: string;
  module: string;
  super_admin: boolean;
  admin: boolean;
  moderator: boolean;
  support: boolean;
}

const PERMISSIONS: PermissionRow[] = [
  { id: 'users', module: 'Users & Candidates', super_admin: true, admin: true, moderator: false, support: true },
  { id: 'companies', module: 'Companies & Verification', super_admin: true, admin: true, moderator: true, support: false },
  { id: 'jobs', module: 'Job Approvals', super_admin: true, admin: true, moderator: true, support: false },
  { id: 'billing', module: 'Subscriptions & Billing', super_admin: true, admin: true, moderator: false, support: false },
  { id: 'reviews', module: 'Reviews Moderation', super_admin: true, admin: true, moderator: true, support: false },
  { id: 'reports', module: 'Platform Reports', super_admin: true, admin: true, moderator: false, support: false },
  { id: 'ai', module: 'AI & SEO Engine', super_admin: true, admin: true, moderator: false, support: false },
  { id: 'security', module: 'Security & Access Control', super_admin: true, admin: false, moderator: false, support: false },
];

const ROLE_TONE: Record<string, PillTone> = {
  super_admin: 'violet',
  admin: 'info',
  moderator: 'success',
};

type FirestoreTime = Timestamp | Date | number | string | null | undefined;

interface LogDoc {
  id: string;
  action: string;
  userName?: string;
  target?: string;
  timestamp?: FirestoreTime;
  ip?: string;
}

interface AdminUserDoc {
  id: string;
  displayName?: string;
  name?: string;
  email: string;
  role: string;
  lastLogin?: FirestoreTime;
}

interface PlatformSettings {
  id: string;
  twoFa?: boolean;
  sessionTimeout?: string;
}

function toDate(timestamp: FirestoreTime): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'object' && 'toMillis' in timestamp) return new Date(timestamp.toMillis());
  return new Date(timestamp);
}

function formatTime(timestamp: FirestoreTime): string {
  const date = toDate(timestamp);
  if (!date || Number.isNaN(date.getTime())) return 'Just now';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function Allowed({ yes }: { yes: boolean }) {
  return yes ? (
    <>
      <CheckCircle size={15} className="mx-auto text-emerald-600" aria-hidden />
      <span className="sr-only">Allowed</span>
    </>
  ) : (
    <>
      <XCircle size={15} className="mx-auto text-slate-300" aria-hidden />
      <span className="sr-only">Not allowed</span>
    </>
  );
}

export default function SecurityPage() {
  const { data: logs, loading: logsLoading } = useCollection<LogDoc>('activityLogs', [
    orderBy('timestamp', 'desc'),
    limit(20)
  ]);

  const { data: admins, loading: adminsLoading } = useCollection<AdminUserDoc>('users', [
    where('role', 'in', ['admin', 'super_admin'])
  ]);

  const { data: globalSettings } = useDocument<PlatformSettings>('platformSettings', 'global');

  const [twoFa, setTwoFa] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (globalSettings) {
      if (globalSettings.twoFa !== undefined) setTwoFa(globalSettings.twoFa);
      if (globalSettings.sessionTimeout) setSessionTimeout(globalSettings.sessionTimeout);
    }
  }, [globalSettings]);

  const handleToggleTwoFa = async () => {
    const next = !twoFa;
    setTwoFa(next);
    setSaveLoading(true);
    try {
      await updateDocument('platformSettings', 'global', { twoFa: next });
    } catch (err) {
      console.error('Two-Factor save error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTimeoutChange = async (val: string) => {
    setSessionTimeout(val);
    setSaveLoading(true);
    try {
      await updateDocument('platformSettings', 'global', { sessionTimeout: val });
    } catch (err) {
      console.error('Timeout save error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const logColumns = useMemo<Column<LogDoc>[]>(() => [
    {
      key: 'action',
      header: 'Event',
      card: 'title',
      sortValue: l => l.action ?? '',
      render: l => <span className="font-semibold text-slate-900">{l.action}</span>,
    },
    { key: 'userName', header: 'Staff / user', sortValue: l => l.userName ?? '', render: l => l.userName || 'Admin' },
    {
      key: 'target',
      header: 'Target',
      hideBelow: 'lg',
      sortValue: l => l.target ?? '',
      render: l => <span className="block max-w-[220px] truncate">{l.target || '—'}</span>,
    },
    {
      key: 'timestamp',
      header: 'Time',
      align: 'right',
      sortValue: l => toDate(l.timestamp)?.getTime() ?? 0,
      render: l => <span className="whitespace-nowrap text-slate-500">{formatTime(l.timestamp)}</span>,
    },
  ], []);

  const adminColumns = useMemo<Column<AdminUserDoc>[]>(() => [
    {
      key: 'displayName',
      header: 'Administrator',
      card: 'title',
      sortValue: a => a.displayName || a.name || '',
      render: a => {
        const name = a.displayName || a.name || 'Admin';
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-[#EFF6FF] text-xs font-bold text-[#1E40AF]">
              {name[0]?.toUpperCase() ?? 'A'}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-slate-900">{name}</span>
              <span className="block truncate text-xs text-slate-500">{a.email}</span>
            </span>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Role',
      align: 'right',
      sortValue: a => a.role ?? '',
      render: a => (
        <Pill tone={ROLE_TONE[a.role] ?? 'neutral'}>{(a.role ?? 'unknown').replace(/_/g, ' ')}</Pill>
      ),
    },
  ], []);

  const permissionColumns = useMemo<Column<PermissionRow>[]>(() => [
    {
      key: 'module',
      header: 'Module / area',
      card: 'title',
      render: p => <span className="font-semibold text-slate-900">{p.module}</span>,
    },
    { key: 'super_admin', header: 'Super admin', align: 'center', render: p => <Allowed yes={p.super_admin} /> },
    { key: 'admin', header: 'Admin', align: 'center', render: p => <Allowed yes={p.admin} /> },
    { key: 'moderator', header: 'Moderator', align: 'center', render: p => <Allowed yes={p.moderator} /> },
    { key: 'support', header: 'Support staff', align: 'center', render: p => <Allowed yes={p.support} /> },
  ], []);

  return (
    <PageShell>
      <PageHeader
        title="Security & access control"
        description="Administrator privileges, activity logs and authentication settings."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Security' }]}
        actions={
          saveLoading ? (
            <Pill tone="info">
              <Loader2 size={12} className="animate-spin" /> Saving…
            </Pill>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Platform activity audit log"
            description="The 20 most recent recorded events"
            action={<Activity size={16} className="text-slate-400" aria-hidden />}
          />
          <CardBody className="p-0">
            <DataTable
              label="Platform activity audit log"
              className="rounded-none border-0"
              columns={logColumns}
              rows={logs}
              getRowId={l => l.id}
              loading={logsLoading}
              dense
              emptyIcon={Activity}
              emptyTitle="No activity recorded yet"
              emptyDescription="Administrator actions will be logged here as they happen."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Security controls"
            action={<Shield size={16} className="text-slate-400" aria-hidden />}
          />
          <CardBody className="space-y-3">
            <SettingRow
              title="Two-factor auth"
              description="Require 2FA for administrator login"
              control={
                <Switch
                  checked={twoFa}
                  onChange={handleToggleTwoFa}
                  label="Require two-factor authentication for admin login"
                />
              }
            />
            <SettingRow
              title="Session timeout"
              description="Auto-logout inactive sessions"
              control={
                <FilterSelect
                  label="Session timeout"
                  value={sessionTimeout}
                  onChange={handleTimeoutChange}
                  options={[
                    { label: '15 min', value: '15' },
                    { label: '30 min', value: '30' },
                    { label: '60 min', value: '60' },
                  ]}
                />
              }
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={`Authorised admin staff (${admins.length})`}
          description="Accounts holding admin or super-admin role"
          action={<Users size={16} className="text-slate-400" aria-hidden />}
        />
        <CardBody className="p-0">
          <DataTable
            label="Authorised admin staff"
            className="rounded-none border-0"
            columns={adminColumns}
            rows={admins}
            getRowId={a => a.id}
            loading={adminsLoading}
            dense
            emptyIcon={Users}
            emptyTitle="No admin accounts found"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Role permission matrix"
          description="Which role may reach which area of the platform"
          action={<Key size={16} className="text-slate-400" aria-hidden />}
        />
        <CardBody className="p-0">
          <DataTable
            label="Role permission matrix"
            className="rounded-none border-0"
            columns={permissionColumns}
            rows={PERMISSIONS}
            getRowId={p => p.id}
            dense
          />
        </CardBody>
      </Card>
    </PageShell>
  );
}
