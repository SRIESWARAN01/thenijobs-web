import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';

export const metadata: Metadata = {
  title: 'Jobs in Theni | Find Local Jobs and Vacancies in Theni - THENIJOBS',
  description: 'Find local employment openings and vacancies in Theni, Cumbum, Bodinayakanur, Periyakulam, and Uthamapalayam. Apply to retail, IT, office, and fresher roles.',
};

export default function TheniJobsPage() {
  return (
    <SeoJobsLanding
      title="Jobs in Theni"
      subtitle="Find local employment openings and vacancies in Theni, Cumbum, Bodinayakanur, Periyakulam, and Uthamapalayam."
      metaDescription="Find local employment openings and vacancies in Theni, Cumbum, Bodinayakanur, Periyakulam, and Uthamapalayam. Apply to retail, IT, office, and fresher roles."
      filterField="district"
      filterValue="Theni"
    />
  );
}
