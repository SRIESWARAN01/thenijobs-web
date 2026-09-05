'use client';

import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import JobsBrowseContent from '@/components/jobs/JobsBrowseContent';

export default function JobsPage() {
  return (
    <main style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }} className="font-outfit">
      <Header />
      <JobsBrowseContent />
      <BottomNav />
    </main>
  );
}
