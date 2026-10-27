/**
 * THENIJOBS Village Ambassador & Partner Network
 * Monthly Earning Estimator — Authoritative Multi-Tier Commission Logic
 *
 * Covers ALL 4 official THENIJOBS employer subscription plans + Micro-Upsell Badges:
 * - Basic Plan: ₹999/yr -> ₹150 commission (~15.0%)
 * - Standard Plan: ₹1,800/yr -> ₹350 commission (~19.4%)
 * - Premium Plan: ₹3,500/yr -> ₹700 commission (20.0%)
 * - Enterprise Plan: ₹5,000/yr -> ₹1,000 commission (20.0%)
 * - Urgent 48h Spotlight Badge: ₹99/₹149 -> ₹35 commission
 */

export const AMBASSADOR_COMMISSIONS = {
  basic: 150,
  standard: 350,
  premium: 700,
  enterprise: 1000,
};

export const ALL_VALID_PLAN_PRICES = {
  basic: 999,
  standard: 1800,
  premium: 3500,
  enterprise: 5000,
};

export type PlanTierId = 'basic' | 'standard' | 'premium' | 'enterprise';

export interface PlanTierData {
  id: PlanTierId;
  name: string;
  nameTa: string;
  price: number;
  priceFormatted: string;
  commission: number;
  commissionFormatted: string;
  commissionPercentage: number;
  targetBiz: string;
  targetBizTa: string;
  defaultVal: number;
  maxVal: number;
  sliderAccent: string;
  badgeColor: string;
}

export const SPOTLIGHT_BADGE_COMMISSION = 35;
export const SPOTLIGHT_BADGE_PRICE = 99; // Base spotlight price

export const EARNING_TIERS_DATA: PlanTierData[] = [
  {
    id: 'basic',
    name: 'Basic Plans (₹999/yr)',
    nameTa: 'அடிப்படை திட்டம் (₹999/ஆண்டு)',
    price: ALL_VALID_PLAN_PRICES.basic || 999,
    priceFormatted: '₹999/yr',
    commission: AMBASSADOR_COMMISSIONS.basic || 150,
    commissionFormatted: '₹150/shop',
    commissionPercentage: Math.round(((AMBASSADOR_COMMISSIONS.basic || 150) / 999) * 100),
    targetBiz: 'Small Groceries, Tea Stalls, Salons & Solo Shops',
    targetBizTa: 'மளிகை, டீக்கடை, சலூன் & சிறு வணிகங்கள்',
    defaultVal: 5,
    maxVal: 25,
    sliderAccent: 'accent-sky-400',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
  },
  {
    id: 'standard',
    name: 'Standard Plans (₹1,800/yr)',
    nameTa: 'ஸ்டாண்டர்ட் திட்டம் (₹1,800/ஆண்டு)',
    price: ALL_VALID_PLAN_PRICES.standard || 1800,
    priceFormatted: '₹1,800/yr',
    commission: AMBASSADOR_COMMISSIONS.standard || 350,
    commissionFormatted: '₹350/shop',
    commissionPercentage: Math.round(((AMBASSADOR_COMMISSIONS.standard || 350) / 1800) * 100),
    targetBiz: 'Retail Stores, Textile Showrooms, Clinics & Cafes',
    targetBizTa: 'துணிக்கடைகள், உணவகங்கள், கிளினிக்குகள்',
    defaultVal: 6,
    maxVal: 25,
    sliderAccent: 'accent-emerald-400',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  },
  {
    id: 'premium',
    name: 'Premium Plans (₹3,500/yr)',
    nameTa: 'பிரீமியம் திட்டம் (₹3,500/ஆண்டு)',
    price: ALL_VALID_PLAN_PRICES.premium || 3500,
    priceFormatted: '₹3,500/yr',
    commission: AMBASSADOR_COMMISSIONS.premium || 700,
    commissionFormatted: '₹700/shop',
    commissionPercentage: Math.round(((AMBASSADOR_COMMISSIONS.premium || 700) / 3500) * 100),
    targetBiz: 'Supermarkets, Wholesale Spices & Multi-branch Retailers',
    targetBizTa: 'சூப்பர் மார்க்கெட், மொத்த ஏலக்காய் & வணிக நிறுவனங்கள்',
    defaultVal: 4,
    maxVal: 20,
    sliderAccent: 'accent-amber-400',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plans (₹5,000/yr)',
    nameTa: 'என்டர்பிரைஸ் திட்டம் (₹5,000/ஆண்டு)',
    price: ALL_VALID_PLAN_PRICES.enterprise || 5000,
    priceFormatted: '₹5,000/yr',
    commission: AMBASSADOR_COMMISSIONS.enterprise || 1000,
    commissionFormatted: '₹1,000/shop',
    commissionPercentage: Math.round(((AMBASSADOR_COMMISSIONS.enterprise || 1000) / 5000) * 100),
    targetBiz: 'Agro Mills, Cardamom Exporters, Hospitals & Factories',
    targetBizTa: 'பெரிய ஆலைகள், மருத்துவமனைகள் & ஏற்றுமதி நிறுவனங்கள்',
    defaultVal: 2,
    maxVal: 15,
    sliderAccent: 'accent-purple-400',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  },
];

export type PresetKey = 'part_time' | 'active' | 'superstar' | 'reset';

export interface PlanCounts {
  basic: number;
  standard: number;
  premium: number;
  enterprise: number;
  spotlight?: number;
}

