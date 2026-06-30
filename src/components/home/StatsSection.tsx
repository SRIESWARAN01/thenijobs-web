'use client';

import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, BellRing, BriefcaseBusiness, Building2, Store, Users } from 'lucide-react';
import { where } from 'firebase/firestore';
import { useRealtimeCount } from '@/hooks/useRealtimeStats';

function AnimatedNumber({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const currentCountRef = useRef(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let timer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        const start = currentCountRef.current;
        const duration = 900;
        const steps = 36;
        const increment = (target - start) / steps;
        let current = start;

        if (timer) window.clearInterval(timer);

        timer = window.setInterval(() => {
          current += increment;
          const done = increment >= 0 ? current >= target : current <= target;
          if (done) {
            setCount(target);
            currentCountRef.current = target;
            if (timer) window.clearInterval(timer);
          } else {
            const nextVal = Math.max(0, Math.floor(current));
            setCount(nextVal);
            currentCountRef.current = nextVal;
          }
        }, duration / steps);

        observer.disconnect();
      },
      { threshold: 0.25 },
    );

    if (!hasAnimated.current) {
      observer.observe(node);
    } else {
      const start = currentCountRef.current;
      const duration = 900;
      const steps = 36;
      const increment = (target - start) / steps;
      let current = start;

      if (timer) window.clearInterval(timer);

      timer = window.setInterval(() => {
        current += increment;
        const done = increment >= 0 ? current >= target : current <= target;
        if (done) {
          setCount(target);
          currentCountRef.current = target;
          if (timer) window.clearInterval(timer);
        } else {
          const nextVal = Math.max(0, Math.floor(current));
          setCount(nextVal);
          currentCountRef.current = nextVal;
        }
      }, duration / steps);
    }

    hasAnimated.current = true;

    return () => {
      observer.disconnect();
      if (timer) window.clearInterval(timer);
    };
  }, [target]);

  return <span ref={ref}>{count.toLocaleString('en-IN')}</span>;
}

export default function StatsSection() {
  const totalUsers = useRealtimeCount('users');
  const activeJobs = useRealtimeCount('jobs', [where('isActive', '==', true)]);
  const totalCompanies = useRealtimeCount('companies');
  const totalServiceProviders = useRealtimeCount('users', [where('role', '==', 'service_provider')]);
  const totalEmployers = useRealtimeCount('users', [where('role', '==', 'employer')]);
  const totalSeekers = useRealtimeCount('users', [where('role', '==', 'job_seeker')]);

  const stats = [
    {
      value: totalUsers.count,
      loading: totalUsers.loading,
      label: 'Registered Users',
      detail: 'Total user accounts',
      color: 'text-teal-400',
      icon: Users,
    },
    {
      value: activeJobs.count,
      loading: activeJobs.loading,
      label: 'Active Jobs',
      detail: 'Live vacancies',
      color: 'text-rose-400',
      icon: BellRing,
    },
    {
      value: totalCompanies.count,
      loading: totalCompanies.loading,
      label: 'Companies',
      detail: 'Company records',
      color: 'text-emerald-400',
      icon: Building2,
    },
    {
      value: totalServiceProviders.count,
      loading: totalServiceProviders.loading,
      label: 'Service Providers',
      detail: 'Service role accounts',
      color: 'text-amber-400',
      icon: Store,
    },
    {
      value: totalEmployers.count,
      loading: totalEmployers.loading,
      label: 'Employers',
      detail: 'Employer accounts',
      color: 'text-cyan-400',
      icon: BriefcaseBusiness,
    },
    {
      value: totalSeekers.count,
      loading: totalSeekers.loading,
      label: 'Job Seekers',
      detail: 'Candidate accounts',
      color: 'text-violet-400',
      icon: BadgeCheck,
    },
  ];

  return (
    <section className="px-4 py-8 sm:px-6 bg-[#0a0a1a]">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 shadow-xl sm:p-5 backdrop-blur-md hover:border-white/10 transition-all duration-300">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-300">
                  <Icon size={18} />
                </div>
                <div className={`font-outfit text-2xl font-black sm:text-3xl ${stat.color}`}>
                  {stat.loading ? '...' : <AnimatedNumber target={stat.value} />}
                </div>
                <div className="mt-1 text-sm font-bold text-white">{stat.label}</div>
                <div className="mt-0.5 text-xs text-slate-400">{stat.detail}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
