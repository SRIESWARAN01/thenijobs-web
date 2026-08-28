/**
 * THENIJOBS — Server-Safe Firestore Service
 * Uses Firestore REST API for reading documents in server components & generateMetadata.
 * This file has NO 'use client' directive and is safe for Next.js SSR/ISR.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'thenijobs-9f01d';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAAXHgdvKXi4pFPNGciMbZE8lPITN9Hsug';

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ─── Firestore REST Value Parsing ─────────────────────────────────────────────

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
}

function parseFirestoreValue(val: FirestoreValue): any {
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return Number(val.integerValue);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.nullValue !== undefined) return null;
  if (val.arrayValue) {
    return (val.arrayValue.values || []).map(parseFirestoreValue);
  }
  if (val.mapValue?.fields) {
    return parseFirestoreFields(val.mapValue.fields);
  }
  return null;
}

function parseFirestoreFields(fields: Record<string, FirestoreValue>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(fields)) {
    result[key] = parseFirestoreValue(val);
  }
  return result;
}

function extractDocId(name: string): string {
  const parts = name.split('/');
  return parts[parts.length - 1];
}

// ─── Job Data Types ───────────────────────────────────────────────────────────

export interface ServerJobData {
  id: string;
  slug?: string;
  title: string;
  description: string;
  companyId: string;
  companyName: string;
  companyWebsite?: string;
  companyLogo?: string;
  location: string;
  district: string;
  state: string;
  streetAddress?: string;
  postalCode?: string;
  salaryMin: number;
  salaryMax: number;
  jobType: string;
  category?: string;
  experience?: string;
  education?: string;
  openings: number;
  isActive: boolean;
  status?: string;
  isUrgent: boolean;
  isVerified: boolean;
  isRemote?: boolean;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  benefits: string[];
  whatsapp?: string;
  phone?: string;
  postedDate?: string;
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServerCompanyData {
  id: string;
  slug?: string;
  name: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  category?: string;
  district?: string;
  state?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// ─── Firestore REST API Calls ─────────────────────────────────────────────────

/**
 * Fetch a single Firestore document by collection and doc ID (server-safe)
 */
async function fetchDocumentREST<T>(collectionPath: string, docId: string): Promise<T | null> {
  try {
    const url = `${FIRESTORE_BASE}/${collectionPath}/${docId}?key=${API_KEY}`;
    const res = await fetch(url, {
      next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      console.error(`[firestoreServer] GET ${collectionPath}/${docId} failed:`, res.status);
      return null;
    }

    const doc = await res.json();
    if (!doc.fields) return null;

    return {
      id: extractDocId(doc.name),
      ...parseFirestoreFields(doc.fields),
    } as unknown as T;
  } catch (error) {
    console.error(`[firestoreServer] Error fetching ${collectionPath}/${docId}:`, error);
    return null;
  }
}

/**
 * Run a structured Firestore query via REST API (server-safe)
 */
async function runQueryREST<T>(
  collectionId: string,
  filters: Array<{
    field: string;
    op: 'EQUAL' | 'LESS_THAN' | 'GREATER_THAN' | 'LESS_THAN_OR_EQUAL' | 'GREATER_THAN_OR_EQUAL';
    value: FirestoreValue;
  }>,
  orderByField?: string,
  orderDirection?: 'ASCENDING' | 'DESCENDING',
  limitCount?: number,
): Promise<T[]> {
  try {
    const url = `${FIRESTORE_BASE}:runQuery?key=${API_KEY}`;

    const structuredQuery: any = {
      from: [{ collectionId }],
    };

    if (filters.length > 0) {
      if (filters.length === 1) {
        structuredQuery.where = {
          fieldFilter: {
            field: { fieldPath: filters[0].field },
            op: filters[0].op,
            value: filters[0].value,
          },
        };
      } else {
        structuredQuery.where = {
          compositeFilter: {
            op: 'AND',
            filters: filters.map((f) => ({
              fieldFilter: {
                field: { fieldPath: f.field },
                op: f.op,
                value: f.value,
              },
            })),
          },
        };
      }
    }

    if (orderByField) {
      structuredQuery.orderBy = [{
        field: { fieldPath: orderByField },
        direction: orderDirection || 'DESCENDING',
      }];
    }

    if (limitCount) {
      structuredQuery.limit = limitCount;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery }),
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error(`[firestoreServer] Query ${collectionId} failed:`, res.status);
      return [];
    }

    const results = await res.json();

    return results
      .filter((r: any) => r.document)
      .map((r: any) => ({
        id: extractDocId(r.document.name),
        ...parseFirestoreFields(r.document.fields || {}),
      })) as T[];
  } catch (error) {
    console.error(`[firestoreServer] Query error on ${collectionId}:`, error);
    return [];
  }
}

