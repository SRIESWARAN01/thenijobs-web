'use client';

import { useState, useEffect } from 'react';
import {
  Shield, Activity, Users, Key, Database,
  CheckCircle, XCircle, Loader2, Lock, ShieldCheck
} from 'lucide-react';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import { orderBy, limit, where } from 'firebase/firestore';

const PERMISSIONS = [
  { module: 'Users & Candidates', super_admin: true, admin: true, moderator: false, support: true },
  { module: 'Companies & Verification', super_admin: true, admin: true, moderator: true, support: false },
  { module: 'Job Approvals', super_admin: true, admin: true, moderator: true, support: false },
  { module: 'Subscriptions & Billing', super_admin: true, admin: true, moderator: false, support: false },
  { module: 'Reviews Moderation', super_admin: true, admin: true, moderator: true, support: false },
  { module: 'Platform Reports', super_admin: true, admin: true, moderator: false, support: false },
  { module: 'AI & SEO Engine', super_admin: true, admin: true, moderator: false, support: false },
  { module: 'Security & Access Control', super_admin: true, admin: false, moderator: false, support: false },
];

const roleColors: Record<string, string> = {
  'super_admin': 'text-purple-700 bg-purple-50 border-purple-200',
  'admin': 'text-blue-700 bg-blue-50 border-blue-200',
  'moderator': 'text-emerald-700 bg-emerald-50 border-emerald-200',
};

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
    const date = timestamp instanceof Date ? timestamp : (timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp));
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6 font-outfit text-gray-900 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Security &amp; Access Control</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage administrator privileges, activity logs, and authentication security</p>
        </div>
        {saveLoading && (
          <span className="text-xs text-blue-600 font-bold flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
            <Loader2 size={13} className="animate-spin" /> Updating Security...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Activity Logs */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Activity size={16} />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Platform Activity Audit Log</h2>
            </div>

            <div className="overflow-x-auto">
              {logsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Loader2 size={28} className="text-blue-600 animate-spin" />
                  <p className="text-xs text-gray-500 font-semibold">Loading logs...</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200">
                      <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff / User</th>
                      <th className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Target</th>
                      <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3 text-xs font-bold text-gray-900">{log.action}</td>
                        <td className="px-3 py-3 text-xs text-gray-600 font-medium">{log.userName || 'Admin'}</td>
                        <td className="px-3 py-3 text-xs text-gray-500 hidden md:table-cell truncate max-w-[200px]">{log.target || '—'}</td>
                        <td className="px-5 py-3 text-xs text-slate-500 text-right whitespace-nowrap font-medium">{formatTime(log.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Security Settings Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Shield size={16} className="text-blue-600" /> Security Controls
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-900">Two-Factor Auth (2FA)</p>
                  <p className="text-[10px] text-gray-500">Require 2FA for Admin login</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTwoFa}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${twoFa ? 'bg-emerald-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${twoFa ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-900">Session Timeout</p>
                  <p className="text-[10px] text-gray-500">Auto-logout inactive sessions</p>
                </div>
                <select
                  value={sessionTimeout}
                  onChange={e => handleTimeoutChange(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-2.5 py-1 text-xs text-gray-900 font-bold outline-none cursor-pointer"
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">60 min</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Roles List */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Users size={16} className="text-blue-600" /> Authorized Admin Staff ({admins.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {admins.map(admin => (
            <div key={admin.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                {(admin.displayName || admin.name || 'A')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-gray-900">{admin.displayName || admin.name || 'Admin'}</p>
                <p className="text-[11px] text-gray-500">{admin.email}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${roleColors[admin.role] || 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                {admin.role.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Key size={16} className="text-blue-600" /> Role Permission Matrix
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Module / Area</th>
                {['Super Admin', 'Admin', 'Moderator', 'Support Staff'].map(r => (
                  <th key={r} className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PERMISSIONS.map(p => (
                <tr key={p.module} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3 text-xs font-bold text-gray-900">{p.module}</td>
                  {[p.super_admin, p.admin, p.moderator, p.support].map((has, i) => (
                    <td key={i} className="text-center px-3 py-3">
                      {has ? <CheckCircle size={15} className="text-emerald-600 mx-auto" /> : <XCircle size={15} className="text-slate-500 mx-auto" />}
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
