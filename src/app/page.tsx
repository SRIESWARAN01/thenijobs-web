import type { Metadata } from 'next';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import FloatingWhatsApp from '@/components/ui/FloatingWhatsApp';
import AnnouncementBar from '@/components/home/AnnouncementBar';
import WalkInDriveBanner from '@/components/home/WalkInDriveBanner';

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
import TestimonialsSection from '@/components/home/TestimonialsSection';
import FAQSection from '@/components/home/FAQSection';
import FinalCTA from '@/components/home/FinalCTA';
import HomeFooter from '@/components/home/HomeFooter';

export const metadata: Metadata = {
  title: 'THENIJOBS – Latest Jobs in Theni | Private Jobs, Fresher Jobs & Vacancies',
  description:
    'THENIJOBS is a local job portal connecting job seekers with verified companies and opportunities across Theni, Cumbum, Periyakulam, Bodinayakanur, Uthamapalayam and nearby areas in Tamil Nadu. Search active private, fresher, and full-time jobs with instant direct apply.',
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
  ],
  alternates: {
    canonical: 'https://thenijobs.com',
  },
  openGraph: {
    title: 'THENIJOBS – Latest Jobs in Theni | Private & Fresher Jobs',
    description: 'THENIJOBS is a local job portal connecting job seekers with companies and job opportunities across Theni, Cumbum, Periyakulam, Bodinayakanur, Uthamapalayam and nearby areas.',
    url: 'https://thenijobs.com',
    type: 'website',
    locale: 'en_IN',
    siteName: 'THENIJOBS',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'THENIJOBS Portal' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Theni Jobs | Find Verified Job Vacancies | THENIJOBS',
    description: 'A local job portal for Theni & Tamil Nadu — find verified jobs and employers.',
    images: ['/og-image.jpg'],
  },
};

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
    {
      '@type': 'Organization',
      '@id': 'https://thenijobs.com/#organization',
      name: 'THENIJOBS',
      url: 'https://thenijobs.com',
      logo: 'https://thenijobs.com/logo.png',
      sameAs: [
        'https://thenijobs.com',
        'https://wa.me/919360519460',
      ],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+91-93605-19460',
          contactType: 'customer service',
          areaServed: 'IN',
          availableLanguage: ['Tamil', 'English'],
        },
        {
          '@type': 'ContactPoint',
          telephone: '+91-70948-26886',
          contactType: 'sales',
          areaServed: 'IN',
          availableLanguage: ['Tamil', 'English'],
        },
      ],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Theni',
        addressRegion: 'Tamil Nadu',
        postalCode: '625531',
        addressCountry: 'IN',
      },
    },
  ],
};

export default function HomePage() {
  return (
    <main className="pt-16 min-h-screen" style={{ background: '#F8FAFC' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
      />
      <Header />
      <WalkInDriveBanner />
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
      <TestimonialsSection />
      <FAQSection />
      <FinalCTA />
      <HomeFooter />
      <BottomNav />
      <FloatingWhatsApp />
    </main>
  );
}
