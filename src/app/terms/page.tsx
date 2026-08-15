import type { Metadata } from 'next';
import Header from '@/components/navigation/Header';
import HomeFooter from '@/components/home/HomeFooter';
import { FileText, ShieldAlert, CheckCircle2, Phone, Mail, MapPin, Calendar, Lock, AlertTriangle, Scale } from 'lucide-react';
import Link from 'next/link';
import { SITE_CONTACT } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms of Service | THENIJOBS — Platform Usage & Terms',
  description: 'THENIJOBS Terms of Service governing access, job search, employer listings, company profiles, payments, and platform usage.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-outfit">
      <Header />

      {/* Hero Header */}
      <section className="pt-24 pb-12 px-4 sm:px-6 bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950 text-white">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
            <Scale size={14} /> Legal Agreement
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Terms of Service
          </h1>
          <div className="flex items-center justify-center gap-4 text-xs text-blue-200/80 flex-wrap">
            <span className="flex items-center gap-1.5"><Calendar size={13} /> Last Updated: 15 August 2026</span>
            <span>•</span>
            <span className="flex items-center gap-1.5"><Lock size={13} /> Indian Jurisdiction &amp; IT Act Compliant</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm space-y-8 text-sm text-gray-700 leading-relaxed">
          
          {/* Welcome & Preamble */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-950 space-y-2">
            <p className="font-semibold text-sm">Welcome to THENIJOBS.</p>
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the THENIJOBS website, mobile applications, job listings, employer services, company profiles, recruitment tools, marketplace listings, and related digital services (collectively, the &quot;Platform&quot;).
            </p>
            <p>
              By accessing or using THENIJOBS, you agree to be bound by these Terms. If you do not agree with any part of these Terms, please do not access or use the Platform.
            </p>
          </div>

          {/* Section 1: About THENIJOBS */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">1</span>
              About THENIJOBS
            </h2>
            <p>THENIJOBS is an employment and business directory platform designed to facilitate connections between:</p>
            <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 pl-2">
              <li>Job seekers discovering local career opportunities in Theni and Tamil Nadu.</li>
              <li>Employers and local businesses publishing employment vacancies.</li>
              <li>Companies creating digital verified profiles and product/service catalogues.</li>
              <li>Employers receiving and managing candidate job applications.</li>
            </ul>
            <p className="text-xs font-semibold text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200">
              ⚠️ Important Clarification: Unless expressly stated otherwise, THENIJOBS is a technology intermediary platform connecting users. THENIJOBS is NOT an employer, staffing agency, recruiter, or hiring decision-maker for jobs posted by third-party companies.
            </p>
          </section>

          {/* Section 2: Eligibility */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">2</span>
              Eligibility
            </h2>
            <p>
              You must provide accurate, current information and be legally permitted to enter into binding agreements under the Indian Contract Act, 1872. If you access THENIJOBS on behalf of a company, partnership, or organization, you confirm that you possess lawful authority to bind that entity to these Terms.
            </p>
          </section>

          {/* Section 3: Account Registration & Security */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">3</span>
              Account Registration &amp; Mobile OTP Authentication
            </h2>
            <p>Certain interactive features require creating an account via Mobile OTP or Email. You agree to:</p>
            <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 pl-2">
              <li>Provide true, accurate, and complete registration information.</li>
              <li>Maintain and promptly update your profile details.</li>
              <li>Keep login credentials and SMS/Call OTPs confidential.</li>
              <li>Never share your OTP or password with any third party.</li>
              <li>Never impersonate another individual or business entity.</li>
              <li>Notify us immediately at <a href="mailto:info@thenijobs.com" className="text-blue-700 font-bold hover:underline">info@thenijobs.com</a> if you suspect unauthorized account access.</li>
            </ul>
          </section>

          {/* Section 4: Job Seeker Responsibilities */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">4</span>
              Job Seeker Responsibilities
            </h2>
            <p>Job seekers must ensure that resumes, education qualifications, and work experience are truthful. You must NOT:</p>
            <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 pl-2">
              <li>Upload fraudulent resumes or fake degrees.</li>
              <li>Claim employment experience or skills you do not possess.</li>
              <li>Apply using another person&apos;s identity or contact details.</li>
              <li>Misuse employer contact details for non-employment solicitations.</li>
            </ul>
          </section>

          {/* Section 5: Employer Responsibilities */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">5</span>
              Employer Responsibilities &amp; Job Posting Standards
            </h2>
            <p>Employers are solely responsible for the validity of the jobs and company information they publish. Employers must ensure postings are accurate, lawful, and relevant. Employers must NEVER publish:</p>
            <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 pl-2">
              <li>Fake, non-existent, or multi-level marketing (MLM) schemes.</li>
              <li>Jobs requiring illegal upfront deposits, registration fees, or training costs from candidates.</li>
              <li>Discriminatory job postings prohibited under applicable Indian laws.</li>
              <li>Listings requesting passwords, OTPs, UPI PINs, or confidential banking credentials.</li>
            </ul>
          </section>

          {/* Section 6 & 7: Job Listings & Applications */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">6</span>
              Job Listings, Applications &amp; Moderation
            </h2>
            <p>
              THENIJOBS reserves the right to review, moderate, edit, suspend, or remove any job vacancy or company profile that violates these Terms, creates safety risks, or violates applicable law.
            </p>
            <p className="text-xs text-gray-500">
              A listing appearing on THENIJOBS does not constitute an express guarantee by THENIJOBS regarding the employer, salary, working conditions, or hiring outcome.
            </p>
          </section>

          {/* Section 8: Hiring Decisions */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">7</span>
              No Hiring or Employment Guarantee
            </h2>
            <p>
              Employers are independently responsible for all interviewing and hiring decisions. THENIJOBS does not guarantee that applying for a job will result in an interview, job offer, or specific salary. Candidates are encouraged to independently verify employment terms.
            </p>
          </section>

          {/* Section 9 & 10: Company Profiles & Verification Badges */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">8</span>
              Company Profiles, Verification Badges &amp; Products
            </h2>
            <p>
              Companies may create business profiles with logos, descriptions, products/services, and contact links. Verification badges (&quot;Verified Company&quot;) signify basic business authenticity review by our admin team, but do not constitute financial or legal warranty.
            </p>
          </section>

          {/* Section 11 & 12: Prohibited Activities */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">9</span>
              Prohibited Activities
            </h2>
            <p>Users shall NOT engage in any of the following activities on THENIJOBS:</p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-red-900">
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
                🚫 Committing fraud, impersonation, or creating fake accounts.
              </div>
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
                🚫 Scraping, data-mining, or bulk automated harvesting of resumes.
              </div>
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
                🚫 Reverse-engineering, attacking, or bypassing Platform security.
              </div>
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
                🚫 Uploading malware, viruses, or disruptive computer code.
              </div>
            </div>
          </section>

          {/* Section 13: Sensitive Information Prohibition */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">10</span>
              Resume &amp; Sensitive Credentials Safeguard
            </h2>
            <p className="font-bold text-slate-900">
              🔒 NEVER upload or submit passwords, OTPs, UPI PINs, ATM PINs, banking passwords, or card security codes anywhere on THENIJOBS.
            </p>
          </section>

          {/* Section 14, 15, 16: Payments, Subscriptions & Refunds */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">11</span>
              Payments, Razorpay Gateway &amp; Subscriptions
            </h2>
            <p>
              Certain services (e.g. Standard/Premium/Enterprise employer plans, featured listings, digital ID cards) require annual payment. All payments are processed securely via <strong>Razorpay</strong>.
            </p>
            <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 pl-2">
              <li>Applicable pricing, taxes, and validity periods are displayed prior to payment.</li>
              <li>Upon successful transaction, an official payment receipt / tax slip is generated with 1-year access.</li>
              <li>Refund requests are evaluated based on service status, technical delivery, and statutory consumer protection rules. Unauthorized or duplicate charges should be reported immediately.</li>
            </ul>
          </section>

          {/* Section 17 & 18: Intellectual Property */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">12</span>
              Intellectual Property Rights
            </h2>
            <p>
              The THENIJOBS brand, logo, domain, interface design, algorithms, graphics, and software code are proprietary assets protected by Indian copyright and intellectual property laws. Users may not copy, scrape, or commercially exploit platform assets without prior written consent.
            </p>
          </section>

          {/* Section 19 to 24: Platform Availability & User Safety */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">13</span>
              Job Scam Warning &amp; User Safety
            </h2>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle size={16} /> Candidate Safety Advisory
              </div>
              <p>
                Legitimate employers do NOT charge application fees, security deposits, or uniform fees before hiring. NEVER transfer money to any individual or recruiter requesting payment for a job vacancy. Report suspicious recruiters immediately to THENIJOBS support.
              </p>
            </div>
          </section>

          {/* Section 25 & 26: Limitation of Liability & Indemnity */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">14</span>
              Limitation of Liability &amp; Indemnity
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              To the maximum extent permitted by Indian law, THENIJOBS shall not be liable for indirect, incidental, or consequential damages resulting from user-submitted content, employer conduct, candidate misrepresentations, or third-party service interruptions. Users agree to indemnify and hold harmless THENIJOBS against claims arising from violation of these Terms or applicable law.
            </p>
          </section>

          {/* Section 27 to 30: Contact & Jurisdiction */}
          <section className="space-y-3 pt-4 border-t-2 border-slate-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">15</span>
              Grievance Officer &amp; Official Contact
            </h2>
            <p className="text-xs text-gray-600">
              For support inquiries, terms clarification, or formal legal grievances:
            </p>

            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 mt-3">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white">THENI<span className="text-blue-400">JOBS</span></span>
                <span className="text-xs text-slate-400">Legal &amp; Compliance Office</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="space-y-1.5">
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="text-blue-400 shrink-0" />
                    <span>{SITE_CONTACT.fullAddress}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail size={14} className="text-blue-400 shrink-0" />
                    <a href={`mailto:${SITE_CONTACT.email}`} className="text-blue-300 hover:underline">{SITE_CONTACT.email}</a>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-emerald-400 shrink-0" />
                    <a href={`tel:${SITE_CONTACT.phone1.replace(/\s+/g, '')}`} className="text-white font-semibold hover:underline">{SITE_CONTACT.phone1}</a>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-emerald-400 shrink-0" />
                    <a href={`tel:${SITE_CONTACT.phone2.replace(/\s+/g, '')}`} className="text-white font-semibold hover:underline">{SITE_CONTACT.phone2}</a>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Governing Law */}
          <section className="space-y-2 pt-2 text-xs text-gray-500 border-t border-gray-100">
            <h3 className="font-bold text-gray-700 uppercase">Governing Law &amp; Jurisdiction</h3>
            <p>
              These Terms of Service are governed by the laws of India. Any legal dispute or proceeding arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the competent courts located in Theni District / Tamil Nadu, India.
            </p>
          </section>
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
