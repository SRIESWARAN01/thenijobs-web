'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Clock, Award, Loader2, ArrowLeft, ArrowRight, Shield, BadgeCheck, CheckCircle2 } from 'lucide-react';
import { getCourse, getModules, getLessons } from '@/lib/firebase/lmsService';
import { useEnrollment } from '@/hooks/useLMS';
import type { Course, CourseModule, Lesson } from '@/lib/types/lms';

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<(CourseModule & { lessons: Lesson[] })[]>([]);
  const [loading, setLoading] = useState(true);

  const { enrollment, enroll, loading: enrollLoading } = useEnrollment(courseId);

  useEffect(() => {
    if (!courseId) return;

    const loadData = async () => {
      try {
        const c = await getCourse(courseId);
        if (!c) {
          router.push('/academy');
          return;
        }
        setCourse(c);

        const dbMods = await getModules(courseId);
        const modsWithLessons = await Promise.all(
          dbMods.map(async (mod) => {
            const lessons = await getLessons(courseId, mod.id);
            return { ...mod, lessons };
          })
        );
        setModules(modsWithLessons);
      } catch (err) {
        console.error('Error loading course details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, router]);

  const handleEnroll = async () => {
    if (!course) return;
    try {
      await enroll(course.title);
      router.push(`/academy/${courseId}/learn`);
    } catch (err) {
      alert('Enrollment failed. Please check connection or login state.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070714] text-white flex flex-col items-center justify-center font-outfit">
        <Loader2 className="animate-spin text-violet-400 mb-2" size={36} />
        <p className="text-sm text-gray-400">Loading course curriculum...</p>
      </div>
    );
  }

  if (!course) return null;

  return (
    <main className="min-h-screen bg-[#070714] text-white font-outfit pb-16">
      {/* Hero Banner */}
      <section className="relative pt-24 pb-16 overflow-hidden border-b border-white/[0.04] bg-gradient-to-b from-violet-950/10 via-[#070714] to-[#070714]">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[120px] bg-violet-600/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 relative z-10 space-y-4">
          <button onClick={() => router.push('/academy')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors uppercase font-black mb-4">
            <ArrowLeft size={14} /> Back to Catalog
          </button>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative aspect-video w-full md:w-80 rounded-2xl overflow-hidden bg-slate-950 border border-white/[0.08] shrink-0 shadow-2xl">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-slate-900 flex items-center justify-center">
                  <BookOpen size={48} className="text-violet-500/50" />
                </div>
              )}
            </div>

            <div className="space-y-4 flex-1">
              <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full uppercase font-black tracking-widest inline-block">
                {course.category}
              </span>
              <h1 className="text-3xl font-black tracking-tight text-white leading-tight">{course.title}</h1>
              <p className="text-xs text-gray-400 leading-relaxed text-justify">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-400 pt-2">
                <span className="flex items-center gap-1.5"><Clock size={14} className="text-violet-400" /> {course.estimatedHours} hrs effort</span>
                <span className="flex items-center gap-1.5"><Award size={14} className="text-violet-400" /> Professional Certificate</span>
                <span className="flex items-center gap-1.5"><Shield size={14} className="text-violet-400 text-emerald-400" /> Verified Badge</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Details and Module Accordion */}
      <section className="max-w-5xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Modules Accordion */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Course Syllabus</h2>
          <div className="space-y-3">
            {modules.map((mod, modIdx) => (
              <div key={mod.id} className="glass-card rounded-2xl p-5 border border-white/[0.05] space-y-3">
                <div>
                  <span className="text-[9px] text-violet-400 uppercase font-black tracking-wider">Module {modIdx + 1}</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{mod.title}</h3>
                  {mod.description && <p className="text-xs text-gray-400 mt-1">{mod.description}</p>}
                </div>
                <div className="space-y-2 border-t border-white/[0.04] pt-3">
                  {mod.lessons.map((lesson, lessonIdx) => (
                    <div key={lesson.id} className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 font-bold font-mono">L{lessonIdx + 1}</span>
                        <span>{lesson.title}</span>
                      </span>
                      {lesson.videoDuration ? (
                        <span>{Math.round(lesson.videoDuration / 60)} mins</span>
                      ) : (
                        <span className="capitalize">{lesson.type}</span>
                      )}
                    </div>
                  ))}
                  {mod.quizId && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/5 px-2.5 py-1.5 rounded-lg border border-amber-500/10 w-fit mt-1">
                      <BadgeCheck size={14} /> Module Assessment Included
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: CTA Widget */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-3xl p-6 border border-white/[0.08] bg-white/[0.01] sticky top-24 space-y-6 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/[0.06] pb-3">Course Enrollment</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 text-xs text-gray-400">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Anti-Skip Video Protection</strong>: Lessons must be fully completed to unlock assessments.</p>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-gray-400">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Interactive Quizzes</strong>: Test module comprehension instantly.</p>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-gray-400">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Auto-sync to Portfolio</strong>: Showcase credentials directly on your profile.</p>
              </div>
            </div>

            {enrollLoading ? (
              <div className="flex justify-center">
                <Loader2 className="animate-spin text-violet-400" size={24} />
              </div>
            ) : enrollment ? (
              <div className="space-y-3">
                <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-center">
                  <p className="text-xs text-violet-300">You are enrolled in this course.</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Overall Progress: {enrollment.progressPercent}%</p>
                </div>
                <Link href={`/academy/${courseId}/learn`} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-xs uppercase tracking-wider text-center block transition-transform hover:scale-[1.01] text-white">
                  Resume Lessons <ArrowRight size={13} className="inline ml-1" />
                </Link>
              </div>
            ) : (
              <button onClick={handleEnroll} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 font-bold text-xs uppercase tracking-wider text-center transition-transform hover:scale-[1.01] text-white">
                Start Learning Now
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
