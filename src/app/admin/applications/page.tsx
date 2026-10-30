'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FileText, Search, Users, CheckCircle, Clock, XCircle,
  Calendar, Eye, Download, MessageCircle, Phone, Mail,
  ExternalLink, Loader2, Filter, AlertCircle, Building2, Briefcase
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, toDate, type FirestoreTime } from '@/lib/firestoreTime';
import { safeExternalUrl } from '@/lib/safeUrl';
import {
  Button, Card, EmptyState, PageHeader, PageShell,
  Pill, Stat, StatGrid, Toolbar, type PillTone
} from '@/components/dashboard';

export interface ApplicationDoc {
  id: string;
  seekerId?: string;
  seekerName?: string;
  seekerEmail?: string;
  seekerPhone?: string;
  jobId?: string;
  jobTitle?: string;
  companyId?: string;
  companyName?: string;
  status?: 'applied' | 'shortlisted' | 'interview_scheduled' | 'selected' | 'rejected' | string;
  resumeUrl?: string;
  resume?: string;
  coverLetter?: string;
  notes?: string;
  createdAt?: FirestoreTime;
  updatedAt?: FirestoreTime;
  [key: string]: unknown;
}

const STATUS_CONFIG: Record<string, { label: string; tone: PillTone }> = {
  applied:             { label: 'New Applied', tone: 'info' },
  shortlisted:         { label: 'Shortlisted', tone: 'violet' },
  interview_scheduled: { label: 'Interview Scheduled', tone: 'warning' },
  selected:            { label: 'Hired / Selected', tone: 'success' },
  rejected:            { label: 'Rejected', tone: 'danger' },
};

