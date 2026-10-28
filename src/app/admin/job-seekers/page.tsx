'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Search, Download, ShieldCheck, Ban, Trash2,
  UserCheck, AlertCircle, Loader2, CheckCircle, XCircle,
  FileText, Phone, Mail, MapPin, ExternalLink, Briefcase,
  GraduationCap, Globe, Clock, Star, X, Check, Eye,
  Languages, Sparkles, Filter, RefreshCw, MessageCircle, CreditCard,
  Bell, Building2
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import SeekerIDCard from '@/components/id-card/SeekerIDCard';
import {
  ActionMenu, Button, Card, DataTable, EmptyState, PageHeader, PageShell,
  Pill, Stat, StatGrid, ViewToggle, useViewMode,
  type ActionItem, type Column, type PillTone,
} from '@/components/dashboard';
import { updateDocument, deleteDocument, createNotification } from '@/lib/firebase/firestoreService';
import { formatDate, toDate, type FirestoreTime } from '@/lib/firestoreTime';
import { safeExternalUrl } from '@/lib/safeUrl';
import { sanitizeWhatsAppPhone, THENI_TALUKS } from '@/lib/constants';

interface UserDoc {
  id: string;
  displayName?: string;
  name?: string;
  email?: string;
  role: string;
  district?: string;
  phone?: string;
  status?: string;
  isVerified?: boolean;
  createdAt?: FirestoreTime;
  updatedAt?: FirestoreTime;
  [key: string]: unknown;
}

interface SeekerProfileDoc {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  district?: string;
  state?: string;
  address?: string;
  bio?: string;
  headline?: string;
  currentRole?: string;
  designation?: string;
  skills?: string[];
  languages?: string[];
  resumeUrl?: string;
  resumes?: Array<{
    id: string;
    name: string;
    uploadDate?: string;
    size?: string;
    isDefault?: boolean;
    format?: string;
    url?: string;
    storagePath?: string;
  }>;
  isVerified?: boolean;
  isPortfolioPublic?: boolean;
  portfolioTemplate?: string;
  expectedSalary?: string;
  experienceYears?: string;
  highestDegree?: string;
  experience?: Array<{
    id?: string;
    company?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
  }>;
  education?: Array<{
    id?: string;
    institution?: string;
    degree?: string;
    field?: string;
    year?: string;
  }>;
  createdAt?: FirestoreTime;
  updatedAt?: FirestoreTime;
  [key: string]: unknown;
}

interface MergedCandidate {
  id: string; // seeker UID
  name: string;
  email: string;
  phone: string;
  district: string;
  isVerified: boolean;
  status: string;
  resumeUrl?: string;
  resumes?: SeekerProfileDoc['resumes'];
  skills: string[];
  currentRole: string;
  isPortfolioPublic: boolean;
  hasProfileDoc: boolean;
  alerts?: any[];
  alertCount?: number;
  employerApplication?: {
    status?: string;
    companyId?: string;
    companyName?: string;
    submittedAt?: string;
  };
  createdAt?: FirestoreTime;
  profileDoc?: SeekerProfileDoc;
  userDoc?: UserDoc;
}

const DISTRICT_OPTIONS = [
  'All Districts',
  'Theni',
  'Periyakulam',
  'Cumbum',
  'Chinnamanur',
  'Bodinayakanur',
  'Andipatti',
  'Uthamapalayam',
  'Madurai',
  'Dindigul',
  'Chennai',
];

