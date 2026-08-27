import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-3xl px-6 py-14 sm:px-12 text-center text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #1E3A8A 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-40 h-40 rounded-full opacity-10 bg-white" style={{ transform: 'translate(-30%, -30%)' }} />
          <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full opacity-10 bg-white" style={{ transform: 'translate(30%, 30%)' }} />

          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 relative z-10"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Your Next Opportunity Starts Here
          </h2>
          <p className="text-sm sm:text-base text-blue-100 mb-8 max-w-xl mx-auto relative z-10 leading-relaxed">
            Whether you&apos;re looking for your dream job or searching for the right candidate, THENIJOBS connects you with local opportunities.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold bg-white text-blue-700 hover:bg-blue-50 transition-all shadow-md"
            >
              Find Jobs <ArrowRight size={16} />
            </Link>
            <Link
              href="/employer/post-job"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold border-2 border-white/40 text-white hover:bg-white/10 transition-all"
            >
              Post a Job <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
