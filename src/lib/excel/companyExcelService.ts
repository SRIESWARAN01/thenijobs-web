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
  city?: string;
  address?: string;
  pincode?: string;
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
  services?: string | string[];
  workingHours?: string;
  establishedYear?: string | number;
  mapUrl?: string;
  employeeCount?: string;
  proofType?: string;
  proofNumber?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  twitter?: string;
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
export const STANDARD_CATEGORIES = [
  'Agriculture & Farming',
  'Automobile & Transport',
  'Banking & Finance',
  'Construction & Real Estate',
  'Education & Training',
  'Healthcare & Hospital',
  'Hotel, Food & Restaurant',
  'IT, Software & Digital',
  'Manufacturing & Industry',
  'Retail, Shop & Supermarket',
  'Textiles & Garments',
  'Security & Facility',
  'Professional & Business Services',
  'General Business',
] as const;

export const CATEGORY_KEYWORDS_MAP: Record<string, string[]> = {
  'Agriculture & Farming': ['agri', 'agriculture', 'farming', 'farm', 'spices', 'cardamom', 'tea', 'coffee', 'seeds', 'fertilizer', 'nursery', 'tractor', 'irrigation', 'dairy', 'poultry', 'organic', 'crop', 'plant', 'grain', 'coco', 'coconut', 'polyhouse'],
  'Automobile & Transport': ['auto', 'automobile', 'car', 'bike', 'motor', 'transport', 'logistics', 'travels', 'cab', 'taxi', 'lorry', 'truck', 'bus', 'service center', 'mechanic', 'garage', 'spare parts', 'tyre', 'courier', 'cargo', 'delivery', 'packer', 'mover'],
  'Banking & Finance': ['bank', 'banking', 'finance', 'financial', 'chit', 'chit fund', 'loan', 'microfinance', 'insurance', 'wealth', 'investment', 'money', 'credit', 'accounting', 'auditing', 'tax', 'gst consultant'],
  'Construction & Real Estate': ['construction', 'real estate', 'builder', 'building', 'architect', 'civil', 'contractor', 'brick', 'cement', 'steel', 'sand', 'interior', 'painting', 'plumbing', 'electricals', 'property', 'plots', 'housing'],
  'Education & Training': ['education', 'school', 'college', 'academy', 'institute', 'tuition', 'coaching', 'training', 'university', 'computer center', 'spoken english', 'polytechnic', 'kindergarten', 'creche', 'driving school'],
  'Healthcare & Hospital': ['health', 'healthcare', 'hospital', 'clinic', 'doctor', 'medical', 'pharmacy', 'chemist', 'drug', 'lab', 'diagnostic', 'nursing', 'dental', 'dentist', 'eye care', 'optical', 'scan', 'ayurvedic', 'homeopathy', 'care center', 'medplus', 'apollo'],
  'Hotel, Food & Restaurant': ['hotel', 'restaurant', 'food', 'bakery', 'cafe', 'bistro', 'sweet stall', 'tea stall', 'catering', 'mess', 'resort', 'lodge', 'dhaba', 'fast food', 'snack', 'ice cream', 'beverages', 'biryani', 'kitchen', 'bakes'],
  'IT, Software & Digital': ['it', 'software', 'digital', 'tech', 'technology', 'web', 'website', 'app', 'developer', 'hardware', 'networking', 'cloud', 'seo', 'marketing', 'graphic design', 'cyber', 'cctv', 'media', 'branding', 'computer sales', 'tcs', 'infotech'],
  'Manufacturing & Industry': ['manufacturing', 'industry', 'factory', 'industrial', 'production', 'mill', 'plant', 'processing', 'packaging', 'steel works', 'plastics', 'pipes', 'machinery', 'foundry', 'engineering works', 'lathe', 'coir'],
  'Retail, Shop & Supermarket': ['retail', 'shop', 'supermarket', 'store', 'grocery', 'mart', 'fancy', 'stationery', 'footwear', 'jewellery', 'gold', 'silver', 'electronics', 'appliances', 'furniture', 'hardware shop', 'departmental', 'provisions', 'bazaar'],
  'Textiles & Garments': ['textile', 'textiles', 'garment', 'garments', 'clothing', 'cloth', 'saree', 'silk', 'cotton', 'dhoti', 'apparel', 'tailor', 'tailoring', 'dress', 'boutique', 'fashion', 'readymade', 'yarn', 'weaving', 'spinning'],
  'Security & Facility': ['security', 'facility', 'guard', 'surveillance', 'manpower', 'cleaning', 'housekeeping', 'pest control', 'waste management', 'maintenance'],
  'Professional & Business Services': ['consulting', 'consultant', 'lawyer', 'legal', 'advocate', 'notary', 'xerox', 'printing', 'press', 'advertising', 'agency', 'studio', 'photography', 'event management', 'marriage hall', 'catering service', 'travel agency', 'service', 'mahal'],
  'General Business': ['general', 'business', 'enterprise', 'trading', 'agency', 'associates', 'distributor', 'dealer', 'corporation', 'company', 'other'],
};

