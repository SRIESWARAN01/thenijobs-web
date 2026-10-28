'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar, Clock, Video, Phone, MapPin, Search, Filter,
  CheckCircle, XCircle, AlertCircle, Eye, Download, MessageCircle,
  Building2, Briefcase, Users, RefreshCw, Trash2, X, ExternalLink
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, deleteDocument, createNotification } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, toDate, type FirestoreTime } from '@/lib/firestoreTime';
import { safeExternalUrl } from '@/lib/safeUrl';
import { sanitizeWhatsAppPhone } from '@/lib/constants';
import {
  ActionMenu, Button, Card, DataTable, EmptyState, PageHeader, PageShell,
  Pill, Stat, StatGrid, ViewToggle, useViewMode,
  type ActionItem, type Column, type PillTone,
} from '@/components/dashboard';

export interface InterviewDoc {
  id: string;
  seekerId: string;
  seekerName?: string;
  seekerEmail?: string;
  seekerPhone?: string;
  companyId: string;
  companyName?: string;
  jobId: string;
  jobTitle?: string;
  date: string;
  time: string;
  mode?: string;
  type?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | string;
  meetingLink?: string;
  phone?: string;
  location?: string;
  notes?: string;
  skills?: string[];
  createdAt?: FirestoreTime;
  updatedAt?: FirestoreTime;
  [key: string]: unknown;
}