// ─── Public Server Functions ──────────────────────────────────────────────────

/**
 * Fetch a single job by Firestore document ID (for SSR job detail pages)
 */
export async function getJobByIdServer(jobId: string): Promise<ServerJobData | null> {
  const raw = await fetchDocumentREST<any>('jobs', jobId);
  if (!raw) return null;

  return {
    id: raw.id,
    slug: raw.slug || '',
    title: raw.title || '',
    description: raw.description || '',
    companyId: raw.companyId || '',
    companyName: raw.companyName || 'Verified Employer',
    companyWebsite: raw.companyWebsite || '',
    companyLogo: raw.companyLogo || raw.logo || '',
    location: raw.location || raw.district || 'Theni',
    district: raw.district || 'Theni',
    state: raw.state || 'Tamil Nadu',
    streetAddress: raw.streetAddress || '',
    postalCode: raw.postalCode || '',
    salaryMin: Number(raw.salaryMin) || 0,
    salaryMax: Number(raw.salaryMax) || 0,
    jobType: raw.jobType || 'full_time',
    category: raw.category || '',
    experience: raw.experience || '',
    education: raw.education || '',
    openings: Number(raw.openings) || 1,
    isActive: raw.isActive === true,
    status: raw.status || '',
    isUrgent: raw.isUrgent === true,
    isVerified: raw.isVerified === true,
    isRemote: raw.isRemote === true || raw.jobType === 'remote' || raw.jobType === 'work_from_home',
    responsibilities: Array.isArray(raw.responsibilities) ? raw.responsibilities : [],
    requirements: Array.isArray(raw.requirements) ? raw.requirements : [],
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    benefits: Array.isArray(raw.benefits) ? raw.benefits : [],
    whatsapp: raw.whatsapp || raw.phone || '',
    phone: raw.phone || '',
    postedDate: raw.createdAt || '',
    expiryDate: raw.expiresAt || raw.deadline || '',
    createdAt: raw.createdAt || '',
    updatedAt: raw.updatedAt || '',
  };
}

/**
 * Fetch all active job IDs + metadata for dynamic sitemap generation
 */
export async function getActiveJobsForSitemap(): Promise<
  Array<{ id: string; slug?: string; title?: string; updatedAt?: string }>
> {
  const jobs = await runQueryREST<any>(
    'jobs',
    [
      { field: 'isActive', op: 'EQUAL', value: { booleanValue: true } },
      { field: 'status', op: 'EQUAL', value: { stringValue: 'active' } },
    ],
  );

  return jobs.map((j) => ({
    id: j.id,
    slug: j.slug || '',
    title: j.title || '',
    updatedAt: j.updatedAt || j.createdAt || '',
  }));
}

/**
 * Fetch company data for a job's hiringOrganization schema
 */
export async function getCompanyByIdServer(companyId: string): Promise<ServerCompanyData | null> {
  const raw = await fetchDocumentREST<any>('companies', companyId);
  if (!raw) return null;

  return {
    id: raw.id,
    slug: raw.slug || '',
    name: raw.name || '',
    website: raw.website || '',
    logoUrl: raw.logoUrl || raw.coverUrl || '',
    description: raw.description || '',
    category: raw.category || '',
    district: raw.district || '',
    state: raw.state || '',
    address: raw.address || '',
    phone: raw.phone || '',
    email: raw.email || '',
  };
}

/**
 * Fetch all verified company slugs for sitemap
 */
export async function getVerifiedCompanySlugsForSitemap(): Promise<
  Array<{ slug: string; updatedAt?: string }>
> {
  const companies = await runQueryREST<any>(
    'companies',
    [
      { field: 'verificationStatus', op: 'EQUAL', value: { stringValue: 'verified' } },
    ],
  );

  return companies
    .filter((c) => c.slug)
    .map((c) => ({
      slug: c.slug,
      updatedAt: c.updatedAt || c.createdAt || '',
    }));
}

/**
 * Fetch all published portfolio sites that enabled Google Indexing for sitemap
 */
export async function getPublishedPortfolioSitesForSitemap(): Promise<
  Array<{ customUrl: string; updatedAt?: string }>
> {
  try {
    const sites = await runQueryREST<any>(
      'portfolioSites',
      [
        { field: 'status', op: 'EQUAL', value: { stringValue: 'published' } },
        { field: 'googleIndex', op: 'EQUAL', value: { booleanValue: true } },
      ],
    );

    return sites
      .filter((s) => s.customUrl)
      .map((s) => ({
        customUrl: s.customUrl,
        updatedAt: s.updatedAt || s.createdAt || '',
      }));
  } catch (err) {
    console.warn('[firestoreServer] Failed to query portfolio sites for sitemap:', err);
    return [];
  }
}

