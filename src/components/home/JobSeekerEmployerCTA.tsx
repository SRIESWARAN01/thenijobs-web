import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function JobSeekerEmployerCTA() {
  return (
    <section className="py-14" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Job Seeker CTA */}
          <div
            className="rounded-3xl p-8 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 bg-white"
              style={{ transform: 'translate(30%, -30%)' }}
            />
            <p className="text-xs font-bold uppercase tracking-wider opacity-75 mb-2">
              For Job Seekers
            </p>
            <h3
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Looking for a Job?
            </h3>
            <p className="text-sm opacity-80 mb-5 leading-relaxed">
              Create your profile and discover verified local opportunities across Theni and surrounding areas.
            </p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-blue-600 hover:bg-blue-50 transition-all"
            >
              Find Jobs <ArrowRight size={15} />
            </Link>
          </div>

          {/* Employer CTA */}
          <div
            className="rounded-3xl p-8 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 bg-white"
              style={{ transform: 'translate(30%, -30%)' }}
            />
            <p className="text-xs font-bold uppercase tracking-wider opacity-75 mb-2">
              For Employers
            </p>
            <h3
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Looking for Talent?
            </h3>
            <p className="text-sm opacity-80 mb-5 leading-relaxed">
              Post your vacancy and connect with local candidates across Theni &amp; Tamil Nadu.
            </p>
            <Link
              href="/employer/post-job"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-emerald-600 hover:bg-emerald-50 transition-all"
            >
              Post a Job <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
