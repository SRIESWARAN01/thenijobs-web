import * as XLSX from 'xlsx';

/**
 * Universal browser file download helper using Blob and temporary anchor element.
 */
function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export interface RawExcelRow {
  [key: string]: any;
}

export interface StandardCompanyFields {
  name: string;
  category?: string;
  district?: string;
  address?: string;
  ownerName?: string;
  contactPerson?: string;
  designation?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  tagline?: string;
  employeeCount?: string;
  proofType?: string;
  proofNumber?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'under_review';
  isPremium?: boolean;
  isFeatured?: boolean;
  createUserAccount?: boolean;
  accountEmail?: string;
  accountPassword?: string;
}

export type RowStatusType = 'valid' | 'warning' | 'duplicate' | 'error';

export interface AnalyzedCompanyRow {
  id: string; // generated temp id
  originalIndex: number;
  raw: RawExcelRow;
  mapped: StandardCompanyFields;
  status: RowStatusType;
  issues: string[];
  isDuplicateInSheet: boolean;
  isDuplicateInDatabase: boolean;
  duplicateMatchedBy?: 'phone' | 'email' | 'name';
  isSelected: boolean;
}

export interface ColumnMapping {
  excelColumn: string;
  targetField: keyof StandardCompanyFields | 'ignore';
  sampleValue: string;
  isIncluded: boolean;
}

export interface ExcelAnalysisResult {
  totalRows: number;
  columns: ColumnMapping[];
  analyzedRows: AnalyzedCompanyRow[];
  summary: {
    validCount: number;
    warningCount: number;
    duplicateCount: number;
    errorCount: number;
  };
}

// Field aliases mapping for auto-detection
const FIELD_ALIASES: Record<keyof StandardCompanyFields, string[]> = {
  name: ['company name', 'company', 'business name', 'business', 'shop name', 'firm name', 'name', 'org name', 'organization'],
  category: ['category', 'industry', 'business category', 'sector', 'business type', 'type'],
  district: ['district', 'city', 'location', 'place', 'town', 'area', 'taluk'],
  address: ['address', 'full address', 'street address', 'street', 'office address', 'shop address', 'location address'],
  ownerName: ['owner name', 'owner', 'proprietor', 'founder', 'managing director', 'md name'],
  contactPerson: ['contact person', 'contact name', 'hr name', 'manager name', 'representative'],
  designation: ['designation', 'role', 'title', 'position'],
  phone: ['phone', 'mobile', 'phone number', 'mobile number', 'contact number', 'telephone', 'cell', 'primary phone'],
  whatsapp: ['whatsapp', 'whatsapp number', 'wa number', 'wa phone'],
  email: ['email', 'email address', 'e-mail', 'mail', 'company email', 'official email'],
  website: ['website', 'web', 'site', 'url', 'web url', 'website url'],
  logoUrl: ['logo', 'logo url', 'company logo', 'photo url', 'image url', 'brand logo'],
  bannerUrl: ['banner', 'cover', 'cover url', 'banner url', 'cover image'],
  description: ['description', 'about', 'about us', 'details', 'company description', 'overview'],
  tagline: ['tagline', 'slogan', 'punchline', 'motto'],
  employeeCount: ['employee count', 'employees', 'company size', 'team size', 'no of employees', 'staff count'],
  proofType: ['proof type', 'id proof type', 'doc type', 'document type', 'registration type', 'msme/gst'],
  proofNumber: ['proof number', 'gst number', 'gst', 'gstin', 'msme number', 'udyam number', 'license number', 'registration number'],
  facebook: ['facebook', 'fb', 'fb page', 'facebook url'],
  instagram: ['instagram', 'insta', 'instagram url'],
  linkedin: ['linkedin', 'linkedin url'],
  youtube: ['youtube', 'youtube channel'],
  verificationStatus: ['status', 'verification status', 'verified status', 'approval status'],
  isPremium: ['premium', 'is premium', 'premium member', 'plan type'],
  isFeatured: ['featured', 'is featured', 'top listing'],
  createUserAccount: ['create login', 'create user', 'user account', 'enable login'],
  accountEmail: ['login email', 'user email', 'account email'],
  accountPassword: ['password', 'initial password', 'login password'],
};

/**
 * Parses an Excel or CSV file into raw JSON objects
 */
