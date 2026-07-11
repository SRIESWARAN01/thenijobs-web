'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Activity, Search, Download, Loader2, Filter, Clock,
  User, FileText, Calendar, ChevronDown, RefreshCw,
} from 'lucide-react';
import { getAdminActivityLogs, type AdminActivityLog } from '@/lib/activityLogger';

const MODULE_COLORS: Record<string, string> = {
  jobs: 'bg-cyan-500/10 text-cyan-400',
  users: 'bg-violet-500/10 text-violet-400',
  businesses: 'bg-emerald-500/10 text-emerald-400',
  services: 'bg-amber-500/10 text-amber-400',
  subscriptions: 'bg-purple-500/10 text-purple-400',
  reviews: 'bg-rose-500/10 text-rose-400',
  settings: 'bg-gray-500/10 text-gray-400',
};

const ACTION_COLORS: Record<string, string> = {
  approve: 'text-emerald-400',
  reject: 'text-rose-400',
  delete: 'text-red-400',
  edit: 'text-blue-400',
  create: 'text-cyan-400',
  update: 'text-amber-400',
  login: 'text-violet-400',
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAdminActivityLogs(200);
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (moduleFilter !== 'all' && log.module !== moduleFilter) return false;
      if (dateFilter && log.date !== dateFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = `${log.userName} ${log.action} ${log.module} ${log.target} ${log.details}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [logs, moduleFilter, dateFilter, searchQuery]);

  const modules = useMemo(() => {
    const mods = new Set(logs.map((l) => l.module));
    return ['all', ...Array.from(mods).sort()];
  }, [logs]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Time', 'User', 'Email', 'Action', 'Module', 'Target', 'Details', 'Old Value', 'New Value'];
    const rows = filtered.map((l) => [
      l.date || '', l.time || '', l.userName || '', l.userEmail || '',
      l.action || '', l.module || '', l.target || '', l.details || '',
      l.oldValue || '', l.newValue || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_activity_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = logs.filter((l) => l.date === today);
    const uniqueAdmins = new Set(logs.map((l) => l.userId)).size;
    const uniqueModules = new Set(logs.map((l) => l.module)).size;
    return [
      { label: 'Total Actions', value: logs.length, color: 'violet' },
      { label: 'Today', value: todayLogs.length, color: 'cyan' },
      { label: 'Active Admins', value: uniqueAdmins, color: 'emerald' },
      { label: 'Modules', value: uniqueModules, color: 'amber' },
    ];
  }, [logs]);

  const colorMap: Record<string, { bg: string; text: string }> = {
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Activity Logs</h1>
          <p className="text-sm text-gray-400 mt-1">Track all admin actions and changes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLogs} className="px-3 py-2 rounded-xl bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleExportCSV} className="px-3 py-2 rounded-xl bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const colors = colorMap[s.color];
          return (
            <div key={s.label} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-white font-outfit">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
                <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <Activity size={16} className={colors.text} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input w-full pl-9 pr-4 py-2 text-sm"
          />
        </div>
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white outline-none"
        >
          {modules.map((m) => (
            <option key={m} value={m} className="bg-[#0f0f27] text-white">
              {m === 'all' ? 'All Modules' : m.charAt(0).toUpperCase() + m.slice(1)}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white outline-none"
        />
        {(moduleFilter !== 'all' || dateFilter || searchQuery) && (
          <button
            onClick={() => { setModuleFilter('all'); setDateFilter(''); setSearchQuery(''); }}
            className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Log Entries */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
              <p className="text-sm text-gray-400">Loading activity logs...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
                <Activity size={20} className="text-gray-500" />
              </div>
              <p className="text-sm text-gray-400">No activity logs found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500">Date / Time</th>
                  <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Admin</th>
                  <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Action</th>
                  <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 hidden md:table-cell">Module</th>
                  <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 hidden lg:table-cell">Target</th>
                  <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 hidden xl:table-cell">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((log) => {
                  const actionColor = Object.entries(ACTION_COLORS).find(([k]) => log.action?.toLowerCase().includes(k))?.[1] || 'text-gray-300';
                  const moduleColor = MODULE_COLORS[log.module] || MODULE_COLORS.settings;

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-medium text-gray-300">{log.date}</p>
                        <p className="text-[10px] text-gray-500">{log.time}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="text-sm font-medium text-white">{log.userName}</p>
                        <p className="text-[10px] text-gray-500">{log.userEmail}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`text-sm font-bold capitalize ${actionColor}`}>{log.action}</span>
                      </td>
                      <td className="px-3 py-3.5 hidden md:table-cell">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${moduleColor}`}>
                          {log.module}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-sm text-gray-400 hidden lg:table-cell">
                        {log.target || '—'}
                      </td>
                      <td className="px-3 py-3.5 text-xs text-gray-500 hidden xl:table-cell max-w-[200px] truncate">
                        {log.details || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-600">
        Showing {filtered.length} of {logs.length} total log entries
      </p>
    </div>
  );
}
