import Link from 'next/link';
import { Briefcase, ArrowLeft, Search } from 'lucide-react';

/**
 * Job-specific 404 page — shown when a job ID doesn't exist or the listing is
 * suspended/deleted. Automatically returns HTTP 404 status and noindex meta.
 */
export default function JobNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070714] px-6 text-center text-white">
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 max-w-md backdrop-blur-md shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-5 animate-bounce">
          <Briefcase size={26} />
        </div>

        <h1 className="text-xl font-bold tracking-tight">
          Job listing not available
        </h1>
        <p className="mt-2 text-sm text-gray-400 leading-relaxed">
          This job posting may have been filled, expired, suspended, or removed by the employer.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/jobs"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 text-xs font-bold text-white hover:bg-violet-700 transition-all shadow-md active:scale-95"
          >
            <Search size={14} />
            Browse All Jobs
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 text-xs font-medium text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <ArrowLeft size={14} />
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
