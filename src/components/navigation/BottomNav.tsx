'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Building2, Home, Store, User } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', tamil: 'முகப்பு', icon: Home },
  { href: '/jobs', label: 'Jobs', tamil: 'வேலை', icon: Briefcase },
  { href: '/businesses', label: 'Business', tamil: 'நிறுவனம்', icon: Building2 },
  { href: '/services', label: 'Services', tamil: 'சேவை', icon: Store },
  { href: '/profile', label: 'Profile', tamil: 'சுயவிவரம்', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-100 bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.06)] lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[56px] flex-col items-center gap-1 px-2 py-1 text-[10px] transition-colors ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-700'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.25 : 1.75}
                fill={isActive ? 'currentColor' : 'none'}
                fillOpacity={isActive ? 0.22 : 0}
              />
              <span className="truncate max-w-[64px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
