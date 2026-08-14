'use client';

import { useState } from 'react';
import { Sparkles, MessageSquare, Award, Zap, Send, Loader2, BookOpen, UserCheck, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { requestAIService } from '@/lib/ai/aiClient';
import { useToast } from '@/contexts/ToastContext';

type Tab = 'assistant' | 'interview' | 'cover_letter';

export default function AICoachPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: seekerProfile } = useDocument<any>('seekerProfiles', user?.uid);

  const [activeTab, setActiveTab] = useState<Tab>('assistant');

  // Career Assistant state
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Vanakkam! I am your AI Career Coach. Ask me about career paths, skills to learn for local jobs in Theni/Tamil Nadu, salary expectations, or profile optimization!',
    },
  ]);

  // Interview Prep state
  const [roleInput, setRoleInput] = useState('');
  const [prepLoading, setPrepLoading] = useState(false);
  const [interviewData, setInterviewData] = useState<any>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, any>>({});
  const [evaluating, setEvaluating] = useState<Record<string, boolean>>({});

  // Cover Letter state
  const [clJobTitle, setClJobTitle] = useState('');
  const [clCompany, setClCompany] = useState('');
  const [clGenerating, setClGenerating] = useState(false);
  const [coverLetterResult, setCoverLetterResult] = useState<any>(null);

  // Handle Career Assistant
  const handleAskQuestion = async () => {
    if (!question.trim() || asking) return;
    const userQ = question.trim();
    setChatHistory(prev => [...prev, { sender: 'user', text: userQ }]);
    setQuestion('');
    setAsking(true);

    try {
      const res = await requestAIService({
        feature: 'career_assistant',
        userId: user?.uid,
        userRole: 'SEEKER',
        payload: {
          question: userQ,
          profile: seekerProfile,
        },
      });

      const reply = res.success && res.rawContent ? res.rawContent : (res.error || 'AI is temporarily unavailable.');
      setChatHistory(prev => [...prev, { sender: 'ai', text: reply }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'AI is temporarily unavailable. Please try again.' }]);
    } finally {
      setAsking(false);
    }
  };

  // Generate Interview Questions
  const handleGenerateQuestions = async () => {
    if (!roleInput.trim()) {
      toast.warning('Please enter a target job role.');
      return;
    }
    setPrepLoading(true);
    setInterviewData(null);
    try {
      const res = await requestAIService({
        feature: 'interview_prep',
        userId: user?.uid,
        userRole: 'SEEKER',
        payload: {
          role: roleInput.trim(),
          skills: seekerProfile?.skills || [],
        },
      });

      if (res.success && res.data) {
        setInterviewData(res.data);
        toast.success('Generated interview questions! (2 AI Credits deducted)');
      } else {
        toast.error(res.error || 'Failed to generate interview prep');
      }
    } catch (err) {
      toast.error('AI Service temporarily unavailable');
    } finally {
      setPrepLoading(false);
    }
  };

  // Evaluate User Answer
  const handleEvaluateAnswer = async (qId: string, qText: string) => {
    const ans = userAnswers[qId];
    if (!ans || !ans.trim()) {
      toast.warning('Please type your answer before asking for feedback.');
      return;
    }

    setEvaluating(prev => ({ ...prev, [qId]: true }));
    try {
      const res = await requestAIService({
        feature: 'interview_prep',
        userId: user?.uid,
        userRole: 'SEEKER',
        payload: {
          question: qText,
          userAnswer: ans,
        },
      });

      if (res.success && res.data) {
        setFeedbacks(prev => ({ ...prev, [qId]: res.data }));
        toast.success('Answer evaluated!');
      } else {
        toast.error(res.error || 'Evaluation failed');
      }
    } catch (err) {
      toast.error('AI Service temporarily unavailable');
    } finally {
      setEvaluating(prev => ({ ...prev, [qId]: false }));
    }
  };

  // Generate Cover Letter
  const handleGenerateCoverLetter = async () => {
    if (!clJobTitle.trim() || !clCompany.trim()) {
      toast.warning('Please enter Target Job Title and Company Name');
      return;
    }
    setClGenerating(true);
    try {
      const res = await requestAIService({
        feature: 'cover_letter',
        userId: user?.uid,
        userRole: 'SEEKER',
        payload: {
          jobTitle: clJobTitle,
          companyName: clCompany,
          candidateName: seekerProfile?.name || user?.displayName || 'Candidate',
          skills: seekerProfile?.skills || [],
          experienceSummary: seekerProfile?.summary || '',
        },
      });

      if (res.success && res.data) {
        setCoverLetterResult(res.data);
        toast.success('Cover Letter generated! (2 AI Credits deducted)');
      } else {
        toast.error(res.error || 'Cover letter generation failed');
      }
    } catch (err) {
      toast.error('AI Service temporarily unavailable');
    } finally {
      setClGenerating(false);
    }
  };

  return (
    <div className="animate-fade-in-up space-y-6 max-w-5xl mx-auto font-outfit text-gray-900 py-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider">
                Groq AI Engine
              </span>
              <span className="text-xs text-indigo-200">24/7 AI Career Coach</span>
            </div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              THENIJOBS AI Career Center <Sparkles size={20} className="text-amber-400 fill-amber-400" />
            </h1>
            <p className="text-xs text-indigo-100/80 max-w-xl">
              Get personalized career advice, practice interview questions with instant model answers, and draft ATS-winning cover letters.
            </p>
          </div>

          <div className="flex bg-white/10 p-1 rounded-2xl border border-white/10 shrink-0">
            <button
              onClick={() => setActiveTab('assistant')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'assistant' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              Career Coach
            </button>
            <button
              onClick={() => setActiveTab('interview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'interview' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              Interview Prep
            </button>
            <button
              onClick={() => setActiveTab('cover_letter')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'cover_letter' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              Cover Letter
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: CAREER ASSISTANT */}
      {activeTab === 'assistant' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[580px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <MessageSquare size={16} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-gray-900">Interactive Career Coach</h3>
                <p className="text-[10px] text-gray-500">Cost: 1 AI Credit per question</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-1">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none font-medium shadow-xs'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-xs whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-gray-300 text-gray-800 font-bold text-xs flex items-center justify-center shrink-0 mt-1">
                    You
                  </div>
                )}
              </div>
            ))}
            {asking && (
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <Loader2 size={14} className="animate-spin text-indigo-600" /> AI Coach is thinking...
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAskQuestion()}
              placeholder="Ask about suitable jobs, salary ranges, skills to learn, or interview tips..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-100 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-indigo-500 outline-none"
            />
            <button
              onClick={handleAskQuestion}
              disabled={asking}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Send size={14} /> Send
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: INTERVIEW PREPARATION */}
      {activeTab === 'interview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Award size={16} className="text-emerald-600" /> AI Interview Question Generator & Evaluation
            </h3>
            <p className="text-xs text-gray-600">
              Enter your job role to generate targeted technical & HR questions with model answers. Practice your answers for AI feedback!
            </p>

            <div className="flex gap-2 max-w-lg">
              <input
                type="text"
                value={roleInput}
                onChange={e => setRoleInput(e.target.value)}
                placeholder="e.g. Accounts Assistant, Accountant, Java Developer, Sales Exec"
                className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-900 outline-none"
              />
              <button
                onClick={handleGenerateQuestions}
                disabled={prepLoading}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {prepLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Generate Prep (2 Credits)
              </button>
            </div>
          </div>

          {interviewData && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider">
                Interview Questions for {interviewData.role || roleInput}
              </h4>
              {(interviewData.questions || []).map((q: any, idx: number) => (
                <div key={q.id || idx} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                      {q.category || 'Interview Question'}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">Question #{idx + 1}</span>
                  </div>

                  <h5 className="font-bold text-sm text-gray-900">{q.question}</h5>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <p className="font-bold text-emerald-900">Model Answer:</p>
                    <p>{q.modelAnswer}</p>
                  </div>

                  {/* Practice Answer Box */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="text-xs font-bold text-gray-700 block">Practice Your Answer:</label>
                    <textarea
                      rows={2}
                      value={userAnswers[q.id || idx] || ''}
                      onChange={e => setUserAnswers(prev => ({ ...prev, [q.id || idx]: e.target.value }))}
                      placeholder="Type your response here..."
                      className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 outline-none"
                    />
                    <button
                      onClick={() => handleEvaluateAnswer(q.id || idx, q.question)}
                      disabled={evaluating[q.id || idx]}
                      className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {evaluating[q.id || idx] ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Evaluate My Answer
                    </button>

                    {feedbacks[q.id || idx] && (
                      <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950 space-y-1.5 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-900">Score: {feedbacks[q.id || idx].score}%</span>
                        </div>
                        <p><span className="font-bold">Feedback:</span> {feedbacks[q.id || idx].feedback}</p>
                        {feedbacks[q.id || idx].improvedAnswer && (
                          <p><span className="font-bold">Improved Version:</span> {feedbacks[q.id || idx].improvedAnswer}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COVER LETTER */}
      {activeTab === 'cover_letter' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <FileText size={16} className="text-cyan-600" /> AI Cover Letter Generator
            </h3>
            <p className="text-xs text-gray-600">
              Generate a professional cover letter tailored to your profile and target company.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Target Job Title</label>
                <input
                  type="text"
                  value={clJobTitle}
                  onChange={e => setClJobTitle(e.target.value)}
                  placeholder="e.g. Senior Accountant"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Company Name</label>
                <input
                  type="text"
                  value={clCompany}
                  onChange={e => setClCompany(e.target.value)}
                  placeholder="e.g. Cardamom Exports Ltd"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateCoverLetter}
              disabled={clGenerating}
              className="px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {clGenerating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              Generate Cover Letter (2 AI Credits)
            </button>
          </div>

          {coverLetterResult && (
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h4 className="font-bold text-sm text-gray-900">{coverLetterResult.subject || 'Cover Letter Preview'}</h4>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(coverLetterResult.coverLetter || '');
                    toast.success('Cover Letter copied to clipboard!');
                  }}
                  className="text-xs font-bold text-cyan-700 hover:text-cyan-800 bg-cyan-50 px-3 py-1.5 rounded-xl border border-cyan-200"
                >
                  Copy Text
                </button>
              </div>

              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 text-xs text-gray-800 whitespace-pre-line leading-relaxed">
                {coverLetterResult.coverLetter}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
