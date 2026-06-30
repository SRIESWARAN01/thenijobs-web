'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, CheckCircle2, Award, Award as AwardIcon, Sparkles, BookOpen } from 'lucide-react';
import { useEnrollment, useCourseContent, useGamification } from '@/hooks/useLMS';
import { markLessonComplete, getQuiz, submitQuizAttempt, addXP, updateStreak, createLMSNotification, generateCertificate } from '@/lib/firebase/lmsService';
import LessonSidebar from '@/components/academy/LessonSidebar';
import YouTubePlayer from '@/components/academy/YouTubePlayer';
import QuizEngine from '@/components/academy/QuizEngine';
import { syncCourseToProfile } from '@/lib/firebase/lmsService';
import type { Lesson, Quiz } from '@/lib/types/lms';
import { useAuth } from '@/hooks/useAuth';

export default function CourseLearningPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;
  const { user } = useAuth();

  const { enrollment, loading: enrollLoading } = useEnrollment(courseId);
  const { modules, totalLessons, loading: contentLoading } = useCourseContent(courseId);
  
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeQuizModuleId, setActiveQuizModuleId] = useState<string | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Confetti / Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [generatedCertId, setGeneratedCertId] = useState<string | null>(null);

  // Derive completed lessons from enrollment
  const completedLessons = enrollment?.progress?.completedLessons || [];

  // Automatically pick the first incomplete lesson on load
  useEffect(() => {
    if (modules.length > 0 && enrollment && !activeLesson && !activeQuiz) {
      // Find current active lesson from enrollment, or first incomplete
      const currentLessonId = enrollment.progress?.currentLessonId;
      let found = false;

      for (const mod of modules) {
        const lesson = mod.lessons.find(l => l.id === currentLessonId);
        if (lesson) {
          setActiveLesson(lesson);
          found = true;
          break;
        }
      }

      if (!found) {
        // Fallback to first incomplete
        for (const mod of modules) {
          const incomplete = mod.lessons.find(l => !completedLessons.includes(l.id));
          if (incomplete) {
            setActiveLesson(incomplete);
            found = true;
            break;
          }
        }
      }

      if (!found && modules[0]?.lessons[0]) {
        // All completed, pick first
        setActiveLesson(modules[0].lessons[0]);
      }
    }
  }, [modules, enrollment, activeLesson, activeQuiz, completedLessons]);

  const handleSelectLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setActiveQuiz(null);
    setActiveQuizModuleId(null);
  };

  const handleSelectQuiz = async (moduleId: string, quizId: string) => {
    setQuizLoading(true);
    try {
      const q = await getQuiz(quizId);
      if (q) {
        setActiveQuiz(q);
        setActiveQuizModuleId(moduleId);
        setActiveLesson(null);
      }
    } catch (err) {
      console.error('Error fetching quiz:', err);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleLessonComplete = async () => {
    if (!enrollment || !activeLesson) return;
    setActionLoading(true);

    try {
      const { progressPercent, courseCompleted } = await markLessonComplete(
        enrollment.id,
        activeLesson.id,
        courseId,
        totalLessons
      );

      // Award XP
      await addXP(enrollment.userId, 10, `Completed lesson: ${activeLesson.title}`);
      await updateStreak(enrollment.userId);

      if (courseCompleted) {
        handleCourseCompletion();
      } else {
        // Automatically unlock or transition to next item
        unlockNextItem();
      }
    } catch (err) {
      console.error('Error completing lesson:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuizSubmit = async (score: number, passed: boolean, answers: Record<string, number>) => {
    if (!enrollment || !activeQuiz || !activeQuizModuleId) return;

    try {
      await submitQuizAttempt(enrollment.id, activeQuiz.id, answers, score, passed);

      if (passed) {
        await addXP(enrollment.userId, 25, `Passed assessment: ${activeQuiz.title}`);
        
        // Check if this was the last module quiz (meaning course is complete)
        const isLastModule = modules[modules.length - 1].id === activeQuizModuleId;
        const allLessonsFinished = modules.every(m => m.lessons.every(l => completedLessons.includes(l.id)));
        
        if (isLastModule && allLessonsFinished) {
          handleCourseCompletion();
        } else {
          unlockNextItem();
        }
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
    }
  };

  const unlockNextItem = () => {
    // Find next lesson or quiz
    let currentFound = false;
    for (const mod of modules) {
      for (const lesson of mod.lessons) {
        if (currentFound) {
          setActiveLesson(lesson);
          setActiveQuiz(null);
          setActiveQuizModuleId(null);
          return;
        }
        if (activeLesson && lesson.id === activeLesson.id) {
          currentFound = true;
        }
      }
      if (currentFound && mod.quizId) {
        // Load quiz
        handleSelectQuiz(mod.id, mod.quizId);
        return;
      }
    }
  };

  const handleCourseCompletion = async () => {
    if (!enrollment || !user) return;
    setShowCompletionModal(true);

    try {
      // Award Course Completion XP
      await addXP(enrollment.userId, 100, `Completed Course: ${enrollment.courseName}`);

      // Generate certificate
      const cert = await generateCertificate(
        enrollment.userId,
        courseId,
        enrollment.id,
        user.displayName || user.email?.split('@')[0] || 'Graduate',
        user.photoURL || '',
        enrollment.courseName,
        'default'
      );
      setGeneratedCertId(cert.id);

      // Auto-sync completed course, earned skills & cert details to Seeker Profile
      const earnedSkills = modules.reduce((acc, m) => {
        m.lessons.forEach(l => {
          // extract skill tags from lesson data if any
        });
        return acc;
      }, [] as string[]);

      await syncCourseToProfile(
        enrollment.userId,
        {
          courseId,
          courseName: enrollment.courseName,
          completedAt: new Date(),
          certificateId: cert.id,
        },
        earnedSkills,
        {
          certificateId: cert.id,
          courseName: enrollment.courseName,
          issuedAt: new Date(),
        }
      );

      // Trigger Notification
      await createLMSNotification(
        enrollment.userId,
        'certificate_ready',
        'Academy Graduation!',
        `Your certificate for "${enrollment.courseName}" has been successfully issued.`,
        `/academy/certificate/${cert.id}`
      );
    } catch (err) {
      console.error('Completion workflow error:', err);
    }
  };

  const quizStatusMap: Record<string, { passed: boolean }> = {};
  if (enrollment?.quizAttempts) {
    Object.entries(enrollment.quizAttempts).forEach(([quizId, attempt]) => {
      quizStatusMap[quizId] = { passed: !!attempt.passedAt };
    });
  }

  if (enrollLoading || contentLoading) {
    return (
      <div className="min-h-screen bg-[#070714] text-white flex flex-col items-center justify-center font-outfit">
        <Loader2 className="animate-spin text-violet-400 mb-2" size={36} />
        <p className="text-sm text-gray-400">Syncing learning progress...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070714] text-white font-outfit pb-16 flex flex-col">
      {/* Top Sticky Progress bar */}
      <div className="sticky top-0 z-40 bg-[#070714]/90 backdrop-blur-md border-b border-white/[0.06] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/academy/${courseId}`} className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white line-clamp-1">{enrollment?.courseName}</h1>
            <p className="text-[10px] text-gray-500">Course Learning Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-gray-500 uppercase block font-bold">Progress</span>
            <span className="text-xs font-bold text-violet-400">{enrollment?.progressPercent || 0}% Completed</span>
          </div>
          <div className="w-24 h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all" style={{ width: `${enrollment?.progressPercent || 0}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 mt-6 grid lg:grid-cols-4 gap-6">
        {/* Left Lesson Navigation Sidebar */}
        <div className="lg:col-span-1 h-fit lg:sticky lg:top-24 max-h-[80vh] overflow-y-auto pr-1">
          <LessonSidebar
            modules={modules}
            completedLessons={completedLessons}
            activeLessonId={activeLesson?.id || ''}
            onSelectLesson={handleSelectLesson}
            onSelectQuiz={handleSelectQuiz}
            activeQuizModuleId={activeQuizModuleId}
            quizStatusMap={quizStatusMap}
          />
        </div>

        {/* Center Main video/content workspace */}
        <div className="lg:col-span-3 space-y-6">
          {activeLesson ? (
            <div className="space-y-4">
              <div className="border border-white/[0.05] bg-white/[0.01] rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded uppercase font-black tracking-widest inline-block">
                      Lesson Type: {activeLesson.type}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-1.5">{activeLesson.title}</h2>
                  </div>
                  {completedLessons.includes(activeLesson.id) ? (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Completed
                    </span>
                  ) : (
                    <button
                      disabled={actionLoading}
                      onClick={handleLessonComplete}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-40"
                    >
                      Mark Lesson Done
                    </button>
                  )}
                </div>

                {activeLesson.type === 'video' && activeLesson.youtubeVideoId ? (
                  <YouTubePlayer
                    videoId={activeLesson.youtubeVideoId}
                    onComplete={handleLessonComplete}
                  />
                ) : (
                  <div className="p-4 rounded-xl bg-[#0a0a1a] border border-white/[0.04] text-xs text-gray-300 leading-relaxed whitespace-pre-line text-justify">
                    {activeLesson.content || 'No text content available for this lesson.'}
                  </div>
                )}
              </div>
            </div>
          ) : activeQuiz ? (
            <div className="space-y-4">
              {quizLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-violet-400" size={32} />
                </div>
              ) : (
                <QuizEngine
                  quiz={activeQuiz}
                  attemptsMade={enrollment?.quizAttempts?.[activeQuiz.id]?.attempts || 0}
                  onSubmit={handleQuizSubmit}
                />
              )}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-16 text-center text-gray-500">
              <BookOpen size={36} className="mx-auto text-gray-700 mb-3 animate-pulse" />
              <p className="text-sm">Select a lesson or assessment from the syllabus sidebar to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Graduation / Course Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl border border-violet-500/20 p-8 text-center space-y-6 animate-scale-up">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-violet-500/10 border-2 border-violet-500/30 flex items-center justify-center text-violet-400 relative">
                <AwardIcon size={36} />
                <div className="absolute inset-[-4px] rounded-full border border-violet-500/20 animate-ping pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
                <Sparkles size={16} className="text-violet-400" /> Graduation Day!
              </h2>
              <p className="text-xs text-gray-400">
                You have successfully completed all core curriculum requirements for:
              </p>
              <p className="text-sm font-bold text-violet-400 mt-2">
                {enrollment?.courseName}
              </p>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Earned <strong>+100 Academy XP</strong>. Your professional certification has been dynamically generated and synced to your visitor portfolio.
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              {generatedCertId ? (
                <Link href={`/academy/certificate/${generatedCertId}`} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-xs uppercase tracking-wider text-center text-white block">
                  View Certificate
                </Link>
              ) : (
                <div className="flex justify-center py-2">
                  <Loader2 className="animate-spin text-violet-400" size={20} />
                </div>
              )}
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  router.push('/academy');
                }}
                className="w-full py-3 rounded-xl border border-white/[0.08] text-xs font-semibold text-gray-400 hover:bg-white/[0.04] transition-colors"
              >
                Back to Academy Catalog
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
