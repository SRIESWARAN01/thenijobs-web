import type { Metadata } from 'next';
import Header from '@/components/navigation/Header';
import AnnouncementBar from '@/components/home/AnnouncementBar';
import HeroSection from '@/components/home/HeroSection';

import TrustedEmployersStrip from '@/components/home/TrustedEmployersStrip';
import TrendingJobs from '@/components/home/TrendingJobs';
import CategoriesSection from '@/components/home/CategoriesSection';
import LocationsSection from '@/components/home/LocationsSection';
import WhySection from '@/components/home/WhySection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import JobSeekerEmployerCTA from '@/components/home/JobSeekerEmployerCTA';
import FeaturedBusinesses from '@/components/home/FeaturedBusinesses';
import ServicesSection from '@/components/home/ServicesSection';
import FAQSection, { HOMEPAGE_FAQS } from '@/components/home/FAQSection';
import FinalCTA from '@/components/home/FinalCTA';
import HomeFooter from '@/components/home/HomeFooter';
import ClientFloatingWidgets from '@/components/home/ClientFloatingWidgets';
import { toJsonLdScript } from '@/lib/seo/jsonLd';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { generateLocalBusinessSchema, generateFaqSchema, generateOrganizationSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = buildPageMetadata({
  title: 'THENIJOBS – Latest Jobs in Theni | Private Jobs, Fresher Jobs & Vacancies',
  description:
    'THENIJOBS is a local job portal connecting job seekers with verified companies and opportunities across Theni, Cumbum, Periyakulam, Bodinayakanur, Uthamapalayam and nearby areas in Tamil Nadu. Search active private, fresher, and full-time jobs with instant direct apply.',
  path: '/',
  keywords: [
    'Theni Jobs',
    'Jobs in Theni',
    'Theni job vacancy',
    'Theni jobs for freshers',
    'Private jobs in Theni',
    'Government jobs in Theni',
    'Jobs in Cumbum',
    'Jobs in Periyakulam',
    'Jobs in Bodinayakanur',
    'Jobs in Chinnamanur',
    'Jobs in Uthamapalayam',
    'Jobs in Andipatti',
    'Jobs in Madurai',
    'Jobs in Dindigul',
    'Tamil Nadu Jobs',
    'THENIJOBS',
  ],
  image: '/og-image.jpg',
});

const homeStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://thenijobs.com/#website',
      url: 'https://thenijobs.com',
      name: 'THENIJOBS',
      description: 'Local Job & Business Platform for Theni & Tamil Nadu',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://thenijobs.com/jobs?search={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
      inLanguage: 'en-IN',
    },
    generateOrganizationSchema(),
    generateLocalBusinessSchema(),
    generateFaqSchema(HOMEPAGE_FAQS),
  ],
};

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(homeStructuredData) }}
      />
      <Header />
      <AnnouncementBar />
      <HeroSection />

      <TrustedEmployersStrip />
      <TrendingJobs />
      <CategoriesSection />
      <LocationsSection />
      <WhySection />
      <HowItWorksSection />
      <JobSeekerEmployerCTA />
      <FeaturedBusinesses />
      <ServicesSection />
      <FAQSection />
      <FinalCTA />
      <HomeFooter />
      <ClientFloatingWidgets />
    </main>
  );
}
