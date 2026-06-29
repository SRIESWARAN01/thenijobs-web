export function slugifyCompanyName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

export function getCompanyRouteSlug(company: {
  id?: string | null;
  slug?: string | null;
  name?: string | null;
  businessName?: string | null;
  companyName?: string | null;
}): string {
  const explicitSlug = typeof company.slug === 'string' ? company.slug.trim() : '';
  if (explicitSlug) return explicitSlug;

  const id = String(company.id || '').trim();
  const name = company.name || company.businessName || company.companyName || '';
  const nameSlug = slugifyCompanyName(name);

  if (nameSlug && id) {
    return `${nameSlug}-${id}`;
  }

  if (id) return id;
  if (nameSlug) return nameSlug;

  return '';
}

export function getCompanyPortfolioPath(company: {
  id?: string | null;
  slug?: string | null;
  name?: string | null;
  businessName?: string | null;
  companyName?: string | null;
}): string {
  const slug = getCompanyRouteSlug(company);
  return slug ? `/company/${encodeURIComponent(slug)}` : '/businesses';
}

export function getCompanyPortfolioUrl(
  company: {
    id?: string | null;
    slug?: string | null;
    name?: string | null;
    businessName?: string | null;
    companyName?: string | null;
  },
  origin?: string,
): string {
  const base = origin || 'https://thenijobs.com';
  return `${base.replace(/\/+$/, '')}${getCompanyPortfolioPath(company)}`;
}

export function normalizeExternalUrl(value?: string | null): string {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  return `https://${url.replace(/^\/+/, '')}`;
}

export function getCompanyBannerUrl(company: {
  coverImageUrl?: string | null;
  coverUrl?: string | null;
  bannerUrl?: string | null;
  bannerImageUrl?: string | null;
  socialShareImage?: string | null;
}): string {
  return String(
    company.coverImageUrl ||
      company.coverUrl ||
      company.bannerImageUrl ||
      company.bannerUrl ||
      company.socialShareImage ||
      '',
  ).trim();
}
