'use client';

import { BookOpen, Video, FileText, CheckCircle2, Lock, Target } from 'lucide-react';
import type { CourseModule, Lesson } from '@/lib/types/lms';

interface LessonSidebarProps {
  modules: (CourseModule & { lessons: Lesson[] })[];
  completedLessons: string[];
  activeLessonId: string;
  onSelectLesson: (lesson: Lesson) => void;
  onSelectQuiz: (moduleId: string, quizId: string) => void;
  activeQuizModuleId?: string | null;
  quizStatusMap: Record<string, { passed: boolean }>;
}

export default function LessonSidebar({
  modules,
  completedLessons,
  activeLessonId,
  onSelectLesson,
  onSelectQuiz,
  activeQuizModuleId,
  quizStatusMap,
}: LessonSidebarProps) {
  // Logic to determine if a module or lesson is unlocked:
  // For simplicity, a module/lesson is unlocked if the previous module's quiz is completed
  // and previous lessons in the current module are completed.
  
  let previousModuleCompleted = true;

  return (
    <div className="space-y-4 font-outfit text-white">
      <h2 className="text-xs font-black uppercase text-gray-500 tracking-wider px-2">Course Syllabus</h2>

      <div className="space-y-2.5">
        {modules.map((mod, modIdx) => {
          const hasQuiz = !!mod.quizId;
          const quizPassed = mod.quizId ? quizStatusMap[mod.quizId]?.passed : false;
          
          // Current module is unlocked if previous was completed
          const isModuleUnlocked = previousModuleCompleted;

          // Check if all lessons in this module are completed
          const allLessonsCompleted = mod.lessons.every(l => completedLessons.includes(l.id));
          
          // Update for the next module iteration
          previousModuleCompleted = hasQuiz ? quizPassed : allLessonsCompleted;

          return (
            <div key={mod.id} className="space-y-1.5">
              <div className="px-2 py-1 flex items-center justify-between border-b border-white/[0.04]">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  Module {modIdx + 1}: {mod.title}
                </span>
                {!isModuleUnlocked && <Lock size={10} className="text-gray-600" />}
              </div>

              <div className="space-y-1 pl-1">
                {mod.lessons.map((lesson, lessonIdx) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  const isActive = activeLessonId === lesson.id && !activeQuizModuleId;
                  
                  // Check if previous lessons in this module are completed
                  const isLessonUnlocked = isModuleUnlocked && 
                    mod.lessons.slice(0, lessonIdx).every(l => completedLessons.includes(l.id));

                  return (
                    <button
                      key={lesson.id}
                      disabled={!isLessonUnlocked}
                      onClick={() => onSelectLesson(lesson)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${isActive ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : isLessonUnlocked ? 'hover:bg-white/[0.03] text-gray-400' : 'opacity-40 cursor-not-allowed text-gray-600'}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isCompleted ? (
                          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        ) : !isLessonUnlocked ? (
                          <Lock size={11} className="text-gray-600 shrink-0" />
                        ) : lesson.type === 'video' ? (
                          <Video size={12} className="text-cyan-400 shrink-0" />
                        ) : (
                          <FileText size={12} className="text-amber-400 shrink-0" />
                        )}
                        <span className="truncate">{lesson.title}</span>
                      </div>
                      {lesson.videoDuration ? (
                        <span className="text-[9px] text-gray-600 shrink-0">{Math.round(lesson.videoDuration / 60)}m</span>
                      ) : null}
                    </button>
                  );
                })}

                {/* Module Quiz Button */}
                {mod.quizId && (
                  <button
                    disabled={!allLessonsCompleted || !isModuleUnlocked}
                    onClick={() => onSelectQuiz(mod.id, mod.quizId!)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${activeQuizModuleId === mod.id ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : allLessonsCompleted ? 'text-amber-400/80 hover:bg-amber-500/5' : 'opacity-40 cursor-not-allowed text-gray-600'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {quizPassed ? (
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      ) : !allLessonsCompleted ? (
                        <Lock size={11} className="text-gray-600 shrink-0" />
                      ) : (
                        <Target size={12} className="text-amber-400 shrink-0" />
                      )}
                      <span className="font-bold">Module Assessment</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
