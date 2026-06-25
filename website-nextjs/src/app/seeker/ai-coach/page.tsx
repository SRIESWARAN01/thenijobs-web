'use client';

import { useEffect, useState, useRef } from 'react';
import {
  ArrowRight, Award, Check, Cpu, Loader2, MessageSquare, Sparkles, Zap,
  Mic, Video, AlertCircle, RotateCcw, CheckCircle2, TrendingUp, BookOpen, FileText,
  Lock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument, useCollection } from '@/hooks/useFirestore';
import { upsertDocument } from '@/lib/firebase/firestoreService';
import { selectBestSubscription } from '@/lib/subscriptions';
import { where } from 'firebase/firestore';
import Link from 'next/link';

type ExperienceLevel = 'fresher' | 'junior' | 'experienced' | 'career_switch';
type ActiveTab = 'plan' | 'interview' | 'resume' | 'matcher';

interface CoachPlan {
  focus: string;
  summary: string;
  steps: string[];
  questions: string[];
  keywords: string[];
}

const EXPERIENCE_OPTIONS: Array<{ value: ExperienceLevel; label: string }> = [
  { value: 'fresher', label: 'Fresher' },
  { value: 'junior', label: '1-3 years' },
  { value: 'experienced', label: '3+ years' },
  { value: 'career_switch', label: 'Career switch' },
];

const PREVIEWS = [
  {
    icon: MessageSquare,
    title: 'Interview Practice',
    desc: 'Role-specific questions, speaking prompts, and concise answer structure.',
    color: 'violet',
  },
  {
    icon: Award,
    title: 'Resume Readiness',
    desc: 'A short checklist for profile strength, keywords, and proof points.',
    color: 'emerald',
  },
  {
    icon: Zap,
    title: 'Action Plan',
    desc: 'Focused next steps for applying, following up, and improving fit.',
    color: 'cyan',
  },
];

function buildCoachPlan(targetRole: string, experience: ExperienceLevel): CoachPlan {
  const role = targetRole.trim() || 'your target role';
  const isFresher = experience === 'fresher';
  const isSwitching = experience === 'career_switch';
  const proofPoint = isFresher
    ? 'projects, internships, coursework, certificates, and volunteer work'
    : 'recent wins, measurable outcomes, tools used, and business impact';

  return {
    focus: isSwitching ? 'Transition readiness' : isFresher ? 'Entry-level readiness' : 'Role fit readiness',
    summary: `Prepare a sharper ${role} pitch with proof from ${proofPoint}.`,
    steps: [
      `Write a 45-second introduction for ${role} with one clear strength and one relevant proof point.`,
      `Match your resume to three common ${role} requirements and add missing keywords naturally.`,
      'Prepare one STAR story for teamwork, one for problem solving, and one for learning quickly.',
      'Apply to five closely matched openings before broad applications, then follow up within two days.',
    ],
    questions: [
      `Why do you want to work as a ${role}?`,
      `Tell me about a time you solved a practical problem related to ${role}.`,
      'How do you handle feedback when your first attempt is not accepted?',
      'What skills will you improve in the next 30 days?',
    ],
    keywords: [
      role,
      isFresher ? 'quick learner' : 'ownership',
      isSwitching ? 'transferable skills' : 'relevant experience',
      'communication',
      'problem solving',
    ],
  };
}

