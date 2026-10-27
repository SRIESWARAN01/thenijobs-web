'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  GraduationCap, BookOpen, Layers, FileText, HelpCircle, Users2, Award,
  Sparkles, BarChart3, Settings as SettingsIcon, Plus, Search, Filter,
  CheckCircle2, AlertTriangle, Eye, Edit, Trash2, Copy, Download, RefreshCcw,
  Check, X, ChevronRight, PlayCircle, Clock, Globe, ArrowUpDown, ChevronUp, ChevronDown,
  ShieldCheck, AlertCircle, FileSpreadsheet, Lock
} from 'lucide-react';
import { PageHeader, StatGrid, Stat } from '@/components/dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import {
  getCareerGrowthStats, getSkillCategories, createSkillCategory, updateSkillCategory, deleteSkillCategory,
  getCourses, createCourse, updateCourse, publishCourse, unpublishCourse, archiveCourse, duplicateCourse,
  getLearningPaths, createLearningPath, updateLearningPath, deleteLearningPath,
  getLessons, createLesson, updateLesson, deleteLesson, reorderLessons,
  getQuizzes, createQuiz, updateQuiz, deleteQuiz,
  getAllEnrollments, getAllCertificates, revokeCertificate,
  getCareerGrowthSettings, updateCareerGrowthSettings,
} from '@/lib/firebase/careerGrowthService';
import type {
  SkillCategory, Course, LearningPath, Lesson, Quiz, QuizQuestion,
  Enrollment, Certificate, CareerGrowthStats, CareerGrowthSettings
} from '@/lib/types/careerGrowth';

