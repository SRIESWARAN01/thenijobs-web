'use client';

import { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle,
  GraduationCap,
  Loader2,
  PlayCircle,
  Search,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { upsertDocument } from '@/lib/firebase/firestoreService';

type PathStatus = 'recommended' | 'in_progress' | 'completed';

interface LearningPath {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  lessons: number;
  minutes: number;
  impact: number;
  tags: string[];
  assessment: {
    question: string;
    options: string[];
    answer: number;
  }[];
}

interface SkillProgress {
  status: PathStatus;
  progress: number;
  score?: number;
  completedAt?: string;
  updatedAt?: string;
}

const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'firebase-job-portal',
    title: 'Firebase for job portal apps',
    subtitle: 'Firestore, Auth, Storage, and notifications',
    description: 'Practice the core Firebase concepts used in dashboards, profile flows, and real-time job applications.',
    lessons: 6,
    minutes: 150,
    impact: 91,
    tags: ['Firebase', 'Firestore', 'Auth', 'Storage'],
    assessment: [
      {
        question: 'Which Firebase product stores job and application documents?',
        options: ['Firestore', 'Hosting', 'Analytics'],
        answer: 0,
      },
      {
        question: 'Which rule should protect a seeker profile document?',
        options: ['Only the owner or admin can read/write', 'Anyone can write', 'Only anonymous users can read'],
        answer: 0,
      },
      {
        question: 'What is best for counting matching documents with lower read cost?',
        options: ['getCountFromServer()', 'Downloading every document', 'LocalStorage only'],
        answer: 0,
      },
    ],
  },
  {
    id: 'tally-gst-refresh',
    title: 'Tally and GST practical refresh',
    subtitle: 'Accounts roles in Theni district',
    description: 'Refresh purchase entries, GSTR summaries, invoice matching, and reconciliation interview tasks.',
    lessons: 8,
    minutes: 210,
    impact: 84,
    tags: ['Tally', 'GST', 'Excel'],
    assessment: [
      {
        question: 'Which skill is most relevant for accountant job shortlisting?',
        options: ['GST filing', 'Video editing', '3D modeling'],
        answer: 0,
      },
      {
        question: 'What should be checked during invoice reconciliation?',
        options: ['Invoice, payment, and ledger match', 'Only logo color', 'Only office address'],
        answer: 0,
      },
      {
        question: 'Which tool is commonly expected for local accounts roles?',
        options: ['Tally', 'Blender', 'Figma'],
        answer: 0,
      },
    ],
  },
  {
    id: 'typing-speed',
    title: 'Tamil and English typing speed',
    subtitle: 'Data entry and office assistant readiness',
    description: 'Improve typing accuracy and speed for office assistant, data entry, and back-office openings.',
    lessons: 5,
    minutes: 90,
    impact: 76,
    tags: ['Tamil Typing', 'English Typing', 'Data Entry'],
    assessment: [
      {
        question: 'What matters most in typing tests?',
        options: ['Accuracy and speed', 'Font size only', 'Screen brightness'],
        answer: 0,
      },
      {
        question: 'How should daily practice be structured?',
        options: ['Short timed sessions', 'One random yearly attempt', 'Only reading job posts'],
        answer: 0,
      },
      {
        question: 'Which role often asks for typing ability?',
        options: ['Data entry operator', 'Heavy vehicle mechanic', 'Chef'],
        answer: 0,
      },
    ],
  },
  {
    id: 'customer-communication',
    title: 'Customer communication basics',
    subtitle: 'Support and field marketing readiness',
    description: 'Build confidence with call etiquette, follow-up notes, escalation, and customer objections.',
    lessons: 7,
    minutes: 180,
    impact: 82,
    tags: ['Communication', 'Sales', 'Support'],
    assessment: [
      {
        question: 'What should a follow-up note include?',
        options: ['Customer need, promise, and next step', 'Only a greeting', 'Only emojis'],
        answer: 0,
      },
      {
        question: 'How should an objection be handled?',
        options: ['Listen, clarify, then respond', 'Interrupt immediately', 'Ignore the customer'],
        answer: 0,
      },
      {
        question: 'Which tone works best in support roles?',
        options: ['Calm and clear', 'Angry and rushed', 'Silent'],
        answer: 0,
      },
    ],
  },
];