export const CATEGORY_GUIDE_ROWS = [
  {
    'Official Category Name': 'Agriculture & Farming',
    'Included Businesses & Keywords': 'Cardamom, Spices, Organic Farms, Drip Irrigation, Seeds, Fertilizers, Agro Chemicals, Plant Nursery, Dairy Farming, Poultry, Solar Agri Pumps, Grain Wholesale, Polyhouse',
    'Example Companies': 'Agrimart Theni, Cardamom Spices Cumbum, Green Valley Agro, Theni Banana Traders',
  },
  {
    'Official Category Name': 'Automobile & Transport',
    'Included Businesses & Keywords': 'Car/Bike Showrooms, Two-Wheeler Service Centers, Mechanics, Garages, Auto Spare Parts, Tyre Shops, Logistics, Truck / Lorry Transport, Taxi / Cab Travels, Packers & Movers, Couriers',
    'Example Companies': 'Sri Murugan Auto Garage, Theni Fast Track Cabs, Royal Logistics, TVS Service Center Theni',
  },
  {
    'Official Category Name': 'Banking & Finance',
    'Included Businesses & Keywords': 'Banks, NBFCs, Gold Loans, Microfinance, Chit Funds, Chartered Accountants (CA), Tax Consultants, GST Practitioners, Insurance Agencies, Investment Advisory',
    'Example Companies': 'Theni Gold Finance, Mahalakshmi Chit Funds, Apex Tax & GST Services',
  },
  {
    'Official Category Name': 'Construction & Real Estate',
    'Included Businesses & Keywords': 'Building Contractors, Civil Engineers, Architects, Interior Designers, Bricks, Cement, TMT Steel, Sand, Electrical & Plumbing Contractors, Real Estate Promoters, Land Developers',
    'Example Companies': 'Sri Krishna Builders Theni, Royal Bricks & Cement, Theni City Plots & Real Estate',
  },
  {
    'Official Category Name': 'Education & Training',
    'Included Businesses & Keywords': 'Schools (CBSE/Matric), Colleges, Computer Institutes, Spoken English Centers, NEET/JEE Coaching, Typewriting Institutes, Skill Development Centers, Driving Schools, Kindergartens',
    'Example Companies': 'Theni Arts & Science Academy, CSC Computer Center, Winner NEET Academy',
  },
  {
    'Official Category Name': 'Healthcare & Hospital',
    'Included Businesses & Keywords': 'Multi-Speciality Hospitals, Clinics, Doctors, Diagnostic Laboratories, Scan Centers, Pharmacies, Medical Stores, Dental Clinics, Eye Care & Opticals, Ayurvedic & Siddha Centers',
    'Example Companies': 'City Care Multi-Speciality Hospital, Theni Diagnostic Lab, Royal Dental Clinic, MedPlus Pharmacy',
  },
  {
    'Official Category Name': 'Hotel, Food & Restaurant',
    'Included Businesses & Keywords': 'Hotels, Lodges, Family Restaurants, Veg/Non-Veg Dhabas, Bakeries, Tea Stalls, Sweet Stalls, Catering Services, Fast Food, Ice Cream Parlours, Resorts, Homestays',
    'Example Companies': 'Theni Anandha Bhavan, Grand Palace Hotel, Cumbum Royal Bakes, Hill View Resort Megamalai',
  },
  {
    'Official Category Name': 'IT, Software & Digital',
    'Included Businesses & Keywords': 'Software Companies, Web Design & Development, Mobile App Dev, Cloud Services, SEO & Digital Marketing, Graphic Design & Printing, CCTV & Networking, Computer & Laptop Sales/Service',
    'Example Companies': 'Tata Consultancy & IT Services Theni, Vaanikan Infotech, NextGen Web Studio',
  },
  {
    'Official Category Name': 'Manufacturing & Industry',
    'Included Businesses & Keywords': 'Factories, Processing Mills, Rice Mills, Oil Mills, Coir Industries, Plastic & Packaging Units, Steel Fabrication, Lathe Works, Foundry, Industrial Machinery',
    'Example Companies': 'Theni Coir Products, Sri Ram Oil Mills, Precision Engineering & Lathe Works',
  },
  {
    'Official Category Name': 'Retail, Shop & Supermarket',
    'Included Businesses & Keywords': 'Supermarkets, Departmental Stores, Grocery Shops, Provision Stores, Fancy & Gift Articles, Stationery, Footwear, Gold & Jewellery Showrooms, Home Appliances, Furniture Stores',
    'Example Companies': 'Royal Grand Supermarket Cumbum, Theni Gold House, Home Style Furnitures',
  },
  {
    'Official Category Name': 'Textiles & Garments',
    'Included Businesses & Keywords': 'Silk Saree Showrooms, Readymade Garments, Mens Wear, Kids Wear, Textile Wholesalers, Handloom Centers, Tailoring & Boutiques, Uniform Manufacturers, Cloth Stores',
    'Example Companies': 'Sri Meenakshi Textiles & Garments, Theni Silks, Fashion Tailors',
  },
  {
    'Official Category Name': 'Security & Facility',
    'Included Businesses & Keywords': 'Security Guard Agencies, Manpower Solutions, Housekeeping & Cleaning Services, Pest Control, CCTV Surveillance Services, Commercial Waste Management',
    'Example Companies': 'Falcon Security Services, Theni Facility & Housekeeping Hub',
  },
  {
    'Official Category Name': 'Professional & Business Services',
    'Included Businesses & Keywords': 'Advocates & Legal Advisors, Notaries, Documentation & Xerox Centers, Photo & Video Studios, Event Organizers, Marriage Halls (Mahals), Advertising Agencies, Media Houses',
    'Example Companies': 'Theni Digital Color Lab & Studio, Sri Raja Rajeswari Mahal, Apex Legal Associates',
  },
  {
    'Official Category Name': 'General Business',
    'Included Businesses & Keywords': 'General Trading, Wholesale Distributors, Agencies, Multi-Service Centers, Enterprises, Miscellaneous Local Businesses',
    'Example Companies': 'Theni General Traders, Universal Agencies, Star Commercials',
  },
];

