'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, CheckCircle2, AlertTriangle, Lightbulb, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { requestAIService } from '@/lib/ai/aiClient';
import { PageHeader, PageShell, Card, CardHeader, CardBody, Button } from '@/components/dashboard';
import { useToast } from '@/contexts/ToastContext';

interface AnalysisResult {
  score: number;
  extractedFields: {
    totalYearsExperience?: string;
    highestEducation?: string;
    topSkills?: string[];
    seniorityLevel?: string;
  };
  strengths: string[];
  gaps: string[];
  recommendedSkills: string[];
  suitableRoles: string[];
}

/**
 * AI-SEEKER-1: analyzes the seeker's ACTUAL structured profile data (education, experience,
 * skills, certifications -- the same fields the resume builder already treats as canonical), not
 * an uploaded PDF/DOC binary. This codebase has no text-extraction infrastructure for uploaded
 * resume files (see this phase's own ledger research entry); analyzing the seeker's real entered
 * data is the honest, in-scope way to produce a genuine score from real fields.
 */
export default function ResumeAnalyzePage() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: profile, loading: profileLoading } = useDocument<any>('seekerProfiles', user?.uid);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!profile) {
      toast.warning('Complete your profile first so there is real data to analyze.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      const resumeData = {
        personal: {
          name: profile.name,
          summary: profile.summary || profile.aboutMe,
          careerObjective: profile.careerObjective,
        },
        education: profile.education || [],
        experience: profile.experience || [],
        skills: (profile.skills || []).map((s: any) => (typeof s === 'string' ? s : s.name)),
        certifications: profile.certifications || [],
      };

      const res = await requestAIService<AnalysisResult>({
        feature: 'resume_analysis',
        userId: user?.uid,
        payload: { resumeData },
      });

      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || 'Could not analyze your resume right now.');
      }
    } catch (err) {
      console.error('[ResumeAnalyze] failed:', err);
      setError('Could not analyze your resume right now.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <PageShell className="max-w-4xl">
      <PageHeader
        title="AI resume analysis"
        description="See a real score, strengths and gaps based on your own entered profile data -- never invented."
        breadcrumbs={[{ label: 'Seeker', href: '/seeker/dashboard' }, { label: 'Resume', href: '/seeker/resume' }, { label: 'Analyze' }]}
      />

      {!result && (
        <Card>
          <CardBody className="flex flex-col items-center text-center gap-4 py-10">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Sparkles size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Analyze your resume</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                We analyze the education, experience, and skills you&apos;ve already entered in your profile -- a score, strengths, gaps, and role suggestions, grounded only in your real data.
              </p>
            </div>
            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertTriangle size={13} /> {error}</p>
            )}
            <Button variant="primary" onClick={handleAnalyze} loading={analyzing || profileLoading}>
              <Sparkles size={14} /> {analyzing ? 'Analyzing…' : 'Analyze My Resume'}
            </Button>
          </CardBody>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          <Card>
            <CardBody className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full border-4 border-blue-100 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-blue-600">{result.score}</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Resume Score</h2>
                <p className="text-xs text-slate-500 mt-0.5">out of 100, based on your actual entered data</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="What we found in your data" />
            <CardBody className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Experience</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{result.extractedFields.totalYearsExperience || '—'} yrs</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Education</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{result.extractedFields.highestEducation || '—'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Level</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{result.extractedFields.seniorityLevel || '—'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Top Skills</span>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">{(result.extractedFields.topSkills || []).join(', ') || '—'}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Strengths" />
            <CardBody className="space-y-2">
              {result.strengths.map((s, i) => (
                <p key={i} className="text-xs text-slate-700 flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" /> {s}</p>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Gaps to address" />
            <CardBody className="space-y-2">
              {result.gaps.map((g, i) => (
                <p key={i} className="text-xs text-slate-700 flex items-start gap-2"><AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" /> {g}</p>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Skills to consider learning" description="Suggestions, not claims about what you already have" />
            <CardBody className="flex flex-wrap gap-2">
              {result.recommendedSkills.map((s, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1"><Lightbulb size={11} /> {s}</span>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Suitable roles" description="Based on your actual background" />
            <CardBody className="flex flex-wrap gap-2">
              {result.suitableRoles.map((r, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1"><Briefcase size={11} /> {r}</span>
              ))}
            </CardBody>
          </Card>

          <Button variant="secondary" onClick={() => setResult(null)} block>
            <TrendingUp size={14} /> Re-analyze
          </Button>
        </div>
      )}
    </PageShell>
  );
}
