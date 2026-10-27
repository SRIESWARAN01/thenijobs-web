'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldAlert, ShieldCheck, Database, Trash2, RefreshCw, AlertTriangle,
  CheckCircle2, Download, Eye, Lock, ArrowRight, Server, FileText,
  Users2, Building2, CreditCard, Sparkles, Check, X
} from 'lucide-react';
import { PageHeader, StatGrid, Stat } from '@/components/dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

export default function AdminDatabaseCleanupPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'preserved' | 'deletions' | 'subscriptions' | 'audit'>('preserved');

  // Dry run & Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [dryRunReport, setDryRunReport] = useState<any | null>(null);
  const [backupResult, setBackupResult] = useState<any | null>(null);

  // Execution Confirmation Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [executionResult, setExecutionResult] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/database-cleanup');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        toast.error(json.error || 'Failed to fetch database cleanup state');
      }
    } catch (err: any) {
      toast.error('Network error loading cleanup state');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Dry Run
  const handleDryRun = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/database-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dry_run' }),
      });
      const json = await res.json();
      if (json.success) {
        setDryRunReport(json.dryRunReport);
        toast.success('Dry run completed safely. 0 writes performed.');
      } else {
        toast.error(json.error || 'Dry run failed');
      }
    } catch (err: any) {
      toast.error('Dry run execution error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Backup Creation
  const handleCreateBackup = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/database-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_backup' }),
      });
      const json = await res.json();
      if (json.success) {
        setBackupResult(json);
        toast.success(`Automated backup saved to ${json.backupPath}`);
      } else {
        toast.error(json.error || 'Backup creation failed');
      }
    } catch (err: any) {
      toast.error('Backup network error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Final Cleanup Execution
  const handleExecuteCleanup = async () => {
    if (confirmInput.trim() !== 'CONFIRM_CLEANUP_THENIJOBS') {
      toast.error('Type "CONFIRM_CLEANUP_THENIJOBS" exactly to authorize deletion.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/database-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_cleanup',
          confirmationKey: confirmInput.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setExecutionResult(json.result);
        setConfirmModalOpen(false);
        setConfirmInput('');
        toast.success('Database cleanup successfully executed & verified!');
        await fetchData();
      } else {
        toast.error(json.error || 'Execution failed');
      }
    } catch (err: any) {
      toast.error('Cleanup execution error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <PageHeader
        title="Database Sanitation & Account Cleanup Hub"
        description="Authoritative, safe production cleanup interface to retain strictly 1 designated Admin account and the 8 verified company records while purging non-retained users, balances, and orphaned records."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Database Cleanup' }]}
      />

      {/* Main KPI Stats */}
      <StatGrid columns={4}>
        <Stat
          label="Designated Admin"
          value={data?.summary?.retainedAdminPresent ? 'PROTECTED (1)' : 'MISSING'}
          icon={ShieldCheck}
          tone="emerald"
          loading={loading}
        />
        <Stat
          label="Total Auth Users"
          value={data?.summary?.totalAuthUsers || 0}
          icon={Users2}
          tone={data?.summary?.totalAuthUsers > 1 ? 'amber' : 'emerald'}
          loading={loading}
        />
        <Stat
          label="Preserved Companies"
          value={`${data?.summary?.retainedCompaniesCount || 0} of 8`}
          icon={Building2}
          tone="emerald"
          loading={loading}
        />
        <Stat
          label="Active Subscriptions"
          value={data?.summary?.totalSubscriptions || 0}
          icon={CreditCard}
          tone="blue"
          loading={loading}
        />
      </StatGrid>

      {/* Action Control Panel */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Protected Production Safety Gate</h3>
          </div>
          <p className="text-xs text-slate-500">
            Retained Admin UID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-bold">{data?.retainedAdmin?.uid || 'Loading…'}</code> ({data?.retainedAdmin?.email})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={actionLoading || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh State</span>
          </button>

          <button
            onClick={handleCreateBackup}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Download size={14} />
            <span>Export Backup</span>
          </button>

          <button
            onClick={handleDryRun}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Eye size={14} />
            <span>Run Safe Dry Run</span>
          </button>

          {data?.summary?.candidateAuthDeletions > 0 && (
            <button
              onClick={() => setConfirmModalOpen(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20"
            >
              <Trash2 size={14} />
              <span>Execute Cleanup ({data?.summary?.candidateAuthDeletions})</span>
            </button>
          )}
        </div>
      </div>

      {/* Dry Run Banner */}
      {dryRunReport && (
        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 size={18} className="text-blue-600" />
              <span>Dry Run Simulation Succeeded — 0 Writes Performed</span>
            </div>
            <button onClick={() => setDryRunReport(null)} className="text-blue-500 hover:text-blue-800">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white/80 rounded-xl">
              <p className="text-slate-500">Super Admin UID:</p>
              <p className="font-mono font-bold text-[11px] truncate">{dryRunReport.designatedAdminUID}</p>
            </div>
            <div className="p-3 bg-white/80 rounded-xl">
              <p className="text-slate-500">Preserved Companies:</p>
              <p className="font-bold text-emerald-700">{dryRunReport.preservedCompanyCount}</p>
            </div>
            <div className="p-3 bg-white/80 rounded-xl">
              <p className="text-slate-500">Proposed Auth Deletions:</p>
              <p className="font-bold text-red-600">{dryRunReport.proposedAuthDeletionsCount} users</p>
            </div>
            <div className="p-3 bg-white/80 rounded-xl">
              <p className="text-slate-500">Proposed Firestore Deletions:</p>
              <p className="font-bold text-red-600">{dryRunReport.proposedFirestoreDeletionsCount} docs</p>
            </div>
          </div>
        </div>
      )}

      {/* Backup Result Banner */}
      {backupResult && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Automated Backup created at: <code className="font-mono">{backupResult.backupPath}</code></span>
          </div>
          <button onClick={() => setBackupResult(null)} className="text-emerald-700 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Execution Result Banner */}
      {executionResult && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Cleanup Successfully Executed</span>
            </h4>
            <button onClick={() => setExecutionResult(null)} className="text-emerald-600 hover:text-emerald-900">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs">
            Deleted {executionResult.authUsersDeleted} Auth accounts, {executionResult.firestoreUsersDeleted} Firestore profiles. Preserved {executionResult.companiesPreserved} companies and reassigned ownership to Super Admin.
          </p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('preserved')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'preserved'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={16} />
          <span>Preserved Entities (Admin + 8 Companies)</span>
        </button>

        <button
          onClick={() => setActiveTab('deletions')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'deletions'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trash2 size={16} />
          <span>User Deletion Queue ({data?.summary?.candidateAuthDeletions || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'subscriptions'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard size={16} />
          <span>Company Subscriptions ({data?.subscriptions?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: PRESERVED ENTITIES */}
      {activeTab === 'preserved' && (
        <div className="space-y-6">
          {/* Admin Dossier */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900">Designated Super Admin Account (Protected)</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                IMMUTABLE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-500">Firebase UID:</p>
                <p className="font-mono font-bold text-slate-900 truncate">{data?.retainedAdmin?.uid}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-500">Email Address:</p>
                <p className="font-bold text-slate-900">{data?.retainedAdmin?.email}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-500">Role Status:</p>
                <p className="font-bold text-emerald-700 uppercase">SUPER_ADMIN (Active)</p>
              </div>
            </div>
          </div>

          {/* 8 Retained Companies Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">8 Preserved Production Companies:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data?.retainedCompanies?.map((comp: any) => (
                <div key={comp.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                      <Building2 size={13} />
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PRESERVED
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 truncate">{comp.name}</h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {comp.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER DELETION QUEUE */}
      {activeTab === 'deletions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            The accounts below are non-admin user accounts identified in Firebase Authentication. Deleting them purges their login credentials while keeping company data, jobs, and subscriptions 100% intact and managed by the Super Admin.
          </div>

          {data?.candidateDeletions?.authUsers?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-900">Database is Clean!</h4>
              <p className="text-xs text-slate-500">Only the designated Super Admin remains in Firebase Authentication.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3.5">User UID</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Display Name</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.candidateDeletions?.authUsers?.map((u: any) => (
                    <tr key={u.uid} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono text-[11px] text-slate-600">{u.uid}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{u.email}</td>
                      <td className="p-3.5 text-slate-500">{u.displayName || '(none)'}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                          PROPOSED DELETE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3.5">Company Name</th>
                <th className="p-3.5">Plan</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Subscription ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.subscriptions?.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-bold text-slate-900">{sub.companyName}</td>
                  <td className="p-3.5 capitalize font-semibold text-slate-700">{sub.planName || sub.plan}</td>
                  <td className="p-3.5 font-bold text-emerald-700">₹{sub.amount}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {sub.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-400">{sub.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Authorize Permanent Cleanup</h3>
                <p className="text-xs text-red-600 font-semibold">Destructive Action • Irreversible</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action will delete all non-admin user accounts from Firebase Authentication and Firestore. The 8 companies will be reassigned to the Super Admin, preserving their public profiles, jobs, and subscriptions.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Type <span className="font-mono text-red-600 bg-red-50 px-1 py-0.5 rounded">CONFIRM_CLEANUP_THENIJOBS</span> to authorize:
              </label>
              <input
                type="text"
                placeholder="CONFIRM_CLEANUP_THENIJOBS"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmModalOpen(false);
                  setConfirmInput('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCleanup}
                disabled={actionLoading || confirmInput.trim() !== 'CONFIRM_CLEANUP_THENIJOBS'}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30"
              >
                {actionLoading ? 'Deleting…' : 'Confirm & Execute Cleanup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
