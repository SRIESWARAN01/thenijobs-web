import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Today's Daily Jobs & Urgent Openings in Theni District | THENIJOBS",
  description:
    "Browse fresh daily job postings and urgent vacancies in Theni, Periyakulam, Cumbum, Bodinayakanur and across Tamil Nadu posted in the last 24 hours. Connect directly via WhatsApp or apply online.",
  keywords: [
    "Today's jobs in Theni",
    "Daily jobs Theni",
    "Urgent job vacancies in Theni",
    "Fresh jobs in Theni today",
    "24 hours job openings Theni",
    "Theni private jobs daily",
    "Walk-in jobs Theni",
  ],
  alternates: { canonical: 'https://thenijobs.com/daily-jobs' },
  openGraph: {
    title: "Today's Daily Jobs & Urgent Openings in Theni | THENIJOBS",
    description:
      'Search daily job postings and immediate hiring openings in Theni district updated every 24 hours with direct WhatsApp apply.',
    url: 'https://thenijobs.com/daily-jobs',
    type: 'website',
    locale: 'en_IN',
    siteName: 'THENIJOBS',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Daily Jobs in Theni' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Today's Daily Jobs & Urgent Openings in Theni | THENIJOBS",
    description: 'Find fresh verified jobs posted in the last 24 hours in Theni & Tamil Nadu.',
    images: ['/og-image.jpg'],
  },
};

export default function DailyJobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
