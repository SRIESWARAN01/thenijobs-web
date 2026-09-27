/**
 * THENIJOBS BILLING SYSTEM — MASTER SLOGAN LIBRARY
 * Contains all 100 approved slogans (50 Tamil + 50 English)
 * with language tags, unique IDs, and deterministic rotation utilities.
 */

export interface BillingSlogan {
  id: string;              // Unique ID (e.g. "slogan_1", "slogan_51")
  sloganNumber: number;    // 1 to 100
  text: string;            // Official slogan text
  language: 'ta' | 'en';   // 'ta' for Tamil, 'en' for English
  category?: string;       // e.g. "business", "growth", "trust"
  isActive: boolean;       // Status for rotation eligibility
  usageCount: number;      // Total number of times assigned
  lastUsedAt?: string | null; // ISO timestamp
  createdAt?: string;      // ISO timestamp
}

export interface SloganAssignmentResult {
  sloganId: string;
  sloganText: string;
  sloganLanguage: 'ta' | 'en';
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

/**
 * 100 Approved THENIJOBS Master Slogans
 * 1 to 50: Tamil
 * 51 to 100: English
 */
export const MASTER_SLOGANS_LIBRARY: Omit<BillingSlogan, 'usageCount' | 'lastUsedAt' | 'createdAt'>[] = [
  // ── 50 TAMIL SLOGANS (1 to 50) ─────────────────────────────────────────────
  { id: 'slogan_1', sloganNumber: 1, text: 'ஒரு கட்டணம் — ஒரு புதிய வளர்ச்சி', language: 'ta', isActive: true },
  { id: 'slogan_2', sloganNumber: 2, text: 'இன்று பதிவு — நாளை வளர்ச்சி', language: 'ta', isActive: true },
  { id: 'slogan_3', sloganNumber: 3, text: 'உங்கள் வணிகம், உங்கள் வளர்ச்சி', language: 'ta', isActive: true },
  { id: 'slogan_4', sloganNumber: 4, text: 'ஒரு படி — வளர்ச்சியை நோக்கி', language: 'ta', isActive: true },
  { id: 'slogan_5', sloganNumber: 5, text: 'பதிவு செய்யுங்கள் — வளர்ந்து செல்லுங்கள்', language: 'ta', isActive: true },
  { id: 'slogan_6', sloganNumber: 6, text: 'உங்கள் வணிகம் இனி அனைவரின் பார்வையிலும்', language: 'ta', isActive: true },
  { id: 'slogan_7', sloganNumber: 7, text: 'வணிகத்தை பதிவு செய் — வாய்ப்புகளை பெருக்கு', language: 'ta', isActive: true },
  { id: 'slogan_8', sloganNumber: 8, text: 'உங்கள் வணிகத்திற்கு புதிய அடையாளம்', language: 'ta', isActive: true },
  { id: 'slogan_9', sloganNumber: 9, text: 'இன்று இணை — நாளை வளர', language: 'ta', isActive: true },
  { id: 'slogan_10', sloganNumber: 10, text: 'உங்கள் வளர்ச்சிக்கு முதல் படி', language: 'ta', isActive: true },
  { id: 'slogan_11', sloganNumber: 11, text: 'ஒரு பதிவு — பல வாய்ப்புகள்', language: 'ta', isActive: true },
  { id: 'slogan_12', sloganNumber: 12, text: 'உங்கள் வணிகத்தை உலகிற்கு அறிமுகப்படுத்துங்கள்', language: 'ta', isActive: true },
  { id: 'slogan_13', sloganNumber: 13, text: 'காணப்படுங்கள் — வளர்ச்சியடையுங்கள்', language: 'ta', isActive: true },
  { id: 'slogan_14', sloganNumber: 14, text: 'உங்கள் வணிகம், இனி ஒரு தேடலில்', language: 'ta', isActive: true },
  { id: 'slogan_15', sloganNumber: 15, text: 'வாடிக்கையாளர்கள் தேடும் இடத்தில் உங்கள் வணிகம்', language: 'ta', isActive: true },
  { id: 'slogan_16', sloganNumber: 16, text: 'உங்கள் சேவை — சரியான வாடிக்கையாளரிடம்', language: 'ta', isActive: true },
  { id: 'slogan_17', sloganNumber: 17, text: 'வணிகம் வளரட்டும் — வாய்ப்புகள் பெருகட்டும்', language: 'ta', isActive: true },
  { id: 'slogan_18', sloganNumber: 18, text: 'உங்கள் முயற்சிக்கு டிஜிட்டல் அடையாளம்', language: 'ta', isActive: true },
  { id: 'slogan_19', sloganNumber: 19, text: 'உங்கள் வணிகத்திற்கு புதிய வாயில்', language: 'ta', isActive: true },
  { id: 'slogan_20', sloganNumber: 20, text: 'ஒரு பதிவு — உங்கள் வணிகத்தின் புதிய தொடக்கம்', language: 'ta', isActive: true },
  { id: 'slogan_21', sloganNumber: 21, text: 'வணிகத்தை காட்டுங்கள் — வாய்ப்புகளை பெறுங்கள்', language: 'ta', isActive: true },
  { id: 'slogan_22', sloganNumber: 22, text: 'உங்கள் பெயர் தெரிந்தால், உங்கள் வணிகம் வளரும்', language: 'ta', isActive: true },
  { id: 'slogan_23', sloganNumber: 23, text: 'உங்கள் வணிகத்தை மறைத்து வைக்காதீர்கள்', language: 'ta', isActive: true },
  { id: 'slogan_24', sloganNumber: 24, text: 'தேடும் வாடிக்கையாளரிடம் சென்றடையுங்கள்', language: 'ta', isActive: true },
  { id: 'slogan_25', sloganNumber: 25, text: 'உங்கள் வணிகத்திற்கு சரியான பார்வை', language: 'ta', isActive: true },
  { id: 'slogan_26', sloganNumber: 26, text: 'உள்ளூர் வணிகம் — பெரிய வாய்ப்பு', language: 'ta', isActive: true },
  { id: 'slogan_27', sloganNumber: 27, text: 'உங்கள் ஊரிலிருந்து உங்கள் வளர்ச்சி', language: 'ta', isActive: true },
  { id: 'slogan_28', sloganNumber: 28, text: 'உங்கள் வணிகம், உங்கள் பகுதியில் முன்னிலையில்', language: 'ta', isActive: true },
  { id: 'slogan_29', sloganNumber: 29, text: 'வணிகத்தை இணைப்போம் — வாய்ப்புகளை உருவாக்குவோம்', language: 'ta', isActive: true },
  { id: 'slogan_30', sloganNumber: 30, text: 'உங்கள் வணிகத்திற்கு டிஜிட்டல் முகவரி', language: 'ta', isActive: true },
  { id: 'slogan_31', sloganNumber: 31, text: 'இன்று தெரியும் — நாளை நினைவில் நிற்கும்', language: 'ta', isActive: true },
  { id: 'slogan_32', sloganNumber: 32, text: 'உங்கள் வணிகத்தை மக்கள் தேடும் இடத்தில் வையுங்கள்', language: 'ta', isActive: true },
  { id: 'slogan_33', sloganNumber: 33, text: 'வாய்ப்புகள் இருக்கும் இடத்தில் உங்கள் வணிகமும் இருக்கட்டும்', language: 'ta', isActive: true },
  { id: 'slogan_34', sloganNumber: 34, text: 'உங்கள் வணிகத்தின் அடுத்த படி இங்கே', language: 'ta', isActive: true },
  { id: 'slogan_35', sloganNumber: 35, text: 'வளர நினைக்கும் வணிகத்திற்கு ஒரு புதிய தளம்', language: 'ta', isActive: true },
  { id: 'slogan_36', sloganNumber: 36, text: 'உங்கள் வணிகம் வளர, உங்கள் இருப்பு தெரிய வேண்டும்', language: 'ta', isActive: true },
  { id: 'slogan_37', sloganNumber: 37, text: 'பதிவு முதல் வளர்ச்சி வரை — ஒரே தளம்', language: 'ta', isActive: true },
  { id: 'slogan_38', sloganNumber: 38, text: 'வணிகத்திற்கு அடையாளம், வளர்ச்சிக்கு வாய்ப்பு', language: 'ta', isActive: true },
  { id: 'slogan_39', sloganNumber: 39, text: 'உங்கள் வணிகத்தை இன்னும் பலரிடம் கொண்டு செல்லுங்கள்', language: 'ta', isActive: true },
  { id: 'slogan_40', sloganNumber: 40, text: 'ஒரு சிறிய முயற்சி — பெரிய மாற்றத்திற்கு', language: 'ta', isActive: true },
  { id: 'slogan_41', sloganNumber: 41, text: 'உங்கள் வணிகத்திற்கு ஒரு புதிய வெளிச்சம்', language: 'ta', isActive: true },
  { id: 'slogan_42', sloganNumber: 42, text: 'வாடிக்கையாளரின் தேடலில் உங்கள் பெயரும் இருக்கட்டும்', language: 'ta', isActive: true },
  { id: 'slogan_43', sloganNumber: 43, text: 'உங்கள் உழைப்புக்கு அதிகமான பார்வை', language: 'ta', isActive: true },
  { id: 'slogan_44', sloganNumber: 44, text: 'உங்கள் வணிகம் வளர, முதலில் அது தெரிய வேண்டும்', language: 'ta', isActive: true },
  { id: 'slogan_45', sloganNumber: 45, text: 'உங்கள் வணிகத்தின் கதவை வாடிக்கையாளர்களுக்காக திறக்குங்கள்', language: 'ta', isActive: true },
  { id: 'slogan_46', sloganNumber: 46, text: 'இணையுங்கள் — தெரியுங்கள் — வளருங்கள்', language: 'ta', isActive: true },
  { id: 'slogan_47', sloganNumber: 47, text: 'உங்கள் வணிகத்திற்கு இன்று ஒரு புதிய தொடக்கம்', language: 'ta', isActive: true },
  { id: 'slogan_48', sloganNumber: 48, text: 'வணிகம் தொடங்கிய இடம் முக்கியமல்ல — சென்றடையும் இடம் முக்கியம்', language: 'ta', isActive: true },
  { id: 'slogan_49', sloganNumber: 49, text: 'உங்கள் வளர்ச்சிக்கான டிஜிட்டல் முதல் படி', language: 'ta', isActive: true },
  { id: 'slogan_50', sloganNumber: 50, text: 'THENIJOBS — உங்கள் வணிகம் தெரியும் இடம். வளர்ச்சி தொடங்கும் இடம்.', language: 'ta', isActive: true },

  // ── 50 ENGLISH SLOGANS (51 to 100) ─────────────────────────────────────────
  { id: 'slogan_51', sloganNumber: 51, text: 'Pay. Publish. Grow.', language: 'en', isActive: true },
  { id: 'slogan_52', sloganNumber: 52, text: 'Pay Once. Grow More.', language: 'en', isActive: true },
  { id: 'slogan_53', sloganNumber: 53, text: 'Your Payment. Your Growth.', language: 'en', isActive: true },
  { id: 'slogan_54', sloganNumber: 54, text: 'Pay Today. Grow Tomorrow.', language: 'en', isActive: true },
  { id: 'slogan_55', sloganNumber: 55, text: 'Invest. Publish. Grow.', language: 'en', isActive: true },
  { id: 'slogan_56', sloganNumber: 56, text: 'Pay. Promote. Prosper.', language: 'en', isActive: true },
  { id: 'slogan_57', sloganNumber: 57, text: 'One Payment. More Visibility.', language: 'en', isActive: true },
  { id: 'slogan_58', sloganNumber: 58, text: 'Pay. Get Listed. Get Seen.', language: 'en', isActive: true },
  { id: 'slogan_59', sloganNumber: 59, text: 'Pay. List. Grow.', language: 'en', isActive: true },
  { id: 'slogan_60', sloganNumber: 60, text: 'Your Business. Your Growth.', language: 'en', isActive: true },
  { id: 'slogan_61', sloganNumber: 61, text: 'One Payment. One Powerful Presence.', language: 'en', isActive: true },
  { id: 'slogan_62', sloganNumber: 62, text: 'Pay Smart. Grow Fast.', language: 'en', isActive: true },
  { id: 'slogan_63', sloganNumber: 63, text: 'Small Payment. Big Visibility.', language: 'en', isActive: true },
  { id: 'slogan_64', sloganNumber: 64, text: 'Pay Less. Reach More.', language: 'en', isActive: true },
  { id: 'slogan_65', sloganNumber: 65, text: 'Pay Once. Reach More Customers.', language: 'en', isActive: true },
  { id: 'slogan_66', sloganNumber: 66, text: 'Pay. Connect. Grow.', language: 'en', isActive: true },
  { id: 'slogan_67', sloganNumber: 67, text: 'Pay. Promote. Connect.', language: 'en', isActive: true },
  { id: 'slogan_68', sloganNumber: 68, text: 'Your Business Starts Here.', language: 'en', isActive: true },
  { id: 'slogan_69', sloganNumber: 69, text: 'Get Listed. Get Discovered.', language: 'en', isActive: true },
  { id: 'slogan_70', sloganNumber: 70, text: 'List Today. Grow Tomorrow.', language: 'en', isActive: true },
  { id: 'slogan_71', sloganNumber: 71, text: 'Be Seen. Be Found. Be Chosen.', language: 'en', isActive: true },
  { id: 'slogan_72', sloganNumber: 72, text: 'Put Your Business on the Map.', language: 'en', isActive: true },
  { id: 'slogan_73', sloganNumber: 73, text: 'Your Business Deserves Visibility.', language: 'en', isActive: true },
  { id: 'slogan_74', sloganNumber: 74, text: 'Make Your Business Discoverable.', language: 'en', isActive: true },
  { id: 'slogan_75', sloganNumber: 75, text: 'Turn Visibility into Growth.', language: 'en', isActive: true },
  { id: 'slogan_76', sloganNumber: 76, text: 'Get Visible. Get Business.', language: 'en', isActive: true },
  { id: 'slogan_77', sloganNumber: 77, text: 'One Listing. More Opportunities.', language: 'en', isActive: true },
  { id: 'slogan_78', sloganNumber: 78, text: 'One Payment. More Opportunities.', language: 'en', isActive: true },
  { id: 'slogan_79', sloganNumber: 79, text: 'Your Next Customer Starts Here.', language: 'en', isActive: true },
  { id: 'slogan_80', sloganNumber: 80, text: 'Connect Your Business to Customers.', language: 'en', isActive: true },
  { id: 'slogan_81', sloganNumber: 81, text: 'Business Visibility Made Simple.', language: 'en', isActive: true },
  { id: 'slogan_82', sloganNumber: 82, text: 'Simple Payment. Powerful Presence.', language: 'en', isActive: true },
  { id: 'slogan_83', sloganNumber: 83, text: 'Easy Pay. Easy Growth.', language: 'en', isActive: true },
  { id: 'slogan_84', sloganNumber: 84, text: 'Pay Easy. Grow Easy.', language: 'en', isActive: true },
  { id: 'slogan_85', sloganNumber: 85, text: 'List Smart. Grow Smart.', language: 'en', isActive: true },
  { id: 'slogan_86', sloganNumber: 86, text: 'Promote Smart. Grow Strong.', language: 'en', isActive: true },
  { id: 'slogan_87', sloganNumber: 87, text: 'Your Digital Business Presence Starts Here.', language: 'en', isActive: true },
  { id: 'slogan_88', sloganNumber: 88, text: 'From Payment to Presence.', language: 'en', isActive: true },
  { id: 'slogan_89', sloganNumber: 89, text: 'From Listing to Growth.', language: 'en', isActive: true },
  { id: 'slogan_90', sloganNumber: 90, text: 'Pay Today. Get Discovered Tomorrow.', language: 'en', isActive: true },
  { id: 'slogan_91', sloganNumber: 91, text: 'Your Business. One Click Away.', language: 'en', isActive: true },
  { id: 'slogan_92', sloganNumber: 92, text: 'More Visibility. More Opportunities.', language: 'en', isActive: true },
  { id: 'slogan_93', sloganNumber: 93, text: 'More Reach. More Growth.', language: 'en', isActive: true },
  { id: 'slogan_94', sloganNumber: 94, text: 'Be Online. Be Discoverable.', language: 'en', isActive: true },
  { id: 'slogan_95', sloganNumber: 95, text: 'Your Local Business, Digitally Connected.', language: 'en', isActive: true },
  { id: 'slogan_96', sloganNumber: 96, text: 'Bring Your Business Closer to Customers.', language: 'en', isActive: true },
  { id: 'slogan_97', sloganNumber: 97, text: 'Make Your Business Visible.', language: 'en', isActive: true },
  { id: 'slogan_98', sloganNumber: 98, text: 'One Payment. One Step Forward.', language: 'en', isActive: true },
  { id: 'slogan_99', sloganNumber: 99, text: 'Your Growth. Our Platform.', language: 'en', isActive: true },
  { id: 'slogan_100', sloganNumber: 100, text: 'THENIJOBS — Pay. Publish. Grow.', language: 'en', isActive: true },
];

/**
 * Deterministic hash function for fallback / offline generation.
 * Guarantees that the same seed (e.g. invoice/order ID) ALWAYS produces the exact same slogan.
 */
export function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a stable deterministic slogan for a given seed (e.g. Order ID, Invoice No).
 * Used when an invoice does not yet have a stored slogan or during offline previews.
 */
export function getDeterministicBillingSlogan(seed?: string, preferredLanguage?: 'ta' | 'en'): SloganAssignmentResult {
  const seedStr = seed || `seed_${Date.now()}`;
  const hash = hashStringToNumber(seedStr);

  let pool = MASTER_SLOGANS_LIBRARY;
  if (preferredLanguage) {
    pool = MASTER_SLOGANS_LIBRARY.filter(s => s.language === preferredLanguage);
  }

  const slogan = pool[hash % pool.length];
  const cycle = Math.floor(hash / pool.length) + 1;

  return {
    sloganId: slogan.id,
    sloganText: slogan.text,
    sloganLanguage: slogan.language,
    sloganCycle: cycle,
    sloganAssignedAt: new Date().toISOString(),
  };
}
