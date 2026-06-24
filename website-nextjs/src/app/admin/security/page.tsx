'use client';

import { useState, useEffect } from 'react';
import {
  Shield, Activity, Users, Key, Clock, Database,
  CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { getCount, upsertDocument } from '@/lib/firebase/firestoreService';
import { useAuth } from '@/hooks/useAuth';
import { orderBy, limit, where } from 'firebase/firestore';
import { Select } from '@/components/ui/Select';

const PERMISSIONS = [
  { module: 'Users', super_admin: true, admin: true },
  { module: 'Businesses', super_admin: true, admin: true },
  { module: 'Jobs', super_admin: true, admin: true },
  { module: 'Leads', super_admin: true, admin: true },
  { module: 'Subscriptions', super_admin: true, admin: true },
  { module: 'Reports', super_admin: true, admin: true },
  { module: 'Settings', super_admin: true, admin: false },
  { module: 'Security', super_admin: true, admin: false },
];

const roleColors: Record<string, string> = {
  'super_admin': 'text-purple-400 bg-purple-500/10',
  'admin': 'text-violet-400 bg-violet-500/10',
  'moderator': 'text-cyan-400 bg-cyan-500/10',
};

const TIMEOUT_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hr' },
];

interface LogDoc {
  id: string;
  action: string;
  userName?: string;
  target?: string;
  timestamp?: any;
  ip?: string;
}

interface AdminUserDoc {
  id: string;
  displayName?: string;
  name?: string;
  email: string;
  role: string;
  lastLogin?: any;
}

export default function SecurityPage() {
  const { user } = useAuth();
  const canManageSecurity = user?.role === 'super_admin';
  const { data: logs, loading: logsLoading } = useCollection<LogDoc>('activityLogs', [
    orderBy('timestamp', 'desc'),
    limit(20)
  ]);

  const { data: admins, loading: adminsLoading } = useCollection<AdminUserDoc>('users', [
    where('role', 'in', ['admin', 'super_admin'])
  ]);

  const { data: globalSettings } = useDocument<any>('platformSettings', 'global');

  const [twoFa, setTwoFa] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [saveLoading, setSaveLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');

  // Sync settings
  useEffect(() => {
    if (globalSettings) {
      if (globalSettings.twoFa !== undefined) setTwoFa(globalSettings.twoFa);
      if (globalSettings.sessionTimeout) setSessionTimeout(globalSettings.sessionTimeout);
    }
  }, [globalSettings]);

  const handleToggleTwoFa = async () => {
    if (!canManageSecurity) return;
    const next = !twoFa;
    setTwoFa(next);
    setSaveLoading(true);
    try {
      await upsertDocument('platformSettings', 'global', { twoFa: next });
    } catch (err) {
      console.error('Two-Factor save error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTimeoutChange = async (val: string) => {
    if (!canManageSecurity) return;
    setSessionTimeout(val);
    setSaveLoading(true);
    try {
      await upsertDocument('platformSettings', 'global', { sessionTimeout: val });
    } catch (err) {
      console.error('Timeout save error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleVerifyConnection = async () => {
    setConnectionStatus('checking');
    try {
      await getCount('users');
      setConnectionStatus('ok');
    } catch (err) {
      console.error('Firestore connection check failed:', err);
      setConnectionStatus('error');
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp.toDate ? timestamp.toDate() : timestamp);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6 animate-fade-in-up animate-outfit">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Security & Access Control</h1>
          <p className="text-sm text-gray-400 mt-1">Manage admin roles, permissions, and platform security</p>
        </div>
        {saveLoading && (
          <span className="text-xs text-violet-400 flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin" /> Saving...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Activity Logs */}
        <div className="xl:col-span-2">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Activity size={16} className="text-violet-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">Activity Logs</h2>
              </div>
            </div>
            <div className="overflow-x-auto font-outfit">
              {logsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
                  <p className="text-sm text-gray-400">Loading platform activity...</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Action</th>
                      <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">User</th>
                      <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold hidden md:table-cell">Target</th>
                      <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 text-sm text-white">{log.action}</td>
                        <td className="px-3 py-3 text-sm text-gray-400">{log.userName || 'System'}</td>
                        <td className="px-3 py-3 text-sm text-gray-500 hidden md:table-cell truncate max-w-[200px]">{log.target || '—'}</td>
                        <td className="px-5 py-3 text-xs text-gray-500 text-right whitespace-nowrap">{formatTime(log.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="space-y-4 font-outfit">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Shield size={16} className="text-violet-400" /> Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Two-Factor Auth</p>
                  <p className="text-[10px] text-gray-500">Require 2FA for admin login (Coming Soon)</p>
                </div>
                <button disabled={!canManageSecurity} onClick={handleToggleTwoFa} className={`w-11 h-6 rounded-full transition-colors ${twoFa ? 'bg-emerald-600' : 'bg-white/10'} relative disabled:opacity-50`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${twoFa ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Session Timeout</p>
                  <p className="text-[10px] text-gray-500">Auto-logout inactive admins (Coming Soon)</p>
                </div>
                <Select
                  disabled={!canManageSecurity}
                  value={sessionTimeout}
                  onChange={handleTimeoutChange}
                  options={TIMEOUT_OPTIONS}
                  className="w-28"
                />
              </div>
              {!canManageSecurity && (
                <p className="text-[10px] text-amber-400">Super admin access is required to change security settings.</p>
              )}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Database size={16} className="text-cyan-400" /> Backup</h3>
            <p className="text-xs text-gray-500 mb-1">Database Sync Status</p>
            <p className={`text-[10px] mb-3 ${connectionStatus === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {connectionStatus === 'checking'
                ? 'Checking Firestore connection...'
                : connectionStatus === 'error'
                  ? 'Connection check failed'
                  : 'All Firestore models are active'}
            </p>
            <button
              onClick={handleVerifyConnection}
              disabled={connectionStatus === 'checking'}
              className="w-full py-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {connectionStatus === 'checking' && <Loader2 size={14} className="animate-spin" />}
              Verify Connection
            </button>
          </div>
        </div>
      </div>

      {/* Admin Staff */}
      <div className="glass-card rounded-2xl overflow-hidden font-outfit">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Users size={16} className="text-violet-400" /> Admin Staff ({admins.length})</h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {adminsLoading ? (
            <div className="p-5 flex justify-center">
              <Loader2 size={24} className="text-violet-400 animate-spin" />
            </div>
          ) : (
            admins.map(admin => (
              <div key={admin.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{(admin.displayName || admin.name || 'A')[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{admin.displayName || admin.name || 'Admin'}</p>
                  <p className="text-[10px] text-gray-500">{admin.email}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${roleColors[admin.role] || 'text-gray-400 bg-gray-500/10'}`}>{admin.role}</span>
                <span className="text-[10px] text-gray-655 hidden sm:block">
                  {admin.lastLogin ? formatTime(admin.lastLogin) : 'Active now'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="glass-card rounded-2xl overflow-hidden font-outfit">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Key size={16} className="text-amber-400" /> Permission Matrix
            <span className="text-[10px] text-amber-400/80 font-normal ml-2">(Role-based access enforcement on roadmap)</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Module</th>
                {['Super Admin', 'Admin'].map(r => (
                  <th key={r} className="text-center px-2 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {PERMISSIONS.map(p => (
                <tr key={p.module} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-sm text-white">{p.module}</td>
                  {[p.super_admin, p.admin].map((has, i) => (
                    <td key={i} className="text-center px-2 py-3">
                      {has ? <CheckCircle size={14} className="text-emerald-400 mx-auto" /> : <XCircle size={14} className="text-gray-700 mx-auto" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
