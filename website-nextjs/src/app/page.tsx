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
import BusinessUpdates from '@/components/home/BusinessUpdates';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import HomeFooter from '@/components/home/HomeFooter';

export const metadata: Metadata = {
  title: 'THENIJOBS - Theni Jobs, Businesses & Services',
  description:
    'Mobile-friendly local jobs and business discovery platform for Theni district. Search jobs, contact companies, send leads and discover verified local services.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a1a]">
      <Header />
      <HeroSection />
      <SearchHub />
      <StatsSection />
      <CategoriesSection />
      <TrendingJobs />
      <FeaturedBusinesses />
      <BusinessUpdates />
      <TestimonialsSection />
      <HomeFooter />
      <BottomNav />
      <FloatingWhatsApp />
    </main>
  );
}
