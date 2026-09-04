'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import FloatingWhatsApp from '@/components/ui/FloatingWhatsApp';
import {
  Info, BrainCircuit, ShieldCheck, Briefcase, Building2, Wrench, Users,
  CheckCircle2, ArrowRight, ChevronDown, ChevronUp, Award, Target,
  Heart, Lightbulb, TrendingUp, QrCode, FileText, Download, Quote, Link2, MapPin,
} from 'lucide-react';

const PILLAR_STYLES: Record<string, { bg: string; text: string; solid: string; accent: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', solid: 'bg-blue-600 border-blue-600', accent: 'border-l-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', solid: 'bg-emerald-600 border-emerald-600', accent: 'border-l-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', solid: 'bg-amber-600 border-amber-600', accent: 'border-l-amber-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', solid: 'bg-purple-600 border-purple-600', accent: 'border-l-purple-600' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', solid: 'bg-teal-600 border-teal-600', accent: 'border-l-teal-600' },
};

export default function AboutPage() {
  const [activePillar, setActivePillar] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const pillars = [
    {
      id: 'ai-trust',
      titleEn: 'AI Engine & Trust Score',
      titleTa: 'AI & நம்பிக்கை மதிப்பீடு',
      tagline: 'Smart matching, trust profiling, and resume optimization.',
      desc: 'Our proprietary algorithms compute real-time trust profiles for businesses, verify candidate credentials, score resumes automatically, and power our interactive AI Career Coach. This ensures a clean, spam-free marketplace.',
      features: [
        'Automated Candidate ID verification',
        '0-100% Real-time Trust Score scoring',
        'AI Career Coach & resume optimizer',
      ],
      icon: BrainCircuit,
      color: 'blue',
    },
    {
      id: 'jobs-portal',
      titleEn: 'Career & Jobs Portal',
      titleTa: 'வேலைவாய்ப்பு மையம்',
      tagline: 'Direct local employer to candidate connections.',
      desc: 'Connect with top local employers in Theni and across Tamil Nadu. Streamlined application tracking, interview scheduling, and instant job alerts.',
      features: [
        'Verified local job listings',
        'One-tap candidate applications',
        'Real-time WhatsApp & email alerts',
      ],
      icon: Briefcase,
      color: 'emerald',
    },
    {
      id: 'business-identity',
      titleEn: 'Digital Business Identity',
      titleTa: 'டிஜிட்டல் தொழில் அடையாளம்',
      tagline: 'Mini portfolio websites with dynamic QR codes.',
      desc: 'Equip your local business with a professional mini-website, complete with services list, customer reviews, photo gallery, and auto-scannable QR cards.',
      features: [
        'Custom company slug & domain link',
        'Auto-generated Digital ID Cards & QR codes',
        'One-tap vCard Save Contact integration',
      ],
      icon: Building2,
      color: 'amber',
    },
    {
      id: 'freelancers',
      titleEn: 'Freelancers & Local Services',
      titleTa: 'பிரீலான்ஸர் & சேவைகள்',
      tagline: 'Showcase skills & catalog local services.',
      desc: 'A dedicated marketplace for freelancers, skilled workers, and local service professionals to showcase portfolios and receive direct inquiries.',
      features: [
        'Direct customer lead inquiries',
        'Printable PDF service catalogs',
        'Verified client ratings & reviews',
      ],
      icon: Wrench,
      color: 'purple',
    },
    {
      id: 'networking',
      titleEn: 'Professional Networking',
      titleTa: 'தொழில்முறை நெட்வொர்க்கிங்',
      tagline: 'Collaborative networking ecosystem.',
      desc: 'Uniting job seekers, employers, freelancers, and startups into one collaborative ecosystem to foster partnerships and career growth.',
      features: [
        'Direct B2B networking channels',
        'Local talent search directory',
        'Community event notifications',
      ],
      icon: Users,
      color: 'teal',
    },
  ];

  const metrics = [
    { icon: Users, value: '10,000+', label: 'Active Users', sub: 'Job Seekers & Professionals', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Building2, value: '1,500+', label: 'Verified Companies', sub: 'Employers & Partners', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Link2, value: '5,000+', label: 'Connections Made', sub: 'Successful Matchmaking', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: MapPin, value: '15+', label: 'Cities Served', sub: 'Across Tamil Nadu & India', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const milestones = [
    {
      year: '2024',
      title: 'The Spark & Market Research',
      desc: 'THENIJOBS was conceptualized. We conducted on-the-ground surveys in Theni district, identifying critical gaps in direct employer-candidate communications and local B2B business promotion.',
    },
    {
      year: '2025 (Q1-Q2)',
      title: 'System Design & Build Phase',
      desc: 'Development of the cloud infrastructure, database architecture, and security protocols. Tailored the system with dual-language support (English & Tamil) to make it accessible to local shops.',
    },
    {
      year: '2025 (Q3-Q4)',
      title: 'Beta Testing & Validation',
      desc: 'Launched private beta. Onboarded 500 job seekers and 100 local shops/service providers. Refined digital ID card exports, automated SMS triggers, and optimized mobile loading speeds.',
    },
    {
      year: '2026',
      title: 'Official Production Release',
      desc: 'THENIJOBS goes live to the public! Introducing premium company mini-websites, dynamic QR codes, instant VCF Save Contact downloads, real-time trust profiling, and high-fidelity PDF exports.',
    },
  ];

  const leadership = [
    {
      name: 'Eswaran P',
      role: 'Founder & Chief Executive Officer (CEO)',
      image: '/images/eswaran-p.webp',
      quote: 'Create opportunities for everyone and help businesses grow through meaningful professional connections.',
      desc: 'Eswaran P directs product ideation, strategic alignments, commercial partnerships, and marketing strategies. He is committed to simplifying career search and professional networking via digital innovations.',
      expertise: [
        'Entrepreneurship', 'Business Strategy', 'Career Development',
        'Networking', 'Product Innovation', 'Marketing Strategy',
        'Stock Market', 'Leadership',
      ],
      gradient: 'from-blue-600 to-indigo-700',
      ring: 'ring-blue-100',
    },
    {
      name: 'Anbarasan S',
      role: 'Co-Founder | Director | Software Developer',
      image: '/images/anbarasan-s.webp',
      quote: 'Building secure, reliable, fast, and scalable digital architectures for the future of job ecosystem.',
      desc: 'Anbarasan S leads system design, API engineering, artificial intelligence utilities, and mobile integrations. He ensures the platform is optimized for low-latency indexing and real-time synchronization.',
      expertise: [
        'Software Development', 'Flutter Development', 'AI Systems',
        'Firebase Cloud', 'Python', 'SQL Database',
        'API Integration', 'Web Tech', 'UI/UX Design',
      ],
      gradient: 'from-purple-600 to-indigo-700',
      ring: 'ring-purple-100',
    },
  ];

  const values = [
    { titleEn: 'Innovation', titleTa: 'புதுமை', desc: 'We continuously develop modern technology that creates real-world impact.', icon: Lightbulb },
    { titleEn: 'Trust', titleTa: 'நம்பிக்கை', desc: 'Transparency, reliability, and user confidence are the foundation of our platform.', icon: ShieldCheck },
    { titleEn: 'Collaboration', titleTa: 'கூட்டுழைப்பு', desc: 'Great opportunities are created when people connect and work together.', icon: Users },
    { titleEn: 'Growth', titleTa: 'வளர்ச்சி', desc: 'We believe every individual and every business deserves the opportunity to grow.', icon: TrendingUp },
    { titleEn: 'Excellence', titleTa: 'சிறப்புத்தன்மை', desc: 'We are committed to delivering high-quality digital experiences.', icon: Award },
    { titleEn: 'Community', titleTa: 'சமூகம்', desc: 'Success becomes meaningful when it is shared with others.', icon: Heart },
  ];

  const faqs = [
    {
      q: 'What is THENIJOBS?',
      a: 'THENIJOBS is India’s pioneering AI-powered digital ecosystem uniting job seekers, employers, freelancers, and startups into one unified, collaborative networking platform.',
    },
    {
      q: 'Is it free to join THENIJOBS?',
      a: 'Yes! Basic registration is completely free for both job seekers and local businesses. We also offer affordable annual plans starting at ₹40/month for advanced features.',
    },
    {
      q: 'Can freelancers use this platform?',
      a: 'Absolutely! Freelancers can showcase portfolios, list specialized services, receive direct lead inquiries, and export printable PDF service sheets.',
    },
  ];

  const currentPillar = pillars[activePillar];
  const currentStyle = PILLAR_STYLES[currentPillar.color];

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans pb-24 lg:pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />

      {/* Hero — compact, no redundant top offset (Header already reserves its own 64px spacer) */}
      <section className="relative isolate overflow-hidden pt-[clamp(1.25rem,4dvh,2.5rem)] pb-[clamp(2.75rem,7dvh,4.5rem)] rounded-b-[2rem] shadow-lg">
        <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(160deg, #1D4ED8 0%, #1E3A8A 55%, #312E81 100%)' }} aria-hidden />
        <div className="absolute inset-0 -z-10 opacity-40" style={{
          backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.12) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(16,185,129,0.18) 0%, transparent 50%)'
        }} aria-hidden />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-blue-100 backdrop-blur-sm">
            <Info size={13} className="text-amber-300" fill="currentColor" fillOpacity={0.3} strokeWidth={2.25} /> About THENIJOBS
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Building Opportunities. Empowering People.{' '}
            <span className="text-emerald-400">Growing Businesses.</span>
          </h1>

          <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
            THENIJOBS is India&apos;s pioneering AI-powered digital ecosystem uniting job seekers, employers, freelancers, and startups into one unified, collaborative networking platform.
          </p>

          <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white text-blue-800 font-bold text-xs sm:text-sm hover:bg-blue-50 transition-all shadow-md"
            >
              Create Free Account <ArrowRight size={14} />
            </Link>
            <Link
              href="/jobs"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all"
            >
              Browse Jobs &amp; Services
            </Link>
          </div>
        </div>
      </section>

      {/* Key Metrics Counter Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-md grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map(({ icon: Icon, value, label, sub, color, bg }) => (
            <div key={label} className="text-center">
              <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center mx-auto mb-1.5`}>
                <Icon size={17} strokeWidth={2.25} />
              </div>
              <div className={`text-xl sm:text-2xl font-extrabold ${color}`}>{value}</div>
              <p className="text-xs font-bold text-gray-900 mt-0.5">{label}</p>
              <p className="text-[10px] text-gray-400">{sub}</p>
            </div>
          ))}
        </div>

        {/* 5 Core Pillars Interactive Showcase */}
        <section className="pt-[clamp(2rem,5dvh,3rem)] space-y-4">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Interactive Showcase</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Explore Our Core Modules
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
              We integrate five pillars of professional advancement into a single digital environment.
            </p>
          </div>

          {/* Pillar Tabs — horizontal scroll on mobile only; wraps cleanly on sm+ so nothing gets cut off */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 justify-start sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center sm:overflow-visible">
            {pillars.map((p, idx) => {
              const TabIcon = p.icon;
              const style = PILLAR_STYLES[p.color];
              const isActive = activePillar === idx;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePillar(idx)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                    isActive ? `${style.solid} text-white shadow-sm` : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <TabIcon size={13} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.25 : 0} strokeWidth={2} />
                  {p.titleEn}
                </button>
              );
            })}
          </div>

          {/* Selected Pillar Content Box */}
          <div className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${currentStyle.accent} p-4 sm:p-5 shadow-sm space-y-3 transition-all`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl ${currentStyle.bg} ${currentStyle.text} flex items-center justify-center shrink-0`}>
                <currentPillar.icon size={19} strokeWidth={2.25} />
              </div>
              <div>
                <span className={`text-[10px] font-bold ${currentStyle.text} uppercase tracking-wider`}>{currentPillar.titleTa}</span>
                <h3 className="text-base font-bold text-gray-900 leading-tight">{currentPillar.titleEn}</h3>
                <p className="text-[11px] font-semibold text-gray-500">{currentPillar.tagline}</p>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed pt-2 border-t border-gray-100">
              {currentPillar.desc}
            </p>

            <div className="space-y-1.5 pt-1">
              <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Key Features</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {currentPillar.features.map((feat, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-gray-800 flex items-start gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.25} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Our Genesis */}
        <section className="pt-[clamp(2.5rem,7dvh,4rem)]">
          <div className="bg-gradient-to-br from-gray-900 to-blue-950 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Our Genesis</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Empowering Career Seekers &amp; Small Businesses
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              THENIJOBS started with a foundational mission: bridging local opportunity gaps. Our team identified a significant bottleneck&mdash;job seekers struggled to locate direct career pathways, and small enterprise owners found it difficult to target customers or recruit local talent securely.
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              We designed THENIJOBS as an all-in-one ecosystem where job seeking, freelancer catalogs, direct professional networking, and business listings co-exist seamlessly, backed by trust verification mechanisms.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs">
              {[
                { icon: ShieldCheck, label: 'Trust Score', desc: 'Automated verification parameters', color: 'text-blue-300' },
                { icon: QrCode, label: 'QR Portfolios', desc: 'Printable cards with QR links', color: 'text-emerald-300' },
                { icon: Download, label: 'VCF Saves', desc: 'One-tap contact book export', color: 'text-amber-300' },
                { icon: FileText, label: 'PDF Profiles', desc: 'Convert portfolios to PDF', color: 'text-purple-300' },
              ].map(({ icon: Icon, label, desc, color }) => (
                <div key={label} className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <Icon size={16} className={`${color} mb-1.5`} strokeWidth={2.25} />
                  <span className={`font-bold block mb-0.5 ${color}`}>{label}</span>
                  <p className="text-[11px] text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="pt-[clamp(2.5rem,7dvh,4rem)] grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target size={22} strokeWidth={2.25} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Our Vision</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              To build India&apos;s most secure, high-integrity digital ecosystem connecting job seekers, professionals, freelancers, and businesses. We envision a landscape where recruitment is transparent, company directories are dynamic, and small entrepreneurs command premium digital status.
            </p>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={22} strokeWidth={2.25} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Our Mission</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Our mission is to create a digital home that empowers professionals to seek opportunities, showcase skills, promote products, grow direct leads, and organize networking groups. We combine AI indexing with robust web standards to make professional growth simple and accessible.
            </p>
          </div>
        </section>

        {/* Milestones / Evolution Timeline */}
        <section className="pt-[clamp(2.5rem,7dvh,4rem)] space-y-5">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Milestones</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              The Evolution of THENIJOBS
            </h2>
          </div>

          <div className="relative space-y-4 sm:pl-2">
            <div className="hidden sm:block absolute left-[38px] top-3 bottom-3 w-0.5 bg-blue-100" aria-hidden />
            {milestones.map((m, idx) => (
              <div key={idx} className="relative bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-start">
                <span className="relative z-10 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs shrink-0 shadow-sm">
                  {m.year}
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">{m.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Leadership / Architects Section */}
        <section className="pt-[clamp(2.5rem,7dvh,4rem)] space-y-5">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Architects</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Meet Our Leadership
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">The visionaries driving innovation and digital growth at THENIJOBS.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {leadership.map((leader, i) => (
              <div key={i} className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    {leader.image ? (
                      <img
                        src={leader.image}
                        alt={leader.name}
                        width={96}
                        height={96}
                        loading="lazy"
                        decoding="async"
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover object-top ring-4 ${leader.ring} shadow-md bg-gray-100 shrink-0`}
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${leader.gradient} text-white font-bold text-xl flex items-center justify-center shadow-md shrink-0`}>
                        {leader.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{leader.name}</h3>
                      <p className="text-xs font-bold text-blue-600">{leader.role}</p>
                    </div>
                  </div>

                  <blockquote className="relative p-3 pl-4 bg-blue-50/60 rounded-xl border border-blue-100 text-xs italic text-blue-900">
                    <Quote size={13} className="absolute -top-1.5 -left-1.5 text-blue-300 bg-blue-50 rounded-full p-0.5" fill="currentColor" fillOpacity={0.15} />
                    &ldquo;{leader.quote}&rdquo;
                  </blockquote>

                  <p className="text-xs text-gray-600 leading-relaxed">{leader.desc}</p>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Areas of Expertise</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {leader.expertise.map((exp, j) => (
                      <span key={j} className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-[10px] font-semibold">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Our Core Values */}
        <section className="pt-[clamp(2.5rem,7dvh,4rem)] space-y-5">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Standards</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Our Core Values
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {values.map((v, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <v.icon size={18} strokeWidth={2.25} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                    {v.titleEn} <span className="text-blue-600 font-normal">({v.titleTa})</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="pt-[clamp(2.5rem,7dvh,4rem)] max-w-2xl mx-auto w-full">
          <div className="text-center space-y-1 mb-5">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Help Center</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className={`bg-white rounded-2xl border overflow-hidden transition-all ${openFaq === idx ? 'border-blue-200 shadow-sm' : 'border-gray-100 shadow-xs'}`}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-gray-900 flex items-center justify-between gap-3"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? <ChevronUp size={16} className="text-blue-600 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="pt-[clamp(2.5rem,7dvh,4rem)]">
          <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center text-white shadow-xl"
            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Join THENIJOBS Today
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-lg mx-auto mt-2">
              Create your corporate identity card, verify your trust status, post listings, download VCF/PDF assets, and connect with Indian professionals.
            </p>
            <div className="pt-5 flex items-center justify-center gap-2.5 flex-wrap">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs sm:text-sm hover:bg-blue-50 transition-all shadow-sm"
              >
                Create Free Account <ArrowRight size={14} />
              </Link>
              <Link
                href="/jobs"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-xs sm:text-sm transition-all"
              >
                Browse Jobs &amp; Services
              </Link>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
      <FloatingWhatsApp />
    </main>
  );
}
