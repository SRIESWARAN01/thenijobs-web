'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Briefcase, Users, Star, ArrowRight, ShieldCheck, 
  Lightbulb, Rocket, Users2, TrendingUp, Award, Heart, Check, 
  Plus, Minus, Globe, FileText, Cpu, HeartHandshake,
  MapPin, ChevronRight, Zap, Laptop, MessageSquare, Shield,
  QrCode, UserPlus, FileDown, Eye
} from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import HomeFooter from '@/components/home/HomeFooter';

type EcosystemNode = 'career' | 'business' | 'freelancer' | 'networking' | 'ai';

export default function AboutPageClient() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<EcosystemNode>('ai');

  const ecosystemNodes = {
    ai: {
      title: 'AI Engine & Trust Score',
      tamil: 'AI & நம்பிக்கை மதிப்பீடு',
      tagline: 'Smart matching, trust profiling, and resume optimization.',
      desc: 'Our proprietary algorithms compute real-time trust profiles for businesses, verify candidate credentials, score resumes automatically, and power our interactive AI Career Coach. This ensures a clean, spam-free marketplace.',
      color: 'from-emerald-500 to-teal-400',
      shadow: 'shadow-emerald-500/20',
      icon: Cpu,
      bullets: ['Automated Candidate ID verification', '0-100% Real-time Trust Score scoring', 'AI Career Coach & resume optimizer']
    },
    career: {
      title: 'Career & Jobs Portal',
      tamil: 'வேலைவாய்ப்பு மையம்',
      tagline: 'Discover, apply, and land your dream job.',
      desc: 'Connect with hundreds of verified companies in Theni and across Tamil Nadu. Build a professional digital resume, set smart job alerts, apply in one click, and track your applications in real-time.',
      color: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/20',
      icon: Briefcase,
      bullets: ['10,000+ active job seeker accounts', 'One-click apply & progress tracking', 'Instant WhatsApp and email alerts']
    },
    business: {
      title: 'Digital Business Identity',
      tamil: 'டிஜிட்டல் தொழில் அடையாளம்',
      tagline: 'Showcase your company, products, and services.',
      desc: 'Every registered company gets a premium, search-engine-optimized profile page, dynamic high-resolution QR codes, product catalogs, service menus, review management, and VCF Save Contact downloads.',
      color: 'from-amber-500 to-orange-400',
      shadow: 'shadow-amber-500/20',
      icon: Building2,
      bullets: ['VCF contact saving directly to phones', '300+ DPI printable ID cards with QR', 'Fully responsive catalog showcase']
    },
    freelancer: {
      title: 'Freelancers & Local Services',
      tamil: 'பிரீலான்ஸர் & சேவைகள்',
      tagline: 'Hire local professionals for custom gigs.',
      desc: 'Find and book local experts in construction, agriculture, IT, textiles, transport, and tutoring. Freelancers can list services, get ratings, negotiate bookings, and grow their direct clientele.',
      color: 'from-purple-500 to-indigo-400',
      shadow: 'shadow-purple-500/20',
      icon: Laptop,
      bullets: ['Direct service provider catalog', 'Booking requesting & review system', 'No-middleman direct phone/WA contact']
    },
    networking: {
      title: 'Professional Networking',
      tamil: 'தொழில்முறை நெட்வொர்க்கிங்',
      tagline: 'Collaborate with entrepreneurs, partners, and startups.',
      desc: 'Follow other businesses, comment on updates, message professionals directly, share company updates, and build long-term business partnerships that drive local B2B growth and economic opportunities.',
      color: 'from-pink-500 to-rose-400',
      shadow: 'shadow-pink-500/20',
      icon: Users2,
      bullets: ['Interactive updates feed & following', 'Secure end-to-end professional chat', 'Local startup & entrepreneur database']
    }
  };

  const impactMetrics = [
    { value: '10,000+', label: 'Active Users', detail: 'Job Seekers & Professionals', icon: Users, color: 'text-cyan-400' },
    { value: '1,500+', label: 'Verified Companies', detail: 'Employers & Partners', icon: Building2, color: 'text-teal-400' },
    { value: '5,000+', label: 'Connections Made', detail: 'Successful Matchmaking', icon: HeartHandshake, color: 'text-purple-400' },
    { value: '15+', label: 'Cities Served', detail: 'Across Tamil Nadu & India', icon: MapPin, color: 'text-amber-400' },
  ];

  const coreValues = [
    {
      title: 'Innovation',
      tamil: 'புதுமை',
      description: 'We continuously develop modern technology that creates real-world impact.',
      icon: Lightbulb,
      color: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/20 hover:border-cyan-400/50 shadow-cyan-500/5'
    },
    {
      title: 'Trust',
      tamil: 'நம்பிக்கை',
      description: 'Transparency, reliability, and user confidence are the foundation of our platform.',
      icon: ShieldCheck,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/20 hover:border-emerald-400/50 shadow-emerald-500/5'
    },
    {
      title: 'Collaboration',
      tamil: 'கூட்டுழைப்பு',
      description: 'Great opportunities are created when people connect and work together.',
      icon: Users2,
      color: 'from-violet-500/20 to-purple-500/20 text-purple-400 border-purple-500/20 hover:border-purple-400/50 shadow-purple-500/5'
    },
    {
      title: 'Growth',
      tamil: 'வளர்ச்சி',
      description: 'We believe every individual and every business deserves the opportunity to grow.',
      icon: TrendingUp,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/20 hover:border-amber-400/50 shadow-amber-500/5'
    },
    {
      title: 'Excellence',
      tamil: 'சிறப்புத்தன்மை',
      description: 'We are committed to delivering high-quality digital experiences.',
      icon: Award,
      color: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/20 hover:border-rose-400/50 shadow-rose-500/5'
    },
    {
      title: 'Community',
      tamil: 'சமூகம்',
      description: 'Success becomes meaningful when it is shared with others.',
      icon: Heart,
      color: 'from-pink-500/20 to-indigo-500/20 text-pink-400 border-pink-500/20 hover:border-pink-400/50 shadow-pink-500/5'
    }
  ];

  const timelineSteps = [
    {
      year: '2024',
      title: 'The Spark & Market Research',
      desc: 'THENIJOBS was conceptualized. We conducted on-the-ground surveys in Theni district, identifying critical gaps in direct employer-candidate communications and local B2B business promotion.',
      status: 'completed'
    },
    {
      year: '2025 (Q1-Q2)',
      title: 'System Design & Build Phase',
      desc: 'Development of the cloud infrastructure, database architecture, and security protocols. Tailored the system with dual-language support (English & Tamil) to make it accessible to local shops.',
      status: 'completed'
    },
    {
      year: '2025 (Q3-Q4)',
      title: 'Beta Testing & Validation',
      desc: 'Launched private beta. Onboarded 500 job seekers and 100 local shops/service providers. Refined digital ID card exports, automated SMS triggers, and optimized mobile loading speeds.',
      status: 'completed'
    },
    {
      year: '2026',
      title: 'Official Production Release',
      desc: 'THENIJOBS goes live to the public! Introducing premium company mini-websites, dynamic QR codes, instant VCF Save Contact downloads, real-time trust profiling, and high-fidelity PDF exports.',
      status: 'current'
    },
    {
      year: 'Future Roadmap',
      title: 'AI Ecosystem & India Expansion',
      desc: 'Introducing automated resume parsing, interactive virtual career coaching, smart B2B matchmaking, and expanding the digital identity ecosystem across India.',
      status: 'upcoming'
    }
  ];

  const faqItems = [
    {
      q: 'What is THENIJOBS?',
      a: 'THENIJOBS is a complete professional digital ecosystem connecting job seekers, employers, freelancers, startups, and entrepreneurs. More than a job portal, it acts as a digital business identity platform.'
    },
    {
      q: 'Is it free to join THENIJOBS?',
      a: 'Yes, basic registration, profile building, and job searching are free. We also offer standard and premium subscription plans for businesses looking to enhance their SEO and digital identity.'
    },
    {
      q: 'How does the Digital ID card work?',
      a: 'Once verified on THENIJOBS, you receive a dynamic high-resolution Digital ID card with a custom QR code. Scanners can access your secure, professional digital portfolio directly. You can save your ID card as a PNG or print-ready PDF.'
    },
    {
      q: 'How does the VCF "Save Contact" feature benefit businesses?',
      a: 'Every verified company page features a "Save Contact" button. When users click this button, the system downloads a pre-formatted vCard (VCF) file. Opening this file instantly saves all company details into their phone contacts list.'
    },
    {
      q: 'Can freelancers use this platform?',
      a: 'Absolutely. Freelancers can register as service providers, list their services, showcase portfolios, and connect with local or global clients directly through the platform.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070714] text-slate-100 selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden font-sans">
      <Header />

      {/* Decorative Grid & Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a12_1px,transparent_1px),linear-gradient(to_bottom,#0f172a12_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[800px] left-[-200px] w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Hero Header Section */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 px-3.5 py-1 text-xs font-semibold text-teal-400 mb-6 shadow-sm backdrop-blur-md"
          >
            <Zap size={12} className="text-teal-400 animate-pulse" /> 
            Professional Digital Ecosystem
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-outfit text-4xl sm:text-7xl font-black tracking-tight leading-[1.05] text-white max-w-5xl mx-auto"
          >
            Building Opportunities. <br />
            Empowering People. <br />
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
              Growing Businesses.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-base sm:text-xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed"
          >
            THENIJOBS is India&apos;s pioneering AI-powered digital ecosystem uniting job seekers, employers, freelancers, and startups into one unified, collaborative networking platform.
          </motion.p>
        </div>
      </section>

      {/* Creative Interactive Ecosystem Hub */}
      <section className="py-20 bg-slate-950/20 border-y border-slate-900 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase text-teal-400 tracking-widest">Interactive Showcase</p>
            <h2 className="mt-1 font-outfit text-3xl sm:text-4xl font-black text-white">
              Explore Our Core Modules
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-xl mx-auto font-medium">
              We integrate five pillars of professional advancement into a single digital environment.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 items-center">
            {/* Interactive Selector Map */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {(Object.keys(ecosystemNodes) as EcosystemNode[]).map((nodeKey) => {
                const node = ecosystemNodes[nodeKey];
                const isSelected = selectedNode === nodeKey;
                const Icon = node.icon;
                return (
                  <button
                    key={nodeKey}
                    onClick={() => setSelectedNode(nodeKey)}
                    className={`relative w-full p-4 rounded-2xl border text-left flex items-center gap-4 transition-all duration-300 group ${
                      isSelected
                        ? 'border-teal-500 bg-slate-900/60 shadow-[0_4px_24px_rgba(20,184,166,0.15)]'
                        : 'border-slate-800 bg-[#070714]/40 hover:border-slate-700'
                    }`}
                  >
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? `bg-gradient-to-br ${node.color} text-slate-950`
                        : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold transition-all ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {node.title}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{node.tamil}</p>
                    </div>
                    <ChevronRight size={16} className={`text-slate-500 transition-transform ${isSelected ? 'translate-x-1 rotate-90 text-teal-400' : ''}`} />
                  </button>
                );
              })}
            </div>

            {/* Showcase Info Card */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedNode}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/40 shadow-2xl backdrop-blur-xl relative overflow-hidden`}
                >
                  {/* Decorative background glow */}
                  <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${ecosystemNodes[selectedNode].color} opacity-5 rounded-full blur-3xl`} />

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-950 bg-gradient-to-br ${ecosystemNodes[selectedNode].color}`}>
                      Core Pillar
                    </span>
                    <span className="text-xs text-slate-400 font-bold">{ecosystemNodes[selectedNode].tamil}</span>
                  </div>

                  <h3 className="font-outfit text-2xl sm:text-3xl font-black text-white mb-1">
                    {ecosystemNodes[selectedNode].title}
                  </h3>
                  <p className="text-sm font-semibold text-slate-400 italic mb-5">
                    {ecosystemNodes[selectedNode].tagline}
                  </p>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 font-medium">
                    {ecosystemNodes[selectedNode].desc}
                  </p>

                  <div className="space-y-2 border-t border-slate-800/80 pt-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Key Features</p>
                    {ecosystemNodes[selectedNode].bullets.map((bullet, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
                        <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-br ${ecosystemNodes[selectedNode].color}`} />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Story / Journey Section */}
      <section className="py-20 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <p className="text-xs font-black uppercase text-teal-400 tracking-widest">Our Genesis</p>
              <h2 className="font-outfit text-3xl sm:text-4xl font-black text-white leading-tight">
                Empowering Career Seekers & Small Businesses
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-400 font-medium">
                THENIJOBS started with a foundational mission: bridging local opportunity gaps. Our team identified a significant bottleneck—job seekers struggled to locate direct career pathways, and small enterprise owners found it difficult to target customers or recruit local talent securely.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-400 font-medium">
                We designed THENIJOBS as an all-in-one ecosystem where job seeking, freelancer catalogs, direct professional networking, and business listings co-exist seamlessly, backed by trust verification mechanisms.
              </p>
              <div className="pt-2">
                <Link href="/register" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-600 px-5 py-3 text-sm font-bold text-white transition-all shadow-md">
                  Create Professional Identity <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/10">
                  <h3 className="font-outfit text-xl font-bold text-teal-400 flex items-center gap-1.5">
                    <Shield size={16} /> Trust Score
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Automated scoring parameters verify physical offices, active registration, contact availability, and reviews.
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/10">
                  <h3 className="font-outfit text-xl font-bold text-cyan-400 flex items-center gap-1.5">
                    <QrCode size={16} /> QR Portfolios
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Instantly export standard high-fidelity printable business card and ID card assets with auto-scannable QR links.
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/10">
                  <h3 className="font-outfit text-xl font-bold text-purple-400 flex items-center gap-1.5">
                    <UserPlus size={16} /> VCF Saves
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Save corporate contact data directly into client/visitor phone contact books in a single tap via vCard formats.
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/10">
                  <h3 className="font-outfit text-xl font-bold text-amber-400 flex items-center gap-1.5">
                    <FileDown size={16} /> PDF Profiles
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Convert company portfolios, product menus, service sheets, and metrics to clean printable PDF formats.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Glimpse */}
      <section className="py-20 bg-slate-950/20 border-t border-slate-900 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Vision Panel */}
            <div className="relative group overflow-hidden rounded-3xl border border-slate-800 bg-[#070714]/40 p-8 hover:border-teal-500/30 transition-all duration-300 shadow-xl">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all" />
              <div className="h-11 w-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-6">
                <Rocket size={20} />
              </div>
              <h3 className="font-outfit text-2xl font-black text-white mb-3">Our Vision</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                To build India&apos;s most secure, high-integrity digital ecosystem connecting job seekers, professionals, freelancers, and businesses. We envision a landscape where recruitment is transparent, company directories are dynamic, and small entrepreneurs command premium digital status.
              </p>
            </div>

            {/* Mission Panel */}
            <div className="relative group overflow-hidden rounded-3xl border border-slate-800 bg-[#070714]/40 p-8 hover:border-blue-500/30 transition-all duration-300 shadow-xl">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                <Cpu size={20} />
              </div>
              <h3 className="font-outfit text-2xl font-black text-white mb-3">Our Mission</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                Our mission is to create a digital home that empowers professionals to seek opportunities, showcase skills, promote products, grow direct leads, and organize networking groups. We combine AI indexing with robust web standards to make professional growth simple and accessible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="py-20 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase text-teal-400 tracking-widest">Milestones</p>
            <h2 className="font-outfit text-3xl sm:text-4xl font-black text-white">
              The Evolution of THENIJOBS
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-lg mx-auto font-medium">
              A historical timeline tracking our progression from design conceptualization to active expansion.
            </p>
          </div>

          <div className="relative max-w-3xl mx-auto">
            {/* Timeline center line */}
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-slate-800 -translate-x-1/2" />

            <div className="space-y-12">
              {timelineSteps.map((step, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div key={idx} className="relative flex flex-col sm:flex-row items-start sm:items-center">
                    {/* Node marker */}
                    <div className="absolute left-4 sm:left-1/2 h-4 w-4 rounded-full border-2 border-slate-700 bg-[#070714] -translate-x-1/2 flex items-center justify-center z-20">
                      <div className={`h-1.5 w-1.5 rounded-full ${step.status === 'current' ? 'bg-teal-400 animate-ping' : step.status === 'completed' ? 'bg-teal-500' : 'bg-slate-700'}`} />
                    </div>

                    {/* Left/Right Text wrapper */}
                    <div className={`w-full sm:w-1/2 pl-10 sm:pl-0 ${isEven ? 'sm:pr-12 sm:text-right' : 'sm:pl-12 sm:order-last'}`}>
                      <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/20 hover:border-slate-700 transition-all duration-300">
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest font-mono">{step.year}</span>
                        <h4 className="text-sm sm:text-base font-black text-white mt-1 mb-2">{step.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">{step.desc}</p>
                      </div>
                    </div>

                    {/* Empty block to fill layout */}
                    <div className="hidden sm:block w-1/2" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Dashboard */}
      <section className="py-20 bg-slate-950/40 border-y border-slate-900 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {impactMetrics.map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl border border-slate-800 bg-[#070714]/30 hover:border-slate-700/60 transition-all flex flex-col items-center text-center">
                  <div className={`h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center ${metric.color} mb-4 border border-slate-800`}>
                    <Icon size={18} />
                  </div>
                  <span className="font-outfit text-3xl sm:text-4xl font-black text-white">{metric.value}</span>
                  <span className="text-xs font-bold text-slate-200 mt-2">{metric.label}</span>
                  <span className="text-[10px] text-slate-500 mt-1 leading-tight font-semibold">{metric.detail}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Meet Leadership */}
      <section className="py-20 relative">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase text-teal-400 tracking-widest">Architects</p>
            <h2 className="font-outfit text-3xl sm:text-4xl font-black text-white">
              Meet Our Leadership
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400">
              The visionaries driving innovation and digital growth at THENIJOBS.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-2">
            {/* CEO Eswaran */}
            <div className="flex flex-col rounded-3xl border border-slate-800 bg-[#070714]/40 p-6 sm:p-8 hover:border-teal-500/25 transition-all shadow-xl group">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shrink-0">
                  <Image
                    src="/eswaran.jpeg"
                    alt="Eswaran P"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="80px"
                  />
                </div>
                <div>
                  <h3 className="font-outfit text-xl font-black text-white leading-tight">Eswaran P</h3>
                  <p className="text-xs font-bold text-teal-400 mt-1">Founder & Chief Executive Officer (CEO)</p>
                </div>
              </div>

              <blockquote className="text-xs sm:text-sm italic text-slate-300 border-l-2 border-teal-500 pl-3 py-1 mb-6 leading-relaxed font-medium">
                &quot;Create opportunities for everyone and help businesses grow through meaningful professional connections.&quot;
              </blockquote>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6 font-medium">
                Eswaran P directs product ideation, strategic alignments, commercial partnerships, and marketing strategies. He is committed to simplifying career search and professional networking via digital innovations.
              </p>

              <div className="mt-auto">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-mono">Areas of Expertise</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['Entrepreneurship', 'Business Strategy', 'Career Development', 'Networking', 'Product Innovation', 'Marketing Strategy', 'Stock Market', 'Leadership'].map((tag) => (
                    <span key={tag} className="text-[9px] font-bold text-slate-300 bg-slate-900/60 border border-slate-800/80 px-2.5 py-1 rounded-xl">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Developer Anbarasan */}
            <div className="flex flex-col rounded-3xl border border-slate-800 bg-[#070714]/40 p-6 sm:p-8 hover:border-blue-500/25 transition-all shadow-xl group">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shrink-0">
                  <Image
                    src="/anbu.jpeg"
                    alt="Anbarasan S"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="80px"
                  />
                </div>
                <div>
                  <h3 className="font-outfit text-xl font-black text-white leading-tight">Anbarasan S</h3>
                  <p className="text-xs font-bold text-blue-400 mt-1">Co-Founder | Director | Software Developer</p>
                </div>
              </div>

              <blockquote className="text-xs sm:text-sm italic text-slate-300 border-l-2 border-blue-500 pl-3 py-1 mb-6 leading-relaxed font-medium">
                &quot;Building secure, reliable, fast, and scalable digital architectures for the future of job ecosystem.&quot;
              </blockquote>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6 font-medium">
                Anbarasan S leads system design, API engineering, artificial intelligence utilities, and mobile integrations. He ensures the platform is optimized for low-latency indexing and real-time synchronization.
              </p>

              <div className="mt-auto">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-mono">Core Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['Software Development', 'Flutter Development', 'AI Systems', 'Firebase Cloud', 'Python', 'SQL Database', 'API Integration', 'Web Tech', 'UI/UX Design'].map((tag) => (
                    <span key={tag} className="text-[9px] font-bold text-slate-300 bg-slate-900/60 border border-slate-800/80 px-2.5 py-1 rounded-xl">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-slate-950/40 border-y border-slate-900 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase text-teal-400 tracking-widest">Standards</p>
            <h2 className="font-outfit text-3xl sm:text-4xl font-black text-white">
              Our Core Values
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400">
              The foundational values guiding our platform mechanics and community services.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coreValues.map((value, idx) => {
              const Icon = value.icon;
              return (
                <div 
                  key={idx} 
                  className={`p-6 rounded-3xl border bg-gradient-to-br transition-all hover:scale-[1.02] duration-300 shadow-sm ${value.color}`}
                >
                  <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                    <Icon size={16} />
                  </div>
                  <h3 className="font-outfit text-lg font-black text-white flex items-center gap-1.5">
                    {value.title}
                    <span className="text-xs font-semibold opacity-70">({value.tamil})</span>
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 relative">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase text-teal-400 tracking-widest">Help Center</p>
            <h2 className="font-outfit text-3xl sm:text-4xl font-black text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 font-medium">
              Common questions answered about the digital features of THENIJOBS.
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index} 
                  className="rounded-2xl border border-slate-800 bg-slate-900/10 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left font-semibold text-slate-200 hover:text-white transition-colors"
                  >
                    <span className="text-sm sm:text-base font-semibold">{faq.q}</span>
                    <span className="ml-2 flex-shrink-0 text-slate-400">
                      {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                    </span>
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-5 pt-0 border-t border-slate-900/60 text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 relative">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 relative z-10">
          <div className="relative rounded-3xl overflow-hidden border border-teal-500/20 bg-gradient-to-r from-teal-950/20 via-[#070714]/80 to-slate-900/20 p-8 sm:p-12 text-center shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.08),transparent_70%)]" />
            <h2 className="font-outfit text-3xl sm:text-4xl font-black text-white relative z-10">
              Join THENIJOBS Today
            </h2>
            <p className="mt-4 text-xs sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed relative z-10 font-medium">
              Create your corporate identity card, verify your trust status, post listings, download VCF/PDF assets, and connect with Indian professionals.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-600 px-6 py-3 text-sm font-bold text-white transition-all shadow-lg">
                Create Free Account
              </Link>
              <Link href="/jobs" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#070714]/40 hover:bg-slate-900/60 px-6 py-3 text-sm font-bold text-slate-200 transition-all">
                Browse Jobs & Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HomeFooter />
      <BottomNav />
    </div>
  );
}
