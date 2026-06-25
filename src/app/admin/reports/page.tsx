'use client';

import { useState } from 'react';
import {
  TrendingUp, Users, Building2, Briefcase,
  IndianRupee, Download, FileText, ArrowUpRight, MapPin, Award, Crown, Star, Loader2
} from 'lucide-react';
import { usePlatformStats } from '@/hooks/useRealtimeStats';
import { useCollection } from '@/hooks/useFirestore';

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
  const [timePeriod, setTimePeriod] = useState<typeof TIME_PERIODS[number]>('1M');
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
        rating: c.rating || 4.5,
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
    violet: { bg: 'bg-violet-500/15', text: 'text-violet-400', chartBg: 'from-violet-500/20 to-violet-500/5' },
    cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', chartBg: 'from-cyan-500/20 to-cyan-500/5' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', chartBg: 'from-emerald-500/20 to-emerald-500/5' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', chartBg: 'from-amber-500/20 to-amber-500/5' },
    rose: { bg: 'bg-rose-500/15', text: 'text-rose-400', chartBg: 'from-rose-500/20 to-rose-500/5' },
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Analytics & Reports</h1>
          <p className="text-sm text-gray-400 mt-1">Platform insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all">
            <Download size={16} />
            <span>CSV</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all">
            <FileText size={16} />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="flex items-center gap-2">
        {TIME_PERIODS.map((period) => (
          <button
            key={period}
            onClick={() => setTimePeriod(period)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${timePeriod === period
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'text-gray-500 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
          >
            {period}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Aggregating platform metrics...</p>
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
                        <h3 className="text-sm font-semibold text-white font-outfit">{chart.title}</h3>
                        <p className="text-[10px] text-gray-500">{chart.description}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-400">
                      <ArrowUpRight size={12} />
                      {chart.trend}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white font-outfit mb-4">{chart.value}</p>
                  {/* Visual Sparkline */}
                  <div className={`h-16 rounded-xl bg-gradient-to-b ${colors.chartBg} border border-white/[0.04] flex items-end justify-between px-6 pb-2`}>
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
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <MapPin size={16} className="text-violet-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">Top Districts</h2>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {formattedDistricts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">No district records found.</div>
                ) : (
                  formattedDistricts.map((district, i) => (
                    <div key={district.name} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <span className="text-xs font-bold text-gray-600 w-5">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{district.name}</p>
                        <div className="w-full h-1 bg-white/[0.06] rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full" style={{ width: `${district.pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-violet-400">{district.users} users</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Categories */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Award size={16} className="text-cyan-400" />
                </div>
                <h2 className="text-sm font-semibold text-white font-outfit">Top Categories (Jobs)</h2>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {formattedCategories.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">No category records found.</div>
                ) : (
                  formattedCategories.map((category, i) => (
                    <div key={category.name} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <span className="text-xs font-bold text-gray-600 w-5">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{category.name}</p>
                        <div className="w-full h-1 bg-white/[0.06] rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" style={{ width: `${category.pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-cyan-400">{category.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Employers */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Crown size={16} className="text-emerald-400" />
                </div>
                <h2 className="text-sm font-semibold text-white font-outfit">Top Employers</h2>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {formattedEmployers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">No employers registered yet.</div>
                ) : (
                  formattedEmployers.map((employer, i) => (
                    <div key={employer.name} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <span className="text-xs font-bold text-gray-600 w-5">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{employer.name}</p>
                        <p className="text-[10px] text-gray-500">{employer.jobs} jobs · {employer.applications} apps</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star size={12} className="text-amber-400" fill="currentColor" />
                        <span className="text-xs font-bold text-amber-400">{employer.rating}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
