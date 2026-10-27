/**
 * Category-based visual presets and localization for THENIJOBS Posters.
 */

export interface CategoryTheme {
  name: string;
  nameTa: string;
  iconName: string;
  accentColor: string;
  lightBg: string;
  defaultHighlights: string[];
}

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  'IT & Software': {
    name: 'IT & Software',
    nameTa: 'தகவல் தொழில்நுட்பம்',
    iconName: 'Laptop',
    accentColor: '#3B82F6',
    lightBg: '#EFF6FF',
    defaultHighlights: ['Cutting-Edge Projects', 'Flexible Work Culture', 'Career Growth'],
  },
  'Healthcare': {
    name: 'Healthcare & Medical',
    nameTa: 'மருத்துவம் & நலம்',
    iconName: 'HeartPulse',
    accentColor: '#0D9488',
    lightBg: '#F0FDFA',
    defaultHighlights: ['Hospital Facility', 'PF & ESI Included', 'Professional Team'],
  },
  'Education': {
    name: 'Education & Teaching',
    nameTa: 'கல்வி & பயிற்சி',
    iconName: 'GraduationCap',
    accentColor: '#8B5CF6',
    lightBg: '#F5F3FF',
    defaultHighlights: ['Reputed Institution', 'Annual Increments', 'Conducive Environment'],
  },
  'Agriculture': {
    name: 'Agriculture & Spices',
    nameTa: 'விவசாயம் & மசாலா',
    iconName: 'Sprout',
    accentColor: '#16A34A',
    lightBg: '#F0FDF4',
    defaultHighlights: ['Theni Agro Corridor', 'Direct Farm Producer', 'Timely Payouts'],
  },
  'Manufacturing': {
    name: 'Manufacturing & Industry',
    nameTa: 'உற்பத்தி & தொழிற்சாலை',
    iconName: 'Factory',
    accentColor: '#EA580C',
    lightBg: '#FFF7ED',
    defaultHighlights: ['State-of-the-art Plant', 'Safety Compliant', 'Overtime Benefits'],
  },
  'Retail': {
    name: 'Retail & Supermarket',
    nameTa: 'சில்லறை விற்பனை',
    iconName: 'ShoppingBag',
    accentColor: '#D97706',
    lightBg: '#FFFBEB',
    defaultHighlights: ['Customer Service', 'Sales Incentives', 'Prime High Street Location'],
  },
  'Transportation': {
    name: 'Logistics & Driving',
    nameTa: 'போக்குவரத்து & டிரைவிங்',
    iconName: 'Truck',
    accentColor: '#2563EB',
    lightBg: '#EFF6FF',
    defaultHighlights: ['Well Maintained Fleet', 'Fuel Allowance', 'Fixed Shifts'],
  },
  'Hospitality': {
    name: 'Hospitality & Restaurant',
    nameTa: 'ஹோட்டல் & உணவகம்',
    iconName: 'Utensils',
    accentColor: '#E11D48',
    lightBg: '#FFF1F2',
    defaultHighlights: ['Food & Accommodation Provided', 'Tips & Incentives', 'Reputed Brand'],
  },
  'Construction': {
    name: 'Construction & Real Estate',
    nameTa: 'கட்டுமானம் & ரியல் எஸ்டேட்',
    iconName: 'HardHat',
    accentColor: '#CA8A04',
    lightBg: '#FEFCE8',
    defaultHighlights: ['Major Projects', 'Site Transport', 'Weekly Wages Available'],
  },
  'BPO': {
    name: 'BPO & Customer Support',
    nameTa: 'வாடிக்கையாளர் சேவை',
    iconName: 'Headphones',
    accentColor: '#4F46E5',
    lightBg: '#EEF2FF',
    defaultHighlights: ['Day / Night Shifts', 'Performance Bonus', 'Air Conditioned Office'],
  },
};

export const DEFAULT_CATEGORY_THEME: CategoryTheme = {
  name: 'General Employment',
  nameTa: 'பொது வேலைவாய்ப்பு',
  iconName: 'Briefcase',
  accentColor: '#2563EB',
  lightBg: '#F8FAFC',
  defaultHighlights: ['Verified Employer', 'Immediate Joining', 'Growth Opportunity'],
};

export function getCategoryTheme(categoryName?: string): CategoryTheme {
  if (!categoryName) return DEFAULT_CATEGORY_THEME;
  for (const [key, theme] of Object.entries(CATEGORY_THEMES)) {
    if (categoryName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(categoryName.toLowerCase())) {
      return theme;
    }
  }
  return DEFAULT_CATEGORY_THEME;
}