export async function parseExcelFile(file: File): Promise<{ sheetName: string; rows: RawExcelRow[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames.length) {
          throw new Error('Excel workbook contains no sheets.');
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json<RawExcelRow>(worksheet, { defval: '' });
        
        // Extract headers from worksheet range
        const headers: string[] = [];
        if (worksheet['!ref']) {
          const range = XLSX.utils.decode_range(worksheet['!ref']);
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
            if (cell && cell.v) {
              headers.push(String(cell.v).trim());
            }
          }
        }

        // If headers weren't found from range, extract from first row keys
        if (!headers.length && rows.length > 0) {
          headers.push(...Object.keys(rows[0]));
        }

        resolve({ sheetName, rows, headers });
      } catch (err: any) {
        reject(new Error(err?.message || 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file from disk.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Normalizes phone numbers to clean 10-digit format
 */
export function cleanPhoneNumber(phone?: any): string {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Normalizes email address
 */
export function cleanEmail(email?: any): string {
  if (!email) return '';
  return String(email).trim().toLowerCase();
}

/**
 * Auto-detects column mappings based on aliases
 */
export function detectColumnMappings(headers: string[], sampleRows: RawExcelRow[]): ColumnMapping[] {
  const usedTargets = new Set<string>();

  return headers.map((col) => {
    const normalized = col.toLowerCase().trim().replace(/[_.-]/g, ' ');
    let detectedTarget: keyof StandardCompanyFields | 'ignore' = 'ignore';

    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
        if (!usedTargets.has(field)) {
          detectedTarget = field as keyof StandardCompanyFields;
          usedTargets.add(field);
          break;
        }
      }
    }

    const sampleRowWithVal = sampleRows.find((r) => r[col] !== undefined && String(r[col]).trim() !== '');
    const sampleValue = sampleRowWithVal ? String(sampleRowWithVal[col]).slice(0, 40) : '';

    return {
      excelColumn: col,
      targetField: detectedTarget,
      sampleValue,
      isIncluded: detectedTarget !== 'ignore',
    };
  });
}

/**
 * Analyzes parsed rows, checks for duplicates and formatting errors
 */
export function analyzeCompanyDataset(
  rawRows: RawExcelRow[],
  mappings: ColumnMapping[],
  existingCompanies: Array<{ id?: string; name?: string; phone?: string; email?: string }> = []
): ExcelAnalysisResult {
  const seenPhonesInSheet = new Map<string, number>();
  const seenEmailsInSheet = new Map<string, number>();
  const seenNamesInSheet = new Map<string, number>();

  // Map existing DB companies for rapid cross-checking
  const existingPhones = new Set(
    existingCompanies.map((c) => cleanPhoneNumber(c.phone)).filter((p) => p.length === 10)
  );
  const existingEmails = new Set(
    existingCompanies.map((c) => cleanEmail(c.email)).filter((e) => e.length > 3)
  );
  const existingNames = new Set(
    existingCompanies.map((c) => (c.name || '').trim().toLowerCase()).filter((n) => n.length > 0)
  );

  const activeMappings = mappings.filter((m) => m.isIncluded && m.targetField !== 'ignore');

  const analyzedRows: AnalyzedCompanyRow[] = rawRows.map((raw, idx) => {
    const mapped: Partial<StandardCompanyFields> = {};

    activeMappings.forEach((m) => {
      if (m.targetField !== 'ignore') {
        const val = raw[m.excelColumn];
        if (val !== undefined && val !== null) {
          (mapped as any)[m.targetField] = typeof val === 'string' ? val.trim() : val;
        }
      }
    });

    const issues: string[] = [];
    let isDuplicateInSheet = false;
    let isDuplicateInDatabase = false;
    let duplicateMatchedBy: 'phone' | 'email' | 'name' | undefined;

    // 1. Validate Company Name (Mandatory)
    const name = (mapped.name || '').trim();
    if (!name) {
      issues.push('Missing required Company Name');
    }

    // 2. Validate Phone
    const rawPhone = mapped.phone;
    const cleanPhone = cleanPhoneNumber(rawPhone);
    if (rawPhone && cleanPhone.length !== 10) {
      issues.push(`Phone number "${rawPhone}" is invalid (must be 10 digits)`);
    }

    // 3. Validate Email
    const email = cleanEmail(mapped.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      issues.push(`Email address "${mapped.email}" is invalid`);
    }

    // 4. Check for duplicates in current sheet
    if (cleanPhone.length === 10) {
      if (seenPhonesInSheet.has(cleanPhone)) {
        isDuplicateInSheet = true;
        duplicateMatchedBy = 'phone';
        issues.push(`Duplicate phone (${cleanPhone}) with row #${seenPhonesInSheet.get(cleanPhone)! + 1}`);
      } else {
        seenPhonesInSheet.set(cleanPhone, idx);
      }
    }

    if (email) {
      if (seenEmailsInSheet.has(email)) {
        isDuplicateInSheet = true;
        duplicateMatchedBy = 'email';
        issues.push(`Duplicate email (${email}) with row #${seenEmailsInSheet.get(email)! + 1}`);
      } else {
        seenEmailsInSheet.set(email, idx);
      }
    }

    if (name) {
      const normalizedName = name.toLowerCase();
      if (seenNamesInSheet.has(normalizedName)) {
        isDuplicateInSheet = true;
        duplicateMatchedBy = 'name';
        issues.push(`Duplicate company name with row #${seenNamesInSheet.get(normalizedName)! + 1}`);
      } else {
        seenNamesInSheet.set(normalizedName, idx);
      }
    }

    // 5. Check for duplicates against existing Firebase Database
    if (cleanPhone.length === 10 && existingPhones.has(cleanPhone)) {
      isDuplicateInDatabase = true;
      duplicateMatchedBy = 'phone';
      issues.push(`Phone (${cleanPhone}) already exists in THENIJOBS database`);
    }

    if (email && existingEmails.has(email)) {
      isDuplicateInDatabase = true;
      duplicateMatchedBy = 'email';
      issues.push(`Email (${email}) already exists in THENIJOBS database`);
    }

    if (name && existingNames.has(name.toLowerCase())) {
      isDuplicateInDatabase = true;
      duplicateMatchedBy = 'name';
      issues.push(`Company "${name}" already exists in THENIJOBS database`);
    }

    // Determine row status
    let status: RowStatusType = 'valid';
    if (!name) {
      status = 'error';
    } else if (isDuplicateInDatabase || isDuplicateInSheet) {
      status = 'duplicate';
    } else if (issues.length > 0) {
      status = 'warning';
    }

    const finalMapped: StandardCompanyFields = {
      name: name || 'Unnamed Business',
      category: mapped.category || 'General Business',
      district: mapped.district || 'Theni',
      address: mapped.address || '',
      ownerName: mapped.ownerName || '',
      contactPerson: mapped.contactPerson || '',
      designation: mapped.designation || '',
      phone: cleanPhone || String(rawPhone || ''),
      whatsapp: cleanPhoneNumber(mapped.whatsapp) || cleanPhone || '',
      email: email || '',
      website: mapped.website || '',
      logoUrl: mapped.logoUrl || '',
      bannerUrl: mapped.bannerUrl || '',
      description: mapped.description || '',
      tagline: mapped.tagline || '',
      employeeCount: mapped.employeeCount || '1-10',
      proofType: mapped.proofType || '',
      proofNumber: mapped.proofNumber || '',
      facebook: mapped.facebook || '',
      instagram: mapped.instagram || '',
      linkedin: mapped.linkedin || '',
      youtube: mapped.youtube || '',
      verificationStatus: mapped.verificationStatus || 'verified',
      isPremium: mapped.isPremium ?? false,
      isFeatured: mapped.isFeatured ?? false,
      createUserAccount: mapped.createUserAccount ?? true,
      accountEmail: mapped.accountEmail || email || '',
    };

    return {
      id: `row_${idx}_${Date.now()}`,
      originalIndex: idx,
      raw,
      mapped: finalMapped,
      status,
      issues,
      isDuplicateInSheet,
      isDuplicateInDatabase,
      duplicateMatchedBy,
      isSelected: status !== 'error' && status !== 'duplicate',
    };
  });

  const summary = {
    validCount: analyzedRows.filter((r) => r.status === 'valid').length,
    warningCount: analyzedRows.filter((r) => r.status === 'warning').length,
    duplicateCount: analyzedRows.filter((r) => r.status === 'duplicate').length,
    errorCount: analyzedRows.filter((r) => r.status === 'error').length,
  };

  return {
    totalRows: rawRows.length,
    columns: mappings,
    analyzedRows,
    summary,
  };
}

/**
 * Generates a styled Excel template file for bulk company import
 */
export function generateCompanyTemplateExcel(): void {
  const headers = [
    'Company Name *',
    'Category',
    'District',
    'Address',
    'Owner / MD Name',
    'Contact Person',
    'Phone / Mobile *',
    'WhatsApp Number',
    'Email Address',
    'Website URL',
    'Logo Image URL',
    'Tagline',
    'Description',
    'Employee Count',
    'GST / MSME Number',
    'Verification Status',
  ];

  const sampleRows = [
    [
      'Vaanikan Infotech Theni',
      'IT, Software & Digital',
      'Theni',
      '12, Madurai Main Road, Theni',
      'K. Suresh',
      'K. Suresh',
      '9876543210',
      '9876543210',
      'contact@vaanikan.com',
      'https://vaanikan.com',
      'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=300',
      'Next-gen IT and Cloud Solutions in Theni',
      'Leading software development and web design services provider.',
      '10-50',
      '33AAAAA0000A1Z5',
      'verified',
    ],
    [
      'Green Cardamom Spices Cumbum',
      'Agriculture & Farming',
      'Cumbum',
      '45, Bazaar Street, Cumbum',
      'M. Rajesh',
      'M. Rajesh',
      '9843210987',
      '9843210987',
      'sales@greencardamom.in',
      'https://greencardamom.in',
      '',
      'Fresh Cardamom and Spices Direct from Farmers',
      'Exporter and wholesale trader of organic spices.',
      '5-10',
      'UDYAM-TN-25-0012345',
      'verified',
    ],
    [
      'Theni Royal Grand Hospital',
      'Healthcare & Hospital',
      'Periyakulam',
      '88, Hospital Road, Periyakulam',
      'Dr. Anitha Ravi',
      'Admin Officer',
      '9443217890',
      '9443217890',
      'info@theniroyalhospital.com',
      'https://theniroyalhospital.com',
      '',
      '24x7 Multi-Speciality Care for Theni District',
      'Complete emergency, surgical and inpatient medical care.',
      '50-100',
      '33BBBBB1111B2Z6',
      'verified',
    ],
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for comfortable reading
  ws['!cols'] = [
    { wch: 28 }, // Company Name
    { wch: 22 }, // Category
    { wch: 14 }, // District
    { wch: 32 }, // Address
    { wch: 18 }, // Owner
    { wch: 18 }, // Contact
    { wch: 16 }, // Phone
    { wch: 16 }, // WhatsApp
    { wch: 26 }, // Email
    { wch: 26 }, // Website
    { wch: 28 }, // Logo URL
    { wch: 35 }, // Tagline
    { wch: 40 }, // Description
    { wch: 16 }, // Employee Count
    { wch: 22 }, // GST/MSME
    { wch: 18 }, // Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Company Import Template');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `THENIJOBS_Company_Bulk_Import_Template_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Exports existing companies to an Excel spreadsheet
 */
export function exportCompaniesToExcel(companies: any[], filename = 'THENIJOBS_Companies_Export'): void {
  const exportData = companies.map((c, idx) => ({
    'S.No': idx + 1,
    'Company ID': c.id || '',
    'Company Name': c.name || '',
    'Category': c.category || '',
    'District': c.district || 'Theni',
    'Address': c.address || '',
    'Owner / MD Name': c.ownerName || '',
    'Contact Person': c.contactPerson || '',
    'Designation': c.designation || '',
    'Phone': c.phone || '',
    'WhatsApp': c.whatsapp || '',
    'Email': c.email || '',
    'Website': c.website || '',
    'Logo URL': c.logoUrl || '',
    'Tagline': c.tagline || '',
    'Description': c.description || '',
    'Employee Count': c.employeeCount || '',
    'GST / Proof Number': c.proofNumber || c.gstNumber || '',
    'Verification Status': c.verificationStatus || 'pending',
    'Is Premium': c.isPremium ? 'YES' : 'NO',
    'Is Featured': c.isFeatured ? 'YES' : 'NO',
    'Active Jobs': c.jobsCount || 0,
    'Total Views': c.viewCount || 0,
    'Rating': c.rating || 0,
    'Reviews': c.reviewCount || 0,
    'Created At': c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('en-IN') : (c.createdAt ? String(c.createdAt).slice(0, 10) : ''),
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 28 },
    { wch: 22 },
    { wch: 14 },
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 15 },
    { wch: 15 },
    { wch: 24 },
    { wch: 26 },
    { wch: 28 },
    { wch: 30 },
    { wch: 35 },
    { wch: 15 },
    { wch: 20 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Companies');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Exports generated account credentials for newly created companies to Excel
 */
export function exportCreatedCredentialsToExcel(credentials: Array<{
  companyName: string;
  companyId: string;
  email: string;
  password?: string;
  phone: string;
  district: string;
  loginUrl: string;
}>): void {
  const data = credentials.map((c, i) => ({
    'S.No': i + 1,
    'Company Name': c.companyName,
    'Company ID': c.companyId,
    'Login Email': c.email,
    'Temporary Password': c.password || 'Existing Account',
    'Phone': c.phone,
    'District': c.district,
    'Portal Login URL': c.loginUrl,
    'Instructions': 'Please share this login info with the business owner so they can manage jobs, profile, and inquiries.',
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 22 },
    { wch: 26 },
    { wch: 18 },
    { wch: 15 },
    { wch: 14 },
    { wch: 36 },
    { wch: 60 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Created User Logins');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `THENIJOBS_Business_Logins_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
