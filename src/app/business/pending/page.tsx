'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Clock, ShieldCheck, ArrowLeft, LogOut, Check, MessageCircle,
  Phone, Building2, RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function BusinessPendingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [changesFeedback, setChangesFeedback] = useState('');

  // Real-time listener on the user's company document
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'companies'),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // No company found — redirect to registration
        router.replace('/company/register');
        return;
      }
      const company = snapshot.docs[0].data();
      setCompanyStatus(company.status || 'pending');
      setCompanyName(company.name || '');
      setChangesFeedback(company.changesFeedback || '');

      // If approved, redirect to dashboard
      if (company.status === 'approved') {
        router.replace('/business/dashboard');
      }
    }, (err) => {
      console.error('[BusinessPending] Firestore listener error:', err);
    });

    return () => unsubscribe();
  }, [user?.uid, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center font-outfit">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  const statusConfig: Record<string, {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
    borderColor: string;
    bgColor: string;
  }> = {
    pending: {
      icon: <Clock size={36} className="text-amber-400 animate-pulse" />,
      title: 'Verification Pending',
      description: 'Your business registration has been submitted successfully and is currently under review by our admin team.',
      color: 'amber',
      borderColor: 'border-amber-500/20',
      bgColor: 'bg-amber-500/10',
    },
    rejected: {
      icon: <ShieldCheck size={36} className="text-red-400" />,
      title: 'Registration Rejected',
      description: 'Unfortunately, your business registration was not approved. Please review the feedback and resubmit.',
      color: 'red',
      borderColor: 'border-red-500/20',
      bgColor: 'bg-red-500/10',
    },
    changes_requested: {
      icon: <RefreshCw size={36} className="text-orange-400 animate-pulse" />,
      title: 'Changes Requested',
      description: 'Our admin team has reviewed your registration and requested some changes. Please update your details and resubmit.',
      color: 'orange',
      borderColor: 'border-orange-500/20',
      bgColor: 'bg-orange-500/10',
    },
  };

  const currentStatus = statusConfig[companyStatus || 'pending'] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4 blob-bg grid-pattern font-outfit">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <Image src="/logo.png" alt="THENIJOBS Logo" width={40} height={40} className="h-10 w-10 object-contain rounded-xl" />
          <span className="font-outfit font-black text-2xl tracking-wider text-white">THENIJOBS</span>
        </div>

        <div className={`glass-card rounded-3xl p-8 shadow-2xl text-center border ${currentStatus.borderColor} relative overflow-hidden`}>
          {/* Decorative glowing background */}
          <div className={`absolute -top-24 -left-24 w-48 h-48 ${currentStatus.bgColor} rounded-full blur-3xl pointer-events-none`} />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Status Icon */}
          <div className={`w-20 h-20 rounded-2xl ${currentStatus.bgColor} ${currentStatus.borderColor} border flex items-center justify-center mx-auto mb-6 relative`}>
            {currentStatus.icon}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#0d0d20] ${currentStatus.borderColor} border flex items-center justify-center`}>
              <Building2 size={12} className={`text-${currentStatus.color}-400`} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">{currentStatus.title}</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            வணக்கம் <span className={`text-${currentStatus.color}-400 font-semibold`}>{user.displayName || 'Business Owner'}</span>.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            {currentStatus.description}
          </p>

          {/* Company name badge */}
          {companyName && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
              <Building2 size={14} className="text-violet-400" />
              <span className="text-sm font-semibold text-white">{companyName}</span>
            </div>
          )}

          {/* Changes feedback */}
          {companyStatus === 'changes_requested' && changesFeedback && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 text-left mb-6">
              <p className="text-xs font-bold text-orange-300 mb-1">Admin Feedback:</p>
              <p className="text-xs text-gray-300 leading-relaxed">{changesFeedback}</p>
              <Link
                href="/company/register"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/20 text-orange-300 text-xs font-semibold hover:bg-orange-500/30 transition-colors"
              >
                <RefreshCw size={12} /> Update Registration
              </Link>
            </div>
          )}

          {/* Rejection reason */}
          {companyStatus === 'rejected' && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-left mb-6">
              <p className="text-xs font-bold text-red-300 mb-1">What to do next:</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                Please contact our admin team for more details or re-register with updated information.
              </p>
            </div>
          )}

          {/* Status Timeline (only for pending) */}
          {companyStatus === 'pending' && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-left space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">1. Registration Submitted</p>
                  <p className="text-[10px] text-gray-500">Your business details and documents have been submitted successfully.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Clock size={12} className="text-amber-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-300">2. Admin Review (In Progress)</p>
                  <p className="text-[10px] text-gray-400">Our team is verifying your business details. This usually takes 1–2 hours during business hours.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck size={12} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500">3. Business Goes Live</p>
                  <p className="text-[10px] text-gray-600">Once approved, your business will be visible to thousands of users on Theni Jobs.</p>
                </div>
              </div>
            </div>
          )}

          {/* Estimated time */}
          {companyStatus === 'pending' && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 mb-6 flex items-center gap-3 justify-center">
              <Clock size={14} className="text-amber-400" />
              <span className="text-xs text-gray-400">
                Estimated Review Time: <span className="text-amber-300 font-semibold">Within 24 Hours</span>
              </span>
            </div>
          )}

          <div className="text-xs text-gray-500 mb-6">
            You will receive an in-app notification once your business is approved. For urgent support, please reach out via WhatsApp.
          </div>

          {/* Contact Buttons */}
          <div className="flex gap-3 mb-6">
            <a
              href="https://wa.me/919876543210?text=Hi%2C%20I%20just%20registered%20my%20business%20on%20Theni%20Jobs%20and%20need%20help%20with%20approval."
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-600/30 flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a
              href="tel:+919876543210"
              className="flex-1 px-4 py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-sm font-semibold text-blue-400 transition-all hover:bg-blue-600/30 flex items-center justify-center gap-2"
            >
              <Phone size={16} /> Call Admin
            </a>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-sm font-semibold text-white transition-colors hover:bg-white/[0.04] flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Home
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-sm font-semibold text-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>

        {/* Auto-refresh notice */}
        <p className="text-center text-[10px] text-gray-600 mt-4">
          This page updates automatically when your status changes.
        </p>
      </div>
    </div>
  );
}
