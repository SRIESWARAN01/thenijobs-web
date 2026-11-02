'use client';

import { useState } from 'react';
import {
  TrendingUp, Users, Building2, Briefcase,
  IndianRupee, Download, FileText, ArrowUpRight, MapPin, Award, Crown, Star, Loader2
} from 'lucide-react';
import { usePlatformStats } from '@/hooks/useRealtimeStats';
import { useCollection } from '@/hooks/useFirestore';
import { useToast } from '@/contexts/ToastContext';
import { Button, PageHeader, PageShell, Tabs } from '@/components/dashboard';

// ===== CONSTANTS =====
const TIME_PERIODS = ['7D', '1M', '3M', '6M', '1Y'] as const;

interface UserDoc {
  id: string;
  district?: string;
}

interface CompanyDoc {
  id: string;
  name: string;
  district?: string;
  category?: string;
  rating?: number;
  jobsCount?: number;
  applicationsCount?: number;
}

interface JobDoc {
  id: string;
  category?: string;
  companyName?: string;
  applicationsCount?: number;
}

export default function ReportsPage() {
  const toast = useToast();
  const [timePeriod, setTimePeriod] = useState<typeof TIME_PERIODS[number]>('1M');
  const [exporting, setExporting] = useState(false);
  const { stats, loading: statsLoading } = usePlatformStats();
  
  const { data: users, loading: usersLoading } = useCollection<UserDoc>('users');
  const { data: companies, loading: companiesLoading } = useCollection<CompanyDoc>('companies');
  const { data: jobs, loading: jobsLoading } = useCollection<JobDoc>('jobs');

  // 1. Calculate Top Districts dynamically
  const districtCounts: Record<string, { users: number; businesses: number; jobs: number }> = {};
  users.forEach((u) => {
    const dist = u.district || 'Theni';
    if (!districtCounts[dist]) districtCounts[dist] = { users: 0, businesses: 0, jobs: 0 };
    districtCounts[dist].users += 1;
  });
  companies.forEach((c) => {
    const dist = c.district || 'Theni';
    if (!districtCounts[dist]) districtCounts[dist] = { users: 0, businesses: 0, jobs: 0 };
    districtCounts[dist].businesses += 1;
  });

  const topDistricts = Object.entries(districtCounts)
    .map(([name, counts]) => ({
      name,
      ...counts,
      total: counts.users + counts.businesses,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const maxDistrictTotal = Math.max(...topDistricts.map((d) => d.total), 1);
  const formattedDistricts = topDistricts.map((d) => ({
    ...d,
    pct: Math.round((d.total / maxDistrictTotal) * 100),
  }));

  // 2. Calculate Top Categories dynamically from jobs
  const categoryCounts: Record<string, number> = {};
  jobs.forEach((j) => {
    const cat = j.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const topCategories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxCategoryCount = Math.max(...topCategories.map((c) => c.count), 1);
  const formattedCategories = topCategories.map((c) => ({
    ...c,
    pct: Math.round((c.count / maxCategoryCount) * 100),
  }));

  // 3. Calculate Top Employers dynamically from companies
  const formattedEmployers = companies
    .map((c) => {
      const employerJobs = jobs.filter((j) => j.companyName === c.name).length;
      const employerApps = jobs
        .filter((j) => j.companyName === c.name)
        .reduce((sum, j) => sum + (j.applicationsCount || 0), 0);

      return {
        name: c.name,
        jobs: employerJobs,
        applications: employerApps,
        rating: c.rating || 0,
      };
    })
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 5);

  const loading = statsLoading || usersLoading || companiesLoading || jobsLoading;

  const chartCards = [
    { title: 'User Base', description: 'Total registered users on platform', icon: Users, color: 'violet', value: stats.totalUsers.toLocaleString(), trend: 'Live' },
    { title: 'Business Base', description: 'Total verified company listings', icon: Building2, color: 'cyan', value: stats.totalBusinesses.toLocaleString(), trend: 'Live' },
    { title: 'Active Listings', value: stats.activeJobs.toLocaleString(), description: 'Active recruitment campaigns', icon: Briefcase, color: 'emerald', trend: 'Live' },
    { title: 'Platform Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, description: 'Real-time subscription collections', icon: IndianRupee, color: 'amber', trend: 'Live' },
    { title: 'Business Leads', value: stats.totalLeads.toLocaleString(), description: 'Total enquiries and customer leads', icon: TrendingUp, color: 'rose', trend: 'Live' },
  ];

  const colorMap: Record<string, { bg: string; text: string; chartBg: string }> = {
    violet: { bg: 'bg-violet-500/15', text: 'text-violet-600', chartBg: 'from-violet-500/20 to-violet-500/5' },
    cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-600', chartBg: 'from-cyan-500/20 to-cyan-500/5' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-600', chartBg: 'from-emerald-500/20 to-emerald-500/5' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-600', chartBg: 'from-amber-500/20 to-amber-500/5' },
    rose: { bg: 'bg-rose-500/15', text: 'text-rose-600', chartBg: 'from-rose-500/20 to-rose-500/5' },
  };

  const handleExportCSV = () => {
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const csvLines: string[] = [];

      csvLines.push('THENIJOBS — Platform Analytics & Executive Report');
      csvLines.push(`Generated Date,${new Date().toLocaleDateString('en-IN')}`);
      csvLines.push(`Reporting Period,${timePeriod}`);
      csvLines.push('');

      csvLines.push('1. EXECUTIVE METRICS');
      csvLines.push('Metric,Value,Description');
      csvLines.push(`Total Registered Users,${stats.totalUsers},"Job Seekers, Recruiters, and Admins"`);
      csvLines.push(`Total Verified Businesses,${stats.totalBusinesses},"Verified local enterprises and shops"`);
      csvLines.push(`Active Job Openings,${stats.activeJobs},"Current verified recruitment postings"`);
      csvLines.push(`Total Subscription Revenue,₹${stats.totalRevenue},"Net collected subscription revenue"`);
      csvLines.push(`Customer Leads Generated,${stats.totalLeads},"Inbound WhatsApp & Marketplace customer enquiries"`);
      csvLines.push('');

      csvLines.push('2. TOP TALUKS & DISTRICTS');
      csvLines.push('Rank,Taluk / District,Users,Businesses,Total Engagement');
      formattedDistricts.forEach((d, idx) => {
        csvLines.push(`${idx + 1},"${d.name}",${d.users},${d.businesses},${d.total}`);
      });
      csvLines.push('');

      csvLines.push('3. TOP HIRING CATEGORIES');
      csvLines.push('Rank,Category,Active Jobs');
      formattedCategories.forEach((c, idx) => {
        csvLines.push(`${idx + 1},"${c.name}",${c.count}`);
      });
      csvLines.push('');

      csvLines.push('4. TOP EMPLOYERS');
      csvLines.push('Rank,Company Name,Jobs Posted,Applications Received,Rating');
      formattedEmployers.forEach((e, idx) => {
        csvLines.push(`${idx + 1},"${e.name}",${e.jobs},${e.applications},${e.rating}`);
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvLines.join('\n'));
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', `thenijobs-analytics-report-${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Analytics CSV report downloaded successfully');
    } catch (err: any) {
      toast.error('Failed to export CSV: ' + (err?.message || 'Error'));
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      // Title & Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(15, 23, 42);
      pdf.text('THENIJOBS — Platform Performance Report', 14, 20);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Official Executive Analytics | Period: ${timePeriod} | Generated: ${dateStr}`, 14, 26);

      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, 30, 196, 30);

      // Section 1: Executive KPI Cards
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(30, 41, 59);
      pdf.text('1. Executive Summary', 14, 38);

      const kpiItems = [
        { label: 'Total Users', val: stats.totalUsers.toLocaleString() },
        { label: 'Total Businesses', val: stats.totalBusinesses.toLocaleString() },
        { label: 'Active Jobs', val: stats.activeJobs.toLocaleString() },
        { label: 'Revenue', val: `₹${stats.totalRevenue.toLocaleString('en-IN')}` },
        { label: 'Leads Generated', val: stats.totalLeads.toLocaleString() },
      ];

      kpiItems.forEach((item, i) => {
        const x = 14 + (i * 36);
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(x, 43, 34, 18, 2, 2, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(x, 43, 34, 18, 2, 2, 'S');

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139);
        pdf.text(item.label, x + 2, 48);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(15, 23, 42);
        pdf.text(item.val, x + 2, 56);
      });

      // Section 2: Top Districts
      let currentY = 72;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(30, 41, 59);
      pdf.text('2. Regional Demographics & Taluk Distribution', 14, currentY);

      currentY += 6;
      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, currentY, 182, 7, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Rank', 16, currentY + 5);
      pdf.text('Taluk / Region', 32, currentY + 5);
      pdf.text('Users', 90, currentY + 5);
      pdf.text('Businesses', 130, currentY + 5);
      pdf.text('Total Engagement', 160, currentY + 5);

      currentY += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(30, 41, 59);
      formattedDistricts.forEach((d, idx) => {
        pdf.text(String(idx + 1), 16, currentY);
        pdf.text(d.name, 32, currentY);
        pdf.text(String(d.users), 90, currentY);
        pdf.text(String(d.businesses), 130, currentY);
        pdf.text(String(d.total), 160, currentY);
        currentY += 6;
      });

      // Section 3: Top Categories
      currentY += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(30, 41, 59);
      pdf.text('3. Top Hiring Industry Categories', 14, currentY);

      currentY += 6;
      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, currentY, 182, 7, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Rank', 16, currentY + 5);
      pdf.text('Industry Category', 32, currentY + 5);
      pdf.text('Active Vacancies', 140, currentY + 5);

      currentY += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(30, 41, 59);
      formattedCategories.forEach((c, idx) => {
        pdf.text(String(idx + 1), 16, currentY);
        pdf.text(c.name, 32, currentY);
        pdf.text(String(c.count), 140, currentY);
        currentY += 6;
      });

      // Section 4: Top Employers
      currentY += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(30, 41, 59);
      pdf.text('4. Top Recruiting Companies', 14, currentY);

      currentY += 6;
      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, currentY, 182, 7, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Rank', 16, currentY + 5);
      pdf.text('Employer Name', 32, currentY + 5);
      pdf.text('Jobs', 110, currentY + 5);
      pdf.text('Applications', 140, currentY + 5);
      pdf.text('Rating', 175, currentY + 5);

      currentY += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(30, 41, 59);
      formattedEmployers.forEach((e, idx) => {
        pdf.text(String(idx + 1), 16, currentY);
        pdf.text(e.name, 32, currentY);
        pdf.text(String(e.jobs), 110, currentY);
        pdf.text(String(e.applications), 140, currentY);
        pdf.text(`${e.rating} / 5.0`, 175, currentY);
        currentY += 6;
      });

      // Footer
      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, 280, 196, 280);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text('THENIJOBS — Official Platform Supervision & Governance Report | Confidential & Proprietary', 105, 285, { align: 'center' });

      pdf.save(`thenijobs-platform-analytics-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Analytics PDF report generated successfully');
    } catch (err: any) {
      toast.error('Failed to export PDF: ' + (err?.message || 'Error'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Analytics & reports"
        description="Platform insights and performance metrics."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Reports' }]}
        actions={
          <>
            <Button variant="secondary" onClick={handleExportCSV}>
              <Download size={15} /> CSV
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} disabled={exporting}>
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} PDF
            </Button>
          </>
        }
      />

      {/* The inactive time-period button was `hover:bg-slate-100 hover:text-slate-900`
          — white text on a white fill, so the label vanished on hover. */}
      <Tabs
        label="Reporting period"
        value={timePeriod}
        onChange={(id) => setTimePeriod(id as typeof timePeriod)}
        tabs={TIME_PERIODS.map(period => ({ id: period, label: period }))}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-violet-600 animate-spin mb-4" />
          <p className="text-sm text-slate-500">Aggregating platform metrics...</p>
        </div>
      ) : (
        <>
          {/* Chart Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {chartCards.map((chart) => {
              const colors = colorMap[chart.color];
              const Icon = chart.icon;
              return (
                <div key={chart.title} className="glass-card rounded-2xl p-5 hover:border-white/[0.15] transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <Icon size={18} className={colors.text} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 font-outfit">{chart.title}</h3>
                        <p className="text-[10px] text-gray-500">{chart.description}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                      <ArrowUpRight size={12} />
                      {chart.trend}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 font-outfit mb-4">{chart.value}</p>
                  {/* Visual Sparkline */}
                  <div className={`h-16 rounded-xl bg-gradient-to-b ${colors.chartBg} border border-slate-200 flex items-end justify-between px-6 pb-2`}>
                    {[40, 55, 45, 60, 75, 90].map((h, i) => (
                      <div
                        key={i}
                        className={`w-3 rounded-t-md ${colors.text.replace('text', 'bg')} opacity-60`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Metrics Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Districts */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <MapPin size={16} className="text-violet-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">Top Districts</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {formattedDistricts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">No district records found.</div>
                ) : (
                  formattedDistricts.map((district, i) => (
                    <div key={district.name} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-100 transition-colors">
                      <span className="text-xs font-bold text-gray-600 w-5">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{district.name}</p>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full" style={{ width: `${district.pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-violet-600">{district.users} users</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Categories */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Award size={16} className="text-cyan-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900 font-outfit">Top Categories (Jobs)</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {formattedCategories.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">No category records found.</div>
                ) : (
                  formattedCategories.map((category, i) => (
                    <div key={category.name} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-100 transition-colors">
                      <span className="text-xs font-bold text-gray-600 w-5">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{category.name}</p>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" style={{ width: `${category.pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-cyan-600">{category.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Employers */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Crown size={16} className="text-emerald-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900 font-outfit">Top Employers</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {formattedEmployers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">No employers registered yet.</div>
                ) : (
                  formattedEmployers.map((employer, i) => (
                    <div key={employer.name} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-100 transition-colors">
                      <span className="text-xs font-bold text-gray-600 w-5">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{employer.name}</p>
                        <p className="text-[10px] text-gray-500">{employer.jobs} jobs · {employer.applications} apps</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star size={12} className="text-amber-600" fill="currentColor" />
                        <span className="text-xs font-bold text-amber-600">{employer.rating}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
