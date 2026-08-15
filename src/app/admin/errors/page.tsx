'use client';

/**
 * THENIJOBS — Admin Error Monitoring Dashboard
 * Displays all tracked errors with filtering, severity indicators,
 * and status workflow (Open → Investigating → Fixed / Ignored).
 */

import { useState, useEffect } from 'react';
import {
  AlertTriangle, Bug, CheckCircle, Clock, Eye, Filter,
  RefreshCw, Search, Shield, ShieldAlert, XCircle, Loader2,
  ChevronDown, ChevronRight, Globe, Server, Smartphone, X
} from 'lucide-react';
import {
  getErrors, updateErrorStatus, getErrorStats,
  type ErrorRecord, type ErrorSeverity, type ErrorStatus, type ErrorType
} from '@/lib/firebase/errorService';
import { useAuth } from '@/hooks/useAuth';

const SEVERITY_CONFIG: Record<ErrorSeverity, { label: string; color: string; bg: string; icon: any }> = {
  critical: { label: 'Critical', color: '#DC2626', bg: '#FEE2E2', icon: ShieldAlert },
  high: { label: 'High', color: '#EA580C', bg: '#FFF7ED', icon: AlertTriangle },
  medium: { label: 'Medium', color: '#D97706', bg: '#FFFBEB', icon: Bug },
  low: { label: 'Low', color: '#6B7280', bg: '#F3F4F6', icon: Shield },
};

const STATUS_CONFIG: Record<ErrorStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: '#DC2626', bg: '#FEE2E2' },
  investigating: { label: 'Investigating', color: '#D97706', bg: '#FEF3C7' },
  fixed: { label: 'Fixed', color: '#16A34A', bg: '#DCFCE7' },
  ignored: { label: 'Ignored', color: '#6B7280', bg: '#F3F4F6' },
};

const TYPE_LABELS: Record<ErrorType, string> = {
  runtime: 'Runtime',
  api: 'API',
  component: 'Component',
  auth: 'Authentication',
  database: 'Database',
  validation: 'Validation',
  network: 'Network',
  build: 'Build',
  unknown: 'Unknown',
};

