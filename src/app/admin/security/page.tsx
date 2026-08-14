'use client';

import { useState, useEffect } from 'react';
import {
  Shield, Activity, Users, Key, Database,
  CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import { orderBy, limit, where } from 'firebase/firestore';

const PERMISSIONS = [
  { module: 'Users', super_admin: true, admin: true, moderator: false, support: true, sales: false, franchise: false },
  { module: 'Businesses', super_admin: true, admin: true, moderator: true, support: false, sales: false, franchise: true },
  { module: 'Jobs', super_admin: true, admin: true, moderator: true, support: false, sales: false, franchise: true },
  { module: 'Leads', super_admin: true, admin: true, moderator: false, support: false, sales: true, franchise: true },
  { module: 'Subscriptions', super_admin: true, admin: true, moderator: false, support: false, sales: true, franchise: false },
  { module: 'Reports', super_admin: true, admin: true, moderator: false, support: false, sales: true, franchise: true },
  { module: 'Settings', super_admin: true, admin: false, moderator: false, support: false, sales: false, franchise: false },
  { module: 'Security', super_admin: true, admin: false, moderator: false, support: false, sales: false, franchise: false },
];

const roleColors: Record<string, string> = {
  'super_admin': 'text-purple-400 bg-purple-500/10',
  'admin': 'text-violet-400 bg-violet-500/10',
  'moderator': 'text-cyan-400 bg-cyan-500/10' };

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

  // Sync settings
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

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">Security & Access Control</h1>
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
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Activity size={16} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">Activity Logs</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              {logsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
                  <p className="text-sm text-gray-500 font-medium">Loading platform activity...</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Action</th>
                      <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold">User</th>
                      <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold hidden md:table-cell">Target</th>
                      <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm text-gray-900 font-medium">{log.action}</td>
                        <td className="px-3 py-3 text-sm text-gray-600 font-medium">{log.userName || 'System'}</td>
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
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Shield size={16} className="text-blue-600" /> Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 font-medium">Two-Factor Auth</p>
                  <p className="text-[10px] text-gray-500">Require 2FA for admin login</p>
                </div>
                <button onClick={handleToggleTwoFa} className={`w-11 h-6 rounded-full transition-colors ${twoFa ? 'bg-emerald-600' : 'bg-gray-200'} relative`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${twoFa ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 font-medium">Session Timeout</p>
                  <p className="text-[10px] text-gray-500">Auto-logout inactive admins</p>
                </div>
                <select value={sessionTimeout} onChange={e => handleTimeoutChange(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 font-semibold outline-none">
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">1 hr</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Roles */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Users size={16} className="text-blue-600" /> Admin Staff ({admins.length})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {adminsLoading ? (
            <div className="p-5 flex justify-center">
              <Loader2 size={24} className="text-violet-400 animate-spin" />
            </div>
          ) : (
            admins.map(admin => (
              <div key={admin.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-900">{(admin.displayName || admin.name || 'A')[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{admin.displayName || admin.name || 'Admin'}</p>
                  <p className="text-[10px] text-gray-500">{admin.email}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${roleColors[admin.role] || 'text-gray-400 bg-gray-500/10'}`}>{admin.role}</span>
                <span className="text-[10px] text-gray-600 hidden sm:block">
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
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Key size={16} className="text-amber-400" /> Permission Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Module</th>
                {['Super Admin', 'Admin', 'Moderator', 'Support', 'Sales', 'Franchise'].map(r => (
                  <th key={r} className="text-center px-2 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {PERMISSIONS.map(p => (
                <tr key={p.module} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-sm text-white">{p.module}</td>
                  {[p.super_admin, p.admin, p.moderator, p.support, p.sales, p.franchise].map((has, i) => (
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
