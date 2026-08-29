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
  logoUrl?: string;
  initials: string;
}

const INITIAL_EMPLOYERS: EmployerLogo[] = [
  { id: '1', slug: 'digital-theni-solutions', name: 'Digital Theni Solutions', initials: 'DT' },
  { id: '2', slug: 'am-siddha-hospital-cumbum', name: 'AM Siddha Hospital', initials: 'AM' },
  { id: '3', slug: 'velammal-matriculation-higher-secondary-school-theni-theni', name: 'Velammal School', initials: 'VM' },
  { id: '4', slug: 'classic-honda-periyakulam', name: 'Classic Honda', initials: 'CH' },
  { id: '5', slug: 'kudil-construction-cumbum', name: 'Kudil Construction', initials: 'KC' },
  { id: '6', slug: 'coral-moto-hub-royal-enfield-theni', name: 'Coral Moto Hub', initials: 'CM' },
];

export default function TrustedEmployersStrip() {
  const [employers, setEmployers] = useState<EmployerLogo[]>(INITIAL_EMPLOYERS);

  useEffect(() => {
    let cancelled = false;
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
          logos.push({
            id: doc.id,
            slug: d.slug || doc.id,
            name: d.name || 'Company',
            logoUrl: (logoUrl && typeof logoUrl === 'string' && logoUrl.startsWith('http')) ? logoUrl : undefined,
            initials: d.name ? d.name.substring(0, 2).toUpperCase() : 'CO',
          });
        });
        if (logos.length >= 3) {
          setEmployers(logos);
        }
      } catch (err) {
        // Silently retain pre-seeded verified employers
      }
    }
    load();

    return () => { cancelled = true; };
  }, []);

  return (
    <section className="py-10" style={{ background: '#FFFFFF' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-800 text-xs font-semibold mb-2">
            <BadgeCheck size={11} /> Featured Employers
          </div>
          <p className="text-sm text-gray-600 font-medium">
            Local companies using THENIJOBS to connect with talent
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
          {employers.map((emp) => (
            <Link
              key={emp.id}
              href={`/company/${emp.slug}`}
              className="group flex-shrink-0"
              title={emp.name}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-gray-200 p-2 flex items-center justify-center hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden">
                {emp.logoUrl ? (
                  <img
                    src={emp.logoUrl}
                    alt={`${emp.name} logo`}
                    className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                    loading="lazy"
                  />
                ) : (
                  <span className="font-extrabold text-sm sm:text-base text-slate-700 group-hover:text-blue-600 transition-colors">
                    {emp.initials}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

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
