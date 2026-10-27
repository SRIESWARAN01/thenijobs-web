'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  GraduationCap, BookOpen, Award, CheckCircle2, Clock, PlayCircle,
  FileText, ExternalLink, HelpCircle, AlertCircle, Sparkles, ChevronRight,
  ChevronLeft, X, Download, Share2, Search, Filter, RefreshCw, Trophy,
  ArrowRight, Check, Eye, Lock, ShieldCheck, Video, Globe, BookMarked,
  Layers, UserCheck, AlertTriangle
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import {
  getSkillCategories,
  getCourses,
  getLearningPaths,
  getLessons,
  getQuizzes,
  getQuizForLearner,
  getEnrollments,
  enrollInCourse,
  markLessonCompleted,
  getCertificates,
} from '@/lib/firebase/careerGrowthService';
import { downloadCertificatePdf } from '@/lib/pdf/certificateGenerator';
import type {
  SkillCategory, Course, LearningPath, Lesson, Quiz,
  Enrollment, Certificate
} from '@/lib/types/careerGrowth';

// Preset Career Goals for Instant Recommendation
const CAREER_GOALS = [
  { id: 'all', label: 'All Careers', icon: Sparkles },
  { id: 'web_dev', label: 'Web & Software', tags: ['developer', 'software', 'frontend', 'firebase', 'code', 'javascript', 'react', 'python'] },
  { id: 'accounts', label: 'Accounts & Tally GST', tags: ['accountant', 'tally', 'gst', 'excel', 'finance', 'billing', 'audit'] },
  { id: 'office', label: 'Office & Data Entry', tags: ['data entry', 'typing', 'office', 'assistant', 'admin', 'clerk', 'computer'] },
  { id: 'marketing', label: 'Digital Marketing & SEO', tags: ['marketing', 'seo', 'social media', 'content', 'growth', 'sales'] },
  { id: 'retail_sales', label: 'Sales & Field Executive', tags: ['sales', 'field', 'retail', 'customer', 'communication', 'executive'] },
  { id: 'support', label: 'Customer Support', tags: ['support', 'voice', 'bpo', 'telecaller', 'helpdesk'] },
];

