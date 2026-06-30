'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Star, Award, Clock, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useCourses, useMyEnrollments } from '@/hooks/useLMS';
import { COURSE_CATEGORIES } from '@/lib/types/lms';

export default function AcademyCatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  const { courses, loading: coursesLoading } = useCourses(
    selectedCategory === 'all' ? undefined : selectedCategory
  );
  const { enrollments, loading: enrollmentsLoading } = useMyEnrollments();

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#070714] text-white font-outfit pb-16">
      {/* Hero Header */}
      <section className="relative pt-24 pb-16 overflow-hidden border-b border-white/[0.04] bg-gradient-to-b from-violet-950/10 via-[#070714] to-[#070714]">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[120px] bg-violet-600/10 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-black uppercase tracking-widest">
            <Sparkles size={12} className="text-violet-400" /> Learn & Grow
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            THENIJOBS <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">Learning Academy</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Upgrade your skills, earn validated professional certifications, and boost your local employment opportunities in Theni.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input w-full pl-10 pr-4 py-2.5 text-sm"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 w-full md:w-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-white/[0.03] text-gray-400 hover:text-white'}`}
            >
              All Topics
            </button>
            {COURSE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-white/[0.03] text-gray-400 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* User's In-Progress Enrollments */}
        {!enrollmentsLoading && enrollments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-violet-400" /> In Progress Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrollments.map(enr => (
                <div key={enr.id} className="glass-card rounded-2xl p-4 flex flex-col justify-between hover:border-white/[0.1] transition-all">
                  <div>
                    <span className="text-[10px] text-violet-400 uppercase font-black tracking-wider">Course In Progress</span>
                    <h3 className="text-sm font-bold text-white mt-1">{enr.courseName}</h3>
                    
                    {/* Progress details */}
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-4 mb-2">
                      <span>Progress</span>
                      <span className="font-bold text-violet-400">{enr.progressPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all" style={{ width: `${enr.progressPercent}%` }} />
                    </div>
                  </div>
                  <Link href={`/academy/${enr.courseId}/learn`} className="mt-4 inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-bold uppercase transition-colors">
                    Continue Learning <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Catalog */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen size={16} className="text-violet-400" /> Available Courses
          </h2>

          {coursesLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 size={32} className="animate-spin text-violet-400 mb-2" />
              <p className="text-sm">Fetching catalog...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center text-gray-400">
              <BookOpen size={36} className="mx-auto text-gray-600 mb-3" />
              <p className="text-sm">No courses matching selected criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => {
                const diffColors: Record<string, string> = {
                  beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
                  intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
                  advanced: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
                };
                return (
                  <div key={course.id} className="glass-card rounded-2xl overflow-hidden hover:border-white/[0.1] transition-all flex flex-col justify-between group">
                    <div className="relative aspect-video bg-slate-950 w-full overflow-hidden border-b border-white/[0.05]">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-slate-900 flex items-center justify-center">
                          <BookOpen size={32} className="text-violet-500/50" />
                        </div>
                      )}
                      <span className={`absolute top-3 left-3 px-2 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${diffColors[course.difficulty]}`}>
                        {course.difficulty}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">{course.category}</span>
                        <h3 className="text-sm font-bold text-white mt-1 group-hover:text-violet-400 transition-colors line-clamp-1">{course.title}</h3>
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">{course.description}</p>
                      </div>

                      <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={12} /> {course.estimatedHours} hrs</span>
                        <span className="flex items-center gap-1"><Award size={12} /> Certified</span>
                      </div>

                      <Link href={`/academy/${course.id}`} className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 font-bold text-xs uppercase text-center block tracking-wider transition-colors text-white">
                        View Course Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