const STATUS_CONFIG: Record<string, { label: string; tone: PillTone }> = {
  scheduled: { label: 'Upcoming / Scheduled', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  no_show:   { label: 'No-Show', tone: 'danger' },
};

const MODE_CONFIG: Record<string, { label: string; tone: PillTone; icon: any }> = {
  video:       { label: 'Video Call', tone: 'info', icon: Video },
  phone:       { label: 'Phone Call', tone: 'neutral', icon: Phone },
  'in-person': { label: 'In-Person', tone: 'violet', icon: MapPin },
  in_person:   { label: 'In-Person', tone: 'violet', icon: MapPin },
  office:      { label: 'In-Person', tone: 'violet', icon: MapPin },
};

export default function AdminInterviewsPage() {
  const toast = useToast();
  const { data: rawInterviews = [], loading, refresh } = useCollection<InterviewDoc>('interviews');
  const [view, setView] = useViewMode('admin-interviews', 'table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [selectedInterview, setSelectedInterview] = useState<InterviewDoc | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Normalize interviews data defensively
  const interviews = useMemo(() => {
    if (!Array.isArray(rawInterviews)) return [];
    return rawInterviews.map((item) => ({
      ...item,
      seekerName: item.seekerName || 'Candidate',
      companyName: item.companyName || 'Company',
      jobTitle: item.jobTitle || 'Job Title',
      mode: (item.mode || item.type || 'video').toLowerCase(),
      status: (item.status || 'scheduled').toLowerCase(),
    }));
  }, [rawInterviews]);

  // Compute KPI statistics
  const stats = useMemo(() => {
    let scheduled = 0;
    let completed = 0;
    let cancelled = 0;
    let noShow = 0;

    interviews.forEach((i) => {
      const s = i.status;
      if (s === 'scheduled') scheduled++;
      else if (s === 'completed') completed++;
      else if (s === 'cancelled') cancelled++;
      else if (s === 'no_show') noShow++;
    });

    return {
      total: interviews.length,
      scheduled,
      completed,
      cancelled: cancelled + noShow,
    };
  }, [interviews]);

  // Filtered interviews list
  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const seeker = (item.seekerName || '').toLowerCase();
      const company = (item.companyName || '').toLowerCase();
      const job = (item.jobTitle || '').toLowerCase();
      const notes = (item.notes || '').toLowerCase();

      const matchesSearch =
        !q ||
        seeker.includes(q) ||
        company.includes(q) ||
        job.includes(q) ||
        notes.includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'scheduled' && item.status === 'scheduled') ||
        (statusFilter === 'completed' && item.status === 'completed') ||
        (statusFilter === 'cancelled' && (item.status === 'cancelled' || item.status === 'no_show'));

      const matchesMode =
        modeFilter === 'all' ||
        item.mode.includes(modeFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesMode;
    });
  }, [interviews, searchQuery, statusFilter, modeFilter]);

  // Handle status update
  const handleUpdateStatus = async (interviewId: string, newStatus: string) => {
    setActionLoading(interviewId);
    try {
      await updateDocument('interviews', interviewId, {
        status: newStatus,
        updatedAt: new Date(),
      });

      if (selectedInterview && selectedInterview.id === interviewId) {
        setSelectedInterview((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      toast.success(`Interview marked as ${newStatus}`);
    } catch (err: any) {
      console.error('Failed to update interview status:', err);
      toast.error('Failed to update status', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle deletion
  const handleDelete = async (interviewId: string) => {
    if (!confirm('Are you sure you want to delete this interview record? This cannot be undone.')) return;
    setActionLoading(interviewId);
    try {
      await deleteDocument('interviews', interviewId);
      if (selectedInterview?.id === interviewId) {
        setSelectedInterview(null);
      }
      toast.info('Interview record removed.');
    } catch (err: any) {
      console.error('Failed to delete interview:', err);
      toast.error('Failed to delete', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredInterviews.length === 0) {
      toast.warning('No interviews to export.');
      return;
    }

    const headers = ['ID', 'Candidate Name', 'Company Name', 'Job Title', 'Date', 'Time', 'Mode', 'Status', 'Meeting Link', 'Notes'];
    const rows = filteredInterviews.map((i) => [
      i.id,
      `"${(i.seekerName || '').replace(/"/g, '""')}"`,
      `"${(i.companyName || '').replace(/"/g, '""')}"`,
      `"${(i.jobTitle || '').replace(/"/g, '""')}"`,
      i.date || '',
      i.time || '',
      i.mode || '',
      i.status || '',
      `"${(i.meetingLink || '').replace(/"/g, '""')}"`,
      `"${(i.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `thenijobs_interviews_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Interview roster exported to CSV.');
  };

  // Table columns
  const columns: Column<InterviewDoc>[] = [
    {
      key: 'candidate',
      header: 'Candidate',
      card: 'title',
      sortValue: (i) => i.seekerName || '',
      render: (i) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-[#EFF6FF] text-sm font-bold text-[#1E40AF]">
            {(i.seekerName || 'C')[0]?.toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-slate-900">{i.seekerName}</span>
            <span className="block truncate text-xs text-slate-500">{i.seekerPhone || i.seekerEmail || 'Seeker UID: ' + i.seekerId.slice(0, 8)}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Company & Job',
      sortValue: (i) => i.companyName || '',
      render: (i) => (
        <div className="text-xs space-y-0.5">
          <p className="font-semibold text-slate-800 flex items-center gap-1">
            <Building2 size={12} className="text-slate-400" /> {i.companyName}
          </p>
          <p className="text-slate-500 flex items-center gap-1 truncate max-w-[200px]">
            <Briefcase size={11} className="text-slate-400" /> {i.jobTitle}
          </p>
        </div>
      ),
    },
    {
      key: 'schedule',
      header: 'Schedule & Mode',
      sortValue: (i) => `${i.date} ${i.time}`,
      render: (i) => {
        const modeKey = (i.mode || '').toLowerCase();
        const modeInfo = MODE_CONFIG[modeKey] || { label: i.mode || 'TBD', tone: 'neutral' as PillTone, icon: Video };
        const ModeIcon = modeInfo.icon;
        return (
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-1 font-semibold text-slate-800">
              <Calendar size={12} className="text-slate-400" /> {i.date || 'TBD'} • {i.time || 'TBD'}
            </div>
            <div>
              <Pill tone={modeInfo.tone}>
                <ModeIcon size={10} aria-hidden /> {modeInfo.label}
              </Pill>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (i) => i.status,
      render: (i) => {
        const conf = STATUS_CONFIG[i.status] || { label: i.status, tone: 'neutral' as PillTone };
        return <Pill tone={conf.tone}>{conf.label}</Pill>;
      },
    },
    {
      key: 'actions',
      header: '',
      card: 'field',
      render: (i) => {
        const items: ActionItem[] = [
          {
            label: 'View Dossier',
            icon: Eye,
            onClick: () => setSelectedInterview(i),
          },
          ...(i.status !== 'completed'
            ? [
                {
                  label: 'Mark Completed',
                  icon: CheckCircle,
                  onClick: () => handleUpdateStatus(i.id, 'completed'),
                },
              ]
            : []),
          ...(i.status !== 'cancelled'
            ? [
                {
                  label: 'Mark Cancelled',
                  icon: XCircle,
                  onClick: () => handleUpdateStatus(i.id, 'cancelled'),
                },
              ]
            : []),
          {
            label: 'Delete Record',
            icon: Trash2,
            tone: 'danger' as const,
            onClick: () => handleDelete(i.id),
          },
        ];
        return <ActionMenu items={items} label="Interview actions" />;
      },
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Candidate Interviews"
        description="Monitor, verify, and manage all scheduled and past candidate interviews across employers and job seekers."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Interviews' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download size={14} aria-hidden /> Export CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={refresh}>
              <RefreshCw size={14} aria-hidden /> Refresh
            </Button>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <StatGrid>
        <Stat label="Total Interviews" value={stats.total} icon={Calendar} tone="slate" />
        <Stat label="Upcoming / Scheduled" value={stats.scheduled} icon={Clock} tone="amber" />
        <Stat label="Completed Rounds" value={stats.completed} icon={CheckCircle} tone="emerald" />
        <Stat label="Cancelled / No-Show" value={stats.cancelled} icon={XCircle} tone="rose" />
      </StatGrid>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by candidate, company, job title, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Upcoming / Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled / No-Show</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Modes</option>
            <option value="video">Video Call</option>
            <option value="phone">Phone Call</option>
            <option value="person">In-Person</option>
          </select>

          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        label="Candidate Interviews"
        loading={loading}
        view={view}
        gridColumns={2}
        columns={columns}
        rows={filteredInterviews}
        getRowId={(i) => i.id}
        emptyIcon={Calendar}
        emptyTitle="No interviews found"
        emptyDescription="Interviews scheduled by employers will appear here in real time for administrative oversight."
      />

      {/* Interview Dossier Modal */}
      {selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs font-outfit">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                  Interview Details
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedInterview.jobTitle}</h2>
                <p className="text-xs text-slate-500">Scheduled between {selectedInterview.seekerName} and {selectedInterview.companyName}</p>
              </div>
              <button
                onClick={() => setSelectedInterview(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-slate-500 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Users size={14} className="text-blue-600" /> Candidate Profile
                </p>
                <p className="font-semibold text-slate-900 text-sm">{selectedInterview.seekerName}</p>
                <p className="text-slate-600">UID: <code className="font-mono text-[11px]">{selectedInterview.seekerId}</code></p>
                {selectedInterview.seekerPhone && (
                  <p className="text-slate-600">Phone: {selectedInterview.seekerPhone}</p>
                )}
                {selectedInterview.seekerEmail && (
                  <p className="text-slate-600">Email: {selectedInterview.seekerEmail}</p>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 size={14} className="text-emerald-600" /> Company & Job
                </p>
                <p className="font-semibold text-slate-900 text-sm">{selectedInterview.companyName}</p>
                <p className="text-slate-600">Company ID: <code className="font-mono text-[11px]">{selectedInterview.companyId}</code></p>
                <p className="text-slate-600">Role: {selectedInterview.jobTitle}</p>
                <p className="text-slate-600">Job ID: <code className="font-mono text-[11px]">{selectedInterview.jobId}</code></p>
              </div>
            </div>

            {/* Schedule & Logistics Details */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  <span className="font-bold text-slate-900">{selectedInterview.date || 'TBD'} at {selectedInterview.time || 'TBD'}</span>
                </div>
                <Pill tone={(STATUS_CONFIG[selectedInterview.status]?.tone) || 'neutral'}>
                  {STATUS_CONFIG[selectedInterview.status]?.label || selectedInterview.status}
                </Pill>
              </div>

              {selectedInterview.meetingLink && (
                <div className="pt-2">
                  <p className="font-semibold text-slate-700 mb-1">Meeting Link:</p>
                  <a
                    href={safeExternalUrl(selectedInterview.meetingLink)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline font-semibold flex items-center gap-1 break-all"
                  >
                    <ExternalLink size={12} /> {selectedInterview.meetingLink}
                  </a>
                </div>
              )}

              {selectedInterview.location && (
                <div className="pt-1">
                  <p className="font-semibold text-slate-700 mb-1">In-Person Address:</p>
                  <p className="text-slate-700">{selectedInterview.location}</p>
                </div>
              )}

              {selectedInterview.notes && (
                <div className="pt-2">
                  <p className="font-semibold text-slate-700 mb-1">Notes / Instructions:</p>
                  <p className="text-slate-700 whitespace-pre-wrap bg-white p-3 rounded-xl border border-blue-100">
                    {selectedInterview.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {selectedInterview.seekerPhone && (
                  <a
                    href={`https://wa.me/${sanitizeWhatsAppPhone(selectedInterview.seekerPhone)}?text=${encodeURIComponent(`Hello ${selectedInterview.seekerName}, regarding your interview for "${selectedInterview.jobTitle}" with ${selectedInterview.companyName} on ${selectedInterview.date} at ${selectedInterview.time}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    style={{ background: '#25D366' }}
                  >
                    <MessageCircle size={14} /> WhatsApp Candidate
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedInterview.status !== 'completed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={actionLoading === selectedInterview.id}
                    onClick={() => handleUpdateStatus(selectedInterview.id, 'completed')}
                    className="bg-[#059669] hover:bg-[#047857]"
                  >
                    <CheckCircle size={14} aria-hidden /> Mark Completed
                  </Button>
                )}
                {selectedInterview.status !== 'cancelled' && (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={actionLoading === selectedInterview.id}
                    onClick={() => handleUpdateStatus(selectedInterview.id, 'cancelled')}
                  >
                    <XCircle size={14} aria-hidden /> Mark Cancelled
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => setSelectedInterview(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
