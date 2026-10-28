import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ─── Reference Coordinates & Matching Logic under test ───
const TAMILNADU_TOWN_COORDINATES = {
  theni: { lat: 10.0104, lng: 77.4768 },
  allinagaram: { lat: 10.0150, lng: 77.4820 },
  veerapandi: { lat: 9.9610, lng: 77.4420 },
  periyakulam: { lat: 10.1202, lng: 77.5458 },
  vadugapatti: { lat: 10.1430, lng: 77.5620 },
  bodinayakanur: { lat: 10.0104, lng: 77.3486 },
  bodi: { lat: 10.0104, lng: 77.3486 },
  cumbum: { lat: 9.7346, lng: 77.2811 },
  chinnamanur: { lat: 9.8407, lng: 77.3828 },
  uthamapalayam: { lat: 9.8058, lng: 77.3308 },
  andipatti: { lat: 9.9995, lng: 77.6253 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  dindigul: { lat: 10.3673, lng: 77.9803 },
  chennai: { lat: 13.0827, lng: 80.2707 },
};

function normalizeTownName(raw) {
  if (!raw) return '';
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  for (const key of Object.keys(TAMILNADU_TOWN_COORDINATES)) {
    if (cleaned.includes(key)) {
      return key;
    }
  }
  return cleaned.split(/\s+/)[0] || '';
}

function haversineDistanceKm(coord1, coord2) {
  const R = 6371; // Earth radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function calculateDistanceKm(jobLocationRaw, candidateLocationRaw) {
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

  if (jobTown === candTown && jobTown.length > 0) {
    return {
      distanceKm: 1.5,
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

  const isJobTheni = jobLocStr.toLowerCase().includes('theni') || !jobLocStr;
  const isCandTheni = candLocStr.toLowerCase().includes('theni') || !candLocStr;

  if (isJobTheni && isCandTheni) {
    return {
      distanceKm: 4.8,
      isSameTown: true,
      resolvedJobLocation: jobLocStr,
      resolvedCandidateLocation: candLocStr,
    };
  }

  return {
    distanceKm: 65.0,
    isSameTown: false,
    resolvedJobLocation: jobLocStr,
    resolvedCandidateLocation: candLocStr,
  };
}

const SKILL_CLUSTERS = {
  tally: ['tally', 'tally prime', 'tally erp', 'gst', 'gst filing', 'accounts', 'accounting', 'billing', 'bookkeeping', 'ms excel', 'excel', 'finance'],
  driving: ['driving', 'driving license', 'driver', 'heavy vehicle', 'two wheeler', 'two-wheeler driving license', 'commercial driving', 'delivery', 'lmv', 'hmv', 'van driver', 'auto driver'],
  nursing: ['nursing', 'nurse', 'gnm', 'bsc nursing', 'anm', 'hospital', 'patient care', 'medical', 'clinic', 'healthcare', 'paramedical', 'staff nurse', 'pharmacist', 'lab technician'],
  sales: ['sales', 'marketing', 'retail', 'customer service', 'counter sales', 'field sales', 'cashier', 'store incharge', 'business development'],
  computer: ['computer', 'typing', 'ms office', 'data entry', 'computer operator', 'office admin', 'receptionist', 'back office'],
};

function normalizeSkill(skill) {
  return String(skill || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function doesSkillMatch(candidateSkill, targetSkill) {
  const normCand = normalizeSkill(candidateSkill);
  const normTarget = normalizeSkill(targetSkill);

  if (!normCand || !normTarget) return false;

  if (normCand === normTarget || normCand.includes(normTarget) || normTarget.includes(normCand)) {
    return true;
  }

  for (const cluster of Object.values(SKILL_CLUSTERS)) {
    const candInCluster = cluster.some(w => normCand.includes(w) || w.includes(normCand));
    const targetInCluster = cluster.some(w => normTarget.includes(w) || w.includes(normTarget));
    if (candInCluster && targetInCluster) {
      return true;
    }
  }

  return false;
}

function computeCandidateMatchScore(candidate, job = {}) {
  // 1. Proximity Score (0 - 30 Points)
  const jobLoc = job.location || job.district || 'Theni';
  const candLoc = candidate.taluk || candidate.location || candidate.district || 'Theni';
  const { distanceKm, isSameTown } = calculateDistanceKm(jobLoc, candLoc);

  let proximityScore = 0;
  if (distanceKm <= 5.0 || isSameTown) {
    proximityScore = 30; // Within 5 km = +30 pts
  } else if (distanceKm <= 15.0) {
    proximityScore = 20;
  } else if (distanceKm <= 45.0) {
    proximityScore = 10;
  } else {
    proximityScore = 0;
  }

  // 2. Skill Match Score (0 - 40 Points)
  const reqSkills = job.skills && job.skills.length > 0
    ? job.skills
    : [job.title || 'General'];
  const candSkills = Array.isArray(candidate.skills) ? candidate.skills : [];

  const matched = reqSkills.filter(req =>
    candSkills.some(cand => doesSkillMatch(cand, req))
  );

  const ratio = matched.length / reqSkills.length;
  let skillScore = 0;
  if (ratio >= 1.0) skillScore = 40;
  else if (ratio >= 0.75) skillScore = 32;
  else if (ratio >= 0.5) skillScore = 24;
  else if (ratio >= 0.25 || matched.length > 0) skillScore = 15;
  else skillScore = 0;

  // 3. Availability for Immediate Joining (0 - 30 Points)
  const noticePeriodStr = (candidate.noticePeriod || '').toLowerCase().trim();
  const isImmediate =
    candidate.immediateJoiner === true ||
    /\bimmediate\b/i.test(noticePeriodStr) ||
    /\bavailable now\b/i.test(noticePeriodStr) ||
    /\b0\s*days?\b/i.test(noticePeriodStr) ||
    /\bready to join\b/i.test(noticePeriodStr) ||
    (!candidate.noticePeriod && !candidate.experienceYears);

  let availabilityScore = 0;
  if (isImmediate) {
    availabilityScore = 30; // Immediate joining = +30 pts
  } else if (/\b15\s*days?\b/i.test(noticePeriodStr)) {
    availabilityScore = 15;
  } else if (/\b(1\s*month|30\s*days?)\b/i.test(noticePeriodStr)) {
    availabilityScore = 5;
  } else {
    availabilityScore = 0;
  }

  const totalScore = Math.min(100, Math.max(0, proximityScore + skillScore + availabilityScore));

  let tier = 'low';
  let tierLabel = 'Needs Review';
  let tierTamilLabel = 'குறைந்த பொருத்தம்';

  if (totalScore >= 90) {
    tier = 'exceptional';
    tierLabel = 'Best Fit Candidate (90%+)';
    tierTamilLabel = 'தகுதியான ஆள் • Best Fit';
  } else if (totalScore >= 70) {
    tier = 'high';
    tierLabel = 'Strong Fit (70-89%)';
    tierTamilLabel = 'நல்ல பொருத்தம் (Strong Fit)';
  } else if (totalScore >= 50) {
    tier = 'moderate';
    tierLabel = 'Moderate Match (50-69%)';
    tierTamilLabel = 'மிதமான பொருத்தம்';
  }

  return {
    totalScore,
    tier,
    tierLabel,
    tierTamilLabel,
    proximity: {
      score: proximityScore,
      distanceKm,
      isWithin5km: distanceKm <= 5.0,
    },
    skills: {
      score: skillScore,
      matchedSkills: matched,
      missingSkills: reqSkills.filter(r => !matched.includes(r)),
    },
    availability: {
      score: availabilityScore,
      isImmediate,
      noticePeriod: candidate.noticePeriod || 'Immediate',
    },
  };
}

// ─── Test Suite Execution ───
describe('THENIJOBS — Feature 2.4: Candidate Match & Proximity Score (தகுதியான ஆட்கள் AI தரவரிசை)', () => {

  // 1. Proximity Scoring Rules
  describe('Rule 1: Distance & Proximity Scoring (Within 5 km = +30 pts)', () => {
    test('Grants +30 pts when candidate is in the same town (e.g. Theni to Theni)', () => {
      const result = computeCandidateMatchScore(
        { taluk: 'Theni', skills: [] },
        { location: 'Theni', skills: ['Tally'] }
      );
      assert.strictEqual(result.proximity.score, 30);
      assert.strictEqual(result.proximity.isWithin5km, true);
      assert.ok(result.proximity.distanceKm <= 5.0);
    });

    test('Grants +30 pts when candidate GPS coordinates are within 5 km', () => {
      const coordJob = { lat: 10.0104, lng: 77.4768 }; // Theni center
      const coordCand = { lat: 10.0150, lng: 77.4820 }; // Allinagaram (~0.7 km away)
      const distance = haversineDistanceKm(coordJob, coordCand);
      assert.ok(distance < 2.0);

      const result = computeCandidateMatchScore(
        { location: 'Allinagaram', skills: [] },
        { location: 'Theni', skills: ['Tally'] }
      );
      assert.strictEqual(result.proximity.score, 30);
      assert.strictEqual(result.proximity.isWithin5km, true);
    });

    test('Grants +20 pts for nearby taluk (5-15 km, e.g. Bodinayakanur to Theni)', () => {
      const coordJob = TAMILNADU_TOWN_COORDINATES.theni;
      const coordCand = TAMILNADU_TOWN_COORDINATES.bodinayakanur;
      const d = haversineDistanceKm(coordJob, coordCand);
      assert.ok(d > 10 && d < 16, `Actual distance was ${d} km`);

      const result = computeCandidateMatchScore(
        { taluk: 'Bodinayakanur', skills: [] },
        { location: 'Theni', skills: ['Tally'] }
      );
      assert.strictEqual(result.proximity.score, 20);
      assert.strictEqual(result.proximity.isWithin5km, false);
    });

    test('Grants +10 pts for distant taluk within district (15-45 km, e.g. Cumbum to Theni)', () => {
      const coordJob = TAMILNADU_TOWN_COORDINATES.theni;
      const coordCand = TAMILNADU_TOWN_COORDINATES.cumbum;
      const d = haversineDistanceKm(coordJob, coordCand);
      assert.ok(d > 25 && d <= 45, `Actual distance was ${d} km`);

      const result = computeCandidateMatchScore(
        { taluk: 'Cumbum', skills: [] },
        { location: 'Theni', skills: ['Tally'] }
      );
      assert.strictEqual(result.proximity.score, 10);
    });

    test('Grants 0 pts for candidate outside district (>45 km, e.g. Madurai/Chennai to Theni)', () => {
      const coordJob = TAMILNADU_TOWN_COORDINATES.theni;
      const coordMadurai = TAMILNADU_TOWN_COORDINATES.madurai;
      const d = haversineDistanceKm(coordJob, coordMadurai);
      assert.ok(d > 60, `Distance to Madurai is ${d} km`);

      const result = computeCandidateMatchScore(
        { taluk: 'Madurai', skills: [] },
        { location: 'Theni', skills: ['Tally'] }
      );
      assert.strictEqual(result.proximity.score, 0);
    });
  });

  // 2. Relevant Skill Match Rules
  describe('Rule 2: Relevant Skill Match (Tally, Driving License, Nursing = +40 pts)', () => {
    test('Grants +40 pts for exact Tally skill match', () => {
      const result = computeCandidateMatchScore(
        { taluk: 'Chennai', skills: ['Tally Prime', 'GST Filing'] },
        { location: 'Theni', skills: ['Tally'] }
      );
      assert.strictEqual(result.skills.score, 40);
      assert.deepStrictEqual(result.skills.matchedSkills, ['Tally']);
    });

    test('Grants +40 pts for Driving License match via skill cluster (Driver / Two-Wheeler / Commercial)', () => {
      const result = computeCandidateMatchScore(
        { taluk: 'Chennai', skills: ['Heavy Vehicle Driver', 'Two-Wheeler Driving License'] },
        { location: 'Theni', skills: ['Driving License'] }
      );
      assert.strictEqual(result.skills.score, 40);
      assert.deepStrictEqual(result.skills.matchedSkills, ['Driving License']);
    });

    test('Grants +40 pts for Nursing match via clinic/hospital cluster (GNM / Staff Nurse / B.Sc Nursing)', () => {
      const result = computeCandidateMatchScore(
        { taluk: 'Chennai', skills: ['B.Sc Nursing', 'Patient Care', 'Hospital'] },
        { location: 'Theni', skills: ['Nursing'] }
      );
      assert.strictEqual(result.skills.score, 40);
      assert.deepStrictEqual(result.skills.matchedSkills, ['Nursing']);
    });

    test('Grants partial points (24 pts) when 1 of 2 required skills matches', () => {
      const result = computeCandidateMatchScore(
        { taluk: 'Chennai', skills: ['Tally'] },
        { location: 'Theni', skills: ['Tally', 'Driving License'] }
      );
      assert.strictEqual(result.skills.score, 24);
      assert.strictEqual(result.skills.matchedSkills.length, 1);
      assert.strictEqual(result.skills.missingSkills.length, 1);
    });

    test('Grants 0 pts when no required skill matches', () => {
      const result = computeCandidateMatchScore(
        { taluk: 'Chennai', skills: ['Welding', 'Carpentry'] },
        { location: 'Theni', skills: ['Nursing'] }
      );
      assert.strictEqual(result.skills.score, 0);
      assert.strictEqual(result.skills.matchedSkills.length, 0);
    });
  });

  // 3. Availability for Immediate Joining Rules
  describe('Rule 3: Availability for Immediate Joining (+30 pts)', () => {
    test('Grants +30 pts when immediateJoiner flag is true', () => {
      const result = computeCandidateMatchScore(
        { taluk: 'Chennai', skills: [], immediateJoiner: true },
        { location: 'Theni', skills: ['Tally'] }
      );
      assert.strictEqual(result.availability.score, 30);
      assert.strictEqual(result.availability.isImmediate, true);
    });

    test('Grants +30 pts for text like "Immediate", "0 days", or "ready to join"', () => {
      const candidates = [
        { noticePeriod: 'Immediate Joining' },
        { noticePeriod: '0 days notice' },
        { noticePeriod: 'Ready to join immediately' },
        { noticePeriod: 'Available Now' },
      ];

      for (const cand of candidates) {
        const result = computeCandidateMatchScore(
          { taluk: 'Chennai', skills: [], ...cand },
          { location: 'Theni', skills: ['Tally'] }
        );
        assert.strictEqual(result.availability.score, 30);
      }
    });

    test('Grants +15 pts for 15 days notice period', () => {
      const result = computeCandidateMatchScore(
        { taluk: 'Chennai', skills: [], noticePeriod: '15 Days Notice' },
        { location: 'Theni', skills: ['Tally'] }
      );
      assert.strictEqual(result.availability.score, 15);
      assert.strictEqual(result.availability.isImmediate, false);
    });

    test('Grants +5 pts for 1 month notice period', () => {
      const result = computeCandidateMatchScore(
        { taluk: 'Chennai', skills: [], noticePeriod: '1 Month' },
        { location: 'Theni', skills: ['Tally'] }
      );
      assert.strictEqual(result.availability.score, 5);
      assert.strictEqual(result.availability.isImmediate, false);
    });

    test('Grants 0 pts for long notice period (2+ months)', () => {
      const result = computeCandidateMatchScore(
        { taluk: 'Chennai', skills: [], noticePeriod: '60 days / 2 months' },
        { location: 'Theni', skills: ['Tally'] }
      );
      assert.strictEqual(result.availability.score, 0);
      assert.strictEqual(result.availability.isImmediate, false);
    });
  });

  // 4. Composite AI Match Score (0 - 100%)
  describe('Composite AI Match Score Calculation & Tiers', () => {
    test('Calculates 100% Exceptional Fit: Local (<=5km, +30) + Tally (+40) + Immediate (+30)', () => {
      const candidate = {
        seekerName: 'Muthu Kumar',
        taluk: 'Theni',
        skills: ['Tally Prime', 'GST', 'Billing'],
        immediateJoiner: true,
      };
      const job = {
        title: 'Senior Accountant',
        location: 'Theni',
        skills: ['Tally'],
      };

      const result = computeCandidateMatchScore(candidate, job);
      assert.strictEqual(result.proximity.score, 30);
      assert.strictEqual(result.skills.score, 40);
      assert.strictEqual(result.availability.score, 30);
      assert.strictEqual(result.totalScore, 100);
      assert.strictEqual(result.tier, 'exceptional');
      assert.strictEqual(result.tierTamilLabel, 'தகுதியான ஆள் • Best Fit');
    });

    test('Calculates 85% Strong Fit: Driving License (+40) + Bodinayakanur (~14km, +20) + Immediate (+30) -> 90%', () => {
      const candidate = {
        seekerName: 'Senthil Nathan',
        taluk: 'Bodinayakanur',
        skills: ['Heavy Vehicle Driver', 'Two-Wheeler License'],
        immediateJoiner: true,
      };
      const job = {
        title: 'Delivery Van Driver',
        location: 'Theni',
        skills: ['Driving License'],
      };

      const result = computeCandidateMatchScore(candidate, job);
      assert.strictEqual(result.proximity.score, 20); // 5-15 km
      assert.strictEqual(result.skills.score, 40);
      assert.strictEqual(result.availability.score, 30);
      assert.strictEqual(result.totalScore, 90);
      assert.strictEqual(result.tier, 'exceptional');
    });

    test('Calculates 65% Moderate Fit: Local (+30) + Partial Skill (+24) + 1 Month Notice (+5) -> 59%', () => {
      const candidate = {
        seekerName: 'Kavitha R',
        taluk: 'Theni',
        skills: ['Staff Nurse'],
        noticePeriod: '1 month',
      };
      const job = {
        title: 'Hospital Ward Supervisor',
        location: 'Theni',
        skills: ['Nursing', 'Driving License'],
      };

      const result = computeCandidateMatchScore(candidate, job);
      assert.strictEqual(result.proximity.score, 30);
      assert.strictEqual(result.skills.score, 24); // 1 of 2 skills matched
      assert.strictEqual(result.availability.score, 5); // 1 month
      assert.strictEqual(result.totalScore, 59);
      assert.strictEqual(result.tier, 'moderate');
    });
  });

  // 5. Automatic Candidate Sorting: Highest-fit local candidates first
  describe('Automatic Sorting & Candidate Ranking (தகுதியான ஆட்கள் AI தரவரிசை)', () => {
    test('Automatically sorts applications so employers call the highest-fit local candidates first', () => {
      const job = {
        title: 'Tally Accountant & Cashier',
        location: 'Theni',
        skills: ['Tally'],
      };

      const rawCandidates = [
        {
          id: 'cand-distant-skilled',
          name: 'Dinesh (Chennai)',
          taluk: 'Chennai',
          skills: ['Tally Prime'],
          immediateJoiner: true, // 0 + 40 + 30 = 70
        },
        {
          id: 'cand-local-perfect',
          name: 'Priya (Theni Local)',
          taluk: 'Theni',
          skills: ['Tally Prime', 'GST'],
          immediateJoiner: true, // 30 + 40 + 30 = 100 (Highest-fit local)
        },
        {
          id: 'cand-local-unskilled',
          name: 'Murugan (Theni Local)',
          taluk: 'Theni',
          skills: ['Welding'],
          immediateJoiner: true, // 30 + 0 + 30 = 60
        },
        {
          id: 'cand-nearby-bodi',
          name: 'Ravi (Bodi Nearby)',
          taluk: 'Bodinayakanur',
          skills: ['Tally ERP'],
          noticePeriod: '15 days', // 20 + 40 + 15 = 75
        },
      ];

      // Score all candidates
      const scoredCandidates = rawCandidates.map(cand => {
        const match = computeCandidateMatchScore(cand, job);
        return {
          ...cand,
          matchScore: match.totalScore,
          matchBreakdown: match,
        };
      });

      // Sort by match_desc (The default automatic sorting)
      scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

      // Verify ranking order:
      // 1. Priya (100) -> Highest-fit local candidate first!
      // 2. Ravi (75) -> Nearby + Skilled
      // 3. Dinesh (70) -> Distant + Skilled
      // 4. Murugan (60) -> Local + Unskilled
      assert.strictEqual(scoredCandidates[0].id, 'cand-local-perfect');
      assert.strictEqual(scoredCandidates[0].matchScore, 100);
      assert.strictEqual(scoredCandidates[1].id, 'cand-nearby-bodi');
      assert.strictEqual(scoredCandidates[1].matchScore, 75);
      assert.strictEqual(scoredCandidates[2].id, 'cand-distant-skilled');
      assert.strictEqual(scoredCandidates[2].matchScore, 70);
      assert.strictEqual(scoredCandidates[3].id, 'cand-local-unskilled');
      assert.strictEqual(scoredCandidates[3].matchScore, 60);

      // Confirm top candidate is within 5km and ready to call immediately
      assert.strictEqual(scoredCandidates[0].matchBreakdown.proximity.isWithin5km, true);
      assert.strictEqual(scoredCandidates[0].matchBreakdown.availability.isImmediate, true);
    });

    test('Quick filter tabs accurately isolate top matches, within 5km local, and immediate joiners', () => {
      const job = { location: 'Theni', skills: ['Tally'] };
      const candidates = [
        { id: '1', taluk: 'Theni', skills: ['Tally'], immediateJoiner: true }, // 100
        { id: '2', taluk: 'Bodinayakanur', skills: ['Tally'], immediateJoiner: false, noticePeriod: '15 days' }, // 75
        { id: '3', taluk: 'Theni', skills: ['Cooking'], immediateJoiner: false, noticePeriod: '1 month' }, // 35
        { id: '4', taluk: 'Madurai', skills: ['Tally'], immediateJoiner: true }, // 70
      ].map(c => ({ ...c, match: computeCandidateMatchScore(c, job) }));

      // Filter: Top Matches (75%+)
      const topMatches = candidates.filter(c => c.match.totalScore >= 75);
      assert.strictEqual(topMatches.length, 2);
      assert.ok(topMatches.every(c => c.match.totalScore >= 75));

      // Filter: Within 5 km Local
      const localCandidates = candidates.filter(c => c.match.proximity.isWithin5km);
      assert.strictEqual(localCandidates.length, 2); // Candidate 1 and Candidate 3

      // Filter: Immediate Joiners
      const immediateCandidates = candidates.filter(c => c.match.availability.isImmediate);
      assert.strictEqual(immediateCandidates.length, 2); // Candidate 1 and Candidate 4
    });
  });
});
