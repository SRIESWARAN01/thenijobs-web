'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap, BookOpen, Clock, Award, Search, Sparkles,
  ChevronRight, ArrowRight, ShieldCheck, Check, Star, BookMarked,
  Users2, Building2, Calendar
} from 'lucide-react';
import { FALLBACK_CATALOG_COURSES } from '@/lib/career/coursePresets';

interface CourseItem {
  id: string;
  title: string;
  titleTamil?: string;
  slug: string;
  shortDescription: string;
  categoryId: string;
  categoryName?: string;
  thumbnailUrl?: string;
  instructorName?: string;
  difficulty: string;
  duration: string;
  totalDays?: number;
  hoursPerDay?: number;
  dailyPercentageTarget?: number;
  targetAudience?: 'all' | 'job_seeker' | 'employee' | 'business_owner';
  language: string;
  lessonCount: number;
  certificateEligible: boolean;
  learningObjectives?: string[];
}

interface CategoryItem {
  id: string;
  name: string;
  nameTamil?: string;
  iconEmoji?: string;
}

export default function CoursesCatalogClient({
  initialCourses = [],
  initialCategories = [],
}: {
  initialCourses: CourseItem[];
  initialCategories: CategoryItem[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedAudience, setSelectedAudience] = useState('all');

  // Fallback to rich pre-configured courses if SSR or database returned empty
  const activeCourses = useMemo(() => {
    if (initialCourses && initialCourses.length > 0) return initialCourses;
    return FALLBACK_CATALOG_COURSES as unknown as CourseItem[];
  }, [initialCourses]);

  const filteredCourses = useMemo(() => {
    return activeCourses.filter((course) => {
      if (selectedCategory !== 'all' && course.categoryId !== selectedCategory) {
        return false;
      }
      if (selectedDifficulty !== 'all' && course.difficulty !== selectedDifficulty) {
        return false;
      }
      if (selectedLanguage !== 'all' && course.language !== selectedLanguage && course.language !== 'both') {
        return false;
      }
      if (selectedAudience !== 'all') {
        const aud = course.targetAudience || 'all';
        if (aud !== 'all' && aud !== selectedAudience) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = course.title?.toLowerCase().includes(q) || course.titleTamil?.toLowerCase().includes(q);
        const matchesDesc = course.shortDescription?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [activeCourses, selectedCategory, selectedDifficulty, selectedLanguage, selectedAudience, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/20 backdrop-blur-md">
            <GraduationCap size={15} />
            <span>THENIJOBS CAREER ACADEMY &amp; SKILL DEVELOPMENT</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto">
            Upgrade Your Skills, Earn Verifiable Certificates &amp; Get Hired Locally
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/80 max-w-2xl mx-auto">
            Practical, career-focused courses tailored for job seekers and local business employees in Theni, Cumbum, Periyakulam, and Tamil Nadu. Learn in Tamil &amp; English with daily milestone goals.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/seeker/skills"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold transition-all shadow-lg shadow-emerald-500/30"
            >
              <Sparkles size={16} />
              <span>Job Seeker Learning Portal</span>
            </Link>
            <Link
              href="/employer/training"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 backdrop-blur-md transition-all"
            >
              <Building2 size={16} />
              <span>Employer Staff Training Portal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Search & Filter Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 sm:p-6 mb-8 backdrop-blur-md space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses, skills (e.g., Tally, GST, Sales, Excel, Typing, EV Mechanic)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="all">All Categories</option>
                {initialCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.iconEmoji ? `${cat.iconEmoji} ` : ''}{cat.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="all">👥 All Audiences</option>
                <option value="job_seeker">🎓 For Job Seekers</option>
                <option value="employee">🏢 For Business Staff</option>
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="all">All Languages</option>
                <option value="tamil">தமிழ் (Tamil)</option>
                <option value="english">English</option>
                <option value="both">Bilingual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            Showing <strong className="text-slate-900">{filteredCourses.length}</strong> available course{filteredCourses.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-4">
            <BookOpen size={40} className="text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No courses found matching your criteria</h3>
            <p className="text-xs text-slate-500">Try adjusting your filters or search terms.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
                setSelectedLanguage('all');
                setSelectedAudience('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const totalDays = course.totalDays || 7;
              const dailyTarget = course.dailyPercentageTarget || Math.round(100 / totalDays);
              const audience = course.targetAudience || 'all';

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="p-5 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {course.categoryName || 'General Skills'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 capitalize">
                        {course.difficulty} • {course.language === 'tamil' ? 'தமிழ்' : course.language === 'both' ? 'Bilingual' : 'English'}
                      </span>
                    </div>

                    <div>
                      <Link
                        href={`/courses/${course.slug || course.id}`}
                        className="text-base font-bold text-slate-900 hover:text-emerald-700 transition-colors line-clamp-2"
                      >
                        {course.title}
                      </Link>
                      {course.titleTamil && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
                          {course.titleTamil}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1.5">
                        {course.shortDescription}
                      </p>
                    </div>

                    {/* Timeline & Daily Percentage Badge */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" />
                          <span>Timeline: <strong>{totalDays} Days</strong></span>
                        </span>
                        <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                          📈 {dailyTarget}% / day goal
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Target: {audience === 'employee' ? 'Staff Training' : audience === 'job_seeker' ? 'Job Seekers' : 'Seekers & Staff'}</span>
                        <span>{course.lessonCount || totalDays} Lessons</span>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-slate-400" />
                        {course.duration || `${totalDays} Days`}
                      </span>
                      {course.certificateEligible && (
                        <span className="flex items-center gap-1 text-purple-600 font-semibold">
                          <Award size={13} />
                          Verified Certificate
                        </span>
                      )}
                    </div>

                    {/* Learning Objectives Preview */}
                    {course.learningObjectives && course.learningObjectives.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-slate-100">
                        <p className="text-[11px] font-semibold text-slate-700">Course Highlights:</p>
                        <ul className="space-y-0.5 text-[11px] text-slate-500">
                          {course.learningObjectives.slice(0, 2).map((obj, i) => (
                            <li key={i} className="flex items-center gap-1.5 truncate">
                              <Check size={11} className="text-emerald-500 shrink-0" />
                              <span className="truncate">{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/courses/${course.slug || course.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 text-xs font-bold transition-all shadow-xs"
                    >
                      <span>Syllabus</span>
                      <ChevronRight size={13} />
                    </Link>

                    <Link
                      href="/seeker/skills"
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <span>Seeker Enroll</span>
                    </Link>

                    <Link
                      href="/employer/training"
                      className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-all shadow-xs"
                      title="Staff Training (Employer)"
                    >
                      <Building2 size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