export const DISTRICT_TOWNS_DATA = [
  { District: 'Theni', 'Major Taluks & Towns': 'Theni Allinagaram, Vadapudupatti, Palani Chettipatti, Veerapandi, Koduvilarpatti' },
  { District: 'Periyakulam', 'Major Taluks & Towns': 'Periyakulam Town, Vadagarai, Thenkarai, Devadanapatti, Genguvarpatti, Thamaraikulam' },
  { District: 'Cumbum', 'Major Taluks & Towns': 'Cumbum Town, LF Road, Bazaar Street, Surulipatti, Narayanathevanpatti, Gudalur' },
  { District: 'Bodinayakanur', 'Major Taluks & Towns': 'Bodinayakanur Town, Paramasivan Kovil Street, Kurangani Road, Dombuchery, Silamarathupatti' },
  { District: 'Chinnamanur', 'Major Taluks & Towns': 'Chinnamanur Town, Gandhi Nagar, Markayankottai, Kuchanur, Erasakkanaickanur' },
  { District: 'Andipatti', 'Major Taluks & Towns': 'Andipatti Town, Kanavoipatti, Myladumparai, Kadamalaikundu, Rajadhani' },
  { District: 'Uthamapalayam', 'Major Taluks & Towns': 'Uthamapalayam Town, Kombai, Pannaipuram, Highwavys, Megamalai, Royappanpatti' },
  { District: 'Madurai', 'Major Taluks & Towns': 'Madurai City, Usilampatti, Thirumangalam, Sholavandan, Melur' },
  { District: 'Dindigul', 'Major Taluks & Towns': 'Dindigul City, Batlagundu, Kodaikanal, Nilakottai, Palani, Oddanchatram' },
];

