'use client';

import { useState } from 'react';
import { Target, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import type { Quiz } from '@/lib/types/lms';

interface QuizEngineProps {
  quiz: Quiz;
  onSubmit: (score: number, passed: boolean, answers: Record<string, number>) => void;
  attemptsMade: number;
}

export default function QuizEngine({ quiz, onSubmit, attemptsMade }: QuizEngineProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < quiz.questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    let correctCount = 0;
    quiz.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / quiz.questions.length) * 100);
    const hasPassed = finalScore >= quiz.passingScore;

    setScore(finalScore);
    setPassed(hasPassed);
    setSubmitted(true);

    onSubmit(finalScore, hasPassed, answers);
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setPassed(false);
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/[0.08] bg-white/[0.01] space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div>
          <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full font-black uppercase tracking-widest inline-block">
            Module Assessment
          </span>
          <h2 className="text-lg font-bold text-white mt-2">{quiz.title}</h2>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>Passing: <strong>{quiz.passingScore}%</strong></p>
          <p className="mt-0.5">Attempts: <strong>{attemptsMade} / {quiz.maxAttempts}</strong></p>
        </div>
      </div>

      {!submitted ? (
        <div className="space-y-6">
          {quiz.questions.map((q, idx) => (
            <div key={q.id} className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-sm font-semibold text-white">Q{idx + 1}. {q.question}</p>
              <div className="grid grid-cols-1 gap-2">
                {q.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(q.id, optIdx)}
                    className={`text-left p-3 rounded-lg text-xs transition-all border ${answers[q.id] === optIdx ? 'bg-violet-500/10 border-violet-500/30 text-violet-300 font-medium' : 'bg-slate-900/40 border-white/[0.06] text-gray-400 hover:bg-white/[0.03]'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < quiz.questions.length}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-xs uppercase tracking-wider text-center text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Submit Assessment
          </button>
        </div>
      ) : (
        <div className="text-center p-6 space-y-6">
          <div className="flex justify-center">
            {passed ? (
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={36} />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-400">
                <XCircle size={36} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">
              {passed ? 'Congratulations! You Passed' : 'Assessment Failed'}
            </h3>
            <p className="text-3xl font-black font-outfit" style={{ color: passed ? '#10B981' : '#F43F5E' }}>
              {score}% Score
            </p>
            <p className="text-xs text-gray-500">
              Required: {quiz.passingScore}% • Correct: {Math.round((score / 100) * quiz.questions.length)} / {quiz.questions.length}
            </p>
          </div>

          {/* Correct options display and explanations */}
          <div className="text-left space-y-4 max-h-[300px] overflow-y-auto no-scrollbar border-t border-b border-white/[0.06] py-4">
            {quiz.questions.map((q, idx) => {
              const isCorrect = answers[q.id] === q.correctAnswer;
              return (
                <div key={q.id} className="text-xs p-3 rounded-lg bg-white/[0.01] border border-white/[0.04]">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    {isCorrect ? <CheckCircle2 size={13} className="text-emerald-400" /> : <XCircle size={13} className="text-rose-400" />}
                    Q{idx + 1}. {q.question}
                  </p>
                  <p className="mt-2 text-gray-500">
                    Your answer: <span className={isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{q.options[answers[q.id] as number]}</span>
                  </p>
                  {!isCorrect && (
                    <p className="text-emerald-500 font-medium mt-1">Correct answer: {q.options[q.correctAnswer]}</p>
                  )}
                  {q.explanation && (
                    <p className="text-gray-500 mt-1 italic font-light">{q.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            {!passed && quiz.allowRetake && attemptsMade < quiz.maxAttempts && (
              <button
                onClick={handleRetake}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-xs uppercase tracking-wider text-center text-white flex items-center justify-center gap-2"
              >
                <RefreshCw size={13} /> Retake Assessment
              </button>
            )}
            {!passed && attemptsMade >= quiz.maxAttempts && (
              <div className="flex-1 p-3 bg-red-500/10 rounded-xl text-xs text-rose-400 font-semibold border border-red-500/15 flex items-center gap-1.5 justify-center">
                <AlertCircle size={14} /> Maximum attempts reached.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
