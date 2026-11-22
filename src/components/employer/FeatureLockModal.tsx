'use client';

import React from 'react';
import { Lock, PhoneCall, MessageCircle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SITE_CONTACT } from '@/lib/constants';
import { generateAdminWhatsAppEnquiryUrl } from '@/lib/subscriptionService';

interface FeatureLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  company?: any;
  user?: any;
  isTrialExpired?: boolean;
}

export default function FeatureLockModal({
  isOpen,
  onClose,
  featureName = 'Job Vacancy Posting',
  company,
  user,
  isTrialExpired = false,
}: FeatureLockModalProps) {
  if (!isOpen) return null;

  const companyName = company?.name || 'My Company';
  const ownerName = user?.fullName || user?.displayName || user?.name || 'Business Owner';
  const phone = company?.phone || user?.mobileNumber || user?.phone || '—';
  const location = company?.district || company?.location || company?.address || 'Theni District';

  const whatsappUrl = generateAdminWhatsAppEnquiryUrl({
    company,
    user,
    featureName,
    status: isTrialExpired ? 'Trial Expired — Renewal Required' : 'Pending Admin Verification (7-Day Free Trial)',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-outfit animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-amber-200 shadow-2xl p-6 sm:p-7 text-center space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Lock Graphic */}
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-inner">
          <Lock size={30} />
        </div>

        {/* Header */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <ShieldAlert size={12} /> {isTrialExpired ? 'Trial Expired' : 'Admin Approval Required'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {featureName} is Locked
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            {isTrialExpired ? (
              <>
                Your <strong>7-day free trial has expired</strong>. To unlock <strong>{featureName}</strong> and continue hiring in Theni, please upgrade or renew your plan.
              </>
            ) : (
              <>
                Your account is currently under <strong>Admin Verification</strong>. You can explore your dashboard and profile preview, but publishing and managing <strong>{featureName}</strong> unlocks automatically upon Admin approval.
              </>
            )}
          </p>
        </div>

        {/* Business Summary Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Company:</span>
            <span className="font-bold text-slate-900 truncate max-w-[200px]">{companyName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Owner:</span>
            <span className="font-semibold text-slate-900">{ownerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Mobile:</span>
            <span className="font-semibold text-slate-900">{phone}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Location:</span>
            <span className="font-semibold text-slate-900">{location}</span>
          </div>
        </div>

        {/* Contact Options */}
        <div className="space-y-2.5 pt-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Fast-Track Verification &amp; Unlock:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* WhatsApp Enquiry Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <MessageCircle size={15} />
              <span>WhatsApp Admin</span>
            </a>

            {/* Direct Phone Call Button */}
            <a
              href={`tel:${SITE_CONTACT.phone1Raw}`}
              className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <PhoneCall size={14} />
              <span>Call Helpline</span>
            </a>
          </div>

          <p className="text-[11px] text-slate-400">
            Admin Mobile: <strong className="text-slate-700">{SITE_CONTACT.phone1}</strong> (Mon–Sat, 9AM–7PM)
          </p>
        </div>
      </div>
    </div>
  );
}