export default function SeekerSkillsPage() {
  const { user, loading: authLoading } = useRequireAuth(['job_seeker']);
  const toast = useToast();

  // Active View Tabs
  const [activeTab, setActiveTab] = useState<'my_learning' | 'browse' | 'paths' | 'certificates'>('my_learning');

  // Operational State
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedGoal, setSelectedGoal] = useState('all');

  // Modal Player States
  const [lessonPlayerCourse, setLessonPlayerCourse] = useState<Course | null>(null);
  const [lessonPlayerEnrollment, setLessonPlayerEnrollment] = useState<Enrollment | null>(null);
  const [lessonsList, setLessonsList] = useState<Lesson[]>([]);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);

  // Quiz Modal States
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizCourse, setQuizCourse] = useState<Course | null>(null);
  const [quizEnrollment, setQuizEnrollment] = useState<Enrollment | null>(null);
  const [quizData, setQuizData] = useState<any | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number[]>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);

  // Certificate Modal State
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);
  const [claimingCert, setClaimingCert] = useState(false);

  // Action Loading Flag
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  // ── 1. Fetch Real Live Data ───────────────────────────────────────────────────
  const userId = user?.uid;
  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [catsData, coursesData, pathsData, enrollsData, certsData] = await Promise.all([
        getSkillCategories(true).catch(() => []),
        getCourses({ status: 'published' }).catch(() => []),
        getLearningPaths({ status: 'published' }).catch(() => []),
        getEnrollments(userId).catch(() => []),
        getCertificates(userId).catch(() => []),
      ]);

      setCategories(catsData);
      setCourses(coursesData);
      setLearningPaths(pathsData);
      setEnrollments(enrollsData);
      setCertificates(certsData);
    } catch (err: any) {
      console.error('[Seeker Skills] Data loading error:', err);
      toast.error('Failed to load courses. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (!authLoading && userId) {
      loadData();
    }
  }, [authLoading, userId, loadData]);

  // Derived user statistics
  const metrics = useMemo(() => {
    const activeEnrolls = enrollments.filter((e) => e.status === 'active');
    const completedEnrolls = enrollments.filter((e) => e.status === 'completed');
    const avgProgress =
      enrollments.length > 0
        ? Math.round(
            enrollments.reduce((sum, e) => sum + (e.progressPercentage || 0), 0) /
              enrollments.length
          )
        : 0;

    return {
      totalEnrolled: enrollments.length,
      activeCount: activeEnrolls.length,
      completedCount: completedEnrolls.length,
      certificateCount: certificates.length,
      averageProgress: avgProgress,
    };
  }, [enrollments, certificates]);

  // Map of course ID -> enrollment
  const enrollmentMap = useMemo(() => {
    const map = new Map<string, Enrollment>();
    enrollments.forEach((e) => map.set(e.courseId, e));
    return map;
  }, [enrollments]);

  // Filtered Courses for Browse Tab
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Category filter
      if (selectedCategory !== 'all' && course.categoryId !== selectedCategory) {
        return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== 'all' && course.difficulty !== selectedDifficulty) {
        return false;
      }
      // Language filter
      if (selectedLanguage !== 'all' && course.language !== selectedLanguage && course.language !== 'both') {
        return false;
      }
      // Career Goal filter
      if (selectedGoal !== 'all') {
        const goal = CAREER_GOALS.find((g) => g.id === selectedGoal);
        if (goal && goal.tags) {
          const text = `${course.title} ${course.shortDescription} ${course.tags?.join(' ') || ''}`.toLowerCase();
          const matches = goal.tags.some((tag) => text.includes(tag));
          if (!matches) return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = course.title?.toLowerCase().includes(q);
        const matchesDesc = course.shortDescription?.toLowerCase().includes(q);
        const matchesTags = course.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }
      return true;
    });
  }, [courses, selectedCategory, selectedDifficulty, selectedLanguage, selectedGoal, searchQuery]);

  // ── 2. Enrollment Action ─────────────────────────────────────────────────────
  const handleEnroll = async (course: Course) => {
    if (!user) return;
    try {
      setEnrollingCourseId(course.id);
      const seekerName = user.displayName || user.email?.split('@')[0] || 'Job Seeker';
      const seekerEmail = user.email || '';

      await enrollInCourse(
        user.uid,
        seekerName,
        seekerEmail,
        course.id,
        course.title
      );

      toast.success(`Enrolled in "${course.title}" successfully!`);
      await loadData();
      setActiveTab('my_learning');
    } catch (err: any) {
      console.error('[Enroll Error]:', err);
      toast.error(err.message || 'Failed to enroll in course.');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  // ── 3. Open Lesson Player ────────────────────────────────────────────────────
  const handleOpenLessonPlayer = async (course: Course) => {
    try {
      setLoadingLessons(true);
      setLessonPlayerCourse(course);
      const enrollment = enrollmentMap.get(course.id) || null;
      setLessonPlayerEnrollment(enrollment);

      const lessons = await getLessons(course.id);
      const published = lessons.filter((l) => l.status === 'published');
      setLessonsList(published);

      // Find first incomplete lesson, or last accessed
      let startIndex = 0;
      if (enrollment && enrollment.completedLessons?.length > 0) {
        const nextIncomplete = published.findIndex(
          (l) => !enrollment.completedLessons.includes(l.id)
        );
        startIndex = nextIncomplete >= 0 ? nextIncomplete : published.length - 1;
      }
      setActiveLessonIndex(Math.max(0, startIndex));
    } catch (err: any) {
      console.error('[Lesson Player Error]:', err);
      toast.error('Failed to load course lessons.');
    } finally {
      setLoadingLessons(false);
    }
  };

  // ── 4. Complete Lesson & Advance ─────────────────────────────────────────────
  const handleMarkCompleteAndNext = async () => {
    if (!user || !lessonPlayerCourse || !lessonPlayerEnrollment) return;
    const currentLesson = lessonsList[activeLessonIndex];
    if (!currentLesson) return;

    try {
      setMarkingDone(true);
      await markLessonCompleted(
        user.uid,
        lessonPlayerCourse.id,
        currentLesson.id,
        lessonPlayerEnrollment.id,
        (currentLesson.estimatedMinutes || 10) * 60
      );

      toast.success('Lesson completed!');

      // Update local enrollment state
      const updatedCompleted = lessonPlayerEnrollment.completedLessons.includes(currentLesson.id)
        ? lessonPlayerEnrollment.completedLessons
        : [...lessonPlayerEnrollment.completedLessons, currentLesson.id];

      const newProgress = Math.round((updatedCompleted.length / lessonsList.length) * 100);
      const updatedEnrollment: Enrollment = {
        ...lessonPlayerEnrollment,
        completedLessons: updatedCompleted,
        progressPercentage: newProgress,
        status: newProgress >= 100 ? 'completed' : 'active',
      };
      setLessonPlayerEnrollment(updatedEnrollment);

      // Refresh parent enrollments list
      setEnrollments((prev) =>
        prev.map((e) => (e.id === updatedEnrollment.id ? updatedEnrollment : e))
      );

      // Advance to next lesson if available
      if (activeLessonIndex < lessonsList.length - 1) {
        setActiveLessonIndex((prev) => prev + 1);
      }
    } catch (err: any) {
      console.error('[Mark Lesson Error]:', err);
      toast.error('Failed to save progress.');
    } finally {
      setMarkingDone(false);
    }
  };

  // ── 5. Open Quiz Player ──────────────────────────────────────────────────────
  const handleOpenQuiz = async (course: Course) => {
    try {
      setQuizCourse(course);
      const enrollment = enrollmentMap.get(course.id) || null;
      setQuizEnrollment(enrollment);
      setQuizResult(null);
      setUserAnswers({});

      const quizzes = await getQuizzes(course.id);
      const published = quizzes.filter((q) => q.status === 'published');
      if (published.length === 0) {
        toast.info('No published assessment found for this course.');
        return;
      }

      // Fetch quiz without answers (Anti-cheat)
      const targetQuiz = published[0];
      const safeQuiz = await getQuizForLearner(targetQuiz.id);
      if (!safeQuiz) {
        toast.error('Unable to load assessment questions.');
        return;
      }

      setQuizData(safeQuiz);
      setQuizStartTime(Date.now());
      setQuizModalOpen(true);
    } catch (err: any) {
      console.error('[Quiz Error]:', err);
      toast.error('Failed to launch quiz.');
    }
  };

  // Toggle Quiz Answer
  const handleToggleAnswer = (questionId: string, optionIndex: number, isMulti: boolean) => {
    setUserAnswers((prev) => {
      const current = prev[questionId] || [];
      if (isMulti) {
        const next = current.includes(optionIndex)
          ? current.filter((i) => i !== optionIndex)
          : [...current, optionIndex];
        return { ...prev, [questionId]: next };
      } else {
        return { ...prev, [questionId]: [optionIndex] };
      }
    });
  };

  // ── 6. Submit Quiz to Server ─────────────────────────────────────────────────
  const handleSubmitQuiz = async () => {
    if (!user || !quizData || !quizCourse) return;

    try {
      setSubmittingQuiz(true);
      const timeTaken = Math.max(1, Math.round((Date.now() - quizStartTime) / 1000));

      const res = await fetch('/api/career-growth/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quizData.id,
          seekerId: user.uid,
          courseId: quizCourse.id,
          answers: userAnswers,
          timeTakenSeconds: timeTaken,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Quiz submission failed');
      }

      setQuizResult(data);
      if (data.passed) {
        toast.success('Congratulations! You passed the assessment.');
      } else {
        toast.info('Assessment complete. Review your score below.');
      }
      await loadData();
    } catch (err: any) {
      console.error('[Quiz Submit Error]:', err);
      toast.error(err.message || 'Failed to submit quiz.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // ── 7. Claim Official Certificate ────────────────────────────────────────────
  const handleClaimCertificate = async (course: Course) => {
    if (!user) return;
    try {
      setClaimingCert(true);
      const seekerName = user.displayName || user.email?.split('@')[0] || 'Learner';

      const res = await fetch('/api/career-growth/certificate/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seekerId: user.uid,
          courseId: course.id,
          seekerName,
          seekerEmail: user.email || '',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to claim certificate');
      }

      toast.success('Official Certificate issued successfully!');
      setViewingCert(data.certificate);
      await loadData();
    } catch (err: any) {
      console.error('[Claim Cert Error]:', err);
      toast.error(err.message || 'Failed to claim certificate.');
    } finally {
      setClaimingCert(false);
    }
  };

  // ── 8. Download Certificate PDF ──────────────────────────────────────────────
  const handleDownloadPdf = async (cert: Certificate) => {
    try {
      toast.info('Generating official high-resolution PDF certificate…');
      await downloadCertificatePdf({
        verificationId: cert.verificationId,
        seekerName: cert.seekerName,
        courseTitle: cert.courseTitle,
        learningPathTitle: cert.learningPathTitle,
        issueDate: cert.issueDate,
        quizScore: cert.quizScore,
      });
      toast.success('Certificate PDF downloaded successfully!');
    } catch (err: any) {
      console.error('[PDF Download Error]:', err);
      toast.error('Failed to download certificate PDF.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw size={32} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* ── Page Header & Stats Banner ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-4 sm:px-6 lg:px-8 pt-8 pb-12 shadow-md">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide border border-emerald-400/20 mb-2">
                <GraduationCap size={14} />
                <span>THENIJOBS CAREER ACADEMY</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Career Growth &amp; Skill Development
              </h1>
              <p className="text-sm text-emerald-100/80 mt-1 max-w-2xl">
                Master high-demand vocational &amp; technical skills, earn official verifiable certificates, and unlock top local job matches across Theni, Dindigul, and Madurai.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 backdrop-blur-md transition-all shadow-sm"
              >
                <BookMarked size={16} />
                <span>Explore Jobs</span>
              </Link>
              <Link
                href="/seeker/ai-coach"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/30"
              >
                <Sparkles size={16} />
                <span>AI Career Coach</span>
              </Link>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <p className="text-xs text-emerald-200/80">Enrolled Courses</p>
                <p className="text-xl font-bold text-white">{metrics.totalEnrolled}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0">
                <PlayCircle size={20} />
              </div>
              <div>
                <p className="text-xs text-cyan-200/80">In Progress</p>
                <p className="text-xl font-bold text-white">{metrics.activeCount}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/20 text-yellow-300 flex items-center justify-center shrink-0">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-xs text-yellow-200/80">Completed</p>
                <p className="text-xl font-bold text-white">{metrics.completedCount}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-400/20 text-purple-300 flex items-center justify-center shrink-0">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xs text-purple-200/80">Certificates</p>
                <p className="text-xl font-bold text-white">{metrics.certificateCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* ── Career Goal Selector ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Your Target Career Track for Recommended Skills:
            </h2>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CAREER_GOALS.map((goal) => {
              const active = selectedGoal === goal.id;
              return (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {goal.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Tab Navigation ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('my_learning')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'my_learning'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen size={16} />
            <span>My Learning</span>
            {enrollments.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 font-bold">
                {enrollments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('browse')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'browse'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles size={16} />
            <span>Explore Courses</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
              {courses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('paths')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'paths'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers size={16} />
            <span>Career Roadmaps</span>
            {learningPaths.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                {learningPaths.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'certificates'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award size={16} />
            <span>My Certificates</span>
            {certificates.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 font-bold">
                {certificates.length}
              </span>
            )}
          </button>
        </div>

        {/* ── TAB 1: MY LEARNING ────────────────────────────────────────────────── */}
        {activeTab === 'my_learning' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-16">
                <RefreshCw size={28} className="animate-spin text-emerald-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading your enrolled courses…</p>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <GraduationCap size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">You haven&apos;t enrolled in any courses yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Browse our practical courses in Accounting, Software, Typing, Field Marketing, and more to advance your career.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                >
                  <Sparkles size={16} />
                  <span>Browse Available Courses</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment) => {
                  const course = courses.find((c) => c.id === enrollment.courseId);
                  const isCompleted = enrollment.status === 'completed' || (enrollment.progressPercentage || 0) >= 100;
                  const hasCert = Boolean(enrollment.certificateId);
                  const quizPassed = (enrollment.bestQuizScore || 0) >= 70;

                  return (
                    <div
                      key={enrollment.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isCompleted ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isCompleted ? 'Completed' : 'In Progress'}
                          </span>

                          {course?.difficulty && (
                            <span className="text-[11px] font-medium text-slate-500 capitalize">
                              {course.difficulty}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                            {enrollment.courseTitle}
                          </h3>
                          {course?.shortDescription && (
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                              {course.shortDescription}
                            </p>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-600">Syllabus Progress</span>
                            <span className="font-bold text-emerald-700">{enrollment.progressPercentage || 0}%</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, enrollment.progressPercentage || 0)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                            <span>{enrollment.completedLessons?.length || 0} lessons done</span>
                            {enrollment.bestQuizScore !== undefined && enrollment.bestQuizScore !== null && (
                              <span className="font-semibold text-emerald-600">Quiz: {enrollment.bestQuizScore}%</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                        {course && (
                          <button
                            onClick={() => handleOpenLessonPlayer(course)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                          >
                            <PlayCircle size={15} />
                            <span>{isCompleted ? 'Review Lessons' : 'Continue'}</span>
                          </button>
                        )}

                        {course?.quizRequired && (
                          <button
                            onClick={() => handleOpenQuiz(course)}
                            title="Take Assessment"
                            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                              quizPassed
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                            }`}
                          >
                            <HelpCircle size={15} />
                          </button>
                        )}

                        {/* Claim or View Certificate */}
                        {isCompleted && (
                          hasCert ? (
                            <button
                              onClick={() => {
                                const cert = certificates.find((c) => c.courseId === enrollment.courseId);
                                if (cert) setViewingCert(cert);
                              }}
                              title="View Official Certificate"
                              className="px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-all"
                            >
                              <Award size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => course && handleClaimCertificate(course)}
                              disabled={claimingCert}
                              title="Claim Official Certificate"
                              className="px-3 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-bold transition-all shadow-sm"
                            >
                              <Trophy size={15} />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: EXPLORE COURSES ────────────────────────────────────────────── */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by course title, skills, software, keywords…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.iconEmoji ? `${c.iconEmoji} ` : ''}{c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>

                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="all">All Languages</option>
                    <option value="tamil">தமிழ் (Tamil)</option>
                    <option value="english">English</option>
                    <option value="both">Bilingual</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Courses Grid */}
            {loading ? (
              <div className="text-center py-16">
                <RefreshCw size={28} className="animate-spin text-emerald-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading catalog courses…</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
                <BookOpen size={32} className="text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No courses match your filter</h3>
                <p className="text-xs text-slate-500">Try adjusting your search terms or filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedDifficulty('all');
                    setSelectedLanguage('all');
                    setSelectedGoal('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => {
                  const enrollment = enrollmentMap.get(course.id);
                  const isEnrolled = Boolean(enrollment);

                  return (
                    <div
                      key={course.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="p-5 space-y-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {course.categoryName || 'General'}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 capitalize">
                            {course.difficulty} • {course.language === 'tamil' ? 'தமிழ்' : course.language === 'both' ? 'Bilingual' : 'English'}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                            {course.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {course.shortDescription}
                          </p>
                        </div>

                        {/* Meta Info */}
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
                        {course.learningObjectives?.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-slate-100">
                            <p className="text-[11px] font-semibold text-slate-700">What you&apos;ll learn:</p>
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
                        {isEnrolled ? (
                          <button
                            onClick={() => handleOpenLessonPlayer(course)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                          >
                            <PlayCircle size={15} />
                            <span>Continue Course</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnroll(course)}
                            disabled={enrollingCourseId === course.id}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                          >
                            {enrollingCourseId === course.id ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" />
                                <span>Enrolling…</span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={14} className="text-emerald-400" />
                                <span>Enroll Free</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: CAREER ROADMAPS ────────────────────────────────────────────── */}
        {activeTab === 'paths' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-16">
                <RefreshCw size={28} className="animate-spin text-emerald-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading learning roadmaps…</p>
              </div>
            ) : learningPaths.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
                <Layers size={32} className="text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No Learning Paths Published Yet</h3>
                <p className="text-xs text-slate-500">Check back soon for curated step-by-step career tracks.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {learningPaths.map((path) => (
                  <div
                    key={path.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-6 space-y-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                        {path.careerGoal || 'Career Roadmap'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium capitalize">
                        {path.difficulty} • {path.estimatedDuration}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{path.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-3">{path.description}</p>
                    </div>

                    {/* Step Courses */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-800">Sequential Courses Included:</p>
                      <div className="space-y-1.5">
                        {path.courses?.map((c, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                          >
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-slate-800 truncate">
                              {c.courseTitle || `Course ID: ${c.courseId}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: MY CERTIFICATES ────────────────────────────────────────────── */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-16">
                <RefreshCw size={28} className="animate-spin text-emerald-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading your credentials…</p>
              </div>
            ) : certificates.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-yellow-50 text-yellow-600 mx-auto flex items-center justify-center">
                  <Award size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">No Certificates Earned Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Complete all lessons in a course and pass the assessment to unlock your official verified certificate!
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                >
                  <Sparkles size={16} />
                  <span>Explore Courses to Certify</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-4">
                      {/* Top Banner */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck size={13} />
                          <span>Officially Verified</span>
                        </span>
                        {cert.quizScore && (
                          <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Score: {cert.quizScore}%
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                          {cert.courseTitle}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Issued to: <strong className="text-slate-800">{cert.seekerName}</strong>
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Verification ID:</span>
                          <span className="font-mono text-[10px] text-slate-900 font-bold">{cert.verificationId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => setViewingCert(cert)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 text-xs font-bold transition-all shadow-sm"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => handleDownloadPdf(cert)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                      >
                        <Download size={14} />
                        <span>PDF</span>
                      </button>

                      <Link
                        href={`/jobs?category=${encodeURIComponent(cert.courseTitle)}`}
                        title="Explore Matching Jobs"
                        className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all"
                      >
                        <BookMarked size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL 1: INTERACTIVE LESSON PLAYER ──────────────────────────────────── */}
      {lessonPlayerCourse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            {/* Player Topbar */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3 truncate">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <PlayCircle size={18} />
                </div>
                <div className="truncate">
                  <h3 className="text-sm font-bold text-white truncate">{lessonPlayerCourse.title}</h3>
                  <p className="text-[11px] text-slate-400">
                    Lesson {activeLessonIndex + 1} of {lessonsList.length} • {lessonsList[activeLessonIndex]?.title || 'Loading…'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {lessonPlayerCourse.quizRequired && (
                  <button
                    onClick={() => handleOpenQuiz(lessonPlayerCourse)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold hover:bg-amber-500/30 transition-all"
                  >
                    <HelpCircle size={14} />
                    <span>Take Quiz</span>
                  </button>
                )}
                <button
                  onClick={() => setLessonPlayerCourse(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Main Player Body (Sidebar + Content View) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Sidebar: Lesson Index */}
              <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 overflow-y-auto p-3 space-y-1.5 shrink-0">
                <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Course Curriculum
                </div>

                {loadingLessons ? (
                  <div className="text-center py-8">
                    <RefreshCw size={20} className="animate-spin text-emerald-600 mx-auto" />
                  </div>
                ) : lessonsList.length === 0 ? (
                  <p className="text-xs text-slate-500 p-2">No published lessons yet.</p>
                ) : (
                  lessonsList.map((lesson, idx) => {
                    const isCompleted = lessonPlayerEnrollment?.completedLessons?.includes(lesson.id);
                    const isActive = activeLessonIndex === idx;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLessonIndex(idx)}
                        className={`w-full text-left p-3 rounded-xl flex items-start gap-2.5 transition-all text-xs ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold'
                            : isCompleted
                            ? 'bg-emerald-50 text-slate-800 hover:bg-emerald-100/60'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-100'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 size={15} className={isActive ? 'text-white' : 'text-emerald-600'} />
                          ) : (
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isActive ? 'bg-white text-emerald-700' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {idx + 1}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{lesson.title}</p>
                          <p className={`text-[10px] ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {lesson.estimatedMinutes || 10} mins • {lesson.type}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Center Panel: Content Viewer */}
              <div className="flex-1 bg-white overflow-y-auto p-6 flex flex-col justify-between">
                {lessonsList[activeLessonIndex] ? (
                  <div className="space-y-6 max-w-3xl mx-auto w-full">
                    {/* Lesson Header */}
                    <div className="border-b border-slate-100 pb-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {lessonsList[activeLessonIndex].type}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={12} />
                          {lessonsList[activeLessonIndex].estimatedMinutes || 10} mins read
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900">
                        {lessonsList[activeLessonIndex].title}
                      </h2>
                      {lessonsList[activeLessonIndex].description && (
                        <p className="text-xs text-slate-500">
                          {lessonsList[activeLessonIndex].description}
                        </p>
                      )}
                    </div>

                    {/* Lesson Media / Body Viewer */}
                    <div className="space-y-4">
                      {/* Video Player */}
                      {lessonsList[activeLessonIndex].videoUrl && (
                        <div className="rounded-2xl overflow-hidden aspect-video bg-black shadow-lg">
                          {lessonsList[activeLessonIndex].videoUrl?.includes('youtube.com') ||
                          lessonsList[activeLessonIndex].videoUrl?.includes('youtu.be') ? (
                            <iframe
                              src={lessonsList[activeLessonIndex].videoUrl
                                ?.replace('watch?v=', 'embed/')
                                ?.replace('youtu.be/', 'www.youtube.com/embed/')}
                              title={lessonsList[activeLessonIndex].title}
                              className="w-full h-full"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                          ) : (
                            <video
                              src={lessonsList[activeLessonIndex].videoUrl}
                              controls
                              className="w-full h-full"
                            />
                          )}
                        </div>
                      )}

                      {/* Text Content */}
                      {lessonsList[activeLessonIndex].content && (
                        <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                          {lessonsList[activeLessonIndex].content}
                        </div>
                      )}

                      {/* External Resource Link */}
                      {lessonsList[activeLessonIndex].externalUrl && (
                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <ExternalLink size={20} className="text-blue-600" />
                            <div>
                              <p className="text-xs font-bold text-blue-900">External Study Resource</p>
                              <p className="text-[11px] text-blue-700 truncate max-w-md">
                                {lessonsList[activeLessonIndex].externalUrl}
                              </p>
                            </div>
                          </div>
                          <a
                            href={lessonsList[activeLessonIndex].externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all"
                          >
                            Open Link
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-xs text-slate-400 py-12">No lesson selected.</p>
                )}

                {/* Bottom Navigation Controls */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4 max-w-3xl mx-auto w-full mt-8">
                  <button
                    onClick={() => setActiveLessonIndex((prev) => Math.max(0, prev - 1))}
                    disabled={activeLessonIndex === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 text-xs font-semibold transition-all"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMarkCompleteAndNext}
                      disabled={markingDone}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                    >
                      {markingDone ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Saving…</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Mark Complete &amp; Next</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: INTERACTIVE QUIZ & ASSESSMENT PLAYER ───────────────────────── */}
      {quizModalOpen && quizData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <HelpCircle size={20} className="text-yellow-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">{quizData.title || 'Course Assessment'}</h3>
                  <p className="text-[11px] text-slate-400">Pass Percentage: {quizData.passPercentage}%</p>
                </div>
              </div>

              <button
                onClick={() => setQuizModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quiz Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {quizResult ? (
                /* Score Result Screen */
                <div className="text-center space-y-6 py-4">
                  <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg ${
                    quizResult.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {quizResult.passed ? <Trophy size={40} /> : <AlertCircle size={40} />}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900">
                      {quizResult.passed ? 'Assessment Passed!' : 'Review Needed'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      You scored <strong className="text-slate-900 font-bold">{quizResult.score}</strong> out of{' '}
                      <strong className="text-slate-900 font-bold">{quizResult.totalPoints}</strong> points ({quizResult.percentage}%)
                    </p>
                  </div>

                  {/* Pass/Fail Banner */}
                  <div className={`p-4 rounded-2xl border text-xs max-w-md mx-auto ${
                    quizResult.passed
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    {quizResult.passed ? (
                      <p className="font-semibold">
                        Outstanding work! You have satisfied the verification criteria for this course. You can now claim your official certificate.
                      </p>
                    ) : (
                      <p className="font-semibold">
                        You need at least {quizResult.passPercentage}% to earn the certificate. Review the lessons and try again!
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    {quizResult.passed && quizCourse && (
                      <button
                        onClick={() => {
                          setQuizModalOpen(false);
                          handleClaimCertificate(quizCourse);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
                      >
                        <Award size={16} />
                        <span>Claim Official Certificate</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setQuizResult(null);
                        setUserAnswers({});
                        setQuizStartTime(Date.now());
                      }}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                /* Question List */
                <div className="space-y-6">
                  {quizData.questions?.map((q: any, qIdx: number) => {
                    const isMulti = q.questionType === 'multiple_answer';
                    const selected = userAnswers[q.id] || [];

                    return (
                      <div key={q.id || qIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900">
                            {qIdx + 1}. {q.questionText}
                          </p>
                          <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                            {q.points || 1} pt{q.points > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {q.options?.map((opt: string, optIdx: number) => {
                            const isChosen = selected.includes(optIdx);
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleToggleAnswer(q.id, optIdx, isMulti)}
                                className={`w-full text-left p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                                  isChosen
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-${isMulti ? 'md' : 'full'} border flex items-center justify-center shrink-0 ${
                                  isChosen ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {isChosen && <Check size={11} />}
                                </span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {!quizResult && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  {Object.keys(userAnswers).length} of {quizData.questions?.length || 0} questions answered
                </span>

                <button
                  onClick={handleSubmitQuiz}
                  disabled={submittingQuiz || Object.keys(userAnswers).length === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-40 shadow-sm"
                >
                  {submittingQuiz ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Grading…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Submit Assessment</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 3: CERTIFICATE PREVIEW & PDF DOWNLOAD ─────────────────────────── */}
      {viewingCert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Award size={22} className="text-yellow-300" />
                <h3 className="text-sm font-bold text-white">Official Certificate of Achievement</h3>
              </div>
              <button
                onClick={() => setViewingCert(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Diploma Card Preview */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-white to-emerald-50/30 border-4 border-double border-emerald-600 shadow-inner text-center space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase">
                    THENIJOBS CAREER ACADEMY
                  </p>
                  <h4 className="text-xl font-black text-slate-900">CERTIFICATE OF ACHIEVEMENT</h4>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] text-slate-500">This certifies that</p>
                  <p className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {viewingCert.seekerName}
                  </p>
                  <div className="w-32 h-0.5 bg-yellow-500 mx-auto" />
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] text-slate-500">has successfully completed the course curriculum in</p>
                  <p className="text-base font-bold text-emerald-700">{viewingCert.courseTitle}</p>
                  {viewingCert.quizScore && (
                    <p className="text-xs font-semibold text-amber-600">
                      Assessment Score: {viewingCert.quizScore}% • Verified Pass
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200">
                  <span>ID: {viewingCert.verificationId}</span>
                  <span className="font-semibold text-emerald-700">Officially Authenticated</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadPdf(viewingCert)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
                >
                  <Download size={15} />
                  <span>Download High-Res PDF</span>
                </button>

                <Link
                  href={`/verify-certificate/${encodeURIComponent(viewingCert.verificationId)}`}
                  target="_blank"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                >
                  <ExternalLink size={14} />
                  <span>Verify Online</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
