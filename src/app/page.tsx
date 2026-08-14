import type { Metadata } from 'next';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import FloatingWhatsApp from '@/components/ui/FloatingWhatsApp';
import HeroSection from '@/components/home/HeroSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import TrendingJobs from '@/components/home/TrendingJobs';
import FeaturedBusinesses from '@/components/home/FeaturedBusinesses';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import HomeFooter from '@/components/home/HomeFooter';

export const metadata: Metadata = {
  title: 'THENIJOBS — Find Jobs, Companies & Services in Theni, Tamil Nadu',
  description:
    'The #1 local job portal for Theni & Tamil Nadu. Search verified jobs, discover businesses, contact employers directly. 1200+ active jobs.',
  keywords: 'theni jobs, tamil jobs, madurai jobs, dindigul jobs, tamilnadu jobs',
  openGraph: {
    title: 'THENIJOBS — Find Jobs in Theni, Tamil Nadu',
    description: 'Search verified jobs, local businesses and services in Theni & Tamil Nadu.',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function HomePage() {
  return (
    <main style={{ background: '#F8FAFC' }}>
      <Header />
      <HeroSection />
      <TrendingJobs />
      <FeaturedBusinesses />
      <CategoriesSection />
      <TestimonialsSection />
      <HomeFooter />
      <BottomNav />
      <FloatingWhatsApp />
    </main>
  );
}
