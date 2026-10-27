/**
 * THENIJOBS AI Job Poster Generator — Core Type Definitions
 * Supports Jobs, Companies, Products, and Services promotional flyers.
 */

export type PosterEntityType = 'job' | 'company' | 'product' | 'service';

export interface PosterData {
  id: string;
  type: PosterEntityType;
  title: string;
  companyName: string;
  companyLogoUrl?: string;
  category?: string;
  location?: string;
  district?: string;
  salaryText?: string;
  jobType?: string;
  experience?: string;
  education?: string;
  openings?: number;
  deadlineText?: string;
  contactPhone?: string;
  contactEmail?: string;
  highlights?: string[];
  publicUrl: string;
  qrDataUrl?: string;
  isUrgent?: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
  // Product & Service specifics
  itemPrice?: string;
  itemUnit?: string;
  descriptionSnippet?: string;
}

export type TemplateId =
  | 'corporate_executive'
  | 'tech_gradient'
  | 'theni_heritage'
  | 'urgent_walkin'
  | 'industry_spotlight'
  | 'split_infographic'
  | 'gazette_editorial'
  | 'geometric_agency'
  | 'social_story'
  | 'clean_trust';

export interface PosterTemplate {
  id: TemplateId;
  name: string;
  nameTa: string;
  tagline: string;
  aspectRatio: '4:5' | '9:16' | '1:1';
  width: number;
  height: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textMutedColor: string;
}

export interface GeneratedPoster {
  templateId: TemplateId;
  templateName: string;
  templateNameTa: string;
  canvas: HTMLCanvasElement;
  dataUrlPng: string;
  dataUrlJpeg: string;
  width: number;
  height: number;
}
