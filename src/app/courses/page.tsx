import type { Metadata } from 'next';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import CoursesCatalogClient from './CoursesCatalogClient';
import { generateBreadcrumbSchema } from '@/lib/seo/schemas';
import { toJsonLdScript } from '@/lib/seo/jsonLd';
import { getAdminFirestore, syncClockSkew } from '@/lib/firebase/firebaseAdmin';

export const metadata: Metadata = {
  title: 'Skill Development & Certification Courses in Theni | THENIJOBS Academy',
  description:
    'Free and practical certification courses in Accounting, Tally GST, Software Development, Office Data Entry, and Field Sales for job seekers in Theni, Cumbum, and Tamil Nadu.',
  keywords: [
    'Theni skill development',
    'Career courses Theni',
    'Tally GST training Theni',
    'Data entry typing courses Theni',
    'Tamil Nadu job certification',
    'Free vocational courses Tamil Nadu',
    'THENIJOBS Academy',
  ],
  alternates: {
    canonical: 'https://www.thenijobs.com/courses',
  },
  openGraph: {
    title: 'Career Growth & Skill Certification | THENIJOBS Academy',
    description:
      'Learn in-demand practical skills, earn verified certificates, and apply directly to local employers across Theni and Tamil Nadu.',
    url: 'https://www.thenijobs.com/courses',
    type: 'website',
    locale: 'en_IN',
    siteName: 'THENIJOBS',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'THENIJOBS Career Academy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skill Development & Courses | THENIJOBS Academy',
    description: 'Learn in-demand practical skills and earn verified certificates on THENIJOBS.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function CoursesPage() {
  let courses: any[] = [];
  let categories: any[] = [];

  try {
    await syncClockSkew();
    const db = getAdminFirestore();

    const [coursesSnap, catsSnap] = await Promise.all([
      db.collection('skillCourses')
        .where('status', '==', 'published')
        .get(),
      db.collection('skillCategories')
        .where('isActive', '==', true)
        .get(),
    ]);

    courses = coursesSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        slug: data.slug || doc.id,
        shortDescription: data.shortDescription || '',
        categoryId: data.categoryId || '',
        categoryName: data.categoryName || '',
        thumbnailUrl: data.thumbnailUrl || '',
        instructorName: data.instructorName || 'THENIJOBS Faculty',
        difficulty: data.difficulty || 'beginner',
        duration: data.duration || '2 hours',
        language: data.language || 'both',
        lessonCount: Number(data.lessonCount) || 0,
        certificateEligible: Boolean(data.certificateEligible),
        learningObjectives: Array.isArray(data.learningObjectives) ? data.learningObjectives : [],
      };
    });

    categories = catsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        nameTamil: data.nameTamil || '',
        iconEmoji: data.iconEmoji || '',
      };
    });
  } catch (err) {
    console.warn('[Courses SSR Error]:', err);
  }

  // Generate Structured Data (JSON-LD)
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.thenijobs.com' },
    { name: 'Courses & Academy', url: 'https://www.thenijobs.com/courses' },
  ]);

  const courseListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'THENIJOBS Career Academy Courses',
    description: 'Practical vocational and skill development courses with verified certification in Theni, Tamil Nadu',
    itemListElement: courses.slice(0, 10).map((course, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Course',
        name: course.title,
        description: course.shortDescription,
        provider: {
          '@type': 'Organization',
          name: 'THENIJOBS',
          sameAs: 'https://www.thenijobs.com',
        },
        url: `https://www.thenijobs.com/courses/${course.slug}`,
        educationalCredentialAwarded: course.certificateEligible ? 'Verified Certificate of Completion' : undefined,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(courseListSchema) }}
      />
      <Header />
      <main className="min-h-screen">
        <CoursesCatalogClient initialCourses={courses} initialCategories={categories} />
      </main>
      <BottomNav />
    </>
  );
}
