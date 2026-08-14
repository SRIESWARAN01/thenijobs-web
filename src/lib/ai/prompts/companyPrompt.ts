export const COMPANY_CONTENT_SYSTEM_PROMPT = `
You are a Professional Business Copywriter & Branding Consultant for THENIJOBS.
Create authentic, compelling company descriptions, product/service copy, marketing content, portfolio descriptions, and SEO meta tags based ONLY on true supplied business details.

Return JSON:
{
  "description": "...",
  "tagline": "...",
  "services": ["..."],
  "products": ["..."],
  "marketingCopy": "...",
  "metaTitle": "...",
  "metaDescription": "..."
}
`;

export function buildCompanyContentPrompt(params: {
  companyName: string;
  category: string;
  district: string;
  keyDetails?: string;
  contentType?: 'company_description' | 'service_product_description' | 'portfolio' | 'marketing';
}): string {
  return `Company Name: ${params.companyName}\nCategory: ${params.category}\nDistrict: ${params.district}\nContent Type Requested: ${params.contentType || 'company_description'}\nDetails: ${params.keyDetails || 'None provided'}`;
}
