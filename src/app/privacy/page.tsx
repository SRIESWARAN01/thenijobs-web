import type { Metadata } from 'next';
import Header from '@/components/navigation/Header';
import HomeFooter from '@/components/home/HomeFooter';
import { ShieldCheck, Phone, Mail, MapPin, Calendar, Clock, Lock, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { SITE_CONTACT } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy | THENIJOBS — Data Protection & Privacy Practices',
  description: 'THENIJOBS Privacy Policy explaining how we collect, use, store, and protect digital personal data under the DPDP Act 2023 & DPDP Rules 2025.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-outfit">
      <Header />

      {/* Hero Header */}
      <section className="pt-24 pb-12 px-4 sm:px-6 bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950 text-white">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} /> Legal &amp; Data Protection
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Privacy Policy
          </h1>
          <div className="flex items-center justify-center gap-4 text-xs text-blue-200/80 flex-wrap">
            <span className="flex items-center gap-1.5"><Calendar size={13} /> Last Updated: 15 August 2026</span>
            <span>•</span>
            <span className="flex items-center gap-1.5"><Lock size={13} /> DPDP Act 2023 &amp; DPDP Rules 2025 Framework</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm space-y-8 text-sm text-gray-700 leading-relaxed">
          
          {/* Preamble */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-950 space-y-2">
            <p className="font-semibold">
              <strong>THENIJOBS</strong> (&quot;THENIJOBS&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the THENIJOBS website, mobile web applications, and related employment and local marketplace services (collectively, the &quot;Platform&quot;).
            </p>
            <p>
              THENIJOBS is a local employment and business platform that connects job seekers, employers, companies, and employment opportunities across Theni District and Tamil Nadu.
            </p>
            <p>
              This Privacy Policy explains what information we collect, why we collect it, how we use it, how we protect it, and the choices and rights available to you. By using THENIJOBS, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">1</span>
              Information We Collect
            </h2>
            <p>Depending on how you interact with THENIJOBS, we may collect the following categories of information:</p>

            <div className="space-y-4 pl-2">
              <div>
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-blue-800 mb-1">1.1 Account Information</h3>
                <p className="text-xs text-gray-600 mb-1">For account creation, login, and authentication:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-gray-600">
                  <li>Full Name</li>
                  <li>Mobile Number (for SMS &amp; Call OTP verification)</li>
                  <li>Email Address</li>
                  <li>Login &amp; authentication credentials</li>
                  <li>User type or role (Job Seeker, Employer, Business Owner, Admin)</li>
                  <li>Account identifiers and timestamps</li>
                  <li>Profile photo where voluntarily uploaded</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-blue-800 mb-1">1.2 Job Seeker Profile Information</h3>
                <p className="text-xs text-gray-600 mb-1">If you create a candidate profile or digital ID:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-gray-600">
                  <li>Full Name, Contact Information, Address &amp; District</li>
                  <li>Career preferences, qualification, education history &amp; passing year</li>
                  <li>Technical &amp; interpersonal skills, work experience, roles &amp; durations</li>
                  <li>Uploaded Resumes (PDF / DOCX) and AI-generated resume contents</li>
                  <li>Certifications, awards, languages known, and employment preferences</li>
                  <li>Profile photo and portfolio links voluntarily provided</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-blue-800 mb-1">1.3 Job Applications</h3>
                <p className="text-xs text-gray-600 mb-1">When you apply for a job vacancy:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-gray-600">
                  <li>Applicant name, contact number, and email</li>
                  <li>Applied job title, company ID, and application timestamp</li>
                  <li>Selected resume, cover letter note, and applicant qualifications</li>
                  <li>Application status updates and employer recruitment communications</li>
                </ul>
                <p className="text-xs text-gray-500 italic mt-1">Application information is shared directly with the relevant employer for recruitment purposes.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-blue-800 mb-1">1.4 Employer &amp; Company Information</h3>
                <p className="text-xs text-gray-600 mb-1">If you register as an employer or company owner:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-gray-600">
                  <li>Authorized contact person name, mobile number, and official email</li>
                  <li>Company name, registered address, business district, and GST/business details where provided</li>
                  <li>Company description, tagline, logo, cover banner, and website URL</li>
                  <li>Job postings, salary specifications, criteria, and vacancies</li>
                  <li>Products &amp; services catalogue items, pricing, photos, and descriptions</li>
                  <li>Verification documents, subscription plan, and payment reference IDs</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-blue-800 mb-1">1.5 Payment Information</h3>
                <p className="text-xs text-gray-600">
                  For paid subscription plans (Standard, Premium, Enterprise), digital visiting cards, and featured listings, payments are processed directly through certified PCI-DSS compliant third-party payment gateways (e.g. <strong>Razorpay</strong>).
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  THENIJOBS receives transaction metadata such as: Order ID, Payment ID, Transaction Reference, Amount, Plan Name, Date, and Payment Status (captured/failed).
                </p>
                <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 mt-1">
                  🔒 We DO NOT store credit/debit card numbers, CVV codes, UPI PINs, Netbanking passwords, or banking credentials on THENIJOBS servers. All sensitive financial credentials are handled strictly by the RBI-authorized payment aggregator.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-blue-800 mb-1">1.6 Device and Technical Information</h3>
                <p className="text-xs text-gray-600 mb-1">Technical telemetry automatically received during Platform access:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-gray-600">
                  <li>IP address and approximate geographic location (city/district level)</li>
                  <li>Browser type, operating system, and device type (mobile / desktop)</li>
                  <li>Access timestamps, pages viewed, referrers, and system performance metrics</li>
                  <li>Security logs, error stack traces, and diagnostics for platform reliability</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-blue-800 mb-1">1.7 Communications &amp; Customer Support</h3>
                <p className="text-xs text-gray-600">
                  When you contact our support desk via Phone, WhatsApp, or Email, we retain your contact details, message contents, and query resolution history to provide assistance and maintain operational records.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">2</span>
              How We Use Information
            </h2>
            <p>We process personal data strictly for lawful, legitimate employment and platform operational purposes:</p>
            <ul className="grid sm:grid-cols-2 gap-2 text-xs text-gray-600">
              <li className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>Create, authenticate, and manage user accounts securely.</span>
              </li>
              <li className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>Deliver SMS and Call OTP verification codes.</span>
              </li>
              <li className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>Connect job candidates with verified local employers in Theni.</span>
              </li>
              <li className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>Process job applications and resume evaluations.</span>
              </li>
              <li className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>Publish verified company profiles, jobs, products &amp; services.</span>
              </li>
              <li className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>Process Razorpay subscription payments and activate features.</span>
              </li>
              <li className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>Prevent fraud, spam, fake job listings, and unauthorized access.</span>
              </li>
              <li className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>Comply with Indian statutory legal and regulatory obligations.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">3</span>
              Job Seeker Information &amp; Employer Access
            </h2>
            <p>
              THENIJOBS is an employment facilitation platform. When you apply for a job, information necessary for recruitment (such as your Name, Contact details, Qualifications, Experience, and Resume) is made accessible to the prospective employer.
            </p>
            <p>
              Employers are independently responsible for how they use candidate information after receiving it through the Platform. Job seekers should avoid uploading sensitive personal identifiers that are not required for employment.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">4</span>
              Company &amp; Job Listing Information
            </h2>
            <p>
              Information intentionally submitted for public company profiles, products/services directory, or job vacancy listings will be published on the Platform for public discovery.
            </p>
            <p>
              Users must ensure that submitted materials DO NOT contain passwords, OTPs, bank credentials, confidential proprietary data, or copyrighted assets belonging to another party without authorization.
            </p>
          </section>

          {/* Section 5 & 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">5</span>
              Service Providers, Firebase &amp; Cloud Infrastructure
            </h2>
            <p>
              We utilize trusted enterprise service providers to operate THENIJOBS. These include:
            </p>
            <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 pl-2">
              <li><strong>Google Firebase / Google Cloud:</strong> Authentication, Firestore database, cloud storage, notifications, and application hosting.</li>
              <li><strong>Razorpay:</strong> PCI-DSS certified payment gateway aggregator.</li>
              <li><strong>SMS &amp; Telephony Providers:</strong> Transactional SMS and Voice Call OTP delivery.</li>
              <li><strong>Google Gemini / AI Services:</strong> Resume optimization and job description enhancement.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">6</span>
              Cookies and Storage Technologies
            </h2>
            <p>
              THENIJOBS uses essential cookies, local storage, and session tokens to keep you logged in, save your search preferences, prevent cross-site request forgery, and optimize system speed. You can manage or disable cookies via your browser settings, though some interactive features may require session storage to function.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">7</span>
              Data Sharing &amp; Non-Sale of Data
            </h2>
            <p className="font-semibold text-gray-900">
              🚫 We DO NOT sell, rent, trade, or commercially broker personal information to third-party marketing companies.
            </p>
            <p>Personal data is disclosed only:</p>
            <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 pl-2">
              <li>To employers when you submit a job application.</li>
              <li>To payment processors to complete a transaction initiated by you.</li>
              <li>When strictly required by applicable Indian law, court order, or lawful government authority.</li>
              <li>To investigate security breaches, fraud, or violation of our Terms of Service.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">8</span>
              Data Security Measures
            </h2>
            <p>We deploy robust technical and organizational security controls including:</p>
            <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 pl-2">
              <li>256-bit SSL/TLS encryption for all data in transit across web and mobile.</li>
              <li>Role-based access control (RBAC) and Firebase security rules restricting access to authorized users.</li>
              <li>Automated system monitoring, logging, and error tracking.</li>
              <li>Encrypted authentication tokens and zero plaintext password storage.</li>
            </ul>
          </section>

          {/* Section 10 & 11 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">9</span>
              Data Retention, Rights &amp; DPDP Act 2023 Compliance
            </h2>
            <p>
              In accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act 2023)</strong> and the <strong>DPDP Rules, 2025</strong>, you have specific rights regarding your digital personal data:
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5 text-xs text-gray-700">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <strong>Right to Access &amp; Summary:</strong> View and retrieve details of your personal data processed on THENIJOBS.
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <strong>Right to Correction:</strong> Update, correct, or complete inaccurate information anytime via your Profile.
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <strong>Right to Erasure / Deletion:</strong> Request deletion of your account and personal profile data.
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <strong>Right of Grievance Redressal:</strong> Register grievances with our designated Data Grievance Officer.
              </div>
            </div>
          </section>

          {/* Section 12 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">10</span>
              Account Deletion Process
            </h2>
            <p>
              Users may request complete account deletion by visiting their Settings tab or emailing <a href="mailto:info@thenijobs.com" className="text-blue-700 font-bold hover:underline">info@thenijobs.com</a> with their registered mobile number/email.
            </p>
            <p className="text-xs text-gray-500">
              Upon identity verification, your profile, resumes, and personal records will be permanently erased or anonymized, except where statutory financial retention (such as tax invoices/payment receipts) is required by law.
            </p>
          </section>

          {/* Section 13 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">11</span>
              Children&apos;s Privacy &amp; Age of Eligibility
            </h2>
            <p>
              THENIJOBS is intended for individuals of legal employment age under applicable Indian labor and apprenticeship laws. We do not knowingly collect personal information from individuals below 18 years of age without parental/guardian guidance.
            </p>
          </section>

          {/* Section 14 & 15 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">12</span>
              Employer Code of Conduct
            </h2>
            <p>Employers who access candidate information through THENIJOBS agree to:</p>
            <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 pl-2">
              <li>Use candidate data solely for legitimate recruitment and employment assessment.</li>
              <li>Never sell, broker, or publicly redistribute applicant resumes.</li>
              <li>Never request bank account PINs, OTPs, or illegal fees from candidates.</li>
            </ul>
          </section>

          {/* Section 16 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">13</span>
              Changes to This Privacy Policy
            </h2>
            <p>
              We may update this policy periodically to reflect operational, legal, or regulatory updates. The &quot;Last Updated&quot; date at the top of this document indicates the effective date of the latest revisions.
            </p>
          </section>

          {/* Section 17: Official Contact & Grievance Officer */}
          <section className="space-y-3 pt-4 border-t-2 border-slate-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">14</span>
              Grievance Redressal &amp; Official Contact
            </h2>
            <p className="text-xs text-gray-600">
              For privacy inquiries, data deletion requests, or formal grievance redressal under the DPDP Act 2023 &amp; Information Technology Act, 2000:
            </p>

            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 mt-3">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white">THENI<span className="text-blue-400">JOBS</span></span>
                <span className="text-xs text-slate-400">Data Protection &amp; Grievance Office</span>
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

          {/* Section 18: Governing Law */}
          <section className="space-y-2 pt-2 text-xs text-gray-500 border-t border-gray-100">
            <h3 className="font-bold text-gray-700 uppercase">18. Governing Framework &amp; Jurisdiction</h3>
            <p>
              This Privacy Policy is governed by the laws of India, including the Information Technology Act, 2000, the Digital Personal Data Protection Act, 2023, and the Digital Personal Data Protection Rules, 2025. Any disputes shall be subject to the exclusive jurisdiction of the competent courts in Theni District / Tamil Nadu, India.
            </p>
          </section>
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
