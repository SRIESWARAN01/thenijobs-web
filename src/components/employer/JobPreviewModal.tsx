'use client';

import { X, MapPin, Banknote, Clock, Users, Calendar, GraduationCap, Briefcase, Building2, CheckCircle2, Share2 } from 'lucide-react';

interface JobPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    title: string;
    description?: string;
    companyName?: string;
    companyLogo?: string;
    isVerified?: boolean;
    district?: string;
    location?: string;
    salaryMin?: number;
    salaryMax?: number;
    salary?: string;
    jobType?: string;
    openings?: string | number;
    experience?: string;
    education?: string;
    skills?: string[];
    benefits?: string[];
    deadline?: string;
    requirements?: string[];
    responsibilities?: string[];
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
  companyData?: {
    name: string;
    logo?: string;
    category?: string;
    district?: string;
    isVerified?: boolean;
    rating?: number;
    reviewCount?: number;
  };
}

export default function JobPreviewModal({ isOpen, onClose, job, companyData }: JobPreviewModalProps) {
  if (!isOpen) return null;

  const salary = job.salaryMin && job.salaryMax
    ? `₹${Number(job.salaryMin).toLocaleString('en-IN')} – ₹${Number(job.salaryMax).toLocaleString('en-IN')}/mo`
    : job.salary || 'Negotiable';

  const companyName = job.companyName || companyData?.name || 'Your Company';
  const logoInitial = companyName[0]?.toUpperCase() || 'C';

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Preview Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-white/90">📱 Candidate View Preview</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white transition-all tap-target-auto">
            <X size={16} />
          </button>
        </div>

        {/* Job Header */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-start gap-4">
            {/* Company Logo */}
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
              {companyData?.logo ? (
                <img src={companyData.logo} alt={companyName} className="w-full h-full rounded-xl object-cover" />
              ) : logoInitial}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {job.title || 'Job Title'}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm text-gray-600">{companyName}</span>
                {(companyData?.isVerified || job.isVerified) && (
                  <CheckCircle2 size={14} className="text-blue-600" fill="#EFF6FF" />
                )}
              </div>
            </div>
          </div>

          {/* Quick Info Row */}
          <div className="flex flex-wrap gap-3 mt-4">
            {job.district && (
              <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                <MapPin size={13} className="text-slate-500" /> {job.district}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
              <Banknote size={13} className="text-slate-500" /> {salary}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
              <Clock size={13} className="text-slate-500" /> {job.jobType || 'Full Time'}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
              <Calendar size={13} className="text-slate-500" /> Posted Today
            </span>
            {job.openings && (
              <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                <Users size={13} className="text-slate-500" /> {job.openings} Openings
              </span>
            )}
          </div>
        </div>

        {/* Job Details Body */}
        <div className="px-5 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Description */}
          {job.description && (
            <section>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Job Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
            </section>
          )}

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Responsibilities</h3>
              <ul className="space-y-1.5">
                {job.responsibilities.map((r, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span> {r}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Requirements</h3>
              <ul className="space-y-1.5">
                {job.requirements.map((r, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span> {r}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Skills Required</h3>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Education & Experience Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {job.education && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap size={14} className="text-slate-500" />
                  <span className="text-[10px] font-semibold text-gray-500 uppercase">Education</span>
                </div>
                <p className="text-sm font-medium text-gray-800">{job.education}</p>
              </div>
            )}
            {job.experience && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase size={14} className="text-slate-500" />
                  <span className="text-[10px] font-semibold text-gray-500 uppercase">Experience</span>
                </div>
                <p className="text-sm font-medium text-gray-800">{job.experience}</p>
              </div>
            )}
          </div>

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Benefits & Perks</h3>
              <div className="flex flex-wrap gap-1.5">
                {job.benefits.map((b, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                    ✨ {b}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Deadline */}
          {job.deadline && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
              <Calendar size={16} className="text-amber-600" />
              <p className="text-sm text-amber-800 font-medium">
                Application Deadline: <strong>{new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </p>
            </div>
          )}

          {/* Company Info */}
          {companyData && (
            <section className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">About {companyName}</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ background: '#2563EB' }}>
                  {logoInitial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{companyName}</p>
                  <p className="text-xs text-gray-500">
                    {companyData.category || 'Company'} • {companyData.district || 'Tamil Nadu'}
                    {companyData.rating ? ` • ⭐ ${companyData.rating}` : ''}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 bg-gray-50">
          <button className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{ background: '#2563EB' }} onClick={onClose}>
            <Briefcase size={15} /> Apply Now
          </button>
          <button className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-white transition-all flex items-center gap-2"
            onClick={onClose}>
            <Share2 size={15} /> Share
          </button>
        </div>

        {/* Preview Note */}
        <div className="bg-blue-50 px-5 py-2 text-center">
          <p className="text-[10px] text-blue-600 font-medium">
            ⚡ This is a preview. The job is NOT published yet.
          </p>
        </div>
      </div>
    </div>
  );
}
