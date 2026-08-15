// ============================================================
// THENIJOBS — Application-wide Constants
// ============================================================

import type { SubscriptionPlan } from '@/lib/types';

// ===== OFFICIAL CONTACT NUMBERS & DETAILS =====
export const SITE_CONTACT = {
  phone1: '+91 93605 19460',
  phone1Raw: '+919360519460',
  phone2: '+91 70948 26886',
  phone2Raw: '+917094826886',
  whatsapp: '919360519460',
  whatsappUrl: 'https://wa.me/919360519460',
  email: 'info@thenijobs.com',
  supportEmail: 'support@thenijobs.com',
  addressLine1: 'North Street, A.M. Patty',
  addressLine2: 'Uthamapalayam, Theni District, Tamil Nadu - 625533, India',
  fullAddress: 'North Street, A.M. Patty, Uthamapalayam, Theni District, Tamil Nadu, India.',
  location: 'Theni, Tamil Nadu, India',
};

// ===== SUBSCRIPTION PLANS (ANNUAL PRICING STRATEGY — 4 TIERS) =====
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_free',
    name: 'Free',
    slug: 'free',
    price: 0,
    monthlyEquivalent: 0,
    dailyEquivalent: 0,
    period: 'forever',
    features: [
      'Basic Company Profile',
      'View Jobs & Business Listings',
      'Apply for Standard Jobs',
      '1 Active Job Posting',
      '2 Job Alerts',
      'Product Catalogue (3 Products)',
      'Service Listings (3 Services)',
      '6 Gallery Images',
      '1 Website Template & 2 Themes',
      'Basic Digital Visiting Card',
      'Basic SEO & Schema',
      'QR Code & Public Profile URL',
      'Basic WhatsApp Enquiry',
      'Google Maps & Contact Form',
      'Customer Reviews',
      'Basic Verification Badge',
    ],
    notIncluded: [
      'Custom Cover Banner',
      'Premium Digital Visiting Card',
      'Staff ID Cards',
      'Click-to-Call & FAQ Section',
      'Enhanced SEO & Custom Meta Tags',
      'Business Announcements & Offers',
    ],
    recommended: false,
    bestFor: 'New Users & Startups',
    icon: 'Shield',
    badge: '🆓 Basic Badge',
  },
  {
    id: 'plan_standard',
    name: 'Standard',
    slug: 'standard',
    price: 480,
    monthlyEquivalent: 40,
    dailyEquivalent: 1.31,
    period: 'year',
    badge: '🥈 Silver Verified',
    features: [
      'Everything in Free Plan',
      '10 Active Job Postings',
      '10 Job Alerts',
      'Product Catalogue (20 Products)',
      'Service Listings (10 Services)',
      '10 Gallery Images & 2 Videos',
      '5 Templates & 5 Color Themes',
      'Custom Cover Banner',
      'Premium Digital Visiting Card',
      '5 Team Members & 3 Branches',
      'Click-to-Call & FAQ Section',
      'Photo Albums & Review Photos',
      'Business Brochure PDF',
      'Enhanced SEO & Custom Meta Tags',
      'View Counters (Profile, Jobs, Business)',
      'Business Announcements & Offers',
      'Silver Verified Badge',
    ],
    notIncluded: [
      'Video Banner',
      'Staff ID Cards (25+)',
      'Google Analytics & Meta Pixel',
      'Advanced Analytics & Leads Dashboard',
      'Blog, Booking & Live Chat',
    ],
    recommended: false,
    bestFor: 'Local Shops & Growing Businesses',
    icon: 'Star',
  },
  {
    id: 'plan_premium',
    name: 'Premium',
    slug: 'premium',
    price: 1200,
    monthlyEquivalent: 100,
    dailyEquivalent: 3.28,
    period: 'year',
    badge: '⭐ MOST POPULAR',
    features: [
      'Everything in Standard Plan',
      '50 Active Job Postings',
      '50 Job Alerts',
      'Product Catalogue (100 Products)',
      'Service Listings (50 Services)',
      '50 Gallery Images & 10 Videos',
      '15 Premium Templates & 15 Themes',
      'Video Banner',
      'Premium+ Digital Card & 25 Staff IDs',
      '20 Team Members & 20 Branches',
      'Awards & Certifications Showcase',
      'Google Analytics & Meta Pixel',
      'Advanced Analytics & Leads Dashboard',
      'Blog, Booking & Live Chat',
      'Dynamic QR Code',
      'Gold Verified Badge',
      'Featured Search Priority',
    ],
    notIncluded: [
      'Unlimited Jobs, Products & Services',
      'Custom Domain Support',
      'AI Company Assistant (Chatbot)',
      'CRM Dashboard & Multi-Admin Access',
    ],
    recommended: true,
    bestFor: 'Established Companies',
    icon: 'Crown',
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    price: 5000,
    monthlyEquivalent: 417,
    dailyEquivalent: 13.69,
    period: 'year',
    badge: '💎 ENTERPRISE',
    features: [
      'Everything in Premium Plan',
      'Unlimited Jobs, Products & Services',
      'Unlimited Gallery, Videos & Albums',
      'Unlimited Templates & Themes',
      'Advanced Branding & Custom Colors/Fonts',
      'Enterprise Digital Card & Unlimited Staff IDs',
      'Custom Domain Support',
      'AI Company Assistant (Chatbot)',
      'AI SEO Content & AI Generated Meta Tags',
      'CRM Dashboard & Multi-Admin Access',
      'Enterprise Careers Portal',
      'CEO Message & Interactive Timeline',
      'Partner Logo Showcase',
      'Platinum Corporate Badge',
      'Homepage Featured & Top Search Priority',
      '24×7 Priority Support',
    ],
    notIncluded: [],
    recommended: false,
    bestFor: 'Large Enterprises & Factories',
    icon: 'Building2',
  },
];

