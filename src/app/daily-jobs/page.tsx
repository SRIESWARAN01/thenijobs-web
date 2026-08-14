import type { Metadata } from 'next';
import JobsPage from '@/app/jobs/page';

export const metadata: Metadata = {
  title: 'Daily Jobs in Theni',
  description: 'Browse today’s active job vacancies in Theni and Tamil Nadu.',
  alternates: { canonical: '/daily-jobs' },
};

export default function DailyJobsPage() {
  return <JobsPage />;
}