export const AI_PROMPT_TEMPLATE = `You are an expert Data Extractor for THENIJOBS (Tamil Nadu's Leading Local Employment & Business Platform).
Extract and structure company details into an Excel-compatible table or JSON matching the THENIJOBS schema with 100% accuracy.

CRITICAL RULES FOR CATEGORIES:
"Category" MUST match one of the 14 official platform categories EXACTLY:
1. Agriculture & Farming (Cardamom, Spices, Seeds, Farms, Nursery, Organic)
2. Automobile & Transport (Service Centers, Garages, Spares, Cabs, Travels, Lorries, Logistics)
3. Banking & Finance (Banks, Gold Loans, Chit Funds, CA, Tax, Microfinance)
4. Construction & Real Estate (Contractors, Civil, Bricks, Cement, Real Estate Plots)
5. Education & Training (Schools, Colleges, Academies, Computer Centers, Coaching)
6. Healthcare & Hospital (Hospitals, Clinics, Diagnostic Labs, Pharmacies, Doctors)
7. Hotel, Food & Restaurant (Restaurants, Hotels, Bakeries, Catering, Sweets, Resorts)
8. IT, Software & Digital (Software, Web Design, Apps, Digital Marketing, CCTV, Tech Sales)
9. Manufacturing & Industry (Mills, Factories, Production, Steel, Coir, Packaging)
10. Retail, Shop & Supermarket (Supermarkets, Groceries, Fancy, Footwear, Jewellery, Electronics)
11. Textiles & Garments (Silk Sarees, Dhotis, Readymade Garments, Tailoring, Cloth Stores)
12. Security & Facility (Security Guards, Manpower, Housekeeping, Cleaning)
13. Professional & Business Services (Lawyers, Studios, Xerox/Press, Marriage Mahals, Event Planners)
14. General Business (Trading, Distribution, Agencies, Miscellaneous)

DISTRICT OPTIONS:
Theni, Periyakulam, Cumbum, Bodinayakanur, Chinnamanur, Andipatti, Uthamapalayam, Madurai, Dindigul.

COLUMN HEADERS:
Company Name *, Category, District, City / Town, Full Address, Pincode, Owner / MD Name, Contact Person, Designation, Phone / Mobile *, WhatsApp Number, Official Email Address, Website / Domain URL, Company Logo Image URL, Company Banner Cover URL, Tagline / Motto, About & Detailed Description, Services & Products Offered (comma-separated), Working Hours / Timings, Year Established, Google Maps Location Link, Instagram URL, Facebook URL, LinkedIn URL, Domain / Business Proof Type, GST / MSME / Proof Number, Employee Count, Login User Email (User ID), Login Password, Verification Status`;

/**
 * Normalizes any raw category string into an exact official platform category using smart fuzzy matching.
 */
export function normalizeCategory(rawCat?: string, name?: string, desc?: string): string {
  if (!rawCat && !name && !desc) return 'General Business';
  const cleanInput = (rawCat || '').trim();

  // 1. Direct exact or case-insensitive match against allowed categories
  const directMatch = STANDARD_CATEGORIES.find(
    (c) => c.toLowerCase() === cleanInput.toLowerCase()
  );
  if (directMatch) return directMatch;

  // 2. Substring keyword check on raw category input
  const lowerCat = cleanInput.toLowerCase();
  for (const [standardCategory, keywords] of Object.entries(CATEGORY_KEYWORDS_MAP)) {
    if (keywords.some((kw) => lowerCat.includes(kw))) {
      return standardCategory;
    }
  }

  // 3. Substring keyword check on company name and description
  const combinedContext = `${name || ''} ${desc || ''}`.toLowerCase();
  for (const [standardCategory, keywords] of Object.entries(CATEGORY_KEYWORDS_MAP)) {
    if (keywords.some((kw) => combinedContext.includes(kw))) {
      return standardCategory;
    }
  }

  // 4. Safe fallback to General Business
  return 'General Business';
}

/**
 * Normalizes district to standard Theni region locations
 */
export function normalizeDistrict(rawDistrict?: string, address?: string): string {
  const combined = `${rawDistrict || ''} ${address || ''}`.toLowerCase();
  if (combined.includes('periyakulam') || combined.includes('vadagarai') || combined.includes('devadanapatti')) return 'Periyakulam';
  if (combined.includes('cumbum') || combined.includes('gudalur') || combined.includes('surulipatti')) return 'Cumbum';
  if (combined.includes('bodi') || combined.includes('bodinayakanur') || combined.includes('kurangani')) return 'Bodinayakanur';
  if (combined.includes('chinnamanur') || combined.includes('kuchanur') || combined.includes('markayankottai')) return 'Chinnamanur';
  if (combined.includes('andipatti') || combined.includes('kadamalaikundu') || combined.includes('myladumparai')) return 'Andipatti';
  if (combined.includes('uthamapalayam') || combined.includes('kombai') || combined.includes('pannaipuram') || combined.includes('megamalai')) return 'Uthamapalayam';
  if (combined.includes('madurai') || combined.includes('usilampatti')) return 'Madurai';
  if (combined.includes('dindigul') || combined.includes('batlagundu') || combined.includes('kodaikanal')) return 'Dindigul';
  return 'Theni';
}

