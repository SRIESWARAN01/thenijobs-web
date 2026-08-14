// ============================================================
// Shared TypeScript types for THENIJOBS platform
// ============================================================

// ===== USER TYPES =====
export type UserRole =
  | 'job_seeker'
  | 'employer'
  | 'business_owner'
  | 'supplier'
  | 'service_provider'
  | 'admin'
  | 'super_admin';

/** Granular admin team roles */
export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'support_executive'
  | 'sales_manager'
  | 'franchise_admin';

/** Granular employer team roles */
export type EmployerRole =
  | 'company_owner'
  | 'hr_manager'
  | 'recruiter'
  | 'branch_manager'
  | 'staff_user';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: UserRole;
  adminRole?: AdminRole;
  employerRole?: EmployerRole;
  companyId?: string;
  district?: string;
  isVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ===== JOB SEEKER =====
export interface JobSeekerProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  state: string;
  profilePhotoUrl?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  resumeUrl?: string;
  expectedSalary?: number;
  jobTypePreference: JobType[];
  isOpenToWork: boolean;
  profileStrength: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
  isCurrent: boolean;
}

// ===== COMPANY / EMPLOYER =====
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface VerificationBadges {
  mobileVerified: boolean;
  emailVerified: boolean;
  gstVerified: boolean;
  businessVerified: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  price?: number;
  priceRange?: string;
  category?: string;
  features?: string[];
  keywords?: string[];
  websiteUrl?: string;
  whatsappEnquiry?: boolean;
  callNumber?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  category?: string;
  startingPrice?: number;
  priceRange?: string;
  details?: string[];
  keywords?: string[];
  websiteUrl?: string;
  whatsappEnquiry?: boolean;
  callNumber?: string;
}

