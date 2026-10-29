'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  User, MapPin, Briefcase, GraduationCap, Award,
  Globe, Mail, Phone, ExternalLink, Loader2,
  CheckCircle, Star, Languages, Calendar, ChevronRight,
  Share2, Download, Sparkles, Code2, FolderGit2, CheckCircle2,
  Clock, Shield, FileText, Send, Lock, Video, Play,
  Bookmark, Heart, CheckSquare, Layers, FileCode, Sliders,
  ShieldCheck, Smartphone, AlertCircle, QrCode, FileCheck
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import SeekerIDCard from '@/components/id-card/SeekerIDCard';
import TemplateRenderer from '@/components/portfolio/TemplateRenderer';
import { buildSeekerPortfolioSite } from '@/lib/portfolio/seekerPortfolioAdapter';
import type { PortfolioSite } from '@/lib/types/portfolio';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { getSeekerGrowthSlogan } from '@/lib/branding/slogans';
import { safeExternalUrl } from '@/lib/safeUrl';
import { generateBreadcrumbSchema } from '@/lib/seo/jobSchema';

interface SeekerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  state: string;
  currentRole: string;
  isOpenToWork: boolean;
  /** Opt-in — defaults to false/absent. Only true means this seeker chose to make their
      portfolio publicly viewable at /portfolio/seeker/[id]; never set by a live-preview caller. */
  isPortfolioPublic?: boolean;
  workStatus?: 'open' | 'opportunities' | 'not_looking';
  joiningAvailability?: string;
  photoUrl: string;
  profilePhotoUrl: string;
  gender: string;
  dob: string;
  aboutMe?: string;
  careerObjective?: string;
  expectedSalary?: string;
  jobPreferences?: string[];
  preferredLocations?: string[];
  preferredMode?: string;
  preferredIndustry?: string;
  availability?: string;
  skills: (string | { name: string; level?: string; verified?: boolean; score?: number })[];
  languages: (string | { name: string; proficiency?: string; readWriteSpeak?: string })[];
  education: { id: string; institution: string; degree: string; field: string; year: string; percentage?: string }[];
  experience: { id: string; company: string; role: string; startDate: string; endDate: string; description: string; location?: string }[];
  projects?: { id: string; title: string; description: string; techStack?: string[]; liveUrl?: string; githubUrl?: string; imageUrl?: string; role?: string; duration?: string }[];
  certifications: { id: string; name: string; organization: string; date: string; link: string }[];
  achievements?: { id: string; title: string; organization?: string; date?: string; description?: string }[];
  workSamples?: { id: string; title: string; type: string; url: string; date?: string }[];
  videoIntroUrl?: string;
  privacySettings?: { hidePhone?: boolean; hideEmail?: boolean; hideAddress?: boolean; hideResume?: boolean; hideContact?: boolean };
  verificationBadges?: { mobileVerified?: boolean; emailVerified?: boolean; identityVerified?: boolean; educationVerified?: boolean; skillVerified?: boolean };
  resumeUrl?: string;
  resumeUpdatedDate?: string;
}

