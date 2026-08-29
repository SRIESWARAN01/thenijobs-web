'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface EmployerLogo {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
}

function LogoSkeleton() {
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 animate-pulse flex-shrink-0" />
  );
}

export default function TrustedEmployersStrip() {
  const [employers, setEmployers] = useState<EmployerLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setLoading(false);
      setError(true);
    }, 8000);

    async function load() {
      try {
        const q = query(
          collection(db, 'companies'),
          where('verificationStatus', '==', 'verified'),
          where('isActive', '==', true),
          limit(8)
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        const logos: EmployerLogo[] = [];
        snap.docs.forEach((doc) => {
          const d = doc.data();
          const logoUrl = d.logoUrl || d.logo || '';
          // Only include companies that actually have a logo
          if (logoUrl && typeof logoUrl === 'string' && logoUrl.startsWith('http')) {
            logos.push({
              id: doc.id,
              slug: d.slug || doc.id,
              name: d.name || 'Company',
              logoUrl,
            });
          }
        });
        setEmployers(logos);
      } catch (err) {
        console.error('Failed to load employer logos:', err);
        if (!cancelled) setError(true);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  // Hide entire section if no logos available or error
  if (!loading && (employers.length < 3 || error)) return null;

  return (
    <section className="py-10" style={{ background: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-800 text-xs font-semibold mb-2">
            <BadgeCheck size={11} /> Featured Employers
          </div>
          <p className="text-sm text-gray-600 font-medium">
            Local companies using THENIJOBS to connect with talent
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-4 sm:gap-6 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <LogoSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
            {employers.map((emp) => (
              <Link
                key={emp.id}
                href={`/company/${emp.slug}`}
                className="group flex-shrink-0"
                title={emp.name}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-gray-200 p-2 flex items-center justify-center hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden">
                  <img
                    src={emp.logoUrl}
                    alt={`${emp.name} logo`}
                    className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                    loading="lazy"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/businesses"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All Companies <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