export default function AdminJobSeekersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [view, setView] = useViewMode('admin-job-seekers', 'table');

  // 1. Fetch live collections
  const { data: users, loading: usersLoading, refresh: refreshUsers } = useCollection<UserDoc>('users');
  const { data: seekerProfiles, loading: profilesLoading, refresh: refreshProfiles } = useCollection<SeekerProfileDoc>('seekerProfiles');
  const { data: jobAlerts, loading: alertsLoading, refresh: refreshAlerts } = useCollection<any>('jobAlerts');

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [resumeFilter, setResumeFilter] = useState<'all' | 'has_resume' | 'no_resume'>('all');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [selectedCandidate, setSelectedCandidate] = useState<MergedCandidate | null>(null);
  const [viewingIdCard, setViewingIdCard] = useState<MergedCandidate | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Synchronize query from admin quick search or /admin/users parameter
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setSearchQuery(q);
  }, []);

  // 2. Correlate Users, SeekerProfiles and Job Alerts
  const candidates: MergedCandidate[] = useMemo(() => {
    // Map seekerProfiles by document ID (user UID)
    const profileMap = new Map<string, SeekerProfileDoc>();
    seekerProfiles.forEach((p) => {
      profileMap.set(p.id, p);
    });

    // Map jobAlerts by userId
    const alertsMap = new Map<string, any[]>();
    jobAlerts.forEach((a) => {
      if (a.userId) {
        const list = alertsMap.get(a.userId) || [];
        list.push(a);
        alertsMap.set(a.userId, list);
      }
    });

    // Extract all users who have role == 'job_seeker'
    const seekerUsers = users.filter((u) => u.role === 'job_seeker');
    const processedUids = new Set<string>();

    const merged: MergedCandidate[] = [];

    // Process from users collection
    seekerUsers.forEach((u) => {
      processedUids.add(u.id);
      const prof = profileMap.get(u.id);
      const name = prof?.name || u.displayName || u.name || 'Job Seeker';
      const email = prof?.email || u.email || 'N/A';
      const phone = prof?.phone || u.phone || '';
      const district = prof?.district || u.district || 'Theni';
      const isVerified = Boolean(prof?.isVerified || u.isVerified);
      const status = u.status || 'active';
      const resumesList = Array.isArray(prof?.resumes) ? prof.resumes : [];
      const defaultResumeObj = resumesList.find((r) => r?.isDefault) || resumesList[0];
      const resumeUrl = prof?.resumeUrl || defaultResumeObj?.url || undefined;
      const skills = prof?.skills || [];
      const currentRole = prof?.currentRole || prof?.designation || prof?.headline || '';
      const isPortfolioPublic = Boolean(prof?.isPortfolioPublic);
      const candidateAlerts = alertsMap.get(u.id) || [];
      const employerApplication = (u as any).employerApplication;

      merged.push({
        id: u.id,
        name,
        email,
        phone,
        district,
        isVerified,
        status,
        resumeUrl,
        resumes: resumesList,
        skills,
        currentRole,
        isPortfolioPublic,
        hasProfileDoc: Boolean(prof),
        alerts: candidateAlerts,
        alertCount: candidateAlerts.length,
        employerApplication,
        createdAt: u.createdAt || prof?.createdAt,
        profileDoc: prof,
        userDoc: u,
      });
    });

    // Also include any seekerProfiles that exist without a users doc (edge case)
    seekerProfiles.forEach((prof) => {
      if (!processedUids.has(prof.id)) {
        const candidateAlerts = alertsMap.get(prof.id) || [];
        merged.push({
          id: prof.id,
          name: prof.name || 'Job Seeker',
          email: prof.email || 'N/A',
          phone: prof.phone || '',
          district: prof.district || 'Theni',
          isVerified: Boolean(prof.isVerified),
          status: 'active',
          resumeUrl: prof.resumeUrl || (Array.isArray(prof.resumes) ? (prof.resumes.find((r) => r?.isDefault)?.url || prof.resumes[0]?.url) : undefined),
          resumes: Array.isArray(prof.resumes) ? prof.resumes : [],
          skills: prof.skills || [],
          currentRole: prof.currentRole || prof.designation || prof.headline || '',
          isPortfolioPublic: Boolean(prof.isPortfolioPublic),
          hasProfileDoc: true,
          alerts: candidateAlerts,
          alertCount: candidateAlerts.length,
          createdAt: prof.createdAt,
          profileDoc: prof,
        });
      }
    });

    return merged;
  }, [users, seekerProfiles, jobAlerts]);

  // Auto-open candidate dossier if URL ?q= matches UID or exact email
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q && candidates.length > 0 && !selectedCandidate) {
      const trimmedQ = q.trim().toLowerCase();
      const match = candidates.find(
        (c) =>
          c.id === q ||
          c.email.toLowerCase() === trimmedQ ||
          (c.phone && q.length >= 10 && c.phone.replace(/\D/g, '').endsWith(q.replace(/\D/g, '')))
      );
      if (match) {
        setSelectedCandidate(match);
      }
    }
  }, [candidates, selectedCandidate]);

  // 3. KPI Statistics
  const stats = useMemo(() => {
    let verifiedCount = 0;
    let pendingCount = 0;
    let withResumeCount = 0;
    let publicPortfolioCount = 0;

    candidates.forEach((c) => {
      if (c.isVerified) verifiedCount++;
      else pendingCount++;

      if (c.resumeUrl) withResumeCount++;
      if (c.isPortfolioPublic) publicPortfolioCount++;
    });

    return {
      total: candidates.length,
      verified: verifiedCount,
      pending: pendingCount,
      withResume: withResumeCount,
      publicPortfolio: publicPortfolioCount,
    };
  }, [candidates]);

  // 4. Filtering
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.currentRole.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q)) ||
        c.district.toLowerCase().includes(q);

      const matchVerification =
        verificationFilter === 'all' ||
        (verificationFilter === 'verified' && c.isVerified) ||
        (verificationFilter === 'pending' && !c.isVerified);

      const matchResume =
        resumeFilter === 'all' ||
        (resumeFilter === 'has_resume' && Boolean(c.resumeUrl)) ||
        (resumeFilter === 'no_resume' && !c.resumeUrl);

      const matchDistrict =
        districtFilter === 'All Districts' ||
        c.district.toLowerCase() === districtFilter.toLowerCase();

      return matchSearch && matchVerification && matchResume && matchDistrict;
    });
  }, [candidates, searchQuery, verificationFilter, resumeFilter, districtFilter]);

  // 5. Verification Actions
  const handleVerifyCandidate = async (candidate: MergedCandidate) => {
    setActionLoading(candidate.id);
    try {
      // 1. Update users document
      await updateDocument('users', candidate.id, {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: currentUser?.uid || 'admin',
      });

      // 2. Update seekerProfiles document if it exists
      if (candidate.hasProfileDoc) {
        await updateDocument('seekerProfiles', candidate.id, {
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: currentUser?.uid || 'admin',
        });
      }

      // 3. Send friendly notification
      await createNotification({
        userId: candidate.id,
        type: 'verification',
        title: 'Candidate Profile Verified! 🌟',
        message: 'Your THENIJOBS candidate profile has been officially verified by administrators.',
        actionUrl: '/seeker/profile',
      });

      toast.success(`Candidate ${candidate.name} verified successfully.`);
      if (selectedCandidate?.id === candidate.id) {
        setSelectedCandidate({ ...selectedCandidate, isVerified: true });
      }
      refreshUsers();
      refreshProfiles();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to verify candidate: ' + (err?.message || 'Error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeVerification = async (candidate: MergedCandidate) => {
    setActionLoading(candidate.id);
    try {
      await updateDocument('users', candidate.id, { isVerified: false });
      if (candidate.hasProfileDoc) {
        await updateDocument('seekerProfiles', candidate.id, { isVerified: false });
      }
      toast.success(`Verification revoked for ${candidate.name}.`);
      if (selectedCandidate?.id === candidate.id) {
        setSelectedCandidate({ ...selectedCandidate, isVerified: false });
      }
      refreshUsers();
      refreshProfiles();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to revoke verification: ' + (err?.message || 'Error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSuspend = async (candidate: MergedCandidate) => {
    const newStatus = candidate.status === 'suspended' ? 'active' : 'suspended';
    setActionLoading(candidate.id);
    try {
      await updateDocument('users', candidate.id, { status: newStatus });
      toast.success(`Account ${newStatus === 'active' ? 'reactivated' : 'suspended'}.`);
      if (selectedCandidate?.id === candidate.id) {
        setSelectedCandidate({ ...selectedCandidate, status: newStatus });
      }
      refreshUsers();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update account status.');
    } finally {
      setActionLoading(null);
    }
  };

  // 6. CSV Export
  const handleExportCSV = () => {
    if (filteredCandidates.length === 0) {
      toast.error('No candidates to export.');
      return;
    }

    const headers = [
      'Candidate ID',
      'Name',
      'Email',
      'Phone',
      'District',
      'Current Role',
      'Skills',
      'Verified',
      'Has Resume',
      'Resume URL',
      'Portfolio Public',
    ];

    const rows = filteredCandidates.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.email.replace(/"/g, '""')}"`,
      `"${c.phone.replace(/"/g, '""')}"`,
      `"${c.district.replace(/"/g, '""')}"`,
      `"${c.currentRole.replace(/"/g, '""')}"`,
      `"${c.skills.join(', ').replace(/"/g, '""')}"`,
      c.isVerified ? 'YES' : 'NO',
      c.resumeUrl ? 'YES' : 'NO',
      `"${c.resumeUrl || ''}"`,
      c.isPortfolioPublic ? 'YES' : 'NO',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `thenijobs-job-seekers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Job Seekers CSV exported successfully');
  };

  // 7. Table Columns
  const candidateColumns: Column<MergedCandidate>[] = [
    {
      key: 'name',
      header: 'Candidate',
      card: 'title',
      sortValue: (c) => c.name,
      render: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-[#EFF6FF] text-sm font-bold text-[#1E40AF]">
            {c.name[0]?.toUpperCase() || 'S'}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 flex-wrap">
              <span className="block truncate font-semibold text-slate-900">{c.name}</span>
              {c.isVerified && (
                <Pill tone="success">
                  <CheckCircle size={10} aria-hidden /> Verified
                </Pill>
              )}
            </span>
            <span className="block truncate text-xs text-slate-500 font-medium">{c.currentRole || c.email}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact',
      sortValue: (c) => c.phone,
      render: (c) => (
        <div className="text-xs space-y-0.5">
          <p className="font-semibold text-slate-800 flex items-center gap-1">
            <Phone size={11} className="text-slate-400" /> {c.phone || 'No phone'}
          </p>
          <p className="text-slate-500 truncate max-w-[160px]">{c.email}</p>
        </div>
      ),
    },
    {
      key: 'district',
      header: 'District / Taluk',
      hideBelow: 'md',
      sortValue: (c) => c.district,
      render: (c) => (
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
          <MapPin size={12} className="text-slate-400 shrink-0" /> {c.district}
        </span>
      ),
    },
    {
      key: 'skills',
      header: 'Top Skills',
      hideBelow: 'lg',
      render: (c) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {c.skills.length > 0 ? (
            c.skills.slice(0, 3).map((s, idx) => (
              <span key={idx} className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                {s}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">None listed</span>
          )}
          {c.skills.length > 3 && (
            <span className="text-[10px] text-slate-400 font-bold self-center">+{c.skills.length - 3}</span>
          )}
        </div>
      ),
    },
    {
      key: 'resumeUrl',
      header: 'Resume',
      align: 'center',
      render: (c) =>
        c.resumeUrl ? (
          <a
            href={safeExternalUrl(c.resumeUrl)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <FileText size={12} /> PDF
          </a>
        ) : (
          <span className="text-xs text-slate-400 font-medium">None</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (c) =>
        c.status === 'suspended' ? (
          <Pill tone="danger">Suspended</Pill>
        ) : c.isVerified ? (
          <Pill tone="success">Verified</Pill>
        ) : (
          <Pill tone="warning">Pending</Pill>
        ),
    },
  ];

  const loading = usersLoading || profilesLoading;

  return (
    <PageShell>
      <PageHeader
        title="Job Seeker Profiles & Resumes"
        description="Comprehensive candidate directory, resume access, and official verification management."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download size={14} aria-hidden /> Export CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { refreshUsers(); refreshProfiles(); }}>
              <RefreshCw size={14} aria-hidden /> Refresh
            </Button>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <StatGrid>
        <Stat label="Total Job Seekers" value={stats.total} icon={Users} tone="slate" />
        <Stat label="Verified Candidates" value={stats.verified} icon={ShieldCheck} tone="emerald" />
        <Stat label="Pending Verification" value={stats.pending} icon={Clock} tone="amber" />
        <Stat label="With Uploaded Resume" value={stats.withResume} icon={FileText} tone="blue" />
        <Stat label="Public Portfolios" value={stats.publicPortfolio} icon={Globe} tone="violet" />
      </StatGrid>

      {/* Search & Filter Toolbar */}
      <Card>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              aria-label="Search candidates by name, email, phone, or skills"
              placeholder="Search candidate name, email, phone, skills, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified Only</option>
              <option value="pending">Pending Verification</option>
            </select>

            <select
              value={resumeFilter}
              onChange={(e) => setResumeFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Resumes</option>
              <option value="has_resume">With Resume PDF</option>
              <option value="no_resume">Without Resume</option>
            </select>

            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              {DISTRICT_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <ViewToggle value={view} onChange={setView} />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          label="Job Seekers directory"
          loading={loading}
          view={view}
          gridColumns={3}
          columns={candidateColumns}
          rows={filteredCandidates}
          getRowId={(c) => c.id}
          emptyIcon={Users}
          emptyTitle="No job seekers match this filter"
          emptyDescription="Adjust search keywords or clear filters to view candidates."
          rowActions={(c) => {
            if (actionLoading === c.id) {
              return <Loader2 size={16} className="animate-spin text-blue-600" aria-label="Saving" />;
            }

            const items: ActionItem[] = [
              { label: 'View Candidate Dossier', icon: Eye, onClick: () => setSelectedCandidate(c) },
            ];

            if (c.resumeUrl) {
              items.push({
                label: 'View Resume PDF',
                icon: FileText,
                onClick: () => window.open(safeExternalUrl(c.resumeUrl), '_blank'),
              });
            }

            if (c.isPortfolioPublic) {
              items.push({
                label: 'Public Portfolio',
                icon: Globe,
                onClick: () => window.open(`/portfolio/seeker/${c.id}`, '_blank'),
              });
            }

            items.push({
              label: 'View Digital Candidate Pass',
              icon: CreditCard,
              onClick: () => setViewingIdCard(c),
            });

            if (!c.isVerified) {
              items.push({
                label: 'Verify candidate',
                icon: ShieldCheck,
                tone: 'success',
                separatorBefore: true,
                onClick: () => handleVerifyCandidate(c),
              });
            } else {
              items.push({
                label: 'Revoke verification',
                icon: XCircle,
                tone: 'danger',
                separatorBefore: true,
                onClick: () => handleRevokeVerification(c),
              });
            }

            items.push({
              label: c.status === 'suspended' ? 'Reactivate account' : 'Suspend account',
              icon: Ban,
              separatorBefore: true,
              onClick: () => handleToggleSuspend(c),
            });

            return <ActionMenu label={`Actions for ${c.name}`} items={items} />;
          }}
        />
      </Card>

      {/* Candidate Dossier Modal */}
      {selectedCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs font-outfit"
          onClick={() => setSelectedCandidate(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-gray-200 space-y-5 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-700 font-black text-xl flex items-center justify-center border border-blue-200">
                  {selectedCandidate.name[0]?.toUpperCase() || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">{selectedCandidate.name}</h2>
                    {selectedCandidate.isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <CheckCircle size={12} className="text-emerald-600" aria-hidden /> Verified Candidate
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                        <Clock size={12} className="text-amber-600" aria-hidden /> Pending Verification
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {selectedCandidate.currentRole || 'Job Seeker'} • {selectedCandidate.district}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-slate-500 hover:text-gray-600 transition-colors cursor-pointer"
                aria-label="Close dossier"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Contact & Links Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {selectedCandidate.phone ? (
                <a
                  href={`tel:${selectedCandidate.phone.replace(/[^0-9+]/g, '')}`}
                  className="py-2.5 px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-indigo-200"
                >
                  <Phone size={13} /> Call
                </a>
              ) : (
                <span className="py-2.5 px-3 rounded-2xl bg-gray-50 text-slate-400 text-xs font-medium text-center border border-gray-200">
                  No Phone
                </span>
              )}

              {selectedCandidate.phone ? (
                <a
                  href={`https://wa.me/${sanitizeWhatsAppPhone(selectedCandidate.phone)}?text=${encodeURIComponent(`Hello ${selectedCandidate.name}, this is THENIJOBS administration regarding your verified candidate profile.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle size={13} /> WhatsApp
                </a>
              ) : (
                <span className="py-2.5 px-3 rounded-2xl bg-gray-50 text-slate-400 text-xs font-medium text-center border border-gray-200">
                  No WhatsApp
                </span>
              )}

              {selectedCandidate.resumeUrl ? (
                <a
                  href={safeExternalUrl(selectedCandidate.resumeUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <FileText size={13} /> Resume PDF
                </a>
              ) : (
                <span className="py-2.5 px-3 rounded-2xl bg-gray-50 text-slate-400 text-xs font-medium text-center border border-gray-200">
                  No Resume
                </span>
              )}

              <Link
                href={`/portfolio/seeker/${selectedCandidate.id}`}
                target="_blank"
                className="py-2.5 px-3 rounded-2xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-violet-200"
              >
                <Globe size={13} /> Portfolio
              </Link>

              <button
                type="button"
                onClick={() => setViewingIdCard(selectedCandidate)}
                className="py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-emerald-200 cursor-pointer"
              >
                <CreditCard size={13} /> Digital Pass
              </button>
            </div>

            {/* Candidate Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-700">
              <p><span className="text-gray-500 font-medium">Email:</span> <strong className="text-gray-900 font-bold block sm:inline sm:ml-1 truncate">{selectedCandidate.email}</strong></p>
              <p><span className="text-gray-500 font-medium">District / Taluk:</span> <strong className="text-gray-900 font-bold block sm:inline sm:ml-1">{selectedCandidate.district}</strong></p>
              <p><span className="text-gray-500 font-medium">Highest Education:</span> <strong className="text-gray-900 font-bold block sm:inline sm:ml-1">{selectedCandidate.profileDoc?.highestDegree || 'Graduate'}</strong></p>
              <p><span className="text-gray-500 font-medium">Experience:</span> <strong className="text-gray-900 font-bold block sm:inline sm:ml-1">{selectedCandidate.profileDoc?.experienceYears || 'Fresher'}</strong></p>
              <p><span className="text-gray-500 font-medium">Expected Salary:</span> <strong className="text-gray-900 font-bold block sm:inline sm:ml-1">{selectedCandidate.profileDoc?.expectedSalary || 'Negotiable'}</strong></p>
              <p><span className="text-gray-500 font-medium">Registered:</span> <strong className="text-gray-900 font-bold block sm:inline sm:ml-1">{formatDate(selectedCandidate.createdAt)}</strong></p>
            </div>

            {/* Uploaded Resumes Library */}
            {selectedCandidate.resumes && selectedCandidate.resumes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-600" />
                  Uploaded Resumes ({selectedCandidate.resumes.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCandidate.resumes.map((res, idx) => (
                    <div
                      key={res.id || idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{res.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {res.size || 'PDF'} • {res.uploadDate || 'Uploaded'}
                          {res.isDefault && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Default
                            </span>
                          )}
                        </p>
                      </div>
                      {res.url && (
                        <a
                          href={safeExternalUrl(res.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Download size={13} /> View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bio / Summary */}
            {selectedCandidate.profileDoc?.bio && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-800 block">Candidate Professional Bio:</span>
                <p className="text-xs leading-relaxed text-slate-600 bg-white p-3.5 rounded-2xl border border-slate-200">
                  {selectedCandidate.profileDoc.bio}
                </p>
              </div>
            )}

            {/* Skills & Competencies */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-gray-800 block">Skills & Competencies:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.skills.length > 0 ? (
                  selectedCandidate.skills.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No skills added yet.</span>
                )}
              </div>
            </div>

            {/* Work Experience History */}
            {selectedCandidate.profileDoc?.experience && selectedCandidate.profileDoc.experience.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-800 block">Work Experience History:</span>
                <div className="space-y-2">
                  {selectedCandidate.profileDoc.experience.map((exp, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-bold">{exp.role || 'Role'}</strong>
                        <span className="text-slate-500 text-[11px]">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                      </div>
                      <p className="text-slate-600 font-medium mt-0.5">{exp.company}</p>
                      {exp.description && <p className="text-slate-500 text-[11px] mt-1">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education History */}
            {selectedCandidate.profileDoc?.education && selectedCandidate.profileDoc.education.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-800 block">Education Qualifications:</span>
                <div className="space-y-2">
                  {selectedCandidate.profileDoc.education.map((edu, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-bold">{edu.degree || 'Degree'} {edu.field ? `in ${edu.field}` : ''}</strong>
                        <span className="text-slate-500 text-[11px]">{edu.year}</span>
                      </div>
                      <p className="text-slate-600 font-medium mt-0.5">{edu.institution}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Verification Action Footer */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-slate-500">
                UID: <code className="text-[11px] font-mono text-slate-700">{selectedCandidate.id}</code>
              </span>
              <div className="flex items-center gap-2">
                {!selectedCandidate.isVerified ? (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={actionLoading === selectedCandidate.id}
                    onClick={() => handleVerifyCandidate(selectedCandidate)}
                    className="bg-[#059669] hover:bg-[#047857]"
                  >
                    <ShieldCheck size={14} aria-hidden /> Verify Candidate
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={actionLoading === selectedCandidate.id}
                    onClick={() => handleRevokeVerification(selectedCandidate)}
                  >
                    <XCircle size={14} aria-hidden /> Revoke Verification
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedCandidate(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Digital ID Card Modal */}
      {viewingIdCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs font-outfit"
          onClick={() => setViewingIdCard(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-gray-200 space-y-4 animate-fade-in flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  Digital Candidate Pass &amp; ID Card
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Candidate ID Card with QR Verification &amp; Profile Details
                </p>
              </div>
              <button
                onClick={() => setViewingIdCard(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-slate-500 cursor-pointer"
                aria-label="Close pass"
              >
                <X size={18} />
              </button>
            </div>
            <SeekerIDCard
              seeker={{
                uid: viewingIdCard.id,
                name: viewingIdCard.name,
                phone: viewingIdCard.phone,
                email: viewingIdCard.email,
                district: viewingIdCard.district,
                state: (viewingIdCard.profileDoc?.state as string) || 'Tamil Nadu',
                address: (viewingIdCard.profileDoc?.address as string) || '',
                skills: viewingIdCard.skills,
                currentRole: viewingIdCard.currentRole,
                experience: (viewingIdCard.profileDoc?.experience as any) || [],
                education: (viewingIdCard.profileDoc?.education as any) || [],
              }}
            />
            <div className="w-full pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setViewingIdCard(null)}
              >
                Close Pass
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
