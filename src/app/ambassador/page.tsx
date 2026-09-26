'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import FloatingWhatsApp from '@/components/ui/FloatingWhatsApp';
import {
  Award, TrendingUp, Wallet, CheckCircle2, Share2, Building2,
  Users, ArrowRight, QrCode, Phone, ShieldCheck, HelpCircle,
  Sparkles, DollarSign, Calculator, ChevronRight, Loader2,
  ExternalLink, Gift, Smartphone
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AMBASSADOR_COMMISSIONS, SITE_CONTACT } from '@/lib/constants';
import type { Ambassador } from '@/lib/types/ambassador';

const TALUKS = [
  'Theni', 'Periyakulam', 'Bodinayakanur', 'Cumbum',
  'Uthamapalayam', 'Chinnamanur', 'Andipatti', 'Dindigul',
  'Madurai', 'Other Tamil Nadu'
];

export default function AmbassadorLandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loadingCheck, setLoadingCheck] = useState(false);
  const [existingAmbassador, setExistingAmbassador] = useState<Ambassador | null>(null);

  // Calculator State
  const [standardCount, setStandardCount] = useState(6);
  const [premiumCount, setPremiumCount] = useState(4);
  const estimatedEarnings = (standardCount * (AMBASSADOR_COMMISSIONS.standard || 350)) +
                            (premiumCount * (AMBASSADOR_COMMISSIONS.premium || 700));

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [taluk, setTaluk] = useState('Theni');
  const [occupation, setOccupation] = useState('College Student');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Check if logged-in user is already an ambassador
  useEffect(() => {
    async function checkAmbassador() {
      if (!user?.uid) return;
      try {
        setLoadingCheck(true);
        const ref = doc(db, 'ambassadors', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setExistingAmbassador(snap.data() as Ambassador);
        } else {
          if (user.displayName) setFullName(user.displayName);
          if (user.phone) setPhone(user.phone.replace('+91', ''));
        }
      } catch (err) {
        console.error('Error checking ambassador doc:', err);
      } finally {
        setLoadingCheck(false);
      }
    }
    checkAmbassador();
  }, [user]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('Please enter your full name / உங்கள் பெயரை உள்ளிடவும்');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit mobile number / சரியான மொபைல் எண் உள்ளிடவும்');
      return;
    }
    if (!upiId.trim() || !upiId.includes('@')) {
      setFormError('Please enter a valid UPI ID (e.g. mobile@okaxis / name@upi) for payouts');
      return;
    }

    if (!user) {
      // Direct user to login/register first
      router.push(`/login?redirect=/ambassador`);
      return;
    }

    try {
      setSubmitting(true);
      // Generate clean unique referral code
      const cleanName = fullName.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() || 'THENI';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const referralCode = `TJ-${cleanName}${randomSuffix}`;

      const ambassadorData: Ambassador = {
        uid: user.uid,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: user.email || '',
        upiId: upiId.trim(),
        district: 'Theni',
        taluk,
        referralCode,
        status: 'active',
        totalEarningsINR: 0,
        pendingPayoutINR: 0,
        paidPayoutINR: 0,
        referredShopsCount: 0,
        occupation,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'ambassadors', user.uid), ambassadorData, { merge: true });
      router.push('/ambassador/dashboard');
    } catch (err: any) {
      console.error('Failed to create ambassador profile:', err);
      setFormError(err.message || 'Failed to create ambassador profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 lg:pb-16 flex flex-col justify-between">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 w-full">
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-indigo-800/40 mb-12">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs sm:text-sm font-semibold mb-6">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Village Ambassador Network • ஊர் அம்பாசிடர் திட்டம்</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
              Connect Local Shops.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Earn ₹5,000 – ₹15,000+ Every Month.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
              தேனி மாவட்டம் மற்றும் தமிழ்நாட்டின் வணிகர்கள், கடைகள் மற்றும் நிறுவனங்களை <strong className="text-white">THENIJOBS</strong>-ல் இணைத்து, ஒவ்வொரு கடைக்கும் <strong className="text-emerald-400">₹350 முதல் ₹1,000 வரை</strong> நேரடி UPI கமிஷன் பெறுங்கள்!
            </p>

            {existingAmbassador ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 inline-flex flex-col sm:flex-row items-center gap-4">
                <div>
                  <p className="text-xs text-slate-300">You are already an active ambassador!</p>
                  <p className="font-bold text-white text-lg">Referral Code: <span className="text-amber-300 font-mono">{existingAmbassador.referralCode}</span></p>
                </div>
                <Link
                  href="/ambassador/dashboard"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#signup-form"
                  className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  Join as Ambassador (இப்போதே இணையுங்கள்)
                </a>
                <a
                  href="#calculator"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base backdrop-blur-sm border border-white/15 flex items-center gap-2 transition-all"
                >
                  <Calculator className="w-4 h-4" /> Calculate Earnings
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 3 VALUE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">Direct UPI Payouts</h3>
            <p className="text-sm font-semibold text-emerald-600 mb-2">நேரடி UPI பணம் செலுத்துதல்</p>
            <p className="text-slate-600 text-sm leading-relaxed">
              No complicated wallets. Request payouts directly to your GPay, PhonePe, or Paytm UPI ID with 24-hour settlement.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">Shops Love THENIJOBS</h3>
            <p className="text-sm font-semibold text-blue-600 mb-2">வணிகர்களுக்கு பிரத்யேக வசதிகள்</p>
            <p className="text-slate-600 text-sm leading-relaxed">
              Shops get their own portfolio website, digital visiting card with QR code, job posting tools, and WhatsApp direct ordering.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">Anyone Can Join</h3>
            <p className="text-sm font-semibold text-purple-600 mb-2">யார் வேண்டுமானாலும் சேரலாம்</p>
            <p className="text-slate-600 text-sm leading-relaxed">
              College students, local DTP centers, Xerox shops, community youth, and freelance marketers. Work at your own pace.
            </p>
          </div>
        </div>

        {/* HOW IT WORKS STEPS */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How It Works (எளிய 4 படிகள்)
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Start earning your commission in four simple, transparent steps:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center relative">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4 text-sm">1</span>
              <h4 className="font-bold text-slate-900 mb-1">Register for Free</h4>
              <p className="text-xs text-blue-600 font-semibold mb-2">இலவசமாக இணையுங்கள்</p>
              <p className="text-xs text-slate-600">Fill your name, taluk, and UPI ID to generate your unique referral code.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center relative">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4 text-sm">2</span>
              <h4 className="font-bold text-slate-900 mb-1">Get Your Link & QR</h4>
              <p className="text-xs text-blue-600 font-semibold mb-2">லிங்க் & QR கோடு பெறுங்கள்</p>
              <p className="text-xs text-slate-600">Get your personal sharing link and 1-click WhatsApp brochure message.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center relative">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4 text-sm">3</span>
              <h4 className="font-bold text-slate-900 mb-1">Help Shops Register</h4>
              <p className="text-xs text-blue-600 font-semibold mb-2">கடைகளை இணையத்தில் சேருங்கள்</p>
              <p className="text-xs text-slate-600">Show local shops how THENIJOBS creates their website and brings customers.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center relative">
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto mb-4 text-sm">4</span>
              <h4 className="font-bold text-slate-900 mb-1">Get Instant Payout</h4>
              <p className="text-xs text-emerald-600 font-semibold mb-2">கமிஷன் பணம் பெறுங்கள்</p>
              <p className="text-xs text-slate-600">When the shop subscribes, earn ₹350 – ₹1,000 instantly to your UPI account.</p>
            </div>
          </div>
        </div>

        {/* COMMISSION CALCULATOR */}
        <div id="calculator" className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-8 sm:p-10 border border-indigo-800 shadow-xl mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
                <Calculator className="w-3.5 h-3.5" />
                <span>Monthly Earning Estimator • வருமான கணக்கீடு</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-3">
                See How Much You Can Earn
              </h3>
              <p className="text-slate-300 text-sm mb-6">
                Adjust the sliders below to estimate your monthly part-time or full-time commission by helping local businesses in your town:
              </p>

              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-slate-200">
                      Standard Plans (₹1,800/yr) — <span className="text-emerald-400">₹350/shop</span>
                    </span>
                    <span className="bg-blue-600 px-2.5 py-0.5 rounded-full text-white text-xs">{standardCount} shops</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={standardCount}
                    onChange={(e) => setStandardCount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-slate-200">
                      Premium Plans (₹3,500/yr) — <span className="text-amber-400">₹700/shop</span>
                    </span>
                    <span className="bg-purple-600 px-2.5 py-0.5 rounded-full text-white text-xs">{premiumCount} shops</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={premiumCount}
                    onChange={(e) => setPremiumCount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 text-center">
              <p className="text-xs uppercase tracking-wider text-slate-300 font-semibold mb-1">
                Estimated Monthly Income
              </p>
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 my-2">
                ₹{estimatedEarnings.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-300 mb-6">
                Based on onboarding {standardCount + premiumCount} shops this month
              </p>

              <div className="text-left bg-slate-900/60 rounded-xl p-4 text-xs space-y-2 text-slate-300 mb-6">
                <div className="flex justify-between">
                  <span>Standard ({standardCount} × ₹350):</span>
                  <span className="font-semibold text-white">₹{(standardCount * 350).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Premium ({premiumCount} × ₹700):</span>
                  <span className="font-semibold text-white">₹{(premiumCount * 700).toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-slate-700 pt-1.5 flex justify-between font-bold text-emerald-400">
                  <span>Total Payout:</span>
                  <span>₹{estimatedEarnings.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <a
                href="#signup-form"
                className="w-full block py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-lg"
              >
                Claim Your Referral Code Now
              </a>
            </div>
          </div>
        </div>

        {/* SIGNUP FORM */}
        <div id="signup-form" className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl mb-16">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              Join the Ambassador Network
            </h3>
            <p className="text-slate-600 text-sm mt-1">
              ஊர் அம்பாசிடராக சேர உங்கள் விவரங்களை உள்ளிடவும்:
            </p>
          </div>

          {formError && (
            <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name (உங்கள் முழு பெயர்) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. S. Kumar"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number (வாட்ஸ்அப் எண்) <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-600 text-sm font-semibold">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 rounded-r-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Taluk / Area (வட்டம்) <span className="text-red-500">*</span>
                </label>
                <select
                  value={taluk}
                  onChange={(e) => setTaluk(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm bg-white"
                >
                  {TALUKS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                UPI ID for Payouts (GPay / PhonePe UPI) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. 9876543210@okaxis or yourname@upi"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm font-mono"
                />
                <span className="absolute right-3 top-3 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Direct UPI
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Your earned commission will be credited directly to this UPI ID upon request.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Occupation / You Are A (நீங்கள் யார்?)
              </label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm bg-white"
              >
                <option value="College Student">College Student (கல்லூரி மாணவர்)</option>
                <option value="DTP / Xerox Center Owner">DTP / Browsing / Xerox Center</option>
                <option value="Freelancer / Marketer">Freelancer / Marketer</option>
                <option value="Job Seeker">Job Seeker (வேலை தேடுபவர்)</option>
                <option value="Shop Employee">Local Shop Employee</option>
                <option value="Other">Other (பிற)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || loadingCheck}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Your Ambassador Account...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  Generate Referral Code & Start Earning
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-500">
              By joining, you agree to THENIJOBS partnership terms. Need help? Call: {SITE_CONTACT.phone1}
            </p>
          </form>
        </div>

        {/* FAQ SECTION */}
        <div className="max-w-3xl mx-auto mb-16">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">
            Frequently Asked Questions (அடிக்கடி கேட்கப்படும் கேள்விகள்)
          </h3>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                1. How do I get paid? (எனக்கு கமிஷன் பணம் எப்படி கிடைக்கும்?)
              </h4>
              <p className="text-slate-600 text-sm mt-2">
                When a shop owner registers using your referral link or code and subscribes to any paid plan, the commission is credited instantly to your Ambassador Dashboard. You can click <strong>&quot;Request Payout&quot;</strong> anytime to receive it via GPay, PhonePe, or Bank UPI.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                2. What do local shops get on THENIJOBS?
              </h4>
              <p className="text-slate-600 text-sm mt-2">
                Local shops get a dedicated online presence with 15 business templates, a digital visiting card with QR code, job posting capabilities to hire local staff, Google Map integration, and WhatsApp direct ordering.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                3. Is there any joining fee? (சேர கட்டணம் ஏதும் உண்டா?)
              </h4>
              <p className="text-slate-600 text-sm mt-2">
                <strong>No.</strong> Becoming a Village Ambassador is 100% free forever. Anyone residing in Theni or Tamil Nadu can join and earn.
              </p>
            </div>
          </div>
        </div>
      </main>

      <FloatingWhatsApp />
      <BottomNav />
    </div>
  );
}