export default function SeekerPortfolioClient({ seekerId: seekerIdProp, initialData }: { seekerId?: string; initialData?: SeekerData }) {
  // CRITICAL: read the real id from the URL, not the server prop. vercel.json rewrites any
  // seeker id unknown at the last build (page.tsx's generateStaticParams only pre-builds ids
  // returned by getAllPublicSeekerPortfolioIdsServer() at build time) to the `_fallback` shell,
  // so the prop can be `_fallback` while the browser's own URL carries the real id -- mirrors
  // CompanyProfilePageClient.tsx's exact pattern. Without this, a seeker who makes their
  // portfolio public after the last build gets served "not found" until the next rebuild.
  // Skipped when this component is an embedded live-preview (initialData present, from
  // /seeker/profile's "Live Preview" modal) -- there the URL is the profile editor's own page,
  // not a portfolio URL, and would resolve to the wrong id.
  const pathname = usePathname();
  const urlId = pathname?.split('/').filter(Boolean).pop() || '';
  const seekerId = (!initialData && urlId && urlId !== '_fallback') ? urlId : seekerIdProp;

  const [seeker, setSeeker] = useState<SeekerData | null>(initialData || null);
  const [userName, setUserName] = useState(initialData?.name || '');
  const [loading, setLoading] = useState(!initialData);
  const [notFound, setNotFound] = useState(false);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeView, setActiveView] = useState<'portfolio' | 'idcard'>('portfolio');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [hrShortlisted, setHrShortlisted] = useState(false);
  const [hrNote, setHrNote] = useState('');
  const [portfolioSite, setPortfolioSite] = useState<PortfolioSite | null>(null);

  useEffect(() => {
    if (initialData) {
      setSeeker(initialData);
      setUserName(initialData.name || '');
      const synthesized = buildSeekerPortfolioSite({
        userId: seekerId || 'preview-seeker',
        name: initialData.name,
        headline: initialData.currentRole,
        currentRole: initialData.currentRole,
        bio: initialData.aboutMe || initialData.careerObjective,
        email: initialData.email,
        phone: initialData.phone,
        address: initialData.address,
        district: initialData.district,
        state: initialData.state,
        photoUrl: initialData.photoUrl || initialData.profilePhotoUrl,
        resumeUrl: initialData.resumeUrl,
        isOpenToWork: initialData.isOpenToWork,
        isPortfolioPublic: initialData.isPortfolioPublic ?? true,
        skills: initialData.skills,
        languages: initialData.languages,
        education: initialData.education,
        experience: initialData.experience,
        projects: initialData.projects,
        certifications: initialData.certifications,
        achievements: initialData.achievements,
        portfolioLinks: (initialData.workSamples || []).map(w => w.url),
        privacySettings: initialData.privacySettings,
      });
      setPortfolioSite(synthesized);
      setLoading(false);
      return;
    }
    async function fetchData() {
      if (!seekerId) return;
      try {
        setLoading(true);
        const profileRef = doc(db, 'seekerProfiles', seekerId);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const profileData = profileSnap.data() as SeekerData;

        // Privacy gate — only the seeker's own opt-in makes this page public. A visitor
        // (no initialData, i.e. not the owner's own live-preview) sees the same "not
        // found" state for a private profile as for a nonexistent one, so a private
        // portfolio's existence isn't distinguishable from the outside.
        if (!profileData.isPortfolioPublic) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setSeeker(profileData);
        // RULES-1: users/{uid} is readable only by its owner and admins; the public name comes
        // from the seeker profile (written by the seeker on their profile page).
        setUserName((profileData as any).name || (profileData as any).displayName || '');

        // Fetch custom site from portfolioSites if configured
        let siteFound: PortfolioSite | null = null;
        try {
          const directSiteSnap = await getDoc(doc(db, 'portfolioSites', `site-${seekerId}`));
          if (directSiteSnap.exists()) {
            siteFound = { id: directSiteSnap.id, ...directSiteSnap.data() } as PortfolioSite;
          } else {
            const qSite = query(collection(db, 'portfolioSites'), where('ownerId', '==', seekerId), limit(1));
            const qSnap = await getDocs(qSite);
            if (!qSnap.empty) {
              siteFound = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as PortfolioSite;
            }
          }
        } catch { /* ignore fallback */ }

        if (siteFound) {
          setPortfolioSite(siteFound);
        } else {
          const synthesized = buildSeekerPortfolioSite({
            userId: seekerId,
            name: profileData.name || (profileData as any).displayName || '',
            headline: profileData.currentRole,
            currentRole: profileData.currentRole,
            bio: profileData.aboutMe || profileData.careerObjective,
            email: profileData.email,
            phone: profileData.phone,
            address: profileData.address,
            district: profileData.district,
            state: profileData.state,
            photoUrl: profileData.photoUrl || profileData.profilePhotoUrl,
            resumeUrl: profileData.resumeUrl,
            isOpenToWork: profileData.isOpenToWork,
            isPortfolioPublic: true,
            skills: profileData.skills,
            languages: profileData.languages,
            education: profileData.education,
            experience: profileData.experience,
            projects: profileData.projects,
            certifications: profileData.certifications,
            achievements: profileData.achievements,
            portfolioLinks: (profileData.workSamples || []).map(w => w.url),
            privacySettings: profileData.privacySettings,
          });
          setPortfolioSite(synthesized);
        }
      } catch (err) {
        console.error('Error loading seeker portfolio:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [seekerId, initialData]);

  // Google Search Indexing Matrix: Premium/Enterprise = INDEX; Free/Basic/Standard = NOINDEX
  //
  // SEO-GAP-1: this always called document.createElement('meta') + appendChild, so it never
  // found the root layout's own server-rendered `<meta name="robots" content="index, follow">`
  // (src/app/layout.tsx's default `robots` metadata) -- it just appended a SECOND, conflicting
  // tag after it. A page could end up with two robots meta tags disagreeing with each other,
  // which crawlers explicitly document as undefined/unreliable behavior. Fixed to find and
  // update the existing tag in place, and to restore whatever value it found on cleanup
  // instead of deleting the tag outright.
  useEffect(() => {
    const plan = ((seeker as any)?.subscriptionPlan || 'free').toLowerCase();
    const allowSEO = ['premium', 'enterprise'].includes(plan);
    const content = allowSEO ? 'index, follow' : 'noindex, nofollow';

    const existing = [...document.querySelectorAll('meta[name="robots"]')] as HTMLMetaElement[];
    let meta = existing[0] || null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    const previousContent = meta.getAttribute('content');
    meta.setAttribute('content', content);
    // Next's own metadata layer can re-insert its static default robots tag independently of
    // this effect's timing (observed live: a second tag reappearing after this one already ran)
    // -- two disagreeing robots tags is worse than one, so any extra tag past the first is
    // dropped rather than left to coexist.
    existing.slice(1).forEach((tag) => tag.remove());

    return () => {
      if (meta && previousContent !== null) meta.setAttribute('content', previousContent);
    };
  }, [seeker]);

  // SEO-GAP-1: this used to be title-only -- no meta description, no canonical, no Open
  // Graph/Twitter cards (so sharing a seeker's portfolio link on WhatsApp showed a blank
  // preview), and no structured data. Mirrors the setMeta/setLink helper pattern already
  // established for CompanyProfilePageClient.tsx and MarketplaceItemPageClient.tsx. Emitted
  // regardless of the robots index/noindex gate above -- canonical/JSON-LD are simply unused
  // by crawlers on a noindex page (not a policy issue), and OG/Twitter tags still matter for
  // a shared link's social preview even when the page isn't search-indexed.
  useEffect(() => {
    if (!seeker || !seekerId) return;

    const name = seeker.name || userName || 'Job Seeker';
    const role = seeker.currentRole || '';
    const district = seeker.district || '';
    const title = `${name} — Candidate Digital Portfolio | THENIJOBS`;
    document.title = title;

    const skillNames = (seeker.skills || [])
      .map((s) => (typeof s === 'string' ? s : s?.name))
      .filter(Boolean)
      .slice(0, 5);
    const description = (
      seeker.careerObjective || seeker.aboutMe ||
      `${name}${role ? `, ${role}` : ''}${district ? ` in ${district}, Tamil Nadu` : ''}.${skillNames.length ? ` Skills: ${skillNames.join(', ')}.` : ''} View this candidate's digital portfolio on THENIJOBS.`
    ).slice(0, 160);
    const canonicalUrl = `https://www.thenijobs.com/portfolio/seeker/${seekerId}`;
    const photoUrl = seeker.photoUrl || seeker.profilePhotoUrl || '';

    const setMeta = (metaName: string, content: string, property?: boolean) => {
      if (!content) return;
      const attr = property ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${metaName}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, metaName);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const setLink = (rel: string, href: string) => {
      if (!href) return;
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    setMeta('description', description);
    setLink('canonical', canonicalUrl);

    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', 'profile', true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:site_name', 'THENIJOBS', true);
    if (photoUrl) setMeta('og:image', photoUrl, true);

    setMeta('twitter:card', photoUrl ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    if (photoUrl) setMeta('twitter:image', photoUrl);

    const jsonLd: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name,
      description: description || undefined,
      image: photoUrl || undefined,
      jobTitle: role || undefined,
      address: district ? {
        '@type': 'PostalAddress',
        addressLocality: district,
        addressRegion: 'Tamil Nadu',
        addressCountry: 'IN',
      } : undefined,
      knowsAbout: skillNames.length ? skillNames : undefined,
      url: canonicalUrl,
    };
    const cleanJsonLd = JSON.parse(JSON.stringify(jsonLd));

    let scriptTag = document.getElementById('seeker-portfolio-jsonld') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'seeker-portfolio-jsonld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(cleanJsonLd);

    // SEEKERSITE-1: generateBreadcrumbSchema (src/lib/seo/jobSchema.ts) already exists and is
    // used across every jobs-in-<location> page and the job-detail page, but SEO-GAP-1's own
    // audit found it unused here and on company profiles -- a real, cheap, in-scope SEO gap to
    // close (breadcrumbs are one of the objective's own named SEO elements).
    // Just Home > {Name} -- there is no real /portfolio index page to link a middle
    // "Portfolios" level to (only the dynamic [username]/seeker/[id] routes exist), and a
    // breadcrumb pointing at a URL that doesn't resolve to a real page would be exactly the
    // kind of fabricated navigation this repo's own non-fabrication discipline (TRUST-1) warns
    // against.
    const breadcrumbJsonLd = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://www.thenijobs.com/' },
      { name, url: canonicalUrl },
    ]);

    let breadcrumbScriptTag = document.getElementById('seeker-portfolio-breadcrumb-jsonld') as HTMLScriptElement | null;
    if (!breadcrumbScriptTag) {
      breadcrumbScriptTag = document.createElement('script');
      breadcrumbScriptTag.id = 'seeker-portfolio-breadcrumb-jsonld';
      breadcrumbScriptTag.type = 'application/ld+json';
      document.head.appendChild(breadcrumbScriptTag);
    }
    breadcrumbScriptTag.textContent = JSON.stringify(breadcrumbJsonLd);

    return () => {
      document.getElementById('seeker-portfolio-jsonld')?.remove();
      document.getElementById('seeker-portfolio-breadcrumb-jsonld')?.remove();
      document.querySelector('link[rel="canonical"]')?.remove();
    };
  }, [seeker, userName, seekerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-sm text-gray-500 font-medium">Loading candidate digital portfolio...</p>
        </div>
      </div>
    );
  }

  if (notFound || !seeker) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center bg-[#F8FAFC]">
        <div className="max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
            <User size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 font-sans">Profile Not Found</h1>
          <p className="mt-2 text-sm text-gray-500">
            This candidate portfolio is not available or hasn&apos;t been published yet.
          </p>
          <Link href="/" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm">
            Return to THENIJOBS
          </Link>
        </div>
      </main>
    );
  }

  const name = seeker.name || userName || 'Job Seeker';
  const photoUrl = seeker.profilePhotoUrl || seeker.photoUrl || '';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const rawSkills = seeker.skills || [];
  const rawLanguages = seeker.languages || [];
  const education = seeker.education || [];
  const experience = seeker.experience || [];
  const projects = seeker.projects || [];
  const certifications = seeker.certifications || [];
  const achievements = seeker.achievements || [];
  const workSamples = seeker.workSamples || [];
  const district = seeker.district || 'Theni';
  const state = seeker.state || 'Tamil Nadu';
  const currentRole = seeker.currentRole || (experience[0]?.role) || 'Professional Candidate';
  const workStatus = seeker.workStatus || (seeker.isOpenToWork !== false ? 'open' : 'opportunities');
  const tnjId = `TNJ-S-${(seekerId || 'UNKNOWN').slice(0, 6).toUpperCase()}`;

  const isFresher = experience.length === 0;
  const summaryText = seeker.aboutMe || seeker.careerObjective || (isFresher
    ? `Motivated and enthusiastic candidate seeking career opportunities in ${district}, Tamil Nadu. Equipped with modern skills and ready to contribute to business growth.`
    : `Experienced ${currentRole} with proven expertise in building solutions and driving outcomes in ${district}, Tamil Nadu.`);

  // Calculate Profile Strength (0-100%)
  const strengthItems = [
    { label: 'Profile Photo', done: !!photoUrl, weight: 15 },
    { label: 'About / Objective', done: !!(seeker.aboutMe || seeker.careerObjective), weight: 15 },
    { label: 'Skills Added', done: rawSkills.length > 0, weight: 20 },
    { label: 'Experience / Projects', done: experience.length > 0 || projects.length > 0, weight: 20 },
    { label: 'Education', done: education.length > 0, weight: 15 },
    { label: 'Resume Uploaded', done: !!seeker.resumeUrl, weight: 15 },
  ];
  const profileStrength = strengthItems.reduce((acc, curr) => acc + (curr.done ? curr.weight : 0), 0);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `${name} - Candidate Portfolio`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans pb-24">

      {/* Top Fixed View Selector (Portfolio vs Digital ID Card) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveView('portfolio')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'portfolio' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Candidate Portfolio
            </button>
            <button
              onClick={() => setActiveView('idcard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeView === 'idcard' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <QrCode size={13} /> Digital ID Card
            </button>
          </div>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            title="Share Profile"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {activeView === 'idcard' ? (
        <div className="max-w-md mx-auto px-4 py-8">
          <SeekerIDCard
            seeker={{
              uid: seekerId || 'demo',
              name,
              // PRIV-1: this ID card renders on the public portfolio page — no working opt-in
              // exists yet for a visitor-facing contact share, so phone/email/address are never
              // passed here regardless of what the profile document holds.
              profilePhotoUrl: photoUrl,
              district,
              state,
              skills: rawSkills.map(s => (typeof s === 'string' ? s : s.name)),
              currentRole,
              experience: experience.map(e => ({ company: e.company, role: e.role })),
              education: education.map(e => ({ degree: e.degree, institution: e.institution })),
            }}
          />
        </div>
      ) : (
        portfolioSite ? (
          <TemplateRenderer site={portfolioSite} isPreview={false} />
        ) : (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm text-gray-500 font-medium">Loading candidate portfolio...</p>
          </div>
        )
      )}
            {/* Video Intro Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowVideoModal(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Video size={16} className="text-blue-600" /> {name}&apos;s Video Introduction
              </h3>
              <button onClick={() => setShowVideoModal(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
            </div>
            <div className="aspect-video bg-gray-900 rounded-2xl flex items-center justify-center text-white relative overflow-hidden">
              <Video size={48} className="opacity-40" />
              <p className="absolute bottom-4 text-xs text-gray-300">Video Intro Stream Ready</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
