import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function JobSeekerEmployerCTA() {
  return (
    <section className="py-14" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Job Seeker CTA */}
          <div
            className="rounded-3xl p-8 text-white relative overflow-hidden shadow-md"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 60%, #064E3B 100%)' }}
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 bg-white"
              style={{ transform: 'translate(30%, -30%)' }}
            />
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-2">
              For Job Seekers
            </p>
            <h3
              className="text-2xl font-bold mb-2 text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Looking for a Job?
            </h3>
            <p className="text-sm text-emerald-100/90 mb-5 leading-relaxed">
              Create your free profile, upload your resume, and discover verified local opportunities across Theni and surrounding areas.
            </p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-emerald-800 hover:bg-emerald-50 transition-all shadow-sm"
            >
              Find Jobs <ArrowRight size={15} />
            </Link>
          </div>

          {/* Employer CTA */}
          <div
            className="rounded-3xl p-8 text-white relative overflow-hidden shadow-md"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #1E3A8A 100%)' }}
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 bg-white"
              style={{ transform: 'translate(30%, -30%)' }}
            />
            <p className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-2">
              For Employers &amp; Businesses
            </p>
            <h3
              className="text-2xl font-bold mb-2 text-white"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Looking for Talent?
            </h3>
            <p className="text-sm text-blue-100/90 mb-5 leading-relaxed">
              Post your job openings, connect with local candidates, and hire verified talent across Theni &amp; Tamil Nadu.
            </p>
            <Link
              href="/employer/post-job"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-blue-800 hover:bg-blue-50 transition-all shadow-sm"
            >
              Post a Job <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
