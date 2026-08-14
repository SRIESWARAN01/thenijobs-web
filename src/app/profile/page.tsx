'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  User, Building2, Shield, Mail, Phone, MapPin, Briefcase, GraduationCap,
  Award, Sparkles, ExternalLink, Edit3, LogOut, CheckCircle2, Globe, Crown,
  BadgeCheck, Lock, ArrowRight, FileText, Wrench, Package, FolderGit2, Star,
  Loader2, ShieldAlert, AlertCircle, ChevronRight, Check, Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';

export default function ProfileHubPage() {
  const { user, firebaseUser, loading: authLoading, logout } = useAuth() as any;
  const router = useRouter();

  const uid = user?.uid || firebaseUser?.uid;
  const role = user?.role || 'job_seeker';

  // Fetch company data if employer/business owner
  const isEmployer = role === 'employer' || role === 'business_owner' || role === 'supplier' || role === 'service_provider';
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', uid || '')
  ], { skip: !uid || !isEmployer });

  const company = companies?.[0];

  // Loading state
  if (authLoading || (isEmployer && companyLoading)) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] font-sans pb-24 font-outfit">
        <Header />
        <div className="pt-24 flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">Loading your profile...</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  // Unauthenticated state
  if (!uid) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] font-sans pb-24 font-outfit">
        <Header />
        <div className="pt-24 max-w-md mx-auto px-4">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Lock size={32} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Sign In to View Profile</h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              Please log in or create an account on THENIJOBS to view and manage your profile, applications, or company listings.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login?redirect=/profile"
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2">
                Log In <ArrowRight size={16} />
              </Link>
              <Link href="/register"
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all">
                Register New Account
              </Link>
            </div>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  // ─── ADMIN PROFILE VIEW ───
  if (role === 'admin' || role === 'super_admin') {
    return (
      <main className="min-h-screen bg-[#F8FAFC] font-sans pb-24 font-outfit">
        <Header />
        <div className="pt-20 max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white font-bold text-xl flex items-center justify-center">
                <Shield size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{user?.displayName || 'Administrator'}</h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                    {role === 'super_admin' ? 'SUPER ADMIN' : 'ADMINISTRATOR'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                <p className="text-[11px] text-gray-400 mt-1">THENIJOBS Platform Administration</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/admin/dashboard" className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100/80 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Admin Dashboard</p>
                    <p className="text-[11px] text-gray-500">Manage platform & analytics</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>

              <Link href="/admin/businesses" className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100/80 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Company Approvals</p>
                    <p className="text-[11px] text-gray-500">Review pending registrations</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => void logout()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-all">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  // ─── COMPANY / EMPLOYER PROFILE VIEW ───
  if (isEmployer) {
    const compName = company?.name || user?.displayName || 'My Business';
    const logoChar = compName[0]?.toUpperCase() || 'C';
    const compId = company?.id ? `TN-BIZ-${company.id.slice(0, 6).toUpperCase()}` : `TN-BIZ-${uid.slice(0, 6).toUpperCase()}`;

    return (
      <main className="min-h-screen bg-[#F8FAFC] font-sans pb-24 font-outfit">
        <Header />
        <div className="pt-20 max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
          
          {/* Company Card Header */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-700 to-slate-800 relative">
              {company?.coverUrl && <img src={company.coverUrl} alt={compName} className="w-full h-full object-cover" />}
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/90 text-blue-900 shadow-sm">
                EMPLOYER PROFILE
              </span>
            </div>
            
            <div className="px-6 pb-6 pt-0 relative">
              <div className="-mt-12 mb-3 flex items-end justify-between">
                <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-2xl flex items-center justify-center overflow-hidden bg-white">
                  {company?.logoUrl ? <img src={company.logoUrl} alt={compName} className="w-full h-full object-cover" /> : logoChar}
                </div>
                <Link href="/employer/company-profile"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm">
                  <Edit3 size={14} /> Edit Company Profile
                </Link>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{compName}</h1>
                  {(company?.verificationStatus === 'verified' || company?.isVerified) && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                      <BadgeCheck size={13} /> VERIFIED
                    </span>
                  )}
                  {company?.verificationStatus === 'pending' && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                      ⌛ PENDING APPROVAL
                    </span>
                  )}
                </div>
                {company?.tagline && <p className="text-xs text-gray-500 font-medium">{company.tagline}</p>}
                <p className="text-[11px] text-gray-400 font-mono">ID: {compId}</p>
              </div>

              {/* Quick Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Category</span>
                  <span className="font-semibold text-gray-900">{company?.category || 'General Business'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">District</span>
                  <span className="font-semibold text-gray-900">{company?.district || 'Theni'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Established</span>
                  <span className="font-semibold text-gray-900">{company?.establishedYear || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Links */}
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Mail size={16} className="text-blue-600" /> Contact Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 text-xs text-gray-700">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50">
                <Phone size={14} className="text-gray-400" />
                <span>{company?.phone || user?.phone || 'No phone added'}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50">
                <Mail size={14} className="text-gray-400" />
                <span className="truncate">{company?.email || user?.email}</span>
              </div>
              {company?.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 text-blue-600 hover:underline">
                  <Globe size={14} />
                  <span className="truncate">{company.website}</span>
                  <ExternalLink size={11} />
                </a>
              )}
              {company?.address && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 sm:col-span-2">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  <span>{company.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* About */}
          {company?.description && (
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-2">
              <h3 className="text-sm font-bold text-gray-900">About Company</h3>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{company.description}</p>
            </div>
          )}

          {/* Navigation Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/employer/dashboard"
              className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900">Employer Dashboard</span>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
            <Link href="/employer/post-job"
              className="p-4 rounded-2xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-all flex items-center justify-between">
              <span className="text-xs font-bold">Post New Job</span>
              <Plus size={16} />
            </Link>
          </div>

        </div>
        <BottomNav />
      </main>
    );
  }

  // ─── JOB SEEKER PROFILE VIEW ───
  const seekerName = user?.displayName || firebaseUser?.displayName || 'Job Seeker';
  const seekerInitials = seekerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const seekerId = `TN-SEEKER-${uid.slice(0, 6).toUpperCase()}`;

  const profileChecks = [
    { label: 'Name', done: !!user?.displayName },
    { label: 'Phone', done: !!(user?.phone || user?.phoneNumber) },
    { label: 'Photo', done: !!(user?.photoURL || firebaseUser?.photoURL) },
    { label: 'Skills', done: !!user?.skills?.length },
    { label: 'Education', done: !!user?.education?.length },
    { label: 'Experience', done: !!user?.experience?.length },
    { label: 'Resume', done: !!(user?.resumeUrl || user?.resumeURL) },
    { label: 'Bio', done: !!(user?.bio || user?.about) },
  ];
  const completedCount = profileChecks.filter(c => c.done).length;
  const profileStrength = Math.round((completedCount / profileChecks.length) * 100);

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-24 font-outfit">
      <Header />
      <div className="pt-20 max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
        
        {/* Header Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold text-xl flex items-center justify-center flex-shrink-0 shadow-md">
                {user?.photoURL ? <img src={user.photoURL} alt={seekerName} className="w-full h-full object-cover rounded-2xl" /> : seekerInitials}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{seekerName}</h1>
                <p className="text-xs text-gray-500 font-medium">{user?.role === 'job_seeker' ? 'Verified Job Seeker' : 'Platform User'}</p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">ID: {seekerId}</p>
              </div>
            </div>
            <Link href="/seeker/profile"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-sm">
              <Edit3 size={14} /> Edit Profile
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-gray-700">Profile Strength</span>
              <span className="font-bold text-emerald-600">{profileStrength}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${profileStrength}%` }} />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Mail size={16} className="text-emerald-600" /> Contact & Location
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-gray-700">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
              <Phone size={14} className="text-gray-400" />
              <span>{user?.phone || user?.phoneNumber || 'No phone added'}</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
              <Mail size={14} className="text-gray-400" />
              <span className="truncate">{user?.email || firebaseUser?.email}</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 sm:col-span-2">
              <MapPin size={14} className="text-gray-400" />
              <span>{user?.district || 'Theni'}, Tamil Nadu</span>
            </div>
          </div>
        </div>

        {/* About / Bio */}
        {user?.bio && (
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-gray-900">About Me</h3>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
          </div>
        )}

        {/* Skills */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-600" /> Skills
            </h3>
            <Link href="/seeker/skills" className="text-xs text-emerald-600 font-semibold hover:underline">Manage</Link>
          </div>
          {user?.skills?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map((sk: string) => (
                <span key={sk} className="text-xs px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-medium">
                  {sk}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No skills added yet. Add skills to match jobs better.</p>
          )}
        </div>

        {/* Education & Experience */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Education */}
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap size={16} className="text-blue-600" /> Education
            </h3>
            {user?.education?.length > 0 ? (
              <div className="space-y-2">
                {user.education.map((edu: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-gray-50 text-xs">
                    <p className="font-bold text-gray-900">{edu.degree || edu.institution}</p>
                    <p className="text-gray-500">{edu.institution} {edu.year ? `· ${edu.year}` : ''}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No education entries added.</p>
            )}
          </div>

          {/* Experience */}
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Briefcase size={16} className="text-purple-600" /> Experience
            </h3>
            {user?.experience?.length > 0 ? (
              <div className="space-y-2">
                {user.experience.map((exp: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-gray-50 text-xs">
                    <p className="font-bold text-gray-900">{exp.role} · {exp.company}</p>
                    <p className="text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No work experience added.</p>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link href="/seeker/dashboard" className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm text-xs font-bold text-gray-900 hover:bg-gray-50 flex items-center justify-between">
            Dashboard <ChevronRight size={14} className="text-gray-400" />
          </Link>
          <Link href="/seeker/resume" className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm text-xs font-bold text-gray-900 hover:bg-gray-50 flex items-center justify-between">
            My Resume <ChevronRight size={14} className="text-gray-400" />
          </Link>
          <Link href="/seeker/job-alerts" className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm text-xs font-bold text-gray-900 hover:bg-gray-50 flex items-center justify-between col-span-2 sm:col-span-1">
            Job Alerts <ChevronRight size={14} className="text-gray-400" />
          </Link>
        </div>

      </div>
      <BottomNav />
    </main>
  );
}
