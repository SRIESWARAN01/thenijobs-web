'use client';

import dynamic from 'next/dynamic';

const BottomNav = dynamic(() => import('@/components/navigation/BottomNav'), { ssr: false });
const FloatingWhatsApp = dynamic(() => import('@/components/ui/FloatingWhatsApp'), { ssr: false });
const WalkInDriveBanner = dynamic(() => import('@/components/home/WalkInDriveBanner'), { ssr: false });

export default function ClientFloatingWidgets() {
  return (
    <>
      <WalkInDriveBanner />
      <BottomNav />
      <FloatingWhatsApp />
    </>
  );
}
