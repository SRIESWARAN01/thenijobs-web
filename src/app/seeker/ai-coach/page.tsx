'use client';

import { useState } from 'react';
import { Sparkles, MessageSquare, Award, Zap, Send, Loader2, BookOpen, UserCheck, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { requestAIService } from '@/lib/ai/aiClient';
import { useToast } from '@/contexts/ToastContext';
import { PageShell } from '@/components/dashboard';

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
      if (res.success && res.data) {
        const reply = typeof res.data === 'string' ? res.data : (res.data.reply || res.data.message || 'I am ready to help!');
        setChatHistory(prev => [...prev, { sender: 'ai', text: reply }]);
      } else {
        toast.error(res.error || 'Failed to get answer');
      }
    } catch {
      toast.error('AI Service temporarily unavailable');
    } finally {
      setAsking(false);
    }
  };

  // Interview Prep state
  const [roleInput, setRoleInput] = useState('');
  const [interviewLang, setInterviewLang] = useState<'en' | 'ta'>('en');
  const [prepLoading, setPrepLoading] = useState(false);
  const [interviewData, setInterviewData] = useState<any>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, any>>({});
  const [evaluating, setEvaluating] = useState<Record<string, boolean>>({});
  const [isRecording, setIsRecording] = useState<Record<string, boolean>>({});

  // Generate Interview Questions with Tamil/English support
  const handleGenerateQuestions = async () => {

    if (!roleInput.trim()) {
      toast.warning('Please enter a Target Job Role.');
      return;
    }
    setPrepLoading(true);
    try {
      const res = await requestAIService({
        feature: 'interview_prep',
        userId: user?.uid,
        userRole: 'SEEKER',
        payload: {
          jobRole: roleInput,
          skills: seekerProfile?.skills || [],
          experience: seekerProfile?.experience || [],
          language: interviewLang === 'ta' ? 'Tamil (bilingual with English technical terms)' : 'English',
        },
      });

      if (res.success && res.data) {
        setInterviewData(res.data);
        toast.success(
          interviewLang === 'ta'
            ? 'நேர்காணல் கேள்விகள் தயார்! (2 AI Credits deducted)'
            : 'Targeted interview questions generated! (2 AI Credits deducted)'
        );
      } else {
        toast.error(res.error || 'Failed to generate interview questions');
      }
    } catch (err) {
      toast.error('AI Service temporarily unavailable');
    } finally {
      setPrepLoading(false);
    }
  };

  // Voice speech-to-text handler
  const handleToggleVoiceRecord = (qId: string) => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.warning('Speech recognition is not supported in this browser. Please type your answer.');
      return;
    }

    if (isRecording[qId]) {
      setIsRecording(prev => ({ ...prev, [qId]: false }));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = interviewLang === 'ta' ? 'ta-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsRecording(prev => ({ ...prev, [qId]: true }));
      toast.info(interviewLang === 'ta' ? 'பேசுங்கள்... உங்கள் குரல் பதிவாகிறது' : 'Speak now... recording your answer');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserAnswers(prev => ({
          ...prev,
          [qId]: (prev[qId] ? prev[qId] + ' ' : '') + transcript,
        }));
        setIsRecording(prev => ({ ...prev, [qId]: false }));
      };

      recognition.onerror = () => {
        setIsRecording(prev => ({ ...prev, [qId]: false }));
        toast.error('Voice input cancelled or unavailable.');
      };

      recognition.onend = () => {
        setIsRecording(prev => ({ ...prev, [qId]: false }));
      };

      recognition.start();
    } catch {
      setIsRecording(prev => ({ ...prev, [qId]: false }));
    }
  };

  // Evaluate User Answer with Tamil/English scoring
  const handleEvaluateAnswer = async (qId: string, qText: string) => {
    const ans = userAnswers[qId];
    if (!ans || !ans.trim()) {
      toast.warning(interviewLang === 'ta' ? 'தயவுசெய்து உங்கள் பதிலை பதிவு செய்யவும்.' : 'Please type or speak your answer before asking for feedback.');
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
          language: interviewLang === 'ta' ? 'Tamil' : 'English',
        },
      });

      if (res.success && res.data) {
        setFeedbacks(prev => ({ ...prev, [qId]: res.data }));
        toast.success(interviewLang === 'ta' ? 'உங்கள் பதில் மதிப்பீடு செய்யப்பட்டது!' : 'Answer evaluated with AI feedback score!');
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
    <PageShell className="max-w-5xl">
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
              aria-label="Ask about suitable jobs, salary ranges, skills to learn, or interview tips" placeholder="Ask about suitable jobs, salary ranges, skills to learn, or interview tips..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-100 border border-gray-200 text-base sm:text-xs text-gray-900 focus:bg-white focus:border-indigo-500 outline-none"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Award size={16} className="text-emerald-600" /> AI Mock Interview Coach &amp; Speech Evaluator
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Practice role-specific interview questions in English or Tamil. Speak or type your answers for instant AI feedback!
                </p>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setInterviewLang('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    interviewLang === 'en' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setInterviewLang('ta')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    interviewLang === 'ta' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  தமிழ் (Tamil)
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
              <input
                type="text"
                value={roleInput}
                onChange={e => setRoleInput(e.target.value)}
                placeholder={interviewLang === 'ta' ? 'எ.கா. அக்கவுண்டன்ட், சேல்ஸ் எக்சிகியூட்டிவ், வெப் டெவலப்பர்' : 'e.g. Accounts Assistant, Sales Executive, React Developer'}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-base sm:text-xs text-gray-900 outline-none"
              />
              <button
                onClick={handleGenerateQuestions}
                disabled={prepLoading}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
              >
                {prepLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {interviewLang === 'ta' ? 'கேள்விகளை உருவாக்கு (2 Credits)' : 'Generate Prep (2 Credits)'}
              </button>
            </div>
          </div>

          {interviewData && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider">
                {interviewLang === 'ta' ? `நேர்காணல் கேள்விகள்: ${interviewData.role || roleInput}` : `Interview Questions for ${interviewData.role || roleInput}`}
              </h4>
              {(interviewData.questions || []).map((q: any, idx: number) => (
                <div key={q.id || idx} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                      {q.category || 'Interview Question'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">Question #{idx + 1}</span>
                  </div>

                  <h5 className="font-bold text-sm text-gray-900 leading-snug">{q.question}</h5>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <p className="font-bold text-emerald-900">
                      {interviewLang === 'ta' ? 'மாதிரி சிறந்த பதில் (Model Answer):' : 'Model Answer:'}
                    </p>
                    <p className="leading-relaxed">{q.modelAnswer}</p>
                  </div>

                  {/* Practice Answer Box */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700">
                        {interviewLang === 'ta' ? 'உங்கள் பதிலை டைப் செய்யவும் அல்லது பேசவும்:' : 'Practice Your Answer (Type or Speak):'}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleVoiceRecord(String(q.id || idx))}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
                          isRecording[String(q.id || idx)]
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isRecording[String(q.id || idx)] ? '⏹ Stop Voice' : '🎤 Speak Answer'}
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={userAnswers[q.id || idx] || ''}
                      onChange={e => setUserAnswers(prev => ({ ...prev, [q.id || idx]: e.target.value }))}
                      placeholder={interviewLang === 'ta' ? 'உங்கள் பதிலை இங்கே உள்ளிடவும்...' : 'Type or speak your response here...'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-base sm:text-xs text-gray-900 outline-none leading-relaxed"
                    />

                    <button
                      onClick={() => handleEvaluateAnswer(q.id || idx, q.question)}
                      disabled={evaluating[q.id || idx]}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {evaluating[q.id || idx] ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      {interviewLang === 'ta' ? 'பதிலை மதிப்பீடு செய் (AI Evaluate)' : 'Evaluate My Answer'}
                    </button>

                    {feedbacks[q.id || idx] && (
                      <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950 space-y-2 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-purple-900 text-sm">
                            ⭐ Overall Score: {feedbacks[q.id || idx].score || 85}%
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 font-bold text-[10px]">
                            AI Verified
                          </span>
                        </div>
                        <p><span className="font-bold text-purple-900">Feedback:</span> {feedbacks[q.id || idx].feedback || feedbacks[q.id || idx].critique}</p>
                        {feedbacks[q.id || idx].improvedAnswer && (
                          <div className="p-2.5 bg-white rounded-xl border border-purple-200 text-purple-950">
                            <span className="font-bold text-purple-900 block mb-0.5">High-Impact Answer:</span>
                            {feedbacks[q.id || idx].improvedAnswer}
                          </div>
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-base sm:text-xs text-gray-900 outline-none"
                />
              </div>
              <div>
                <label htmlFor="seeker-ai-coach-company-name" className="text-xs font-bold text-gray-700 block mb-1">Company Name</label>
                <input id="seeker-ai-coach-company-name"
                  type="text"
                  value={clCompany}
                  onChange={e => setClCompany(e.target.value)}
                  placeholder="e.g. Cardamom Exports Ltd"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-base sm:text-xs text-gray-900 outline-none"
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
    </PageShell>
  );
}
