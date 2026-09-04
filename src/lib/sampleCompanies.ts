/**
 * THENIJOBS — Sample & Showcase Verified Companies
 * Used as built-in fallback data for showcase slugs so demo URLs,
 * previews, and static exports always render rich, verified profiles
 * even if not yet populated in Firestore.
 */

import { Company, CompanyReview } from '@/lib/types';

export const SAMPLE_COMPANIES: Record<string, { company: Partial<Company>; jobs: any[]; reviews: any[] }> = {
  'gk-clinic-chinnamanur': {
    company: {
      id: 'sample_gk_clinic',
      name: 'GK Clinic & Child Care Center',
      slug: 'gk-clinic-chinnamanur',
      tagline: 'Trusted Family Healthcare & Pediatric Specialists in Chinnamanur',
      category: 'Healthcare & Hospital',
      subcategory: 'Multi-Speciality Clinic & Pediatrics',
      district: 'Chinnamanur',
      address: 'Main Road, Near Bus Stand, Chinnamanur, Theni District - 625515',
      phone: '+91 94432 18900',
      alternatePhone: '+91 98421 55678',
      whatsapp: '919443218900',
      email: 'contact@gkclinic.thenijobs.com',
      website: 'https://gkclinic.thenijobs.com',
      foundedYear: 2014,
      establishedYear: '2014',
      companySize: '11–50',
      description: 'GK Clinic & Child Care Center is Chinnamanur’s trusted neighborhood healthcare destination. We offer comprehensive general medicine, pediatric consultations, routine health check-ups, diagnostic laboratory support, and 24/7 emergency first-aid care with compassionate doctor consultations.',
      logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1200&auto=format&fit=crop&q=80',
      verificationStatus: 'verified',
      isActive: true,
      isVerified: true,
      isFeatured: true,
      isPremium: true,
      rating: 4.9,
      reviewCount: 48,
      viewCount: 1240,
      enquiryCount: 185,
      trustScore: 98,
      responseTime: '< 15 mins',
      galleryImages: [
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80',
      ],
      products: [
        {
          id: 'gk_prod_1',
          name: 'Essential Family Health Check-up Package',
          price: 999,
          priceRange: '₹999 / person',
          category: 'Diagnostic Health Package',
          description: 'Comprehensive annual screening covering CBC, blood sugar, lipid profile, liver function & doctor consultation.',
          imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&auto=format&fit=crop&q=80',
          whatsappEnquiry: true,
        },
        {
          id: 'gk_prod_2',
          name: 'Pediatric Growth & Nutrition Assessment',
          price: 499,
          priceRange: '₹499 / consultation',
          category: 'Child Care',
          description: 'Detailed developmental milestones check, vaccination planning, and dietary assessment for children 0-12 years.',
          imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=80',
          whatsappEnquiry: true,
        },
      ],
      services: [
        {
          id: 'gk_serv_1',
          name: 'General Physician & Outpatient Care',
          startingPrice: 250,
          priceRange: '₹250 per visit',
          category: 'Outpatient Consultation',
          description: 'Expert doctor diagnosis for fevers, respiratory issues, diabetes, hypertension, and daily ailments.',
          imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=80',
          whatsappEnquiry: true,
        },
        {
          id: 'gk_serv_2',
          name: 'Child Immunization & Vaccination',
          startingPrice: 300,
          priceRange: 'Standard rates',
          category: 'Pediatrics',
          description: 'All recommended government & optional pediatric vaccines stored in certified cold-chain conditions.',
          imageUrl: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=500&auto=format&fit=crop&q=80',
          whatsappEnquiry: true,
        },
        {
          id: 'gk_serv_3',
          name: 'Clinical Laboratory Testing & Blood Tests',
          startingPrice: 150,
          priceRange: 'Affordable lab rates',
          category: 'Diagnostics',
          description: 'Fast, computerized lab reports with home sample collection available in Chinnamanur surrounding villages.',
          imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500&auto=format&fit=crop&q=80',
          whatsappEnquiry: true,
        },
      ],
      founder: {
        name: 'Dr. G. Karthikeyan, MBBS, DCH',
        designation: 'Chief Medical Officer & Pediatrician',
        nativePlace: 'Chinnamanur, Theni',
        bio: 'Over 14+ years of clinical experience serving families across Chinnamanur, Cumbum, and Uthamapalayam with empathetic patient care.',
        photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
        message: 'Our mission is to bring high quality, ethical, and affordable healthcare to every family in our region.',
      },
      branches: [
        { id: 'b1', name: 'Main Clinic', address: 'Main Road, Bus Stand, Chinnamanur', phone: '+91 94432 18900' },
        { id: 'b2', name: 'Pharmacy & Sample Point', address: 'Bazaar Street, Chinnamanur', phone: '+91 98421 55678' },
      ],
      verificationBadges: {
        mobileVerified: true,
        emailVerified: true,
        gstVerified: true,
        businessVerified: true,
      },
    },
    jobs: [
      {
        id: 'job_gk_nurse',
        title: 'Staff Nurse (GNM / B.Sc Nursing)',
        type: 'Full Time',
        salary: '₹14,000 - ₹20,000 / month',
        openings: 2,
        posted: '1 day ago',
      },
      {
        id: 'job_gk_lab_tech',
        title: 'Medical Lab Technician (DMLT / MLT)',
        type: 'Full Time',
        salary: '₹12,000 - ₹18,000 / month',
        openings: 1,
        posted: '3 days ago',
      },
      {
        id: 'job_gk_reception',
        title: 'Clinic Receptionist & Patient Billing',
        type: 'Full Time',
        salary: '₹10,000 - ₹14,000 / month',
        openings: 1,
        posted: 'Just now',
      },
    ],
    reviews: [
      {
        id: 'rev_1',
        name: 'Murugesan Pandian',
        rating: 5,
        title: 'Excellent Doctor & Fast Recovery',
        content: 'Dr. Karthikeyan listened patiently to my child’s symptoms. Within 2 days the fever subsided. The clinic staff is very polite and lab reports were delivered via WhatsApp.',
        date: '15 Aug 2026',
      },
      {
        id: 'rev_2',
        name: 'Kavitha S',
        rating: 5,
        title: 'Very Clean Clinic and Friendly Staff',
        content: 'Best child clinic in Chinnamanur. Very neat premises, gentle nursing care for vaccinations, and no unnecessary waiting time.',
        date: '02 Aug 2026',
      },
    ],
  },
  'digital-theni-solutions': {
    company: {
      id: 'sample_digital_theni',
      name: 'Digital Theni Solutions',
      slug: 'digital-theni-solutions',
      tagline: 'Website Development, Digital Marketing & Software Solutions',
      category: 'IT, Software & Digital',
      subcategory: 'Software & Web Development',
      district: 'Theni',
      address: 'Near Madurai Road Junction, Theni - 625531',
      phone: '+91 93605 19460',
      whatsapp: '919360519460',
      email: 'info@digitaltheni.com',
      website: 'https://digitaltheni.thenijobs.com',
      foundedYear: 2020,
      establishedYear: '2020',
      companySize: '11–50',
      description: 'Digital Theni Solutions delivers modern web applications, e-commerce stores, WhatsApp automation, and local SEO services to help businesses across Tamil Nadu scale online.',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
      verificationStatus: 'verified',
      isActive: true,
      isVerified: true,
      isFeatured: true,
      isPremium: true,
      rating: 5.0,
      reviewCount: 32,
      viewCount: 2890,
      enquiryCount: 410,
      trustScore: 99,
      responseTime: '< 10 mins',
      products: [
        {
          id: 'dts_prod_1',
          name: 'Business E-Commerce & Catalogue Website',
          price: 14999,
          priceRange: 'From ₹14,999',
          category: 'Web Software',
          description: 'Full-featured online store with payment gateway, product catalogue, and WhatsApp order alerts.',
          whatsappEnquiry: true,
        },
      ],
      services: [
        {
          id: 'dts_serv_1',
          name: 'Custom Web & Mobile App Development',
          startingPrice: 9999,
          priceRange: '₹9,999 - ₹49,999',
          category: 'Software Development',
          description: 'Modern Next.js, React, and mobile app design optimized for speed, SEO, and lead generation.',
          whatsappEnquiry: true,
        },
      ],
      verificationBadges: {
        mobileVerified: true,
        emailVerified: true,
        gstVerified: true,
        businessVerified: true,
      },
    },
    jobs: [
      {
        id: 'job_dts_react',
        title: 'Full Stack React / Next.js Developer',
        type: 'Full Time',
        salary: '₹25,000 - ₹45,000 / month',
        openings: 2,
        posted: '2 days ago',
      },
    ],
    reviews: [
      {
        id: 'dts_rev_1',
        name: 'Senthil Nathan',
        rating: 5,
        title: 'Outstanding Work & Speed',
        content: 'Created our company website in record time with perfect mobile responsiveness. Highly recommend!',
        date: '20 Jul 2026',
      },
    ],
  },
  'arasu-pandi-farm-services': {
    company: {
      id: 'sample_arasu_pandi',
      name: 'Arasu Pandi Farm Services & Agro Inputs',
      slug: 'arasu-pandi-farm-services',
      tagline: 'Premium Seeds, Drip Irrigation & Agricultural Equipment in Theni',
      category: 'Agriculture & Farming',
      subcategory: 'Agro Products & Machinery',
      district: 'Theni',
      address: 'Bodi Road, Theni - 625531',
      phone: '+91 70948 26886',
      whatsapp: '917094826886',
      email: 'arasupandiagro@gmail.com',
      foundedYear: 2011,
      establishedYear: '2011',
      companySize: '11–50',
      description: 'Leading agricultural inputs distributor supporting farmers across Theni, Cumbum Valley, and Periyakulam with quality hybrid seeds, organic fertilizers, and micro-irrigation systems.',
      logoUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=300&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80',
      verificationStatus: 'verified',
      isActive: true,
      isVerified: true,
      isFeatured: true,
      isPremium: true,
      rating: 4.9,
      reviewCount: 54,
      viewCount: 3410,
      enquiryCount: 520,
      trustScore: 97,
      responseTime: '< 30 mins',
      verificationBadges: {
        mobileVerified: true,
        emailVerified: true,
        gstVerified: true,
        businessVerified: true,
      },
    },
    jobs: [
      {
        id: 'job_ap_agri_officer',
        title: 'Agricultural Sales Field Executive',
        type: 'Full Time',
        salary: '₹18,000 - ₹28,000 / month',
        openings: 3,
        posted: 'Yesterday',
      },
    ],
    reviews: [
      {
        id: 'ap_rev_1',
        name: 'Vellaisamy R',
        rating: 5,
        title: 'Best Seed Quality in Theni',
        content: 'Good yield guaranteed. Fast doorstep delivery to farms.',
        date: '10 Aug 2026',
      },
    ],
  },
};

/**
 * Look up one of the curated showcase companies above. Returns null for anything else.
 *
 * This used to synthesise a company from the slug itself for ANY unrecognised URL —
 * complete with a "verified"/"Authorized" badge, a 4.8 rating, trust badges, and
 * THENIJOBS's own phone number as the business's contact. That meant /company/<anything>
 * rendered a convincing, SEO-indexable business profile for a business that does not
 * exist: a trust and moderation failure, a misrepresentation risk (real phone number on a
 * fabricated listing), and an open door to search-spam penalties for the whole domain.
 * Never reintroduce a generative branch here — an unknown slug must reach the caller's
 * "not found" state.
 */
export function getSampleCompanyData(slug: string) {
  const cleanSlug = slug.toLowerCase().trim();
  return SAMPLE_COMPANIES[cleanSlug] ?? null;
}
