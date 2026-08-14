'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const categories = [
  { label: 'IT & Software', icon: '💻', count: '180+', color: '#EFF6FF', textColor: '#2563EB', href: '/jobs?category=it' },
  { label: 'Healthcare', icon: '🏥', count: '95+', color: '#ECFDF5', textColor: '#059669', href: '/jobs?category=healthcare' },
  { label: 'Agriculture', icon: '🌾', count: '120+', color: '#FFFBEB', textColor: '#D97706', href: '/jobs?category=agriculture' },
  { label: 'Education', icon: '📚', count: '75+', color: '#F5F3FF', textColor: '#7C3AED', href: '/jobs?category=education' },
  { label: 'Construction', icon: '🏗️', count: '60+', color: '#FFF1F2', textColor: '#E11D48', href: '/jobs?category=construction' },
  { label: 'Sales & Marketing', icon: '📈', count: '140+', color: '#F0F9FF', textColor: '#0284C7', href: '/jobs?category=sales' },
  { label: 'Manufacturing', icon: '🏭', count: '88+', color: '#FEF3C7', textColor: '#92400E', href: '/jobs?category=manufacturing' },
  { label: 'Transport', icon: '🚛', count: '55+', color: '#F0FDF4', textColor: '#15803D', href: '/jobs?category=transport' },
];

const whyItems = [
  {
    icon: '✅',
    title: 'Verified Employers',
    desc: 'All companies are manually verified before posting jobs — zero fake listings.',
    bg: '#ECFDF5',
    border: '#D1FAE5' },
  {
    icon: '⚡',
    title: 'Instant Notifications',
    desc: 'Get notified the moment a matching job is posted in your area.',
    bg: '#EFF6FF',
    border: '#DBEAFE' },
  {
    icon: '📱',
    title: 'Mobile First',
    desc: 'Apply from anywhere, anytime. WhatsApp integration for direct contact.',
    bg: '#FFFBEB',
    border: '#FDE68A' },
  {
    icon: '🎯',
    title: 'Hyper Local',
    desc: 'Jobs specifically for Theni, Madurai, Dindigul & surrounding districts.',
    bg: '#F5F3FF',
    border: '#DDD6FE' },
];

const howItWorks = [
  { step: '01', title: 'Create Profile', desc: 'Sign up and build your professional profile in minutes', icon: '👤' },
  { step: '02', title: 'Search & Apply', desc: 'Browse verified jobs matching your skills and location', icon: '🔍' },
  { step: '03', title: 'Get Hired', desc: 'Connect directly with employers and land your dream job', icon: '🎉' },
];

export default function CategoriesSection() {
  return (
    <>
      {/* Categories */}
      <section className="py-14" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-amber-600 text-xs font-semibold mb-3">
              🎯 Browse by Category
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Popular Job Categories
            </h2>
            <p className="text-sm text-gray-500 mt-2">Explore opportunities across every industry</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <Link key={cat.label} href={cat.href} className="group">
                <div
                  className="rounded-2xl p-5 text-center border-2 border-transparent hover:shadow-md transition-all duration-200 cursor-pointer group-hover:-translate-y-1"
                  style={{ background: cat.color }}
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">{cat.label}</p>
                  <p className="text-xs font-bold" style={{ color: cat.textColor }}>{cat.count} jobs</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Theni Jobs */}
      <section className="py-14" style={{ background: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-semibold mb-3">
              🏆 Why Choose Us
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Why Theni Jobs?
            </h2>
            <p className="text-sm text-gray-500 mt-2">Built specifically for local talent and local employers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyItems.map((item) => (
              <div key={item.title} className="rounded-2xl p-6 border-2 transition-all hover:shadow-md"
                style={{ background: item.bg, borderColor: item.border }}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-600 text-xs font-semibold mb-3">
              🚀 Simple Process
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5" style={{ background: 'linear-gradient(90deg, #DBEAFE, #D1FAE5)' }} />

            {howItWorks.map((item, i) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl text-2xl mb-4 border-2"
                  style={{ background: i === 0 ? '#EFF6FF' : i === 1 ? '#ECFDF5' : '#FFFBEB', borderColor: i === 0 ? '#DBEAFE' : i === 1 ? '#D1FAE5' : '#FDE68A' }}>
                  {item.icon}
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ background: '#2563EB' }}>
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Job Seeker CTA */}
            <div className="rounded-3xl p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
              <p className="text-xs font-bold uppercase tracking-wider opacity-75 mb-2">For Job Seekers</p>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Find Jobs Faster
              </h3>
              <p className="text-sm opacity-80 mb-5 leading-relaxed">
                Create your profile, get AI resume analysis, and connect with top employers in Theni.
              </p>
              <Link href="/register?role=seeker"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-blue-600 hover:bg-blue-50 transition-all">
                Get Started Free <ArrowRight size={15} />
              </Link>
            </div>

            {/* Employer CTA */}
            <div className="rounded-3xl p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
              <p className="text-xs font-bold uppercase tracking-wider opacity-75 mb-2">For Employers</p>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Hire Local Talent
              </h3>
              <p className="text-sm opacity-80 mb-5 leading-relaxed">
                Post jobs, register your company, and find the best talent across Theni &amp; Tamil Nadu.
              </p>
              <Link href="/employer/post-job"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-emerald-600 hover:bg-emerald-50 transition-all">
                Post a Job Now <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
