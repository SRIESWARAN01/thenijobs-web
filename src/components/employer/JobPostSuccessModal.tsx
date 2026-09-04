'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2, Sparkles, Clock, Briefcase, Building2, MapPin,
  Banknote, ArrowRight, Plus, Eye, ShieldCheck, Check, X
} from 'lucide-react';

export interface JobPostSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostAnother: () => void;
  jobOrdinal: string; // e.g. "Primary Job", "Second Job", "Third Job"
  jobNumber: number;
  maxPlanLimit: number;
  planName: string;
  job: {
    id?: string;
    title: string;
    companyName: string;
    district: string;
    location?: string;
    jobType: string;
    salary?: string;
    openings?: number | string;
  } | null;
}

export default function JobPostSuccessModal({
  isOpen,
  onClose,
  onPostAnother,
  jobOrdinal,
  jobNumber,
  maxPlanLimit,
  planName,
  job,
}: JobPostSuccessModalProps) {
  if (!isOpen || !job) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs font-outfit"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-emerald-200 animate-fade-in max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Colorful Gradient Header with Sparkles */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-blue-600 to-indigo-700 p-6 text-white text-center overflow-hidden">
          {/* Subtle Ambient Shapes */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-emerald-400/20 blur-xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          {/* Success Icon with Glow Ring */}
          <div className="relative mx-auto mb-3 w-16 h-16 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-lg shadow-black/20 animate-bounce">
            <CheckCircle2 size={36} className="text-emerald-600" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[10px] font-black shadow-xs">
              ✨
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-extrabold uppercase tracking-wider mb-2 border border-white/30">
            <Sparkles size={13} className="text-amber-300" /> {jobOrdinal} Confirmation
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
            Congratulations!
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-sm mx-auto font-medium">
            Your <strong>{jobOrdinal}</strong> ({jobNumber} of {maxPlanLimit === 999 ? 'Unlimited' : maxPlanLimit} in {planName} Plan) has been submitted successfully!
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Job Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {job.jobType.replace('_', ' ')}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1 leading-snug">
                  {job.title}
                </h3>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                  <Building2 size={13} className="text-blue-600" /> {job.companyName}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold flex items-center gap-1 border border-amber-200">
                  <Clock size={11} className="animate-pulse" /> Pending Review
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-xs text-gray-700">
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-500 shrink-0" />
                <span className="truncate">{job.location ? `${job.location}, ` : ''}{job.district}</span>
              </div>
              {job.salary && (
                <div className="flex items-center gap-1.5 justify-end">
                  <Banknote size={13} className="text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-800">{job.salary}</span>
                </div>
              )}
            </div>
          </div>

          {/* Workflow Status Explanation */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs space-y-1.5 text-blue-950">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <ShieldCheck size={15} className="text-blue-600 shrink-0" />
              <span>Next Step: Admin Review &amp; Live Activation</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Your job has entered the <strong>Admin Review Queue</strong>. Our local moderation team verifies all postings (usually within <strong>2 to 4 hours</strong>). Once approved, it will automatically go live across the <strong>Jobs Page, Search, Daily Jobs, and Landing Page</strong>!
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onPostAnother}
                className="py-3 px-3 rounded-2xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus size={14} /> Post Another Job
              </button>

              <Link
                href="/employer/jobs"
                className="py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer text-center"
              >
                <Briefcase size={14} /> View My Jobs
              </Link>
            </div>

            <Link
              href="/employer/dashboard"
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-all text-center block"
            >
              Back to Employer Dashboard <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
