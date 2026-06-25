import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';

export const metadata: Metadata = {
  title: 'Jobs in Madurai | Find Employment Openings in Madurai - THENIJOBS',
  description: 'Apply to the latest job openings in Madurai. Search for full-time, part-time, engineering, IT, and freshers jobs in Madurai from verified local employers.',
};

export default function MaduraiJobsPage() {
  return (
    <SeoJobsLanding
      title="Jobs in Madurai"
      subtitle="Discover and apply for the best career opportunities, corporate listings, and local business jobs in Madurai city."
      metaDescription="Apply to the latest job openings in Madurai. Search for full-time, part-time, engineering, IT, and freshers jobs in Madurai from verified local employers."
      filterField="district"
      filterValue="Madurai"
    />
  );
}