// ===== PLAN FEATURE ACCESS MATRIX =====
export const PLAN_FEATURE_MATRIX = {
  free: {
    activeJobsLimit: 1,
    portfolioType: 'none',
    digitalIdCard: false,
    qrCode: false,
    reviews: false,
    productsListing: false,
    servicesListing: false,
    portfolioProjects: false,
    founderProfile: false,
    teamShowcase: false,
    customSections: false,
    featuredCompany: false,
    candidateSearch: 'none',
    resumeViewing: false,
    interviewManagement: false,
    leadManagement: false,
    advancedAnalytics: false,
    seoLevel: 'none',
    multiUserHr: false,
    branchManagement: false,
    customBranding: false,
    prioritySupport: false,
  },
  basic: {
    activeJobsLimit: 5,
    portfolioType: 'basic',
    digitalIdCard: true,
    qrCode: true,
    reviews: false,
    productsListing: false,
    servicesListing: false,
    portfolioProjects: false,
    founderProfile: false,
    teamShowcase: false,
    customSections: false,
    featuredCompany: false,
    candidateSearch: 'none',
    resumeViewing: false,
    interviewManagement: false,
    leadManagement: true,
    advancedAnalytics: false,
    seoLevel: 'basic',
    multiUserHr: false,
    branchManagement: false,
    customBranding: false,
    prioritySupport: false,
  },
  standard: {
    activeJobsLimit: 15,
    portfolioType: 'full',
    digitalIdCard: true,
    qrCode: true,
    reviews: true,
    productsListing: true,
    servicesListing: true,
    portfolioProjects: true,
    founderProfile: true,
    teamShowcase: true,
    customSections: true,
    featuredCompany: true,
    candidateSearch: 'basic',
    resumeViewing: true,
    interviewManagement: true,
    leadManagement: true,
    advancedAnalytics: false,
    seoLevel: 'basic',
    multiUserHr: false,
    branchManagement: false,
    customBranding: false,
    prioritySupport: true,
  },
  premium: {
    activeJobsLimit: 999,
    portfolioType: 'premium',
    digitalIdCard: true,
    qrCode: true,
    reviews: true,
    productsListing: true,
    servicesListing: true,
    portfolioProjects: true,
    founderProfile: true,
    teamShowcase: true,
    customSections: true,
    featuredCompany: true,
    candidateSearch: 'advanced',
    resumeViewing: true,
    interviewManagement: true,
    leadManagement: true,
    advancedAnalytics: true,
    seoLevel: 'advanced',
    multiUserHr: false,
    branchManagement: false,
    customBranding: false,
    prioritySupport: true,
  },
  enterprise: {
    activeJobsLimit: 9999,
    portfolioType: 'custom',
    digitalIdCard: true,
    qrCode: true,
    reviews: true,
    productsListing: true,
    servicesListing: true,
    portfolioProjects: true,
    founderProfile: true,
    teamShowcase: true,
    customSections: true,
    featuredCompany: true,
    candidateSearch: 'advanced',
    resumeViewing: true,
    interviewManagement: true,
    leadManagement: true,
    advancedAnalytics: true,
    seoLevel: 'advanced',
    multiUserHr: true,
    branchManagement: true,
    customBranding: true,
    prioritySupport: true,
  },
} as const;

