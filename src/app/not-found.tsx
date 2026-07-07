import Link from 'next/link';
import { Search, ArrowLeft, Briefcase, Building2 } from 'lucide-react';

/**
 * Global 404 page — automatically returns HTTP 404 status and injects
 * <meta name="robots" content="noindex"> for search engines.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070714] px-6 text-center text-white">
      <div className="max-w-lg w-full">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-[120px] sm:text-[160px] font-black leading-none tracking-tighter bg-gradient-to-b from-white/20 to-transparent bg-clip-text text-transparent select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-600/30 animate-bounce">
              <Search size={28} className="text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md shadow-2xl">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Page not found
          </h1>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist, has been moved, or is no longer available.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 text-sm font-bold text-white hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20 active:scale-95"
            >
              <ArrowLeft size={16} />
              Go Home
            </Link>
            <Link
              href="/jobs"
              className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-medium text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <Briefcase size={16} />
              Browse Jobs
            </Link>
            <Link
              href="/businesses"
              className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-medium text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <Building2 size={16} />
              Businesses
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
