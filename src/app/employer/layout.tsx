'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Building2, Briefcase, Users2, Calendar,
  Search, MessageSquare, BarChart3, CreditCard, Star,
  LogOut, ChevronLeft, ChevronRight, Menu, X, Bell,
  Plus, TrendingUp, Settings, Key, BadgeCheck,
  Clock, AlertTriangle, CheckCircle, CheckCircle2, ShieldAlert,
  PhoneCall, Check, Zap, ArrowRight, MessageCircle,
  Loader2, RefreshCw, AlertCircle, XCircle,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useNotifications } from '@/contexts/NotificationContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { SUBSCRIPTION_PLANS, SITE_CONTACT } from '@/lib/constants';
import { generateAdminWhatsAppContactUrl } from '@/lib/subscriptionService';
import PaymentCheckoutModal, { PlanDetails } from '@/components/payment/PaymentCheckoutModal';

const EMPLOYER_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/employer/dashboard' },
  { label: 'Company Profile', icon: Building2, href: '/employer/company-profile' },
  { label: 'Post a Job', icon: Plus, href: '/employer/post-job', accent: true },
  { label: 'My Jobs', icon: Briefcase, href: '/employer/jobs' },
  { label: 'Candidates', icon: Users2, href: '/employer/candidates' },
  { label: 'Interviews', icon: Calendar, href: '/employer/interviews' },
  { label: 'Talent Search', icon: Search, href: '/employer/talent-search' },
  { label: 'Leads', icon: TrendingUp, href: '/employer/leads' },
  { label: 'Messages', icon: MessageSquare, href: '/employer/messages' },
  { label: 'Reports', icon: BarChart3, href: '/employer/reports' },
  { label: 'Billing', icon: CreditCard, href: '/employer/billing' },
  { label: 'Reviews', icon: Star, href: '/employer/reviews' },
  // AI-CONNECT-1: justified cascade, same reasoning as the seeker layout's own entry above --
  // without a nav link the new /employer/ai page would be unreachable by any real user.
  { label: 'AI Key Connection', icon: Key, href: '/employer/ai' },
  { label: 'Digital ID Card', icon: CreditCard, href: '/employer/id-card' },
  { label: 'Settings', icon: Settings, href: '/employer/settings' },
];

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useRequireAuth(['employer', 'business_owner', 'supplier', 'service_provider']);
  const { refreshUserProfile } = useAuth();
  const toast = useToast();
  const { unreadCount } = useNotifications();
  const { data: companies } = useCollection<any>('companies', [where('ownerId', '==', user?.uid || '')], { skip: !user?.uid });
  const company = companies?.[0];
  const subState = useSubscriptionStatus(company, user);
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanDetails | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const handleOpenCheckout = (plan: (typeof SUBSCRIPTION_PLANS)[number]) => {
    setCheckoutPlan({
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      dailyEquivalent: plan.dailyEquivalent,
      features: plan.features,
      badge: plan.badge,
    });
    setIsCheckoutOpen(true);
  };

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (authLoading || (user && companies === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  // ── MANDATORY BUSINESS OWNER ADMIN APPROVAL GATE ───────────────────────────
  // Business Owners must NEVER access the Business Owner Dashboard until an Admin explicitly approves them.
  if (user.role === 'business_owner') {
    const isApproved = user.approvalStatus === 'approved' || user.accountStatus === 'active';
    const isRejected = user.approvalStatus === 'rejected' || user.accountStatus === 'rejected';

    if (isRejected) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-outfit">
          <div className="max-w-lg w-full bg-white rounded-3xl border border-red-200 shadow-xl p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 border border-red-200 flex items-center justify-center mx-auto shadow-inner">
              <XCircle size={32} />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle size={12} /> Registration Requires Revision
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
                Registration Not Approved
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Your business owner registration was reviewed by THENIJOBS Admin and requires changes before access can be granted.
              </p>
            </div>

            {/* Rejection Details Box */}
            <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 text-left space-y-2">
              <p className="text-xs font-bold text-red-900 uppercase tracking-wide flex items-center gap-1.5">
                <AlertCircle size={14} className="text-red-600" />
                Reason for Revision
              </p>
              <p className="text-xs text-red-800 font-medium bg-white p-3 rounded-xl border border-red-100 leading-relaxed whitespace-pre-wrap">
                {user.rejectionReason || 'Registration details could not be verified. Please provide official business documentation.'}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Applicant Name</span>
                <span className="font-bold text-slate-900">{user.fullName || user.displayName || 'Business Owner'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Registered Email</span>
                <span className="font-bold text-slate-900">{user.email}</span>
              </div>
              {(user.mobileNumber || user.phone) && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Mobile</span>
                  <span className="font-bold text-slate-900">{user.mobileNumber ? `+91 ${user.mobileNumber}` : user.phone}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <a
                href={SITE_CONTACT.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageCircle size={16} />
                <span>Contact Admin on WhatsApp (+91 93605 19460)</span>
              </a>

              <button
                type="button"
                onClick={async () => {
                  setCheckingStatus(true);
                  try {
                    await refreshUserProfile?.();
                    toast.info('Status checked. Please contact admin if you need immediate review.');
                  } catch (e) {
                    toast.error('Failed to refresh status.');
                  } finally {
                    setCheckingStatus(false);
                  }
                }}
                disabled={checkingStatus}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {checkingStatus ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-slate-500" />
                    <span>Checking Status...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} className="text-slate-500" />
                    <span>Check Approval Status</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={async () => {
                  await signOut(auth);
                  router.push('/login');
                }}
                className="flex items-center gap-1.5 mx-auto text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-1"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!isApproved) {
      const rawCreated: any = user.createdAt;
      const formattedDate = rawCreated
        ? new Date(rawCreated?.seconds ? rawCreated.seconds * 1000 : rawCreated).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

      // State 1: Paid Plan Selected & Paid, but Waiting for Admin Approval
      if (user.paymentStatus === 'paid') {
        const planMeta = SUBSCRIPTION_PLANS.find(p => p.slug === (user.subscriptionPlan || user.selectedPlan)) || SUBSCRIPTION_PLANS[1];

        return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-outfit">
            <div className="max-w-lg w-full bg-white rounded-3xl border border-emerald-200 shadow-xl p-6 sm:p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={34} />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  <span>💳</span> Payment Verified • Waiting for Admin Approval
                </span>
                <h1 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
                  Payment Successful – Waiting for Admin Approval
                </h1>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Your payment for the <strong>{planMeta.name} Plan</strong> was verified successfully. Your account is currently waiting for Admin approval before Dashboard access is unlocked.
                </p>
              </div>

              {/* Submitted Information Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Payment Status</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={12} strokeWidth={3} /> Paid &amp; Verified
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Selected Plan</span>
                  <span className="font-bold text-slate-900">{planMeta.name} (₹{planMeta.price.toLocaleString('en-IN')}/yr)</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Approval Status</span>
                  <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Pending Admin Review
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Business Owner</span>
                  <span className="font-bold text-slate-900">{user.fullName || user.displayName || 'Business Owner'}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Registered Email</span>
                  <span className="font-bold text-slate-900">{user.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Submission Date</span>
                  <span className="font-bold text-slate-900">{formattedDate}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    setCheckingStatus(true);
                    try {
                      await refreshUserProfile?.();
                      if (user.approvalStatus === 'approved' || user.accountStatus === 'active') {
                        toast.success('Your account is approved! Unlocking Dashboard...');
                        router.push('/employer/dashboard');
                      } else {
                        toast.info('Your registration is still under review by Admin. Please check back shortly.');
                      }
                    } catch (e) {
                      toast.error('Failed to check status. Please try again.');
                    } finally {
                      setCheckingStatus(false);
                    }
                  }}
                  disabled={checkingStatus}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {checkingStatus ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Checking Status...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      <span>Check Approval Status</span>
                    </>
                  )}
                </button>

                <a
                  href={SITE_CONTACT.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <MessageCircle size={15} className="text-emerald-600" />
                  <span>Contact Admin on WhatsApp (+91 93605 19460)</span>
                </a>

                <button
                  type="button"
                  onClick={async () => {
                    await signOut(auth);
                    router.push('/login');
                  }}
                  className="flex items-center gap-1.5 mx-auto text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-1 cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        );
      }

      // State 2: Free Trial Selected, Waiting for Admin Approval
      if (user.selectedPlan === 'trial' || user.trialRequested) {
        return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-outfit">
            <div className="max-w-lg w-full bg-white rounded-3xl border border-amber-200 shadow-xl p-6 sm:p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
                <Clock size={32} />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
                  <Clock size={12} /> 15-Day Free Trial • Pending Admin Approval
                </span>
                <h1 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
                  Your 15-Day Free Trial Is Waiting for Admin Approval
                </h1>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Thank you for registering with THENIJOBS. Your 15-day free trial request has been submitted and is waiting for Admin approval. <strong>No payment is required.</strong>
                </p>
              </div>

              {/* Submitted Information Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Selected Option</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    15-Day Free Trial (Standard Plan)
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Payment Status</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    No Payment Required (₹0)
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Approval Status</span>
                  <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Pending Admin Review
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Business Owner</span>
                  <span className="font-bold text-slate-900">{user.fullName || user.displayName || 'Business Owner'}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Registered Email</span>
                  <span className="font-bold text-slate-900">{user.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Submission Date</span>
                  <span className="font-bold text-slate-900">{formattedDate}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    setCheckingStatus(true);
                    try {
                      await refreshUserProfile?.();
                      if (user.approvalStatus === 'approved' || user.accountStatus === 'active') {
                        toast.success('Your account is approved! Loading Dashboard...');
                        router.push('/employer/dashboard');
                      } else {
                        toast.info('Your trial request is still under review by Admin. Please check back shortly.');
                      }
                    } catch (e) {
                      toast.error('Failed to check status. Please try again.');
                    } finally {
                      setCheckingStatus(false);
                    }
                  }}
                  disabled={checkingStatus}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {checkingStatus ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Checking Status...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      <span>Check Approval Status</span>
                    </>
                  )}
                </button>

                <Link
                  href="/register-business?step=plan"
                  className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Zap size={14} className="text-indigo-600" />
                  <span>Choose an Annual Paid Plan Instead</span>
                </Link>

                <a
                  href={SITE_CONTACT.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <MessageCircle size={15} className="text-emerald-600" />
                  <span>Contact Admin on WhatsApp (+91 93605 19460)</span>
                </a>

                <button
                  type="button"
                  onClick={async () => {
                    await signOut(auth);
                    router.push('/login');
                  }}
                  className="flex items-center gap-1.5 mx-auto text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-1 cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        );
      }

      // State 3: Plan Not Selected Yet
      if (!user.selectedPlan && !user.trialRequested) {
        return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-outfit">
            <div className="max-w-md w-full bg-white rounded-3xl border border-blue-200 shadow-xl p-6 sm:p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <CreditCard size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Choose Your Plan or Start Free Trial
                </h1>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  To continue, please select either the 15-day Free Trial or choose an annual subscription plan.
                </p>
              </div>
              <Link
                href="/register-business?step=plan"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Select Plan or Start Free Trial</span>
                <ArrowRight size={15} />
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await signOut(auth);
                  router.push('/login');
                }}
                className="flex items-center gap-1.5 mx-auto text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-1 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        );
      }

      // State 4: Default General Review Screen
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-outfit">
          <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
              <Clock size={32} />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
                <Clock size={12} /> Pending Admin Approval
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
                Your Business Account Is Under Review
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Thank you for registering with THENIJOBS. Your business account has been submitted successfully and is waiting for Admin approval.
              </p>
            </div>

            {/* Submitted Information Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Status</span>
                <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Pending Admin Approval
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Business Owner</span>
                <span className="font-bold text-slate-900">{user.fullName || user.displayName || 'Business Owner'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Registered Email</span>
                <span className="font-bold text-slate-900">{user.email}</span>
              </div>
              {(user.mobileNumber || user.phone) && (
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Mobile Number</span>
                  <span className="font-bold text-slate-900">{user.mobileNumber ? `+91 ${user.mobileNumber}` : user.phone}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Submission Date</span>
                <span className="font-bold text-slate-900">{formattedDate}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  setCheckingStatus(true);
                  try {
                    await refreshUserProfile?.();
                    if (user.approvalStatus === 'approved' || user.accountStatus === 'active') {
                      toast.success('Your account is approved! Loading Dashboard...');
                      router.push('/employer/dashboard');
                    } else {
                      toast.info('Your registration is still under review by Admin. Please check back shortly.');
                    }
                  } catch (e) {
                    toast.error('Failed to check status. Please try again.');
                  } finally {
                    setCheckingStatus(false);
                  }
                }}
                disabled={checkingStatus}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {checkingStatus ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Checking Status...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>Check Approval Status</span>
                  </>
                )}
              </button>

              <a
                href={SITE_CONTACT.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle size={15} className="text-emerald-600" />
                <span>Contact Admin on WhatsApp (+91 93605 19460)</span>
              </a>

              <button
                type="button"
                onClick={async () => {
                  await signOut(auth);
                  router.push('/login');
                }}
                className="flex items-center gap-1.5 mx-auto text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-1 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // ── Pending Admin Approval Screen (Company-Level) ─────────────────────────
  if (company && subState.isPendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-amber-200 shadow-xl p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
            <Clock size={32} className="text-amber-600" />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold uppercase tracking-wider">
              ⏳ Pending Admin Approval
            </span>
            <h1 className="text-2xl font-black text-gray-900 mt-3">Registration Under Review</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Your business registration for <strong>&quot;{company.name}&quot;</strong> is being reviewed by THENIJOBS admin.
              Once approved, your 15-day Standard free trial will begin automatically.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">What happens next?</p>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>✓ Admin verifies your business details</li>
              <li>✓ 15-day Standard free trial starts from approval</li>
              <li>✓ Company website goes live immediately</li>
              <li>✓ You can post jobs and manage candidates</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500">Typically approved within 2–4 hours on working days.</p>
          <button onClick={() => { signOut(auth); router.push('/'); }}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // ── Suspended / Trial Expired Screen ──────────────────────────────────────
  if ((subState.isSuspended || subState.isTrialExpired) && !subState.isPaidActive && pathname !== '/employer/billing') {
    const adminWhatsAppUrl = company ? generateAdminWhatsAppContactUrl(company) : SITE_CONTACT.whatsappUrl;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-red-50/25 to-slate-100 py-10 px-4 flex items-center justify-center">
        <div className="max-w-5xl w-full bg-white rounded-3xl border border-red-200 shadow-2xl p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto text-red-600 shadow-inner">
              <ShieldAlert size={34} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-extrabold uppercase tracking-wider">
              <span>🚫</span> Free Trial Expired
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Your 15-Day Free Trial Has Expired
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Your free trial has ended. Choose a subscription plan to continue using THENIJOBS business features.
              All your company data, jobs, applications, and leads are safely preserved.
              <strong> Choose any one plan below</strong> or contact admin directly on WhatsApp (<strong>+91 93605 19460</strong>) to reactivate instantly.
            </p>
          </div>

          {/* All 4 Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isPopular = plan.recommended;
              return (
                <div
                  key={plan.slug}
                  className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between relative bg-white ${
                    isPopular
                      ? 'border-blue-600 ring-2 ring-blue-600/30 shadow-lg -translate-y-1'
                      : 'border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {plan.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs whitespace-nowrap ${
                      isPopular ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'
                    }`}>
                      {plan.badge}
                    </span>
                  )}

                  <div className="space-y-3">
                    <div className="text-center pt-1">
                      <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{plan.bestFor}</p>
                    </div>

                    <div className={`text-center py-2.5 rounded-xl border ${isPopular ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="text-2xl font-black text-gray-900">
                        ₹{plan.price.toLocaleString('en-IN')}
                        <span className="text-xs text-gray-500 font-normal"> /yr</span>
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                        ~₹{plan.dailyEquivalent}/day <span className="text-gray-400 font-normal">(₹{plan.monthlyEquivalent}/mo)</span>
                      </div>
                    </div>

                    <ul className="space-y-1.5 text-xs text-gray-600 pt-1">
                      {plan.features.slice(0, 4).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                          <Check size={13} className="text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                          <span className="line-clamp-2">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 mt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleOpenCheckout(plan)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                        isPopular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>Pay ₹{plan.price.toLocaleString('en-IN')}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* WhatsApp & Support Contact Banner */}
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-300 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <MessageCircle size={26} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold mb-1">
                  <span>🚫</span> Direct Admin Support: +91 93605 19460
                </div>
                <h4 className="text-sm font-bold text-emerald-950">
                  🚫 Trial Expired — Upgrade Required: Contact Admin Directly
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Chat directly with THENIJOBS Admin on WhatsApp (<strong>+91 93605 19460</strong>) for instant plan activation, UPI QR code, or any questions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
              <a
                href={adminWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
              >
                <MessageCircle size={15} />
                <span>Chat Admin on WhatsApp (+91 93605 19460)</span>
              </a>
              <a
                href={`tel:${SITE_CONTACT.phone1Raw}`}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-xs transition-all shadow-xs"
                title="Call Admin Directly"
              >
                <PhoneCall size={14} />
                <span className="hidden sm:inline">Call Admin</span>
              </a>
            </div>
          </div>

          {/* Action Buttons: Choose a Plan, View Payment History, Logout */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/pricing"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Choose a Plan</span>
                <ArrowRight size={13} />
              </Link>
              <Link
                href="/employer/billing"
                className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-slate-700 font-bold flex items-center gap-1.5 transition-all"
              >
                <span>View Payment History</span>
              </Link>
            </div>

            <button
              onClick={async () => { signOut(auth); router.push('/login'); }}
              className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 font-semibold px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Embedded Checkout Modal */}
        {checkoutPlan && (
          <PaymentCheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            plan={checkoutPlan}
            companyId={company?.id || ''}
            companyName={company?.name || user.fullName || 'Business Owner'}
            companyAddress={company?.address || (company?.district ? `${company.district}, Tamil Nadu` : undefined)}
            companyPhone={company?.phone || user.mobileNumber || user.phone}
            companyGst={company?.gstNumber}
            company={company || ({} as any)}
            onSuccess={() => {
              setIsCheckoutOpen(false);
              window.location.reload();
            }}
          />
        )}
      </div>
    );
  }

  // ── ACCESS CONTROL: Trial Portal Permissions ──────────────────────────────
  // Approved Business Owners on an active 15-day Free Trial get Standard-tier access:
  // Dashboard, Jobs management, Posting jobs, Candidates, Leads, Profile, Billing, Settings.
  // Advanced features (Talent Search, AI, Interviews, Reports) require an upgraded paid plan.
  const TRIAL_ALLOWED_ROUTES = [
    '/employer/dashboard',
    '/employer/jobs',
    '/employer/post-job',
    '/employer/candidates',
    '/employer/leads',
    '/employer/billing',
    '/employer/company-profile',
    '/employer/settings',
  ];
  const isTrialRestricted = subState.isTrialActive && !subState.isPaidActive;
  const isRouteAllowedDuringTrial = TRIAL_ALLOWED_ROUTES.some(r => pathname.startsWith(r));

  if (company && isTrialRestricted && !isRouteAllowedDuringTrial) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50/30 to-slate-100 py-10 px-4 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-3xl border border-blue-200 shadow-2xl p-6 sm:p-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto text-blue-600 shadow-inner">
              <Clock size={32} />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold uppercase tracking-wider">
              🎉 Free Trial — {subState.trialDaysRemaining} day{subState.trialDaysRemaining !== 1 ? 's' : ''} remaining
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Upgrade to Unlock Advanced Employer Features
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              During your 15-day free trial, you have full access to your <strong>Dashboard</strong>, <strong>Job Postings</strong>, <strong>Candidate Applications</strong>, and <strong>Company Profile</strong>.
              To access enterprise features — including Talent Search, AI screening, and advanced analytics — upgrade to a paid annual plan.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Included in Your Free Trial:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Link href="/employer/dashboard" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 transition-all group">
                <LayoutDashboard size={16} className="text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-gray-800 group-hover:text-blue-600">Dashboard</span>
              </Link>
              <Link href="/employer/post-job" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 transition-all group">
                <Plus size={16} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-gray-800 group-hover:text-blue-600">Post a Job</span>
              </Link>
              <Link href="/employer/company-profile" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 transition-all group">
                <Building2 size={16} className="text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-gray-800 group-hover:text-blue-600">Company Profile</span>
              </Link>
              <Link href="/employer/billing" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 transition-all group">
                <CreditCard size={16} className="text-violet-600 shrink-0" />
                <span className="text-xs font-semibold text-gray-800 group-hover:text-blue-600">Billing & Plans</span>
              </Link>
            </div>
          </div>

          {/* Plan CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SUBSCRIPTION_PLANS.filter(p => p.recommended || p.slug === 'basic').map(plan => (
              <button
                key={plan.slug}
                onClick={() => handleOpenCheckout(plan)}
                className={`p-4 rounded-2xl border text-left transition-all hover:shadow-md ${
                  plan.recommended
                    ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-900">{plan.name}</span>
                  {plan.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      plan.recommended ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'
                    }`}>{plan.badge}</span>
                  )}
                </div>
                <div className="text-lg font-black text-gray-900">₹{plan.price.toLocaleString('en-IN')}<span className="text-xs text-gray-500 font-normal"> /yr</span></div>
                <p className="text-[11px] text-gray-500 mt-1">{plan.bestFor}</p>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <Link href="/employer/billing" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All Plans & Features <ArrowRight size={13} />
            </Link>
            <button onClick={() => { signOut(auth); router.push('/'); }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold">
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>

        {checkoutPlan && (
          <PaymentCheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            plan={checkoutPlan}
            companyId={company.id}
            companyName={company.name}
            companyAddress={company.address || (company.district ? `${company.district}, Tamil Nadu` : undefined)}
            companyPhone={company.phone}
            companyGst={company.gstNumber}
            company={company}
            onSuccess={() => {
              setIsCheckoutOpen(false);
              window.location.reload();
            }}
          />
        )}
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const initials = user.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email?.[0]?.toUpperCase() || 'E');

  return (
    <div className="min-h-screen flex" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300
        ${collapsed ? 'w-[68px]' : 'w-[240px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-white border-r border-gray-100 shadow-sm`}
      >
        {/* Brand header */}
        <div className={`flex items-center h-16 px-4 border-b border-gray-100 ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
          {!collapsed && (
            <>
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
                <img src="/logo.png" alt="THENIJOBS" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>THENIJOBS</p>
                <p className="text-[10px] text-blue-600 font-semibold">Employer Portal</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-500 hover:text-gray-600">
                <X size={16} />
              </button>
            </>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
              <img src="/logo.png" alt="THENIJOBS" className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        {/* Company info */}
        {!collapsed && company && (
          <div className="px-3 py-3 border-b border-gray-100">
            <Link
              href="/employer/company-profile"
              className="flex items-center gap-2.5 p-2 bg-slate-50/80 hover:bg-blue-50/80 rounded-2xl transition-all border border-slate-100 group"
              title="Manage Company Branding"
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                {company.logoUrl || (company as any).companyLogo ? (
                  <img
                    src={company.logoUrl || (company as any).companyLogo}
                    alt={company.name || 'Company Logo'}
                    className="w-full h-full object-contain p-0.5"
                  />
                ) : (
                  <span>{company.name?.[0]?.toUpperCase() || 'C'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {company.name}
                  </p>
                  {(company.verificationStatus === 'verified' || (company as any).isVerified) && (
                    <BadgeCheck size={13} className="text-blue-600 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                    company.verificationStatus === 'verified' ? 'bg-emerald-500' : 'bg-amber-400'
                  }`} />
                  <p className="text-[10px] text-gray-500 truncate capitalize font-medium">
                    {company.verificationStatus === 'verified' ? 'Verified Business' : 'Pending Review'}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 no-scrollbar">
          {EMPLOYER_NAV.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/employer/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${active
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : (item as any).accent
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon size={17} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0"
                style={{ background: '#EFF6FF' }}>{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{user.displayName || user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-slate-500 truncate capitalize">{user.role ? user.role.replace('_', ' ') : 'Employer'}</p>
              </div>
            </div>
          )}
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
            <button onClick={handleLogout}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-all ${collapsed ? '' : 'flex-1'}`}>
              <LogOut size={14} />
              {!collapsed && 'Sign Out'}
            </button>
            <button onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl border border-gray-200 text-slate-500 hover:text-gray-600 hover:border-gray-300 transition-all">
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'}`}>
        {/* Trial Countdown Banner */}
        {subState.isTrialActive && !subState.isPaidActive && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock size={14} className="shrink-0" />
              <p className="text-xs font-bold">
                🎉 Free Trial Active — <strong>{subState.trialDaysRemaining} day{subState.trialDaysRemaining !== 1 ? 's' : ''}</strong> remaining
                {subState.trialEndDate && (
                  <span className="font-normal opacity-90"> (expires {subState.trialEndDate.toLocaleDateString('en-IN')})</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/employer/billing"
                className="shrink-0 px-3 py-1 rounded-lg bg-white text-orange-600 text-[11px] font-bold hover:bg-orange-50 transition-all">
                💳 Choose a Plan (from ₹999/yr)
              </Link>
              <a
                href={`https://wa.me/${SITE_CONTACT.whatsapp}?text=${encodeURIComponent(`Hi THENIJOBS Support, I have questions regarding plans for my business "${company?.name || 'Company'}".`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-xs"
              >
                <MessageCircle size={12} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl border border-gray-200 text-gray-600">
            <Menu size={17} />
          </button>
          <div className="flex-1" />
          {/* Subscription status pill */}
          {subState.isPaidActive && (
            <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
              <CheckCircle size={10} /> Active
            </span>
          )}
          {subState.isTrialActive && !subState.isPaidActive && (
            <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
              <Clock size={10} /> Trial · {subState.trialDaysRemaining}d left
            </span>
          )}
          <Link href="/employer/messages" className="relative p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all">
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: '#EF4444' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link href="/" className="text-xs text-blue-600 font-semibold border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-all">
            View Site
          </Link>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 overflow-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      </div>

      {checkoutPlan && (
        <PaymentCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          plan={checkoutPlan}
          companyId={company?.id}
          companyName={company?.name}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
