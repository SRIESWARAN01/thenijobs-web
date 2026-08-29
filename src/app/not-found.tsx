import Link from 'next/link';
import type { Metadata } from 'next';
import Header from '@/components/navigation/Header';

export const metadata: Metadata = {
  title: 'Page Not Found | THENIJOBS',
  description:
    'The page you are looking for does not exist. Browse jobs, companies, and services on THENIJOBS.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        {/* Large 404 */}
        <p
          className="text-[120px] sm:text-[160px] font-black leading-none select-none"
          style={{
            background: 'linear-gradient(135deg, #BFDBFE 0%, #93C5FD 50%, #60A5FA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          404
        </p>

        <h1
          className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Page Not Found
        </h1>
        <p className="text-gray-500 text-sm sm:text-base max-w-md mb-8 leading-relaxed">
          Sorry, the page you are looking for does not exist or may have been moved.
          Try searching for jobs, companies, or services below.
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/jobs"
            className="px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-md hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
          >
            Browse Jobs
          </Link>
          <Link
            href="/businesses"
            className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            Explore Companies
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
