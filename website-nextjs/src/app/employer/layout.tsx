'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const targetPath = pathname.replace(/^\/employer/, '/business');
    router.replace(targetPath);
  }, [pathname, router]);

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center font-outfit">
      <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-400">Redirecting to Business Portal...</p>
    </div>
  );
}

