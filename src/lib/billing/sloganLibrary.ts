/**
 * THENIJOBS BILLING SYSTEM — DYNAMIC BILLING SLOGAN LIBRARY
 *
 * Authoritative 100 Slogan Library (50 Tamil + 50 English) with category taxonomy,
 * billing model mapping, deterministic resolution hierarchy, and historical invoice snapshot preservation.
 */

export type SloganCategory =
  | 'business_growth'
  | 'recruitment'
  | 'trust_quality'
  | 'theni_pride'
  | 'custom';

export type SloganLanguage = 'ta' | 'en';

export interface BillingSlogan {
  id: string; // Unique ID (e.g. "slogan_1", "slogan_51", "slogan_custom_...")
  sloganNumber: number; // 1 to 100+
  text: string; // Official slogan text
  language: SloganLanguage; // 'ta' for Tamil, 'en' for English
  category: SloganCategory; // Taxonomy category
  billingModel?: string | null; // Associated service or billing model ID
  isActive: boolean; // Active / inactive status
  isDefault?: boolean; // True if designated as category or model default
  usageCount: number; // Total number of times assigned
  lastUsedAt?: string | null; // ISO timestamp of last assignment
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

export interface SloganAssignmentResult {
  sloganId: string;
  sloganText: string;
  sloganLanguage: SloganLanguage;
  sloganCategory?: SloganCategory;
  billingModel?: string;
  sloganCycle: number;
  sloganAssignedAt: string;
}

export interface SloganRotationState {
  cycle: number;
  usedSloganIds: string[];
  lastAssignedSloganId: string | null;
  lastAssignedAt: string | null;
  totalAssignedCount: number;
}

export interface SloganCategoryMeta {
  id: SloganCategory;
  label: string;
  labelTa: string;
  description: string;
  defaultSloganTaId: string;
  defaultSloganEnId: string;
}

export interface BillingModelDefinition {
  id: string;
  label: string;
  suggestedCategory: SloganCategory;
  defaultSloganIdTa: string;
  defaultSloganIdEn: string;
}

/**
 * 5 Standard Slogan Categories
 */
export const SLOGAN_CATEGORIES: SloganCategoryMeta[] = [
  {
    id: 'business_growth',
    label: 'Business Growth',
    labelTa: 'வணிக வளர்ச்சி',
    description: 'Empowering local businesses to scale, modernize, and acquire new customers.',
    defaultSloganTaId: 'slogan_1',
    defaultSloganEnId: 'slogan_51',
  },
  {
    id: 'recruitment',
    label: 'Recruitment',
    labelTa: 'பணியமர்த்தல்',
    description: 'Connecting employers with qualified local talent across Theni & Tamil Nadu.',
    defaultSloganTaId: 'slogan_11',
    defaultSloganEnId: 'slogan_61',
  },
  {
    id: 'trust_quality',
    label: 'Trust & Quality',
    labelTa: 'நம்பிக்கை & தரம்',
    description: 'Highlighting verified standards, transparency, and enterprise reliability.',
    defaultSloganTaId: 'slogan_21',
    defaultSloganEnId: 'slogan_71',
  },
  {
    id: 'theni_pride',
    label: 'Theni Pride',
    labelTa: 'தேனி பெருமை',
    description: 'Celebrating regional business heritage, local pride, and community growth.',
    defaultSloganTaId: 'slogan_31',
    defaultSloganEnId: 'slogan_81',
  },
  {
    id: 'custom',
    label: 'Custom',
    labelTa: 'தனிப்பயன்',
    description: 'Tailored motivational slogans for specialized partnerships and custom invoices.',
    defaultSloganTaId: 'slogan_41',
    defaultSloganEnId: 'slogan_91',
  },
];

/**
 * Authoritative Supported Billing Models with suggested categories & default mappings
 */
export const BILLING_MODELS: BillingModelDefinition[] = [
  {
    id: 'job_posting',
    label: 'Job Posting',
    suggestedCategory: 'recruitment',
    defaultSloganIdTa: 'slogan_11', // வேலைவாய்ப்பும் வளர்ச்சியும் ஒரே தளத்தில்!
    defaultSloganIdEn: 'slogan_61', // Connecting Talent with Opportunity.
  },
  {
    id: 'company_registration',
    label: 'Company Registration',
    suggestedCategory: 'business_growth',
    defaultSloganIdTa: 'slogan_1', // ஒரு கட்டணம் — ஒரு புதிய வளர்ச்சி!
    defaultSloganIdEn: 'slogan_51', // One Payment. A New Beginning.
  },
  {
    id: 'website_development',
    label: 'Website Development',
    suggestedCategory: 'business_growth',
    defaultSloganIdTa: 'slogan_2', // உங்கள் வளர்ச்சி, எங்கள் இலக்கு!
    defaultSloganIdEn: 'slogan_52', // Your Growth, Our Mission.
  },
  {
    id: 'website_hosting',
    label: 'Website Hosting',
    suggestedCategory: 'trust_quality',
    defaultSloganIdTa: 'slogan_21', // நம்பிக்கையுடன் வளர்ச்சி, தரத்துடன் சேவை!
    defaultSloganIdEn: 'slogan_71', // Built on Trust. Driven by Quality.
  },
  {
    id: 'digital_marketing',
    label: 'Digital Marketing',
    suggestedCategory: 'business_growth',
    defaultSloganIdTa: 'slogan_6', // உங்கள் தொழிலுக்கு டிஜிட்டல் துணை!
    defaultSloganIdEn: 'slogan_54', // Your Business, Our Digital Support.
  },
  {
    id: 'social_media_management',
    label: 'Social Media Management',
    suggestedCategory: 'business_growth',
    defaultSloganIdTa: 'slogan_5', // வளர்ச்சியை நோக்கி ஒரு புதிய பயணம்!
    defaultSloganIdEn: 'slogan_56', // Building Better Business Opportunities.
  },
  {
    id: 'recruitment_subscription',
    label: 'Recruitment Subscription',
    suggestedCategory: 'recruitment',
    defaultSloganIdTa: 'slogan_13', // சரியான நபர், சரியான வேலை!
    defaultSloganIdEn: 'slogan_63', // The Right People. The Right Jobs.
  },
  {
    id: 'company_verification',
    label: 'Company Verification',
    suggestedCategory: 'trust_quality',
    defaultSloganIdTa: 'slogan_22', // உங்கள் நம்பிக்கை, எங்கள் பொறுப்பு!
    defaultSloganIdEn: 'slogan_72', // Your Trust, Our Responsibility.
  },
  {
    id: 'digital_id_card',
    label: 'Digital ID Card',
    suggestedCategory: 'trust_quality',
    defaultSloganIdTa: 'slogan_24', // நம்பிக்கையின் புதிய அடையாளம்!
    defaultSloganIdEn: 'slogan_74', // A Name You Can Trust.
  },
  {
    id: 'custom_service',
    label: 'Custom Service',
    suggestedCategory: 'custom',
    defaultSloganIdTa: 'slogan_41', // உங்கள் வெற்றிப் பயணத்தில் THENIJOBS!
    defaultSloganIdEn: 'slogan_91', // One Platform. Endless Opportunities.
  },
  // Subscriptions mapped to authoritative tiers
  {
    id: 'subscription_basic',
    label: 'Basic Annual Subscription (₹999/yr)',
    suggestedCategory: 'business_growth',
    defaultSloganIdTa: 'slogan_7', // சிறு தொழிலுக்கும் பெரிய வளர்ச்சி!
    defaultSloganIdEn: 'slogan_55', // Small Business. Big Dreams.
  },
  {
    id: 'subscription_standard',
    label: 'Standard Annual Subscription (₹1,800/yr)',
    suggestedCategory: 'recruitment',
    defaultSloganIdTa: 'slogan_14', // வேலை தேடுபவருக்கும் நிறுவனத்திற்கும் பாலம்!
    defaultSloganIdEn: 'slogan_67', // Connecting Employers and Job Seekers.
  },
  {
    id: 'subscription_premium',
    label: 'Premium Annual Subscription (₹3,500/yr)',
    suggestedCategory: 'business_growth',
    defaultSloganIdTa: 'slogan_8', // உங்கள் வெற்றிக்கு ஒரு புதிய தொடக்கம்!
    defaultSloganIdEn: 'slogan_57', // Your Success Starts Here.
  },
  {
    id: 'subscription_enterprise',
    label: 'Enterprise Annual Subscription (₹5,000/yr)',
    suggestedCategory: 'theni_pride',
    defaultSloganIdTa: 'slogan_31', // தேனியின் திறமை, தமிழகத்தின் வளர்ச்சி!
    defaultSloganIdEn: 'slogan_81', // Theni Talent. Tamil Nadu Growth.
  },
];

/**
 * 100 Official THENIJOBS Master Billing Slogans
 * 1–50: Tamil
 * 51–100: English
 */
export const MASTER_SLOGANS_LIBRARY: Omit<BillingSlogan, 'usageCount' | 'lastUsedAt' | 'createdAt' | 'updatedAt'>[] = [
  // ── 50 TAMIL SLOGANS (1 to 50) ─────────────────────────────────────────────

  // Business Growth (1–10)
  { id: 'slogan_1', sloganNumber: 1, text: 'ஒரு கட்டணம் — ஒரு புதிய வளர்ச்சி!', language: 'ta', category: 'business_growth', isActive: true, isDefault: true, billingModel: 'company_registration' },
  { id: 'slogan_2', sloganNumber: 2, text: 'உங்கள் வளர்ச்சி, எங்கள் இலக்கு!', language: 'ta', category: 'business_growth', isActive: true, billingModel: 'website_development' },
  { id: 'slogan_3', sloganNumber: 3, text: 'தொழில் வளர்ச்சிக்கு புதிய வழி!', language: 'ta', category: 'business_growth', isActive: true },
  { id: 'slogan_4', sloganNumber: 4, text: 'உங்கள் கனவு, எங்கள் ஆதரவு!', language: 'ta', category: 'business_growth', isActive: true },
  { id: 'slogan_5', sloganNumber: 5, text: 'வளர்ச்சியை நோக்கி ஒரு புதிய பயணம்!', language: 'ta', category: 'business_growth', isActive: true, billingModel: 'social_media_management' },
  { id: 'slogan_6', sloganNumber: 6, text: 'உங்கள் தொழிலுக்கு டிஜிட்டல் துணை!', language: 'ta', category: 'business_growth', isActive: true, billingModel: 'digital_marketing' },
  { id: 'slogan_7', sloganNumber: 7, text: 'சிறு தொழிலுக்கும் பெரிய வளர்ச்சி!', language: 'ta', category: 'business_growth', isActive: true, billingModel: 'subscription_basic' },
  { id: 'slogan_8', sloganNumber: 8, text: 'உங்கள் வெற்றிக்கு ஒரு புதிய தொடக்கம்!', language: 'ta', category: 'business_growth', isActive: true, billingModel: 'subscription_premium' },
  { id: 'slogan_9', sloganNumber: 9, text: 'வளர்ச்சிக்கு நம்பிக்கையான தளம்!', language: 'ta', category: 'business_growth', isActive: true },
  { id: 'slogan_10', sloganNumber: 10, text: 'தொழில் வளர்ச்சி இனி எளிது!', language: 'ta', category: 'business_growth', isActive: true },

  // Recruitment (11–20)
  { id: 'slogan_11', sloganNumber: 11, text: 'வேலைவாய்ப்பும் வளர்ச்சியும் ஒரே தளத்தில்!', language: 'ta', category: 'recruitment', isActive: true, isDefault: true, billingModel: 'job_posting' },
  { id: 'slogan_12', sloganNumber: 12, text: 'திறமையும் வாய்ப்பும் இணையும் இடம்!', language: 'ta', category: 'recruitment', isActive: true },
  { id: 'slogan_13', sloganNumber: 13, text: 'சரியான நபர், சரியான வேலை!', language: 'ta', category: 'recruitment', isActive: true, billingModel: 'recruitment_subscription' },
  { id: 'slogan_14', sloganNumber: 14, text: 'வேலை தேடுபவருக்கும் நிறுவனத்திற்கும் பாலம்!', language: 'ta', category: 'recruitment', isActive: true, billingModel: 'subscription_standard' },
  { id: 'slogan_15', sloganNumber: 15, text: 'உங்கள் நிறுவனத்திற்கு சரியான திறமை!', language: 'ta', category: 'recruitment', isActive: true },
  { id: 'slogan_16', sloganNumber: 16, text: 'வேலைவாய்ப்பின் புதிய முகவரி!', language: 'ta', category: 'recruitment', isActive: true },
  { id: 'slogan_17', sloganNumber: 17, text: 'திறமைகளுக்கு புதிய வாய்ப்புகள்!', language: 'ta', category: 'recruitment', isActive: true },
  { id: 'slogan_18', sloganNumber: 18, text: 'வேலைவாய்ப்பை எளிதாக்கும் தளம்!', language: 'ta', category: 'recruitment', isActive: true },
  { id: 'slogan_19', sloganNumber: 19, text: 'திறமையை கண்டறியுங்கள், வளர்ச்சியை அடையுங்கள்!', language: 'ta', category: 'recruitment', isActive: true },
  { id: 'slogan_20', sloganNumber: 20, text: 'உங்கள் அடுத்த பணியாளர் இங்கே!', language: 'ta', category: 'recruitment', isActive: true },

  // Trust & Quality (21–30)
  { id: 'slogan_21', sloganNumber: 21, text: 'நம்பிக்கையுடன் வளர்ச்சி, தரத்துடன் சேவை!', language: 'ta', category: 'trust_quality', isActive: true, isDefault: true, billingModel: 'website_hosting' },
  { id: 'slogan_22', sloganNumber: 22, text: 'உங்கள் நம்பிக்கை, எங்கள் பொறுப்பு!', language: 'ta', category: 'trust_quality', isActive: true, billingModel: 'company_verification' },
  { id: 'slogan_23', sloganNumber: 23, text: 'தரமான சேவை, நம்பிக்கையான வளர்ச்சி!', language: 'ta', category: 'trust_quality', isActive: true },
  { id: 'slogan_24', sloganNumber: 24, text: 'நம்பிக்கையின் புதிய அடையாளம்!', language: 'ta', category: 'trust_quality', isActive: true, billingModel: 'digital_id_card' },
  { id: 'slogan_25', sloganNumber: 25, text: 'நேர்மையும் தரமும் எங்கள் வழி!', language: 'ta', category: 'trust_quality', isActive: true },
  { id: 'slogan_26', sloganNumber: 26, text: 'உங்கள் வெற்றியில் எங்கள் மகிழ்ச்சி!', language: 'ta', category: 'trust_quality', isActive: true },
  { id: 'slogan_27', sloganNumber: 27, text: 'நம்பிக்கையை வளர்ப்போம், வெற்றியை பகிர்வோம்!', language: 'ta', category: 'trust_quality', isActive: true },
  { id: 'slogan_28', sloganNumber: 28, text: 'ஒவ்வொரு சேவையிலும் தரம்!', language: 'ta', category: 'trust_quality', isActive: true },
  { id: 'slogan_29', sloganNumber: 29, text: 'நம்பிக்கையுடன் இணைவோம்!', language: 'ta', category: 'trust_quality', isActive: true },
  { id: 'slogan_30', sloganNumber: 30, text: 'உங்கள் வளர்ச்சிக்கு உறுதியான ஆதரவு!', language: 'ta', category: 'trust_quality', isActive: true },

  // Theni Pride (31–40)
  { id: 'slogan_31', sloganNumber: 31, text: 'தேனியின் திறமை, தமிழகத்தின் வளர்ச்சி!', language: 'ta', category: 'theni_pride', isActive: true, isDefault: true, billingModel: 'subscription_enterprise' },
  { id: 'slogan_32', sloganNumber: 32, text: 'தேனியில் தொடங்கி தமிழகமெங்கும்!', language: 'ta', category: 'theni_pride', isActive: true },
  { id: 'slogan_33', sloganNumber: 33, text: 'உள்ளூர் திறமைக்கு உலகளாவிய வாய்ப்பு!', language: 'ta', category: 'theni_pride', isActive: true },
  { id: 'slogan_34', sloganNumber: 34, text: 'தேனியின் தொழில்களுக்கு டிஜிட்டல் துணை!', language: 'ta', category: 'theni_pride', isActive: true },
  { id: 'slogan_35', sloganNumber: 35, text: 'நம் ஊர், நம் வளர்ச்சி!', language: 'ta', category: 'theni_pride', isActive: true },
  { id: 'slogan_36', sloganNumber: 36, text: 'தேனியின் வளர்ச்சிக்கு THENIJOBS!', language: 'ta', category: 'theni_pride', isActive: true },
  { id: 'slogan_37', sloganNumber: 37, text: 'உள்ளூர் தொழில், உயர்ந்த வளர்ச்சி!', language: 'ta', category: 'theni_pride', isActive: true },
  { id: 'slogan_38', sloganNumber: 38, text: 'தேனி தொழில்களின் புதிய அடையாளம்!', language: 'ta', category: 'theni_pride', isActive: true },
  { id: 'slogan_39', sloganNumber: 39, text: 'உள்ளூர் வாய்ப்புகள், உள்ளூர் வளர்ச்சி!', language: 'ta', category: 'theni_pride', isActive: true },
  { id: 'slogan_40', sloganNumber: 40, text: 'தேனியின் திறமைகளை இணைக்கும் தளம்!', language: 'ta', category: 'theni_pride', isActive: true },

  // Custom (41–50)
  { id: 'slogan_41', sloganNumber: 41, text: 'உங்கள் வெற்றிப் பயணத்தில் THENIJOBS!', language: 'ta', category: 'custom', isActive: true, isDefault: true, billingModel: 'custom_service' },
  { id: 'slogan_42', sloganNumber: 42, text: 'உங்கள் தொழிலுக்கு புதிய அத்தியாயம்!', language: 'ta', category: 'custom', isActive: true },
  { id: 'slogan_43', sloganNumber: 43, text: 'ஒன்றிணைவோம், உயர்வோம்!', language: 'ta', category: 'custom', isActive: true },
  { id: 'slogan_44', sloganNumber: 44, text: 'வாய்ப்புகளை உருவாக்குவோம்!', language: 'ta', category: 'custom', isActive: true },
  { id: 'slogan_45', sloganNumber: 45, text: 'வளர்ச்சிக்கு எல்லைகள் இல்லை!', language: 'ta', category: 'custom', isActive: true },
  { id: 'slogan_46', sloganNumber: 46, text: 'உங்கள் தொழில், உங்கள் வெற்றி!', language: 'ta', category: 'custom', isActive: true },
  { id: 'slogan_47', sloganNumber: 47, text: 'புதிய வாய்ப்பு, புதிய வளர்ச்சி!', language: 'ta', category: 'custom', isActive: true },
  { id: 'slogan_48', sloganNumber: 48, text: 'தொழிலுக்கும் திறமைக்கும் புதிய இணைப்பு!', language: 'ta', category: 'custom', isActive: true },
  { id: 'slogan_49', sloganNumber: 49, text: 'வளர்ச்சியின் ஒவ்வொரு படியிலும்!', language: 'ta', category: 'custom', isActive: true },
  { id: 'slogan_50', sloganNumber: 50, text: 'உங்கள் எதிர்காலம், உங்கள் கையில்!', language: 'ta', category: 'custom', isActive: true },

  // ── 50 ENGLISH SLOGANS (51 to 100) ─────────────────────────────────────────

  // Business Growth (51–60)
  { id: 'slogan_51', sloganNumber: 51, text: 'One Payment. A New Beginning.', language: 'en', category: 'business_growth', isActive: true, isDefault: true, billingModel: 'company_registration' },
  { id: 'slogan_52', sloganNumber: 52, text: 'Your Growth, Our Mission.', language: 'en', category: 'business_growth', isActive: true, billingModel: 'website_development' },
  { id: 'slogan_53', sloganNumber: 53, text: 'Grow Your Business with Confidence.', language: 'en', category: 'business_growth', isActive: true },
  { id: 'slogan_54', sloganNumber: 54, text: 'Your Business, Our Digital Support.', language: 'en', category: 'business_growth', isActive: true, billingModel: 'digital_marketing' },
  { id: 'slogan_55', sloganNumber: 55, text: 'Small Business. Big Dreams.', language: 'en', category: 'business_growth', isActive: true, billingModel: 'subscription_basic' },
  { id: 'slogan_56', sloganNumber: 56, text: 'Building Better Business Opportunities.', language: 'en', category: 'business_growth', isActive: true, billingModel: 'social_media_management' },
  { id: 'slogan_57', sloganNumber: 57, text: 'Your Success Starts Here.', language: 'en', category: 'business_growth', isActive: true, billingModel: 'subscription_premium' },
  { id: 'slogan_58', sloganNumber: 58, text: 'Growth Made Simple.', language: 'en', category: 'business_growth', isActive: true },
  { id: 'slogan_59', sloganNumber: 59, text: 'Empowering Businesses to Grow.', language: 'en', category: 'business_growth', isActive: true },
  { id: 'slogan_60', sloganNumber: 60, text: 'Your Partner in Business Growth.', language: 'en', category: 'business_growth', isActive: true },

  // Recruitment (61–70)
  { id: 'slogan_61', sloganNumber: 61, text: 'Connecting Talent with Opportunity.', language: 'en', category: 'recruitment', isActive: true, isDefault: true, billingModel: 'job_posting' },
  { id: 'slogan_62', sloganNumber: 62, text: 'Find the Right Talent.', language: 'en', category: 'recruitment', isActive: true },
  { id: 'slogan_63', sloganNumber: 63, text: 'The Right People. The Right Jobs.', language: 'en', category: 'recruitment', isActive: true, billingModel: 'recruitment_subscription' },
  { id: 'slogan_64', sloganNumber: 64, text: 'Where Talent Meets Opportunity.', language: 'en', category: 'recruitment', isActive: true },
  { id: 'slogan_65', sloganNumber: 65, text: 'Hiring Made Easy.', language: 'en', category: 'recruitment', isActive: true },
  { id: 'slogan_66', sloganNumber: 66, text: 'Your Next Great Hire Starts Here.', language: 'en', category: 'recruitment', isActive: true },
  { id: 'slogan_67', sloganNumber: 67, text: 'Connecting Employers and Job Seekers.', language: 'en', category: 'recruitment', isActive: true, billingModel: 'subscription_standard' },
  { id: 'slogan_68', sloganNumber: 68, text: 'Discover Talent. Build Success.', language: 'en', category: 'recruitment', isActive: true },
  { id: 'slogan_69', sloganNumber: 69, text: 'Better Hiring. Better Growth.', language: 'en', category: 'recruitment', isActive: true },
  { id: 'slogan_70', sloganNumber: 70, text: 'Your Local Hiring Partner.', language: 'en', category: 'recruitment', isActive: true },

  // Trust & Quality (71–80)
  { id: 'slogan_71', sloganNumber: 71, text: 'Built on Trust. Driven by Quality.', language: 'en', category: 'trust_quality', isActive: true, isDefault: true, billingModel: 'website_hosting' },
  { id: 'slogan_72', sloganNumber: 72, text: 'Your Trust, Our Responsibility.', language: 'en', category: 'trust_quality', isActive: true, billingModel: 'company_verification' },
  { id: 'slogan_73', sloganNumber: 73, text: 'Quality Service. Lasting Growth.', language: 'en', category: 'trust_quality', isActive: true },
  { id: 'slogan_74', sloganNumber: 74, text: 'A Name You Can Trust.', language: 'en', category: 'trust_quality', isActive: true, billingModel: 'digital_id_card' },
  { id: 'slogan_75', sloganNumber: 75, text: 'Excellence in Every Service.', language: 'en', category: 'trust_quality', isActive: true },
  { id: 'slogan_76', sloganNumber: 76, text: 'Growing Together with Trust.', language: 'en', category: 'trust_quality', isActive: true },
  { id: 'slogan_77', sloganNumber: 77, text: 'Your Success Is Our Priority.', language: 'en', category: 'trust_quality', isActive: true },
  { id: 'slogan_78', sloganNumber: 78, text: 'Trusted Support for Your Business.', language: 'en', category: 'trust_quality', isActive: true },
  { id: 'slogan_79', sloganNumber: 79, text: 'Quality You Can Count On.', language: 'en', category: 'trust_quality', isActive: true },
  { id: 'slogan_80', sloganNumber: 80, text: 'Trust That Builds Success.', language: 'en', category: 'trust_quality', isActive: true },

  // Theni Pride (81–90)
  { id: 'slogan_81', sloganNumber: 81, text: 'Theni Talent. Tamil Nadu Growth.', language: 'en', category: 'theni_pride', isActive: true, isDefault: true, billingModel: 'subscription_enterprise' },
  { id: 'slogan_82', sloganNumber: 82, text: 'From Theni to Tamil Nadu.', language: 'en', category: 'theni_pride', isActive: true },
  { id: 'slogan_83', sloganNumber: 83, text: 'Empowering Local Businesses.', language: 'en', category: 'theni_pride', isActive: true },
  { id: 'slogan_84', sloganNumber: 84, text: 'Local Talent. Bigger Opportunities.', language: 'en', category: 'theni_pride', isActive: true },
  { id: 'slogan_85', sloganNumber: 85, text: 'Growing Businesses Across Theni.', language: 'en', category: 'theni_pride', isActive: true },
  { id: 'slogan_86', sloganNumber: 86, text: 'Proudly Supporting Theni Businesses.', language: 'en', category: 'theni_pride', isActive: true },
  { id: 'slogan_87', sloganNumber: 87, text: 'Local Opportunities. Local Growth.', language: 'en', category: 'theni_pride', isActive: true },
  { id: 'slogan_88', sloganNumber: 88, text: "Theni's Digital Growth Partner.", language: 'en', category: 'theni_pride', isActive: true },
  { id: 'slogan_89', sloganNumber: 89, text: "Connecting Theni's Talent.", language: 'en', category: 'theni_pride', isActive: true },
  { id: 'slogan_90', sloganNumber: 90, text: 'Building a Stronger Local Economy.', language: 'en', category: 'theni_pride', isActive: true },

  // Custom (91–100)
  { id: 'slogan_91', sloganNumber: 91, text: 'One Platform. Endless Opportunities.', language: 'en', category: 'custom', isActive: true, isDefault: true, billingModel: 'custom_service' },
  { id: 'slogan_92', sloganNumber: 92, text: 'Your Future Starts Today.', language: 'en', category: 'custom', isActive: true },
  { id: 'slogan_93', sloganNumber: 93, text: 'Make Every Opportunity Count.', language: 'en', category: 'custom', isActive: true },
  { id: 'slogan_94', sloganNumber: 94, text: 'Together, We Grow.', language: 'en', category: 'custom', isActive: true },
  { id: 'slogan_95', sloganNumber: 95, text: 'A Better Way to Build Success.', language: 'en', category: 'custom', isActive: true },
  { id: 'slogan_96', sloganNumber: 96, text: 'Your Business. Your Future.', language: 'en', category: 'custom', isActive: true },
  { id: 'slogan_97', sloganNumber: 97, text: 'Creating Opportunities That Matter.', language: 'en', category: 'custom', isActive: true },
  { id: 'slogan_98', sloganNumber: 98, text: 'Your Growth Journey Starts Here.', language: 'en', category: 'custom', isActive: true },
  { id: 'slogan_99', sloganNumber: 99, text: 'One Platform for Every Opportunity.', language: 'en', category: 'custom', isActive: true },
  { id: 'slogan_100', sloganNumber: 100, text: "Let's Build Your Success.", language: 'en', category: 'custom', isActive: true },
];

/**
 * Deterministic hash function for fallback / offline generation.
 */
export function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export interface ResolveSloganParams {
  billingModel?: string | null;
  category?: SloganCategory | null;
  language?: SloganLanguage | null;
  existingSlogan?: {
    sloganId?: string;
    sloganText?: string;
    sloganLanguage?: SloganLanguage;
    sloganCycle?: number;
    sloganCategory?: SloganCategory;
  } | null;
  customMapping?: Record<string, { sloganIdTa?: string; sloganIdEn?: string }> | null;
  slogansPool?: BillingSlogan[];
}

/**
 * Core Dynamic Slogan Selection Engine
 *
 * Implements the 3-tier resolution hierarchy:
 * 1. Historical Invoice Snapshot: If invoice already has a saved slogan, STRICTLY PRESERVE IT.
 * 2. Billing Model Specific Slogan: Assigned to the service/model for requested language.
 * 3. Category Default Slogan: Default slogan for the model's or requested category.
 * 4. Global Default Slogan: System fallback for requested language.
 *
 * Guarantees:
 * - Never returns a slogan in the wrong language (Tamil bills -> Tamil, English bills -> English).
 * - Deterministic output.
 */
export function resolveBillingSlogan(
  params: ResolveSloganParams,
  slogansPool?: BillingSlogan[],
  customMapping?: Record<string, { sloganIdTa: string; sloganIdEn: string }>
): SloganAssignmentResult {
  const targetLanguage: SloganLanguage = params.language === 'en' ? 'en' : 'ta';

  // 1. Existing Invoice Preservation: If invoice already has a stored slogan, retain it unchanged!
  if (params.existingSlogan && params.existingSlogan.sloganText) {
    return {
      sloganId: params.existingSlogan.sloganId || 'slogan_historical',
      sloganText: params.existingSlogan.sloganText,
      sloganLanguage: params.existingSlogan.sloganLanguage || targetLanguage,
      sloganCategory: params.existingSlogan.sloganCategory || 'business_growth',
      billingModel: params.billingModel || undefined,
      sloganCycle: params.existingSlogan.sloganCycle || 1,
      sloganAssignedAt: new Date().toISOString(),
    };
  }

  const pool = (slogansPool && slogansPool.length > 0)
    ? slogansPool
    : (params.slogansPool && params.slogansPool.length > 0)
    ? params.slogansPool
    : (MASTER_SLOGANS_LIBRARY as BillingSlogan[]);

  const langPool = pool.filter((s) => s.isActive && s.language === targetLanguage);
  const activeCustomMapping = customMapping || params.customMapping;

  // 2. Billing Model Match
  const modelId = params.billingModel?.toLowerCase().trim();
  if (modelId) {
    // Check custom database mapping first
    const customModelMapping = activeCustomMapping?.[modelId];
    const customSloganId = targetLanguage === 'en'
      ? customModelMapping?.sloganIdEn
      : customModelMapping?.sloganIdTa;

    if (customSloganId) {
      const mapped = langPool.find((s) => s.id === customSloganId);
      if (mapped) {
        return {
          sloganId: mapped.id,
          sloganText: mapped.text,
          sloganLanguage: mapped.language,
          sloganCategory: mapped.category,
          billingModel: modelId,
          sloganCycle: 1,
          sloganAssignedAt: new Date().toISOString(),
        };
      }
    }

    // Check predefined BILLING_MODELS definition
    const modelDef = BILLING_MODELS.find((m) => m.id === modelId || m.id.replace('subscription_', '') === modelId);
    if (modelDef) {
      const defSloganId = targetLanguage === 'en'
        ? modelDef.defaultSloganIdEn
        : modelDef.defaultSloganIdTa;
      const found = langPool.find((s) => s.id === defSloganId);
      if (found) {
        return {
          sloganId: found.id,
          sloganText: found.text,
          sloganLanguage: found.language,
          sloganCategory: found.category,
          billingModel: modelId,
          sloganCycle: 1,
          sloganAssignedAt: new Date().toISOString(),
        };
      }
    }

    // Check if any active slogan explicitly has this billingModel assigned
    const explicitlyAssigned = langPool.find((s) => s.billingModel === modelId);
    if (explicitlyAssigned) {
      return {
        sloganId: explicitlyAssigned.id,
        sloganText: explicitlyAssigned.text,
        sloganLanguage: explicitlyAssigned.language,
        sloganCategory: explicitlyAssigned.category,
        billingModel: modelId,
        sloganCycle: 1,
        sloganAssignedAt: new Date().toISOString(),
      };
    }
  }

  // 3. Category Fallback
  const targetCategory: SloganCategory = params.category || (
    modelId ? (BILLING_MODELS.find((m) => m.id === modelId)?.suggestedCategory || 'business_growth') : 'business_growth'
  );

  const categoryMatch =
    langPool.find((s) => s.category === targetCategory && s.isDefault) ||
    langPool.find((s) => s.category === targetCategory);

  if (categoryMatch) {
    return {
      sloganId: categoryMatch.id,
      sloganText: categoryMatch.text,
      sloganLanguage: categoryMatch.language,
      sloganCategory: categoryMatch.category,
      billingModel: modelId || undefined,
      sloganCycle: 1,
      sloganAssignedAt: new Date().toISOString(),
    };
  }

  // 4. Global Default Fallback
  const globalDefault =
    langPool.find((s) => s.isDefault) ||
    (targetLanguage === 'en' ? langPool.find((s) => s.id === 'slogan_51') : langPool.find((s) => s.id === 'slogan_1')) ||
    langPool[0] ||
    MASTER_SLOGANS_LIBRARY[0];

  return {
    sloganId: globalDefault.id,
    sloganText: globalDefault.text,
    sloganLanguage: globalDefault.language,
    sloganCategory: (globalDefault as any).category || 'business_growth',
    billingModel: modelId || undefined,
    sloganCycle: 1,
    sloganAssignedAt: new Date().toISOString(),
  };
}

/**
 * Returns a stable deterministic slogan for a given seed (Order ID, Invoice No).
 * Maintained for backward compatibility with existing payment services.
 */
export function getDeterministicBillingSlogan(
  seed?: string,
  preferredLanguage?: SloganLanguage
): SloganAssignmentResult {
  const seedStr = seed || `seed_${Date.now()}`;
  const hash = hashStringToNumber(seedStr);
  const targetLanguage: SloganLanguage = preferredLanguage === 'en' ? 'en' : 'ta';

  const langPool = MASTER_SLOGANS_LIBRARY.filter((s) => s.isActive && s.language === targetLanguage);
  const slogan = langPool[hash % langPool.length] || MASTER_SLOGANS_LIBRARY[0];
  const cycle = Math.floor(hash / langPool.length) + 1;

  return {
    sloganId: slogan.id,
    sloganText: slogan.text,
    sloganLanguage: slogan.language,
    sloganCategory: slogan.category,
    sloganCycle: cycle,
    sloganAssignedAt: new Date().toISOString(),
  };
}

/**
 * Returns the default model mappings dictionary from BILLING_MODELS definition.
 */
export function getDefaultModelMappings(): Record<string, { sloganIdTa: string; sloganIdEn: string }> {
  const map: Record<string, { sloganIdTa: string; sloganIdEn: string }> = {};
  for (const m of BILLING_MODELS) {
    map[m.id] = {
      sloganIdTa: m.defaultSloganIdTa,
      sloganIdEn: m.defaultSloganIdEn,
    };
  }
  return map;
}
