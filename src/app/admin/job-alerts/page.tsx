'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell, Search, Users, CheckCircle, Clock, XCircle,
  Eye, Trash2, ToggleLeft, ToggleRight, MessageSquare,
  Phone, Mail, MapPin, ExternalLink, Loader2, Filter,
  Smartphone, RefreshCw, Send, Check, Download, AlertCircle,
  Briefcase, ShieldCheck, X, MessageCircle
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, type FirestoreTime } from '@/lib/firestoreTime';
import { sanitizeWhatsAppPhone, THENI_TALUKS } from '@/lib/constants';
import {
  Button, Card, EmptyState, PageHeader, PageShell,
  Pill, Stat, StatGrid, type PillTone, type StatTone
} from '@/components/dashboard';

export interface JobAlertDoc {
  id: string;
  userId?: string;
  title?: string;
  category?: string;
  district?: string;
  jobType?: string;
  emailEnabled?: boolean;
  whatsappEnabled?: boolean;
  pushEnabled?: boolean;
  frequency?: string;
  taluks?: string[];
  categories?: string[];
  phone?: string;
  sanitizedPhone?: string;
  active?: boolean;
  status?: 'active' | 'paused' | string;
  channels?: {
    whatsapp?: boolean;
    email?: boolean;
    push?: boolean;
  };
  createdAt?: FirestoreTime;
  updatedAt?: FirestoreTime;
  [key: string]: unknown;
}

export interface UserDoc {
  id: string;
  displayName?: string;
  name?: string;
  email?: string;
  phone?: string;
  district?: string;
  role?: string;
  isVerified?: boolean;
  [key: string]: unknown;
}

interface SeekerProfileDoc {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  district?: string;
  currentRole?: string;
  designation?: string;
  skills?: string[];
  [key: string]: unknown;
}

export interface EnrichedJobAlert extends JobAlertDoc {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateDistrict: string;
  isCandidateVerified: boolean;
  candidateSkills: string[];
}

const DISTRICT_OPTIONS = [
  'All Districts',
  'Theni',
  'Periyakulam',
  'Cumbum',
  'Bodinayakanur',
  'Chinnamanur',
  'Andipatti',
  'Uthamapalayam',
  'Dindigul',
  'Madurai',
  'Other',
];

