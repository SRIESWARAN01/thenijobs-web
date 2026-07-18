'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Building2,
  Users,
  Search,
  ArrowRight,
  MapPin,
  Star,
  Wrench,
  Sparkles,
  Clock,
  ArrowUpRight,
  BookOpen,
  Award,
  Check,
  Menu,
  X,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Zap,
  Bookmark,
  Send,
  MessageSquare,
  Building,
  GraduationCap,
  Heart,
  TrendingUp,
  Map,
  ShieldAlert,
  ArrowDownToLine,
  Phone,
  Mail,
  Globe,
  MessageCircle,
} from 'lucide-react';

// Location List
const CITIES = [
  'Theni', 'Madurai', 'Dindigul', 'Coimbatore', 'Bodinayakanur',
  'Cumbum', 'Chinnamanur', 'Periyakulam', 'Uthamapalayam', 'Andipatti'
];

// 15 popular towns/locations
const POPULAR_TOWNS = [
  'Theni', 'Madurai', 'Dindigul', 'Coimbatore', 'Bodinayakanur',
  'Cumbum', 'Chinnamanur', 'Periyakulam', 'Uthamapalayam', 'Andipatti',
  'Gudalur', 'Devadanapatti', 'Kombai', 'Veerapandi', 'Kambam Valley'
];

// Job Categories
const JOB_CATEGORIES = [
  'IT', 'Software Developer', 'Agriculture', 'Healthcare', 'Nursing',
  'Teacher', 'Accountant', 'Sales', 'Digital Marketing', 'Driver',
  'Delivery', 'Retail', 'Textile', 'Manufacturing', 'Construction',
  'Freshers', 'Part-Time', 'Work From Home', 'Remote'
];

// Directory categories
const DIRECTORY_CATEGORIES = [
  { name: 'Agriculture', count: '45+', icon: SpadeIcon },
  { name: 'Hospitals', count: '32+', icon: Heart },
  { name: 'Schools', count: '28+', icon: BookOpen },
  { name: 'Colleges', count: '12+', icon: GraduationCap },
  { name: 'Hotels', count: '25+', icon: BedIcon },
  { name: 'Restaurants', count: '55+', icon: UtensilsIcon },
  { name: 'Textile Shops', count: '40+', icon: ShirtIcon },
  { name: 'Automobile', count: '22+', icon: CarIcon },
  { name: 'Finance', count: '18+', icon: LandmarkIcon },
  { name: 'Real Estate', count: '15+', icon: Building },
  { name: 'Electronics', count: '30+', icon: CpuIcon },
  { name: 'Wholesale', count: '50+', icon: PackageIcon },
  { name: 'Retail', count: '110+', icon: ShoppingBagIcon },
  { name: 'Manufacturing', count: '20+', icon: FactoryIcon }
];

// Services
const SERVICES = [
  'Electricians', 'Plumbers', 'Carpenters', 'AC Technicians', 'Mobile Repair',
  'Computer Service', 'CCTV', 'Interior Designers', 'Web/App Developers',
  'Graphic Designers', 'Digital Marketing', 'Photographers', 'Event Planners',
  'Tutors', 'Freelancers'
];

// Helper icons
function SpadeIcon(props: any) {
  return <Sparkles {...props} />;
}
function BedIcon(props: any) {
  return <Building {...props} />;
}
function UtensilsIcon(props: any) {
  return <Clock {...props} />;
}
function ShirtIcon(props: any) {
  return <Briefcase {...props} />;
}
function CarIcon(props: any) {
  return <TrendingUp {...props} />;
}
function LandmarkIcon(props: any) {
  return <Award {...props} />;
}
function CpuIcon(props: any) {
  return <Sparkles {...props} />;
}
function PackageIcon(props: any) {
  return <Briefcase {...props} />;
}
function ShoppingBagIcon(props: any) {
  return <Building2 {...props} />;
}
function FactoryIcon(props: any) {
  return <Building {...props} />;
}

