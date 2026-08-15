import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Phone, Mail, MapPin, MessageCircle, Clock, 
  Building2, Briefcase, HelpCircle, ArrowRight, ShieldCheck 
} from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import FloatingWhatsApp from '@/components/ui/FloatingWhatsApp';
import { SITE_CONTACT } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact Us | THENIJOBS — Customer Support & Business Enquiries',
  description: 'Get in touch with THENIJOBS team for job postings, recruitment assistance, and business directory support in Theni. Call +91 93605 19460 or +91 70948 26886.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-24" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />

      {/* Hero Header */}
      <div className="pt-24 pb-14 px-4 text-center bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-3xl mx-auto space-y-3.5">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 text-xs font-bold border border-white/20">
            <HelpCircle size={14} className="text-amber-300" /> We&apos;re Here to Help You
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Contact Official Support
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Reach out to THENIJOBS for job applications, employer hiring accounts, company listings, and customer support.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-8">
        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Card 1: Primary Support & Candidate Help */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md flex flex-col justify-between hover:shadow-lg transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
                <Phone size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Candidate &amp; Job Support</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  General Support &amp; Jobs
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  For job seekers, profile assistance, application tracking, and verification help.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={`tel:${SITE_CONTACT.phone1Raw}`}
                  className="inline-flex items-center gap-2 text-2xl font-extrabold text-blue-600 hover:text-blue-700 tracking-tight"
                >
                  <Phone size={20} className="shrink-0" />
                  <span>{SITE_CONTACT.phone1}</span>
                </a>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-500" /> Mon – Sat: 9:00 AM – 7:00 PM
              </span>
              <a
                href={`tel:${SITE_CONTACT.phone1Raw}`}
                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors"
              >
                Call Now
              </a>
            </div>
          </div>

          {/* Card 2: Business & Employer Enquiries */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md flex flex-col justify-between hover:shadow-lg transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                <Building2 size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Employers &amp; Companies</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Employer &amp; Business Enquiries
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  For job postings, annual subscription plans, digital ID cards, and business listings.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={`tel:${SITE_CONTACT.phone2Raw}`}
                  className="inline-flex items-center gap-2 text-2xl font-extrabold text-emerald-600 hover:text-emerald-700 tracking-tight"
                >
                  <Phone size={20} className="shrink-0" />
                  <span>{SITE_CONTACT.phone2}</span>
                </a>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-500" /> Mon – Sat: 9:00 AM – 7:00 PM
              </span>
              <a
                href={`tel:${SITE_CONTACT.phone2Raw}`}
                className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>

        {/* Additional Contact Channels */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* WhatsApp Direct */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900">WhatsApp Chat</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Quick replies on mobile</p>
              <a
                href={SITE_CONTACT.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-600 hover:underline mt-1.5 inline-flex items-center gap-1"
              >
                Chat on WhatsApp <ArrowRight size={11} />
              </a>
            </div>
          </div>

          {/* Email Support */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Mail size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900">Official Email</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Written enquiries &amp; billing</p>
              <a
                href={`mailto:${SITE_CONTACT.email}`}
                className="text-xs font-bold text-blue-600 hover:underline mt-1.5 block truncate"
              >
                {SITE_CONTACT.email}
              </a>
            </div>
          </div>

          {/* Office Address */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <MapPin size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900">Office Location</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                {SITE_CONTACT.addressLine1}, {SITE_CONTACT.addressLine2}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links Banner */}
        <div className="mt-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Verified Local Platform</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Are you an employer in Theni District?
            </h3>
            <p className="text-xs text-slate-300 max-w-md">
              Create an employer profile to post jobs, search qualified candidates, and promote your business.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/employer/post-job"
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-colors shadow-sm"
            >
              Post a Job
            </Link>
            <Link
              href="/pricing"
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-xs text-white transition-colors border border-white/20"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>

      <BottomNav />
      <FloatingWhatsApp />
    </div>
  );
}