// ===== JOB CATEGORIES =====
export const JOB_CATEGORIES = [
  'IT & Software',
  'Healthcare',
  'Education',
  'Agriculture',
  'Construction',
  'Manufacturing',
  'Retail',
  'Finance',
  'Hospitality',
  'Transportation',
  'Textile',
  'Automobile',
  'Real Estate',
  'Media',
  'Government',
  'BPO',
  'Sales & Marketing',
  'Accounting',
  'Legal',
  'HR',
] as const;

export type JobCategory = typeof JOB_CATEGORIES[number];

// ===== SKILLS =====
export const SKILLS = [
  // Tech
  'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Node.js',
  'SQL', 'MongoDB', 'AWS', 'HTML/CSS', 'Flutter', 'Android', 'iOS',
  'Data Entry', 'MS Office', 'Tally', 'AutoCAD',
  // Professional
  'Communication', 'Leadership', 'Teamwork', 'Problem Solving',
  'Time Management', 'Customer Service', 'Sales', 'Negotiation',
  'Accounting', 'Marketing', 'Content Writing', 'Graphic Design',
  // Trades
  'Welding', 'Electrical', 'Plumbing', 'Carpentry', 'Driving',
  'Machine Operation', 'Quality Control', 'Packaging',
  // Tamil Nadu specific
  'Tamil Typing', 'English Typing', 'Tailoring', 'Embroidery',
  'Agriculture Management', 'Silk Weaving', 'Logistics',
] as const;

// ===== EXPERIENCE LEVELS =====
export const EXPERIENCE_LEVELS = [
  'Fresher',
  '1-2 Years',
  '3-5 Years',
  '5-10 Years',
  '10+ Years',
] as const;

export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];

// ===== SALARY RANGES (INR per month) =====
export const SALARY_RANGES = [
  { label: '₹5,000 – ₹10,000', min: 5000, max: 10000 },
  { label: '₹10,000 – ₹15,000', min: 10000, max: 15000 },
  { label: '₹15,000 – ₹20,000', min: 15000, max: 20000 },
  { label: '₹20,000 – ₹30,000', min: 20000, max: 30000 },
  { label: '₹30,000 – ₹50,000', min: 30000, max: 50000 },
  { label: '₹50,000 – ₹75,000', min: 50000, max: 75000 },
  { label: '₹75,000 – ₹1,00,000', min: 75000, max: 100000 },
  { label: '₹1,00,000+', min: 100000, max: 999999 },
] as const;

// ===== APPLICATION STATUS CONFIG =====
export const APPLICATION_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  applied: {
    label: 'Applied',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    icon: 'Send',
  },
  shortlisted: {
    label: 'Shortlisted',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    icon: 'Star',
  },
  interview_scheduled: {
    label: 'Interview Scheduled',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    icon: 'Calendar',
  },
  selected: {
    label: 'Selected',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    icon: 'CheckCircle',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700 bg-red-50 border-red-200',
    icon: 'XCircle',
  },
};

