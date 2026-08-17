'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Ticket, Calendar, Building2, Briefcase, ArrowRight, Sparkles, X, MapPin } from 'lucide-react';

interface JobApplySuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  district?: string;
  applicationId?: string;
  appliedDate?: string;
}

export default function JobApplySuccessModal({
  isOpen,
  onClose,
  jobTitle,
  companyName,
  district = 'Theni',
  applicationId,
  appliedDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
}: JobApplySuccessModalProps) {
  if (!isOpen) return null;

  const displayId = applicationId ? applicationId.slice(-8).toUpperCase() : `TJ-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Pink Header */}
        <div className="relative bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 px-6 pt-7 pb-6 text-white text-center overflow-hidden">
          {/* Background Sparkle Shapes */}
          <div className="absolute top-2 left-4 w-12 h-12 bg-white/10 rounded-full blur-xs" />
          <div className="absolute -bottom-4 right-4 w-16 h-16 bg-white/15 rounded-full blur-sm" />
          
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Success Icon & Badge */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-pink-600 shadow-lg shadow-pink-900/20 mb-3 animate-bounce">
            <CheckCircle2 size={32} className="stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles size={12} className="text-amber-200" /> Application Confirmed
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Congratulations!
          </h2>
          <p className="text-pink-100 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
            Your job application has been submitted successfully.
          </p>
        </div>

        {/* 🎟️ Pink Ticket Card */}
        <div className="p-5 sm:p-6 bg-[#FDF2F8]">
          <div className="relative bg-white rounded-2xl border-2 border-pink-200 shadow-sm p-4.5 sm:p-5">
            {/* Perforated ticket cutouts left & right */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#FDF2F8] rounded-full border-r-2 border-pink-200" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#FDF2F8] rounded-full border-l-2 border-pink-200" />

            {/* Ticket Header */}
            <div className="flex items-center justify-between border-b border-pink-100 pb-3 mb-3">
              <div className="flex items-center gap-1.5">
                <Ticket size={16} className="text-pink-600" />
                <span className="text-[11px] font-bold tracking-wider text-pink-700 uppercase">OFFICIAL JOB PASS</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 border border-pink-200">
                #{displayId}
              </span>
            </div>

            {/* Job Details */}
            <div className="space-y-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Position</span>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight flex items-center gap-1.5">
                  <Briefcase size={16} className="text-pink-600 shrink-0" />
                  <span>{jobTitle}</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-pink-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Company</span>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Building2 size={13} className="text-pink-500 shrink-0" />
                    <span className="truncate">{companyName}</span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</span>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <MapPin size={13} className="text-pink-500 shrink-0" />
                    <span className="truncate">{district}</span>
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-pink-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
                  <Calendar size={13} className="text-pink-500" />
                  <span>{appliedDate}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Applied / Pending Review
                </div>
              </div>
            </div>
          </div>

          {/* 7-Day SLA Policy Note */}
          <div className="mt-3.5 px-3.5 py-2.5 rounded-xl bg-pink-100/60 border border-pink-200 text-pink-900 text-[11px] leading-relaxed">
            <span className="font-bold">⏱️ What happens next:</span> Your application is now in{' '}
            <span className="font-bold underline">My Applications</span>. The employer will review your profile and respond within{' '}
            <span className="font-bold">7 days</span>.
          </div>

          {/* Action Buttons */}
          <div className="mt-4.5 space-y-2">
            <Link
              href="/seeker/applications"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-pink-600/25 transition-all text-center"
            >
              <span>View in My Applications</span>
              <ArrowRight size={16} />
            </Link>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              Continue Browsing Jobs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
