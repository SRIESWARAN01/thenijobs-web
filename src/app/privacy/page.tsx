import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Lock, Eye, FileText, Database, Phone, CheckCircle, Info } from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import HomeFooter from '@/components/home/HomeFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy – THENIJOBS',
  description: 'Learn how THENIJOBS collects, protects, uses, and handles user data in compliance with Google Play Store Policies and standard privacy regulations.',
  keywords: ['THENIJOBS Privacy Policy', 'Data Protection', 'User Data Deletion', 'Theni Jobs Privacy', 'Capacitor App Privacy'],
  alternates: {
    canonical: 'https://thenijobs.com/privacy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#04040d] text-slate-100 font-sans selection:bg-violet-600/30">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-28 sm:px-6">
        {/* Decorative Top Glows */}
        <div className="absolute top-0 left-1/4 -z-10 h-96 w-96 rounded-full bg-violet-600/5 blur-3xl" />
        <div className="absolute top-20 right-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-600/5 blur-3xl" />

        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-400 mb-4 shadow-lg shadow-violet-500/5">
            <Shield size={28} />
          </div>
          <h1 className="font-outfit font-black text-3xl sm:text-4xl text-white tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm font-semibold text-slate-400">
            Last Updated: July 1, 2026
          </p>
        </div>

        {/* Main Policy Container */}
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#080814]/75 p-6 backdrop-blur-xl sm:p-10 shadow-2xl">
          {/* Glass Card Grid */}
          <div className="space-y-10">
            
            {/* 1. Introduction */}
            <div>
              <h2 className="flex items-center gap-2.5 font-outfit font-bold text-lg sm:text-xl text-white mb-4 border-b border-white/5 pb-2">
                <Info size={20} className="text-violet-400" />
                1. Introduction
              </h2>
              <p className="text-sm leading-relaxed text-slate-300">
                Welcome to <strong>THENIJOBS</strong>. We are committed to protecting your personal information and your right to privacy. This Privacy Policy governs our data protection practices for the THENIJOBS web platform and our official Android application (built using Capacitor). By using our services, you consent to the collection and use of information in accordance with this policy.
              </p>
            </div>

            {/* 2. Information We Collect */}
            <div>
              <h2 className="flex items-center gap-2.5 font-outfit font-bold text-lg sm:text-xl text-white mb-4 border-b border-white/5 pb-2">
                <Database size={20} className="text-violet-400" />
                2. Information We Collect
              </h2>
              <p className="text-sm leading-relaxed text-slate-300 mb-3">
                To provide our localized jobs marketplace and business directory services, we collect both personal and device data:
              </p>
              <ul className="list-inside list-disc text-sm space-y-2.5 pl-2 text-slate-300">
                <li><strong>Account Credentials:</strong> Phone number and role type (Job Seeker, Employer, Business Owner, Service Provider, or Supplier).</li>
                <li><strong>Profile Details:</strong> Full name, age, gender, district, specific city, email ID, and profile photograph.</li>
                <li><strong>Resume Data:</strong> Skills, education, work history, certification details, and uploaded PDF resumes for Job Seekers.</li>
                <li><strong>Company & Listing Info:</strong> Business name, logo, GSTIN (stored privately), product details, services menu, and address.</li>
                <li><strong>Device Information:</strong> We may collect device model, OS version, push notification tokens (for Firebase Cloud Messaging), and unique device IDs to ensure app security.</li>
              </ul>
            </div>

            {/* 3. How We Use Your Data */}
            <div>
              <h2 className="flex items-center gap-2.5 font-outfit font-bold text-lg sm:text-xl text-white mb-4 border-b border-white/5 pb-2">
                <CheckCircle size={20} className="text-violet-400" />
                3. How We Use Your Data
              </h2>
              <p className="text-sm leading-relaxed text-slate-300 mb-3">
                Your data is processed to deliver, improve, and secure the platform:
              </p>
              <ul className="list-inside list-disc text-sm space-y-2.5 pl-2 text-slate-300">
                <li>To enable Job Seekers to apply to jobs and share their resumes with Employers.</li>
                <li>To generate and showcase printable digital portfolios and business ID cards with QR codes.</li>
                <li>To route platform-wide announcements, job status updates, and notifications using Firebase Cloud Messaging.</li>
                <li>To verify companies, prevent spam, and maintain a high-trust, safe marketplace.</li>
              </ul>
            </div>

            {/* 4. Data Sharing and Third-Party Services */}
            <div>
              <h2 className="flex items-center gap-2.5 font-outfit font-bold text-lg sm:text-xl text-white mb-4 border-b border-white/5 pb-2">
                <Lock size={20} className="text-violet-400" />
                4. Data Security and Third Parties
              </h2>
              <p className="text-sm leading-relaxed text-slate-300 mb-3">
                We implement strict security practices to shield your data from unauthorized access. Your data is stored securely in Firebase Firestore and Cloud Storage, and we utilize the following third-party integrations:
              </p>
              <ul className="list-inside list-disc text-sm space-y-2.5 pl-2 text-slate-300">
                <li><strong>Firebase (Google LLC):</strong> For authentication, firestore database, analytics, and messaging.</li>
                <li><strong>Razorpay:</strong> To process secure subscription payments. No credit card or banking details are stored on our servers.</li>
              </ul>
            </div>

            {/* 5. User Control and Data Deletion */}
            <div>
              <h2 className="flex items-center gap-2.5 font-outfit font-bold text-lg sm:text-xl text-white mb-4 border-b border-white/5 pb-2">
                <Eye size={20} className="text-violet-400" />
                5. User Rights & Data Deletion
              </h2>
              <p className="text-sm leading-relaxed text-slate-300 mb-3">
                We believe in full transparency and ownership over your personal data.
              </p>
              <p className="text-sm leading-relaxed text-slate-300 mb-3">
                <strong>Data Deletion Request:</strong> If you wish to delete your account and remove all your data permanently from our platform (including your profile, resumes, jobs, and listings), you can:
              </p>
              <ul className="list-inside list-disc text-sm space-y-2 pl-2 text-slate-300">
                <li>Go to the **Settings** menu inside your dashboard and click **Delete Account**.</li>
                <li>Or contact us directly at our WhatsApp support helpline: <a href="https://wa.me/917094826586" target="_blank" rel="noreferrer" className="text-violet-400 font-bold hover:underline">+91 70948 26586</a> with your registered mobile number.</li>
              </ul>
              <p className="text-sm leading-relaxed text-slate-300 mt-3">
                Upon request, all relevant database records and cloud storage uploads will be permanently purged within 48 hours.
              </p>
            </div>

            {/* 6. Children's Privacy */}
            <div>
              <h2 className="flex items-center gap-2.5 font-outfit font-bold text-lg sm:text-xl text-white mb-4 border-b border-white/5 pb-2">
                <Shield size={20} className="text-violet-400" />
                6. Children&apos;s Privacy
              </h2>
              <p className="text-sm leading-relaxed text-slate-300">
                THENIJOBS does not knowingly collect or solicit personal information from anyone under the age of 13. If we discover that we have collected personal data from a child under 13, we will delete that information immediately.
              </p>
            </div>

            {/* 7. Contact Us */}
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 sm:p-6">
              <h2 className="flex items-center gap-2.5 font-outfit font-bold text-lg text-white mb-3">
                <Phone size={18} className="text-violet-400" />
                Contact & Support
              </h2>
              <p className="text-sm leading-relaxed text-slate-300 mb-4">
                If you have any questions regarding this Privacy Policy or data handling, please get in touch with us:
              </p>
              <div className="text-sm space-y-2 text-slate-300">
                <p><strong>Official Partner:</strong> THENIJOBS Platform</p>
                <p><strong>WhatsApp Support:</strong> <a href="https://wa.me/917094826586" target="_blank" rel="noreferrer" className="text-violet-400 font-bold hover:underline">+91 70948 26586</a></p>
                <p><strong>Address:</strong> North Street, A.M. Patty, Uthamapalayam, Theni District, Tamil Nadu, India.</p>
              </div>
            </div>

          </div>
        </div>
      </main>

      <BottomNav />
      <HomeFooter />
    </div>
  );
}
