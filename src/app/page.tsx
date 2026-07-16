import type { Metadata } from 'next';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import FloatingWhatsApp from '@/components/ui/FloatingWhatsApp';
import HeroSection from '@/components/home/HeroSection';
import SearchHub from '@/components/home/SearchHub';
import StatsSection from '@/components/home/StatsSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import TrendingJobs from '@/components/home/TrendingJobs';
import FeaturedBusinesses from '@/components/home/FeaturedBusinesses';
import LatestServices from '@/components/home/LatestServices';
import BusinessUpdates from '@/components/home/BusinessUpdates';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import HomeFooter from '@/components/home/HomeFooter';
import AdvertisementsBanner from '@/components/home/AdvertisementsBanner';

export const metadata: Metadata = {
  title: 'THENIJOBS — #1 Job Portal & Business Directory in Theni, Tamil Nadu',
  description:
    'Find local jobs, discover verified businesses, hire talent, and grow your company in Theni, Madurai & Tamil Nadu. Browse vacancies, post jobs, and connect with employers — 100% free for job seekers.',
  alternates: {
    canonical: 'https://thenijobs.com',
  },
  openGraph: {
    title: 'THENIJOBS — #1 Job Portal & Business Directory in Theni, Tamil Nadu',
    description:
      'Find local jobs, discover verified businesses, hire talent, and grow your company in Theni, Madurai & Tamil Nadu.',
    url: 'https://thenijobs.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THENIJOBS — Jobs, Businesses & Services in Theni',
    description:
      'Find local jobs, discover verified businesses, and grow your career in Theni & Tamil Nadu.',
  },
};

export default function HomePage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thenijobs.com' },
    ],
  };

  return (
    <main id="main-content" className="min-h-screen bg-theme-main text-theme-body">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Header />
      <HeroSection />
      <SearchHub />
      <StatsSection />
      <AdvertisementsBanner />
      <CategoriesSection />
      <TrendingJobs />
      <FeaturedBusinesses />
      <LatestServices />
      <BusinessUpdates />
      <TestimonialsSection />
      <HomeFooter />
      <BottomNav />
      <FloatingWhatsApp />
    </main>
  );
}
