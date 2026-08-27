'use client';

import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from './config';
import { adminCreateUser, generatePassword } from './adminUserService';
import type { StandardCompanyFields, AnalyzedCompanyRow } from '@/lib/excel/companyExcelService';

export interface BulkImportOptions {
  overrideStatus?: 'verified' | 'pending' | 'under_review';
  overrideDistrict?: string;
  overrideCategory?: string;
  isPremium?: boolean;
  isFeatured?: boolean;
  createUserAccounts: boolean;
  defaultPasswordPrefix?: string;
  adminUid: string;
}

export interface BulkImportProgress {
  total: number;
  processed: number;
  successCount: number;
  errorCount: number;
  currentCompanyName: string;
  percentage: number;
}

export interface BulkImportCredentialRecord {
  companyName: string;
  companyId: string;
  email: string;
  password?: string;
  phone: string;
  district: string;
  loginUrl: string;
}

export interface BulkImportResult {
  totalAttempted: number;
  successful: number;
  failed: number;
  createdCompanies: Array<{ id: string; name: string; slug: string }>;
  createdCredentials: BulkImportCredentialRecord[];
  errors: Array<{ rowNumber: number; companyName: string; error: string }>;
}

/**
 * Creates a URL-friendly slug from company name and district
 */
function createCompanySlug(name: string, district?: string): string {
  const base = `${name} ${district || ''}`.trim();
  return base
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates search keywords for the company
 */
function generateKeywords(name: string, category?: string, district?: string): string[] {
  const words = [
    ...name.toLowerCase().split(/\s+/),
    ...(category ? category.toLowerCase().split(/\s+/) : []),
    ...(district ? district.toLowerCase().split(/\s+/) : []),
    'theni',
    'jobs',
  ];
  return Array.from(new Set(words.filter((w) => w.length > 1)));
}

/**
 * Executes the bulk company import to Firestore & Firebase Auth
 */
export async function executeBulkCompanyImport(
  rows: AnalyzedCompanyRow[],
  options: BulkImportOptions,
  onProgress?: (progress: BulkImportProgress) => void
): Promise<BulkImportResult> {
  const selectedRows = rows.filter((r) => r.isSelected);
  const total = selectedRows.length;

  const result: BulkImportResult = {
    totalAttempted: total,
    successful: 0,
    failed: 0,
    createdCompanies: [],
    createdCredentials: [],
    errors: [],
  };

  if (total === 0) {
    return result;
  }

  for (let i = 0; i < total; i++) {
    const row = selectedRows[i];
    const data: StandardCompanyFields = row.mapped;

    if (onProgress) {
      onProgress({
        total,
        processed: i,
        successCount: result.successful,
        errorCount: result.failed,
        currentCompanyName: data.name,
        percentage: Math.round((i / total) * 100),
      });
    }

    try {
      const companyId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const finalDistrict = options.overrideDistrict || data.district || 'Theni';
      const finalCategory = options.overrideCategory || data.category || 'General Business';
      const finalStatus = options.overrideStatus || data.verificationStatus || 'verified';
      const finalSlug = createCompanySlug(data.name, finalDistrict) || companyId;
      const keywords = generateKeywords(data.name, finalCategory, finalDistrict);

      let ownerId = `imported_${Date.now()}`;
      let createdCredential: BulkImportCredentialRecord | null = null;

      // 1. Optionally provision Firebase Auth User login for the business
      if (options.createUserAccounts) {
        let emailToUse = data.accountEmail || data.email;

        // If no email exists, generate an automated business login email
        if (!emailToUse) {
          const cleanPhone = (data.phone || '').replace(/\D/g, '');
          const cleanName = data.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
          emailToUse = cleanPhone
            ? `${cleanPhone}@business.thenijobs.com`
            : `${cleanName}_${Date.now().toString().slice(-4)}@business.thenijobs.com`;
        }

        const passwordToUse = data.accountPassword || generatePassword(10);

        try {
          const userResult = await adminCreateUser({
            displayName: data.ownerName || data.contactPerson || data.name,
            email: emailToUse,
            password: passwordToUse,
            phone: data.phone,
            district: finalDistrict,
            role: 'business_owner',
            companyName: data.name,
          });

          if (userResult.success && userResult.uid) {
            ownerId = userResult.uid;
            createdCredential = {
              companyName: data.name,
              companyId,
              email: emailToUse,
              password: passwordToUse,
              phone: data.phone || '',
              district: finalDistrict,
              loginUrl: 'https://thenijobs.com/login',
            };
          } else {
            console.warn(`[Bulk Import] User account creation failed for ${data.name}: ${userResult.error}. Creating company with system ownerId.`);
          }
        } catch (authErr: any) {
          console.warn(`[Bulk Import] Auth provision skipped for ${data.name}:`, authErr);
        }
      }

      // Parse comma/newline separated services into array
      let parsedServices: string[] = [];
      if (Array.isArray(data.services)) {
        parsedServices = data.services;
      } else if (typeof data.services === 'string' && data.services.trim()) {
        parsedServices = data.services.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      }

      // 2. Prepare comprehensive Company Document with Full Portfolio Assets
      const companyDocData = {
        id: companyId,
        ownerId,
        name: data.name,
        slug: finalSlug,
        tagline: data.tagline || '',
        category: finalCategory,
        district: finalDistrict,
        city: data.city || finalDistrict,
        pincode: data.pincode || '',
        state: 'Tamil Nadu',
        country: 'India',
        address: data.address || '',
        phone: data.phone || '',
        alternatePhone: '',
        whatsapp: data.whatsapp || data.phone || '',
        email: data.email || '',
        website: data.website || '',
        logoUrl: data.logoUrl || '',
        coverUrl: data.bannerUrl || '',
        bannerUrl: data.bannerUrl || '',
        description: data.description || `${data.name} is a leading ${finalCategory} provider in ${finalDistrict}, Tamil Nadu.`,
        services: parsedServices,
        workingHours: data.workingHours || '9:00 AM - 8:00 PM',
        establishedYear: data.establishedYear || '',
        mapUrl: data.mapUrl || '',
        ownerName: data.ownerName || '',
        contactPerson: data.contactPerson || data.ownerName || '',
        designation: data.designation || 'Owner / MD',
        employeeCount: data.employeeCount || '1-10',
        proofType: data.proofType || 'MSME / Udyam Registration',
        proofNumber: data.proofNumber || '',
        gstNumber: data.proofNumber || '',
        facebook: data.facebook || '',
        instagram: data.instagram || '',
        linkedin: data.linkedin || '',
        youtube: data.youtube || '',
        twitter: data.twitter || '',
        socialLinks: {
          instagram: data.instagram || '',
          facebook: data.facebook || '',
          linkedin: data.linkedin || '',
          youtube: data.youtube || '',
          twitter: data.twitter || '',
        },
        keywords,
        verificationStatus: finalStatus,
        verificationBadges: {
          mobileVerified: !!data.phone,
          emailVerified: !!data.email,
          gstVerified: !!data.proofNumber,
          businessVerified: finalStatus === 'verified',
        },
        isActive: finalStatus === 'verified',
        isVerified: finalStatus === 'verified',
        isFeatured: options.isFeatured ?? data.isFeatured ?? false,
        isPremium: options.isPremium ?? data.isPremium ?? false,
        subscriptionPlan: (options.isPremium || data.isPremium) ? 'standard' : 'free',
        viewCount: 0,
        enquiryCount: 0,
        rating: 4.8,
        reviewCount: 0,
        jobsCount: 0,
        galleryImages: [],
        galleryVideos: [],
        products: [],
        importedByAdmin: true,
        importedBy: options.adminUid,
        importedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 3. Write Company Document to Firestore
      await setDoc(doc(db, 'companies', companyId), companyDocData);

      // 4. Update linked user record if ownerId is a real user
      if (ownerId && !ownerId.startsWith('imported_')) {
        await setDoc(
          doc(db, 'users', ownerId),
          {
            companyId,
            companyName: data.name,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      result.successful++;
      result.createdCompanies.push({
        id: companyId,
        name: data.name,
        slug: finalSlug,
      });

      if (createdCredential) {
        result.createdCredentials.push(createdCredential);
      }
    } catch (err: any) {
      console.error(`[Bulk Import] Error inserting row #${row.originalIndex + 1} (${data.name}):`, err);
      result.failed++;
      result.errors.push({
        rowNumber: row.originalIndex + 1,
        companyName: data.name,
        error: err.message || 'Unknown database write error',
      });
    }
  }

  if (onProgress) {
    onProgress({
      total,
      processed: total,
      successCount: result.successful,
      errorCount: result.failed,
      currentCompanyName: 'Completed',
      percentage: 100,
    });
  }

  return result;
}