// ===== LEAD STATUS CONFIG =====
export const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  contacted: { label: 'Contacted', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  qualified: { label: 'Qualified', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  converted: { label: 'Converted', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  lost: { label: 'Lost', color: 'text-red-700 bg-red-50 border-red-200' },
};

// ===== NAVIGATION ITEMS =====

export interface NavItem {
  label: string;
  tamilLabel: string;
  icon: string;
  href: string;
}

/** Admin dashboard sidebar navigation */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', tamilLabel: 'டாஷ்போர்ட்', icon: 'LayoutDashboard', href: '/admin/dashboard' },
  { label: 'Users', tamilLabel: 'பயனர்கள்', icon: 'Users', href: '/admin/users' },
  { label: 'Companies', tamilLabel: 'நிறுவனங்கள்', icon: 'Building2', href: '/admin/companies' },
  { label: 'Jobs', tamilLabel: 'வேலைகள்', icon: 'Briefcase', href: '/admin/jobs' },
  { label: 'Applications', tamilLabel: 'விண்ணப்பங்கள்', icon: 'FileText', href: '/admin/applications' },
  { label: 'Leads', tamilLabel: 'லீட்கள்', icon: 'Target', href: '/admin/leads' },
  { label: 'Services', tamilLabel: 'சேவைகள்', icon: 'Wrench', href: '/admin/services' },
  { label: 'Subscriptions', tamilLabel: 'சந்தாக்கள்', icon: 'CreditCard', href: '/admin/subscriptions' },
  { label: 'Advertisements', tamilLabel: 'விளம்பரங்கள்', icon: 'Megaphone', href: '/admin/advertisements' },
  { label: 'Franchises', tamilLabel: 'பிராஞ்சைஸ்', icon: 'MapPin', href: '/admin/franchises' },
  { label: 'Support Tickets', tamilLabel: 'ஆதரவு டிக்கெட்', icon: 'LifeBuoy', href: '/admin/support' },
  { label: 'Analytics', tamilLabel: 'பகுப்பாய்வு', icon: 'BarChart3', href: '/admin/analytics' },
  { label: 'Activity Log', tamilLabel: 'செயல்பாடு பதிவு', icon: 'ScrollText', href: '/admin/activity' },
  { label: 'Settings', tamilLabel: 'அமைப்புகள்', icon: 'Settings', href: '/admin/settings' },
];

/** Employer dashboard sidebar navigation */
export const EMPLOYER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', tamilLabel: 'டாஷ்போர்ட்', icon: 'LayoutDashboard', href: '/employer/dashboard' },
  { label: 'Post Job', tamilLabel: 'வேலை பதிவிடு', icon: 'PlusCircle', href: '/employer/post-job' },
  { label: 'My Jobs', tamilLabel: 'எனது வேலைகள்', icon: 'Briefcase', href: '/employer/jobs' },
  { label: 'Applications', tamilLabel: 'விண்ணப்பங்கள்', icon: 'FileText', href: '/employer/applications' },
  { label: 'Interviews', tamilLabel: 'நேர்காணல்கள்', icon: 'Video', href: '/employer/interviews' },
  { label: 'Candidates', tamilLabel: 'விண்ணப்பதாரர்கள்', icon: 'Users', href: '/employer/candidates' },
  { label: 'Company Profile', tamilLabel: 'நிறுவன விவரம்', icon: 'Building2', href: '/employer/company' },
  { label: 'Leads', tamilLabel: 'லீட்கள்', icon: 'Target', href: '/employer/leads' },
  { label: 'Messages', tamilLabel: 'செய்திகள்', icon: 'MessageSquare', href: '/employer/messages' },
  { label: 'Subscription', tamilLabel: 'சந்தா', icon: 'CreditCard', href: '/employer/subscription' },
  { label: 'Analytics', tamilLabel: 'பகுப்பாய்வு', icon: 'BarChart3', href: '/employer/analytics' },
  { label: 'My Website', tamilLabel: 'எனது இணையதளம்', icon: 'Globe', href: '/employer/website' },
  { label: 'Settings', tamilLabel: 'அமைப்புகள்', icon: 'Settings', href: '/employer/settings' },
];

