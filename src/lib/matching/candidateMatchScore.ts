// ============================================================
// THENIJOBS — Candidate Match & Proximity Scoring Engine
// Feature 2.4: தகுதியான ஆட்கள் AI தரவரிசை
// ============================================================

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

/**
 * Centroid coordinates for Theni district taluks, popular towns,
 * and key surrounding Tamil Nadu employment hubs.
 */
export const TAMILNADU_TOWN_COORDINATES: Record<string, LocationCoordinates> = {
  // 7 Theni Taluks & Major Towns
  theni: { lat: 10.0104, lng: 77.4768 },
  allinagaram: { lat: 10.0150, lng: 77.4820 },
  veerapandi: { lat: 9.9610, lng: 77.4420 },
  periyakulam: { lat: 10.1202, lng: 77.5458 },
  vadugapatti: { lat: 10.1430, lng: 77.5620 },
  devadanapatti: { lat: 10.1700, lng: 77.6200 },
  bodinayakanur: { lat: 10.0104, lng: 77.3486 },
  bodi: { lat: 10.0104, lng: 77.3486 },
  kurangani: { lat: 10.0800, lng: 77.2500 },
  cumbum: { lat: 9.7346, lng: 77.2811 },
  gudalur: { lat: 9.6790, lng: 77.2530 },
  kamayagoundanpatti: { lat: 9.7420, lng: 77.2910 },
  chinnamanur: { lat: 9.8407, lng: 77.3828 },
  markayankottai: { lat: 9.8650, lng: 77.3680 },
  uthamapalayam: { lat: 9.8058, lng: 77.3308 },
  kombai: { lat: 9.8370, lng: 77.3190 },
  pannaipuram: { lat: 9.8250, lng: 77.2880 },
  andipatti: { lat: 9.9995, lng: 77.6253 },
  kadamalaikundu: { lat: 9.8500, lng: 77.5800 },
  myladumparai: { lat: 9.8200, lng: 77.6300 },

  // Surrounding Districts & Key Centers
  batlagundu: { lat: 10.1600, lng: 77.7600 },
  usilampatti: { lat: 9.9678, lng: 77.7952 },
  kodaikanal: { lat: 10.2381, lng: 77.4892 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  dindigul: { lat: 10.3673, lng: 77.9803 },
  tiruppur: { lat: 11.1085, lng: 77.3411 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  salem: { lat: 11.6643, lng: 78.1460 },
  virudhunagar: { lat: 9.5872, lng: 77.9515 },
  tirunelveli: { lat: 8.7139, lng: 77.7567 },
  chennai: { lat: 13.0827, lng: 80.2707 },
};

/**
 * Standardizes town / locality string for dictionary lookup.
 */
export function normalizeTownName(raw?: string): string {
  if (!raw) return '';
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  
  // Match more specific town names before generic district name
  const sortedKeys = Object.keys(TAMILNADU_TOWN_COORDINATES).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (key === 'theni') continue;
    if (cleaned.includes(key)) {
      return key;
    }
  }
  if (cleaned.includes('theni')) {
    return 'theni';
  }
  return cleaned.split(/\s+/)[0] || '';
}

/**
 * Calculates Haversine spherical distance between two points in kilometers.
 */
export function haversineDistanceKm(
  coord1: LocationCoordinates,
  coord2: LocationCoordinates
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Rounded to 1 decimal place
}

/**
 * Computes distance in km between two location descriptions (or coordinate objects).
 */
export function calculateDistanceKm(
  jobLocationRaw?: string | LocationCoordinates,
  candidateLocationRaw?: string | LocationCoordinates
): {
  distanceKm: number;
  isSameTown: boolean;
  resolvedJobLocation: string;
  resolvedCandidateLocation: string;
} {
  // If coordinates directly provided
  if (
    typeof jobLocationRaw === 'object' &&
    typeof candidateLocationRaw === 'object' &&
    jobLocationRaw &&
    candidateLocationRaw &&
    'lat' in jobLocationRaw &&
    'lat' in candidateLocationRaw
  ) {
    const d = haversineDistanceKm(jobLocationRaw, candidateLocationRaw);
    return {
      distanceKm: d,
      isSameTown: d <= 2.5,
      resolvedJobLocation: 'GPS Coordinates',
      resolvedCandidateLocation: 'GPS Coordinates',
    };
  }

  const jobLocStr = typeof jobLocationRaw === 'string' ? jobLocationRaw : 'Theni';
  const candLocStr = typeof candidateLocationRaw === 'string' ? candidateLocationRaw : 'Theni';

  const jobTown = normalizeTownName(jobLocStr) || 'theni';
  const candTown = normalizeTownName(candLocStr) || 'theni';

  // Exact same locality/town text
  if (jobTown === candTown && jobTown.length > 0) {
    return {
      distanceKm: 1.5, // Representative hyper-local walking/biking distance
      isSameTown: true,
      resolvedJobLocation: jobLocStr,
      resolvedCandidateLocation: candLocStr,
    };
  }

  const coordJob = TAMILNADU_TOWN_COORDINATES[jobTown];
  const coordCand = TAMILNADU_TOWN_COORDINATES[candTown];

  if (coordJob && coordCand) {
    const d = haversineDistanceKm(coordJob, coordCand);
    return {
      distanceKm: d,
      isSameTown: d <= 5.0,
      resolvedJobLocation: jobTown,
      resolvedCandidateLocation: candTown,
    };
  }

  // Fallback heuristic: If both are within Theni district
  const isJobTheni = jobLocStr.toLowerCase().includes('theni') || !jobLocStr;
  const isCandTheni = candLocStr.toLowerCase().includes('theni') || !candLocStr;

  if (isJobTheni && isCandTheni) {
    return {
      distanceKm: 4.8, // Within district average, treated as local <= 5km
      isSameTown: true,
      resolvedJobLocation: jobLocStr,
      resolvedCandidateLocation: candLocStr,
    };
  }

  // Different districts or outside Theni
  return {
    distanceKm: 65.0,
    isSameTown: false,
    resolvedJobLocation: jobLocStr,
    resolvedCandidateLocation: candLocStr,
  };
}

// ===== SKILL ALIAS & CLUSTER DICTIONARY =====
const SKILL_CLUSTERS: Record<string, string[]> = {
  tally: ['tally', 'tally prime', 'tally erp', 'gst', 'gst filing', 'accounts', 'accounting', 'billing', 'bookkeeping', 'ms excel', 'excel', 'finance'],
  driving: ['driving', 'driving license', 'driver', 'heavy vehicle', 'two wheeler', 'two-wheeler driving license', 'commercial driving', 'delivery', 'lmv', 'hmv', 'van driver', 'auto driver'],
  nursing: ['nursing', 'nurse', 'gnm', 'bsc nursing', 'anm', 'hospital', 'patient care', 'medical', 'clinic', 'healthcare', 'paramedical', 'staff nurse', 'pharmacist', 'lab technician'],
  sales: ['sales', 'marketing', 'retail', 'customer service', 'counter sales', 'field sales', 'cashier', 'store incharge', 'business development'],
  computer: ['computer', 'typing', 'ms office', 'data entry', 'computer operator', 'office admin', 'receptionist', 'back office'],
  software: ['software', 'python', 'javascript', 'react', 'typescript', 'next.js', 'sql', 'html', 'css', 'web developer', 'frontend', 'backend', 'full stack'],
  electrical: ['electrical', 'electrician', 'wiring', 'iti', 'motor rewinding', 'maintenance', 'electronic'],
  mechanical: ['mechanical', 'mechanic', 'iti', 'fitter', 'welder', 'machinist', 'autocad'],
  teaching: ['teaching', 'teacher', 'faculty', 'tutor', 'trainer', 'school teacher', 'professor', 'lecturer'],
};

/**
 * Normalizes skill string by removing punctuation and casing.
 */
export function normalizeSkill(skill: string): string {
  return skill
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determines whether candidate skill matches required skill or skill cluster.
 */
export function doesSkillMatch(candidateSkill: string, targetSkill: string): boolean {
  const normCand = normalizeSkill(candidateSkill);
  const normTarget = normalizeSkill(targetSkill);

  if (!normCand || !normTarget) return false;

  // Exact or substring match
  if (normCand === normTarget || normCand.includes(normTarget) || normTarget.includes(normCand)) {
    return true;
  }

  // Check cluster membership
  for (const cluster of Object.values(SKILL_CLUSTERS)) {
    const candInCluster = cluster.some(w => normCand.includes(w) || w.includes(normCand));
    const targetInCluster = cluster.some(w => normTarget.includes(w) || w.includes(normTarget));
    if (candInCluster && targetInCluster) {
      return true;
    }
  }

  return false;
}

export interface CandidateMatchBreakdown {
  proximity: {
    score: number; // 0 to 30
    distanceKm: number;
    isWithin5km: boolean;
    label: string;
    tamilLabel: string;
  };
  skills: {
    score: number; // 0 to 40
    matchedSkills: string[];
    missingSkills: string[];
    matchPercentage: number;
    label: string;
    tamilLabel: string;
  };
  availability: {
    score: number; // 0 to 30
    isImmediate: boolean;
    noticePeriod: string;
    label: string;
    tamilLabel: string;
  };
  // Convenience top-level accessors
  distanceKm?: number;
  matchedSkills?: string[];
  immediateJoiner?: {
    score: number;
    isImmediate: boolean;
  };
  totalScore: number; // 0 to 100
  tier: 'exceptional' | 'high' | 'moderate' | 'low';
  tierLabel: string;
  tierTamilLabel: string;
  recommendation: string;
  recommendationTamil: string;
}

export interface MatchCandidateInput {
  id?: string;
  name?: string;
  phone?: string;
  skills?: string[];
  district?: string;
  taluk?: string;
  location?: string;
  noticePeriod?: string;
  immediateJoiner?: boolean;
  availableFrom?: string;
  experienceYears?: number | string;
  qualification?: string;
  currentRole?: string;
  summary?: string;
  seekerName?: string;
  [key: string]: any;
}

export interface MatchJobInput {
  title?: string;
  skills?: string[];
  location?: string;
  taluk?: string;
  district?: string;
  description?: string;
  requirements?: string[];
  [key: string]: any;
}

/**
 * Extracts key domain skills from job title or description if explicit job.skills is empty.
 */
export function extractSkillsFromJob(job: MatchJobInput): string[] {
  if (job.skills && job.skills.length > 0) {
    return job.skills.map(s => String(s).trim()).filter(Boolean);
  }

  const detected: string[] = [];
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

  if (text.includes('tally') || text.includes('account') || text.includes('gst')) detected.push('Tally');
  if (text.includes('driving') || text.includes('driver')) detected.push('Driving License');
  if (text.includes('nurs') || text.includes('medical') || text.includes('hospital')) detected.push('Nursing');
  if (text.includes('sales') || text.includes('marketing')) detected.push('Sales & Marketing');
  if (text.includes('electric')) detected.push('Electrical Wiring');
  if (text.includes('comput') || text.includes('typing') || text.includes('excel')) detected.push('Computer Operations');
  if (text.includes('software') || text.includes('developer') || text.includes('react')) detected.push('Software Development');
  if (text.includes('teach') || text.includes('faculty')) detected.push('Teaching');

  if (detected.length === 0 && job.title) {
    detected.push(job.title);
  }

  return detected;
}

/**
 * Aggregates candidate skill pool from skills array, qualification, role, and summary.
 */
export function extractSkillsFromCandidate(candidate: MatchCandidateInput): string[] {
  const pool = new Set<string>();

  if (Array.isArray(candidate.skills)) {
    candidate.skills.forEach(s => {
      if (typeof s === 'string' && s.trim()) pool.add(s.trim());
    });
  }

  const text = `${candidate.qualification || ''} ${candidate.currentRole || ''} ${candidate.summary || ''}`.toLowerCase();
  if (text.includes('tally') || text.includes('b.com') || text.includes('gst')) pool.add('Tally');
  if (text.includes('driving') || text.includes('license') || text.includes('driver')) pool.add('Driving License');
  if (text.includes('nurs') || text.includes('gnm') || text.includes('b.sc nursing')) pool.add('Nursing');
  if (text.includes('sales') || text.includes('marketing') || text.includes('retail')) pool.add('Sales & Marketing');
  if (text.includes('electric') || text.includes('iti electrical')) pool.add('Electrical');
  if (text.includes('computer') || text.includes('ms office') || text.includes('excel')) pool.add('MS Excel');

  return Array.from(pool);
}

/**
 * Computes AI Match and Proximity Score according to Feature 2.4 rules:
 * - Proximity from job location (within 5 km = +30 pts)
 * - Relevant skill match (Tally, Driving License, Nursing = +40 pts)
 * - Availability for immediate joining (+30 pts)
 * Total Score: 0 to 100 points
 */
export function computeCandidateMatchScore(
  candidate: MatchCandidateInput,
  job: MatchJobInput = {}
): CandidateMatchBreakdown {
  // 1. PROXIMITY SCORE (0 - 30 Points)
  // Distance from job location (within 5 km = +30 pts)
  const jobLoc = job.location || job.district || 'Theni';
  const candLoc = candidate.taluk || candidate.location || candidate.district || 'Theni';
  const { distanceKm, isSameTown } = calculateDistanceKm(jobLoc, candLoc);

  let proximityScore = 0;
  let proximityLabel = '';
  let proximityTamilLabel = '';

  if (distanceKm <= 5.0 || isSameTown) {
    proximityScore = 30; // Rule: within 5 km = +30 pts
    proximityLabel = `Within 5 km (${distanceKm} km) • +30 pts`;
    proximityTamilLabel = `5 கி.மீ எல்லைக்குள் (${distanceKm} கிமீ) • +30 மதிப்பெண்`;
  } else if (distanceKm <= 15.0) {
    proximityScore = 20;
    proximityLabel = `Nearby Taluk (~${distanceKm} km) • +20 pts`;
    proximityTamilLabel = `அருகாமை வட்டம் (~${distanceKm} கிமீ) • +20 மதிப்பெண்`;
  } else if (distanceKm <= 45.0) {
    proximityScore = 10;
    proximityLabel = `Same District (~${distanceKm} km) • +10 pts`;
    proximityTamilLabel = `மாவட்ட எல்லைக்குள் (~${distanceKm} கிமீ) • +10 மதிப்பெண்`;
  } else {
    proximityScore = 0;
    proximityLabel = `Distant (~${distanceKm} km) • +0 pts`;
    proximityTamilLabel = `வெளி மாவட்டம் (~${distanceKm} கிமீ) • 0 மதிப்பெண்`;
  }

  // 2. RELEVANT SKILL MATCH SCORE (0 - 40 Points)
  // Rule: Relevant skill match (Tally, Driving License, Nursing, etc. = +40 pts)
  const requiredSkills = extractSkillsFromJob(job);
  const candidateSkills = extractSkillsFromCandidate(candidate);

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  if (requiredSkills.length === 0) {
    // If no specific skills required by job, check general trade match
    matchedSkills.push(...candidateSkills.slice(0, 3));
  } else {
    requiredSkills.forEach(req => {
      const isMatched = candidateSkills.some(cand => doesSkillMatch(cand, req));
      if (isMatched) {
        matchedSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    });
  }

  const totalReq = requiredSkills.length || 1;
  const matchRatio = requiredSkills.length === 0 ? 1 : matchedSkills.length / totalReq;
  let skillScore = 0;

  if (matchRatio >= 1.0) {
    skillScore = 40; // Full 100% skill match = +40 pts
  } else if (matchRatio >= 0.75) {
    skillScore = 32;
  } else if (matchRatio >= 0.5) {
    skillScore = 24;
  } else if (matchRatio >= 0.25 || matchedSkills.length > 0) {
    skillScore = 15;
  } else {
    skillScore = 0;
  }

  const matchPercentage = Math.round(matchRatio * 100);
  const skillLabel = `${matchedSkills.length}/${totalReq} Skills Matched (${matchPercentage}%) • +${skillScore} pts`;
  const skillTamilLabel = `${matchedSkills.length}/${totalReq} திறன்கள் பொருந்துகின்றன (${matchPercentage}%) • +${skillScore} மதிப்பெண்`;

  // 3. AVAILABILITY FOR IMMEDIATE JOINING (0 - 30 Points)
  // Rule: Availability for immediate joining (+30 pts)
  const noticePeriodStr = (candidate.noticePeriod || '').toLowerCase().trim();
  const isImmediate =
    candidate.immediateJoiner === true ||
    /\bimmediate\b/i.test(noticePeriodStr) ||
    /\bavailable now\b/i.test(noticePeriodStr) ||
    /\b0\s*days?\b/i.test(noticePeriodStr) ||
    /\bready to join\b/i.test(noticePeriodStr) ||
    (!candidate.noticePeriod && !candidate.experienceYears); // Freshers / unspecified default to immediate

  let availabilityScore = 0;
  let availabilityLabel = '';
  let availabilityTamilLabel = '';

  if (isImmediate) {
    availabilityScore = 30; // Rule: immediate joining = +30 pts
    availabilityLabel = 'Immediate Joining Available • +30 pts';
    availabilityTamilLabel = 'உடனடியாக பணியில் சேர தயார் • +30 மதிப்பெண்';
  } else if (/\b15\s*days?\b/i.test(noticePeriodStr)) {
    availabilityScore = 15;
    availabilityLabel = '15 Days Notice Period • +15 pts';
    availabilityTamilLabel = '15 நாட்கள் நோட்டீஸ் காலம் • +15 மதிப்பெண்';
  } else if (/\b(1\s*month|30\s*days?)\b/i.test(noticePeriodStr)) {
    availabilityScore = 5;
    availabilityLabel = '1 Month Notice Period • +5 pts';
    availabilityTamilLabel = '1 மாத நோட்டீஸ் காலம் • +5 மதிப்பெண்';
  } else {
    availabilityScore = 0;
    availabilityLabel = 'Serving Notice / 2+ Months • +0 pts';
    availabilityTamilLabel = '2+ மாதங்கள் அல்லது காத்திருப்பு • 0 மதிப்பெண்';
  }

  // TOTAL COMPOSITE SCORE (0 - 100)
  const totalScore = Math.min(100, Math.max(0, proximityScore + skillScore + availabilityScore));

  let tier: 'exceptional' | 'high' | 'moderate' | 'low' = 'low';
  let tierLabel = 'Needs Review';
  let tierTamilLabel = 'குறைந்த பொருத்தம்';
  let recommendation = '';
  let recommendationTamil = '';

  if (totalScore >= 90) {
    tier = 'exceptional';
    tierLabel = 'Best Fit Candidate (90%+)';
    tierTamilLabel = 'தகுதியான ஆள் • Best Fit';
    recommendation = `🌟 Highly Recommended: Candidate resides within ${distanceKm} km (local), possesses ${matchedSkills.length ? matchedSkills.join(', ') : 'all required'} skills, and is available for immediate joining.`;
    recommendationTamil = `🌟 முன்னுரிமை பரிந்துரை: விண்ணப்பதாரர் ${distanceKm} கிமீ எல்லைக்குள் உள்ளூர்வாசி, தேவையான திறன்கள் (${matchedSkills.join(', ') || 'முழுமை'}) பொருந்துகிறது, உடனடியாக பணியில் சேர தயார்.`;
  } else if (totalScore >= 75) {
    tier = 'high';
    tierLabel = 'High Match (75-89%)';
    tierTamilLabel = 'நல்ல பொருத்தம் (75-89%)';
    recommendation = `Strong Candidate: High qualification fit (${matchPercentage}% skills) with good proximity and availability. Recommended for interview.`;
    recommendationTamil = `நல்ல தகுதி: திறன்கள் மற்றும் இருப்பிடம் சிறப்பாக பொருந்துகிறது. நேர்காணலுக்கு அழைக்கலாம்.`;
  } else if (totalScore >= 50) {
    tier = 'moderate';
    tierLabel = 'Moderate Match (50-74%)';
    tierTamilLabel = 'மிதமான பொருத்தம் (50-74%)';
    recommendation = `Moderate Candidate: Partial skill match or moderate commute distance. Consider review if primary candidates unavailable.`;
    recommendationTamil = `மிதமான தகுதி: குறிப்பிட்ட திறன்கள் அல்லது தூரம் பரிசீலனைக்குரியது.`;
  } else {
    tier = 'low';
    tierLabel = 'Low Match (<50%)';
    tierTamilLabel = 'குறைந்த பொருத்தம் (<50%)';
    recommendation = `Candidate has low skill correlation or exceeds standard commute radius.`;
    recommendationTamil = `பொருத்தம் குறைவு: திறன்கள் அல்லது பயண தூரம் கூடுதலாக உள்ளது.`;
  }

  return {
    proximity: {
      score: proximityScore,
      distanceKm,
      isWithin5km: distanceKm <= 5.0 || isSameTown,
      label: proximityLabel,
      tamilLabel: proximityTamilLabel,
    },
    skills: {
      score: skillScore,
      matchedSkills,
      missingSkills,
      matchPercentage,
      label: skillLabel,
      tamilLabel: skillTamilLabel,
    },
    availability: {
      score: availabilityScore,
      isImmediate,
      noticePeriod: candidate.noticePeriod || (isImmediate ? 'Immediate' : 'Standard'),
      label: availabilityLabel,
      tamilLabel: availabilityTamilLabel,
    },
    distanceKm,
    matchedSkills,
    immediateJoiner: {
      score: availabilityScore,
      isImmediate,
    },
    totalScore,
    tier,
    tierLabel,
    tierTamilLabel,
    recommendation,
    recommendationTamil,
  };
}
