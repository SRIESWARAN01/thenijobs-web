'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function CompanyRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');

  useEffect(() => {
    if (slug) {
      router.replace(`/company/${encodeURIComponent(slug)}`);
    } else {
      router.replace('/businesses');
    }
  }, [slug, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a1a] text-white font-outfit">
      <Loader2 className="animate-spin text-violet-500 mb-4" size={36} />
      <p className="text-sm text-gray-400">Loading business profile...</p>
    </div>
  );
}

export default function CompanyRedirectPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a1a] text-white font-outfit">
        <Loader2 className="animate-spin text-violet-500 mb-4" size={36} />
        <p className="text-sm text-gray-400">Loading business profile...</p>
      </div>
    }>
      <CompanyRedirectHandler />
    </Suspense>
  );
}
