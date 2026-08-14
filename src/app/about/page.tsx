'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import FloatingWhatsApp from '@/components/ui/FloatingWhatsApp';
import {
  Sparkles, ShieldCheck, Briefcase, Building2, Wrench, Users,
  CheckCircle2, ArrowRight, ChevronDown, ChevronRight, Award, Target,
  Heart, Lightbulb, TrendingUp, HelpCircle, MapPin, Phone, Mail, QrCode, FileText, Download, Check
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from '@/components/ui/BrandIcons';

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
      icon: Sparkles,
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
      image: '/images/eswaran-p.png',
      quote: 'Create opportunities for everyone and help businesses grow through meaningful professional connections.',
      desc: 'Eswaran P directs product ideation, strategic alignments, commercial partnerships, and marketing strategies. He is committed to simplifying career search and professional networking via digital innovations.',
      expertise: [
        'Entrepreneurship', 'Business Strategy', 'Career Development',
        'Networking', 'Product Innovation', 'Marketing Strategy',
        'Stock Market', 'Leadership',
      ],
      gradient: 'from-blue-600 to-indigo-700',
    },
    {
      name: 'Anbarasan S',
      role: 'Co-Founder | Director | Software Developer',
      image: '/images/anbarasan-s.png',
      quote: 'Building secure, reliable, fast, and scalable digital architectures for the future of job ecosystem.',
      desc: 'Anbarasan S leads system design, API engineering, artificial intelligence utilities, and mobile integrations. He ensures the platform is optimized for low-latency indexing and real-time synchronization.',
      expertise: [
        'Software Development', 'Flutter Development', 'AI Systems',
        'Firebase Cloud', 'Python', 'SQL Database',
        'API Integration', 'Web Tech', 'UI/UX Design',
      ],
      gradient: 'from-purple-600 to-indigo-700',
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
      q: 'How does the Digital ID card work?',
      a: 'Your profile automatically generates a standard high-fidelity printable Digital ID card equipped with a unique auto-scannable QR link pointing to your digital portfolio.',
    },
    {
      q: 'How does the VCF "Save Contact" feature benefit businesses?',
      a: 'Visitors can save your corporate contact details directly into their phone address book with a single tap, making customer communication seamless.',
    },
    {
      q: 'Can freelancers use this platform?',
      a: 'Absolutely! Freelancers can showcase portfolios, list specialized services, receive direct lead inquiries, and export printable PDF service sheets.',
    },
  ];

  const currentPillar = pillars[activePillar];

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans pb-24">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white rounded-b-[3rem] overflow-hidden shadow-xl">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-blue-100 backdrop-blur-md">
            <Sparkles size={14} className="text-amber-400" /> About THENIJOBS
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-sans leading-tight">
            Building Opportunities.<br />
            Empowering People.<br />
            <span className="text-emerald-400">Growing Businesses.</span>
          </h1>

          <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
            THENIJOBS is India&apos;s pioneering AI-powered digital ecosystem uniting job seekers, employers, freelancers, and startups into one unified, collaborative networking platform.
          </p>

          <div className="pt-4 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/register"
              className="px-6 py-3 rounded-2xl bg-white text-blue-800 font-bold text-xs sm:text-sm hover:bg-blue-50 transition-all shadow-md flex items-center gap-2"
            >
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link
              href="/jobs"
              className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all"
            >
              Browse Jobs & Services
            </Link>
          </div>
        </div>
      </section>

      {/* Key Metrics Counter Bar */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-md grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">10,000+</div>
            <p className="text-xs font-bold text-gray-900 mt-1">Active Users</p>
            <p className="text-[10px] text-gray-400">Job Seekers & Professionals</p>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">1,500+</div>
            <p className="text-xs font-bold text-gray-900 mt-1">Verified Companies</p>
            <p className="text-[10px] text-gray-400">Employers & Partners</p>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">5,000+</div>
            <p className="text-xs font-bold text-gray-900 mt-1">Connections Made</p>
            <p className="text-[10px] text-gray-400">Successful Matchmaking</p>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-600">15+</div>
            <p className="text-xs font-bold text-gray-900 mt-1">Cities Served</p>
            <p className="text-[10px] text-gray-400">Across Tamil Nadu & India</p>
          </div>
        </div>
      </section>

      {/* 5 Core Pillars Interactive Showcase */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Interactive Showcase</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Explore Our Core Modules
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
            We integrate five pillars of professional advancement into a single digital environment.
          </p>
        </div>

        {/* Pillar Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
          {pillars.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setActivePillar(idx)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                activePillar === idx
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p.titleEn}
            </button>
          ))}
        </div>

        {/* Selected Pillar Content Box */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <currentPillar.icon size={24} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">{currentPillar.titleTa}</span>
              <h3 className="text-lg font-bold text-gray-900">{currentPillar.titleEn}</h3>
              <p className="text-xs font-semibold text-gray-500">{currentPillar.tagline}</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed pt-2 border-t border-gray-100">
            {currentPillar.desc}
          </p>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Key Features</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {currentPillar.features.map((feat, i) => (
                <div key={i} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-medium text-gray-800 flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Genesis */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16">
        <div className="bg-gradient-to-br from-gray-900 to-blue-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Our Genesis</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Empowering Career Seekers & Small Businesses
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            THENIJOBS started with a foundational mission: bridging local opportunity gaps. Our team identified a significant bottleneck—job seekers struggled to locate direct career pathways, and small enterprise owners found it difficult to target customers or recruit local talent securely.
          </p>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            We designed THENIJOBS as an all-in-one ecosystem where job seeking, freelancer catalogs, direct professional networking, and business listings co-exist seamlessly, backed by trust verification mechanisms.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-200 text-xs">
            <div className="p-3 bg-gray-100 rounded-2xl border border-gray-200">
              <span className="font-bold text-blue-300 block mb-1">Trust Score</span>
              <p className="text-[11px] text-gray-400">Automated verification parameters</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-2xl border border-gray-200">
              <span className="font-bold text-emerald-300 block mb-1">QR Portfolios</span>
              <p className="text-[11px] text-gray-400">Printable cards with QR links</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-2xl border border-gray-200">
              <span className="font-bold text-amber-300 block mb-1">VCF Saves</span>
              <p className="text-[11px] text-gray-400">One-tap contact book export</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-2xl border border-gray-200">
              <span className="font-bold text-purple-300 block mb-1">PDF Profiles</span>
              <p className="text-[11px] text-gray-400">Convert portfolios to PDF</p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Target size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Our Vision</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            To build India&apos;s most secure, high-integrity digital ecosystem connecting job seekers, professionals, freelancers, and businesses. We envision a landscape where recruitment is transparent, company directories are dynamic, and small entrepreneurs command premium digital status.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Our Mission</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Our mission is to create a digital home that empowers professionals to seek opportunities, showcase skills, promote products, grow direct leads, and organize networking groups. We combine AI indexing with robust web standards to make professional growth simple and accessible.
          </p>
        </div>
      </section>

      {/* Milestones / Evolution Timeline */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Milestones</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            The Evolution of THENIJOBS
          </h2>
        </div>

        <div className="space-y-4">
          {milestones.map((m, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-start">
              <span className="px-3.5 py-1.5 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shrink-0">
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
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Architects</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Meet Our Leadership
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">The visionaries driving innovation and digital growth at THENIJOBS.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {leadership.map((leader, i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  {leader.image ? (
                    <img
                      src={leader.image}
                      alt={leader.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover object-top border-2 border-gray-100 shadow-md bg-gray-100 shrink-0"
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

                <blockquote className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs italic text-blue-900">
                  &ldquo;{leader.quote}&rdquo;
                </blockquote>

                <p className="text-xs text-gray-600 leading-relaxed">{leader.desc}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2">
                <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Areas of Expertise</h4>
                <div className="flex flex-wrap gap-1.5">
                  {leader.expertise.map((exp, j) => (
                    <span key={j} className="px-2.5 py-1 rounded-xl bg-gray-100 text-gray-800 text-[10px] font-semibold">
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
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Standards</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Our Core Values
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {values.map((v, i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <v.icon size={18} />
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
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Help Center</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-gray-900 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
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
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Join THENIJOBS Today
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-lg mx-auto">
            Create your corporate identity card, verify your trust status, post listings, download VCF/PDF assets, and connect with Indian professionals.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/register"
              className="px-6 py-3 rounded-2xl bg-white text-blue-800 font-bold text-xs sm:text-sm hover:bg-blue-50 transition-all shadow-md"
            >
              Create Free Account
            </Link>
            <Link
              href="/jobs"
              className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all"
            >
              Browse Jobs & Services
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Details */}
      <footer className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 border-t border-gray-200 mt-16 space-y-8 text-xs text-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="THENIJOBS" className="h-7 w-auto object-contain" />
              <span className="font-extrabold text-sm text-gray-900">THENIJOBS</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">Search, connect, hire and grow. Theni jobs and business discovery platform.</p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">For Job Seekers</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/jobs" className="hover:underline">Browse Jobs</Link></li>
              <li><Link href="/seeker/profile" className="hover:underline">Create Profile</Link></li>
              <li><Link href="/seeker/resume" className="hover:underline">Upload Resume</Link></li>
              <li><Link href="/seeker/job-alerts" className="hover:underline">Job Alerts</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">For Employers</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/employer/post-job" className="hover:underline">Post a Job</Link></li>
              <li><Link href="/employer/company-profile" className="hover:underline">Register Company</Link></li>
              <li><Link href="/employer/talent-search" className="hover:underline">Browse Candidates</Link></li>
              <li><Link href="/pricing" className="hover:underline">Pricing Plans</Link></li>
            </ul>
          </div>

          <div className="space-y-1 text-[11px]">
            <h4 className="font-bold text-gray-900 mb-2">Office Address</h4>
            <p>North Street, A.M. Patty,</p>
            <p>Uthamapalayam, Theni District,</p>
            <p>Tamil Nadu, India.</p>
            <p className="pt-2 font-bold text-blue-600">+91 93605 19460</p>
            <p className="font-bold text-blue-600">+91 70948 26886 | +91 70948 26586</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-2">
          <span>Copyright 2026 THENIJOBS. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/cookies" className="hover:underline">Cookies</Link>
          </div>
        </div>
      </footer>

      <BottomNav />
      <FloatingWhatsApp />
    </main>
  );
}
