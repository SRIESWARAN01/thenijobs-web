import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { generateBreadcrumbSchema } from '@/lib/seo/schemas';
import { toJsonLdScript } from '@/lib/seo/jsonLd';
import { getAdminFirestore, syncClockSkew } from '@/lib/firebase/firebaseAdmin';
import {
  GraduationCap, BookOpen, Clock, Award, ShieldCheck, Check,
  ChevronRight, ArrowRight, Sparkles, User, Video, FileText,
  HelpCircle, Calendar, BookMarked, Globe
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCourseData(slugOrId: string) {
  try {
    await syncClockSkew();
    const db = getAdminFirestore();

    // 1. Try finding by slug
    let querySnap = await db.collection('skillCourses')
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

  // JSON-LD Structured Data
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.thenijobs.com' },
    { name: 'Courses', url: 'https://www.thenijobs.com/courses' },
    { name: course.title, url: `https://www.thenijobs.com/courses/${course.slug || course.id}` },
  ]);

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.fullDescription || course.shortDescription,
    provider: {
      '@type': 'Organization',
      name: 'THENIJOBS',
      sameAs: 'https://www.thenijobs.com',
    },
    url: `https://www.thenijobs.com/courses/${course.slug || course.id}`,
    courseCode: course.slug || course.id,
    educationalCredentialAwarded: course.certificateEligible ? 'Verified Certificate of Achievement' : undefined,
    inLanguage: course.language === 'tamil' ? 'ta' : 'en',
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      courseWorkload: course.duration || '2 hours',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(courseSchema) }}
      />

      <Header />

      <main className="min-h-screen bg-slate-50 text-slate-800 pb-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white px-4 sm:px-6 lg:px-8 pt-10 pb-16">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Breadcrumb nav */}
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} />
              <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
              <ChevronRight size={12} />
              <span className="text-white truncate max-w-xs">{course.title}</span>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                  {course.categoryName || 'Vocational Training'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white capitalize">
                  {course.difficulty} Level
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
                  {course.language === 'tamil' ? 'தமிழ்' : course.language === 'both' ? 'Bilingual (Tamil + English)' : 'English'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                {course.title}
              </h1>

              <p className="text-sm sm:text-base text-emerald-100/90 max-w-3xl leading-relaxed">
                {course.shortDescription}
              </p>
            </div>

            {/* Quick Meta Stats */}
            <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-emerald-200 pt-2 border-t border-white/10">
              <span className="flex items-center gap-1.5">
                <Clock size={16} className="text-emerald-300" />
                Duration: {course.duration || '2 hours'}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen size={16} className="text-emerald-300" />
                Lessons: {lessons.length || course.lessonCount || 0}
              </span>
              {course.instructorName && (
                <span className="flex items-center gap-1.5">
                  <User size={16} className="text-emerald-300" />
                  Instructor: {course.instructorName}
                </span>
              )}
              {course.certificateEligible && (
                <span className="flex items-center gap-1.5 text-yellow-300 font-bold">
                  <Award size={16} />
                  Verifiable Certificate Included
                </span>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/seeker/skills"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold transition-all shadow-lg shadow-emerald-500/30"
              >
                <Sparkles size={16} />
                <span>Enroll Now &amp; Start Learning</span>
              </Link>

              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-all"
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
                      <div key={i} className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 text-xs text-slate-700">
                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Course Syllabus & Lessons */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">Course Syllabus</h2>
                  <span className="text-xs text-slate-500 font-semibold">{lessons.length} Lessons</span>
                </div>

                {lessons.length === 0 ? (
                  <p className="text-xs text-slate-500">Curriculum is being updated by the instructor.</p>
                ) : (
                  <div className="space-y-2">
                    {lessons.map((lesson: any, idx: number) => (
                      <div
                        key={lesson.id || idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{lesson.title}</p>
                            {lesson.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1">{lesson.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400 shrink-0">
                          <Clock size={12} />
                          <span>{lesson.estimatedMinutes || 10}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Key Summary & Prerequisites */}
            <div className="space-y-6">
              {/* Enrollment Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4 sticky top-6">
                <div className="space-y-2 pb-3 border-b border-slate-100">
                  <div className="text-2xl font-black text-emerald-700">Free Enrollment</div>
                  <p className="text-xs text-slate-500">Full access to lessons, assessment, and verifiable certification.</p>
                </div>

                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Language</span>
                    <span className="font-semibold capitalize">{course.language}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Difficulty</span>
                    <span className="font-semibold capitalize">{course.difficulty}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Estimated Duration</span>
                    <span className="font-semibold">{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Assessment</span>
                    <span className="font-semibold">{course.quizRequired ? 'Required (70% Pass)' : 'Optional'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Certificate</span>
                    <span className="font-semibold text-emerald-700">{course.certificateEligible ? 'Verified & Included' : 'No'}</span>
                  </div>
                </div>

                <Link
                  href="/seeker/skills"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
                >
                  <Sparkles size={15} />
                  <span>Enroll in Seeker Portal</span>
                </Link>

                <p className="text-[11px] text-center text-slate-400">
                  Requires a free THENIJOBS job seeker account.
                </p>
              </div>

              {/* Prerequisites Card */}
              {Array.isArray(course.prerequisites) && course.prerequisites.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Prerequisites</h3>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {course.prerequisites.map((req: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  );
}
