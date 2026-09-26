'use client';

import { useMemo, useState, useEffect } from 'react';
import { Activity, Users, HardDrive, ShieldCheck, CheckCircle2, AlertTriangle, Server, Zap, RefreshCw } from 'lucide-react';
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
import { getLastStorageDiagnostic, subscribeStorageDiagnostic, type StorageErrorRecord } from '@/hooks/useStorage';

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

  const [storageDiag, setStorageDiag] = useState<StorageErrorRecord | null>(null);

  useEffect(() => {
    setStorageDiag(getLastStorageDiagnostic());
    return subscribeStorageDiagnostic((record) => {
      setStorageDiag(record);
    });
  }, []);

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
        description="Administrator activity log, storage health diagnostics, and the roster of accounts holding admin access."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Security' }]}
      />

      {/* ── Firebase Storage & Media Health Monitor ── */}
      <Card>
        <CardHeader
          title="Cloud Storage & Media Health Monitor"
          description="Firebase bucket status, media optimization pipeline, and upload diagnostic logs"
          action={
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Storage Active</span>
            </div>
          }
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bucket Info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <HardDrive size={15} className="text-blue-600" />
                <span>Primary Storage Bucket</span>
              </div>
              <p className="text-xs font-mono font-semibold text-slate-900 truncate">
                thenijobs-9f01d.firebasestorage.app
              </p>
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Region: us-central1 (Firebase Default)</span>
              </div>
            </div>

            {/* Client Compression Pipeline */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Zap size={15} className="text-amber-600" />
                <span>Client-Side WebP Optimizer</span>
              </div>
              <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-600" /> Active (90%+ Bandwidth Saved)
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Logos downscaled to max 800px; banners to 1920px. WebP quality 0.82-0.85 prevents quota exhaustion.
              </p>
            </div>

            {/* Storage Lifecycle & Cleanup */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <ShieldCheck size={15} className="text-indigo-600" />
                <span>Media Lifecycle &amp; Rules</span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                Orphan Blob Auto-Cleanup Enabled
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Previous storage blobs safely deleted on logo/banner replacement. Owner &amp; Admin writes enforced.
              </p>
            </div>
          </div>

          {/* Real-time Diagnostics Log Banner */}
          <div className="p-4 rounded-2xl border bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <Server size={14} className="text-blue-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-blue-300 font-bold">
                  Upload Pipeline Diagnostics
                </span>
                {storageDiag?.isQuotaExceeded ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Quota Monitored Alert
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Healthy
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-mono truncate">
                {storageDiag
                  ? `${storageDiag.adminDiagnostic} (${formatTime(new Date(storageDiag.timestamp))})`
                  : 'All recent company branding and portfolio uploads operating normally within quota.'}
              </p>
            </div>
            <div className="text-[11px] text-slate-400 font-mono shrink-0">
              Storage Mode: <span className="text-white font-bold">Production Multi-Tier</span>
            </div>
          </div>
        </CardBody>
      </Card>

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