export default function AdminCareerGrowthPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'categories' | 'courses' | 'paths' | 'lessons' | 'quizzes' | 'enrollments' | 'certificates' | 'ai' | 'reports' | 'settings'
  >('overview');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Operational Data
  const [stats, setStats] = useState<CareerGrowthStats>({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalLearningPaths: 0,
    activeEnrollments: 0,
    completedLearningPaths: 0,
    completionPercentage: 0,
    pendingReviews: 0,
    certificatesIssued: 0,
    totalQuizAttempts: 0,
  });

  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [settings, setSettings] = useState<CareerGrowthSettings>({
    enableAIAssistant: true,
    enableCertificates: true,
    enableLearningPaths: true,
    maxEnrollmentsPerSeeker: 10,
    requireQuizForCertificate: true,
    minimumQuizScore: 70,
  });

  // Selected course for lesson / quiz drill-down
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [courseQuizzes, setCourseQuizzes] = useState<Quiz[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [modalMode, setModalMode] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);

  // AI Assistant States
  const [aiType, setAiType] = useState<'course_outline' | 'lesson_content' | 'quiz_questions' | 'career_path' | 'skill_gap_analysis'>('course_outline');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedText, setAiGeneratedText] = useState('');

  // ── 1. Fetch Main Data ───────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, catsData, coursesData, pathsData, enrollsData, certsData, settingsData] = await Promise.all([
        getCareerGrowthStats().catch(() => stats),
        getSkillCategories(false).catch(() => []),
        getCourses().catch(() => []),
        getLearningPaths().catch(() => []),
        getAllEnrollments({ limitCount: 100 }).catch(() => []),
        getAllCertificates(100).catch(() => []),
        getCareerGrowthSettings().catch(() => settings),
      ]);

      setStats(statsData);
      setCategories(catsData);
      setCourses(coursesData);
      setLearningPaths(pathsData);
      setEnrollments(enrollsData);
      setCertificates(certsData);
      setSettings(settingsData);

      if (coursesData.length > 0 && !selectedCourseId) {
        setSelectedCourseId(coursesData[0].id);
      }
    } catch (err: any) {
      console.error('[CareerGrowth] Data load error:', err);
      toast.error('Failed to load career data', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── 2. Fetch Lessons & Quizzes when selectedCourseId changes ────────────────
  const loadCourseSubData = useCallback(async (cId: string) => {
    if (!cId) return;
    try {
      const [lessons, quizzes] = await Promise.all([
        getLessons(cId).catch(() => []),
        getQuizzes(cId).catch(() => []),
      ]);
      setCourseLessons(lessons);
      setCourseQuizzes(quizzes);
    } catch (err) {
      console.warn('[CareerGrowth] Lessons/Quizzes load error:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseSubData(selectedCourseId);
    }
  }, [selectedCourseId, loadCourseSubData]);

  // ── 3. Skill Category CRUD Actions ──────────────────────────────────────────
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = formData.get('name') as string;
    const nameTamil = (formData.get('nameTamil') as string) || '';
    const description = (formData.get('description') as string) || '';
    const iconEmoji = (formData.get('iconEmoji') as string) || '📚';
    const order = Number(formData.get('order')) || categories.length + 1;
    const isActive = formData.get('isActive') === 'on';

    try {
      setActionLoading('save_cat');
      if (editingItem?.id) {
        await updateSkillCategory(editingItem.id, { name, nameTamil, description, iconEmoji, order, isActive });
        toast.success('Category Updated', `${name} has been updated.`);
      } else {
        await createSkillCategory({ name, nameTamil, description, iconEmoji, order, isActive });
        toast.success('Category Created', `${name} added to skill categories.`);
      }
      setModalMode(null);
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      toast.error('Failed to save category', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCategory = async (cat: SkillCategory) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      setActionLoading(`del_cat_${cat.id}`);
      await deleteSkillCategory(cat.id);
      toast.success('Category Deleted', `${cat.name} was removed.`);
      await loadData();
    } catch (err: any) {
      toast.error('Deletion blocked', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ── 4. Course CRUD & Publishing Actions ─────────────────────────────────────
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const title = formData.get('title') as string;
    const shortDescription = (formData.get('shortDescription') as string) || '';
    const fullDescription = (formData.get('fullDescription') as string) || '';
    const categoryId = formData.get('categoryId') as string;
    const difficulty = formData.get('difficulty') as any;
    const duration = (formData.get('duration') as string) || '4 hours';
    const language = formData.get('language') as any;
    const instructorName = (formData.get('instructorName') as string) || 'THENIJOBS Expert';
    const quizRequired = formData.get('quizRequired') === 'on';
    const certificateEligible = formData.get('certificateEligible') === 'on';

    const selectedCategory = categories.find(c => c.id === categoryId);

    try {
      setActionLoading('save_course');
      if (editingItem?.id) {
        await updateCourse(editingItem.id, {
          title, shortDescription, fullDescription, categoryId,
          categoryName: selectedCategory?.name || '', difficulty, duration, language,
          instructorName, quizRequired, certificateEligible
        });
        toast.success('Course Updated', `${title} updated.`);
      } else {
        await createCourse({
          title, shortDescription, fullDescription, categoryId,
          categoryName: selectedCategory?.name || '', difficulty, duration, language,
          instructorName, quizRequired, certificateEligible,
          lessonCount: 0, status: 'draft', visibility: 'public', tags: [],
          learningObjectives: ['Gain practical career skills', 'Prepare for job interviews'],
          prerequisites: ['Basic familiarity with the subject'],
          createdBy: currentUser?.uid || 'admin'
        });
        toast.success('Course Created', `${title} created as draft.`);
      }
      setModalMode(null);
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      toast.error('Course save failed', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishCourse = async (course: Course) => {
    try {
      setActionLoading(`pub_${course.id}`);
      await publishCourse(course.id);
      toast.success('Course Published! 🚀', `${course.title} is now public and open for enrollments.`);
      await loadData();
    } catch (err: any) {
      toast.error('Cannot publish course', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublishCourse = async (course: Course) => {
    try {
      setActionLoading(`unpub_${course.id}`);
      await unpublishCourse(course.id);
      toast.success('Course Unpublished', `${course.title} set to unpublished.`);
      await loadData();
    } catch (err: any) {
      toast.error('Failed to unpublish', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicateCourse = async (course: Course) => {
    try {
      setActionLoading(`dup_${course.id}`);
      const newId = await duplicateCourse(course.id);
      toast.success('Course Duplicated', `Created a copy of ${course.title} with a fresh slug.`);
      await loadData();
      setSelectedCourseId(newId);
    } catch (err: any) {
      toast.error('Duplication failed', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ── 5. Lesson CRUD Actions ──────────────────────────────────────────────────
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) { toast.error('Select course first'); return; }
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const title = formData.get('title') as string;
    const description = (formData.get('description') as string) || '';
    const type = formData.get('type') as any;
    const content = (formData.get('content') as string) || '';
    const videoUrl = (formData.get('videoUrl') as string) || '';
    const externalUrl = (formData.get('externalUrl') as string) || '';
    const estimatedMinutes = Number(formData.get('estimatedMinutes')) || 15;
    const isRequired = formData.get('isRequired') === 'on';
    const status = formData.get('status') as any;

    try {
      setActionLoading('save_lesson');
      if (editingItem?.id) {
        await updateLesson(editingItem.id, {
          title, description, type, content, videoUrl, externalUrl, estimatedMinutes, isRequired, status
        });
        toast.success('Lesson Updated', `${title} updated.`);
      } else {
        await createLesson({
          courseId: selectedCourseId,
          title, description, type, content, videoUrl, externalUrl,
          order: courseLessons.length + 1, estimatedMinutes, isRequired,
          completionCriteria: type === 'quiz' ? 'quiz_pass' : 'view',
          status: status || 'published',
          createdBy: currentUser?.uid || 'admin'
        });
        toast.success('Lesson Added', `${title} added to course.`);
      }
      setModalMode(null);
      setEditingItem(null);
      await loadCourseSubData(selectedCourseId);
    } catch (err: any) {
      toast.error('Lesson save failed', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteLesson = async (lId: string) => {
    if (!confirm('Are you sure you want to remove this lesson?')) return;
    try {
      setActionLoading(`del_les_${lId}`);
      await deleteLesson(lId);
      toast.success('Lesson Deleted', 'Lesson removed from course.');
      await loadCourseSubData(selectedCourseId);
    } catch (err: any) {
      toast.error('Deletion failed', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReorderLesson = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= courseLessons.length) return;

    const newLessons = [...courseLessons];
    const temp = newLessons[index];
    newLessons[index] = newLessons[targetIndex];
    newLessons[targetIndex] = temp;

    try {
      setCourseLessons(newLessons);
      await reorderLessons(selectedCourseId, newLessons.map(l => l.id));
      toast.success('Lessons Reordered', 'Order updated successfully.');
    } catch (err: any) {
      toast.error('Reorder failed', err.message);
      await loadCourseSubData(selectedCourseId);
    }
  };

  // ── 6. Quiz CRUD Actions ────────────────────────────────────────────────────
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) { toast.error('Select course first'); return; }
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const title = formData.get('title') as string;
    const description = (formData.get('description') as string) || '';
    const passPercentage = Number(formData.get('passPercentage')) || 70;
    const timeLimitMinutes = Number(formData.get('timeLimitMinutes')) || 15;
    const maxAttempts = Number(formData.get('maxAttempts')) || 3;
    const status = formData.get('status') as any;

    try {
      setActionLoading('save_quiz');
      // Create initial sample questions if brand new quiz
      const initialQuestions: QuizQuestion[] = [
        {
          id: 'q1',
          questionText: 'What is the primary objective of this module?',
          questionType: 'multiple_choice',
          options: ['Practical application of concepts', 'Only theoretical study', 'Memorization', 'None of the above'],
          correctAnswers: [0],
          points: 1,
          order: 1,
          explanation: 'Focus is on practical real-world skills.'
        },
        {
          id: 'q2',
          questionText: 'Is continuous skill development vital for career promotions in Theni District?',
          questionType: 'true_false',
          options: ['True', 'False'],
          correctAnswers: [0],
          points: 1,
          order: 2,
          explanation: 'Continuous learning directly unlocks better job matches.'
        }
      ];

      if (editingItem?.id) {
        await updateQuiz(editingItem.id, {
          title, description, passPercentage, timeLimitMinutes, maxAttempts, status
        });
        toast.success('Quiz Updated', `${title} updated.`);
      } else {
        await createQuiz({
          courseId: selectedCourseId,
          title, description, passPercentage, timeLimitMinutes, maxAttempts,
          randomizeQuestions: false, status: status || 'published',
          questions: initialQuestions,
          createdBy: currentUser?.uid || 'admin'
        });
        toast.success('Quiz Created', `${title} created with baseline questions.`);
      }
      setModalMode(null);
      setEditingItem(null);
      await loadCourseSubData(selectedCourseId);
    } catch (err: any) {
      toast.error('Quiz save failed', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ── 7. AI Assistant Call ────────────────────────────────────────────────────
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) { toast.error('Please enter a prompt'); return; }
    try {
      setAiLoading(true);
      setAiGeneratedText('');
      const res = await fetch('/api/career-growth/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.uid || 'admin'}`,
        },
        body: JSON.stringify({
          contentType: aiType,
          prompt: aiPrompt,
          context: aiContext,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI generation failed');

      setAiGeneratedText(data.generatedContent);
      toast.success('AI Draft Generated! ✨', 'Content draft created and saved to review registry.');
    } catch (err: any) {
      toast.error('AI Assistant Error', err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // ── 8. Export CSV Report ────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (enrollments.length === 0) {
      toast.error('No enrollment data to export');
      return;
    }
    const headers = ['Enrollment ID', 'Student Name', 'Email', 'Course Title', 'Progress %', 'Status', 'Quiz Score', 'Certificate Eligible', 'Enrolled Date'];
    const rows = enrollments.map(e => [
      e.id,
      `"${e.seekerName || 'Student'}"`,
      `"${e.seekerEmail || ''}"`,
      `"${e.courseTitle || 'Course'}"`,
      e.progressPercentage || 0,
      e.status,
      e.bestQuizScore || 'N/A',
      e.certificateEligible ? 'Yes' : 'No',
      e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('en-IN') : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `THENIJOBS_Enrollments_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report Exported 📊', 'Enrollment report downloaded as CSV.');
  };

  // ── Filtered Courses ────────────────────────────────────────────────────────
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.instructorName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || c.categoryId === categoryFilter;
      const matchStat = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchCat && matchStat;
    });
  }, [courses, searchQuery, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Career Growth & Skill Development"
        description="Comprehensive management portal for skill categories, video/text courses, quizzes, learning paths, learner progress, and certificates."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Career Growth' }]}
      />

      {/* ─── 1. REAL AUTHORITATIVE STATISTICS (REQUIREMENT 3) ────────────────── */}
      <StatGrid columns={4}>
        <Stat
          label="Published Courses"
          value={stats.publishedCourses}
          icon={BookOpen}
          tone="emerald"
          loading={loading}
        />
        <Stat
          label="Draft Courses"
          value={stats.draftCourses}
          icon={FileText}
          tone="blue"
          loading={loading}
        />
        <Stat
          label="Active Enrollments"
          value={stats.activeEnrollments}
          icon={Users2}
          tone="violet"
          loading={loading}
        />
        <Stat
          label="Certificates Issued"
          value={stats.certificatesIssued}
          icon={Award}
          tone="amber"
          loading={loading}
        />
      </StatGrid>

      {/* ─── 2. TAB NAVIGATION ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 mt-4 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'categories', label: `Categories (${categories.length})`, icon: Layers },
          { id: 'courses', label: `Courses (${courses.length})`, icon: BookOpen },
          { id: 'paths', label: `Learning Paths (${learningPaths.length})`, icon: GraduationCap },
          { id: 'lessons', label: 'Lessons', icon: PlayCircle },
          { id: 'quizzes', label: 'Quizzes & Tests', icon: HelpCircle },
          { id: 'enrollments', label: `Enrollments (${enrollments.length})`, icon: Users2 },
          { id: 'certificates', label: `Certificates (${certificates.length})`, icon: Award },
          { id: 'ai', label: 'AI Content Assistant', icon: Sparkles, accent: true },
          { id: 'reports', label: 'Reports & CSV', icon: FileSpreadsheet },
          { id: 'settings', label: 'Settings', icon: SettingsIcon },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? tab.accent
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600 shadow-xs'
                    : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
              }`}
            >
              <Icon size={14} className={tab.accent && !isActive ? 'text-purple-600' : ''} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: OVERVIEW DASHBOARD ───────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completion Rate</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.completionPercentage}%</span>
                <span className="text-xs text-emerald-600 font-bold">Of enrolled learners</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.completionPercentage)}%` }}
                />
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Learning Paths Enrolled</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.totalLearningPaths}</span>
                <span className="text-xs text-indigo-600 font-bold">Career paths designed</span>
              </div>
              <p className="text-xs text-slate-500">Frontend, Backend, Accounts, Digital Marketing, Office Admin.</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Quiz Submissions</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.totalQuizAttempts}</span>
                <span className="text-xs text-blue-600 font-bold">Evaluated server-side</span>
              </div>
              <p className="text-xs text-slate-500">Zero client-side score tampering allowed.</p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl text-white space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-400" /> Career Growth Quick Admin Actions
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Create structured vocational and technological curricula to empower job seekers in Theni and surrounding districts.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() => { setEditingItem(null); setModalMode('create_course'); }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} /> New Course
              </button>
              <button
                onClick={() => { setEditingItem(null); setModalMode('create_cat'); }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Layers size={14} /> New Category
              </button>
              <button
                onClick={() => { setEditingItem(null); setModalMode('create_path'); }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <GraduationCap size={14} /> New Career Path
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
              >
                <Sparkles size={14} /> Launch AI Content Assistant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SKILL CATEGORIES ─────────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Skill Categories</h3>
              <p className="text-xs text-slate-500">Categories organize courses and power job seeker filtering.</p>
            </div>
            <button
              onClick={() => { setEditingItem(null); setModalMode('create_cat'); }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={14} /> Add Category
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
              <Layers size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No skill categories created yet</p>
              <p className="text-xs mt-1">Create categories like Technical Skills, Accounts, Communication, or Digital Marketing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 relative group">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{cat.iconEmoji || '📚'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      cat.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                    {cat.nameTamil && <p className="text-xs text-slate-400 font-medium">{cat.nameTamil}</p>}
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description || 'No description'}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Order: <strong>{cat.order}</strong></span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingItem(cat); setModalMode('create_cat'); }}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                        title="Edit category"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: COURSES MANAGEMENT ───────────────────────────────────────── */}
      {activeTab === 'courses' && (
        <div className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Courses Directory</h3>
              <p className="text-xs text-slate-500">Create, publish, preview, and archive skill development courses.</p>
            </div>
            <button
              onClick={() => { setEditingItem(null); setModalMode('create_course'); }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus size={14} /> Create Course
            </button>
          </div>

          {/* Filters Bar */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search course title or instructor…"
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="unpublished">Unpublished</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
              <BookOpen size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No courses found matching filter</p>
              <p className="text-xs mt-1">Click "Create Course" to add a new curriculum.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Difficulty</th>
                      <th className="py-3 px-3">Duration</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center">Lessons</th>
                      <th className="py-3 px-3 text-center">Enrolled</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCourses.map(course => (
                      <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                          <div>
                            <span className="font-bold text-slate-900">{course.title}</span>
                            <span className="block text-[10px] text-slate-400 font-normal truncate mt-0.5">
                              By {course.instructorName || 'THENIJOBS'} · {course.language?.toUpperCase() || 'BOTH'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{course.categoryName || 'General'}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                            {course.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{course.duration}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            course.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            course.status === 'draft' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {course.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">{course.lessonCount || 0}</td>
                        <td className="py-3 px-3 text-center font-bold text-blue-600">{course.enrollmentCount || 0}</td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          {course.status === 'published' ? (
                            <button
                              onClick={() => handleUnpublishCourse(course)}
                              className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-amber-700 text-[11px] font-bold cursor-pointer"
                              title="Unpublish course"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublishCourse(course)}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                              title="Publish course"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedCourseId(course.id); setActiveTab('lessons'); }}
                            className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold cursor-pointer"
                            title="Manage lessons"
                          >
                            Lessons
                          </button>
                          <button
                            onClick={() => handleDuplicateCourse(course)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer inline-block"
                            title="Duplicate course"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            onClick={() => { setEditingItem(course); setModalMode('create_course'); }}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer inline-block"
                            title="Edit course details"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => setPreviewCourse(course)}
                            className="p-1 rounded-lg hover:bg-blue-50 text-blue-600 cursor-pointer inline-block"
                            title="Preview course"
                          >
                            <Eye size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: LEARNING PATHS ───────────────────────────────────────────── */}
      {activeTab === 'paths' && (
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Career Learning Paths</h3>
              <p className="text-xs text-slate-500">Group multiple courses into guided career milestones (e.g. Frontend Developer, Accountant).</p>
            </div>
            <button
              onClick={() => { setEditingItem(null); setModalMode('create_path'); }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={14} /> New Learning Path
            </button>
          </div>

          {learningPaths.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
              <GraduationCap size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No learning paths created yet</p>
              <p className="text-xs mt-1">Combine relevant courses into end-to-end vocational career paths.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {learningPaths.map(path => (
                <div key={path.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] uppercase">
                      {path.careerGoal || 'Career Goal'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      path.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {path.status.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{path.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{path.description || 'Guided career roadmap'}</p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>{path.courses?.length || 0} Courses</span>
                    <span>{path.estimatedDuration || '20 hours'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: LESSONS MANAGEMENT ───────────────────────────────────────── */}
      {activeTab === 'lessons' && (
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Select Course:</label>
              <select
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-bold"
              >
                {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.status})</option>)}
              </select>
            </div>

            <button
              onClick={() => { setEditingItem(null); setModalMode('create_lesson'); }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={14} /> Add Lesson
            </button>
          </div>

          {courseLessons.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
              <PlayCircle size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No lessons for this course yet</p>
              <p className="text-xs mt-1">Add text, video, document, or practical assignment lessons.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
              {courseLessons.map((lesson, idx) => (
                <div key={lesson.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {lesson.order || idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{lesson.title}</h4>
                      <p className="text-[11px] text-slate-400">
                        Type: <span className="font-semibold text-slate-600 uppercase">{lesson.type}</span> · {lesson.estimatedMinutes} mins · {lesson.isRequired ? 'Mandatory' : 'Optional'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleReorderLesson(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => handleReorderLesson(idx, 'down')}
                      disabled={idx === courseLessons.length - 1}
                      className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      onClick={() => { setEditingItem(lesson); setModalMode('create_lesson'); }}
                      className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                      title="Edit lesson"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="p-1 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer"
                      title="Delete lesson"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 6: QUIZZES & ASSESSMENTS ────────────────────────────────────── */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Select Course:</label>
              <select
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-bold"
              >
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            <button
              onClick={() => { setEditingItem(null); setModalMode('create_quiz'); }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={14} /> Create Assessment
            </button>
          </div>

          {courseQuizzes.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
              <HelpCircle size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No quizzes configured for this course</p>
              <p className="text-xs mt-1">Create an assessment to validate learner comprehension and issue certificates.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courseQuizzes.map(quiz => (
                <div key={quiz.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{quiz.title}</h4>
                      <p className="text-xs text-slate-500">{quiz.description || 'Module final assessment'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                      Pass: {quiz.passPercentage}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <span>Questions: <strong>{quiz.questions?.length || 0}</strong></span>
                    <span>Time Limit: <strong>{quiz.timeLimitMinutes} mins</strong></span>
                    <span>Max Attempts: <strong>{quiz.maxAttempts || 'Unlimited'}</strong></span>
                    <span>Status: <strong>{quiz.status.toUpperCase()}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 7: ENROLLMENTS & PROGRESS ───────────────────────────────────── */}
      {activeTab === 'enrollments' && (
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Job Seeker Enrollments</h3>
              <p className="text-xs text-slate-500">Track active learner progress, quiz attempts, and course completions in real-time.</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" /> Export CSV Report
            </button>
          </div>

          {enrollments.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
              <Users2 size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No learner enrollments yet</p>
              <p className="text-xs mt-1">When job seekers enroll in published courses, their progress appears here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-3">Course</th>
                      <th className="py-3 px-3">Progress</th>
                      <th className="py-3 px-3 text-center">Quiz Score</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Enrolled Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrollments.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{e.seekerName || 'Student'}</span>
                          <span className="text-[10px] text-slate-400">{e.seekerEmail || 'No email'}</span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">{e.courseTitle || 'Course'}</td>
                        <td className="py-3 px-3 min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(100, e.progressPercentage || 0)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600">{e.progressPercentage || 0}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {e.bestQuizScore ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {e.bestQuizScore}%
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">None</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            e.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {e.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">
                          {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 8: CERTIFICATES ─────────────────────────────────────────────── */}
      {activeTab === 'certificates' && (
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Issued Certificates Registry</h3>
              <p className="text-xs text-slate-500">Verifiable credentials issued upon complete course &amp; quiz completion.</p>
            </div>
          </div>

          {certificates.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
              <Award size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No certificates issued yet</p>
              <p className="text-xs mt-1">Certificates are automatically issued when students achieve 100% completion and pass assessments.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {certificates.map(cert => (
                <div key={cert.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {cert.verificationId}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      cert.status === 'issued' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {cert.status.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{cert.seekerName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{cert.courseTitle}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Issued: {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-IN') : 'Verified'}</span>
                    <Link
                      href={`/verify-certificate/${cert.verificationId}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                    >
                      <Eye size={12} /> Verify
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 9: AI CONTENT ASSISTANT ─────────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div className="space-y-4 mt-4 max-w-4xl">
          <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl border border-purple-200/80 space-y-2">
            <span className="px-3 py-1 rounded-full bg-purple-200 text-purple-900 text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1">
              <Sparkles size={12} /> Gemini &amp; Groq AI Engine
            </span>
            <h3 className="text-base font-bold text-purple-950">AI Career Content Generator</h3>
            <p className="text-xs text-purple-800">
              Draft comprehensive curricula, lesson text, quiz question banks, and localized vocational career paths in seconds.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Content Type</label>
                <select
                  value={aiType}
                  onChange={e => setAiType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                >
                  <option value="course_outline">Course Outline (6-10 Lessons)</option>
                  <option value="lesson_content">Full Lesson Text &amp; Practical Notes</option>
                  <option value="quiz_questions">5 Quiz Questions (MCQ Bank with Answers)</option>
                  <option value="career_path">End-to-End Career Roadmap</option>
                  <option value="skill_gap_analysis">Skill Gap Analysis &amp; Recommendations</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subject / Skill Topic</label>
                <input
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. Modern Web Development with React & Next.js or Tally Prime GST"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Context / Audience (Optional)</label>
              <input
                value={aiContext}
                onChange={e => setAiContext(e.target.value)}
                placeholder="e.g. Freshers in Theni district, targeting entry-level accounting or software roles."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={aiLoading || !aiPrompt.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {aiLoading ? <RefreshCcw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>{aiLoading ? 'Generating with AI…' : 'Generate Draft Content'}</span>
              </button>
            </div>

            {aiGeneratedText && (
              <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">AI Generated Draft (Saved to Review Queue)</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiGeneratedText);
                      toast.success('Copied to Clipboard');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {aiGeneratedText}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 10: REPORTS & CSV ───────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-4 mt-4">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Analytics &amp; Compliance Reports</h3>
            <p className="text-xs text-slate-500">
              Download verified audit logs of learner enrollment, completion rates, and assessment performance across all Theni taluks.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase">Total Learners Enrolled</span>
                <p className="text-2xl font-black text-slate-900">{stats.activeEnrollments + stats.completedLearningPaths}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase">Active Courses Catalog</span>
                <p className="text-2xl font-black text-emerald-700">{stats.publishedCourses}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase">Issued Certificates</span>
                <p className="text-2xl font-black text-amber-600">{stats.certificatesIssued}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={handleExportCSV}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Download size={14} /> Download Full Enrollment Report (.CSV)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 11: SETTINGS ────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="space-y-4 mt-4 max-w-2xl">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Career Growth Platform Settings</h3>
            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableAIAssistant}
                  onChange={e => setSettings({ ...settings, enableAIAssistant: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-bold text-slate-800">Enable AI Content Assistant for Administrators</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableCertificates}
                  onChange={e => setSettings({ ...settings, enableCertificates: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-bold text-slate-800">Enable Automated Certificate Issuance on 100% Completion</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireQuizForCertificate}
                  onChange={e => setSettings({ ...settings, requireQuizForCertificate: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="font-bold text-slate-800">Require Assessment Pass to Unlock Certificate</span>
              </label>

              <div className="pt-2">
                <label className="font-bold text-slate-700 block mb-1">Minimum Assessment Pass Score (%)</label>
                <input
                  type="number"
                  value={settings.minimumQuizScore}
                  onChange={e => setSettings({ ...settings, minimumQuizScore: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  min={50}
                  max={100}
                />
              </div>

              <div className="pt-2">
                <label className="font-bold text-slate-700 block mb-1">Max Active Enrollments per Job Seeker</label>
                <input
                  type="number"
                  value={settings.maxEnrollmentsPerSeeker}
                  onChange={e => setSettings({ ...settings, maxEnrollmentsPerSeeker: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  min={1}
                  max={50}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await updateCareerGrowthSettings(settings, currentUser?.uid || 'admin');
                      toast.success('Settings Saved', 'Platform settings updated.');
                    } catch (err: any) {
                      toast.error('Save failed', err.message);
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT CATEGORY ───────────────────────────────────── */}
      {modalMode === 'create_cat' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Skill Category' : 'Create Skill Category'}
              </h3>
              <button onClick={() => setModalMode(null)} className="p-1 rounded-xl hover:bg-slate-100 cursor-pointer text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Name (English) *</label>
                <input
                  name="name"
                  defaultValue={editingItem?.name || ''}
                  required
                  placeholder="e.g. Accounting & Finance"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Name (Tamil)</label>
                <input
                  name="nameTamil"
                  defaultValue={editingItem?.nameTamil || ''}
                  placeholder="e.g. கணக்கியல் மற்றும் நிதி"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Icon Emoji</label>
                  <input
                    name="iconEmoji"
                    defaultValue={editingItem?.iconEmoji || '📚'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Display Order</label>
                  <input
                    type="number"
                    name="order"
                    defaultValue={editingItem?.order || categories.length + 1}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Skills, competencies and career pathways covered…"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editingItem ? editingItem.isActive : true}
                  className="rounded text-blue-600"
                />
                <span className="font-bold text-slate-800">Active (Visible in Course Filters)</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'save_cat'}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {actionLoading === 'save_cat' ? 'Saving…' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT COURSE ─────────────────────────────────────── */}
      {modalMode === 'create_course' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Course' : 'Create New Course'}
              </h3>
              <button onClick={() => setModalMode(null)} className="p-1 rounded-xl hover:bg-slate-100 cursor-pointer text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Course Title *</label>
                <input
                  name="title"
                  defaultValue={editingItem?.title || ''}
                  required
                  placeholder="e.g. Tally Prime with GST for Local Businesses"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Skill Category *</label>
                  <select
                    name="categoryId"
                    defaultValue={editingItem?.categoryId || categories[0]?.id || ''}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Difficulty Level</label>
                  <select
                    name="difficulty"
                    defaultValue={editingItem?.difficulty || 'beginner'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Duration</label>
                  <input
                    name="duration"
                    defaultValue={editingItem?.duration || '4 hours'}
                    placeholder="e.g. 6 hours"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Language</label>
                  <select
                    name="language"
                    defaultValue={editingItem?.language || 'both'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="tamil">Tamil (தமிழ்)</option>
                    <option value="english">English</option>
                    <option value="both">Tamil &amp; English</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Instructor</label>
                  <input
                    name="instructorName"
                    defaultValue={editingItem?.instructorName || 'THENIJOBS Academy'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Short Description *</label>
                <textarea
                  name="shortDescription"
                  defaultValue={editingItem?.shortDescription || ''}
                  rows={2}
                  required
                  placeholder="Summary displayed on course cards…"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Curriculum Description</label>
                <textarea
                  name="fullDescription"
                  defaultValue={editingItem?.fullDescription || ''}
                  rows={4}
                  placeholder="In-depth details of what learners will master…"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-sans"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="quizRequired"
                    defaultChecked={editingItem ? editingItem.quizRequired : true}
                    className="rounded text-blue-600"
                  />
                  <span className="font-bold text-slate-800">Requires Quiz to Complete</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="certificateEligible"
                    defaultChecked={editingItem ? editingItem.certificateEligible : true}
                    className="rounded text-blue-600"
                  />
                  <span className="font-bold text-slate-800">Issues Certificate</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'save_course'}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {actionLoading === 'save_course' ? 'Saving…' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT LESSON ─────────────────────────────────────── */}
      {modalMode === 'create_lesson' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Lesson' : 'Add Lesson to Course'}
              </h3>
              <button onClick={() => setModalMode(null)} className="p-1 rounded-xl hover:bg-slate-100 cursor-pointer text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lesson Title *</label>
                <input
                  name="title"
                  defaultValue={editingItem?.title || ''}
                  required
                  placeholder="e.g. GST Purchase Entries & Tax Invoices"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lesson Type *</label>
                  <select
                    name="type"
                    defaultValue={editingItem?.type || 'video'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="video">Video Lesson (YouTube / MP4)</option>
                    <option value="text">Rich Text &amp; Reading</option>
                    <option value="document">PDF Document / Resource</option>
                    <option value="external_resource">External Learning Link</option>
                    <option value="assignment">Practical Exercise / Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Duration (mins)</label>
                  <input
                    type="number"
                    name="estimatedMinutes"
                    defaultValue={editingItem?.estimatedMinutes || 20}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Video Embed URL (Optional)</label>
                <input
                  name="videoUrl"
                  defaultValue={editingItem?.videoUrl || ''}
                  placeholder="e.g. https://www.youtube.com/embed/... or direct MP4"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">External Resource URL (Optional)</label>
                <input
                  name="externalUrl"
                  defaultValue={editingItem?.externalUrl || ''}
                  placeholder="e.g. https://gst.gov.in/doc"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lesson Content / Notes (Markdown supported)</label>
                <textarea
                  name="content"
                  defaultValue={editingItem?.content || ''}
                  rows={5}
                  placeholder="Lesson instructions, notes, bullet points, key takeaways…"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isRequired"
                    defaultChecked={editingItem ? editingItem.isRequired : true}
                    className="rounded text-blue-600"
                  />
                  <span className="font-bold text-slate-800">Mandatory for Course Completion</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'save_lesson'}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {actionLoading === 'save_lesson' ? 'Saving…' : 'Save Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: PREVIEW COURSE ───────────────────────────────────────────── */}
      {previewCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold uppercase">
                {previewCourse.categoryName || 'General'}
              </span>
              <button onClick={() => setPreviewCourse(null)} className="p-1 rounded-xl hover:bg-slate-100 cursor-pointer text-slate-400">
                <X size={18} />
              </button>
            </div>

            <h3 className="text-lg font-black text-slate-900">{previewCourse.title}</h3>
            <p className="text-xs text-slate-600">{previewCourse.shortDescription}</p>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">Difficulty</span>
                <strong className="capitalize">{previewCourse.difficulty}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Duration</span>
                <strong>{previewCourse.duration}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Lessons</span>
                <strong>{previewCourse.lessonCount || 0} Lessons</strong>
              </div>
            </div>

            {previewCourse.learningObjectives?.length > 0 && (
              <div className="space-y-1.5 text-xs text-slate-700">
                <strong className="text-slate-900 block text-xs">What you will learn:</strong>
                {previewCourse.learningObjectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setPreviewCourse(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
