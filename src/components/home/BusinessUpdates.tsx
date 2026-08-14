import Link from 'next/link';
import { ArrowRight, Briefcase, Building2, Clock, Megaphone, PackagePlus, TrendingUp } from 'lucide-react';

const updates = [
  {
    id: '1',
    type: 'Job',
    title: 'Tractor Driver needed urgently',
    company: 'Arasu Pandi Farm Services',
    time: '2 hours ago',
    href: '/jobs/1',
    icon: Briefcase,
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    id: '2',
    type: 'Business',
    title: 'Digital Theni Solutions joined THENIJOBS',
    company: 'IT & Software',
    time: '5 hours ago',
    href: '/company/digital-theni-solutions',
    icon: Building2,
    tone: 'bg-blue-50 text-blue-700',
  },
  {
    id: '3',
    type: 'Service',
    title: 'Farm equipment rental service added',
    company: 'GreenField Agro',
    time: '1 day ago',
    href: '/businesses/agriculture',
    icon: PackagePlus,
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    id: '4',
    type: 'Announcement',
    title: 'SBOA School hiring teachers this week',
    company: 'Education',
    time: '1 day ago',
    href: '/jobs?category=Education',
    icon: Megaphone,
    tone: 'bg-rose-50 text-rose-700',
  },
];

export default function BusinessUpdates() {
  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <TrendingUp size={18} />
                </span>
                <p className="text-xs font-black uppercase text-teal-700">Business Feed</p>
              </div>
              <h2 className="font-outfit text-2xl font-black text-slate-950 sm:text-3xl">
                Latest company updates
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                New jobs, products, services and business announcements in one feed.
              </p>
            </div>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-50"
            >
              View feed <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {updates.map((update) => {
              const Icon = update.icon;
              return (
                <Link
                  key={update.id}
                  href={update.href}
                  className="group flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-teal-200 hover:bg-teal-50/50"
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${update.tone}`}>
                    <Icon size={21} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="mb-1 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-200">
                      {update.type}
                    </span>
                    <span className="block line-clamp-1 text-sm font-black text-slate-950 group-hover:text-teal-800">
                      {update.title}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500">
                      <span>{update.company}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {update.time}
                      </span>
                    </span>
                  </span>
                  <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300 group-hover:text-teal-700" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