/** Job seeker dashboard sidebar navigation */
export const SEEKER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', tamilLabel: 'டாஷ்போர்ட்', icon: 'LayoutDashboard', href: '/seeker/dashboard' },
  { label: 'My Profile', tamilLabel: 'எனது சுயவிவரம்', icon: 'UserCircle', href: '/seeker/profile' },
  { label: 'Search Jobs', tamilLabel: 'வேலை தேடு', icon: 'Search', href: '/jobs' },
  { label: 'My Applications', tamilLabel: 'எனது விண்ணப்பங்கள்', icon: 'FileText', href: '/seeker/applications' },
  { label: 'Saved Jobs', tamilLabel: 'சேமித்த வேலைகள்', icon: 'Bookmark', href: '/seeker/saved' },
  { label: 'Interviews', tamilLabel: 'நேர்காணல்கள்', icon: 'Video', href: '/seeker/interviews' },
  { label: 'Messages', tamilLabel: 'செய்திகள்', icon: 'MessageSquare', href: '/seeker/messages' },
  { label: 'Notifications', tamilLabel: 'அறிவிப்புகள்', icon: 'Bell', href: '/seeker/notifications' },
  { label: 'My Portfolio', tamilLabel: 'எனது போர்ட்ஃபோலியோ', icon: 'Globe', href: '/seeker/website' },
  { label: 'Subscription', tamilLabel: 'சந்தா', icon: 'CreditCard', href: '/seeker/subscription' },
  { label: 'Settings', tamilLabel: 'அமைப்புகள்', icon: 'Settings', href: '/seeker/settings' },
];

// ===== PORTFOLIO TEMPLATES (15) =====

import type { PortfolioTemplate, SectionType, PlanTier } from '@/lib/types/portfolio';

