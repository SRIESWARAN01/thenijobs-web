'use client';

import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, BellRing, BriefcaseBusiness, Building2, Store, Users, ShieldCheck, Heart } from 'lucide-react';
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
  const totalEmployees = useRealtimeCount('users', [where('role', '==', 'job_seeker')]);
  const totalCompanies = useRealtimeCount('companies');
  const totalActiveCustomers = useRealtimeCount('companies', [where('isActive', '==', true)]);
  const totalActiveJobs = useRealtimeCount('jobs', [where('isActive', '==', true)]);
  const totalVerifiedCompanies = useRealtimeCount('companies', [where('verificationStatus', '==', 'verified')]);
  const totalVerifiedLocalBusinesses = useRealtimeCount('companies', [
    where('verificationStatus', '==', 'verified'),
    where('category', '!=', 'IT & Software')
  ]);
  const totalApprovedServices = useRealtimeCount('services', [where('status', '==', 'active')]);

  const stats = [
    {
      value: totalUsers.count,
      loading: totalUsers.loading,
      label: 'Registered Users',
      detail: 'Total active accounts',
      color: 'text-teal-400',
      icon: Users,
    },
    {
      value: totalEmployees.count,
      loading: totalEmployees.loading,
      label: 'Registered Employees',
      detail: 'Job seekers on platform',
      color: 'text-violet-400',
      icon: BadgeCheck,
    },
    {
      value: totalCompanies.count,
      loading: totalCompanies.loading,
      label: 'Registered Companies',
      detail: 'Corporate profiles',
      color: 'text-emerald-400',
      icon: Building2,
    },
    {
      value: totalActiveCustomers.count,
      loading: totalActiveCustomers.loading,
      label: 'Active Customers',
      detail: 'Active business listings',
      color: 'text-cyan-400',
      icon: Heart,
    },
    {
      value: totalActiveJobs.count,
      loading: totalActiveJobs.loading,
      label: 'Active Job Posts',
      detail: 'Live career vacancies',
      color: 'text-rose-400',
      icon: BellRing,
    },
    {
      value: totalVerifiedCompanies.count,
      loading: totalVerifiedCompanies.loading,
      label: 'Verified Companies',
      detail: 'Gold & Silver badges',
      color: 'text-amber-400',
      icon: ShieldCheck,
    },
    {
      value: totalVerifiedLocalBusinesses.count,
      loading: totalVerifiedLocalBusinesses.loading,
      label: 'Verified Local Businesses',
      detail: 'Trusted local listings',
      color: 'text-indigo-400',
      icon: Store,
    },
    {
      value: totalApprovedServices.count,
      loading: totalApprovedServices.loading,
      label: 'Approved Services',
      detail: 'Technicians & providers',
      color: 'text-pink-400',
      icon: BriefcaseBusiness,
    },
  ];

  return (
    <section className="px-4 py-8 sm:px-6 bg-[#0a0a1a]">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
                <div className="mt-1 text-sm font-bold text-white leading-tight">{stat.label}</div>
                <div className="mt-0.5 text-xs text-slate-400">{stat.detail}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
