'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import Link from 'next/link';
import {
  Briefcase, Calendar, Eye, TrendingUp,
  ArrowUpRight, Clock, CheckCircle,
  XCircle, ChevronRight, Star,
  Plus, Send, FileText, Loader2, UserCheck, Building2, Crown,
  Globe, Phone, MessageSquare
} from 'lucide-react';
import { selectBestSubscription } from '@/lib/subscriptions';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useEmployerStats } from '@/hooks/useRealtimeStats';
import { updateApplicationStatus, updateDocument } from '@/lib/firebase/firestoreService';
import { where, limit, orderBy, Timestamp } from 'firebase/firestore';
import { getJobExpiryDate } from '@/lib/jobPolicy';

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch live stats
  const { stats, loading: statsLoading } = useEmployerStats(companyId);

  // 3. Fetch recent applications
  const { data: rawApplications, loading: appsLoading } = useCollection<any>('jobApplications', [
    where('employerId', '==', companyId || ''),
    orderBy('appliedDate', 'desc'),
    limit(50)
  ], { skip: !companyId });

  const applications = useMemo(() => {
    return rawApplications.map(app => ({
      ...app,
      seekerName: app.applicantData?.name || 'Job Seeker',
      seekerEmail: app.applicantData?.email || '',
      seekerPhone: app.applicantData?.phone || '',
      seekerGender: app.applicantData?.gender || 'Male',
      seekerDob: app.applicantData?.dob || '',
      photoUrl: app.applicantData?.photoUrl || '',
      district: app.applicantData?.district || '',
      location: app.applicantData?.district || '',
      currentRole: app.applicantData?.currentRole || '',
      education: app.qualificationData || [],
      experience: app.experience || [],
      skills: app.skills || [],
      portfolio: app.portfolioData?.portfolio || [],
      resumeUrl: app.portfolioData?.resumeUrl || '',
      resumeName: app.portfolioData?.resumeName || '',
      linkedin: app.portfolioData?.linkedin || '',
      website: app.portfolioData?.website || '',
      createdAt: app.appliedDate || app.createdAt
    }));
  }, [rawApplications]);

  // 4. Fetch all jobs for stats and active jobs list
  const { data: allCompanyJobs, loading: jobsLoading } = useCollection<any>('jobs', [
    where('companyId', '==', companyId || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !companyId });

  const activeJobs = useMemo(() => {
    return allCompanyJobs.filter(j => j.isActive && j.status !== 'expired').slice(0, 5);
  }, [allCompanyJobs]);

  // 5. Fetch upcoming interviews
  const { data: interviews, loading: interviewsLoading } = useCollection<any>('interviews', [
    where('companyId', '==', companyId || ''),
    limit(5)
  ], { skip: !companyId });

  // 6. Fetch pending applications for over-7-days alert
  const { data: pendingApplications, loading: pendingAppsLoading } = useCollection<any>('jobApplications', [
    where('employerId', '==', companyId || ''),
    where('status', 'in', ['applied', 'pending_review', 'resume_viewed', 'under_review'])
  ], { skip: !companyId });

  // 7. Fetch subscriptions for subscription card widget
  const { data: subscriptions } = useCollection<any>('subscriptions', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  const activeSub = selectBestSubscription(subscriptions);
  const planName = activeSub?.planName || company?.subscriptionPlan || 'Free Plan';
  let daysRemaining = -1;
  if (activeSub?.endDate) {
    const expiry = activeSub.endDate.toDate ? activeSub.endDate.toDate() : new Date(activeSub.endDate);
    const diff = expiry.getTime() - Date.now();
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const expiringSoonJobs = useMemo(() => {
    return allCompanyJobs.filter(j => {
      if (!j.isActive || j.status === 'expired') return false;
      if (!j.expiresAt) return false;
      const expiry = j.expiresAt.toDate ? j.expiresAt.toDate() : new Date(j.expiresAt);
      const diff = expiry.getTime() - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 && days <= 7;
    });
  }, [allCompanyJobs]);

  const expiredJobs = useMemo(() => {
    return allCompanyJobs.filter(j => {
      if (j.status === 'expired') return true;
      if (!j.expiresAt) return false;
      const expiry = j.expiresAt.toDate ? j.expiresAt.toDate() : new Date(j.expiresAt);
      return expiry.getTime() < Date.now();
    });
  }, [allCompanyJobs]);

  const pendingOver7DaysCount = useMemo(() => {
    if (!pendingApplications) return 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return pendingApplications.filter((app: any) => {
      const appDate = app.createdAt?.seconds 
        ? new Date(app.createdAt.seconds * 1000) 
        : app.createdAt?.toDate 
          ? app.createdAt.toDate() 
          : new Date(app.createdAt);
      return appDate < sevenDaysAgo;
    }).length;
  }, [pendingApplications]);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAppStatus = async (appId: string, status: string) => {
    setActionLoading(appId);
    try {
      await updateApplicationStatus(appId, status);
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenewJobDashboard = async (id: string) => {
    setActionLoading(id);
    try {
      const now = new Date();
      await updateDocument('jobs', id, {
        status: 'pending_renewal',
        isActive: false,
        postedAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(getJobExpiryDate(now)),
        renewalRequestedAt: Timestamp.fromDate(now),
        expiryReminderDaysSent: [],
      });
      alert('Renewal submitted for admin approval.');
    } catch (err) {
      console.error('Renew job error:', err);
      alert('Unable to submit renewal.');
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'C';
  };

  const statusColors: Record<string, string> = {
    applied: 'bg-cyan-500/10 text-cyan-400',
    shortlisted: 'bg-violet-500/10 text-violet-400',
    interview_scheduled: 'bg-amber-500/10 text-amber-400',
    selected: 'bg-emerald-500/10 text-emerald-400',
    rejected: 'bg-rose-500/10 text-rose-400',
    active: 'bg-emerald-500/10 text-emerald-400',
    paused: 'bg-amber-500/10 text-amber-400',
  };

  const colorMap: Record<string, { bg: string; text: string }> = {
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400' },
  };

  const statItems = [
    { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase, color: 'cyan' },
    { label: 'Total Applications', value: stats.totalApplications, icon: FileText, color: 'violet' },
    { label: 'Applied', value: stats.applied, icon: Clock, color: 'cyan' },
    { label: 'Under Review', value: stats.underReview, icon: Eye, color: 'violet' },
    { label: 'Shortlisted', value: stats.shortlisted, icon: UserCheck, color: 'emerald' },
    { label: 'Interview Scheduled', value: stats.interviewScheduled, icon: Calendar, color: 'amber' },
    { label: 'Selected', value: stats.hired, icon: Star, color: 'purple' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'rose' },
    { label: 'Joined', value: stats.joined, icon: CheckCircle, color: 'emerald' },
  ];

  const loading = companyLoading || statsLoading || appsLoading || jobsLoading || interviewsLoading || pendingAppsLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit">
        <Building2 size={48} className="text-gray-500 mb-4" />
        <h2 className="text-lg font-semibold text-white">No Company Registered</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to access the dashboard and post jobs.</p>
        <Link href="/employer/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:opacity-90">
          Create Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Employer Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">{company?.name || 'Recruitment Hub'} — manage your pipeline</p>
        </div>
        <Link
          href="/employer/post-job"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Post New Job
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {pendingOver7DaysCount > 0 && (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 animate-pulse-glow">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-300">Pending Applications Alert</p>
                <p className="text-xs text-gray-300 mt-0.5 font-medium">
                  You have <span className="text-amber-400 font-bold">{pendingOver7DaysCount}</span> applications pending for more than 7 days. Please review and update candidate status.
                </p>
              </div>
              <Link href="/employer/candidates" className="text-xs text-amber-400 font-bold hover:text-amber-300 whitespace-nowrap bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg transition-colors">
                Update Status →
              </Link>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4">
            {statItems.map((stat) => {
              const colors = colorMap[stat.color];
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass-card rounded-2xl p-4 hover:border-white/15 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <Icon size={18} className={colors.text} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-white">{(stat.value ?? 0).toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Business Analytics Dashboard */}
          <div className="glass-card rounded-2xl p-6 border border-white/[0.06] space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-cyan-400" /> Business Analytics Dashboard
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Track views, leads, and customer clicks for your company profile</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl hover:border-white/10 transition-all">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Eye size={16} className="text-violet-400" />
                  <span className="text-[11px] font-medium">Profile Views</span>
                </div>
                <p className="text-xl font-extrabold text-white">{(company?.visitCount || 0).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl hover:border-white/10 transition-all">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Globe size={16} className="text-cyan-400" />
                  <span className="text-[11px] font-medium">Website Visits</span>
                </div>
                <p className="text-xl font-extrabold text-white">{(company?.websiteVisits || 0).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl hover:border-white/10 transition-all">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <span className="text-[11px] font-medium">Leads Received</span>
                </div>
                <p className="text-xl font-extrabold text-white">{(company?.contactSubmitCount || 0).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl hover:border-white/10 transition-all">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Briefcase size={16} className="text-amber-400" />
                  <span className="text-[11px] font-medium">Job Applications</span>
                </div>
                <p className="text-xl font-extrabold text-white">{(stats.totalApplications || 0).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl hover:border-white/10 transition-all">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Phone size={16} className="text-blue-400" />
                  <span className="text-[11px] font-medium">Click-to-Call</span>
                </div>
                <p className="text-xl font-extrabold text-white">{(company?.callClickCount || 0).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl hover:border-white/10 transition-all">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <MessageSquare size={16} className="text-emerald-400" />
                  <span className="text-[11px] font-medium">WhatsApp Clicks</span>
                </div>
                <p className="text-xl font-extrabold text-white">{(company?.whatsappClickCount || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Expiry & Subscription Monitoring Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subscription Card Widget */}
            <div className="glass-card rounded-2xl p-5 border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Crown size={20} className="text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Subscription Status</h2>
                      <p className="text-[10px] text-gray-500">Your portal membership details</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    daysRemaining > 30 ? 'bg-emerald-500/10 text-emerald-400' :
                    daysRemaining > 0 ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>
                    {daysRemaining > 0 ? 'Active' : 'Expired'}
                  </span>
                </div>

                <div className="space-y-3 bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Current Plan</span>
                    <span className="font-bold text-white text-sm">{planName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Time Remaining</span>
                    <span className={`font-bold ${
                      daysRemaining > 30 ? 'text-emerald-400' :
                      daysRemaining > 5 ? 'text-amber-400' :
                      daysRemaining > 0 ? 'text-rose-400 font-extrabold animate-pulse' :
                      'text-rose-500'
                    }`}>
                      {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">End Date</span>
                    <span className="text-gray-300 font-medium">
                      {activeSub?.endDate ? (activeSub.endDate.toDate ? activeSub.endDate.toDate() : new Date(activeSub.endDate)).toLocaleDateString('en-IN') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href="/employer/subscription"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 py-2.5 text-xs font-semibold text-cyan-400 hover:from-violet-600/30 hover:to-cyan-600/30 transition-all"
                >
                  Manage Subscription <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {/* Job Expiry & Statistics Widget */}
            <div className="glass-card rounded-2xl p-5 border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <Clock size={20} className="text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Job Post Expiry Status</h2>
                      <p className="text-[10px] text-gray-500">Monitor and renew job listings</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                    <span className="block text-xs text-gray-500">Active</span>
                    <span className="text-base font-bold text-emerald-400">{allCompanyJobs.filter(j => j.isActive && j.status !== 'expired').length}</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl relative">
                    <span className="block text-xs text-gray-500">Expiring Soon</span>
                    <span className="text-base font-bold text-amber-400">{expiringSoonJobs.length}</span>
                    {expiringSoonJobs.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />}
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl relative">
                    <span className="block text-xs text-gray-500">Expired</span>
                    <span className="text-base font-bold text-rose-500">{expiredJobs.length}</span>
                    {expiredJobs.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />}
                  </div>
                </div>

                {/* Quick renewal list */}
                <div className="space-y-2 max-h-[120px] overflow-y-auto no-scrollbar">
                  {expiringSoonJobs.length === 0 && expiredJobs.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-500 bg-white/[0.01] rounded-xl border border-white/[0.02]">
                      All job postings are active and up-to-date.
                    </div>
                  ) : (
                    [...expiringSoonJobs, ...expiredJobs].slice(0, 2).map((job) => {
                      const isExpired = expiredJobs.some(j => j.id === job.id);
                      return (
                        <div key={job.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-xs font-semibold text-white truncate">{job.title}</p>
                            <p className="text-[10px] text-gray-500">
                              {isExpired ? 'Expired' : 'Expiring soon'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRenewJobDashboard(job.id)}
                            disabled={actionLoading === job.id}
                            className="px-2.5 py-1 text-[10px] font-bold bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-all flex items-center gap-1 shrink-0"
                          >
                            {actionLoading === job.id ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              'Renew'
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href="/employer/jobs"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-600/20 to-emerald-600/20 py-2.5 text-xs font-semibold text-cyan-400 hover:from-cyan-600/30 hover:to-emerald-600/30 transition-all"
                >
                  Manage Job Posts <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recent Applications */}
            <div className="xl:col-span-2">
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Send size={16} className="text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Recent Applications</h2>
                      <p className="text-[10px] text-gray-500">Latest candidate submissions</p>
                    </div>
                  </div>
                  <Link href="/employer/candidates" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                    View All →
                  </Link>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {applications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500">No applications received yet.</div>
                  ) : (
                    applications.map((app) => (
                      <div key={app.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{getInitials(app.seekerName)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">{app.seekerName || 'Candidate'}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusColors[app.status || 'applied']}`}>
                              {app.status || 'applied'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Applied to job · {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {actionLoading === app.id ? (
                            <Loader2 size={14} className="text-cyan-400 animate-spin" />
                          ) : (
                            <>
                              {app.status === 'applied' && (
                                <>
                                  <button
                                    onClick={() => handleAppStatus(app.id, 'shortlisted')}
                                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                    title="Shortlist"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleAppStatus(app.id, 'rejected')}
                                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </>
                              )}
                              <Link href={`/jobs/${app.jobId}`} className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] transition-colors" title="View Job">
                                <Eye size={14} />
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Interviews */}
            <div className="xl:col-span-1">
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Calendar size={16} className="text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Upcoming Interviews</h2>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {interviews.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500">No scheduled interviews.</div>
                  ) : (
                    interviews.map((interview) => (
                      <div key={interview.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-white">{interview.seekerName || 'Candidate'}</p>
                          <span className="text-[10px] text-amber-400 font-medium capitalize">{interview.mode || 'Phone'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                          <Clock size={12} />
                          <span>{interview.date} at {interview.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-5 py-3 border-t border-white/[0.06]">
                  <Link href="/employer/interviews" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
                    View all interviews <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Briefcase size={16} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Active Jobs</h2>
                  <p className="text-[10px] text-gray-500">Your current job postings</p>
                </div>
              </div>
              <Link href="/employer/jobs" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                Manage Jobs →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Job Title</th>
                    <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold hidden sm:table-cell">Type</th>
                    <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Applications</th>
                    <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold hidden md:table-cell">Views</th>
                    <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {activeJobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-xs text-gray-500">No active job listings.</td>
                    </tr>
                  ) : (
                    activeJobs.map((job) => {
                      const isExpanded = expandedJobId === job.id;
                      const jobApplicants = applications.filter((app: any) => app.jobId === job.id);
                      const conversionRate = job.viewCount > 0
                        ? `${Math.round(((job.applicationsCount || 0) / job.viewCount) * 100)}%`
                        : '0%';

                      return (
                        <Fragment key={job.id}>
                          <tr 
                            onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                            className={`cursor-pointer transition-colors border-l-2 hover:bg-white/[0.02] ${
                              isExpanded ? 'bg-white/[0.02] border-cyan-500' : 'border-transparent'
                            }`}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-white hover:text-cyan-400 transition-colors">{job.title}</p>
                                {job.isUrgent && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/10 text-rose-400 uppercase">Urgent</span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 mt-0.5">Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}</p>
                            </td>
                            <td className="px-3 py-3.5 hidden sm:table-cell">
                              <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 uppercase">{job.jobType || 'Full Time'}</span>
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              <span className="text-sm font-bold text-white">{job.applicationsCount || 0}</span>
                            </td>
                            <td className="px-3 py-3.5 text-center hidden md:table-cell">
                              <span className="text-sm text-gray-400">{job.viewCount || 0}</span>
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400">
                                Active
                              </span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-black/20">
                              <td colSpan={5} className="px-5 py-4 border-t border-white/[0.04] border-b border-white/[0.04]">
                                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 animate-fade-in text-left">
                                    <div className="bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-xl space-y-1">
                                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">📞 Calls</span>
                                      <p className="text-lg font-extrabold text-white">{job.callClickCount || 0}</p>
                                    </div>
                                    
                                    <div className="bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-xl space-y-1">
                                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">💬 WhatsApp</span>
                                      <p className="text-lg font-extrabold text-white">{job.whatsappClickCount || 0}</p>
                                    </div>

                                    <div className="bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-xl space-y-1">
                                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">✉️ Emails</span>
                                      <p className="text-lg font-extrabold text-white">{job.emailClickCount || 0}</p>
                                    </div>
                                    
                                    <div className="bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-xl space-y-1">
                                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1">👥 Applications</span>
                                      <p className="text-lg font-extrabold text-white">{job.applicationsCount || 0}</p>
                                    </div>

                                    <div className="bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-xl space-y-1">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Views</span>
                                      <p className="text-lg font-extrabold text-white">{job.viewCount || 0}</p>
                                    </div>
                                    
                                    <div className="bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-xl space-y-2">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block border-b border-white/5 pb-1">Recent Applicants</span>
                                      <div className="space-y-1.5 max-h-[80px] overflow-y-auto">
                                        {jobApplicants.length === 0 ? (
                                          <span className="text-[10px] text-gray-500 italic block">No applications yet.</span>
                                        ) : (
                                          jobApplicants.slice(0, 3).map((app: any) => (
                                            <div key={app.id} className="flex items-center justify-between gap-2 text-xs">
                                              <span className="text-white truncate font-medium">{app.seekerName}</span>
                                              <Link 
                                                href={`/employer/candidates?appId=${app.id}`}
                                                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold shrink-0 hover:underline"
                                              >
                                                View
                                              </Link>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recruitment Funnel */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Recruitment Funnel</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Total Applied', count: stats.totalApplications, color: 'cyan', pct: 100 },
                { label: 'Shortlisted', count: stats.shortlisted, color: 'violet', pct: stats.totalApplications > 0 ? Math.round((stats.shortlisted / stats.totalApplications) * 100) : 0 },
                { label: 'Interview Scheduled', count: stats.interviewScheduled, color: 'amber', pct: stats.totalApplications > 0 ? Math.round((stats.interviewScheduled / stats.totalApplications) * 100) : 0 },
                { label: 'Selected / Hired', count: stats.hired, color: 'emerald', pct: stats.totalApplications > 0 ? Math.round((stats.hired / stats.totalApplications) * 100) : 0 },
              ].map((stage) => {
                const colors = colorMap[stage.color];
                return (
                  <div key={stage.label} className="text-center">
                    <div className={`rounded-xl ${colors.bg} p-4 mb-2`}>
                      <p className={`text-2xl font-bold ${colors.text}`}>{stage.count}</p>
                    </div>
                    <p className="text-xs text-gray-400">{stage.label}</p>
                    <p className="text-[10px] text-gray-500">{stage.pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
