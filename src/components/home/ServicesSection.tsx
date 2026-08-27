import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const services = [
  { label: 'Electrician', icon: '⚡', href: '/services?category=Electrician' },
  { label: 'Plumber', icon: '🔧', href: '/services?category=Plumber' },
  { label: 'AC Technician', icon: '❄️', href: '/services?category=AC+Technician' },
  { label: 'Digital Marketing', icon: '📣', href: '/services?category=Digital+Marketing' },
  { label: 'Web Development', icon: '💻', href: '/services?category=Web+Development' },
  { label: 'Graphic Design', icon: '🎨', href: '/services?category=Graphic+Design' },
  { label: 'Mobile Repair', icon: '📱', href: '/services?category=Mobile+Repair' },
  { label: 'Photography', icon: '📷', href: '/services?category=Photography' },
];

export default function ServicesSection() {
  return (
    <section className="py-14" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-amber-800 text-xs font-semibold mb-3">
            🏢 Local Services
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold text-gray-900"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            More Than Jobs
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Discover trusted local businesses and service providers in Theni
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {services.map((svc) => (
            <Link key={svc.label} href={svc.href} className="group">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center hover:shadow-md hover:border-amber-300 transition-all duration-200 group-hover:-translate-y-1">
                <div className="text-3xl mb-2" aria-hidden="true">{svc.icon}</div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-amber-700 transition-colors">
                  {svc.label}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border-2 border-amber-600 text-amber-700 hover:bg-amber-50 transition-all"
          >
            Explore Local Services <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
