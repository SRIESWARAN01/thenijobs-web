'use client';

import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, BellRing, Building2, Smartphone } from 'lucide-react';
import { useRealtimeCount } from '@/hooks/useRealtimeStats';
import { where } from 'firebase/firestore';

function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 900;
          const steps = 36;
          const increment = target / steps;
          let current = 0;
          const timer = window.setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              window.clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.25 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>;
}

export default function StatsSection() {
  const { count: activeJobs } = useRealtimeCount('jobs', [where('status', '==', 'active')]);
  const { count: totalCompanies } = useRealtimeCount('companies', [where('verificationStatus', '==', 'verified')]);
  const totalSeekers = 24;
  const { count: verifiedCompanies } = useRealtimeCount('companies', [where('verificationStatus', '==', 'verified')]);

  const stats = [
    { value: activeJobs, suffix: '+', label: 'Active Jobs', tamil: 'தற்போதைய வேலைகள்', color: 'text-teal-700', icon: BellRing },
    { value: totalCompanies, suffix: '+', label: 'Companies', tamil: 'நிறுவனங்கள்', color: 'text-blue-700', icon: Building2 },
    { value: totalSeekers, suffix: '/7', label: 'Apply anytime', tamil: 'mobile-friendly applications', color: 'text-emerald-700', icon: Smartphone },
    { value: verifiedCompanies, suffix: '+', label: 'Verified Pages', tamil: 'verified business pages', color: 'text-amber-700', icon: BadgeCheck },
  ];

  return (
    <section className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
                  <Icon size={20} />
                </div>
                <div className={`font-outfit text-2xl font-black sm:text-3xl ${stat.color}`}>
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-1 text-sm font-black text-slate-900">{stat.label}</div>
                <div className="mt-0.5 text-xs font-semibold text-slate-500">{stat.tamil}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
