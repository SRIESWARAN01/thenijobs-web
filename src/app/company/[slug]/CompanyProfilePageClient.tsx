'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CompanyProfileClient from './CompanyProfileClient';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { formatDate, formatJobType } from '@/lib/jobFormatters';
import { isPublicJobVisible } from '@/lib/jobPolicy';
import { getCompanyActivePlan } from '@/lib/subscriptions';

export default function CompanyProfilePageClient({ slug }: { slug: string }) {
  const [company, setCompany] = useState<any | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (!slug) return;

    async function loadCompanyData() {
      try {
        setLoading(true);
        setNotFoundState(false);

        // 1. Fetch company by slug
        const qCompany = query(
          collection(db, 'companies'),
          where('slug', '==', slug),
          limit(1)
        );
        const snapCompany = await getDocs(qCompany);

        if (snapCompany.empty) {
          // Try checking aliases array (if company has redirects)
          const qAlias = query(
            collection(db, 'companies'),
            where('aliases', 'array-contains', slug),
            limit(1)
          );
          const snapAlias = await getDocs(qAlias);
          if (snapAlias.empty) {
            setNotFoundState(true);
            return;
          }
          const docData = { id: snapAlias.docs[0].id, ...snapAlias.docs[0].data() };
          setCompany(docData);
          await loadJobsAndReviews(docData.id);
        } else {
          const docData = { id: snapCompany.docs[0].id, ...snapCompany.docs[0].data() };
          setCompany(docData);
          await loadJobsAndReviews(docData.id);
        }
      } catch (err) {
        console.error('Error loading company:', err);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    }

    async function loadJobsAndReviews(companyId: string) {
      try {
        // 2. Fetch company jobs
        const qJobs = query(
          collection(db, 'jobs'),
          where('companyId', '==', companyId),
          where('isActive', '==', true)
        );
        const snapJobs = await getDocs(qJobs);
        const jobsData = snapJobs.docs
          .filter(doc => isPublicJobVisible(doc.data()))
          .map(doc => {
            const d = doc.data();
            const salaryStr = d.salaryMin && d.salaryMax
              ? `₹${Number(d.salaryMin).toLocaleString('en-IN')} - ₹${Number(d.salaryMax).toLocaleString('en-IN')}`
              : 'Salary Negotiable';
            return {
              id: doc.id,
              title: d.title || '',
              type: formatJobType(d.jobType),
              salary: salaryStr,
              openings: d.openings ? Number(d.openings) : 1,
              posted: formatDate(d.createdAt)
            };
          });
        setJobs(jobsData);

        // 3. Fetch reviews
        const qReviews = query(
          collection(db, 'reviews'),
          where('companyId', '==', companyId),
          where('status', '==', 'approved')
        );
        const snapReviews = await getDocs(qReviews);
        const reviewsData = snapReviews.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            companyId: d.companyId,
            name: d.userName || 'Anonymous',
            photoURL: d.userPhoto || d.photoURL || '',
            rating: d.rating || 5,
            title: d.title || 'Review',
            content: d.comment || '',
            date: formatDate(d.createdAt),
            type: d.type || 'customer',
            verified: d.status === 'approved'
          };
        });
        setReviews(reviewsData);
      } catch (err) {
        console.error('Error fetching jobs/reviews:', err);
      }
    }

    loadCompanyData();
  }, [slug]);

  // Set up real-time products and services listeners
  useEffect(() => {
    if (!company?.id) return;

    // Listen to products in real time
    const qProducts = query(
      collection(db, 'products'),
      where('companyId', '==', company.id),
      where('isActive', '==', true)
    );
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    }, (err) => {
      console.error('Error listening to products:', err);
    });

    // Listen to services in real time
    const qServices = query(
      collection(db, 'services'),
      where('providerId', '==', company.ownerId || ''),
      where('status', '==', 'active')
    );
    const unsubscribeServices = onSnapshot(qServices, (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(servicesData);
    }, (err) => {
      console.error('Error listening to services:', err);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeServices();
    };
  }, [company?.id, company?.ownerId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a1a] text-white">
        <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading company profile...</p>
      </div>
    );
  }

  if (notFoundState || !company) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] px-6 text-center text-white">
        <div>
          <h1 className="text-xl font-bold">Company not found</h1>
          <p className="mt-2 text-sm text-gray-400">This business profile is not available yet.</p>
          <Link href="/businesses" className="mt-4 inline-flex rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/[0.1]">
            Browse businesses
          </Link>
        </div>
      </main>
    );
  }

  // Ensure default structure values exist to prevent crashes in the UI
  const verificationBadges = company.verificationBadges || {
    emailVerified: company.verification?.email || false,
    gstVerified: company.verification?.gst || false,
    businessVerified: company.verification?.business || company.verificationStatus === 'verified',
  };
  const visibleVerificationBadges = {
    emailVerified: verificationBadges.emailVerified || false,
    gstVerified: verificationBadges.gstVerified || false,
    businessVerified: verificationBadges.businessVerified || false,
  };
  // Compute average rating from reviews
  const averageRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length) * 10) / 10
    : company.rating || 0;

  // Dynamic LinkedIn-style Business Trust Score Calculation
  const computedTrustScore = (() => {
    let score = 0;
    
    // 1. Profile Completion (Max 30 points)
    if (company.logoUrl) score += 5;
    if (company.coverUrl || company.coverImageUrl) score += 5;
    if (company.description && company.description.length > 100) score += 5;
    if (company.phone && company.email) score += 5;
    if (company.address && company.location) score += 5;
    if (company.website || company.facebook || company.instagram || company.linkedin || company.youtube || company.twitter) score += 5;
    
    // 2. GST & Business Verification (Max 30 points)
    const gstOk = !!(company.verification?.gst || visibleVerificationBadges.gstVerified || company.gstNumber);
    const bizOk = company.verificationStatus === 'verified' || !!company.verification?.business || !!visibleVerificationBadges.businessVerified;
    if (gstOk) score += 15;
    if (bizOk) score += 15;
    
    // 3. Active Listings (Max 15 points)
    if (jobs.length > 0) score += 5;
    if (products.length > 0) score += 5;
    if (services.length > 0) score += 5;
    
    // 4. Customer Reviews & Ratings (Max 15 points)
    if (reviews.length > 0) {
      score += 5;
      if (averageRating >= 4.0) score += 10;
      else if (averageRating >= 3.0) score += 5;
    }
    
    // 5. Response Speed (Max 10 points)
    if (company.responseTime && company.responseTime !== 'Not set') {
      score += 10;
    } else {
      score += 5; // Default baseline points
    }
    
    return Math.min(score, 100);
  })();

  const processedCompany = {
    ...company,
    category: company.category || 'Business',
    district: company.district || '',
    state: company.state || 'Tamil Nadu',
    logoUrl: company.logoUrl || '',
    coverImageUrl: company.coverImageUrl || company.coverUrl || '',
    galleryImages: company.galleryImages || company.gallery || [],
    galleryVideos: company.galleryVideos || [],
    posts: company.posts || [],
    services: services,
    companyServicesTags: company.services || [],
    verificationBadges: visibleVerificationBadges,
    products: products,
    viewCount: company.viewCount || company.visitCount || 0,
    enquiryCount: company.enquiryCount || company.contactSubmitCount || 0,
    followerCount: company.followerCount || 0,
    rating: averageRating,
    reviewCount: reviews.length,
    totalJobsPosted: company.totalJobsPosted || jobs.length,
    totalProducts: products.length,
    joinedDate: company.createdAt || company.registeredAt || null,
    totalVisitors: company.visitCount || company.viewCount || 0,
    trustScore: company.trustScore || computedTrustScore,
    responseTime: company.responseTime || 'Not set',
    subscriptionBadge: getCompanyActivePlan(company),
    // Social / bio fields
    mission: company.mission || '',
    vision: company.vision || '',
    workingHours: company.workingHours || '',
    experience: company.experience || company.yearEstablished || '',
    teamSize: company.teamSize || '',
    brochureUrl: company.brochureUrl || '',
    twitter: company.twitter || '',
  };

  return <CompanyProfileClient company={processedCompany} jobs={jobs} reviews={reviews} />;
}