export default function AdminApplicationsPage() {
  const toast = useToast();
  const { data: applications, loading } = useCollection<ApplicationDoc>('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<ApplicationDoc | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Compute stats
  const stats = useMemo(() => {
    let applied = 0;
    let shortlisted = 0;
    let interview = 0;
    let selected = 0;
    let rejected = 0;

    applications.forEach((app) => {
      const s = (app.status || 'applied').toLowerCase();
      if (s === 'applied') applied++;
      else if (s === 'shortlisted') shortlisted++;
      else if (s === 'interview_scheduled') interview++;
      else if (s === 'selected') selected++;
      else if (s === 'rejected') rejected++;
    });

    return {
      total: applications.length,
      applied,
      shortlisted,
      interview,
      selected,
      rejected,
    };
  }, [applications]);

  // Filter applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      const seekerName = (app.seekerName || '').toLowerCase();
      const seekerEmail = (app.seekerEmail || '').toLowerCase();
      const seekerPhone = (app.seekerPhone || '').toLowerCase();
      const jobTitle = (app.jobTitle || '').toLowerCase();
      const companyName = (app.companyName || '').toLowerCase();

      const matchesSearch = !q || (
        seekerName.includes(q) ||
        seekerEmail.includes(q) ||
        seekerPhone.includes(q) ||
        jobTitle.includes(q) ||
        companyName.includes(q)
      );

      const s = (app.status || 'applied').toLowerCase();
      const matchesStatus = statusFilter === 'all' || s === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    setActionLoading(appId);
    try {
      await updateDocument('applications', appId, {
        status: newStatus,
        updatedAt: new Date(),
      });
      toast.success(`Application status updated to "${newStatus}"`);
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch (err: any) {
      toast.error('Failed to update application status: ' + (err?.message || 'Error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredApps.length === 0) {
      toast.error('No applications to export.');
      return;
    }

    const headers = ['Application ID', 'Candidate Name', 'Email', 'Phone', 'Job Title', 'Company', 'Status', 'Applied Date'];
    const rows = filteredApps.map((a) => [
      a.id,
      `"${(a.seekerName || 'N/A').replace(/"/g, '""')}"`,
      `"${(a.seekerEmail || 'N/A').replace(/"/g, '""')}"`,
      `"${(a.seekerPhone || 'N/A').replace(/"/g, '""')}"`,
      `"${(a.jobTitle || 'N/A').replace(/"/g, '""')}"`,
      `"${(a.companyName || 'N/A').replace(/"/g, '""')}"`,
      `"${(a.status || 'applied').replace(/"/g, '""')}"`,
      `"${formatDate(a.createdAt)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `thenijobs-candidate-applications-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Applications CSV exported successfully');
  };

  return (
    <PageShell>
      <PageHeader
        title="Candidate Job Applications"
        description="Cross-company portal monitoring all job applications across Theni district"
        actions={<Pill tone="info">{stats.total} Total Applications</Pill>}
      />

      {/* Stats Counter Grid */}
      <StatGrid>
        <Stat label="Total Applications" value={stats.total} icon={FileText} tone="slate" />
        <Stat label="New Applied" value={stats.applied} icon={Clock} tone="blue" />
        <Stat label="Shortlisted" value={stats.shortlisted} icon={CheckCircle} tone="violet" />
        <Stat label="Interview Scheduled" value={stats.interview} icon={Calendar} tone="amber" />
        <Stat label="Selected / Hired" value={stats.selected} icon={CheckCircle} tone="emerald" />
        <Stat label="Rejected" value={stats.rejected} icon={XCircle} tone="rose" />
      </StatGrid>

      {/* Filter and Action Toolbar */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-slate-100">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate, job, company..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={15} className="text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Application Statuses</option>
                <option value="applied">New Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="selected">Hired / Selected</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-xs font-medium text-slate-500">Loading candidate applications...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No applications found"
              description={searchQuery || statusFilter !== 'all' ? 'Try adjusting your search query or status filter.' : 'No candidates have submitted applications yet.'}
              icon={FileText}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Applied Job &amp; Company</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredApps.map((app) => {
                  const s = (app.status || 'applied').toLowerCase();
                  const cfg = STATUS_CONFIG[s] || { label: app.status || 'Applied', tone: 'neutral' as PillTone };
                  const isUpdating = actionLoading === app.id;
                  const resumeLink = app.resumeUrl || app.resume;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Candidate Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 uppercase">
                            {(app.seekerName || 'C')[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{app.seekerName || 'Anonymous Candidate'}</p>
                            <p className="text-[11px] text-slate-500">{app.seekerEmail || 'No email provided'}</p>
                            {app.seekerPhone && (
                              <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5 font-mono">
                                <Phone size={10} className="text-slate-400" />
                                <span>{app.seekerPhone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Job & Company Column */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Briefcase size={12} className="text-indigo-500 shrink-0" />
                            {app.jobId ? (
                              <Link
                                href={`/jobs/${app.jobId}`}
                                target="_blank"
                                className="hover:text-blue-600 hover:underline transition-colors"
                              >
                                {app.jobTitle || 'Job Posting'}
                              </Link>
                            ) : (
                              <span>{app.jobTitle || 'Job Posting'}</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Building2 size={11} className="text-slate-400 shrink-0" />
                            <span>{app.companyName || 'Verified Employer'}</span>
                          </p>
                        </div>
                      </td>

                      {/* Date Column */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {formatDate(app.createdAt)}
                      </td>

                      {/* Status Dropdown Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Pill tone={cfg.tone}>{cfg.label}</Pill>
                          <select
                            value={s}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            className="text-[11px] font-bold py-1 px-2 border border-slate-200 rounded-lg bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                          >
                            <option value="applied">Applied</option>
                            <option value="shortlisted">Shortlist</option>
                            <option value="interview_scheduled">Interview</option>
                            <option value="selected">Hired / Selected</option>
                            <option value="rejected">Reject</option>
                          </select>
                          {isUpdating && <Loader2 size={13} className="animate-spin text-blue-600" />}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {resumeLink && (
                            <a
                              href={safeExternalUrl(resumeLink)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                              title="Download / View Resume"
                            >
                              <Download size={14} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>View Dossier</span>
                          </button>
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

      {/* Candidate Dossier Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shrink-0 uppercase shadow-sm">
                  {(selectedApp.seekerName || 'C')[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedApp.seekerName || 'Anonymous Candidate'}</h3>
                  <p className="text-xs text-slate-500">Applicant ID: {selectedApp.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Job Application Specifics */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Applied Position</span>
                <span className="font-bold text-slate-900">{selectedApp.jobTitle || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Target Company</span>
                <span className="font-bold text-slate-900">{selectedApp.companyName || 'Verified Employer'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Application Date</span>
                <span className="font-bold text-slate-900">{formatDate(selectedApp.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Current Pipeline Status</span>
                <Pill tone={(STATUS_CONFIG[(selectedApp.status || 'applied').toLowerCase()] || { tone: 'neutral' as PillTone }).tone}>
                  {(STATUS_CONFIG[(selectedApp.status || 'applied').toLowerCase()] || { label: selectedApp.status }).label}
                </Pill>
              </div>
            </div>

            {/* Contact Details */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400">Contact Information</h4>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail size={14} className="text-slate-400" />
                <a href={`mailto:${selectedApp.seekerEmail}`} className="hover:text-blue-600 hover:underline">
                  {selectedApp.seekerEmail || 'No email provided'}
                </a>
              </div>
              {selectedApp.seekerPhone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 font-mono">
                    <Phone size={14} className="text-slate-400" />
                    <span>{selectedApp.seekerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${selectedApp.seekerPhone}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                    >
                      Call
                    </a>
                    <a
                      href={`https://wa.me/91${selectedApp.seekerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${selectedApp.seekerName || ''}, regarding your application for ${selectedApp.jobTitle || 'the position'} on THENIJOBS...`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <MessageCircle size={12} />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Resume / Cover Letter */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400">Resume &amp; Cover Letter</h4>
              {(selectedApp.resumeUrl || selectedApp.resume) ? (
                <a
                  href={safeExternalUrl(selectedApp.resumeUrl || selectedApp.resume)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Download size={15} />
                  <span>Download / View Official Resume</span>
                </a>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-100">
                  No uploaded resume attachment found for this applicant.
                </p>
              )}

              {selectedApp.coverLetter && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600">Cover Letter / Note:</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                    {selectedApp.coverLetter}
                  </p>
                </div>
              )}
            </div>

            {/* Change Status Controls */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-700">Update Application Status:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { value: 'applied', label: 'Applied', color: 'border-blue-200 hover:bg-blue-50 text-blue-700' },
                  { value: 'shortlisted', label: 'Shortlist', color: 'border-purple-200 hover:bg-purple-50 text-purple-700' },
                  { value: 'interview_scheduled', label: 'Interview', color: 'border-amber-200 hover:bg-amber-50 text-amber-700' },
                  { value: 'selected', label: 'Hired', color: 'border-emerald-200 hover:bg-emerald-50 text-emerald-700' },
                  { value: 'rejected', label: 'Reject', color: 'border-red-200 hover:bg-red-50 text-red-700' },
                ].map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    disabled={actionLoading === selectedApp.id}
                    onClick={() => handleStatusChange(selectedApp.id, st.value)}
                    className={`py-2 px-2 rounded-xl border font-bold text-[11px] transition-all cursor-pointer ${
                      selectedApp.status === st.value
                        ? 'bg-slate-900 text-white border-slate-900'
                        : `bg-white ${st.color}`
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100">
              <Link
                href={`/admin/job-seekers?q=${encodeURIComponent(selectedApp.seekerEmail || selectedApp.seekerName || selectedApp.seekerId || '')}`}
                className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Users size={14} />
                <span>View Full Candidate Profile &amp; Portfolio</span>
              </Link>
              <Button variant="secondary" size="sm" onClick={() => setSelectedApp(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