export default function LandingPageClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTab, setSearchTab] = useState<'jobs' | 'businesses' | 'services'>('jobs');
  const [journeyTab, setJourneyTab] = useState<'seekers' | 'employers' | 'businesses'>('seekers');

  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTab === 'jobs') {
      window.location.href = `/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`;
    } else if (searchTab === 'businesses') {
      window.location.href = `/businesses?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`;
    } else {
      window.location.href = `/services?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`;
    }
  };

  return (
    <div className="min-h-screen bg-bg-warm text-text-main font-sans selection:bg-primary-teal/20 antialiased overflow-x-hidden w-full max-w-full">
      
      {/* Dynamic grid background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(var(--color-border-warm) 1.5px, transparent 1.5px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* 1. Sticky Glass Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-card-bg/85 border-b border-border-warm/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 focus:outline-none">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight font-sora text-primary-teal">
                THENI<span className="text-accent-saffron">JOBS</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link href="/jobs" className="text-sm font-semibold hover:text-primary-teal transition-colors py-2">Jobs</Link>
              <Link href="/businesses" className="text-sm font-semibold hover:text-primary-teal transition-colors py-2">Businesses</Link>
              <Link href="/services" className="text-sm font-semibold hover:text-primary-teal transition-colors py-2">Services</Link>
              <Link href="/academy" className="text-sm font-semibold hover:text-primary-teal transition-colors py-2">Academy</Link>
              <Link href="/about" className="text-sm font-semibold hover:text-primary-teal transition-colors py-2">About</Link>
            </nav>

            {/* Desktop CTA buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-sm font-bold text-primary-teal hover:text-primary-teal/80 transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link 
                href="/business/post-job" 
                className="text-sm font-bold text-white bg-primary-teal hover:bg-primary-teal/95 shadow-md hover:shadow-lg transition-all rounded-xl px-5 py-2.5"
              >
                Post a Job
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-primary-teal hover:bg-border-warm/50 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-card-bg border-b border-border-warm shadow-xl transition-all duration-300 animate-in slide-in-from-top">
            <div className="px-4 pt-3 pb-6 space-y-3">
              <Link 
                href="/jobs" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl hover:bg-border-warm/40 text-base font-semibold"
              >
                Jobs
              </Link>
              <Link 
                href="/businesses" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl hover:bg-border-warm/40 text-base font-semibold"
              >
                Businesses
              </Link>
              <Link 
                href="/services" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl hover:bg-border-warm/40 text-base font-semibold"
              >
                Services
              </Link>
              <Link 
                href="/academy" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl hover:bg-border-warm/40 text-base font-semibold"
              >
                Academy
              </Link>
              <Link 
                href="/about" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl hover:bg-border-warm/40 text-base font-semibold"
              >
                About Us
              </Link>
              <div className="border-t border-border-warm pt-3 mt-3 flex flex-col gap-2.5">
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex justify-center items-center h-11 w-full text-base font-bold text-primary-teal border border-primary-teal/20 rounded-xl"
                >
                  Sign In
                </Link>
                <Link 
                  href="/business/post-job" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex justify-center items-center h-11 w-full text-base font-bold text-white bg-primary-teal rounded-xl shadow-md"
                >
                  Post a Job
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden w-full">
        {/* Soft colorful gradient glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-primary-teal/10 to-accent-saffron/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-14">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-teal/10 border border-primary-teal/15 text-[11px] sm:text-xs font-bold text-primary-teal uppercase tracking-wider mb-6 animate-pulse">
              <span>Theni's #1 Local Job Portal</span>
              <span className="text-border-warm">•</span>
              <span>Business Directory</span>
              <span className="text-border-warm">•</span>
              <span>Service Marketplace</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-sora text-primary-teal leading-[1.15] mb-6">
              Find Jobs, Hire Employees & Discover Local Businesses in <span className="text-accent-saffron relative">Theni</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg md:text-xl text-text-muted max-w-3xl mx-auto leading-relaxed mb-8">
              Empowering the Kambam Valley & Tamil Nadu with a unified directory for verified employment vacancies, local startup portals, skilled service providers, and business networking. Build your professional identity today.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link 
                href="/jobs" 
                className="w-full sm:w-auto h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-teal text-white font-bold px-8 shadow-lg hover:shadow-xl hover:bg-primary-teal/95 transition-all active:scale-98"
              >
                Find Jobs <ArrowRight size={18} />
              </Link>
              <Link 
                href="/businesses" 
                className="w-full sm:w-auto h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-card-bg border border-border-warm text-text-main font-semibold px-8 hover:bg-border-warm/30 transition-all"
              >
                Browse Businesses
              </Link>
            </div>
          </div>

          {/* Search Card Component */}
          <div className="max-w-3xl mx-auto bg-card-bg border border-border-warm shadow-xl rounded-2xl p-4 sm:p-6">
            {/* Search Tab Switcher */}
            <div className="flex border-b border-border-warm mb-5">
              {(['jobs', 'businesses', 'services'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSearchTab(tab)}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
                    searchTab === tab 
                      ? 'border-primary-teal text-primary-teal' 
                      : 'border-transparent text-text-muted hover:text-text-main'
                  }`}
                >
                  {tab === 'jobs' && '💼 Find Jobs'}
                  {tab === 'businesses' && '🏢 Find Businesses'}
                  {tab === 'services' && '🛠️ Find Services'}
                </button>
              ))}
            </div>

            {/* Search Inputs Form */}
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="text"
                  placeholder={
                    searchTab === 'jobs' 
                      ? 'Job title, skill, or keyword...' 
                      : searchTab === 'businesses' 
                        ? 'Business name or category...' 
                        : 'Carpenter, Plumber, Web developer...'
                  }
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 bg-bg-warm/50 border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-teal text-text-main placeholder:text-text-muted"
                />
              </div>

              <div className="w-full md:w-56 relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-12 pl-10 pr-8 bg-bg-warm/50 border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-teal text-text-main appearance-none cursor-pointer"
                >
                  <option value="">Select City (All)</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                  <ChevronRight size={16} className="rotate-90" />
                </div>
              </div>

              <button
                type="submit"
                className="h-12 bg-primary-teal hover:bg-primary-teal/95 text-white font-bold px-6 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                Search
              </button>
            </form>

            {/* Trending Keyword Chips */}
            <div className="mt-4 pt-3 border-t border-border-warm/60 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-text-muted">Trending:</span>
              {['Freshers', 'Part Time', 'Software Developer', 'WFH', 'Accounting'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setKeyword(term)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-bg-warm hover:bg-primary-teal/10 hover:text-primary-teal border border-border-warm transition-all text-text-muted font-medium"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Stats Strip */}
      <section className="bg-primary-teal text-white py-10 w-full relative z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-sora">1,200+</div>
              <div className="text-xs sm:text-sm font-medium text-white/80">Active Vacancies</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-sora">450+</div>
              <div className="text-xs sm:text-sm font-medium text-white/80">Verified Businesses</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-sora">3,800+</div>
              <div className="text-xs sm:text-sm font-medium text-white/80">Registered Seekers</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-sora">99.8%</div>
              <div className="text-xs sm:text-sm font-medium text-white/80">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. About THENIJOBS */}
      <section className="py-16 sm:py-24 bg-card-bg border-b border-border-warm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-saffron/10 border border-accent-saffron/15 text-[11px] font-bold text-accent-saffron uppercase tracking-wider mb-4">
                Our Mission
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-sora text-primary-teal mb-6">
                Bridging local talent with hyperlocal opportunity
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                THENIJOBS is dedicated to modernizing job searching and professional networking across the Theni district and the greater Tamil Nadu region. We provide a clean, secure, and accessible platform where local talent and businesses thrive together.
              </p>
              <p className="text-text-muted leading-relaxed">
                By focusing on verified listings, immediate feedback pathways, and hyperlocal categorizations, we make recruitment and business discovery faster, cheaper, and more reliable for everyone.
              </p>
            </div>
            <div className="relative p-6 sm:p-8 bg-bg-warm border border-border-warm rounded-3xl">
              <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-20 h-20 bg-accent-saffron/10 rounded-full blur-xl pointer-events-none" />
              <blockquote className="relative space-y-4">
                <p className="text-lg font-medium text-text-main italic">
                  "THENIJOBS was created with one simple objective: to ensure that the talented youth of Theni district do not have to leave their hometowns to discover career-defining jobs and local networking channels."
                </p>
                <cite className="block not-italic">
                  <span className="font-bold text-primary-teal">Eswaran P</span>
                  <span className="text-xs text-text-muted block">Founder & CEO, THENIJOBS</span>
                </cite>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Local Sectors Grid */}
      <section className="py-16 sm:py-24 bg-bg-warm border-b border-border-warm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-sora text-primary-teal mb-4">
              Explore Local Sectors
            </h2>
            <p className="text-text-muted">
              Connect with leading employers and businesses categorized across key operational sectors in Tamil Nadu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Agriculture', desc: 'Farming, supply chain, organic trading, and agritech opportunities.', icon: SpadeIcon, color: 'bg-emerald-500/10 text-emerald-600' },
              { title: 'IT & Software', desc: 'Web design, software developers, technical support, and product engineering.', icon: CpuIcon, color: 'bg-blue-500/10 text-blue-600' },
              { title: 'Healthcare', desc: 'Hospitals, medical coding, nursing, clinics, and pharmaceuticals.', icon: Heart, color: 'bg-rose-500/10 text-rose-600' },
              { title: 'Construction', desc: 'Architects, civil engineers, structural works, and materials supplier network.', icon: Building, color: 'bg-amber-500/10 text-amber-600' },
              { title: 'Education', desc: 'Schools, training centers, teaching jobs, and skills development.', icon: BookOpen, color: 'bg-violet-500/10 text-violet-600' },
              { title: 'Textiles', desc: 'Garment manufacturing, weaving mills, fashion showrooms, and tailors.', icon: ShirtIcon, color: 'bg-fuchsia-500/10 text-fuchsia-600' },
              { title: 'Retail', desc: 'Supermarkets, apparel retail, distributor jobs, and sales positions.', icon: ShoppingBagIcon, color: 'bg-cyan-500/10 text-cyan-600' },
              { title: 'Transport', desc: 'Logistics, delivery services, fleet drivers, and warehouse management.', icon: CarIcon, color: 'bg-sky-500/10 text-sky-600' },
            ].map((sector) => {
              const Icon = sector.icon;
              return (
                <div key={sector.title} className="p-6 bg-card-bg border border-border-warm rounded-2xl shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${sector.color} group-hover:scale-110 transition-transform`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-text-main mb-2">{sector.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{sector.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. For Job Seekers */}
      <section className="py-16 sm:py-24 bg-card-bg border-b border-border-warm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-teal/10 border border-primary-teal/15 text-[11px] font-bold text-primary-teal uppercase tracking-wider">
                For Job Seekers
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-sora text-primary-teal leading-tight">
                Kickstart your career near home
              </h2>
              <p className="text-text-muted leading-relaxed">
                Create a dynamic public profile, customize your job alerts, and apply for verified government or private positions. Showcase your resume, certifications, and technical skills directly to companies looking for your specific talent.
              </p>
              <div className="flex gap-4">
                <Link 
                  href="/register" 
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary-teal hover:bg-primary-teal/95 text-white font-bold px-6 shadow-md transition-colors"
                >
                  Create Free Profile
                </Link>
                <Link 
                  href="/jobs" 
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border-warm text-text-main font-semibold px-6 hover:bg-bg-warm transition-all"
                >
                  Browse Categories
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 p-6 sm:p-8 bg-bg-warm border border-border-warm rounded-3xl">
              <h3 className="text-sm font-bold text-primary-teal uppercase tracking-wider mb-5">
                Popular Job Roles & Categories
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {JOB_CATEGORIES.map((role) => (
                  <Link 
                    key={role} 
                    href={`/jobs?q=${encodeURIComponent(role)}`}
                    className="text-xs px-3.5 py-2 rounded-xl bg-card-bg hover:bg-primary-teal/10 hover:text-primary-teal border border-border-warm hover:border-primary-teal/30 transition-all font-semibold text-text-main"
                  >
                    {role}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. For Employers */}
      <section className="py-16 sm:py-24 bg-bg-warm border-b border-border-warm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-saffron/10 border border-accent-saffron/15 text-[11px] font-bold text-accent-saffron uppercase tracking-wider">
                For Employers
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-sora text-primary-teal leading-tight">
                Hire local candidates faster, screen efficiently
              </h2>
              <p className="text-text-muted leading-relaxed">
                Connect with the largest candidate base in the Kambam Valley. Post jobs, search the public resume database, manage applications, and hire qualified professionals with confidence.
              </p>
              
              <ul className="space-y-3.5">
                {[
                  'Post free or premium sponsored job listings',
                  'Access verified public candidate portfolios',
                  'Manage applications via a simplified dashboard',
                  'Instant email/WhatsApp interview scheduling'
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm font-medium text-text-main">
                    <CheckCircle2 className="text-emerald-500 mt-0.5 flex-shrink-0" size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Link 
                  href="/business/post-job" 
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary-teal hover:bg-primary-teal/95 text-white font-bold px-6 shadow-md transition-colors"
                >
                  Start Hiring Now
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="p-6 bg-gradient-to-br from-primary-teal to-primary-teal/90 text-white rounded-2xl shadow-md">
                <div className="text-3xl font-extrabold font-sora mb-1">500+</div>
                <div className="text-xs font-semibold text-white/80">Monthly Postings</div>
              </div>
              <div className="p-6 bg-card-bg border border-border-warm rounded-2xl shadow-sm text-text-main">
                <div className="text-3xl font-extrabold font-sora text-primary-teal mb-1">100%</div>
                <div className="text-xs font-semibold text-text-muted">Verified Company Profiles</div>
              </div>
              <div className="p-6 bg-card-bg border border-border-warm rounded-2xl shadow-sm text-text-main">
                <div className="text-3xl font-extrabold font-sora text-primary-teal mb-1">3,000+</div>
                <div className="text-xs font-semibold text-text-muted">Active Candidates</div>
              </div>
              <div className="p-6 bg-gradient-to-br from-accent-saffron to-accent-saffron/90 text-white rounded-2xl shadow-md">
                <div className="text-3xl font-extrabold font-sora mb-1">&lt; 24h</div>
                <div className="text-xs font-semibold text-white/80">Average Response Time</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. Business Directory */}
      <section className="py-16 sm:py-24 bg-card-bg border-b border-border-warm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-teal/10 border border-primary-teal/15 text-[11px] font-bold text-primary-teal uppercase tracking-wider mb-4">
              Local Directory
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-sora text-primary-teal mb-4">
              Explore Verified Business Listings
            </h2>
            <p className="text-text-muted">
              Connect with top shops, wholesale suppliers, manufacturing plants, and educational institutes in Theni district.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-12">
            {DIRECTORY_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link 
                  key={cat.name} 
                  href={`/businesses/${cat.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                  className="p-5 bg-bg-warm/50 hover:bg-primary-teal/10 border border-border-warm hover:border-primary-teal/30 rounded-2xl text-center transition-all group flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-card-bg border border-border-warm group-hover:border-primary-teal/30 flex items-center justify-center text-primary-teal group-hover:scale-110 transition-transform">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-text-main leading-tight group-hover:text-primary-teal transition-colors">{cat.name}</div>
                    <div className="text-[10px] font-semibold text-text-muted mt-0.5">{cat.count} listings</div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center">
            <Link 
              href="/register" 
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-teal hover:bg-primary-teal/95 text-white font-bold px-8 shadow-md transition-colors"
            >
              Register Your Business
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Local Services Marketplace */}
      <section className="py-16 sm:py-24 bg-bg-warm border-b border-border-warm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-saffron/10 border border-accent-saffron/15 text-[11px] font-bold text-accent-saffron uppercase tracking-wider">
                Services Marketplace
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-sora text-primary-teal leading-tight">
                Hire trusted local service providers
              </h2>
              <p className="text-text-muted leading-relaxed">
                Need domestic help, custom software, event planners, or maintenance specialists? Connect directly with skilled local technicians and freelancers in the area. Zero platform commission fees.
              </p>
              <div className="pt-2">
                <Link 
                  href="/services" 
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary-teal hover:bg-primary-teal/95 text-white font-bold px-6 shadow-md transition-colors"
                >
                  Find Service Providers
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 p-6 sm:p-8 bg-card-bg border border-border-warm rounded-3xl">
              <h3 className="text-sm font-bold text-primary-teal uppercase tracking-wider mb-5">
                Popular Services
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {SERVICES.map((srv) => (
                  <Link 
                    key={srv} 
                    href={`/services?q=${encodeURIComponent(srv)}`}
                    className="text-xs px-3.5 py-2.5 rounded-xl bg-bg-warm/50 hover:bg-primary-teal/10 hover:text-primary-teal border border-border-warm hover:border-primary-teal/30 transition-all font-semibold text-text-main"
                  >
                    {srv}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Why THENIJOBS */}
      <section className="py-16 sm:py-24 bg-card-bg border-b border-border-warm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-sora text-primary-teal mb-4">
              Why Choose THENIJOBS?
            </h2>
            <p className="text-text-muted">
              Discover the benefits of utilizing the area's primary career ecosystem.
            </p>
          </div>

          {/* Grid of 6 feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { title: 'Verified Employers', desc: 'All job postings go through basic review checks to prevent spam or fake advertisements.', icon: ShieldAlert },
              { title: 'Local Opportunities', desc: 'Focus specifically on the Theni, Madurai, Dindigul, and Coimbatore regions for nearby jobs.', icon: MapPin },
              { title: 'Easy Hiring', desc: 'Direct application pipeline with fast communication directly via telephone or email.', icon: Send },
              { title: 'Business Directory', desc: 'Create searchable digital footprints for your shop, manufacturing plant, or farm.', icon: Building2 },
              { title: 'Service Marketplace', desc: 'Showcase skill listings as service providers with customer rating indicators.', icon: Wrench },
              { title: 'AI Career Tools', desc: 'Create professional resume templates and leverage prompt optimization guidelines.', icon: Sparkles },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="p-6 bg-bg-warm border border-border-warm rounded-2xl group hover:border-primary-teal/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-card-bg flex items-center justify-center text-primary-teal border border-border-warm group-hover:border-primary-teal/20 mb-4 group-hover:scale-110 transition-transform">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-text-main mb-2">{feat.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Checklist Row */}
          <div className="p-6 bg-bg-warm border border-border-warm rounded-2xl">
            <h3 className="text-xs font-bold text-primary-teal uppercase tracking-wider mb-4 text-center">
              Features Checklist
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                'Free Profile Builder', 'Verified Postings', 'No Commission Fees',
                'Hyperlocal Filters', 'Mobile Optimization', 'Instant Alerts',
                'Digital Business Cards', 'Review System', 'Interactive Map',
                'vCard VCF Downloads'
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs font-semibold text-text-main">
                  <Check className="text-emerald-500 flex-shrink-0" size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 11. How it works */}
      <section className="py-16 sm:py-24 bg-bg-warm border-b border-border-warm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-sora text-primary-teal mb-4">
              How it Works
            </h2>
            <p className="text-text-muted">
              Select your persona below to view the steps involved in using the platform.
            </p>

            <div className="flex justify-center gap-3 mt-6">
              {(['seekers', 'employers', 'businesses'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setJourneyTab(tab)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                    journeyTab === tab
                      ? 'bg-primary-teal text-white border-primary-teal'
                      : 'bg-card-bg text-text-muted border-border-warm hover:text-text-main'
                  }`}
                >
                  {tab === 'seekers' && 'Job Seekers'}
                  {tab === 'employers' && 'Employers'}
                  {tab === 'businesses' && 'Businesses'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 relative">
            {journeyTab === 'seekers' && [
              { step: 1, title: 'Sign Up', desc: 'Create a job seeker account for free.' },
              { step: 2, title: 'Build Resume', desc: 'Input details, skills, and qualifications.' },
              { step: 3, title: 'Set Alerts', desc: 'Receive immediate notifications.' },
              { step: 4, title: 'Find Jobs', desc: 'Filter by locality and job role.' },
              { step: 5, title: 'Apply', desc: 'Send profile directly to the recruiter.' },
              { step: 6, title: 'Get Hired', desc: 'Receive response and schedule interview.' },
            ].map((j, i) => (
              <div key={i} className="p-5 bg-card-bg border border-border-warm rounded-2xl relative shadow-sm">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary-teal text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                  {j.step}
                </div>
                <h3 className="text-sm font-bold text-text-main mt-2 mb-1">{j.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{j.desc}</p>
              </div>
            ))}

            {journeyTab === 'employers' && [
              { step: 1, title: 'Register Company', desc: 'Input details and brand identity.' },
              { step: 2, title: 'Get Verified', desc: 'Complete validation review.' },
              { step: 3, title: 'Post Vacancies', desc: 'Define salary range and job description.' },
              { step: 4, title: 'Search Resumes', desc: 'Browse the public candidate directory.' },
              { step: 5, title: 'Filter Leads', desc: 'Receive applications directly.' },
              { step: 6, title: 'Schedule', desc: 'Coordinate interview timelines.' },
            ].map((j, i) => (
              <div key={i} className="p-5 bg-card-bg border border-border-warm rounded-2xl relative shadow-sm">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-accent-saffron text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                  {j.step}
                </div>
                <h3 className="text-sm font-bold text-text-main mt-2 mb-1">{j.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{j.desc}</p>
              </div>
            ))}

            {journeyTab === 'businesses' && [
              { step: 1, title: 'Create Profile', desc: 'Input shop, farm, or institute parameters.' },
              { step: 2, title: 'List Offerings', desc: 'Add services, products, or catalogs.' },
              { step: 3, title: 'Verify Details', desc: 'Establish credentials and location.' },
              { step: 4, title: 'Generate Card', desc: 'Receive dynamic QR-code VCF profile.' },
              { step: 5, title: 'Rank Local', desc: 'Show up in regional search queues.' },
              { step: 6, title: 'Receive Leads', desc: 'Get customer inquiries directly.' },
            ].map((j, i) => (
              <div key={i} className="p-5 bg-card-bg border border-border-warm rounded-2xl relative shadow-sm">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary-teal text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                  {j.step}
                </div>
                <h3 className="text-sm font-bold text-text-main mt-2 mb-1">{j.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{j.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12. Testimonials */}
      <section className="py-16 sm:py-24 bg-card-bg border-b border-border-warm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-sora text-primary-teal mb-4">
              What Our Community Says
            </h2>
            <p className="text-text-muted">
              Hear from candidates, HR managers, and local business owners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Ravi Kumar', role: 'Software Engineer', text: 'I found a Remote Web Development position located in Madurai within two weeks of registering. The dynamic resume builder is extremely professional.', rating: 5 },
              { name: 'Priya S', role: 'HR Manager', text: 'Listing our job vacancies here saved us significant advertising costs. The verified local candidates fit our requirements perfectly.', rating: 5 },
              { name: 'Saravanan', role: 'Business Owner', text: 'Registering our retail showroom expanded our digital presence. We receive direct customer inquiries on WhatsApp regularly now.', rating: 5 },
            ].map((test, idx) => (
              <div key={idx} className="p-6 bg-bg-warm border border-border-warm rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-4 text-accent-saffron">
                    {Array.from({ length: test.rating }).map((_, i) => (
                      <Star key={i} size={16} className="fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-text-main leading-relaxed mb-6">"{test.text}"</p>
                </div>
                <div>
                  <div className="font-bold text-primary-teal text-sm">{test.name}</div>
                  <div className="text-xs text-text-muted">{test.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 13. Latest business updates */}
      <section className="py-16 sm:py-24 bg-bg-warm border-b border-border-warm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-sora text-primary-teal mb-4">
              Latest Community & Business Updates
            </h2>
            <p className="text-text-muted">
              Stay informed with fresh announcements from companies in the district.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Local Textile Showroom Hiring Sales Staff', date: 'July 18, 2026', tag: 'New Hiring', color: 'bg-emerald-500/10 text-emerald-600' },
              { title: 'Premium Hotel Grand Opening in Cumbum Valley', date: 'July 15, 2026', tag: 'Grand Opening', color: 'bg-blue-500/10 text-blue-600' },
              { title: 'Walk-In Interviews for Teachers in Theni School', date: 'July 12, 2026', tag: 'Walk-In Interview', color: 'bg-amber-500/10 text-amber-600' },
              { title: 'Special Monsoon Discount on Electronics Repairs', date: 'July 10, 2026', tag: 'Special Offer', color: 'bg-rose-500/10 text-rose-600' }
            ].map((news, idx) => (
              <div key={idx} className="p-6 bg-card-bg border border-border-warm rounded-2xl flex flex-col justify-between hover:border-primary-teal/20 transition-all">
                <div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${news.color}`}>
                    {news.tag}
                  </span>
                  <h3 className="text-sm font-bold text-text-main mt-4 mb-2 leading-snug">{news.title}</h3>
                </div>
                <div className="text-[11px] font-semibold text-text-muted mt-4">{news.date}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 14. Popular Locations */}
      <section className="py-16 sm:py-24 bg-card-bg border-b border-border-warm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-sora text-primary-teal mb-4">
              Explore Popular Towns & Regions
            </h2>
            <p className="text-text-muted">
              Select a locality below to view localized listings, dynamic career directories, and verified service providers.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {POPULAR_TOWNS.map((town) => (
              <Link 
                key={town} 
                href={`/jobs/${town.toLowerCase().replace(/ /g, '-')}`}
                className="p-4 bg-bg-warm/50 border border-border-warm hover:border-primary-teal/30 hover:bg-primary-teal/5 rounded-xl text-center text-sm font-bold text-text-main hover:text-primary-teal transition-all flex items-center justify-center gap-2"
              >
                <MapPin size={14} className="text-primary-teal/60" />
                <span>{town}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 15. Why Local Search Matters */}
      <section className="py-16 sm:py-24 bg-bg-warm border-b border-border-warm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-teal to-primary-teal/95 text-white p-8 sm:p-12 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 bg-accent-saffron/10 rounded-full blur-2xl pointer-events-none" />
            <div className="max-w-3xl space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold font-sora">
                The Hyperlocal Advantage
              </h2>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                Finding opportunities locally shouldn't be difficult. Traditional directory listings prioritize global results, burying regional providers, farms, and neighborhood shops.
              </p>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                By indexing specifically for the Kambam Valley and surrounding districts, THENIJOBS simplifies logistics, eliminates unnecessary travel times, and boosts localized economies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 16. Career Resources */}
      <section className="py-16 sm:py-24 bg-card-bg border-b border-border-warm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-sora text-primary-teal mb-4">
              Career & Business Resources
            </h2>
            <p className="text-text-muted">
              Free educational guides, technical assistance, and certification opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Interview Preparation Tips', desc: 'Standard question catalogs, coding challenges, and formatting guidelines.', type: 'Guides' },
              { title: 'Resume Writing Formats', desc: 'Download template portfolios matching ATS guidelines for recruiters.', type: 'Templates' },
              { title: 'Career Advice Hub', desc: 'Expert advice on career planning, salary negotiations, and role pivots.', type: 'Articles' },
              { title: 'AI Resume Assistant', desc: 'Optimize profile details and skill tags dynamically.', type: 'AI Tools' },
              { title: 'Skill Development Courses', desc: 'Access in-demand learning modules and earn validation certificates.', type: 'Academy' },
              { title: 'Government Job Alerts', desc: 'Timely updates on regional administrative vacancies.', type: 'Government' },
              { title: 'Internship Listings', desc: 'Find entry-level roles for university freshers in the district.', type: 'Internships' },
              { title: 'Campus Recruitment Info', desc: 'Information on local engineering and arts college placements.', type: 'Campus' },
              { title: 'Local Industry Insights', desc: 'Keep track of economic, salary, and expansion trends.', type: 'News' }
            ].map((res, idx) => (
              <div key={idx} className="p-6 bg-bg-warm border border-border-warm rounded-2xl hover:border-primary-teal/20 transition-all flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-primary-teal/10 text-primary-teal">
                    {res.type}
                  </span>
                  <h3 className="text-sm font-bold text-text-main mt-3 mb-1.5 leading-snug">{res.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{res.desc}</p>
                </div>
                <Link href="/academy" className="text-xs font-bold text-primary-teal hover:text-primary-teal/80 transition-colors flex items-center gap-1 mt-4">
                  <span>Explore Resource</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 17. CTA Banner */}
      <section className="py-16 sm:py-20 bg-bg-warm border-b border-border-warm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-teal via-primary-teal to-accent-saffron text-white p-8 sm:p-12 rounded-3xl text-center shadow-xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-sora mb-4">
              Start Your Journey Today
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
              Join thousands of job seekers, business listings, and service providers currently networking across Tamil Nadu. Create your profile now.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto h-12 inline-flex items-center justify-center rounded-xl bg-white text-primary-teal font-bold px-6 shadow-md hover:shadow-lg transition-all">
                Register as Candidate
              </Link>
              <Link href="/business/post-job" className="w-full sm:w-auto h-12 inline-flex items-center justify-center rounded-xl bg-white text-primary-teal font-bold px-6 shadow-md hover:shadow-lg transition-all">
                Post job vacancy
              </Link>
              <Link href="/register?type=business" className="w-full sm:w-auto h-12 inline-flex items-center justify-center rounded-xl bg-card-bg/10 hover:bg-card-bg/20 border border-white/20 text-white font-bold px-6 transition-all">
                List your business
              </Link>
              <Link href="/register?type=service" className="w-full sm:w-auto h-12 inline-flex items-center justify-center rounded-xl bg-card-bg/10 hover:bg-card-bg/20 border border-white/20 text-white font-bold px-6 transition-all">
                Join as Technician
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 18. SEO keyword footer */}
      <section className="py-12 bg-card-bg border-b border-border-warm w-full text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="space-y-3">
            <h3 className="font-bold text-primary-teal uppercase tracking-wider">Popular Job Searches</h3>
            <div className="flex flex-wrap gap-2">
              {['Government Jobs Theni', 'Private Jobs Madurai', 'Part Time Vacancies Coimbatore', 'Fresher Opportunities Theni', 'Driver Openings Bodinayakanur', 'Accountant Job Cumbum', 'IT Jobs Periyakulam', 'Textile Sales Jobs Chinnamanur', 'Work From Home Tamil Nadu'].map((k) => (
                <Link key={k} href={`/jobs?q=${encodeURIComponent(k)}`} className="px-2.5 py-1.5 rounded-lg bg-bg-warm border border-border-warm text-text-muted hover:text-primary-teal transition-all font-medium">
                  {k}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-primary-teal uppercase tracking-wider">Popular Business Categories</h3>
            <div className="flex flex-wrap gap-2">
              {['Schools in Theni', 'Hospitals in Cumbum Valley', 'Hotels in Bodinayakanur', 'Retail Stores Periyakulam', 'Textile Wholesalers Chinnamanur', 'Real Estate Agencies Madurai', 'Engineering Colleges Coimbatore', 'Farms in Andipatti'].map((k) => (
                <Link key={k} href={`/businesses?q=${encodeURIComponent(k)}`} className="px-2.5 py-1.5 rounded-lg bg-bg-warm border border-border-warm text-text-muted hover:text-primary-teal transition-all font-medium">
                  {k}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-primary-teal uppercase tracking-wider">Popular Services</h3>
            <div className="flex flex-wrap gap-2">
              {['Electricians in Theni', 'Plumbers in Periyakulam', 'AC Repair Cumbum', 'Mobile Technicians Bodinayakanur', 'Web Designers Madurai', 'Wedding Photographers Coimbatore', 'Home Tutors Andipatti', 'Freelance Writers Tamil Nadu'].map((k) => (
                <Link key={k} href={`/services?q=${encodeURIComponent(k)}`} className="px-2.5 py-1.5 rounded-lg bg-bg-warm border border-border-warm text-text-muted hover:text-primary-teal transition-all font-medium">
                  {k}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-primary-teal uppercase tracking-wider">Primary SEO Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {['Theni Jobs', 'Jobs in Theni', 'Theni District Employment Directory', 'Kambam Valley Job Portal', 'Local Services Tamil Nadu', 'B2B Leads Theni', 'Public Resumes Tamil Nadu'].map((k) => (
                <Link key={k} href={`/jobs?q=${encodeURIComponent(k)}`} className="px-2.5 py-1.5 rounded-lg bg-bg-warm border border-border-warm text-text-muted hover:text-primary-teal transition-all font-medium">
                  {k}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 19. Dark Mega-Footer */}
      <footer className="bg-[#070714] text-gray-300 py-16 w-full text-sm relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
            
            <div className="space-y-4">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">For Candidates</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link href="/seeker/resume" className="hover:text-white transition-colors">Resume Builder</Link></li>
                <li><Link href="/seeker/saved-jobs" className="hover:text-white transition-colors">Saved Jobs</Link></li>
                <li><Link href="/seeker/job-alerts" className="hover:text-white transition-colors">Job Alerts</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">For Employers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/business/post-job" className="hover:text-white transition-colors">Post a Job</Link></li>
                <li><Link href="/employer/talent-search" className="hover:text-white transition-colors">Browse Candidates</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
                <li><Link href="/business/dashboard" className="hover:text-white transition-colors">Employer Portal</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Hiring Rules</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">For Businesses</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/register?type=business" className="hover:text-white transition-colors">Register Business</Link></li>
                <li><Link href="/businesses" className="hover:text-white transition-colors">Explore Showrooms</Link></li>
                <li><Link href="/business/dashboard" className="hover:text-white transition-colors">Business Portal</Link></li>
                <li><Link href="/hub" className="hover:text-white transition-colors">Business Hub</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">VIP Subscriptions</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">For Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/register?type=service" className="hover:text-white transition-colors">Join Marketplace</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Find Plumbers</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Find Electricians</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">AC Technicians</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">All Services</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/academy" className="hover:text-white transition-colors">THENIJOBS Academy</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">Contact Us</h4>
              <ul className="space-y-2.5 text-gray-400">
                <li className="flex gap-2">
                  <MapPin size={16} className="text-accent-saffron flex-shrink-0 mt-0.5" />
                  <span>Theni, Tamil Nadu,<br />India — 625531</span>
                </li>
                <li className="flex gap-2 items-center">
                  <Mail size={16} className="text-accent-saffron flex-shrink-0" />
                  <a href="mailto:support@thenijobs.com" className="hover:text-white transition-colors">support@thenijobs.com</a>
                </li>
                <li className="flex gap-2 items-center">
                  <Globe size={16} className="text-accent-saffron flex-shrink-0" />
                  <a href="https://www.thenijobs.com" className="hover:text-white transition-colors">www.thenijobs.com</a>
                </li>
                <li className="flex gap-2 items-center">
                  <MessageCircle size={16} className="text-accent-saffron flex-shrink-0" />
                  <a href="https://wa.me/917094826586" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp: 7094826586</a>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>
              &copy; {new Date().getFullYear()} THENIJOBS. All rights reserved. Made in India.
            </div>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
              <span>&bull;</span>
              <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
              <span>&bull;</span>
              <Link href="/sitemap.xml" className="hover:text-gray-400 transition-colors">Sitemap</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
