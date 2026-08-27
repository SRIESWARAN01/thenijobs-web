import Link from 'next/link';
import { ShieldCheck, MapPin, MousePointerClick, Sparkles, UserCircle, Smartphone } from 'lucide-react';

const whyItems = [
  {
    icon: ShieldCheck,
    title: 'Verified Employers',
    desc: 'We review employer and business information before publishing eligible job listings.',
    bg: '#ECFDF5',
    border: '#D1FAE5',
    iconColor: '#059669',
  },
  {
    icon: MapPin,
    title: 'Local Opportunities',
    desc: 'Find jobs closer to Theni, Cumbum, Periyakulam, Bodinayakanur and nearby areas.',
    bg: '#EFF6FF',
    border: '#DBEAFE',
    iconColor: '#2563EB',
  },
  {
    icon: MousePointerClick,
    title: 'Direct Apply',
    desc: 'Apply directly through the platform or available employer contact channels.',
    bg: '#FFFBEB',
    border: '#FDE68A',
    iconColor: '#D97706',
  },
  {
    icon: Sparkles,
    title: 'Smart Job Discovery',
    desc: 'Find opportunities based on your skills, category and location.',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    iconColor: '#7C3AED',
  },
  {
    icon: UserCircle,
    title: 'Free Job Seeker Profile',
    desc: 'Create your professional profile and make it easier for employers to discover you.',
    bg: '#FFF1F2',
    border: '#FECDD3',
    iconColor: '#E11D48',
  },
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    desc: 'Search and apply easily from your phone, anywhere, anytime.',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    iconColor: '#0284C7',
  },
];

export default function WhySection() {
  return (
    <section className="py-14" style={{ background: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-800 text-xs font-semibold mb-3">
            🏆 Why Choose Us
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold text-gray-900"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Why Choose THENIJOBS?
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Built for Theni. Built for local opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {whyItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl p-6 border-2 transition-all hover:shadow-md"
                style={{ background: item.bg, borderColor: item.border }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${item.iconColor}15` }}
                >
                  <Icon size={22} style={{ color: item.iconColor }} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Report suspicious job link */}
        <div className="mt-8 text-center">
          <Link
            href="/contact?type=report"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors"
          >
            🚩 See something suspicious? Report a job →
          </Link>
        </div>
      </div>
    </section>
  );
}
