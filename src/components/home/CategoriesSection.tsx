import Link from 'next/link';
import {
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  HeartPulse,
  Landmark,
  Laptop,
  Package,
  Sprout,
  Store,
  Truck,
  Wrench,
} from 'lucide-react';

const categories = [
  { label: 'Agriculture', tamil: 'விவசாயம்', href: '/businesses/agriculture', count: 340, color: 'bg-emerald-50 text-emerald-700', icon: Sprout },
  { label: 'Construction', tamil: 'கட்டிடம்', href: '/businesses/construction', count: 210, color: 'bg-amber-50 text-amber-700', icon: Building2 },
  { label: 'IT & Software', tamil: 'IT', href: '/businesses/it-software', count: 185, color: 'bg-blue-50 text-blue-700', icon: Laptop },
  { label: 'Healthcare', tamil: 'மருத்துவம்', href: '/businesses/healthcare', count: 290, color: 'bg-rose-50 text-rose-700', icon: HeartPulse },
  { label: 'Education', tamil: 'கல்வி', href: '/businesses/education', count: 175, color: 'bg-cyan-50 text-cyan-700', icon: GraduationCap },
  { label: 'Textiles', tamil: 'Textiles', href: '/businesses/textiles', count: 260, color: 'bg-fuchsia-50 text-fuchsia-700', icon: Package },
  { label: 'Manufacturing', tamil: 'தொழிற்சாலை', href: '/businesses/manufacturing', count: 310, color: 'bg-orange-50 text-orange-700', icon: Wrench },
  { label: 'Retail', tamil: 'கடை', href: '/businesses/retail', count: 145, color: 'bg-lime-50 text-lime-700', icon: Store },
  { label: 'Transport', tamil: 'Transport', href: '/businesses/transport', count: 190, color: 'bg-sky-50 text-sky-700', icon: Truck },
  { label: 'Finance', tamil: 'Finance', href: '/businesses/finance', count: 120, color: 'bg-yellow-50 text-yellow-700', icon: Landmark },
  { label: 'Services', tamil: 'சேவைகள்', href: '/services', count: 430, color: 'bg-slate-100 text-slate-700', icon: BriefcaseBusiness },
];

export default function CategoriesSection() {
  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-teal-700">Browse Categories</p>
            <h2 className="mt-1 font-outfit text-2xl font-black text-slate-950 sm:text-3xl">
              Jobs + Businesses by industry
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500">
            Theni local market-க்கு முக்கியமான categories. Mobile-ல் swipe இல்லாமல் scan பண்ண easy.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.label}
                href={cat.href}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/40"
              >
                <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${cat.color}`}>
                  <Icon size={21} />
                </span>
                <span className="block text-sm font-black text-slate-950">{cat.label}</span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-500">{cat.tamil}</span>
                <span className="mt-3 block text-xs font-black text-teal-700">{cat.count} listings</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