export default function AdminJobAlertsPage() {
  const toast = useToast();

  // 1. Fetch live collections
  const { data: rawAlerts, loading: alertsLoading, refresh: refreshAlerts } = useCollection<JobAlertDoc>('jobAlerts');
  const { data: users, loading: usersLoading, refresh: refreshUsers } = useCollection<UserDoc>('users');
  const { data: seekerProfiles, loading: profilesLoading } = useCollection<SeekerProfileDoc>('seekerProfiles');

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'email' | 'push'>('all');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [selectedAlert, setSelectedAlert] = useState<EnrichedJobAlert | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Sync with URL query parameter ?q=
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) setSearchQuery(q);
    }
  }, []);

  // 2. Correlate Job Alerts with Candidate Profile & User records
  const alerts: EnrichedJobAlert[] = useMemo(() => {
    const userMap = new Map<string, UserDoc>();
    (users || []).forEach((u) => userMap.set(u.id, u));

    const profileMap = new Map<string, SeekerProfileDoc>();
    (seekerProfiles || []).forEach((p) => profileMap.set(p.id, p));

    return (rawAlerts || []).map((a) => {
      const uid = a.userId || '';
      const u = userMap.get(uid);
      const p = profileMap.get(uid);

      const candidateName = p?.name || u?.displayName || u?.name || 'Unnamed Candidate';
      const candidateEmail = p?.email || u?.email || 'No email';
      const candidatePhone = a.phone || a.sanitizedPhone || p?.phone || u?.phone || '';
      const candidateDistrict = a.district || p?.district || u?.district || 'Theni';
      const isCandidateVerified = Boolean(u?.isVerified);
      const candidateSkills = p?.skills || [];

      // Normalize status: either 'active' or 'paused'
      const isStatusActive = a.status === 'active' || (a.status === undefined && a.active !== false);
      const resolvedStatus = isStatusActive ? 'active' : 'paused';

      return {
        ...a,
        status: resolvedStatus,
        candidateName,
        candidateEmail,
        candidatePhone,
        candidateDistrict,
        isCandidateVerified,
        candidateSkills,
      };
    }).sort((x, y) => {
      const timeX = x.createdAt ? new Date(x.createdAt as any).getTime() : 0;
      const timeY = y.createdAt ? new Date(y.createdAt as any).getTime() : 0;
      return timeY - timeX;
    });
  }, [rawAlerts, users, seekerProfiles]);

  // 3. Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      // Status filter
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;

      // Channel filter
      const ch = a.channels;
      if (channelFilter === 'whatsapp' && !(a.whatsappEnabled || ch?.whatsapp)) return false;
      if (channelFilter === 'email' && !(a.emailEnabled || ch?.email)) return false;
      if (channelFilter === 'push' && !(a.pushEnabled || ch?.push)) return false;

      // District filter
      if (districtFilter !== 'All Districts') {
        const matchesDistrict = (a.district || '').toLowerCase().includes(districtFilter.toLowerCase());
        const matchesCandidateDistrict = (a.candidateDistrict || '').toLowerCase().includes(districtFilter.toLowerCase());
        const matchesTaluks = Array.isArray(a.taluks) && a.taluks.some((t: string) => t.toLowerCase().includes(districtFilter.toLowerCase()));
        if (!matchesDistrict && !matchesCandidateDistrict && !matchesTaluks) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = a.candidateName.toLowerCase().includes(q);
        const matchesEmail = a.candidateEmail.toLowerCase().includes(q);
        const matchesPhone = a.candidatePhone.includes(q);
        const matchesTitle = (a.title || '').toLowerCase().includes(q);
        const matchesCategory = (a.category || '').toLowerCase().includes(q);
        const matchesUserId = (a.userId || '').toLowerCase().includes(q);
        const matchesId = a.id.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesPhone || matchesTitle || matchesCategory || matchesUserId || matchesId;
      }

      return true;
    });
  }, [alerts, statusFilter, channelFilter, districtFilter, searchQuery]);

  // 4. Summary metrics
  const stats = useMemo(() => {
    let active = 0;
    let paused = 0;
    let whatsapp = 0;
    let email = 0;

    alerts.forEach((a) => {
      if (a.status === 'active') active++;
      else paused++;
      const ch = a.channels;
      if (a.whatsappEnabled || ch?.whatsapp) whatsapp++;
      if (a.emailEnabled || ch?.email) email++;
    });

    return {
      total: alerts.length,
      active,
      paused,
      whatsapp,
      email,
    };
  }, [alerts]);

  // 5. Actions
  const handleToggleStatus = async (alertItem: EnrichedJobAlert) => {
    const nextStatus = alertItem.status === 'active' ? 'paused' : 'active';
    setActionLoading(alertItem.id);
    try {
      await updateDocument('jobAlerts', alertItem.id, {
        status: nextStatus,
        active: nextStatus === 'active',
        updatedAt: new Date(),
      });
      toast.success(`Job alert ${nextStatus === 'active' ? 'activated' : 'paused'} successfully.`);
      if (selectedAlert?.id === alertItem.id) {
        setSelectedAlert({ ...selectedAlert, status: nextStatus, active: nextStatus === 'active' });
      }
      refreshAlerts();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update alert status: ' + (err?.message || 'Error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAlert = async (alertItem: EnrichedJobAlert) => {
    if (!confirm(`Are you sure you want to permanently delete this alert ("${alertItem.title || alertItem.category || 'Job Alert'}") for ${alertItem.candidateName}?`)) {
      return;
    }
    setActionLoading(alertItem.id);
    try {
      await deleteDocument('jobAlerts', alertItem.id);
      toast.success('Job alert deleted successfully.');
      if (selectedAlert?.id === alertItem.id) {
        setSelectedAlert(null);
      }
      refreshAlerts();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete alert: ' + (err?.message || 'Error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredAlerts.length === 0) {
      toast.error('No job alerts to export.');
      return;
    }

    const headers = [
      'Alert ID',
      'Candidate Name',
      'Candidate Phone',
      'Candidate Email',
      'Alert Title / Category',
      'District / Taluk',
      'Job Type',
      'Status',
      'WhatsApp Enabled',
      'Email Enabled',
      'Created Date',
    ];

    const rows = filteredAlerts.map((a) => [
      a.id,
      `"${a.candidateName.replace(/"/g, '""')}"`,
      `"${a.candidatePhone.replace(/"/g, '""')}"`,
      `"${a.candidateEmail.replace(/"/g, '""')}"`,
      `"${(a.title || a.category || 'All Jobs').replace(/"/g, '""')}"`,
      `"${(a.district || a.candidateDistrict || 'Theni').replace(/"/g, '""')}"`,
      `"${a.jobType || 'Full-time'}"`,
      (a.status || 'active').toUpperCase(),
      a.whatsappEnabled || a.channels?.whatsapp ? 'YES' : 'NO',
      a.emailEnabled || a.channels?.email ? 'YES' : 'NO',
      formatDate(a.createdAt),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `thenijobs-candidate-job-alerts-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Job Alerts CSV exported successfully');
  };

  const loading = alertsLoading || usersLoading || profilesLoading;

  return (
    <PageShell className="space-y-6 pb-20">
      <PageHeader
        title="Candidate Job Alerts Manager"
        description="View, verify, activate, and manage WhatsApp & Email job alert subscriptions created by job seekers."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Job Alerts' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { refreshAlerts(); refreshUsers(); }}
              className="flex items-center gap-1.5 text-xs font-bold"
              aria-label="Refresh alerts list"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </Button>
            <Link href="/admin/job-seekers">
              <Button size="sm" variant="primary">
                <Users size={14} />
                <span>Job Seekers</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats Cards */}
      <StatGrid columns={5}>
        <Stat label="Total Candidate Alerts" value={stats.total} icon={Bell} tone="blue" />
        <Stat label="Active Subscriptions" value={stats.active} icon={CheckCircle} tone="emerald" />
        <Stat label="Paused Subscriptions" value={stats.paused} icon={Clock} tone="amber" />
        <Stat label="WhatsApp Alerts" value={stats.whatsapp} icon={Smartphone} tone="emerald" />
        <Stat label="Email Alerts" value={stats.email} icon={Mail} tone="violet" />
      </StatGrid>

      {/* Main Filter & Content Card */}
      <Card>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              aria-label="Search job alerts"
              placeholder="Search by candidate name, phone, email, alert role, category, or taluk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by subscription status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="paused">Paused Only</option>
            </select>

            <select
              aria-label="Filter by notification channel"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Channels</option>
              <option value="whatsapp">WhatsApp Alerts</option>
              <option value="email">Email Alerts</option>
              <option value="push">Push Alerts</option>
            </select>

            <select
              aria-label="Filter by location"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              {DISTRICT_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {(searchQuery || statusFilter !== 'all' || channelFilter !== 'all' || districtFilter !== 'All Districts') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setChannelFilter('all');
                  setDistrictFilter('All Districts');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Alerts Table */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-xs font-medium text-slate-500">Loading candidate job alert subscriptions...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No job alerts match your filters"
              description={searchQuery || statusFilter !== 'all' || channelFilter !== 'all' || districtFilter !== 'All Districts'
                ? 'Try clearing keywords or adjusting filter parameters.'
                : 'No candidate job alerts have been configured in the system yet.'}
              icon={Bell}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Alert Criteria / Role</th>
                  <th className="py-3 px-4">Target Location</th>
                  <th className="py-3 px-4">Channels</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredAlerts.map((alert) => {
                  const isUpdating = actionLoading === alert.id;
                  const ch = alert.channels;
                  const hasWhatsApp = alert.whatsappEnabled || ch?.whatsapp;
                  const hasEmail = alert.emailEnabled || ch?.email;
                  const hasPush = alert.pushEnabled || ch?.push;

                  return (
                    <tr key={alert.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Candidate Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 uppercase">
                            {alert.candidateName[0] || 'C'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/admin/job-seekers?q=${encodeURIComponent(alert.userId || alert.candidateName)}`}
                                className="font-bold text-slate-900 text-xs hover:text-blue-600 hover:underline flex items-center gap-1"
                              >
                                {alert.candidateName}
                                <ExternalLink size={10} className="text-slate-400" />
                              </Link>
                              {alert.isCandidateVerified && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  <ShieldCheck size={10} /> Verified
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {alert.candidatePhone ? (
                                <span className="font-semibold text-slate-700">{alert.candidatePhone}</span>
                              ) : (
                                <span>{alert.candidateEmail}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Criteria / Role Column */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs truncate max-w-[220px]">
                            {alert.title || alert.category || 'General Employment'}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            {alert.jobType && <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold">{alert.jobType}</span>}
                            <span>•</span>
                            <span>{formatDate(alert.createdAt)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Target Location Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-700 font-semibold">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span>{alert.district || alert.candidateDistrict || 'Any Theni Taluk'}</span>
                        </div>
                        {Array.isArray(alert.taluks) && alert.taluks.length > 0 && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {alert.taluks.join(', ')}
                          </p>
                        )}
                      </td>

                      {/* Notification Channels Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {hasWhatsApp && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Smartphone size={10} /> WhatsApp
                            </span>
                          )}
                          {hasEmail && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              <Mail size={10} /> Email
                            </span>
                          )}
                          {hasPush && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800">
                              <Bell size={10} /> Push
                            </span>
                          )}
                          {!hasWhatsApp && !hasEmail && !hasPush && (
                            <span className="text-[11px] text-slate-400 italic">Default Portal</span>
                          )}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4">
                        {alert.status === 'active' ? (
                          <Pill tone="success">
                            <CheckCircle size={11} /> Active
                          </Pill>
                        ) : (
                          <Pill tone="warning">
                            <Clock size={11} /> Paused
                          </Pill>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle status */}
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleToggleStatus(alert)}
                            className="p-1.5 h-8 text-xs font-bold"
                            title={alert.status === 'active' ? 'Pause Alert' : 'Activate Alert'}
                          >
                            {isUpdating ? (
                              <Loader2 size={14} className="animate-spin text-blue-600" />
                            ) : alert.status === 'active' ? (
                              <ToggleRight size={16} className="text-emerald-600" />
                            ) : (
                              <ToggleLeft size={16} className="text-amber-600" />
                            )}
                          </Button>

                          {/* WhatsApp Chat button */}
                          {alert.candidatePhone && (
                            <a
                              href={`https://wa.me/${sanitizeWhatsAppPhone(alert.candidatePhone)}?text=${encodeURIComponent(`வணக்கம் ${alert.candidateName}! THENIJOBS தளம் வழியாக நீங்கள் பதிவு செய்த "${alert.title || alert.category || 'வேலைவாய்ப்பு'}" அலர்ட் தொடர்பான அறிவிப்பு.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 h-8 w-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors border border-emerald-200"
                              title="Direct WhatsApp to Candidate"
                            >
                              <MessageCircle size={14} />
                            </a>
                          )}

                          {/* View Dossier button */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedAlert(alert)}
                            className="p-1.5 h-8 text-xs font-bold text-slate-700"
                            title="View Alert Details"
                          >
                            <Eye size={14} />
                          </Button>

                          {/* Delete button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleDeleteAlert(alert)}
                            className="p-1.5 h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            title="Delete Alert"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs font-outfit"
          onClick={() => setSelectedAlert(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-gray-200 space-y-5 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                  <Bell size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                      {selectedAlert.title || selectedAlert.category || 'Candidate Job Alert'}
                    </h2>
                    {selectedAlert.status === 'active' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Paused
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    Alert ID: <code className="text-[11px] font-mono text-slate-700">{selectedAlert.id}</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-slate-400 hover:text-gray-600 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Candidate Identity Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Candidate Details</span>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedAlert.candidateName}</p>
                  <p className="text-xs text-slate-600">{selectedAlert.candidatePhone || selectedAlert.candidateEmail}</p>
                </div>
                {selectedAlert.userId && (
                  <Link
                    href={`/admin/job-seekers?q=${selectedAlert.userId}`}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    Open Dossier →
                  </Link>
                )}
              </div>
            </div>

            {/* Subscription Parameters */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Category</span>
                <strong className="text-slate-900">{selectedAlert.category || 'All Categories'}</strong>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Location</span>
                <strong className="text-slate-900">{selectedAlert.district || selectedAlert.candidateDistrict || 'Theni District'}</strong>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Job Type</span>
                <strong className="text-slate-900">{selectedAlert.jobType || 'Full-time'}</strong>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Registered Date</span>
                <strong className="text-slate-900">{formatDate(selectedAlert.createdAt)}</strong>
              </div>
            </div>

            {/* Notification Channels Enabled */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">Delivery Channels Configured</span>
              <div className="flex items-center gap-3 text-xs">
                <span className={`flex items-center gap-1.5 font-bold ${selectedAlert.whatsappEnabled || selectedAlert.channels?.whatsapp ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {selectedAlert.whatsappEnabled || selectedAlert.channels?.whatsapp ? <Check size={14} className="text-emerald-600" /> : <X size={14} />} WhatsApp
                </span>
                <span className={`flex items-center gap-1.5 font-bold ${selectedAlert.emailEnabled || selectedAlert.channels?.email ? 'text-blue-700' : 'text-slate-400'}`}>
                  {selectedAlert.emailEnabled || selectedAlert.channels?.email ? <Check size={14} className="text-blue-600" /> : <X size={14} />} Email
                </span>
                <span className={`flex items-center gap-1.5 font-bold ${selectedAlert.pushEnabled || selectedAlert.channels?.push ? 'text-violet-700' : 'text-slate-400'}`}>
                  {selectedAlert.pushEnabled || selectedAlert.channels?.push ? <Check size={14} className="text-violet-600" /> : <X size={14} />} Browser Push
                </span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteAlert(selectedAlert)}
                className="flex items-center gap-1.5 text-xs font-bold"
              >
                <Trash2 size={14} /> Delete Alert
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleToggleStatus(selectedAlert)}
                  className="flex items-center gap-1.5 text-xs font-bold"
                >
                  {selectedAlert.status === 'active' ? (
                    <>
                      <ToggleRight size={16} className="text-emerald-600" /> Pause Subscription
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={16} className="text-amber-600" /> Activate Subscription
                    </>
                  )}
                </Button>

                {selectedAlert.candidatePhone && (
                  <a
                    href={`https://wa.me/${sanitizeWhatsAppPhone(selectedAlert.candidatePhone)}?text=${encodeURIComponent(`வணக்கம் ${selectedAlert.candidateName}! THENIJOBS வழியாக உங்கள் வேலைவாய்ப்பு அறிவிப்பு: `)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Send size={13} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
