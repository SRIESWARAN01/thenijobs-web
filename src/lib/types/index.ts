// ============================================================
// Shared TypeScript types for THENIJOBS platform
// ============================================================

// ===== USER TYPES =====
// Platform has 2 primary account types: job_seeker and business.
// Legacy roles (employer, business_owner, supplier, service_provider, entrepreneur)
// are kept for backward compatibility with existing Firestore documents.
// All legacy business roles are treated identically as 'business'.
export type UserRole =
  | 'job_seeker'
  | 'business'
  // Legacy roles — treated as 'business' at runtime
  | 'employer'
  | 'pending_employer'
  | 'business_owner'
  | 'supplier'
  | 'service_provider'
  | 'entrepreneur'
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
  employerVerified?: boolean;
  companyVerified?: boolean;
  emailVerified?: boolean;
  setupCompleted?: boolean;
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
  emailVerified: boolean;
  gstVerified: boolean;
  businessVerified: boolean;
}

export interface Company {
  id: string;
  slug: string;
  ownerId: string;
  // Basic Info
  name: string;
  logoUrl?: string;
  coverImageUrl?: string;
  category: string;
  subcategory?: string;
  foundedYear?: number;
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
  location?: string;
  district: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  mapEmbedUrl?: string;
  // Social Media
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  // Gallery
  galleryImages: string[];
  galleryVideos: string[];
  // Services
  services: string[];
  // Verification
  verificationStatus: VerificationStatus;
  verificationBadges: VerificationBadges;
  isActive: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  // Analytics
  viewCount: number;
  enquiryCount: number;
  rating: number;
  reviewCount: number;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
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
  | 'pending_review'
  | 'under_review'
  | 'shortlisted'
  | 'approved'
  | 'interview_scheduled'
  | 'interview_attended'
  | 'walk_in_attended'
  | 'selected'
  | 'rejected';

export type ApplicationType = 'job' | 'walk_in';

export interface WalkInDetails {
  date: string;
  time: string;
  venue: string;
  contactPerson: string;
  contactMobile: string;
}

export interface Job {
  id: string;
  slug: string;
  companyId: string;
  company?: Company;
  title: string;
  category?: string;
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
  status?: 'pending' | 'active' | 'paused' | 'closed' | 'expired' | 'rejected' | 'reported' | 'pending_renewal';
  planType?: SubscriptionPlanSlug;
  planAtCreation?: SubscriptionPlanSlug;
  postedAt?: Date;
  activatedAt?: Date;
  approvedAt?: Date;
  expiresAt?: Date;
  expiryReminderDaysSent?: number[];
  isWalkIn?: boolean;
  walkIn?: WalkInDetails;
  walkInDate?: string;
  walkInTime?: string;
  walkInVenue?: string;
  walkInContactPerson?: string;
  walkInContactMobile?: string;
  applicationsCount: number;
  viewCount: number;
  postedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplication {
  id: string;
  jobId: string;
  job?: Job;
  companyId?: string;
  companyName?: string;
  seekerId: string;
  seeker?: JobSeekerProfile;
  applicationType?: ApplicationType;
  walkIn?: WalkInDetails;
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
export type SubscriptionPlanSlug = 'free' | 'basic' | 'premium' | 'enterprise';

export interface Subscription {
  id: string;
  userId: string;
  companyId?: string;
  plan: SubscriptionPlanSlug;
  planName?: string;
  audience?: 'seeker' | 'employer' | 'business' | 'service';
  status: 'active' | 'expired' | 'pending_renewal' | 'cancelled';
  amount: number;
  startDate: Date;
  endDate: Date;
  paymentDate?: Date;
  paymentRequestId?: string;
  userName?: string;
  companyName?: string;
  email?: string;
  mobile?: string;
  autoRenew: boolean;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt?: Date;
  expiryReminderDaysSent?: number[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: SubscriptionPlanSlug;
  price: number;
  period: 'year';
  features: string[];
  notIncluded: string[];
  recommended: boolean;
  bestFor: string;
  icon: string;
}

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

// ===== PHASE 1 LAUNCH LOCATION SCOPE =====
export const LAUNCH_STATE = 'Tamil Nadu' as const;
export const LAUNCH_DISTRICT = 'Theni' as const;

export const THENI_LAUNCH_LOCATIONS = [
  'Theni',
  'Uthamapalayam',
  'Cumbum',
  'Chinnamanur',
  'Bodinayakanur',
  'Periyakulam',
  'Andipatti',
  'Devaram',
  'Kombai',
  'Veerapandi',
  'Gudalur',
  'Thevaram',
] as const;

export type TheniLaunchLocation = typeof THENI_LAUNCH_LOCATIONS[number];

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

// ===== SHOP / E-COMMERCE TYPES =====

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Product {
  id: string;
  companyId?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  couponCode?: string;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  whatsappSent: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: Date;
  isActive: boolean;
  description?: string;
  createdAt: Date;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  stock: number;
  quantity: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: Date;
}

export const SHOP_PRODUCT_CATEGORIES = [
  'All',
  'Local Products',
  'Clothing & Textiles',
  'Food & Beverages',
  'Electronics',
  'Home & Garden',
  'Health & Beauty',
  'Agriculture',
  'Handicrafts',
  'Others',
] as const;

export type ShopProductCategory = typeof SHOP_PRODUCT_CATEGORIES[number];

export const WHATSAPP_BUSINESS_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210';
export const SHOP_NAME = 'THENIJOBS Store';

// ===== SERVICE PROVIDER BOOKINGS =====
export type BookingStatus = 'pending' | 'quoted' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  serviceProviderId: string; // companyId
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceName: string;
  bookingStatus: BookingStatus;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  customerAddress: string;
  customerNotes?: string;
  quotedPrice?: number;
  specialRequests?: string;
  preferredPackage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== B2B RFQS & QUOTATIONS =====
export type RFQStatus = 'pending_quote' | 'quoted' | 'accepted' | 'rejected' | 'invoiced' | 'paid' | 'cancelled';

export interface RFQ {
  id: string;
  productId: string;
  productName: string;
  companyId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  companyName?: string;
  quantity: number;
  targetDeliveryDate?: string;
  message?: string;
  status: RFQStatus;
  quotedPricePerUnit?: number;
  quotedTaxPercent?: number;
  quotedDiscount?: number;
  quotedTotal?: number;
  paymentTerms?: string;
  notes?: string;
  invoiceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}