export interface PresetModel {
  label: string;
  labelTa: string;
  badge: string;
  counts: PlanCounts;
  hoursPerWeek: string;
}

export const PRESET_MODELS: Record<PresetKey, PresetModel> = {
  part_time: {
    label: 'Part-Time',
    labelTa: 'பகுதி நேரம்',
    badge: '1 hr/day',
    counts: { basic: 4, standard: 4, premium: 3, enterprise: 0, spotlight: 4 },
    hoursPerWeek: '5-7 hours / week',
  },
  active: {
    label: 'Active Ambassador',
    labelTa: 'முழு நேரம்',
    badge: 'Recommended',
    counts: { basic: 5, standard: 6, premium: 4, enterprise: 2, spotlight: 10 },
    hoursPerWeek: '12-15 hours / week',
  },
  superstar: {
    label: 'Town Champion',
    labelTa: 'தாலுகா தலைவர்',
    badge: 'Pro Networker',
    counts: { basic: 10, standard: 12, premium: 8, enterprise: 4, spotlight: 20 },
    hoursPerWeek: '20+ hours / week',
  },
  reset: {
    label: 'Reset',
    labelTa: 'பூஜ்ஜியம்',
    badge: '0 shops',
    counts: { basic: 0, standard: 0, premium: 0, enterprise: 0, spotlight: 0 },
    hoursPerWeek: '0 hours',
  },
};

/**
 * Calculates itemized breakdown and totals for a given count configuration
 */
export function calculateEstimates(counts: PlanCounts, includeSpotlight: boolean = true) {
  const basicCount = Math.max(0, counts.basic || 0);
  const standardCount = Math.max(0, counts.standard || 0);
  const premiumCount = Math.max(0, counts.premium || 0);
  const enterpriseCount = Math.max(0, counts.enterprise || 0);
  const spotlightCount = includeSpotlight ? Math.max(0, counts.spotlight || 0) : 0;

  const basicRate = AMBASSADOR_COMMISSIONS.basic || 150;
  const standardRate = AMBASSADOR_COMMISSIONS.standard || 350;
  const premiumRate = AMBASSADOR_COMMISSIONS.premium || 700;
  const enterpriseRate = AMBASSADOR_COMMISSIONS.enterprise || 1000;
  const spotlightRate = SPOTLIGHT_BADGE_COMMISSION;

  const basicSubtotal = basicCount * basicRate;
  const standardSubtotal = standardCount * standardRate;
  const premiumSubtotal = premiumCount * premiumRate;
  const enterpriseSubtotal = enterpriseCount * enterpriseRate;
  const spotlightSubtotal = spotlightCount * spotlightRate;

  const shopCommissionTotal = basicSubtotal + standardSubtotal + premiumSubtotal + enterpriseSubtotal;
  const totalMonthlyIncome = shopCommissionTotal + spotlightSubtotal;
  const totalAnnualProjected = totalMonthlyIncome * 12;
  const totalShops = basicCount + standardCount + premiumCount + enterpriseCount;

  return {
    counts: {
      basic: basicCount,
      standard: standardCount,
      premium: premiumCount,
      enterprise: enterpriseCount,
      spotlight: spotlightCount,
    },
    rates: {
      basic: basicRate,
      standard: standardRate,
      premium: premiumRate,
      enterprise: enterpriseRate,
      spotlight: spotlightRate,
    },
    subtotals: {
      basic: basicSubtotal,
      standard: standardSubtotal,
      premium: premiumSubtotal,
      enterprise: enterpriseSubtotal,
      spotlight: spotlightSubtotal,
    },
    shopCommissionTotal,
    totalMonthlyIncome,
    totalAnnualProjected,
    totalShops,
    effortPace: getEffortPace(totalShops),
  };
}

/**
 * Effort pace estimation based on shop count
 */
export function getEffortPace(totalShops: number): {
  pace: string;
  paceTa: string;
  hours: string;
  color: string;
} {
  if (totalShops <= 0) {
    return {
      pace: 'Get started by sharing your link with 1 shop today',
      paceTa: 'இன்றே ஒரு கடைக்கு உங்கள் இணைப்பைப் பகிருங்கள்',
      hours: '0 hrs/week',
      color: 'text-slate-400',
    };
  }
  if (totalShops <= 6) {
    return {
      pace: 'Casual Part-Time (approx. ~1-2 shops/week)',
      paceTa: 'பகுதி நேரம் (~வாரம் 1-2 கடைகள்)',
      hours: '3-5 hrs/week',
      color: 'text-sky-400',
    };
  }
  if (totalShops <= 15) {
    return {
      pace: 'Steady Part-Time (approx. ~3-4 shops/week)',
      paceTa: 'நிலையான பகுதி நேரம் (~வாரம் 3-4 கடைகள்)',
      hours: '6-8 hrs/week',
      color: 'text-emerald-400',
    };
  }
  if (totalShops <= 25) {
    return {
      pace: 'Active Full-Time (approx. ~1 shop/day)',
      paceTa: 'சுறுசுறுப்பான முழு நேரம் (~தினமும் 1 கடை)',
      hours: '12-15 hrs/week',
      color: 'text-amber-400',
    };
  }
  return {
    pace: 'Taluk Champion / Top Performer (2+ shops/day)',
    paceTa: 'தாலுகா சாதனையாளர் (தினமும் 2+ கடைகள்)',
    hours: '20+ hrs/week',
    color: 'text-purple-400',
  };
}

/**
 * Currency formatter with Indian numbering system
 */
export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}