export default function AdminErrorsPage() {
  const { user } = useAuth();
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, critical: 0, investigating: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<ErrorStatus | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<ErrorSeverity | ''>('');
  const [filterType, setFilterType] = useState<ErrorType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterSeverity) filters.severity = filterSeverity;
      if (filterType) filters.errorType = filterType;
      filters.limitCount = 100;

      const [errorsData, statsData] = await Promise.all([
        getErrors(filters),
        getErrorStats(),
      ]);

      setErrors(errorsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load errors:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [filterStatus, filterSeverity, filterType]);

  const handleStatusUpdate = async (errorId: string, newStatus: ErrorStatus) => {
    setUpdatingId(errorId);
    try {
      await updateErrorStatus(errorId, newStatus, user?.displayName || user?.uid || 'Admin');
      // Refresh
      await loadData();
      if (selectedError?.id === errorId) {
        setSelectedError(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Failed to update error status:', err);
    } finally {
      setUpdatingId('');
    }
  };

  const filteredErrors = errors.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.errorMessage?.toLowerCase().includes(q) ||
      e.page?.toLowerCase().includes(q) ||
      e.component?.toLowerCase().includes(q) ||
      e.apiEndpoint?.toLowerCase().includes(q)
    );
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleString('en-IN');
      return new Date(timestamp).toLocaleString('en-IN');
    } catch { return 'N/A'; }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Error Monitoring
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track, investigate, and resolve system errors</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Errors', value: stats.total, icon: Bug, color: '#6B7280', bg: '#F9FAFB' },
          { label: 'Open', value: stats.open, icon: AlertTriangle, color: '#DC2626', bg: '#FEF2F2' },
          { label: 'Critical (Open)', value: stats.critical, icon: ShieldAlert, color: '#DC2626', bg: '#FEE2E2' },
          { label: 'Investigating', value: stats.investigating, icon: Eye, color: '#D97706', bg: '#FFFBEB' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-gray-100 p-4" style={{ background: bg }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} style={{ color }} />
              <span className="text-xs font-semibold text-gray-500">{label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
          <Filter size={13} /> Filters:
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-blue-400"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="fixed">Fixed</option>
          <option value="ignored">Ignored</option>
        </select>
        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value as any)}
          className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-blue-400"
        >
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
          className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-blue-400"
        >
          <option value="">All Types</option>
          <option value="runtime">Runtime</option>
          <option value="api">API</option>
          <option value="component">Component</option>
          <option value="auth">Auth</option>
          <option value="database">Database</option>
          <option value="network">Network</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search errors..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* Error List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      ) : filteredErrors.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle size={40} className="mx-auto mb-3 text-emerald-300" />
          <p className="text-sm font-semibold">No errors found</p>
          <p className="text-xs mt-1">System is running smoothly</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredErrors.map(error => {
            const sevConfig = SEVERITY_CONFIG[error.severity] || SEVERITY_CONFIG.medium;
            const statusConfig = STATUS_CONFIG[error.status] || STATUS_CONFIG.open;
            const SevIcon = sevConfig.icon;

            return (
              <div
                key={error.id}
                className="rounded-xl border border-gray-100 bg-white p-4 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => setSelectedError(error)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: sevConfig.bg }}>
                    <SevIcon size={14} style={{ color: sevConfig.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: sevConfig.bg, color: sevConfig.color }}>
                        {sevConfig.label}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                        {statusConfig.label}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{TYPE_LABELS[error.errorType] || error.errorType}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{error.errorMessage}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1"><Globe size={10} /> {error.page}</span>
                      {error.component && <span className="flex items-center gap-1"><Server size={10} /> {error.component}</span>}
                      <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(error.lastOccurred)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {error.status === 'open' && (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); handleStatusUpdate(error.id, 'investigating'); }}
                          disabled={updatingId === error.id}
                          className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        >
                          {updatingId === error.id ? <Loader2 size={10} className="animate-spin" /> : 'Investigate'}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleStatusUpdate(error.id, 'ignored'); }}
                          disabled={updatingId === error.id}
                          className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
                        >
                          Ignore
                        </button>
                      </>
                    )}
                    {error.status === 'investigating' && (
                      <button
                        onClick={e => { e.stopPropagation(); handleStatusUpdate(error.id, 'fixed'); }}
                        disabled={updatingId === error.id}
                        className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      >
                        {updatingId === error.id ? <Loader2 size={10} className="animate-spin" /> : 'Mark Fixed'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedError(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-gray-900">Error Details</h3>
              <button onClick={() => setSelectedError(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Severity + Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{
                  background: SEVERITY_CONFIG[selectedError.severity]?.bg,
                  color: SEVERITY_CONFIG[selectedError.severity]?.color
                }}>
                  {SEVERITY_CONFIG[selectedError.severity]?.label}
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{
                  background: STATUS_CONFIG[selectedError.status]?.bg,
                  color: STATUS_CONFIG[selectedError.status]?.color
                }}>
                  {STATUS_CONFIG[selectedError.status]?.label}
                </span>
                <span className="text-xs text-gray-500 font-mono">{TYPE_LABELS[selectedError.errorType]}</span>
              </div>

              {/* Error Message */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Error Message</h4>
                <p className="text-sm text-gray-900 font-medium">{selectedError.errorMessage}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-gray-500 uppercase">Page</span>
                  <p className="text-gray-900 mt-0.5 font-mono">{selectedError.page}</p>
                </div>
                {selectedError.component && (
                  <div>
                    <span className="font-bold text-gray-500 uppercase">Component</span>
                    <p className="text-gray-900 mt-0.5 font-mono">{selectedError.component}</p>
                  </div>
                )}
                {selectedError.apiEndpoint && (
                  <div>
                    <span className="font-bold text-gray-500 uppercase">API Endpoint</span>
                    <p className="text-gray-900 mt-0.5 font-mono break-all">{selectedError.apiEndpoint}</p>
                  </div>
                )}
                <div>
                  <span className="font-bold text-gray-500 uppercase">Last Occurred</span>
                  <p className="text-gray-900 mt-0.5">{formatDate(selectedError.lastOccurred)}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-500 uppercase">Created</span>
                  <p className="text-gray-900 mt-0.5">{formatDate(selectedError.createdAt)}</p>
                </div>
                {selectedError.userId && (
                  <div>
                    <span className="font-bold text-gray-500 uppercase">User ID</span>
                    <p className="text-gray-900 mt-0.5 font-mono">{selectedError.userId}</p>
                  </div>
                )}
                {selectedError.fixedBy && (
                  <div>
                    <span className="font-bold text-gray-500 uppercase">Fixed By</span>
                    <p className="text-gray-900 mt-0.5">{selectedError.fixedBy}</p>
                  </div>
                )}
              </div>

              {/* Stack Trace */}
              {selectedError.stackTrace && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Stack Trace</h4>
                  <pre className="text-[10px] text-red-800 bg-red-50 border border-red-100 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                    {selectedError.stackTrace}
                  </pre>
                </div>
              )}

              {/* Browser Info */}
              {selectedError.browserInfo && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Browser / Device</h4>
                  <p className="text-[11px] text-gray-600 font-mono break-all">{selectedError.browserInfo}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                {selectedError.status === 'open' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedError.id, 'investigating')}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-all"
                    >
                      Start Investigating
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedError.id, 'ignored')}
                      className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 transition-all"
                    >
                      Ignore
                    </button>
                  </>
                )}
                {selectedError.status === 'investigating' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedError.id, 'fixed')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all"
                  >
                    ✓ Mark as Fixed
                  </button>
                )}
                {(selectedError.status === 'fixed' || selectedError.status === 'ignored') && (
                  <button
                    onClick={() => handleStatusUpdate(selectedError.id, 'open')}
                    className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 font-bold text-xs hover:bg-red-100 transition-all"
                  >
                    Re-open
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