export const FIELD_ALIASES: Record<keyof StandardCompanyFields, string[]> = {
  name: ['company name', 'business name', 'company', 'organization', 'name', 'shop name', 'firm name', 'enterprise'],
  category: ['category', 'industry', 'business category', 'sector', 'business type', 'type'],
  district: ['district', 'location', 'place', 'area', 'taluk'],
  city: ['city', 'town', 'village', 'municipality', 'taluk name'],
  address: ['address', 'full address', 'street address', 'street', 'office address', 'shop address', 'location address'],
  pincode: ['pincode', 'pin code', 'postal code', 'zip', 'zipcode', 'pin'],
  ownerName: ['owner name', 'owner', 'proprietor', 'founder', 'managing director', 'md name'],
  contactPerson: ['contact person', 'contact name', 'hr name', 'manager name', 'representative'],
  designation: ['designation', 'role', 'title', 'position'],
  phone: ['phone', 'mobile', 'phone number', 'mobile number', 'contact number', 'telephone', 'cell', 'primary phone'],
  whatsapp: ['whatsapp', 'whatsapp number', 'wa number', 'wa phone'],
  email: ['email', 'email address', 'e-mail', 'mail', 'company email', 'official email'],
  website: ['website', 'web', 'site', 'url', 'web url', 'website url', 'domain', 'domain name', 'website name', 'company website'],
  logoUrl: ['logo', 'logo url', 'company logo', 'photo url', 'image url', 'brand logo', 'logo link', 'logo image'],
  bannerUrl: ['banner', 'cover', 'cover url', 'banner url', 'cover image', 'banner image', 'header image', 'cover link'],
  description: ['description', 'about', 'about us', 'details', 'company description', 'overview', 'profile overview'],
  tagline: ['tagline', 'slogan', 'punchline', 'motto', 'short bio'],
  services: ['services', 'services offered', 'products', 'products and services', 'offerings', 'specialties', 'services & products', 'services list'],
  workingHours: ['working hours', 'timings', 'business hours', 'office timings', 'open hours', 'hours'],
  establishedYear: ['established year', 'year established', 'est year', 'established', 'founded', 'year founded', 'founded year'],
  mapUrl: ['google maps', 'map link', 'location link', 'map url', 'google map location', 'maps link', 'google map'],
  employeeCount: ['employee count', 'employees', 'company size', 'team size', 'no of employees', 'staff count'],
  proofType: ['proof type', 'id proof type', 'doc type', 'document type', 'registration type', 'msme/gst', 'domain proof', 'domain verification', 'verification type', 'domain verification type'],
  proofNumber: ['proof number', 'gst number', 'gst', 'gstin', 'msme number', 'udyam number', 'license number', 'registration number', 'domain verification code', 'verification code', 'domain code'],
  facebook: ['facebook', 'fb', 'fb page', 'facebook url', 'facebook link'],
  instagram: ['instagram', 'insta', 'instagram url', 'insta link'],
  linkedin: ['linkedin', 'linkedin url', 'linkedin link'],
  youtube: ['youtube', 'youtube channel', 'youtube url'],
  twitter: ['twitter', 'x', 'twitter url', 'x url', 'twitter handle'],
  verificationStatus: ['status', 'verification status', 'verified status', 'approval status'],
  isPremium: ['premium', 'is premium', 'premium member', 'plan type'],
  isFeatured: ['featured', 'is featured', 'top listing'],
  createUserAccount: ['create login', 'create user', 'user account', 'enable login', 'create employer account'],
  accountEmail: ['login email', 'user email', 'account email', 'user id', 'username', 'login user id', 'employer email', 'login id'],
  accountPassword: ['password', 'initial password', 'login password', 'user password', 'temp password', 'temporary password', 'default password'],
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

    // Auto-normalize Category and District using smart AI fuzzy matching
    const normalizedCategory = normalizeCategory(mapped.category, name, mapped.description);
    const normalizedDistrict = normalizeDistrict(mapped.district, mapped.address);

    const finalMapped: StandardCompanyFields = {
      name: name || 'Unnamed Business',
      category: normalizedCategory,
      district: normalizedDistrict,
      city: mapped.city || mapped.district || normalizedDistrict,
      address: mapped.address || '',
      pincode: mapped.pincode || '',
      ownerName: mapped.ownerName || '',
      contactPerson: mapped.contactPerson || '',
      designation: mapped.designation || 'Owner / MD',
      phone: cleanPhone || String(rawPhone || ''),
      whatsapp: cleanPhoneNumber(mapped.whatsapp) || cleanPhone || '',
      email: email || '',
      website: mapped.website || '',
      logoUrl: mapped.logoUrl || '',
      bannerUrl: mapped.bannerUrl || '',
      description: mapped.description || '',
      tagline: mapped.tagline || '',
      services: mapped.services || '',
      workingHours: mapped.workingHours || '9:00 AM - 8:00 PM',
      establishedYear: mapped.establishedYear || '',
      mapUrl: mapped.mapUrl || '',
      employeeCount: mapped.employeeCount || '1-10',
      proofType: mapped.proofType || 'MSME / Udyam Registration',
      proofNumber: mapped.proofNumber || '',
      facebook: mapped.facebook || '',
      instagram: mapped.instagram || '',
      linkedin: mapped.linkedin || '',
      youtube: mapped.youtube || '',
      twitter: mapped.twitter || '',
      verificationStatus: mapped.verificationStatus || 'verified',
      isPremium: mapped.isPremium ?? false,
      isFeatured: mapped.isFeatured ?? false,
      createUserAccount: mapped.createUserAccount ?? true,
      accountEmail: mapped.accountEmail || email || '',
      accountPassword: mapped.accountPassword || '',
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
 * Generates a styled Multi-Sheet Excel template file for bulk company import
 * Sheet 1: Company Import Template
 * Sheet 2: Allowed Categories Guide
 * Sheet 3: Districts & Towns Reference
 * Sheet 4: AI Extraction Prompt
 */
export function generateCompanyTemplateExcel(): void {
  const headers = [
    'Company Name *',
    'Category',
    'District',
    'City / Town',
    'Full Address',
    'Pincode',
    'Owner / MD Name',
    'Contact Person',
    'Designation',
    'Phone / Mobile *',
    'WhatsApp Number',
    'Official Email Address',
    'Website / Domain URL',
    'Company Logo Image URL',
    'Company Banner Cover URL',
    'Tagline / Motto',
    'About & Detailed Description',
    'Services & Products Offered (comma-separated)',
    'Working Hours / Timings',
    'Year Established',
    'Google Maps Location Link',
    'Instagram URL',
    'Facebook URL',
    'LinkedIn URL',
    'Domain / Business Proof Type',
    'GST / MSME / Proof Number',
    'Employee Count',
    'Login User Email (User ID)',
    'Login Password',
    'Verification Status',
  ];

  const sampleRows = [
    [
      'Agrimart Farm Solutions Theni',
      'Agriculture & Farming',
      'Theni',
      'Theni',
      '84, Allinagaram Road, Near Uzhavar Sandhai, Theni',
      '625531',
      'P. Senthil Kumar',
      'P. Senthil Kumar',
      'Managing Director',
      '9842155667',
      '9842155667',
      'contact@agrimarttheni.in',
      'https://agrimarttheni.in',
      'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&h=400&fit=crop&q=80',
      'Complete Agri Tools, Organic Fertilizers & Smart Drip Irrigation',
      'Agrimart is Theni district’s leading agricultural supply hub providing high-grade seeds, bio-fertilizers, solar pumps, and modern farm equipment with doorstep delivery for farmers across Cumbum, Periyakulam, and Bodinayakanur.',
      'Organic Fertilizers, Drip Irrigation Pipes, Hybrid Seeds, Solar Agri Pumps, Farm Spraying Equipment, Soil Testing & Crop Consultation',
      '8:30 AM - 7:30 PM (Mon - Sat)',
      '2018',
      'https://maps.google.com/?q=Theni+Tamil+Nadu',
      'https://instagram.com/agrimarttheni',
      'https://facebook.com/agrimarttheni',
      'https://linkedin.com/company/agrimart-theni',
      'MSME / Udyam Registration',
      'UDYAM-TN-25-0043819',
      '10-25',
      'senthil@agrimarttheni.in',
      'AgriMart@2026',
      'verified',
    ],
    [
      'Tata Consultancy & IT Services Theni',
      'IT, Software & Digital',
      'Theni',
      'Periyakulam',
      '45, Vadagarai Main Road, Periyakulam, Theni District',
      '625601',
      'R. Karthik',
      'R. Karthik',
      'Director & Principal Architect',
      '9876543210',
      '9876543210',
      'hello@tataconsultancy-theni.com',
      'https://tataconsultancy-theni.com',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop&q=80',
      'Next-Gen Cloud, Web Design, AI & Enterprise Software Development',
      'Providing end-to-end cloud solutions, mobile app development, SEO optimization, and enterprise ERP automation for businesses across Tamil Nadu with 24/7 technical support.',
      'Custom Web Application Development, Mobile Apps (iOS/Android), Cloud Migration, E-commerce Store Setup, SEO & Digital Marketing, ERP Implementation',
      '9:00 AM - 6:30 PM (Mon - Fri)',
      '2019',
      'https://maps.google.com/?q=Periyakulam+Tamil+Nadu',
      'https://instagram.com/tataconsultancy_theni',
      'https://facebook.com/tataconsultancyit',
      'https://linkedin.com/company/tata-consultancy-theni',
      'GST Registration Certificate',
      '33AAAAA9876K1Z9',
      '25-50',
      'karthik@tataconsultancy-theni.com',
      'TataIT#Theni2026',
      'verified',
    ],
    [
      'Royal Grand Supermarket Cumbum',
      'Retail, Shop & Supermarket',
      'Theni',
      'Cumbum',
      '112, LF Road, Near Bus Stand, Cumbum',
      '625516',
      'A. Mohammed Ismail',
      'M. Farook',
      'Store Manager',
      '9843210987',
      '9843210987',
      'support@royalgrandsupermarket.com',
      'https://royalgrandsupermarket.com',
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=1200&h=400&fit=crop&q=80',
      'All Daily Groceries, Organic Spices & Household Essentials Under One Roof',
      'Cumbum valley’s premier multi-floor supermarket offering premium groceries, dry fruits, fresh dairy, household products, and free home delivery within 5 km.',
      'Groceries & Grains, Cold-pressed Oils, Cumbum Valley Cardamom & Spices, Fresh Dairy Products, Household Utensils, Express Home Delivery',
      '8:00 AM - 10:00 PM (All 7 Days)',
      '2015',
      'https://maps.google.com/?q=Cumbum+Tamil+Nadu',
      'https://instagram.com/royalgrandcumbum',
      'https://facebook.com/royalgrandcumbum',
      '',
      'FSSAI Food License',
      'FSSAI-12421008000452',
      '10-25',
      'admin@royalgrandsupermarket.com',
      'RoyalSupermarket@2026',
      'verified',
    ],
    [
      'Sri Meenakshi Textiles & Garments',
      'Textiles & Garments',
      'Theni',
      'Bodinayakanur',
      '24, Paramasivan Kovil Street, Bodinayakanur',
      '625513',
      'V. Ramanathan',
      'R. Vignesh',
      'Marketing Head',
      '9443217890',
      '9443217890',
      'orders@meenakshitextiles.com',
      'https://meenakshitextiles.com',
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop&q=80',
      'Traditional Silk Sarees, Cotton Dhotis & Modern Readymade Garments',
      'Manufacturer and wholesaler of pure handloom silk sarees, wedding collections, and uniform garments with wholesale pricing and customized stitching services.',
      'Pure Silk Sarees, Handloom Cotton Dhotis, School & College Uniforms, Mens Wedding Kurtas, Kids Wear, Custom Tailoring',
      '9:30 AM - 9:00 PM (Mon - Sun)',
      '2012',
      'https://maps.google.com/?q=Bodinayakanur+Tamil+Nadu',
      'https://instagram.com/meenakshitextiles',
      'https://facebook.com/meenakshitextiles',
      '',
      'GST Registration Certificate',
      '33ABCDE1234F1Z8',
      '10-25',
      'vignesh@meenakshitextiles.com',
      'Meenakshi#Silk2026',
      'verified',
    ],
    [
      'City Care Multi-Speciality Hospital',
      'Healthcare & Hospital',
      'Theni',
      'Theni',
      '18, NRT Main Road, Theni Allinagaram',
      '625531',
      'Dr. Anitha Ravi',
      'K. Saravanan',
      'Admin Officer',
      '9488776655',
      '9488776655',
      'info@citycarehospitaltheni.com',
      'https://citycarehospitaltheni.com',
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=300&h=300&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=400&fit=crop&q=80',
      '24/7 Advanced Emergency, Cardiology, Ortho & Maternity Care',
      'State-of-the-art 100-bed hospital equipped with modern CT scan, digital X-ray, automated diagnostic lab, 24/7 trauma ICU, and cashless insurance claims.',
      '24/7 Emergency & Ambulance, Cardiology & ECG/Echo, Orthopedic Surgery, Maternity & Neonatal ICU, General Medicine, Diagnostic Laboratory',
      '24 Hours Open (Emergency & Inpatient)',
      '2016',
      'https://maps.google.com/?q=Theni+Hospital+Tamil+Nadu',
      'https://instagram.com/citycarehospitaltheni',
      'https://facebook.com/citycarehospitaltheni',
      'https://linkedin.com/company/citycarehospital',
      'Shop & Establishment Act License',
      'SE-TN-THN-99882',
      '50-100',
      'admin@citycarehospitaltheni.com',
      'CityCare#Hospital2026',
      'verified',
    ],
  ];

  // 1. Sheet 1: Company Import Template
  const ws1 = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws1['!cols'] = [
    { wch: 32 }, // Company Name
    { wch: 24 }, // Category
    { wch: 14 }, // District
    { wch: 18 }, // City/Town
    { wch: 40 }, // Full Address
    { wch: 12 }, // Pincode
    { wch: 20 }, // Owner / MD
    { wch: 20 }, // Contact Person
    { wch: 22 }, // Designation
    { wch: 16 }, // Phone
    { wch: 16 }, // WhatsApp
    { wch: 28 }, // Official Email
    { wch: 28 }, // Website / Domain
    { wch: 35 }, // Logo URL
    { wch: 35 }, // Banner URL
    { wch: 45 }, // Tagline
    { wch: 55 }, // Description
    { wch: 50 }, // Services
    { wch: 28 }, // Working Hours
    { wch: 16 }, // Year Established
    { wch: 30 }, // Google Maps URL
    { wch: 26 }, // Instagram
    { wch: 26 }, // Facebook
    { wch: 26 }, // LinkedIn
    { wch: 28 }, // Proof Type
    { wch: 24 }, // Proof Number
    { wch: 16 }, // Employee Count
    { wch: 30 }, // Login Email
    { wch: 22 }, // Login Password
    { wch: 18 }, // Status
  ];

  // 2. Sheet 2: Allowed Categories Guide
  const ws2 = XLSX.utils.json_to_sheet(CATEGORY_GUIDE_ROWS);
  ws2['!cols'] = [{ wch: 32 }, { wch: 80 }, { wch: 60 }];

  // 3. Sheet 3: Districts & Towns Reference
  const ws3 = XLSX.utils.json_to_sheet(DISTRICT_TOWNS_DATA);
  ws3['!cols'] = [{ wch: 20 }, { wch: 75 }];

  // 4. Sheet 4: AI Extraction Prompt
  const ws4Data = [
    ['THENIJOBS AI DATA EXTRACTION PROMPT FOR CLAUDE & CHATGPT'],
    ['-----------------------------------------------------------'],
    ['Copy and paste the entire prompt below into Claude / ChatGPT when converting company lists into THENIJOBS format:'],
    [''],
    [AI_PROMPT_TEMPLATE],
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(ws4Data);
  ws4['!cols'] = [{ wch: 110 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Company Import Template');
  XLSX.utils.book_append_sheet(wb, ws2, 'Allowed Categories Guide');
  XLSX.utils.book_append_sheet(wb, ws3, 'Districts Reference');
  XLSX.utils.book_append_sheet(wb, ws4, 'AI Extraction Prompt');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `THENIJOBS_Complete_Company_Portfolio_Template_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
    'City / Town': c.city || c.district || '',
    'Address': c.address || '',
    'Pincode': c.pincode || '',
    'Owner / MD Name': c.ownerName || '',
    'Contact Person': c.contactPerson || '',
    'Designation': c.designation || '',
    'Phone': c.phone || '',
    'WhatsApp': c.whatsapp || c.phone || '',
    'Email': c.email || '',
    'Website / Domain': c.website || '',
    'Logo URL': c.logoUrl || '',
    'Banner URL': c.bannerUrl || '',
    'Services Offered': Array.isArray(c.services) ? c.services.join(', ') : (c.services || ''),
    'Working Hours': c.workingHours || '',
    'Year Established': c.establishedYear || '',
    'Proof Type': c.proofType || '',
    'Proof Number': c.proofNumber || '',
    'Verification Status': c.verificationStatus || 'pending',
    'Is Featured': c.isFeatured ? 'Yes' : 'No',
    'Is Premium': c.isPremium ? 'Yes' : 'No',
    'Tagline': c.tagline || '',
    'Description': c.description || '',
    'Created At': c.createdAt ? (c.createdAt.toDate ? c.createdAt.toDate().toISOString() : String(c.createdAt)) : '',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
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