export default function AICoachPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [activeTab, setActiveTab] = useState<ActiveTab>('plan');
  const [email, setEmail] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experience, setExperience] = useState<ExperienceLevel>('fresher');
  const [coachPlan, setCoachPlan] = useState<CoachPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved plan and profile
  const { data: savedPlanDoc } = useDocument<any>('aiCoachWaitlist', uid);
  const { data: seekerProfile } = useDocument<any>('seekerProfiles', uid);

  // Fetch subscriptions
  const { data: subscriptions, loading: subsLoading } = useCollection<any>('subscriptions', [
    where('userId', '==', uid || '')
  ], { skip: !uid });

  const activeSub = selectBestSubscription(subscriptions);
  const activePlan = activeSub?.planId || 'free';

  // Mock Interview State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [interviewStatus, setInterviewStatus] = useState<'idle' | 'answering' | 'analyzing' | 'completed'>('idle');
  const [feedbackResult, setFeedbackResult] = useState<any | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Job Matcher State
  const [matchRole, setMatchRole] = useState('');
  const [matcherLoading, setMatcherLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<any | null>(null);

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [email, user?.email]);

  useEffect(() => {
    if (savedPlanDoc?.starterPlan) {
      setCoachPlan(savedPlanDoc.starterPlan);
      if (savedPlanDoc.targetRole) setTargetRole(savedPlanDoc.targetRole);
      if (savedPlanDoc.experienceLevel) setExperience(savedPlanDoc.experienceLevel);
    }
  }, [savedPlanDoc]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!subsLoading && activePlan !== 'premium') {
    return (
      <main className="min-h-screen bg-[#07050a] text-white flex flex-col font-outfit justify-center items-center">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center flex flex-col justify-center items-center space-y-6">
          <div className="relative w-20 h-20 bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
            <Lock size={32} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
              Seeker AI Career Coach is Locked
            </h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Accelerate your career search with AI Mock Interviews, real-time speech analytics, and automated resume keyword matchers. Available exclusively to Premium seekers.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 w-full justify-center">
            <Link href="/seeker/subscription" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-650 px-6 py-3 rounded-xl text-xs font-bold text-white hover:opacity-90 shadow-lg shadow-purple-550/15">
              Upgrade to Seeker Premium <ArrowRight size={14} />
            </Link>
            <Link href="/seeker/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uid) {
      setError('Please sign in to save your coach plan.');
      return;
    }

    setLoading(true);
    setError(null);

    const plan = buildCoachPlan(targetRole, experience);

    try {
      await upsertDocument('aiCoachWaitlist', uid, {
        userId: uid,
        email: email.trim() || user.email || '',
        displayName: user.displayName || '',
        status: 'starter_plan_generated',
        targetRole: targetRole.trim(),
        experienceLevel: experience,
        requestedFeatures: ['mock_interviews', 'resume_scanner', 'career_advisor'],
        starterPlan: plan,
      });
      setCoachPlan(plan);
      alert('Starter plan generated and saved successfully!');
    } catch (err) {
      console.error('AI Coach starter plan error:', err);
      setError('Unable to save your starter plan right now.');
    } finally {
      setLoading(false);
    }
  };

  // Mock Interview Functions
  const startInterview = () => {
    if (!coachPlan) {
      alert('Please generate a Starter Plan first to get target questions.');
      return;
    }
    setInterviewStatus('answering');
    setCurrentQuestionIndex(0);
    setAnswerText('');
    setFeedbackResult(null);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Simulate speech-to-text response
    const mockResponses = [
      `I am very passionate about this ${targetRole || 'role'}. In my previous projects, I led the development of critical modules and coordinated closely with clients to achieve our business goals. I also love learning new tech tools.`,
      `One time we had a bug in our production code causing checkout failures. I analyzed the error logs, identified a database race condition, and resolved the issue using proper transactions, which restored operations immediately.`,
      `I welcome constructive feedback. When my first draft was rejected, I schedule a call to review the comments, identified three core gaps in my design, and refactored the codebase to exceed the requirements.`,
    ];
    setAnswerText(mockResponses[currentQuestionIndex % mockResponses.length]);
  };

  const submitAnswer = () => {
    if (!answerText.trim()) {
      alert('Please type or record an answer before submitting.');
      return;
    }
    setInterviewStatus('analyzing');

    // Simulate AI grading analysis response
    setTimeout(() => {
      const score = Math.floor(Math.random() * 20) + 75; // 75-95
      const clarity = Math.floor(Math.random() * 20) + 78; // 78-98
      const confidence = Math.floor(Math.random() * 15) + 80; // 80-95
      const relevance = Math.floor(Math.random() * 15) + 82; // 82-97

      setFeedbackResult({
        score,
        clarity,
        confidence,
        relevance,
        analysis: `Your answer details strong ownership and problem-solving capability. You structured the response well.`,
        tips: [
          'Use the STAR model (Situation, Task, Action, Result) more explicitly.',
          'Quantify your achievement (e.g., mention time saved or cost reduction).',
          'Avoid filler words and state your conclusions first.',
        ],
      });
      setInterviewStatus('completed');
    }, 1500);
  };

  const nextQuestion = () => {
    if (!coachPlan) return;
    if (currentQuestionIndex < coachPlan.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setAnswerText('');
      setFeedbackResult(null);
      setInterviewStatus('answering');
    } else {
      alert('Mock Interview session completed! Great job.');
      setInterviewStatus('idle');
    }
  };

  // Job Matcher Functions
  const runJobMatcher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchRole.trim()) return;

    setMatcherLoading(true);
    setTimeout(() => {
      const seekerSkills = seekerProfile?.skills || [];
      const matched = seekerSkills.filter((s: string) =>
        s.toLowerCase().includes('management') ||
        s.toLowerCase().includes('developer') ||
        s.toLowerCase().includes('sql') ||
        s.toLowerCase().includes('sales') ||
        s.toLowerCase().includes('excel')
      );

      const overlapCount = matched.length;
      let pct = 45;
      let missing: string[] = ['Client Communication', 'CRM Software', 'Risk Assessment'];

      if (overlapCount > 3) {
        pct = 82;
        missing = ['Advanced Negotiation'];
      } else if (overlapCount > 1) {
        pct = 68;
        missing = ['Strategic Planning', 'Team Collaboration'];
      }

      setMatchResult({
        percentage: pct,
        skillsCount: seekerSkills.length,
        matchedSkills: matched,
        missingSkills: missing,
      });
      setMatcherLoading(false);
    }, 1200);
  };

  // Profile Strength Calculator
  const computeProfileStrength = () => {
    let strength = 20; // base auth registration
    const tips = [];

    if (seekerProfile?.skills && seekerProfile.skills.length > 0) {
      strength += 25;
    } else {
      tips.push('Add key professional skills (e.g. Sales, Accounting) in Profile.');
    }

    if (seekerProfile?.experience && seekerProfile.experience.length > 0) {
      strength += 25;
    } else {
      tips.push('Add past jobs or internships in Professional Experience.');
    }

    if (seekerProfile?.education && seekerProfile.education.length > 0) {
      strength += 20;
    } else {
      tips.push('Fill in your educational qualifications.');
    }

    if (seekerProfile?.resumeUrl || (seekerProfile?.resumes && seekerProfile.resumes.length > 0)) {
      strength += 10;
    } else {
      tips.push('Upload a PDF resume in Resume Manager to increase search rank.');
    }

    return { strength, tips };
  };

  const { strength: profileStrength, tips: resumeTips } = computeProfileStrength();

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const iconColorMap: Record<string, string> = {
    violet: 'bg-violet-500/10 text-violet-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
  };

  return (
    <div className="animate-fade-in-up space-y-6 max-w-5xl mx-auto font-outfit text-white py-4 px-4 sm:px-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 gap-6 overflow-x-auto">
        {[
          { id: 'plan', label: 'Coach Plan', icon: Sparkles },
          { id: 'interview', label: 'Mock Interview', icon: Video },
          { id: 'resume', label: 'Resume Enhancer', icon: FileText },
          { id: 'matcher', label: 'Job Matcher', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all ${
                isActive ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* PLAN TAB */}
      {activeTab === 'plan' && (
        <div className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <Sparkles size={24} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">AI Career Coach</h1>
                <p className="text-sm text-gray-400 leading-relaxed mt-2 max-w-xl">
                  Build a saved interview and resume starter plan for your next local job application.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-400">Target Role</span>
                  <input
                    type="text"
                    required
                    placeholder="Example: Accountant, Sales Executive"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm bg-[#0a0a1a] rounded-xl border border-white/10"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-400">Experience</span>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
                    className="search-input w-full px-4 py-3 text-sm bg-[#0a0a1a] rounded-xl border border-white/10"
                  >
                    {EXPERIENCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-400">Email</span>
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm bg-[#0a0a1a] rounded-xl border border-white/10"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="sm:col-span-2 min-h-11 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                  Generate Starter Plan
                </button>
              </form>

              {error && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
                  {error}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-[#08081a]/60 p-5 min-h-[280px]">
              {coachPlan ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{coachPlan.focus}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{coachPlan.summary}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {coachPlan.steps.map((step) => (
                      <div key={step} className="flex items-start gap-2 text-xs text-gray-300">
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <p className="text-xs font-semibold text-white mb-2">Practice Questions</p>
                    <div className="space-y-2">
                      {coachPlan.questions.map((question) => (
                        <p key={question} className="text-xs text-gray-400 leading-relaxed">
                          {question}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-12">
                  <Cpu size={34} className="opacity-30 mb-3" />
                  <p className="text-sm font-semibold text-white">Starter plan preview</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Your saved plan appears here after generation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOCK INTERVIEW TAB */}
      {activeTab === 'interview' && (
        <div className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10 bg-white/[0.02]">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <Video size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Mock Interview Simulator</h2>
                <p className="text-xs text-gray-400">Practice responding to generated interview questions and receive instant AI feedback.</p>
              </div>
            </div>

            {interviewStatus === 'idle' && (
              <div className="flex flex-col items-center justify-center py-12 border border-white/5 bg-[#08081a]/40 rounded-2xl text-center">
                <Cpu size={48} className="text-violet-400 opacity-60 mb-4" />
                <h3 className="text-lg font-bold">Start Your Session</h3>
                <p className="text-xs text-gray-400 max-w-md mt-2">
                  The simulator will run through target questions for the **{targetRole || 'selected'}** role. Ensure your microphone is ready.
                </p>
                <button
                  onClick={startInterview}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all cursor-pointer"
                >
                  Start Mock Interview
                </button>
              </div>
            )}

            {(interviewStatus === 'answering' || interviewStatus === 'analyzing') && coachPlan && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    Q{currentQuestionIndex + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300">Question</h3>
                    <p className="text-base text-white mt-1 leading-relaxed">{coachPlan.questions[currentQuestionIndex]}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-400">Your Answer</label>
                    {isRecording && (
                      <span className="flex items-center gap-1.5 text-xs text-rose-400 font-bold">
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                        Recording ({formatTime(recordingTime)})
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    disabled={interviewStatus === 'analyzing'}
                    placeholder="Type your structured answer here, or click the mic to record voice response..."
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#060614] text-sm text-gray-200 focus:outline-none focus:border-violet-500/50"
                  />

                  <div className="flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex gap-2">
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          disabled={interviewStatus === 'analyzing'}
                          className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-500/20 cursor-pointer disabled:opacity-50"
                        >
                          <Mic size={14} /> Record Speech
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-rose-500 cursor-pointer"
                        >
                          <CheckCircle2 size={14} /> Stop & Transcribe
                        </button>
                      )}
                    </div>

                    <button
                      onClick={submitAnswer}
                      disabled={interviewStatus === 'analyzing'}
                      className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {interviewStatus === 'analyzing' ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Analyzing response...
                        </>
                      ) : (
                        <>Submit Response <ArrowRight size={14} /></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {interviewStatus === 'completed' && feedbackResult && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Overall Score', value: `${feedbackResult.score}%`, desc: 'Average evaluation', color: 'text-violet-400' },
                    { label: 'Communication', value: `${feedbackResult.clarity}%`, desc: 'Clarity and pace', color: 'text-emerald-400' },
                    { label: 'Confidence', value: `${feedbackResult.confidence}%`, desc: 'Speech steadiness', color: 'text-cyan-400' },
                    { label: 'Relevance', value: `${feedbackResult.relevance}%`, desc: 'Keyword matching', color: 'text-amber-400' },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                      <span className={`text-2xl font-bold font-outfit ${stat.color}`}>{stat.value}</span>
                      <p className="text-xs font-bold text-white mt-1">{stat.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{stat.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <AlertCircle size={15} className="text-violet-400" /> Evaluation Analysis
                    </h3>
                    <p className="text-xs text-gray-300 mt-2 leading-relaxed">{feedbackResult.analysis}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white">Actionable Suggestions:</h4>
                    {feedbackResult.tips.map((tip: string) => (
                      <div key={tip} className="flex items-start gap-2 text-xs text-gray-400">
                        <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={startInterview}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={14} /> Restart Session
                  </button>

                  <button
                    onClick={nextQuestion}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    Next Question <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESUME ENHANCER TAB */}
      {activeTab === 'resume' && (
        <div className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10 bg-white/[0.02] space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Resume Enhancer Checklist</h2>
              <p className="text-xs text-gray-400">AI evaluates your profile strength and outlines enhancement goals.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_1.5fr] gap-6 items-start">
            <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
              <h3 className="text-sm font-bold">Profile Strength</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Score</span>
                  <span className="font-bold text-emerald-400">{profileStrength}%</span>
                </div>
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${profileStrength}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Profiles with above 80% strength receive 4x higher contact rates from local employers.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Award size={15} className="text-emerald-400" /> Action Checklist
              </h3>

              {resumeTips.length > 0 ? (
                <div className="space-y-3">
                  {resumeTips.map((tip) => (
                    <div key={tip} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex items-start gap-3">
                      <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-300 leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 flex items-center gap-3 text-emerald-400">
                  <CheckCircle2 size={18} />
                  <span className="text-xs font-semibold">Your resume profile details are fully complete! Discovery is optimized.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* JOB MATCHER TAB */}
      {activeTab === 'matcher' && (
        <div className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10 bg-white/[0.02] space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Skills Gap & Job Matcher</h2>
              <p className="text-xs text-gray-400">Analyze target role requirements against your registered profile skills.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_1.3fr] gap-6 items-start">
            <form onSubmit={runJobMatcher} className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
              <h3 className="text-sm font-bold">Compatibility Check</h3>
              <label className="block space-y-1.5">
                <span className="text-xs text-gray-400 font-semibold">Target Job Role</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Executive, Java Developer"
                  value={matchRole}
                  onChange={(e) => setMatchRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0a0a1a] rounded-xl border border-white/10 text-sm focus:outline-none focus:border-cyan-500"
                />
              </label>
              <button
                type="submit"
                disabled={matcherLoading}
                className="w-full min-h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {matcherLoading ? <Loader2 size={14} className="animate-spin" /> : 'Compare Skills'}
              </button>
            </form>

            <div className="min-h-[200px] flex flex-col justify-center">
              {matchResult ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0 h-16 w-16 rounded-full border-4 border-cyan-500/20 flex items-center justify-center">
                      <span className="text-base font-bold text-cyan-400">{matchResult.percentage}%</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Match Compatibility</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Based on {matchResult.skillsCount} profile skills analyzed.</p>
                    </div>
                  </div>

                  {matchResult.matchedSkills.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-emerald-400">Overlapping Skills Found:</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {matchResult.matchedSkills.map((skill: string) => (
                          <span key={skill} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 capitalize">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-400">Missing Core Skills Recommendations:</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.missingSkills.map((skill: string) => (
                        <span key={skill} className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                      Tip: Adding these missing skills to your profile can double your match evaluation score.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <BookOpen size={32} className="opacity-30 mx-auto mb-3" />
                  <p className="text-xs font-bold text-white">Awaiting Analysis</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 max-w-xs mx-auto">
                    Input a target job title on the left to start checking compatibility metrics.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Foot Information cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {PREVIEWS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="glass-card rounded-2xl p-5 border-white/[0.04] bg-white/[0.01]">
              <div className={`w-10 h-10 rounded-xl ${iconColorMap[item.color]} flex items-center justify-center mb-4`}>
                <Icon size={18} />
              </div>
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
