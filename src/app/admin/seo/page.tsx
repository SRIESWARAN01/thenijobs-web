'use client';

import { useState, useMemo } from 'react';
import {
  Search, Globe, TrendingUp, Sparkles, CheckCircle2,
  AlertTriangle, ShieldCheck, Star, ExternalLink, RefreshCw,
  Plus, Trash2, Edit3, ArrowUpRight, Copy, Check, Filter,
  Building2, Briefcase, UserCheck, Zap, Layers, BarChart2
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { useToast } from '@/contexts/ToastContext';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { slugifyCompany } from '@/lib/companySlug';

// High-volume keywords tailored to Theni District and Tamil Nadu industry hubs
const HIGH_IMPACT_KEYWORDS = {
  general: [
    'Jobs in Theni', 'Theni Vacancies', 'Urgent Hiring Theni', 'Tamil Nadu Jobs',
    'Career in Theni', 'Theni Walkin Interview', 'Full Time Jobs Theni', 'Part Time Jobs Theni'
  ],
  digital_marketing: [
    'Digital Marketing Specialist', 'SEO Expert Theni', 'Social Media Manager',
    'Google Ads Specialist', 'Content Creator Tamil Nadu', 'Performance Marketing', 'Lead Generation'
  ],
  tech_software: [
    'React Developer', 'Full Stack Engineer', 'Next.js Developer', 'Node.js Backend',
    'Web Designer', 'UI UX Designer', 'Software Trainee Theni', 'IT Jobs Madurai Theni'
  ],
  sales_retail: [
    'Store Manager Theni', 'Retail Cashier', 'Billing Executive', 'Showroom Sales Staff',
    'B2B Sales Representative', 'Marketing Executive Cumbum', 'Field Sales Officer'
  ],
  manufacturing_textile: [
    'Garment Quality Checker', 'Textile Mill Supervisor', 'Production Manager Andipatti',
    'Machine Operator', 'Maintenance Engineer', 'Spinning Supervisor'
  ],
  agriculture_farming: [
    'Cardamom Estate Supervisor', 'Agri Business Manager', 'Farm Operations Coordinator',
    'Spices Export Coordinator Bodinayakanur', 'Grapes Vineyard Manager'
  ],
  healthcare: [
    'Staff Nurse Theni', 'Hospital Lab Technician', 'Pharmacist Chinnamanur',
    'Medical Representative', 'Duty Doctor', 'Clinic Receptionist'
  ]
};

export default function AdminSeoManagementPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'portfolios' | 'companies' | 'jobs' | 'trends'>('portfolios');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIndexed, setFilterIndexed] = useState<'all' | 'indexed' | 'noindex'>('all');
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [customKeyword, setCustomKeyword] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Firestore collections
  const { data: portfolios, loading: portLoading, refresh: refreshPortfolios } = useCollection<any>('portfolioSites');
  const { data: companies, loading: compLoading, refresh: refreshCompanies } = useCollection<any>('companies');
  const { data: jobs, loading: jobsLoading, refresh: refreshJobs } = useCollection<any>('jobs');

  // Calculate SEO Health Metrics
  const stats = useMemo(() => {
    const totalPort = portfolios.length || 0;
    const indexedPort = portfolios.filter(p => p.googleIndex !== false && p.status === 'published').length;

    const totalComp = companies.length || 0;
    const verifiedComp = companies.filter(c => c.verificationStatus === 'verified').length;

    const totalJobs = jobs.length || 0;
    const activeJobs = jobs.filter(j => j.isActive || j.status === 'active').length;

    const healthScore = totalPort > 0 ? Math.round((indexedPort / totalPort) * 100) : 92;

    return { totalPort, indexedPort, totalComp, verifiedComp, totalJobs, activeJobs, healthScore };
  }, [portfolios, companies, jobs]);

  // SEO Score calculation helper for individual entity
  const getSeoScore = (item: any, type: 'portfolio' | 'company' | 'job') => {
    let score = 0;
    if (type === 'portfolio') {
      if (item.customUrl) score += 20;
      if (item.seo?.title && item.seo.title.length > 15) score += 25;
      if (item.seo?.description && item.seo.description.length > 50) score += 25;
      if (item.seo?.keywords && item.seo.keywords.length >= 3) score += 20;
      if (item.googleIndex !== false) score += 10;
    } else if (type === 'company') {
      if (item.name) score += 20;
      if (item.district) score += 20;
      if (item.category) score += 20;
      if (item.description && item.description.length > 40) score += 20;
      if (item.verificationStatus === 'verified') score += 20;
    } else {
      if (item.title) score += 25;
      if (item.district) score += 25;
      if (item.skills && item.skills.length >= 2) score += 25;
      if (item.description && item.description.length > 50) score += 25;
    }
    return Math.min(100, score);
  };

  // Find missing high-impact keywords for a given entity
  const getSuggestedKeywords = (item: any) => {
    const existingKeywords = (item.seo?.keywords || item.skills || item.services || []).map((k: string) => k.toLowerCase());
    const pool = [
      ...HIGH_IMPACT_KEYWORDS.general,
      ...HIGH_IMPACT_KEYWORDS.digital_marketing,
      ...HIGH_IMPACT_KEYWORDS.tech_software,
      ...HIGH_IMPACT_KEYWORDS.sales_retail,
      ...HIGH_IMPACT_KEYWORDS.agriculture_farming,
      ...HIGH_IMPACT_KEYWORDS.healthcare,
      ...HIGH_IMPACT_KEYWORDS.manufacturing_textile
    ];

    const missing = pool.filter(kw => !existingKeywords.some((e: string) => e.includes(kw.toLowerCase()) || kw.toLowerCase().includes(e)));
    return missing.slice(0, 8);
  };

  // 1-Click Auto SEO Boost & Keyword Injection
  const handleAutoBoostSeo = async (item: any, collectionName: string) => {
    setOptimizing(true);
    try {
      const suggested = getSuggestedKeywords(item).slice(0, 4);
      const existingKw = item.seo?.keywords || [];
      const updatedKeywords = Array.from(new Set([...existingKw, ...suggested]));

      const defaultTitle = item.branding?.companyName || item.name || item.title || 'Professional';
      const district = item.district || 'Theni';
      const role = item.tagline || item.category || 'Career Specialist';

      const seoTitle = item.seo?.title || `${defaultTitle} - ${role} in ${district} | Official Profile`;
      const seoDesc = item.seo?.description || `Explore verified ${role} services, portfolio, and contact details of ${defaultTitle} in ${district}, Tamil Nadu on THENIJOBS.`;

      await updateDoc(doc(db, collectionName, item.id), {
        googleIndex: true,
        'seo.title': seoTitle,
        'seo.description': seoDesc,
        'seo.keywords': updatedKeywords,
        'seo.canonicalUrl': `https://thenijobs.com/${collectionName === 'portfolioSites' ? 'portfolio/' + (item.customUrl || item.id) : 'company/' + (item.slug || slugifyCompany(item.name || item.id))}`,
        seoScore: 98,
        updatedAt: new Date(),
      });

      toast.success('🚀 SEO Boost Applied!', `Added ${suggested.length} high-ranking keywords & optimized Google search snippet.`);
      if (collectionName === 'portfolioSites') refreshPortfolios();
      if (collectionName === 'companies') refreshCompanies();
      if (collectionName === 'jobs') refreshJobs();
    } catch (err: any) {
      toast.error('Boost failed: ' + err.message);
    } finally {
      setOptimizing(false);
    }
  };

  const handleCopyUrl = (slug: string) => {
    navigator.clipboard.writeText(`https://thenijobs.com/portfolio/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
    toast.success('Public URL copied!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Google Search &amp; SEO Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
              GOOGLE INDEXER
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor Google search engine indexing, analyze keyword ranking strength, and boost top position visibility.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refreshPortfolios();
              refreshCompanies();
              refreshJobs();
              toast.info('Refreshed SEO metadata.');
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw size={13} /> Refresh Data
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Google SEO Index Score</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats.healthScore}%</p>
          <span className="text-[10px] font-bold text-emerald-600">🟢 Highly Optimized for Google</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Indexed Portfolios</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Globe size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats.indexedPort} / {stats.totalPort}</p>
          <span className="text-[10px] font-medium text-slate-500">Published Seeker &amp; Company Sites</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Verified Companies</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Building2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats.verifiedComp} / {stats.totalComp}</p>
          <span className="text-[10px] font-medium text-slate-500">Local Business Schema active</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Live Job Postings</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Briefcase size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats.activeJobs}</p>
          <span className="text-[10px] font-medium text-slate-500">JobPosting Schema LD+JSON</span>
        </div>
      </div>

      {/* ── TABS NAVIGATION & SEARCH ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {([
            { id: 'portfolios', label: 'Seeker & Company Portfolios', icon: Globe, count: portfolios.length },
            { id: 'companies', label: 'Company Directories', icon: Building2, count: companies.length },
            { id: 'jobs', label: 'Job Openings', icon: Briefcase, count: jobs.length },
            { id: 'trends', label: 'High-Ranking Keyword Bank', icon: Sparkles },
          ] as const).map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {typeof (tab as any).count === 'number' && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {(tab as any).count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab !== 'trends' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search slug, name, keywords..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 w-48 sm:w-64"
              />
            </div>
            <select
              value={filterIndexed}
              onChange={e => setFilterIndexed(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-white rounded-xl border border-slate-200"
            >
              <option value="all">All Status</option>
              <option value="indexed">🟢 Google Indexed</option>
              <option value="noindex">⚪ Noindex</option>
            </select>
          </div>
        )}
      </div>

      {/* ── TAB 1: PORTFOLIO WEBSITES SEO AUDITOR ── */}
      {activeTab === 'portfolios' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Portfolio Entity / Owner</th>
                    <th className="py-3 px-4">SEO Slug &amp; Live URL</th>
                    <th className="py-3 px-4">Google Index Status</th>
                    <th className="py-3 px-4">SEO Strength</th>
                    <th className="py-3 px-4">Current Keywords</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {portfolios
                    .filter(p => {
                      const matchQuery = (p.customUrl || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.branding?.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());
                      const matchIndex = filterIndexed === 'all'
                        ? true
                        : filterIndexed === 'indexed'
                        ? p.googleIndex !== false
                        : p.googleIndex === false;
                      return matchQuery && matchIndex;
                    })
                    .map(item => {
                      const score = getSeoScore(item, 'portfolio');
                      const keywords = item.seo?.keywords || [];
                      const suggested = getSuggestedKeywords(item);
                      const isIndexed = item.googleIndex !== false;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {item.branding?.logo ? (
                                <img src={item.branding.logo} alt="" className="w-8 h-8 rounded-lg object-cover border" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                                  {(item.branding?.companyName || 'P')[0]}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900">{item.branding?.companyName || 'Portfolio Website'}</p>
                                <span className="text-[10px] text-slate-400 capitalize">{item.ownerType || 'Seeker'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 font-mono text-slate-700">
                              <span className="truncate max-w-[150px]">/{item.customUrl || item.id}</span>
                              <button onClick={() => handleCopyUrl(item.customUrl || item.id)} className="text-slate-400 hover:text-slate-700 p-0.5">
                                {copiedSlug === (item.customUrl || item.id) ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                              isIndexed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isIndexed ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              {isIndexed ? 'INDEXED' : 'NOINDEX'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className="font-bold text-[11px] text-slate-800">{score}%</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {keywords.slice(0, 3).map((kw: string, idx: number) => (
                                <span key={idx} className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] text-slate-600 truncate max-w-[90px]">
                                  {kw}
                                </span>
                              ))}
                              {keywords.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-bold">+{keywords.length - 3}</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleAutoBoostSeo(item, 'portfolioSites')}
                                disabled={optimizing}
                                className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold text-[11px] hover:bg-blue-700 flex items-center gap-1 shadow-2xs"
                                title="Auto-inject high ranking keywords & optimize Google SERP snippet"
                              >
                                <Sparkles size={11} /> Boost SEO
                              </button>

                              <a
                                href={`/portfolio/${item.customUrl || item.id}`}
                                target="_blank"
                                rel="noopener"
                                className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                                title="View live website"
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: COMPANY DIRECTORIES SEO AUDITOR ── */}
      {activeTab === 'companies' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">SEO Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {companies
                  .filter(c => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(item => {
                    const score = getSeoScore(item, 'company');
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                        <td className="py-3 px-4 text-slate-600">{item.district || 'Theni'}</td>
                        <td className="py-3 px-4 text-slate-600">{item.category || 'General'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {item.verificationStatus || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800">{score}%</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleAutoBoostSeo(item, 'companies')}
                            className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[11px] hover:bg-indigo-700 flex items-center gap-1 ml-auto shadow-2xs"
                          >
                            <Sparkles size={11} /> Boost SEO
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: JOB OPENINGS SEO AUDITOR ── */}
      {activeTab === 'jobs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Job Title</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">SEO Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {jobs
                  .filter(j => (j.title || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(item => {
                    const score = getSeoScore(item, 'job');
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.title}</td>
                        <td className="py-3 px-4 text-slate-600">{item.companyName || 'Direct Employer'}</td>
                        <td className="py-3 px-4 text-slate-600">{item.district || 'Theni'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.isActive || item.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.isActive || item.status === 'active' ? 'Active' : 'Closed'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800">{score}%</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={`/jobs/${item.id}`}
                            target="_blank"
                            rel="noopener"
                            className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 inline-flex items-center gap-1 text-[11px] font-bold"
                          >
                            <ExternalLink size={12} /> View
                          </a>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: HIGH-RANKING KEYWORD BANK ── */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(HIGH_IMPACT_KEYWORDS).map(([category, kwList]) => (
            <div key={category} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 capitalize" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {category.replace('_', ' ')}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  TOP 1 GOOGLE SEARCH
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {kwList.map((kw, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1 hover:border-blue-300 transition-colors"
                  >
                    <Search size={10} className="text-blue-500" /> {kw}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
