'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Award, CheckCircle2, XCircle, ShieldCheck, ArrowLeft, Loader2, Calendar, User, BookOpen } from 'lucide-react';

export default function CertificateVerificationPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function verify() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/career-growth/certificate/verify?id=${encodeURIComponent(id)}`);
        const rawText = await res.text();
        let data: any = {};
        try { data = JSON.parse(rawText); } catch {}
        if (data && data.success && data.certificate) {
          setCert(data.certificate);
        } else {
          setError(data?.error || 'Certificate not found or invalid.');
        }
      } catch (err: any) {
        setError(err.message || 'Verification network error.');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 text-white text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center mb-3">
            <Award size={36} className="text-yellow-300" />
          </div>
          <h1 className="text-xl font-black tracking-tight">THENIJOBS Certificate Verification</h1>
          <p className="text-xs text-blue-200 mt-1">Official Skill Credential &amp; Achievement Record</p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 space-y-3">
              <Loader2 size={36} className="animate-spin text-blue-600 mx-auto" />
              <p className="text-sm font-medium text-slate-500">Verifying credential with THENIJOBS registry…</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center">
                <XCircle size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Certificate Verification Failed</h3>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Please double-check the Certificate ID or contact THENIJOBS support at support@thenijobs.com.
              </p>
            </div>
          ) : cert ? (
            <div className="space-y-6">
              {/* Verified Pill */}
              <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Officially Verified &amp; Authentic Credential</span>
              </div>

              {/* Certificate Details Grid */}
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <User size={14} className="text-blue-600" />
                    <span>Recipient Name:</span>
                    <strong className="text-slate-900 text-sm ml-auto">{cert.seekerName}</strong>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <BookOpen size={14} className="text-blue-600" />
                    <span>Course Title:</span>
                    <strong className="text-slate-900 ml-auto text-right">{cert.courseTitle}</strong>
                  </div>

                  {cert.learningPathTitle && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Award size={14} className="text-blue-600" />
                      <span>Career Path:</span>
                      <strong className="text-slate-900 ml-auto text-right">{cert.learningPathTitle}</strong>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={14} className="text-blue-600" />
                    <span>Issue Date:</span>
                    <strong className="text-slate-900 ml-auto">{cert.issueDate}</strong>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Credential ID:</span>
                    <span className="font-mono font-bold text-blue-700 ml-auto">{cert.verificationId}</span>
                  </div>

                  {cert.quizScore !== null && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>Assessment Score:</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold ml-auto">
                        {cert.quizScore}% Pass
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-center text-[11px] text-slate-400">
                  Issued by {cert.organization} · Verified in Theni District, Tamil Nadu.
                </div>
              </div>
            </div>
          ) : null}

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/"
              className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={14} /> Back to THENIJOBS
            </Link>

            <Link
              href="/jobs"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Explore Job Openings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
