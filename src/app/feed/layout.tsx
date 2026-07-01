import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Feed — Latest Updates from Local Businesses',
  description:
    'Stay updated with the latest posts, job announcements, product launches, and business updates from verified companies across Theni district on THENIJOBS.',
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
