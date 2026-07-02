'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2,
  BookOpen, Video, FileText, GraduationCap, Save,
} from 'lucide-react';
import { createCourse, addModule, addLesson, createQuiz, updateCourse } from '@/lib/firebase/lmsService';
import { useAuth } from '@/hooks/useAuth';
import { COURSE_CATEGORIES } from '@/lib/types/lms';
import type { CourseDifficulty, QuizQuestion } from '@/lib/types/lms';

interface ModuleForm {
  title: string;
  description: string;
  lessons: LessonForm[];
  quiz: QuizForm | null;
}

interface LessonForm {
  title: string;
  type: 'video' | 'text';
  youtubeVideoId: string;
  videoDuration: number;
  content: string;
  isPreview: boolean;
}

interface QuizForm {
  title: string;
  passingScore: number;
  allowRetake: boolean;
  maxAttempts: number;
  questions: QuizQuestion[];
}

const STEPS = ['Basic Info', 'Modules & Lessons', 'Review & Publish'];

export default function CreateCoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<CourseDifficulty>('beginner');
  const [thumbnail, setThumbnail] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [skills, setSkills] = useState('');

  // Step 2 — Modules
  const [modules, setModules] = useState<ModuleForm[]>([
    { title: '', description: '', lessons: [{ title: '', type: 'video', youtubeVideoId: '', videoDuration: 0, content: '', isPreview: false }], quiz: null },
  ]);

  const addModuleForm = () => {
    setModules([...modules, {
      title: '', description: '',
      lessons: [{ title: '', type: 'video', youtubeVideoId: '', videoDuration: 0, content: '', isPreview: false }],
      quiz: null,
    }]);
  };

  const removeModule = (idx: number) => {
    if (modules.length <= 1) return;
    setModules(modules.filter((_, i) => i !== idx));
  };

  const updateModuleField = (idx: number, field: string, value: string) => {
    const updated = [...modules];
    (updated[idx] as any)[field] = value;
    setModules(updated);
  };

  const addLessonToModule = (moduleIdx: number) => {
    const updated = [...modules];
    updated[moduleIdx].lessons.push({ title: '', type: 'video', youtubeVideoId: '', videoDuration: 0, content: '', isPreview: false });
    setModules(updated);
  };

  const removeLessonFromModule = (moduleIdx: number, lessonIdx: number) => {
    const updated = [...modules];
    if (updated[moduleIdx].lessons.length <= 1) return;
    updated[moduleIdx].lessons = updated[moduleIdx].lessons.filter((_, i) => i !== lessonIdx);
    setModules(updated);
  };

  const updateLessonField = (moduleIdx: number, lessonIdx: number, field: string, value: any) => {
    const updated = [...modules];
    (updated[moduleIdx].lessons[lessonIdx] as any)[field] = value;
    setModules(updated);
  };

  const addQuizToModule = (moduleIdx: number) => {
    const updated = [...modules];
    updated[moduleIdx].quiz = {
      title: `${updated[moduleIdx].title} Quiz`,
      passingScore: 70,
      allowRetake: true,
      maxAttempts: 3,
      questions: [{ id: 'q1', question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }],
    };
    setModules(updated);
  };

  const removeQuizFromModule = (moduleIdx: number) => {
    const updated = [...modules];
    updated[moduleIdx].quiz = null;
    setModules(updated);
  };

  const addQuizQuestion = (moduleIdx: number) => {
    const updated = [...modules];
    const quiz = updated[moduleIdx].quiz!;
    quiz.questions.push({
      id: `q${quiz.questions.length + 1}`,
      question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '',
    });
    setModules(updated);
  };

  const updateQuizQuestion = (moduleIdx: number, qIdx: number, field: string, value: any) => {
    const updated = [...modules];
    (updated[moduleIdx].quiz!.questions[qIdx] as any)[field] = value;
    setModules(updated);
  };

  const updateQuizQuestionOption = (moduleIdx: number, qIdx: number, optIdx: number, value: string) => {
    const updated = [...modules];
    updated[moduleIdx].quiz!.questions[qIdx].options[optIdx] = value;
    setModules(updated);
  };

  // Validation
  const isStep1Valid = title.trim() && description.trim() && category;
  const isStep2Valid = modules.every(m => m.title.trim() && m.lessons.every(l => l.title.trim()));

  // Extract YouTube Video ID from URL
  const extractYouTubeId = (url: string): string => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  // Submit
  const handleSubmit = async (publish: boolean) => {
    if (!user?.uid) return;
    setSaving(true);

    try {
      const skillsArr = skills.split(',').map(s => s.trim()).filter(Boolean);
      const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);

      // Create course
      const courseId = await createCourse({
        title: title.trim(),
        description: description.trim(),
        category,
        thumbnail,
        difficulty,
        totalModules: modules.length,
        totalLessons,
        estimatedHours: Number(estimatedHours) || 0,
        skills: skillsArr,
        prerequisites: [],
        certificateTemplateId: '',
        isPublished: publish,
        isFeatured: false,
        createdBy: user.uid,
      });

      // Create modules, lessons, and quizzes
      for (let mIdx = 0; mIdx < modules.length; mIdx++) {
        const mod = modules[mIdx];
        const moduleId = await addModule(courseId, {
          title: mod.title.trim(),
          description: mod.description.trim(),
          order: mIdx + 1,
        });

        // Lessons
        for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
          const lesson = mod.lessons[lIdx];
          const videoId = extractYouTubeId(lesson.youtubeVideoId);
          await addLesson(courseId, moduleId, {
            title: lesson.title.trim(),
            type: lesson.type,
            youtubeVideoId: videoId || undefined,
            videoDuration: lesson.videoDuration || undefined,
            content: lesson.content || undefined,
            order: lIdx + 1,
            isPreview: lesson.isPreview,
          });
        }

        // Quiz
        if (mod.quiz && mod.quiz.questions.some(q => q.question.trim())) {
          await createQuiz({
            title: mod.quiz.title,
            courseId,
            moduleId,
            type: 'module',
            passingScore: mod.quiz.passingScore,
            allowRetake: mod.quiz.allowRetake,
            maxAttempts: mod.quiz.maxAttempts,
            questions: mod.quiz.questions.filter(q => q.question.trim()),
          });
        }
      }

      // Update totalModules
      await updateCourse(courseId, { totalModules: modules.length });

      alert(publish ? 'Course published successfully!' : 'Course saved as draft!');
      router.push('/admin/academy/courses');
    } catch (err: any) {
      console.error('Create course error:', err);
      alert('Failed to create course: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white font-outfit">Create New Course</h1>
          <p className="text-xs text-gray-500">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full transition-all ${i <= step ? 'bg-gradient-to-r from-violet-500 to-indigo-500' : 'bg-white/[0.06]'}`} />
            <p className={`text-[10px] mt-1 font-medium ${i <= step ? 'text-violet-400' : 'text-gray-500'}`}>{s}</p>
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 0 && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider block mb-1.5">Course Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Tally ERP Masterclass"
              className="w-full bg-slate-900/80 border border-white/20 px-4 py-2.5 text-sm rounded-xl text-white placeholder:text-gray-400 focus:border-violet-500/50 outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider block mb-1.5">Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe what this course covers..."
              className="w-full bg-slate-900/80 border border-white/20 px-4 py-2.5 text-sm rounded-xl text-white placeholder:text-gray-400 focus:border-violet-500/50 outline-none resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider block mb-1.5">Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/20 px-4 py-2.5 text-sm rounded-xl text-white focus:border-violet-500/50 outline-none">
                <option value="">Select Category</option>
                {COURSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider block mb-1.5">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as CourseDifficulty)}
                className="w-full bg-slate-900/80 border border-white/20 px-4 py-2.5 text-sm rounded-xl text-white focus:border-violet-500/50 outline-none">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider block mb-1.5">Thumbnail URL</label>
              <input type="text" value={thumbnail} onChange={e => setThumbnail(e.target.value)} placeholder="https://..."
                className="w-full bg-slate-900/80 border border-white/20 px-4 py-2.5 text-sm rounded-xl text-white placeholder:text-gray-400 focus:border-violet-500/50 outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider block mb-1.5">Estimated Hours</label>
              <input type="number" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} placeholder="e.g., 10"
                className="w-full bg-slate-900/80 border border-white/20 px-4 py-2.5 text-sm rounded-xl text-white placeholder:text-gray-400 focus:border-violet-500/50 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider block mb-1.5">Skills (comma separated)</label>
            <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g., Tally, GST, Accounting"
              className="w-full bg-slate-900/80 border border-white/20 px-4 py-2.5 text-sm rounded-xl text-white placeholder:text-gray-400 focus:border-violet-500/50 outline-none" />
          </div>
        </div>
      )}

      {/* Step 2: Modules & Lessons */}
      {step === 1 && (
        <div className="space-y-4">
          {modules.map((mod, mIdx) => (
            <div key={mIdx} className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen size={14} className="text-violet-400" /> Module {mIdx + 1}
                </h3>
                {modules.length > 1 && (
                  <button onClick={() => removeModule(mIdx)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" value={mod.title} onChange={e => updateModuleField(mIdx, 'title', e.target.value)} placeholder="Module title *"
                  className="bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-sm rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500/30 outline-none" />
                <input type="text" value={mod.description} onChange={e => updateModuleField(mIdx, 'description', e.target.value)} placeholder="Module description"
                  className="bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-sm rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500/30 outline-none" />
              </div>

              {/* Lessons */}
              <div className="space-y-2 pl-4 border-l-2 border-violet-500/20">
                {mod.lessons.map((lesson, lIdx) => (
                  <div key={lIdx} className="bg-white/[0.02] rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {lesson.type === 'video' ? <Video size={12} className="text-cyan-400" /> : <FileText size={12} className="text-amber-400" />}
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Lesson {lIdx + 1}</span>
                      {mod.lessons.length > 1 && (
                        <button onClick={() => removeLessonFromModule(mIdx, lIdx)} className="ml-auto text-red-400 hover:text-red-300">
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                    <input type="text" value={lesson.title} onChange={e => updateLessonField(mIdx, lIdx, 'title', e.target.value)} placeholder="Lesson title *"
                      className="w-full bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-xs rounded-lg text-white placeholder:text-gray-500 outline-none" />
                    <div className="grid grid-cols-2 gap-2">
                      <select value={lesson.type} onChange={e => updateLessonField(mIdx, lIdx, 'type', e.target.value)}
                        className="bg-[#0F172A] border border-white/[0.06] px-3 py-1.5 text-xs rounded-lg text-white outline-none">
                        <option value="video">Video</option>
                        <option value="text">Text</option>
                      </select>
                      {lesson.type === 'video' && (
                        <input type="text" value={lesson.youtubeVideoId} onChange={e => updateLessonField(mIdx, lIdx, 'youtubeVideoId', e.target.value)}
                          placeholder="YouTube URL or Video ID" className="bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-xs rounded-lg text-white placeholder:text-gray-500 outline-none" />
                      )}
                    </div>
                    {lesson.type === 'video' && (
                      <input type="number" value={lesson.videoDuration || ''} onChange={e => updateLessonField(mIdx, lIdx, 'videoDuration', Number(e.target.value))}
                        placeholder="Duration in seconds" className="w-full bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-xs rounded-lg text-white placeholder:text-gray-500 outline-none" />
                    )}
                    {lesson.type === 'text' && (
                      <textarea value={lesson.content} onChange={e => updateLessonField(mIdx, lIdx, 'content', e.target.value)}
                        placeholder="Lesson content..." rows={3} className="w-full bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-xs rounded-lg text-white placeholder:text-gray-500 outline-none resize-none" />
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={lesson.isPreview} onChange={e => updateLessonField(mIdx, lIdx, 'isPreview', e.target.checked)}
                        className="rounded" />
                      <span className="text-[10px] text-gray-400">Free Preview</span>
                    </label>
                  </div>
                ))}
                <button onClick={() => addLessonToModule(mIdx)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-white/[0.1] text-[10px] font-medium text-gray-400 hover:bg-white/[0.03] w-full justify-center">
                  <Plus size={10} /> Add Lesson
                </button>
              </div>

              {/* Quiz */}
              {mod.quiz ? (
                <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Module Quiz</span>
                    <button onClick={() => removeQuizFromModule(mIdx)} className="text-red-400 hover:text-red-300 text-[10px]">Remove Quiz</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={mod.quiz.passingScore} onChange={e => {
                      const updated = [...modules]; updated[mIdx].quiz!.passingScore = Number(e.target.value); setModules(updated);
                    }} placeholder="Pass %" className="bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-xs rounded-lg text-white outline-none" />
                    <input type="number" value={mod.quiz.maxAttempts} onChange={e => {
                      const updated = [...modules]; updated[mIdx].quiz!.maxAttempts = Number(e.target.value); setModules(updated);
                    }} placeholder="Max Attempts" className="bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-xs rounded-lg text-white outline-none" />
                  </div>
                  {mod.quiz.questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-white/[0.02] rounded-lg p-2.5 space-y-2">
                      <input type="text" value={q.question} onChange={e => updateQuizQuestion(mIdx, qIdx, 'question', e.target.value)}
                        placeholder={`Question ${qIdx + 1}`} className="w-full bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-xs rounded-lg text-white placeholder:text-gray-500 outline-none" />
                      <div className="grid grid-cols-2 gap-1.5">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-1.5">
                            <input type="radio" name={`q-${mIdx}-${qIdx}`} checked={q.correctAnswer === oIdx}
                              onChange={() => updateQuizQuestion(mIdx, qIdx, 'correctAnswer', oIdx)} className="accent-emerald-500" />
                            <input type="text" value={opt} onChange={e => updateQuizQuestionOption(mIdx, qIdx, oIdx, e.target.value)}
                              placeholder={`Option ${oIdx + 1}`} className="flex-1 bg-white/[0.03] border border-white/[0.06] px-2 py-1 text-[10px] rounded-lg text-white placeholder:text-gray-500 outline-none" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addQuizQuestion(mIdx)}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"><Plus size={10} /> Add Question</button>
                </div>
              ) : (
                <button onClick={() => addQuizToModule(mIdx)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-amber-500/20 text-[10px] font-medium text-amber-400 hover:bg-amber-500/5 w-full justify-center">
                  <GraduationCap size={10} /> Add Module Quiz
                </button>
              )}
            </div>
          ))}

          <button onClick={addModuleForm}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-violet-500/20 text-xs font-medium text-violet-400 hover:bg-violet-500/5 w-full justify-center">
            <Plus size={14} /> Add Another Module
          </button>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 2 && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Review Your Course</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Title</p>
              <p className="text-sm text-white mt-0.5">{title}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Category</p>
              <p className="text-sm text-white mt-0.5">{category}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Difficulty</p>
              <p className="text-sm text-white mt-0.5 capitalize">{difficulty}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Estimated Hours</p>
              <p className="text-sm text-white mt-0.5">{estimatedHours || '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Description</p>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-3">{description}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Modules ({modules.length})</p>
            {modules.map((mod, i) => (
              <div key={i} className="bg-white/[0.02] rounded-xl p-3 mb-2">
                <p className="text-xs font-semibold text-white">{mod.title || `Module ${i + 1}`}</p>
                <p className="text-[10px] text-gray-500">{mod.lessons.length} lessons{mod.quiz ? ' + quiz' : ''}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-500">Total Lessons: {modules.reduce((s, m) => s + m.lessons.length, 0)}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/[0.04] disabled:opacity-30">
          <ArrowLeft size={14} /> Previous
        </button>
        <div className="flex gap-2">
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)}
              disabled={(step === 0 && !isStep1Valid) || (step === 1 && !isStep2Valid)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <button onClick={() => handleSubmit(false)} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-gray-300 hover:bg-white/[0.04] disabled:opacity-40">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save as Draft
              </button>
              <button onClick={() => handleSubmit(true)} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Publish Course
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
