'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap, BookOpen, Clock, Award, Search, Sparkles,
  ChevronRight, ArrowRight, ShieldCheck, Check, Star, BookMarked
} from 'lucide-react';

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  categoryId: string;
  categoryName?: string;
  thumbnailUrl?: string;
  instructorName?: string;
  difficulty: string;
  duration: string;
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

  const filteredCourses = useMemo(() => {
    return initialCourses.filter((course) => {
      if (selectedCategory !== 'all' && course.categoryId !== selectedCategory) {
        return false;
      }
      if (selectedDifficulty !== 'all' && course.difficulty !== selectedDifficulty) {
        return false;
      }
      if (selectedLanguage !== 'all' && course.language !== selectedLanguage && course.language !== 'both') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = course.title?.toLowerCase().includes(q);
        const matchesDesc = course.shortDescription?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [initialCourses, selectedCategory, selectedDifficulty, selectedLanguage, searchQuery]);

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
            Practical, career-focused courses tailored for job seekers in Theni, Dindigul, and Madurai districts. Learn in Tamil &amp; English.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/seeker/skills"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold transition-all shadow-lg shadow-emerald-500/30"
            >
              <Sparkles size={16} />
              <span>Go to My Learning Portal</span>
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 backdrop-blur-md transition-all"
            >
              <BookMarked size={16} />
              <span>Browse Local Jobs</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Search & Filters Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-200/80 space-y-4 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses by title, keywords, software (Tally, Python, Typing)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="all">All Categories</option>
                {initialCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.iconEmoji ? `${c.iconEmoji} ` : ''}{c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
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
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {course.shortDescription}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-slate-400" />
                      {course.duration || '2 hours'}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen size={13} className="text-slate-400" />
                      {course.lessonCount || 0} Lessons
                    </span>
                    {course.certificateEligible && (
                      <span className="flex items-center gap-1 text-purple-600 font-semibold">
                        <Award size={13} />
                        Certificate
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

                {/* Footer Action */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/courses/${course.slug || course.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 text-xs font-bold transition-all shadow-sm"
                  >
                    <span>View Syllabus</span>
                    <ChevronRight size={14} />
                  </Link>

                  <Link
                    href="/seeker/skills"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <span>Enroll Free</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
