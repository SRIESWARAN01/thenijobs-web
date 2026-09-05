'use client';

import { useMemo } from 'react';
import { Activity, Users } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { orderBy, limit, where } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import {
  Card,
  CardBody,
  CardHeader,
  DataTable,
  PageHeader,
  PageShell,
  Pill,
  type Column,
  type PillTone,
} from '@/components/dashboard';

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

export default function SecurityPage() {
  const { data: logs, loading: logsLoading } = useCollection<LogDoc>('activityLogs', [
    orderBy('timestamp', 'desc'),
    limit(20)
  ]);

  const { data: admins, loading: adminsLoading } = useCollection<AdminUserDoc>('users', [
    where('role', 'in', ['admin', 'super_admin'])
  ]);

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

  return (
    <PageShell>
      <PageHeader
        title="Security & access control"
        description="Administrator activity log and the roster of accounts holding admin access."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Security' }]}
      />

      <Card>
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
    </PageShell>
  );
}
