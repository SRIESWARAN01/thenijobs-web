'use client';

import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import BusinessesBrowseContent from '@/components/businesses/BusinessesBrowseContent';

export default function BusinessesPage() {
  return (
    <main style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <Header />
      <BusinessesBrowseContent />
      <BottomNav />
    </main>
  );
}