const statusConfig: Record<PathStatus, { label: string; className: string }> = {
  recommended: {
    label: 'Recommended',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  completed: {
    label: 'Completed',
    className: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
};

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export default function SkillsPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  const { data: profile, loading } = useDocument<any>('seekerProfiles', uid);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | PathStatus>('all');
  const [savingPath, setSavingPath] = useState<string | null>(null);
  const [activeAssessment, setActiveAssessment] = useState<LearningPath | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const progressMap = useMemo(
    () => (profile?.skillProgress || {}) as Record<string, SkillProgress>,
    [profile],
  );
  const savedSkills = useMemo(
    () => (Array.isArray(profile?.skills) ? profile.skills as string[] : []),
    [profile],
  );

  const paths = useMemo(() => {
    return LEARNING_PATHS.map((path) => {
      const progress = progressMap[path.id] || { status: 'recommended', progress: 0 };
      return { ...path, progress };
    });
  }, [progressMap]);

  const metrics = useMemo(() => {
    const completed = paths.filter((path) => path.progress.status === 'completed').length;
    const inProgress = paths.filter((path) => path.progress.status === 'in_progress').length;
    const scores = paths
      .map((path) => path.progress.score)
      .filter((score): score is number => typeof score === 'number');
    const averageScore = scores.length
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

    return [
      { label: 'Learning Paths', value: paths.length, description: 'Available modules', icon: BookOpen, color: 'emerald' },
      { label: 'In Progress', value: inProgress, description: 'Active courses', icon: PlayCircle, color: 'cyan' },
      { label: 'Completed', value: completed, description: 'Profile badges earned', icon: CheckCircle, color: 'violet' },
      { label: 'Mock Score', value: averageScore ? `${averageScore}%` : '--', description: 'Assessment average', icon: Sparkles, color: 'amber' },
    ];
  }, [paths]);

  const filteredPaths = paths.filter((path) => {
    const tabMatch = activeTab === 'all' || path.progress.status === activeTab;
    const haystack = [path.title, path.subtitle, path.description, ...path.tags].join(' ').toLowerCase();
    return tabMatch && haystack.includes(query.toLowerCase());
  });

  const saveProgress = async (path: LearningPath, nextProgress: SkillProgress, addSkills = false) => {
    if (!uid) return;
    setSavingPath(path.id);
    try {
      const nextSkillProgress = {
        ...progressMap,
        [path.id]: {
          ...nextProgress,
          updatedAt: new Date().toISOString(),
        },
      };
      const nextSkills = addSkills
        ? Array.from(new Set([...savedSkills, ...path.tags]))
        : savedSkills;

      await upsertDocument('seekerProfiles', uid, {
        uid,
        skillProgress: nextSkillProgress,
        skills: nextSkills,
      });
    } catch (err) {
      console.error('Skill progress save failed:', err);
      alert('Unable to save skill progress.');
    } finally {
      setSavingPath(null);
    }
  };

  const handlePrimaryAction = async (path: LearningPath, progress: SkillProgress) => {
    if (progress.status === 'completed') {
      setActiveAssessment(path);
      setAnswers({});
      return;
    }

    if (progress.status === 'in_progress') {
      const nextValue = Math.min(100, Math.max(progress.progress + 25, 50));
      await saveProgress(path, {
        status: nextValue >= 100 ? 'completed' : 'in_progress',
        progress: nextValue,
        score: progress.score ?? undefined,
        ...(nextValue >= 100 ? { completedAt: new Date().toISOString() } : {}),
      }, nextValue >= 100);
      return;
    }

    await saveProgress(path, {
      status: 'in_progress',
      progress: 15,
      score: progress.score ?? undefined,
    });
  };

  const handleAssessmentSubmit = async () => {
    if (!activeAssessment) return;
    const correct = activeAssessment.assessment.reduce(
      (sum, question, index) => sum + (answers[index] === question.answer ? 1 : 0),
      0,
    );
    const score = Math.round((correct / activeAssessment.assessment.length) * 100);

    await saveProgress(activeAssessment, {
      status: 'completed',
      progress: 100,
      score,
      completedAt: new Date().toISOString(),
    }, true);
    setActiveAssessment(null);
    setAnswers({});
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-white">
        <Loader2 size={36} className="mb-4 animate-spin text-emerald-400" />
        <p className="text-sm text-gray-400">Loading skill development...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Career Growth</p>
            <h1 className="mt-1 text-2xl font-bold text-white">Skill Development</h1>
            <p className="mt-1 text-sm text-gray-400">
              Prioritized learning paths with saved progress, badges, and mock assessment scores.
            </p>
          </div>
          <a
            href="/seeker/ai-coach"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <GraduationCap size={16} />
            AI Coach
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const colors: Record<string, string> = {
            emerald: 'bg-emerald-500/15 text-emerald-400',
            cyan: 'bg-cyan-500/15 text-cyan-400',
            violet: 'bg-violet-500/15 text-violet-400',
            amber: 'bg-amber-500/15 text-amber-400',
          };
          return (
            <div key={metric.label} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold text-white">{metric.value}</p>
                  <p className="mt-1 text-xs font-medium text-gray-400">{metric.label}</p>
                  <p className="mt-1 text-[10px] text-gray-600">{metric.description}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[metric.color]}`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search learning paths, skills, badges..."
            className="search-input w-full py-2.5 pl-10 pr-4 text-sm"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 no-scrollbar">
          {[
            { label: 'All', value: 'all' },
            { label: 'Recommended', value: 'recommended' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Completed', value: 'completed' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value as typeof activeTab)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                activeTab === tab.value
                  ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                  : 'text-gray-400 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredPaths.map((path) => {
          const progress = path.progress;
          const status = statusConfig[progress.status];
          const saving = savingPath === path.id;
          const primaryLabel =
            progress.status === 'completed'
              ? 'Mock Test'
              : progress.status === 'in_progress'
                ? progress.progress >= 75 ? 'Finish' : 'Continue'
                : 'Start';
          const PrimaryIcon = progress.status === 'completed' ? Target : progress.status === 'in_progress' ? PlayCircle : PlayCircle;

          return (
            <div key={path.id} className="glass-card rounded-2xl p-5 transition-all hover:border-white/[0.15]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-white">{path.title}</h2>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${status.className}`}>
                      {status.label}
                    </span>
                    {typeof progress.score === 'number' && (
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-400">
                        Score {progress.score}%
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{path.subtitle}</p>
                  <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">{path.description}</p>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                    <span className="text-xs text-gray-500">{path.lessons} lessons</span>
                    <span className="text-xs text-gray-500">{formatDuration(path.minutes)}</span>
                    <span className="text-xs text-gray-500">Job impact {path.impact}%</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {path.tags.map((tag) => (
                      <span key={tag} className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-gray-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="w-full shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 xl:w-44">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Progress</span>
                    <span className="text-sm font-bold text-emerald-400">{progress.progress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 xl:justify-end">
                  <button
                    type="button"
                    onClick={() => handlePrimaryAction(path, progress)}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <PrimaryIcon size={14} />}
                    {primaryLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => saveProgress(path, {
                      status: 'completed',
                      progress: 100,
                      score: progress.score,
                      completedAt: progress.completedAt || new Date().toISOString(),
                    }, true)}
                    disabled={saving || progress.status === 'completed'}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-400 transition-all hover:bg-violet-500/20 disabled:opacity-40"
                  >
                    <Trophy size={14} />
                    Mark Done
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPaths.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <Award size={24} />
          </div>
          <h2 className="text-base font-semibold text-white">No learning paths match</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">Try another progress tab or search term.</p>
        </div>
      )}

      {activeAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-xl rounded-2xl border border-emerald-500/20 p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Mock Test</p>
                <h2 className="mt-1 text-lg font-bold text-white">{activeAssessment.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveAssessment(null)}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-gray-300"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              {activeAssessment.assessment.map((question, questionIndex) => (
                <div key={question.question} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-sm font-semibold text-white">{question.question}</p>
                  <div className="mt-3 grid gap-2">
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }))}
                        className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                          answers[questionIndex] === optionIndex
                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
                            : 'border-white/[0.06] bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAssessmentSubmit}
              disabled={Object.keys(answers).length !== activeAssessment.assessment.length || savingPath === activeAssessment.id}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {savingPath === activeAssessment.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Submit Score
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
