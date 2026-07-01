import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Academy — Free Online Courses & Skill Certification',
  description:
    'Learn in-demand skills with free online courses from THENIJOBS Academy. Earn certificates, take quizzes, and boost your career in Tamil Nadu.',
  alternates: {
    canonical: 'https://thenijobs.com/academy',
  },
  openGraph: {
    title: 'THENIJOBS Academy — Free Online Courses & Certification',
    description:
      'Learn in-demand skills with free online courses. Earn certificates, take quizzes, and boost your career.',
    url: 'https://thenijobs.com/academy',
    type: 'website',
  },
};

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
