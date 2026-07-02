'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap, Users, BookOpen, Clock, Award, TrendingUp,
  Plus, BarChart3, FileText, Loader2, Eye, ArrowUpRight,
} from 'lucide-react';
import { getAdminLMSStats } from '@/lib/firebase/lmsService';
import { useAdminCourses } from '@/hooks/useLMS';
import type { AdminLMSStats } from '@/lib/types/lms';

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
};

export default function AcademyDashboardPage() {
  const { courses, loading: coursesLoading } = useAdminCourses();
  const [stats, setStats] = useState<AdminLMSStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getAdminLMSStats()
      .then(setStats)
      .catch(err => console.error('LMS stats error:', err))
      .finally(() => setStatsLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Total Learners', value: stats.totalLearners, icon: Users, color: 'violet' },
    { label: 'Active Learners', value: stats.activeLearners, icon: TrendingUp, color: 'emerald' },
    { label: 'Completion Rate', value: `${stats.courseCompletionRate}%`, icon: Award, color: 'amber' },
    { label: 'Published Courses', value: stats.publishedCourses, icon: BookOpen, color: 'cyan' },
    { label: 'Watch Time (hrs)', value: stats.totalWatchTime, icon: Clock, color: 'blue' },
    { label: 'Certificates Issued', value: stats.totalCertificates, icon: FileText, color: 'rose' },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white font-outfit">Learning Academy</h1>
          </div>
          <p className="text-sm text-gray-400">Manage courses, learners, certificates, and analytics</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/academy/courses/create" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
            <Plus size={16} /> Create Course
          </Link>
          <Link href="/admin/academy/analytics" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-gray-300 hover:bg-white/[0.04] transition-colors">
            <BarChart3 size={16} /> Analytics
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="text-violet-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map(s => {
            const Icon = s.icon;
            const colors = colorMap[s.color];
            return (
              <div key={s.label} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center`}>
                    <Icon size={16} className={colors.text} />
                  </div>
                </div>
                <p className="text-xl font-bold text-white font-outfit">{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-medium">{s.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Manage Courses', desc: 'Create, edit, publish courses', href: '/admin/academy/courses', icon: BookOpen, color: 'violet' },
          { label: 'Certificate Templates', desc: 'Design certificate layouts', href: '/admin/academy/certificates', icon: Award, color: 'amber' },
          { label: 'Learner Analytics', desc: 'Performance & engagement data', href: '/admin/academy/analytics', icon: BarChart3, color: 'cyan' },
          { label: 'View Academy', desc: 'See the public course catalog', href: '/academy', icon: Eye, color: 'emerald' },
        ].map(item => {
          const Icon = item.icon;
          const colors = colorMap[item.color];
          return (
            <Link key={item.label} href={item.href} className="glass-card rounded-2xl p-5 group hover:border-white/[0.15] transition-all">
              <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={colors.text} />
              </div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1">
                {item.label}
                <ArrowUpRight size={12} className="text-gray-500 group-hover:text-violet-400 transition-colors" />
              </h3>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Most Popular Courses */}
      {stats && stats.mostPopularCourses.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-400" /> Most Popular Courses
          </h2>
          <div className="space-y-2">
            {stats.mostPopularCourses.map((c, i) => (
              <div key={c.courseId} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/[0.05] text-gray-500'}`}>
                    #{i + 1}
                  </span>
                  <span className="text-sm text-white font-medium">{c.courseName}</span>
                </div>
                <span className="text-xs text-gray-400 bg-white/[0.04] px-2.5 py-1 rounded-lg font-medium">
                  {c.enrollments} enrolled
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Courses */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen size={14} className="text-violet-400" /> Recent Courses
          </h2>
          <Link href="/admin/academy/courses" className="text-xs text-violet-400 hover:text-violet-300 font-medium">
            View All →
          </Link>
        </div>
        {coursesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="text-violet-400 animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <GraduationCap size={32} className="text-gray-500 mb-3" />
            <p className="text-sm text-gray-400">No courses created yet.</p>
            <Link href="/admin/academy/courses/create" className="text-xs text-violet-400 mt-2 hover:underline">
              Create your first course →
            </Link>
          </div>
        ) : (
          <div className="w-full overflow-x-auto min-w-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500">Course</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 hidden md:table-cell">Category</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Enrolled</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 hidden lg:table-cell">Lessons</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {courses.slice(0, 8).map(course => (
                  <tr key={course.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/academy/courses/${course.id}/edit`} className="text-sm font-medium text-white hover:text-violet-400 transition-colors">
                        {course.title}
                      </Link>
                      <p className="text-[10px] text-gray-500 mt-0.5">{course.difficulty}</p>
                    </td>
                    <td className="px-3 py-3.5 text-center hidden md:table-cell">
                      <span className="text-xs text-gray-400">{course.category}</span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="text-sm font-medium text-white">{course.enrollmentCount || 0}</span>
                    </td>
                    <td className="px-3 py-3.5 text-center hidden lg:table-cell">
                      <span className="text-xs text-gray-400">{course.totalLessons || 0}</span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${course.isPublished ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
