import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Online Courses & Skill Development — Certificates, Training & Career Growth',
  description:
    'Learn in-demand skills with free online courses from THENIJOBS Academy. Earn certificates, take quizzes, and boost your career in Tamil Nadu. Skill development, training, and career guidance for job seekers and professionals.',
  keywords: ['Free Online Courses', 'Skill Development', 'Career Training', 'Certificates', 'Tamil Nadu Training', 'Job Training', 'Career Guidance', 'Internship Training'],
  alternates: {
    canonical: 'https://thenijobs.com/academy',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 },
  },
  openGraph: {
    title: 'THENIJOBS Academy — Free Online Courses & Skill Certification',
    description:
      'Learn in-demand skills with free online courses. Earn certificates, take quizzes, and boost your career.',
    url: 'https://thenijobs.com/academy',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Free Online Courses & Skill Development | THENIJOBS Academy',
    description: 'Learn skills, earn certificates & boost your career with free courses on THENIJOBS.',
  },
};

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
