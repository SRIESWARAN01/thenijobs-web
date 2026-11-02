import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { generateBreadcrumbSchema } from '@/lib/seo/schemas';
import { toJsonLdScript } from '@/lib/seo/jsonLd';
import { getAdminFirestore, syncClockSkew } from '@/lib/firebase/firebaseAdmin';
import { getCoursePreset, presetToCourse, generateDefaultSchedule } from '@/lib/career/coursePresets';
import {
  GraduationCap, BookOpen, Clock, Award, ShieldCheck, Check,
  ChevronRight, ArrowRight, Sparkles, User, Video, FileText,
  HelpCircle, Calendar, BookMarked, Globe, Building2, Users2,
  TrendingUp, CheckCircle2
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCourseData(slugOrId: string) {
  try {
    await syncClockSkew();
    const db = getAdminFirestore();

    // 1. Try finding by slug
    const querySnap = await db.collection('skillCourses')
      .where('slug', '==', slugOrId)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    // 2. If not found, try doc ID directly
    if (querySnap.empty) {
      const docSnap = await db.collection('skillCourses').doc(slugOrId).get();
      if (docSnap.exists && docSnap.data()?.status === 'published') {
        const course: any = { id: docSnap.id, ...docSnap.data() };
        const lessonsSnap = await db.collection('lessons')
          .where('courseId', '==', docSnap.id)
          .where('status', '==', 'published')
          .orderBy('order', 'asc')
          .get();
        const lessons: any[] = lessonsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        return { course, lessons };
      }

      // Check fallback preset
      const preset = getCoursePreset(slugOrId);
      if (preset) {
        return { course: presetToCourse(preset), lessons: [] };
      }
      return null;
    }

    const courseDoc = querySnap.docs[0];
    const course: any = { id: courseDoc.id, ...courseDoc.data() };

    // Fetch published lessons
    const lessonsSnap = await db.collection('lessons')
      .where('courseId', '==', course.id)
      .where('status', '==', 'published')
      .orderBy('order', 'asc')
      .get();
    const lessons: any[] = lessonsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return { course, lessons };
  } catch (err) {
    console.warn('[Course Detail SSR Error]:', err);
    // Fallback to presets if available
    const preset = getCoursePreset(slugOrId);
    if (preset) {
      return { course: presetToCourse(preset), lessons: [] };
    }
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCourseData(slug);
  if (!data || !data.course) {
    return {
      title: 'Course Not Found | THENIJOBS Academy',
      description: 'The requested course could not be found.',
    };
  }

  const { course } = data;
  const title = `${course.title} | THENIJOBS Academy`;
  const description = course.shortDescription || `Master ${course.title} with practical lessons and official certification on THENIJOBS.`;

  return {
    title,
    description,
    keywords: [
      course.title,
      'Theni skill development',
      'Tamil Nadu job training',
      course.categoryName || 'Vocational Training',
      'Free certification course',
    ],
    alternates: {
      canonical: `https://www.thenijobs.com/courses/${course.slug || course.id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.thenijobs.com/courses/${course.slug || course.id}`,
      type: 'website',
      locale: 'en_IN',
      siteName: 'THENIJOBS',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: course.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.jpg'],
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCourseData(slug);

  if (!data || !data.course) {
    notFound();
  }

  const { course, lessons } = data;
  const totalDays = Number(course.totalDays) || 7;
  const hoursPerDay = Number(course.hoursPerDay) || 1.5;
  const dailyTarget = Number(course.dailyPercentageTarget) || Math.round(100 / totalDays);
  const targetAudience = course.targetAudience || 'all';
  const dailySchedule = Array.isArray(course.dailySchedule) && course.dailySchedule.length > 0
    ? course.dailySchedule
    : generateDefaultSchedule(totalDays, course.title);

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.thenijobs.com' },
    { name: 'Courses', url: 'https://www.thenijobs.com/courses' },
    { name: course.title, url: `https://www.thenijobs.com/courses/${course.slug || course.id}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbs) }}
      />

      <Header />

      <main className="min-h-screen bg-slate-50 text-slate-800 pb-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white px-4 sm:px-6 lg:px-8 pt-10 pb-16">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Breadcrumb pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-200">
              <Link href="/courses" className="hover:underline flex items-center gap-1">
                <GraduationCap size={14} /> Courses
              </Link>
              <span>/</span>
              <span className="text-emerald-100 font-semibold">{course.categoryName || 'Skills'}</span>
              <span>/</span>
              <span className="text-white font-bold truncate max-w-xs">{course.title}</span>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                  {course.categoryName || 'General Skills'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white capitalize">
                  {course.difficulty} Level
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
                  {course.language === 'tamil' ? 'தமிழ்' : course.language === 'both' ? 'Bilingual (Tamil + English)' : 'English'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  👥 {targetAudience === 'employee' ? 'Staff Training' : targetAudience === 'job_seeker' ? 'For Job Seekers' : 'Seekers & Staff'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                {course.title}
              </h1>

              {course.titleTamil && (
                <p className="text-sm sm:text-base text-emerald-200 font-medium">
                  {course.titleTamil}
                </p>
              )}

              <p className="text-sm sm:text-base text-emerald-100/90 max-w-3xl leading-relaxed">
                {course.shortDescription}
              </p>
            </div>

            {/* Quick Timeline Stats Bar */}
            <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-emerald-200 pt-2 border-t border-white/10">
              <span className="flex items-center gap-1.5 font-bold text-white">
                <Calendar size={16} className="text-emerald-300" />
                Duration: {totalDays} Days ({Math.round(totalDays * hoursPerDay)} hrs total)
              </span>
              <span className="flex items-center gap-1.5 font-bold text-yellow-300">
                <TrendingUp size={16} />
                Daily Target: {dailyTarget}% / day ({hoursPerDay} hrs/day)
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen size={16} className="text-emerald-300" />
                Lessons: {lessons.length || dailySchedule.length} Modules
              </span>
              {course.certificateEligible && (
                <span className="flex items-center gap-1.5 text-white font-bold">
                  <Award size={16} className="text-yellow-300" />
                  Verifiable Certificate Included
                </span>
              )}
            </div>

            {/* Dual CTAs for Job Seekers & Business Employees */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/seeker/skills"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black transition-all shadow-lg shadow-emerald-500/30"
              >
                <Sparkles size={16} />
                <span>Enroll as Job Seeker (Free Learning)</span>
              </Link>

              <Link
                href="/employer/training"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-all"
              >
                <Building2 size={16} />
                <span>Assign to Staff (Employer Portal)</span>
              </Link>

              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-white/80 hover:text-white text-xs sm:text-sm transition-all"
              >
                <span>Browse All Courses</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Course Details Body */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Syllabus & Objectives */}
            <div className="lg:col-span-2 space-y-8">
              {/* Full Description */}
              {course.fullDescription && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
                  <h2 className="text-base font-bold text-slate-900">About this Course</h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {course.fullDescription}
                  </p>
                </div>
              )}

              {/* Learning Objectives */}
              {Array.isArray(course.learningObjectives) && course.learningObjectives.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
                  <h2 className="text-base font-bold text-slate-900">What You Will Learn</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {course.learningObjectives.map((obj: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 text-xs text-slate-700">
                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-medium">{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Day-by-Day Milestone Roadmap */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      📅 {totalDays}-Day Milestone Schedule ({dailyTarget}% / day)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Complete daily topics and milestone targets to unlock your official verified certificate.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                    {totalDays} Daily Milestones
                  </span>
                </div>

                <div className="space-y-3">
                  {dailySchedule.map((milestone: any) => (
                    <div
                      key={milestone.dayNumber}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            D{milestone.dayNumber}
                          </span>
                          <div>
                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                              {milestone.title}
                            </h3>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {hoursPerDay} Hours of Study &amp; Practical Exercises
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0">
                          Target: {milestone.percentageTarget}%
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 pl-10">
                        {milestone.description}
                      </p>

                      {milestone.keyTakeaway && (
                        <div className="ml-10 text-[11px] font-medium text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-100/80 flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                          <span><strong>Key Outcome:</strong> {milestone.keyTakeaway}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Prerequisites */}
              {Array.isArray(course.prerequisites) && course.prerequisites.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
                  <h2 className="text-base font-bold text-slate-900">Requirements &amp; Prerequisites</h2>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {course.prerequisites.map((req: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Col: Course Card & Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5 sticky top-24">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Course Overview
                  </span>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Timeline:</span>
                      <strong className="text-slate-900">{totalDays} Days</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Daily Target:</span>
                      <strong className="text-emerald-700">{dailyTarget}% per day</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Study Commitment:</span>
                      <strong className="text-slate-900">{hoursPerDay} hrs / day</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Audience:</span>
                      <strong className="text-slate-900 capitalize">
                        {targetAudience === 'employee' ? 'Business Staff' : targetAudience === 'job_seeker' ? 'Job Seekers' : 'Seekers & Staff'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Access Fee:</span>
                      <strong className="text-emerald-700 font-bold">100% Free (THENIJOBS)</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Link
                    href="/seeker/skills"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                  >
                    <Sparkles size={15} />
                    <span>Start Learning (Job Seeker)</span>
                  </Link>

                  <Link
                    href="/employer/training"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
                  >
                    <Building2 size={15} />
                    <span>Assign to Staff (Employer)</span>
                  </Link>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <ShieldCheck size={16} />
                    <span>Official Verified Digital Certificate</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Shareable on your THENIJOBS Profile, Resume, and WhatsApp for local recruiters across Theni district.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  );
}
