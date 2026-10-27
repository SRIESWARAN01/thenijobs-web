import { PosterTemplate, TemplateId } from './types';

export const POSTER_TEMPLATES: PosterTemplate[] = [
  {
    id: 'corporate_executive',
    name: 'Corporate Executive',
    nameTa: 'நிறுவன நிர்வாகம்',
    tagline: 'Clean, structured, and modern executive design for corporate and professional roles.',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    primaryColor: '#0F172A', // Slate 900
    secondaryColor: '#1E293B',
    accentColor: '#0284C7', // Sky 600
    backgroundColor: '#F8FAFC',
    surfaceColor: '#FFFFFF',
    textColor: '#0F172A',
    textMutedColor: '#64748B',
  },
  {
    id: 'tech_gradient',
    name: 'Tech & Startup Dark',
    nameTa: 'நவீன தொழில்நுட்பம்',
    tagline: 'Cutting-edge obsidian gradient with neon accents for IT, software, and creative startups.',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    primaryColor: '#090D16',
    secondaryColor: '#4F46E5', // Indigo
    accentColor: '#06B6D4', // Cyan
    backgroundColor: '#090D16',
    surfaceColor: '#131B2E',
    textColor: '#F8FAFC',
    textMutedColor: '#94A3B8',
  },
  {
    id: 'theni_heritage',
    name: 'Theni Regional Classic',
    nameTa: 'தேனி பாரம்பரியம்',
    tagline: 'Traditional Tamil Nadu temple gold & emerald green heritage frame with bilingual titles.',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    primaryColor: '#064E3B', // Emerald 900
    secondaryColor: '#B45309', // Amber 700
    accentColor: '#D97706', // Gold Amber
    backgroundColor: '#FFFDF7',
    surfaceColor: '#FFFFFF',
    textColor: '#1C1917',
    textMutedColor: '#78716C',
  },
  {
    id: 'urgent_walkin',
    name: 'Urgent Walk-in Hiring',
    nameTa: 'உடனடி நேர்காணல்',
    tagline: 'High-contrast crimson and warning amber layout for urgent vacancies and walk-in interviews.',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    primaryColor: '#DC2626', // Red 600
    secondaryColor: '#D97706', // Amber 600
    accentColor: '#FEF08A', // Yellow light
    backgroundColor: '#FFFFFF',
    surfaceColor: '#FEF2F2',
    textColor: '#18181B',
    textMutedColor: '#52525B',
  },
  {
    id: 'industry_spotlight',
    name: 'Creative Industry Card',
    nameTa: 'தொழில் துறை சிறப்பம்சம்',
    tagline: 'Dynamic colored header card with industry badges and clean benefit checklists.',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    primaryColor: '#4F46E5', // Indigo
    secondaryColor: '#9333EA', // Purple
    accentColor: '#F59E0B', // Amber
    backgroundColor: '#F9FAFB',
    surfaceColor: '#FFFFFF',
    textColor: '#111827',
    textMutedColor: '#6B7280',
  },
  {
    id: 'split_infographic',
    name: 'Split Column Infographic',
    nameTa: 'இரட்டை பத்தி தகவல்',
    tagline: 'Two-tone vertical split separating employer branding & QR from vacancy specifications.',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    primaryColor: '#1E3A8A', // Blue 900
    secondaryColor: '#3B82F6', // Blue 500
    accentColor: '#10B981', // Emerald 500
    backgroundColor: '#F8FAFC',
    surfaceColor: '#FFFFFF',
    textColor: '#0F172A',
    textMutedColor: '#64748B',
  },
  {
    id: 'gazette_editorial',
    name: 'Formal Gazette Editorial',
    nameTa: 'அதிகாரப்பூர்வ வர்த்தமானி',
    tagline: 'Formal double-border newspaper recruitment notice with structured qualification boxes.',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    primaryColor: '#1F2937', // Gray 800
    secondaryColor: '#831843', // Rose 900
    accentColor: '#B91C1C', // Red 700
    backgroundColor: '#FAF8F5', // Warm paper
    surfaceColor: '#FFFFFF',
    textColor: '#111827',
    textMutedColor: '#4B5563',
  },
  {
    id: 'geometric_agency',
    name: 'Geometric Modern Agency',
    nameTa: 'வடிவியல் நவீன வடிவமைப்பு',
    tagline: 'Stylish diagonal polygons with royal blue and vivid golden accents.',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    primaryColor: '#1D4ED8', // Blue 700
    secondaryColor: '#EAB308', // Yellow 500
    accentColor: '#0284C7', // Sky 600
    backgroundColor: '#F1F5F9',
    surfaceColor: '#FFFFFF',
    textColor: '#0F172A',
    textMutedColor: '#475569',
  },
  {
    id: 'social_story',
    name: 'Mobile Social Story (9:16)',
    nameTa: 'வாட்ஸ்அப் நிலை (9:16)',
    tagline: 'Tall 9:16 mobile-first format optimized for WhatsApp Status and Instagram Stories.',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    primaryColor: '#0F172A', // Dark
    secondaryColor: '#2563EB', // Blue
    accentColor: '#22C55E', // Green
    backgroundColor: '#0B0F19',
    surfaceColor: '#1E293B',
    textColor: '#FFFFFF',
    textMutedColor: '#94A3B8',
  },
  {
    id: 'clean_trust',
    name: 'Clean Trust & Healthcare',
    nameTa: 'நம்பிக்கை & நலம்',
    tagline: 'Spacious soft teal and cyan theme focused on trust, credibility, and accessibility.',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    primaryColor: '#0F766E', // Teal 700
    secondaryColor: '#0284C7', // Sky 600
    accentColor: '#14B8A6', // Teal 500
    backgroundColor: '#F0FDFA', // Mint 50
    surfaceColor: '#FFFFFF',
    textColor: '#134E4A',
    textMutedColor: '#475569',
  },
];

export function getTemplateById(id: TemplateId): PosterTemplate {
  const found = POSTER_TEMPLATES.find(t => t.id === id);
  return found || POSTER_TEMPLATES[0];
}
