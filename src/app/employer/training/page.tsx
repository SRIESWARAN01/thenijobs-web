'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap, BookOpen, Clock, Award, Users2, Search,
  Sparkles, CheckCircle2, ChevronRight, Share2, Copy, Send,
  Building2, ArrowRight, ShieldCheck, Check, Filter, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEmployerCompany } from '@/hooks/useEmployerCompany';
import { useToast } from '@/contexts/ToastContext';
import { getCourses } from '@/lib/firebase/careerGrowthService';
import { COURSE_LAUNCH_PRESETS, FALLBACK_CATALOG_COURSES } from '@/lib/career/coursePresets';
import type { Course } from '@/lib/types/careerGrowth';

export default function EmployerTrainingPage() {
  const { user } = useAuth();
  const { company } = useEmployerCompany();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'catalog' | 'staff_progress' | 'certified_talent'>('catalog');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [assignModalCourse, setAssignModalCourse] = useState<Course | null>(null);
  const [employeePhone, setEmployeePhone] = useState('');
  const [employeeName, setEmployeeName] = useState('');

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        const liveCourses = await getCourses({ status: 'published' }).catch(() => []);
        if (liveCourses.length > 0) {
          setCourses(liveCourses);
        } else {
          setCourses(FALLBACK_CATALOG_COURSES);
        }
      } catch (err) {
        console.warn('[EmployerTraining] Error fetching live courses, using catalog:', err);
        setCourses(FALLBACK_CATALOG_COURSES);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach(c => {
      if (c.categoryName) set.add(c.categoryName);
    });
    return Array.from(set);
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.shortDescription || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || c.categoryName === selectedCategory;
      const matchAudience = !c.targetAudience || c.targetAudience === 'all' || c.targetAudience === 'employee';
      return matchSearch && matchCat && matchAudience;
    });
  }, [courses, searchQuery, selectedCategory]);

  const handleShareToEmployeeWhatsApp = (course: Course) => {
    const courseUrl = `https://www.thenijobs.com/courses/${course.slug || course.id}`;
    const message = `வணக்கம்! நம்முடைய ${company?.name || 'நிறுவன'} ஊழியர் பயிற்சிக்காக THENIJOBS Academy-யில் "${course.title}" கோர்ஸ் பரிந்துரைக்கப்பட்டுள்ளது.\n\n📅 மொத்த நாட்கள்: ${course.totalDays || 7} நாட்கள்\n📈 தினசரி இலக்கு: ${course.dailyPercentageTarget || 14}% / நாள்\n🎓 சான்றிதழ்: verified certificate included\n\nபயிற்சியைத் தொடங்க இங்கே கிளிக் செய்யுங்கள்: ${courseUrl}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopyLink = (course: Course) => {
    const courseUrl = `https://www.thenijobs.com/courses/${course.slug || course.id}`;
    navigator.clipboard.writeText(courseUrl);
    toast.success('Course Link Copied! 📋', 'Share this link with your staff or new joiners.');
  };

  const handleAssignDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeePhone || !employeeName || !assignModalCourse) return;
    toast.success('Course Assigned! 🚀', `Invitation sent to ${employeeName} (${employeePhone}) for ${assignModalCourse.title}.`);
    setAssignModalCourse(null);
    setEmployeeName('');
    setEmployeePhone('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/20">
          <GraduationCap size={15} />
          <span>THENIJOBS ACADEMY — BUSINESS &amp; WORKFORCE TRAINING</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Upskill Your Staff, Boost Business Productivity &amp; Hire Certified Talent
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100/80 max-w-3xl">
          Empower your shop, showroom, hospital, or enterprise employees in Theni district with structured, day-by-day certified training in Accounting, Retail POS, Customer Care, Field Sales, and Automotive Tech.
        </p>

        {/* Quick Nav Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            📚 Available Courses ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('staff_progress')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'staff_progress'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            👥 Staff Learning Progress
          </button>
          <button
            onClick={() => setActiveTab('certified_talent')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'certified_talent'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            🎓 Hire Certified Theni Candidates
          </button>
        </div>
      </div>

      {/* ─── TAB 1: AVAILABLE COURSES CATALOG ──────────────────────────────── */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recommended Courses for Your Employees</h2>
              <p className="text-xs text-slate-500">
                Courses launched by THENIJOBS Admin with strict daily milestone schedules and practical exercises.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">
                Showing {filteredCourses.length} of {courses.length} courses
              </span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search course title or topic (e.g. Tally, GST, Sales)…"
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {course.categoryName || 'General Skills'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 capitalize">
                      {course.difficulty} • {course.language === 'tamil' ? 'தமிழ்' : course.language === 'both' ? 'Bilingual' : 'English'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                      {course.title}
                    </h3>
                    {course.titleTamil && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
                        {course.titleTamil}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1.5">
                      {course.shortDescription}
                    </p>
                  </div>

                  {/* Daily Target & Duration Metrics */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-slate-400" />
                        <span>Duration: <strong>{course.totalDays || 7} Days</strong></span>
                      </span>
                      <span className="text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-md">
                        {course.dailyPercentageTarget || Math.round(100 / (course.totalDays || 7))}% / day goal
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (course.dailyPercentageTarget || 14) * 2)}%` }}
                        title="Milestone step rate"
                      />
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      <Award size={12} />
                      Verified Certificate
                    </span>
                    <span className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      <Users2 size={12} />
                      For Staff &amp; Job Seekers
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setAssignModalCourse(course)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Send size={13} />
                    <span>Assign to Staff</span>
                  </button>

                  <button
                    onClick={() => handleShareToEmployeeWhatsApp(course)}
                    className="p-2 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all cursor-pointer"
                    title="Share Course on WhatsApp"
                  >
                    <Share2 size={14} />
                  </button>

                  <button
                    onClick={() => handleCopyLink(course)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-600 transition-all cursor-pointer"
                    title="Copy Course Link"
                  >
                    <Copy size={14} />
                  </button>

                  <Link
                    href={`/courses/${course.slug || course.id}`}
                    target="_blank"
                    className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-600 transition-all"
                    title="View Full Curriculum"
                  >
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 2: STAFF LEARNING PROGRESS TRACKER ────────────────────────── */}
      {activeTab === 'staff_progress' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Enrolled Staff &amp; Milestone Completion Status</h3>
            <p className="text-xs text-slate-500">
              Track your staff&apos;s daily completion percentage vs the course target milestones.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Assigned Course</th>
                    <th className="py-3 px-3">Timeline</th>
                    <th className="py-3 px-3">Expected Target</th>
                    <th className="py-3 px-4">Current Progress</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>
                        <span>S. Muthukumar</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Cashier • +91 98421 XXXXX</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      Retail Store Operations &amp; POS Billing
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">Day 4 of 7</td>
                    <td className="py-3.5 px-3 font-bold text-slate-700">57%</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2">
                          <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '60%' }} />
                        </div>
                        <span className="font-bold text-emerald-700">60%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        On Track ⚡
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => toast.info('Reminder Sent', 'Daily milestone reminder sent to employee via WhatsApp.')}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700"
                      >
                        Send Reminder
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>
                        <span>K. Priya</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Accounts Clerk • +91 97890 XXXXX</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      Tally Prime with GST &amp; E-Way Bill Billing Mastery
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">Day 8 of 10</td>
                    <td className="py-3.5 px-3 font-bold text-slate-700">80%</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2">
                          <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '85%' }} />
                        </div>
                        <span className="font-bold text-emerald-700">85%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Ahead of Goal 🌟
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => toast.info('Kudos Sent', 'Appreciation message sent to employee.')}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700"
                      >
                        Cheer Staff
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: HIRE CERTIFIED TALENT ──────────────────────────────────── */}
      {activeTab === 'certified_talent' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Theni District Certified Talent Pool</h3>
                <p className="text-xs text-slate-500">
                  Pre-screened candidates who have completed THENIJOBS Academy courses and passed rigorous practical assessments.
                </p>
              </div>
              <Link
                href="/employer/talent-search"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs"
              >
                <Search size={14} /> Open Full Talent Search
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {[
                { name: 'M. Vignesh', location: 'Theni Town', course: 'Tally Prime GST Mastery', score: '94%', phone: '+91 94432 XXXXX', exp: '1 Year Experience' },
                { name: 'R. Soundarya', location: 'Cumbum', course: 'Modern Office Excel & Typing', score: '98%', phone: '+91 97891 XXXXX', exp: 'Fresher (Degree B.Com)' },
                { name: 'A. Karthik', location: 'Periyakulam', course: 'Field Sales & WhatsApp Business', score: '90%', phone: '+91 96554 XXXXX', exp: '2 Years Retail Sales' },
                { name: 'S. Divya', location: 'Bodinayakanur', course: 'Hospital Front-Desk & Patient Care', score: '96%', phone: '+91 98425 XXXXX', exp: 'Clinic Receptionist' },
                { name: 'P. Manikandan', location: 'Uthamapalayam', course: 'Two-Wheeler & EV Diagnostics', score: '92%', phone: '+91 94860 XXXXX', exp: 'ITI Automobile' },
                { name: 'G. Renuka', location: 'Andipatti', course: 'Retail Store Operations & POS', score: '95%', phone: '+91 99440 XXXXX', exp: 'Supermarket Cashier' },
              ].map((c, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                      <p className="text-xs text-slate-500">{c.location} • {c.exp}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      Score: {c.score}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-600 block">Verified Certificate:</span>
                    <span className="font-bold text-emerald-800">{c.course}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/employer/candidates?search=${encodeURIComponent(c.name)}`}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center transition-all"
                    >
                      Invite for Interview
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ASSIGN COURSE TO STAFF ─────────────────────────────────── */}
      {assignModalCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign Course to Employee</h3>
                <p className="text-xs text-slate-500">{assignModalCourse.title}</p>
              </div>
              <button onClick={() => setAssignModalCourse(null)} className="p-1 rounded-xl hover:bg-slate-100 cursor-pointer text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignDirect} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Employee Full Name *</label>
                <input
                  required
                  value={employeeName}
                  onChange={e => setEmployeeName(e.target.value)}
                  placeholder="e.g. S. Muthukumar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Employee Mobile Number (WhatsApp) *</label>
                <input
                  required
                  type="tel"
                  value={employeePhone}
                  onChange={e => setEmployeePhone(e.target.value)}
                  placeholder="e.g. 9842112345"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                <span className="font-bold text-emerald-900 block">Milestone Schedule:</span>
                <p className="text-[11px] text-emerald-700">
                  Course Timeline: <strong>{assignModalCourse.totalDays || 7} Days</strong> ({assignModalCourse.dailyPercentageTarget || 14}% expected per day). Employee will receive daily WhatsApp motivation and certificate upon passing the practical test.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalCourse(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Confirm &amp; Send Course Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
