'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Award, Wallet, TrendingUp, Users, Building2, Copy,
  Check, Share2, ArrowUpRight, Clock, AlertCircle,
  ExternalLink, Download, Sparkles, Loader2, ArrowLeft,
  DollarSign, CheckCircle2, ShieldAlert, Phone, Building,
  CreditCard, ShieldCheck, FileText, ChevronDown, ChevronUp,
  Info, HelpCircle, X, Zap, CheckCircle, Smartphone
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import {
  doc, getDoc, collection, query, where, orderBy,
  getDocs, addDoc, serverTimestamp, updateDoc
} from 'firebase/firestore';
import type { Ambassador, Referral, PayoutRequest, PayoutMethod } from '@/lib/types/ambassador';
import { SITE_CONTACT } from '@/lib/constants';

export default function AmbassadorDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shops' | 'payouts' | 'marketing'>('shops');

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Payout & Withdrawal Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('bank_transfer');
  const [confirmUpi, setConfirmUpi] = useState('');
  // Bank details for withdrawal
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showTermsExpanded, setShowTermsExpanded] = useState(false);

  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState('');
  const [payoutError, setPayoutError] = useState('');

  // Fetch Ambassador & Related Data
  useEffect(() => {
    async function loadData() {
      if (authLoading) return;
      if (!user) {
        router.push('/login?redirect=/ambassador/dashboard');
        return;
      }

      try {
        setLoading(true);
        const ambRef = doc(db, 'ambassadors', user.uid);
        const ambSnap = await getDoc(ambRef);

        if (!ambSnap.exists()) {
          // User has not registered as an ambassador yet
          router.push('/ambassador');
          return;
        }

        const ambData = ambSnap.data() as Ambassador;
        setAmbassador(ambData);
        setConfirmUpi(ambData.upiId || '');
        setAccountHolderName(ambData.bankAccountName || ambData.fullName || '');
        setAccountNumber(ambData.bankAccountNumber || '');
        setConfirmAccountNumber(ambData.bankAccountNumber || '');
        setIfscCode(ambData.bankIfscCode || '');
        setBankName(ambData.bankName || '');
        if (ambData.preferredPayoutMethod) {
          setPayoutMethod(ambData.preferredPayoutMethod);
        }
        setPayoutAmount(ambData.pendingPayoutINR || 0);

        // Fetch Referrals
        try {
          const refQ = query(
            collection(db, 'referrals'),
            where('ambassadorUid', '==', user.uid)
          );
          const refSnap = await getDocs(refQ);
          const refList: Referral[] = [];
          refSnap.forEach((d) => refList.push({ id: d.id, ...d.data() } as Referral));
          setReferrals(refList);
        } catch (e) {
          console.warn('Referrals query fallback:', e);
        }

        // Fetch Payouts
        try {
          const payQ = query(
            collection(db, 'payoutRequests'),
            where('ambassadorUid', '==', user.uid)
          );
          const paySnap = await getDocs(payQ);
          const payList: PayoutRequest[] = [];
          paySnap.forEach((d) => payList.push({ id: d.id, ...d.data() } as PayoutRequest));
          setPayouts(payList);
        } catch (e) {
          console.warn('Payouts query fallback:', e);
        }

      } catch (err) {
        console.error('Error loading ambassador dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading, router]);

  const referralLink = typeof window !== 'undefined' && ambassador?.referralCode
    ? `${window.location.origin}/register-business?ref=${ambassador.referralCode}`
    : `https://www.thenijobs.com/register-business?ref=${ambassador?.referralCode || ''}`;

  const copyCode = () => {
    if (!ambassador?.referralCode) return;
    navigator.clipboard.writeText(ambassador.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareOnWhatsApp = () => {
    if (!ambassador) return;
    const text = `வணக்கம்! உங்கள் கடையை THENIJOBS இணையதளத்தில் பதிவு செய்து சொந்த இணையதளம் மற்றும் டிஜிட்டல் விசிட்டிங் கார்டு பெறுங்கள்!\n\n` +
      `✅ 15 நிமிடத்தில் கடையின் இணையதளம்\n` +
      `✅ கூகுள் மேப் & வாட்ஸ்அப் ஆர்டர் வசதி\n` +
      `✅ வேலை ஆட்கள் சேர்க்கும் வசதி\n` +
      `✅ 1 வருடத்திற்கு முழு சேவை\n\n` +
      `என் மூலமாக பதிவு செய்ய சிறப்பு தள்ளுபடி உண்டு:\n` +
      `👉 ${referralLink}\n\n` +
      `விவரங்களுக்கு என்னை அழைக்கவும்: ${ambassador.phone}`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ambassador) return;
    setPayoutError('');
    setPayoutSuccess('');

    if (payoutAmount < 150) {
      setPayoutError('Minimum withdrawal amount is ₹150 / குறைந்தபட்ச திரும்பப் பெறும் தொகை ₹150');
      return;
    }
    if (payoutAmount > (ambassador.pendingPayoutINR || 0)) {
      setPayoutError('Requested amount exceeds available balance / கிடைக்கும் தொகையை விட அதிகம்');
      return;
    }

    if (!agreeTerms) {
      setPayoutError('Please accept the 8-Hour Payout Terms & Conditions to proceed.');
      return;
    }

    if (payoutMethod === 'bank_transfer') {
      if (!accountHolderName.trim()) {
        setPayoutError('Please enter the Account Holder Name as registered in your bank passbook.');
        return;
      }
      if (!accountNumber.trim() || accountNumber.trim().length < 8) {
        setPayoutError('Please enter a valid Bank Account Number (minimum 8 digits).');
        return;
      }
      if (accountNumber.trim() !== confirmAccountNumber.trim()) {
        setPayoutError('Account numbers do not match / வங்கி கணக்கு எண்கள் பொருந்தவில்லை.');
        return;
      }
      const cleanIfsc = ifscCode.trim().toUpperCase();
      if (!cleanIfsc || cleanIfsc.length !== 11) {
        setPayoutError('Please enter a valid 11-character Bank IFSC Code (e.g. SBIN0001234).');
        return;
      }
    } else {
      if (!confirmUpi.trim() || !confirmUpi.includes('@')) {
        setPayoutError('Please provide a valid UPI ID (e.g. yourname@okaxis / 9876543210@paytm)');
        return;
      }
    }

    try {
      setSubmittingPayout(true);
      const requestData: any = {
        ambassadorUid: user.uid,
        ambassadorName: ambassador.fullName,
        phone: ambassador.phone,
        payoutMethod,
        requestedAmountINR: payoutAmount,
        status: 'pending',
        processingTimeline: 'within_8_hours',
        requestedAt: serverTimestamp(),
      };

      if (payoutMethod === 'bank_transfer') {
        requestData.accountHolderName = accountHolderName.trim();
        requestData.accountNumber = accountNumber.trim();
        requestData.ifscCode = ifscCode.trim().toUpperCase();
        requestData.bankName = bankName.trim() || 'Bank Transfer';
      } else {
        requestData.upiId = confirmUpi.trim();
      }

      const docRef = await addDoc(collection(db, 'payoutRequests'), requestData);

      // Deduct from withdrawable pending payout balance
      const updatedPending = (ambassador.pendingPayoutINR || 0) - payoutAmount;
      const ambassadorUpdates: any = {
        pendingPayoutINR: updatedPending,
        preferredPayoutMethod: payoutMethod,
      };

      if (payoutMethod === 'bank_transfer') {
        ambassadorUpdates.bankAccountName = accountHolderName.trim();
        ambassadorUpdates.bankAccountNumber = accountNumber.trim();
        ambassadorUpdates.bankIfscCode = ifscCode.trim().toUpperCase();
        ambassadorUpdates.bankName = bankName.trim() || 'Bank Transfer';
      } else {
        ambassadorUpdates.upiId = confirmUpi.trim();
      }

      await updateDoc(doc(db, 'ambassadors', user.uid), ambassadorUpdates);

      setAmbassador({
        ...ambassador,
        ...ambassadorUpdates,
      });

      setPayouts([
        {
          id: docRef.id,
          ...requestData,
          requestedAt: new Date(),
        } as PayoutRequest,
        ...payouts,
      ]);

      const destination = payoutMethod === 'bank_transfer'
        ? `Bank Account (ending in ${accountNumber.trim().slice(-4)})`
        : `UPI (${confirmUpi.trim()})`;

      setPayoutSuccess(`⚡ Withdrawal request submitted! Funds will be transferred to your ${destination} within 8 hours guaranteed.`);
      setTimeout(() => {
        setShowPayoutModal(false);
        setPayoutSuccess('');
      }, 4000);
    } catch (err: any) {
      console.error('Failed to submit payout:', err);
      setPayoutError(err.message || 'Failed to submit withdrawal request');
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-slate-600 text-sm font-medium">Loading Ambassador Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 lg:pb-16 flex flex-col justify-between">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 w-full">
        {/* TOP WELCOME & REFERRAL CODE BANNER */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-indigo-800/40 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Village Ambassador • {ambassador?.taluk || 'Theni'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome, {ambassador?.fullName || 'Partner'}!
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                Help local shops get their website and digital business card on THENIJOBS to earn direct commissions.
              </p>
            </div>

            {/* REFERRAL CODE & ACTIONS */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div>
                <span className="text-[11px] text-slate-300 uppercase tracking-wider block font-semibold">
                  Your Referral Code
                </span>
                <span className="text-xl font-mono font-black text-amber-300 tracking-wider">
                  {ambassador?.referralCode || 'TJ-PARTNER'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyCode}
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Copy Code"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>

                <button
                  onClick={copyLink}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Copy Registration Link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Link Copied!' : 'Copy Link'}
                </button>

                <button
                  onClick={shareOnWhatsApp}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                  title="Share on WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4 STATS CARDS / WALLET OVERVIEW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Card 1: Available Withdrawable Balance */}
          <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-sm flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50/30">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Withdrawable Wallet</span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mb-2">திரும்பப் பெறக்கூடிய இருப்பு</p>
              <div className="text-3xl font-black text-slate-900 font-mono">
                ₹{(ambassador?.pendingPayoutINR || 0).toLocaleString('en-IN')}
              </div>
              <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Admin Verified &amp; Approved</span>
              </div>
            </div>

            <button
              onClick={() => {
                setPayoutAmount(ambassador?.pendingPayoutINR || 0);
                setShowPayoutModal(true);
              }}
              disabled={(ambassador?.pendingPayoutINR || 0) < 150}
              className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500 flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Withdraw Funds (8h SLA)</span>
            </button>
          </div>

          {/* Card 2: Pending Admin Verification */}
          {(() => {
            const pendingAmount = referrals
              .filter((r) => r.status === 'pending_verification')
              .reduce((sum, r) => sum + (r.commissionAmountINR || 0), 0);
            return (
              <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm flex flex-col justify-between bg-gradient-to-br from-white via-white to-amber-50/20">
                <div>
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                    <span>Pending Verification</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-[11px] text-amber-700 font-semibold mb-2">நிர்வாக சரிபார்ப்பில் உள்ள தொகை</p>
                  <div className="text-3xl font-black text-amber-600 font-mono">
                    ₹{pendingAmount.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {referrals.filter((r) => r.status === 'pending_verification').length} shop referral(s) under review
                  </p>
                </div>
                <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-100 text-[10px] text-amber-800 leading-tight">
                  Admin verifies within 24h &amp; adds directly to withdrawable wallet.
                </div>
              </div>
            );
          })()}

          {/* Card 3: Total Lifetime Earnings */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Lifetime Earnings</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-[11px] text-blue-600 font-semibold mb-2">மொத்த ஈட்டிய வருமானம்</p>
              <div className="text-3xl font-black text-slate-900 font-mono">
                ₹{(ambassador?.totalEarningsINR || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Total approved commissions
              </p>
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              <span>{referrals.length || ambassador?.referredShopsCount || 0} shops onboarded</span>
            </div>
          </div>

          {/* Card 4: Total Withdrawn */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Total Paid Out</span>
                <Award className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-[11px] text-purple-600 font-semibold mb-2">வங்கிக்கு மாற்றப்பட்ட தொகை</p>
              <div className="text-3xl font-black text-slate-900 font-mono">
                ₹{(ambassador?.paidPayoutINR || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Transferred to Bank / UPI
              </p>
            </div>
            <div className="mt-3 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ 8-Hour SLA Fulfilled</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-200 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('shops')}
            className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'shops'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Referred Shops ({referrals.length})
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'payouts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Payout History ({payouts.length})
          </button>

          <button
            onClick={() => setActiveTab('marketing')}
            className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'marketing'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Marketing Kit & Sales Guide
          </button>
        </div>

        {/* TAB 1: REFERRED SHOPS */}
        {activeTab === 'shops' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {referrals.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">
                  No shops onboarded yet (இன்னும் கடைகள் இணையவில்லை)
                </h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
                  Share your link with shopkeepers in your area. When they register and pick a plan, your commission will appear here automatically!
                </p>
                <button
                  onClick={shareOnWhatsApp}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm inline-flex items-center gap-2 shadow"
                >
                  <Share2 className="w-4 h-4" />
                  Share on WhatsApp to Local Shops
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">Shop / Company</th>
                      <th className="py-3 px-4 font-bold">Plan</th>
                      <th className="py-3 px-4 font-bold">Paid (INR)</th>
                      <th className="py-3 px-4 font-bold">Your Commission</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {referrals.map((ref) => (
                      <tr key={ref.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {ref.companyName}
                        </td>
                        <td className="py-3.5 px-4 uppercase text-xs font-semibold">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {ref.subscribedPlan}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          ₹{ref.amountPaidINR}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600 font-mono">
                          +₹{ref.commissionAmountINR}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            ref.status === 'credited' ? 'bg-emerald-100 text-emerald-700' :
                            ref.status === 'paid_out' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {ref.status === 'credited' ? 'Credited' : ref.status === 'paid_out' ? 'Paid' : ref.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {ref.createdAt?.toDate ? ref.createdAt.toDate().toLocaleDateString('en-IN') : 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAYOUT HISTORY */}
        {activeTab === 'payouts' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {payouts.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">
                  No payout requests yet
                </h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
                  Once you earn commissions by onboarding shops, you can withdraw your balance directly to your UPI account.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">Request Date</th>
                      <th className="py-3 px-4 font-bold">Amount</th>
                      <th className="py-3 px-4 font-bold">Payout Method &amp; Details</th>
                      <th className="py-3 px-4 font-bold">Processing SLA</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Bank UTR / Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payouts.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {pay.requestedAt?.toDate ? pay.requestedAt.toDate().toLocaleDateString('en-IN') : 'Recent'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                          ₹{pay.requestedAmountINR.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {pay.payoutMethod === 'bank_transfer' ? (
                            <div className="space-y-0.5">
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[10px]">
                                <Building className="w-3 h-3" />
                                <span>Bank Transfer</span>
                              </div>
                              <p className="font-semibold text-slate-800">{pay.accountHolderName || 'Account'}</p>
                              <p className="font-mono text-slate-500 text-[11px]">
                                {pay.accountNumber ? `A/C: ••••${pay.accountNumber.slice(-4)}` : ''} · {pay.ifscCode}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                                <Smartphone className="w-3 h-3" />
                                <span>UPI Payout</span>
                              </div>
                              <p className="font-mono text-slate-800 font-semibold">{pay.upiId}</p>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            <Zap className="w-3 h-3 text-amber-600" />
                            <span>8-Hour SLA</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            pay.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            pay.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {pay.status === 'completed' ? 'Completed' : pay.status === 'pending' ? 'Processing' : 'Rejected'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {pay.utrNumber ? (
                            <span className="text-emerald-700 font-bold">{pay.utrNumber}</span>
                          ) : (
                            <span className="text-slate-400">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MARKETING KIT */}
        {activeTab === 'marketing' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-2">
                1. WhatsApp Message for Local Shops (வாட்ஸ்அப் செய்தி)
              </h3>
              <p className="text-slate-600 text-xs mb-4">
                Copy and send this text to local shop owners, textile showrooms, clinics, and service providers:
              </p>
              <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-700 font-mono leading-relaxed border border-slate-200 mb-4 whitespace-pre-line">
{`வணக்கம்! உங்கள் கடையை THENIJOBS இணையதளத்தில் பதிவு செய்து சொந்த இணையதளம் மற்றும் டிஜிட்டல் விசிட்டிங் கார்டு பெறுங்கள்!

✅ 15 நிமிடத்தில் கடையின் இணையதளம்
✅ கூகுள் மேப் & வாட்ஸ்அப் ஆர்டர் வசதி
✅ வேலை ஆட்கள் தேவை விளம்பரம்
✅ 1 வருடத்திற்கு முழு சேவை

என் மூலமாக பதிவு செய்ய சிறப்பு தள்ளுபடி உண்டு:
👉 ${referralLink}

உடனடி விவரங்களுக்கு அழைக்கவும்: ${ambassador?.phone || SITE_CONTACT.phone1}`}
              </div>
              <button
                onClick={shareOnWhatsApp}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
              >
                <Share2 className="w-4 h-4" /> Share Direct to WhatsApp
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-2">
                  2. Key Talking Points (கடைக்காரரிடம் என்ன பேச வேண்டும்?)
                </h3>
                <ul className="text-xs text-slate-600 space-y-3 mt-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>சொந்த இணையதளம்:</strong> தனியாக வெப்சைட் செய்ய ₹15,000–₹25,000 ஆகும். THENIJOBS-ல் வெறும் ₹1,800-ல் நவீன வெப்சைட் கிடைக்கிறது.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>வாட்ஸ்அப் ஆர்டர்:</strong> வாடிக்கையாளர்கள் பொருட்கள் அல்லது சேவையை வாட்ஸ்அப் மூலம் உடனடியாக ஆர்டர் செய்யலாம்.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>ஆட்கள் தேவை:</strong> கடைக்கு வேலை ஆட்கள் தேவைப்பட்டால், தேனி மாவட்ட இளைஞர்களிடம் எளிதாக விளம்பரம் செய்யலாம்.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>QR விசிட்டிங் கார்டு:</strong> கடையில் வைக்கக்கூடிய QR கோடு கிடைக்கும். வாடிக்கையாளர்கள் ஸ்கேன் செய்தால் கடையின் விவரம் போனில் சேமிக்கப்படும்.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Support helpline: {SITE_CONTACT.phone1}</span>
                <span className="font-semibold text-blue-600">Theni Jobs Partner</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* REQUEST PAYOUT / WITHDRAWAL MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>⚡ 8-Hour Express Payout</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Withdraw Funds from Wallet
                </h3>
                <p className="text-slate-500 text-xs">
                  கமிஷன் தொகையை வங்கி கணக்கு அல்லது UPI-க்கு திரும்பப் பெறவும்.
                </p>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payoutError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{payoutError}</span>
              </div>
            )}
            {payoutSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-700 text-xs border border-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{payoutSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRequestPayout} className="space-y-4">
              {/* Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Select Payout Method / பணம் பெறும் முறை
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('bank_transfer')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      payoutMethod === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Bank Transfer (IMPS/NEFT)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutMethod('upi')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      payoutMethod === 'upi'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Direct UPI (GPay/PhonePe)</span>
                  </button>
                </div>
              </div>

              {/* Amount to Withdraw */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Withdrawal Amount (திரும்பப் பெறும் தொகை)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min={150}
                    max={ambassador?.pendingPayoutINR || 0}
                    value={payoutAmount || ''}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    placeholder="Min 150"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm font-mono font-bold"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Available: <strong className="text-slate-900 font-mono">₹{(ambassador?.pendingPayoutINR || 0).toLocaleString('en-IN')}</strong> (Min ₹150)</span>
                  <button
                    type="button"
                    onClick={() => setPayoutAmount(ambassador?.pendingPayoutINR || 0)}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    Withdraw All
                  </button>
                </div>
              </div>

              {/* Bank Details Fields */}
              {payoutMethod === 'bank_transfer' ? (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bank Account Details (வங்கி விவரங்கள்)</span>
                  </p>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Account Holder Name (வங்கி பாஸ்புக்கில் உள்ள பெயர்) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="e.g. S. Murugan"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Bank Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g. 10293847561"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Confirm Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={confirmAccountNumber}
                        onChange={(e) => setConfirmAccountNumber(e.target.value)}
                        placeholder="Re-enter Account No"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs font-mono bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Bank IFSC Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        placeholder="e.g. SBIN0001234"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs font-mono uppercase bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Bank &amp; Branch Name
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. SBI Theni Main Branch"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    UPI ID (GPay / PhonePe / Paytm / BHIM) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={confirmUpi}
                    onChange={(e) => setConfirmUpi(e.target.value)}
                    placeholder="e.g. 9876543210@okaxis or yourname@upi"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-xs font-mono bg-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    Funds will be credited directly to your UPI handle within 8 hours.
                  </p>
                </div>
              )}

              {/* ⚡ 8-Hour Fast Transfer Guarantee Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-emerald-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center shrink-0 shadow-xs font-black">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    ⚡ 8-Hour Express Payout Guaranteed
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Withdrawal requests are audited by the THENIJOBS finance team and deposited directly to your bank account / UPI within <strong>8 business hours</strong>.
                  </p>
                </div>
              </div>

              {/* Terms & Conditions Section (Own Creation) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setShowTermsExpanded(!showTermsExpanded)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-between text-left transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>View 8-Hour Payout Terms &amp; Conditions (விதிமுறைகள்)</span>
                  </span>
                  {showTermsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showTermsExpanded && (
                  <div className="p-3.5 bg-white space-y-2 text-[11px] text-slate-600 border-t border-slate-200 leading-relaxed">
                    <p><strong>1. Processing SLA:</strong> All approved withdrawal requests are transferred to your registered Bank Account or UPI within 8 working hours (9:00 AM – 7:00 PM).</p>
                    <p><strong>2. Minimum Threshold:</strong> The minimum withdrawable amount per transaction is ₹150.</p>
                    <p><strong>3. Details Accuracy:</strong> Account Holder Name, Bank Account Number, and IFSC Code must match your official bank passbook. THENIJOBS is not responsible for failed transactions caused by inaccurate user credentials.</p>
                    <p><strong>4. Genuine Business Referrals:</strong> Commissions are granted exclusively for authentic, registered local businesses that subscribe to paid plans.</p>
                    <p><strong>5. Fair Practices &amp; Anti-Fraud:</strong> Self-referrals, robotic entries, or fraudulent duplicate accounts violate partnership terms and result in immediate wallet forfeiture.</p>
                    <p><strong>6. Statutory Compliance:</strong> Transfers comply with RBI guidelines and Indian banking regulations. An official UTR is generated for every payout.</p>
                    <p><strong>7. Direct Help:</strong> For any payout questions, contact THENIJOBS finance support on WhatsApp at +91 93605 19460.</p>
                  </div>
                )}

                <div className="px-3.5 py-2.5 bg-slate-50/50 border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="agreeTermsCheckbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                  />
                  <label htmlFor="agreeTermsCheckbox" className="text-[11px] text-slate-700 font-semibold cursor-pointer">
                    I confirm my bank/UPI details are correct and agree to the 8-Hour Withdrawal Terms.
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout || (ambassador?.pendingPayoutINR || 0) < 150 || !agreeTerms}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submittingPayout ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Request...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Confirm 8-Hour Withdrawal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