export const PORTFOLIO_TEMPLATES: PortfolioTemplate[] = [
  // ── FREE (3) ────────────────────────────────────────
  {
    id: 'classic-business', name: 'Classic Business', plan: 'free',
    description: 'Clean, professional layout for local businesses. Logo, about, services, contact, and gallery.',
    bestFor: 'Local Business', thumbnail: '/templates/classic-business.jpg',
    category: 'business',
    sections: ['hero', 'about', 'services', 'gallery', 'contact', 'location-map', 'social-links'],
    features: ['Basic hero', 'About section', 'Services list', 'Contact info', 'Gallery (6 images)', 'WhatsApp & Call', 'Google Maps'],
  },
  {
    id: 'clean-corporate', name: 'Clean Corporate', plan: 'free',
    description: 'Minimal corporate layout with hero section and social links. Mobile responsive.',
    bestFor: 'Companies', thumbnail: '/templates/clean-corporate.jpg',
    category: 'business',
    sections: ['hero', 'about', 'services', 'contact', 'social-links'],
    features: ['Hero section', 'Company about', 'Services', 'Contact details', 'Social links', 'Mobile responsive'],
  },
  {
    id: 'modern-services', name: 'Modern Services', plan: 'free',
    description: 'Service-focused template with service cards, images, and enquiry buttons.',
    bestFor: 'Service Business', thumbnail: '/templates/modern-services.jpg',
    category: 'service',
    sections: ['hero', 'about', 'services', 'gallery', 'contact', 'social-links'],
    features: ['Service cards', 'Service images', 'WhatsApp enquiry', 'Call button', 'Company profile', 'Contact section'],
  },

  // ── STANDARD (3) ────────────────────────────────────
  {
    id: 'professional-company', name: 'Professional Company', plan: 'standard',
    description: 'Professional hero, products, testimonials, Google Maps, and custom colours.',
    bestFor: 'SMEs', thumbnail: '/templates/professional-company.jpg',
    category: 'business',
    sections: ['hero', 'about', 'services', 'products', 'gallery', 'testimonials', 'contact', 'location-map', 'social-links'],
    features: ['Professional hero', 'Products & Services', 'Gallery', 'Testimonials', 'Google Maps', 'Custom colours', 'Better SEO'],
  },
  {
    id: 'business-showcase', name: 'Business Showcase', plan: 'standard',
    description: 'Product and service focused with featured items, categories, and reviews.',
    bestFor: 'Products + Services', thumbnail: '/templates/business-showcase.jpg',
    category: 'product',
    sections: ['hero', 'about', 'products', 'services', 'gallery', 'testimonials', 'contact', 'social-links'],
    features: ['Featured products', 'Product categories', 'Service cards', 'Reviews', 'Gallery', 'WhatsApp order'],
  },
  {
    id: 'local-business-pro', name: 'Local Business Pro', plan: 'standard',
    description: 'Optimized for local market visibility with working hours, directions, and local SEO.',
    bestFor: 'Local/District Businesses', thumbnail: '/templates/local-business-pro.jpg',
    category: 'business',
    sections: ['hero', 'about', 'services', 'products', 'working-hours', 'gallery', 'testimonials', 'location-map', 'contact', 'social-links'],
    features: ['Business info', 'Working hours', 'Google Maps + Directions', 'Products & Services', 'Customer reviews', 'Local SEO'],
  },

  // ── PREMIUM (5) ─────────────────────────────────────
  {
    id: 'corporate-premium', name: 'Corporate Premium', plan: 'premium',
    description: 'Advanced corporate website with team, projects, careers, and animations.',
    bestFor: 'Established Companies', thumbnail: '/templates/corporate-premium.jpg',
    category: 'business',
    sections: ['hero', 'about', 'services', 'products', 'team', 'testimonials', 'projects', 'gallery', 'careers', 'contact', 'social-links'],
    features: ['Advanced hero', 'Team section', 'Projects showcase', 'Careers page', 'Advanced SEO', 'Custom sections', 'Animations'],
  },
  {
    id: 'product-marketplace', name: 'Product Marketplace', plan: 'premium',
    description: 'Full product catalogue with search, categories, and WhatsApp ordering.',
    bestFor: 'Product Sellers', thumbnail: '/templates/product-marketplace.jpg',
    category: 'product',
    sections: ['hero', 'about', 'products', 'gallery', 'testimonials', 'faq', 'contact', 'social-links'],
    features: ['Product catalogue', 'Categories & search', 'Product details', 'WhatsApp order', 'Related products', 'Company profile'],
  },
  {
    id: 'service-marketplace', name: 'Service Marketplace', plan: 'premium',
    description: 'Service catalogue with pricing, enquiry forms, and testimonials.',
    bestFor: 'Service Providers', thumbnail: '/templates/service-marketplace.jpg',
    category: 'service',
    sections: ['hero', 'about', 'services', 'testimonials', 'faq', 'gallery', 'contact', 'social-links'],
    features: ['Service catalogue', 'Categories', 'Service pricing', 'Enquiry forms', 'Testimonials', 'Related services'],
  },
  {
    id: 'executive-company', name: 'Executive Company', plan: 'premium',
    description: 'Professional firm website with leadership, achievements, and client showcase.',
    bestFor: 'Professional Firms', thumbnail: '/templates/executive-company.jpg',
    category: 'business',
    sections: ['hero', 'about', 'leadership', 'team', 'services', 'projects', 'achievements', 'testimonials', 'clients', 'careers', 'contact'],
    features: ['Executive hero', 'Leadership section', 'Achievements', 'Client showcase', 'Projects', 'Careers', 'Advanced SEO'],
  },
  {
    id: 'creative-business', name: 'Creative Business', plan: 'premium',
    description: 'Modern visual design with portfolio grid, case studies, and dynamic animations.',
    bestFor: 'Creative/Digital Companies', thumbnail: '/templates/creative-business.jpg',
    category: 'creative',
    sections: ['hero', 'about', 'portfolio-grid', 'services', 'case-studies', 'gallery', 'team', 'testimonials', 'video', 'contact', 'social-links'],
    features: ['Modern visual hero', 'Portfolio grid', 'Case studies', 'Video section', 'Dynamic animations', 'Custom branding'],
  },

  // ── ENTERPRISE (4) ──────────────────────────────────
  {
    id: 'enterprise-corporate', name: 'Enterprise Corporate', plan: 'enterprise',
    description: 'Full-featured corporate website with news, analytics, and custom domain support.',
    bestFor: 'Large Companies', thumbnail: '/templates/enterprise-corporate.jpg',
    category: 'enterprise',
    sections: ['hero', 'about', 'services', 'products', 'projects', 'team', 'leadership', 'careers', 'testimonials', 'clients', 'gallery', 'news', 'contact'],
    features: ['All premium features', 'News/Updates', 'Advanced analytics', 'Custom domain', 'Multi-admin access'],
  },
  {
    id: 'luxury-brand', name: 'Luxury Brand', plan: 'enterprise',
    description: 'Premium full-screen design with luxury animations and brand-first experience.',
    bestFor: 'Premium Brands', thumbnail: '/templates/luxury-brand.jpg',
    category: 'enterprise',
    sections: ['hero', 'about', 'products', 'gallery', 'testimonials', 'team', 'achievements', 'timeline', 'contact'],
    features: ['Full-screen hero', 'Premium animations', 'Brand story', 'Collections', 'Custom typography', 'Advanced colour system'],
  },
  {
    id: 'business-careers', name: 'Business + Careers', plan: 'enterprise',
    description: 'Corporate website with integrated careers portal, job listings, and company culture.',
    bestFor: 'Companies Hiring', thumbnail: '/templates/business-careers.jpg',
    category: 'career',
    sections: ['hero', 'about', 'services', 'products', 'careers', 'team', 'testimonials', 'gallery', 'contact'],
    features: ['Company profile', 'Job listings', 'Careers page', 'Company culture', 'Apply button', 'Benefits section'],
  },
  {
    id: 'ultimate-business-pro', name: 'Ultimate Business Pro', plan: 'enterprise',
    description: 'The ultimate business website with every section, AI assistance, and full customization.',
    bestFor: 'Full-featured Company', thumbnail: '/templates/ultimate-business-pro.jpg',
    category: 'enterprise',
    sections: ['hero', 'about', 'services', 'products', 'portfolio-grid', 'projects', 'team', 'leadership', 'ceo-message', 'careers', 'testimonials', 'clients', 'achievements', 'timeline', 'awards', 'gallery', 'video', 'news', 'faq', 'branches', 'contact', 'social-links'],
    features: ['All sections', 'AI content assistance', 'Advanced customization', 'Custom sections', 'Premium animations', 'Custom domain', 'Advanced branding'],
  },
];