export interface FounderProfile {
  photoUrl?: string;
  name: string;
  designation: string;
  nativePlace?: string;
  bio?: string;
  experienceYears?: string;
  message?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  location?: string;
  date?: string;
  clientName?: string;
  liveUrl?: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden';

export interface CompanyReview {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  isVerifiedSeeker?: boolean;
  rating: number; // 1 to 5
  title?: string;
  content: string;
  status: ReviewStatus;
  adminNote?: string;
  companyReply?: {
    replyText: string;
    repliedAt: { seconds: number; nanoseconds?: number };
  };
  // Firestore Timestamps — accessed as .seconds throughout the codebase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updatedAt?: any;
}

export interface Company {
  id: string;
  slug: string;
  ownerId: string;
  // Basic Info
  name: string;
  tagline?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  coverUrl?: string;
  category: string;
  subcategory?: string;
  foundedYear?: number;
  establishedYear?: string;
  companySize?: string;
  gstNumber?: string;
  registrationNumber?: string;
  description: string;
  // Contact
  phone: string;
  alternatePhone?: string;
  email: string;
  website?: string;
  whatsapp?: string;
  // Location
  address: string;
  district: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  mapEmbedUrl?: string;
  googleMapsUrl?: string;
  // Social Media
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  // Gallery
  galleryImages: string[];
  galleryVideos: string[];
  gallery?: string[];
  // Catalogues, Portfolio & Founder
  products?: ProductItem[];
  services?: (ServiceItem | string)[];
  portfolioProjects?: PortfolioProject[];
  founder?: FounderProfile;
  teamMembers?: { id: string; name: string; role: string; photoUrl?: string }[];
  enabledSections?: Record<string, boolean>;
  branches?: { id: string; name: string; address: string; phone?: string }[];
  // Verification
  verificationStatus: VerificationStatus;
  verificationBadges: VerificationBadges;
  verification?: { mobile?: boolean; email?: boolean; gst?: boolean; business?: boolean };
  isActive: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  subscriptionPlan?: string;
  // Analytics
  viewCount: number;
  enquiryCount: number;
  rating: number;
  reviewCount: number;
  trustScore?: number;
  responseTime?: string;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  seoSettings?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ===== JOB =====
export type JobType =
  | 'full_time'
  | 'part_time'
  | 'internship'
  | 'remote'
  | 'work_from_home'
  | 'fresher'
  | 'contract';

export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'selected'
  | 'rejected';

export interface Job {
  id: string;
  slug: string;
  companyId: string;
  company?: Company;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  location: string;
  district: string;
  jobType: JobType;
  salaryMin?: number;
  salaryMax?: number;
  experience: string;
  education?: string;
  openings: number;
  deadline?: Date;
  isActive: boolean;
  isPremium: boolean;
  isFeatured: boolean;
  isUrgent: boolean;
  applicationCount: number;
  viewCount: number;
  postedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplication {
  id: string;
  jobId: string;
  job?: Job;
  seekerId: string;
  seeker?: JobSeekerProfile;
  resumeUrl?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  employerNote?: string;
  interviewDate?: Date;
  appliedAt: Date;
  updatedAt: Date;
}

// ===== REVIEW =====
export interface Review {
  id: string;
  targetId: string;
  targetType: 'company' | 'employer' | 'service';
  reviewerId: string;
  reviewerName: string;
  reviewerPhoto?: string;
  rating: number;
  title: string;
  content: string;
  isVerified: boolean;
  helpfulCount: number;
  reply?: string;
  createdAt: Date;
}

// ===== LEAD =====
export interface Lead {
  id: string;
  type: 'candidate' | 'business' | 'service';
  source: string;
  companyId?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  message?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  assignedTo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== SERVICE =====
export interface Service {
  id: string;
  providerId: string;
  providerName: string;
  name: string;
  category: string;
  description: string;
  pricing?: string;
  district: string;
  status: 'active' | 'pending' | 'paused' | 'rejected';
  images: string[];
  rating: number;
  reviewCount: number;
  enquiryCount: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceRequest {
  id: string;
  serviceId: string;
  requesterId: string;
  requesterName: string;
  phone: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: Date;
}

// ===== ADVERTISEMENT =====
export interface Advertisement {
  id: string;
  type: 'banner' | 'sponsored' | 'featured';
  title: string;
  imageUrl: string;
  targetUrl: string;
  placement: string;
  startDate: Date;
  endDate: Date;
  impressions: number;
  clicks: number;
  status: 'active' | 'paused' | 'expired' | 'draft';
  createdAt: Date;
}

// ===== SUBSCRIPTION =====
export type SubscriptionPlanSlug = 'free' | 'basic' | 'standard' | 'premium' | 'enterprise';

export interface Subscription {
  id: string;
  userId: string;
  companyId?: string;
  plan: SubscriptionPlanSlug;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  amount: number;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod?: string;
  createdAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: SubscriptionPlanSlug;
  price: number;
  monthlyEquivalent: number;
  dailyEquivalent: number;
  period: 'month' | 'year' | 'forever';
  features: string[];
  notIncluded: string[];
  recommended: boolean;
  bestFor: string;
  icon: string;
  badge?: string;
}

export type FeatureKey =
  | 'basic_profile'
  | 'digital_id_card'
  | 'qr_code'
  | 'reviews'
  | 'services_listing'
  | 'featured_company'
  | 'interview_management'
  | 'lead_management'
  | 'advanced_analytics'
  | 'multi_user_hr'
  | 'branch_management'
  | 'custom_branding'
  | 'priority_support';

// ===== NOTIFICATION =====
export interface Notification {
  id: string;
  userId: string;
  type: 'job_alert' | 'application_update' | 'interview' | 'lead' | 'system' | 'promotion';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

// ===== ACTIVITY LOG =====
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  targetId: string;
  details?: string;
  ipAddress?: string;
  timestamp: Date;
}

// ===== FRANCHISE =====
export interface Franchise {
  id: string;
  district: string;
  managerId: string;
  managerName: string;
  managerPhone: string;
  status: 'active' | 'inactive' | 'pending';
  revenue: number;
  businesses: number;
  users: number;
  createdAt: Date;
}

// ===== INTERVIEW SCHEDULE =====
export interface InterviewSchedule {
  id: string;
  applicationId: string;
  jobId: string;
  employerId: string;
  seekerId: string;
  date: string;
  time: string;
  mode: 'in_person' | 'phone' | 'video';
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: Date;
}

// ===== CHAT =====
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  message: string;
  type: 'text' | 'image' | 'file';
  read: boolean;
  createdAt: Date;
}

// ===== SUPPORT TICKET =====
export interface SupportTicketMessage {
  senderId: string;
  message: string;
  createdAt: Date;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  messages: SupportTicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ===== BUSINESS CATEGORIES =====
export const BUSINESS_CATEGORIES = [
  'Agriculture',
  'Construction',
  'Manufacturing',
  'Textile',
  'IT & Software',
  'Education',
  'Healthcare',
  'Retail',
  'Transportation',
  'Real Estate',
  'Finance',
  'Hospitality',
  'Food & Beverage',
  'Automobile',
  'Media & Entertainment',
] as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[number];

// ===== DISTRICTS (Tamil Nadu) =====
export const TN_DISTRICTS = [
  'Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem',
  'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul',
  'Thanjavur', 'Ranipet', 'Sivaganga', 'Virudhunagar', 'Namakkal',
  'Theni', 'Villupuram', 'Nagapattinam', 'Kancheepuram', 'Tiruppur',
  'Krishnagiri', 'Dharmapuri', 'Pudukkottai', 'Ramanathapuram',
  'Karur', 'Cuddalore', 'Ariyalur', 'Perambalur', 'Nilgiris',
  'Tiruvannamalai', 'Tiruvarur', 'Tirupathur', 'Chengalpattu',
  'Mayiladuthurai', 'Kallakurichi', 'Tenkasi',
] as const;

export type District = typeof TN_DISTRICTS[number];
