'use client';

import React from 'react';
import { CheckCircle2, Calendar, Clock, Video, MapPin, Phone, Briefcase, User, Sparkles, X } from 'lucide-react';

interface InterviewConfirmedModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  jobTitle: string;
  interviewDate: string;
  interviewTime: string;
  interviewMode: string;
  locationOrLink?: string;
}

export default function InterviewConfirmedModal({
  isOpen,
  onClose,
  candidateName,
  jobTitle,
  interviewDate,
  interviewTime,
  interviewMode,
  locationOrLink,
}: InterviewConfirmedModalProps) {
  if (!isOpen) return null;

  const ModeIcon =
    interviewMode.toLowerCase().includes('video') ? Video :
    interviewMode.toLowerCase().includes('phone') ? Phone :
    MapPin;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 pt-7 pb-6 text-white text-center overflow-hidden">
          <div className="absolute top-2 left-4 w-12 h-12 bg-white/10 rounded-full blur-xs" />
          <div className="absolute -bottom-4 right-4 w-16 h-16 bg-white/15 rounded-full blur-sm" />

          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Success Check Icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-emerald-600 shadow-lg shadow-emerald-900/20 mb-3 animate-bounce">
            <CheckCircle2 size={32} className="stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles size={12} className="text-amber-200" /> One-Time Confirmation
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Interview Confirmed!
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
            Interview meeting details have been scheduled and notified to the candidate.
          </p>
        </div>

        {/* Meeting Details Card */}
        <div className="p-5 sm:p-6 bg-slate-50">
          <div className="bg-white rounded-2xl border border-slate-200 p-4.5 space-y-3 shadow-xs">
            {/* Candidate & Role */}
            <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center border border-emerald-200 shrink-0">
                <User size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate</span>
                <h4 className="text-sm font-extrabold text-slate-900 truncate">{candidateName}</h4>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <Briefcase size={12} className="text-slate-400" />
                  <span className="truncate">{jobTitle}</span>
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Date</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Calendar size={13} className="text-emerald-600" />
                  <span>{interviewDate}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Time</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Clock size={13} className="text-emerald-600" />
                  <span>{interviewTime}</span>
                </div>
              </div>
            </div>

            {/* Mode / Location */}
            <div className="bg-emerald-50/70 rounded-xl p-2.5 border border-emerald-100 flex items-center gap-2">
              <ModeIcon size={16} className="text-emerald-700 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Meeting Mode</span>
                <p className="text-xs font-bold text-emerald-950 truncate">
                  {interviewMode} {locationOrLink ? `· ${locationOrLink}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Status Note */}
          <div className="mt-3.5 px-3.5 py-2.5 rounded-xl bg-emerald-100/60 border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
            <span className="font-bold">✓ Application Updated:</span> Status is now{' '}
            <span className="font-bold underline">Interview Scheduled</span>. Candidate received an in-app &amp; portal notification.
          </div>

          {/* Close Action */}
          <div className="mt-4.5">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Done / Return to Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