// ===== PORTFOLIO SECTION DEFINITIONS =====

export interface PortfolioSectionDef {
  type: SectionType;
  label: string;
  tamilLabel: string;
  icon: string;
  description: string;
  requiredPlan: PlanTier;
}

export const PORTFOLIO_SECTION_DEFS: PortfolioSectionDef[] = [
  { type: 'hero', label: 'Hero Banner', tamilLabel: 'ஹீரோ பேனர்', icon: 'Image', description: 'Full-width banner with headline', requiredPlan: 'free' },
  { type: 'about', label: 'About', tamilLabel: 'எங்களைப் பற்றி', icon: 'Info', description: 'Company/person about section', requiredPlan: 'free' },
  { type: 'services', label: 'Services', tamilLabel: 'சேவைகள்', icon: 'Briefcase', description: 'Service cards with details', requiredPlan: 'free' },
  { type: 'contact', label: 'Contact', tamilLabel: 'தொடர்புகொள்ள', icon: 'Phone', description: 'Contact info, form, map', requiredPlan: 'free' },
  { type: 'gallery', label: 'Gallery', tamilLabel: 'கேலரி', icon: 'ImageIcon', description: 'Photo gallery', requiredPlan: 'free' },
  { type: 'social-links', label: 'Social Links', tamilLabel: 'சமூக இணைப்புகள்', icon: 'Share2', description: 'Social media links', requiredPlan: 'free' },
  { type: 'location-map', label: 'Location Map', tamilLabel: 'இருப்பிட வரைபடம்', icon: 'MapPin', description: 'Google Maps embed', requiredPlan: 'free' },
  { type: 'products', label: 'Products', tamilLabel: 'பொருட்கள்', icon: 'Package', description: 'Product catalogue cards', requiredPlan: 'standard' },
  { type: 'testimonials', label: 'Testimonials', tamilLabel: 'சான்றுகள்', icon: 'Quote', description: 'Customer reviews', requiredPlan: 'standard' },
  { type: 'working-hours', label: 'Working Hours', tamilLabel: 'வேலை நேரம்', icon: 'Clock', description: 'Business hours schedule', requiredPlan: 'standard' },
  { type: 'faq', label: 'FAQ', tamilLabel: 'கேள்விகள்', icon: 'HelpCircle', description: 'Frequently asked questions', requiredPlan: 'standard' },
  { type: 'team', label: 'Team', tamilLabel: 'குழு', icon: 'Users', description: 'Team member showcase', requiredPlan: 'premium' },
  { type: 'projects', label: 'Projects', tamilLabel: 'திட்டங்கள்', icon: 'FolderOpen', description: 'Project portfolio', requiredPlan: 'premium' },
  { type: 'careers', label: 'Careers', tamilLabel: 'வேலை வாய்ப்புகள்', icon: 'Briefcase', description: 'Job openings', requiredPlan: 'premium' },
  { type: 'achievements', label: 'Achievements', tamilLabel: 'சாதனைகள்', icon: 'Award', description: 'Stats & achievements', requiredPlan: 'premium' },
  { type: 'clients', label: 'Clients', tamilLabel: 'வாடிக்கையாளர்கள்', icon: 'Building2', description: 'Client logo showcase', requiredPlan: 'premium' },
  { type: 'video', label: 'Video', tamilLabel: 'வீடியோ', icon: 'Video', description: 'Video embed section', requiredPlan: 'premium' },
  { type: 'portfolio-grid', label: 'Portfolio Grid', tamilLabel: 'படைப்புகள்', icon: 'Grid', description: 'Visual portfolio grid', requiredPlan: 'premium' },
  { type: 'case-studies', label: 'Case Studies', tamilLabel: 'வழக்கு ஆய்வுகள்', icon: 'FileSearch', description: 'Detailed case studies', requiredPlan: 'premium' },
  { type: 'leadership', label: 'Leadership', tamilLabel: 'தலைமை', icon: 'Crown', description: 'Leadership profiles', requiredPlan: 'enterprise' },
  { type: 'ceo-message', label: 'CEO Message', tamilLabel: 'CEO செய்தி', icon: 'MessageCircle', description: 'CEO/founder message', requiredPlan: 'enterprise' },
  { type: 'timeline', label: 'Timeline', tamilLabel: 'காலவரிசை', icon: 'Clock', description: 'Company history timeline', requiredPlan: 'enterprise' },
  { type: 'news', label: 'News & Updates', tamilLabel: 'செய்திகள்', icon: 'Newspaper', description: 'Company news', requiredPlan: 'enterprise' },
  { type: 'awards', label: 'Awards', tamilLabel: 'விருதுகள்', icon: 'Trophy', description: 'Awards & certifications', requiredPlan: 'enterprise' },
  { type: 'branches', label: 'Branches', tamilLabel: 'கிளைகள்', icon: 'Building', description: 'Branch locations', requiredPlan: 'enterprise' },
  { type: 'custom', label: 'Custom Section', tamilLabel: 'தனிப்பயன்', icon: 'Plus', description: 'Free-form custom section', requiredPlan: 'enterprise' },
];

// ===== TEMPLATE-PLAN ACCESS =====

export const TEMPLATE_PLAN_ACCESS: Record<PlanTier, string[]> = {
  free: ['classic-business', 'clean-corporate', 'modern-services'],
  standard: ['classic-business', 'clean-corporate', 'modern-services', 'professional-company', 'business-showcase', 'local-business-pro'],
  premium: ['classic-business', 'clean-corporate', 'modern-services', 'professional-company', 'business-showcase', 'local-business-pro', 'corporate-premium', 'product-marketplace', 'service-marketplace', 'executive-company', 'creative-business'],
  enterprise: PORTFOLIO_TEMPLATES.map(t => t.id), // all 15
};

