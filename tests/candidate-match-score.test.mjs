import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeCandidateMatchScore,
  calculateDistanceKm,
  haversineDistanceKm,
  normalizeTownName,
  doesSkillMatch,
  extractSkillsFromJob,
  extractSkillsFromCandidate,
  TAMILNADU_TOWN_COORDINATES,
} from '../src/lib/matching/candidateMatchScore.ts';

test('THENIJOBS — Candidate Match & Proximity Scoring Engine (Feature 2.4)', async (t) => {
  await t.test('1. Town Geocoding & Theni Taluk Coordinates', () => {
    assert.ok(TAMILNADU_TOWN_COORDINATES.theni, 'Theni centroid must exist');
    assert.ok(TAMILNADU_TOWN_COORDINATES.periyakulam, 'Periyakulam coordinates must exist');
    assert.ok(TAMILNADU_TOWN_COORDINATES.cumbum, 'Cumbum coordinates must exist');
    assert.ok(TAMILNADU_TOWN_COORDINATES.bodinayakanur, 'Bodi coordinates must exist');
    assert.ok(TAMILNADU_TOWN_COORDINATES.andipatti, 'Andipatti coordinates must exist');
    assert.ok(TAMILNADU_TOWN_COORDINATES.uthamapalayam, 'Uthamapalayam coordinates must exist');
    assert.ok(TAMILNADU_TOWN_COORDINATES.chinnamanur, 'Chinnamanur coordinates must exist');

    assert.equal(normalizeTownName('Periyakulam Bypass, Theni'), 'periyakulam');
    assert.equal(normalizeTownName('Cumbum Mettu Road'), 'cumbum');
    assert.equal(normalizeTownName('Bodinayakanur Market'), 'bodinayakanur');
  });

  await t.test('2. Haversine Distance Calculation', () => {
    const theniCoord = TAMILNADU_TOWN_COORDINATES.theni;
    const allinagaramCoord = TAMILNADU_TOWN_COORDINATES.allinagaram;
    const dist = haversineDistanceKm(theniCoord, allinagaramCoord);
    assert.ok(dist <= 2.0, `Theni to Allinagaram should be under 2 km, got ${dist}`);

    const resLocal = calculateDistanceKm('Theni Old Bus Stand', 'Allinagaram, Theni');
    assert.ok(resLocal.distanceKm <= 5.0, 'Nearby town in Theni should resolve as local (<= 5 km)');
  });

  await t.test('3. Skill Cluster Matching (Tally, Driving, Nursing)', () => {
    assert.ok(doesSkillMatch('Tally Prime', 'Tally'), 'Tally Prime matches Tally');
    assert.ok(doesSkillMatch('GST Filing & Accounts', 'Tally'), 'GST Filing & Accounts matches Tally cluster');
    assert.ok(doesSkillMatch('Two-Wheeler Driving License', 'Driving License'), 'Driving license variant matches');
    assert.ok(doesSkillMatch('B.Sc Nursing Staff', 'Nursing'), 'B.Sc Nursing matches Nursing');
    assert.ok(!doesSkillMatch('Cooking & Catering', 'Software Developer'), 'Unrelated skills do not match');
  });

  await t.test('4. Proximity Scoring (Within 5 km = +30 pts)', () => {
    // Exact same town or within 5 km
    const resultSameTown = computeCandidateMatchScore(
      { location: 'Theni', taluk: 'Theni' },
      { location: 'Theni', title: 'General Staff' }
    );
    assert.equal(resultSameTown.proximity.score, 30, 'Local candidates within 5km get 30 pts');
    assert.ok(resultSameTown.proximity.isWithin5km);
    assert.match(resultSameTown.proximity.tamilLabel, /5 கி\.மீ/);
  });

  await t.test('5. Skill Matching Score (100% matched skills = +40 pts)', () => {
    const result = computeCandidateMatchScore(
      { skills: ['Tally Prime', 'GST', 'MS Excel'] },
      { title: 'Senior Accountant', skills: ['Tally'] }
    );
    assert.equal(result.skills.score, 40, 'Full skill match awards 40 pts');
    assert.deepEqual(result.skills.matchedSkills, ['Tally']);
  });

  await t.test('6. Availability Scoring (Immediate joining = +30 pts)', () => {
    const immediateRes = computeCandidateMatchScore(
      { immediateJoiner: true },
      { title: 'Delivery Executive' }
    );
    assert.equal(immediateRes.availability.score, 30, 'Immediate joining awards 30 pts');
    assert.ok(immediateRes.availability.isImmediate);
    assert.match(immediateRes.availability.tamilLabel, /உடனடியாக/);

    const notice15Res = computeCandidateMatchScore(
      { noticePeriod: '15 Days' },
      { title: 'Accountant' }
    );
    assert.equal(notice15Res.availability.score, 15, '15-day notice awards 15 pts');
  });

  await t.test('7. Composite Tier Scoring: 100/100 Exceptional Match', () => {
    // 30 (Proximity) + 40 (Skills) + 30 (Immediate) = 100
    const perfectCandidate = computeCandidateMatchScore(
      {
        location: 'Theni',
        taluk: 'Theni',
        skills: ['Tally ERP 9', 'GST Filing', 'Accounts'],
        immediateJoiner: true,
        noticePeriod: 'Immediate',
      },
      {
        location: 'Theni',
        title: 'Accountant',
        skills: ['Tally'],
      }
    );

    assert.equal(perfectCandidate.totalScore, 100);
    assert.equal(perfectCandidate.tier, 'exceptional');
    assert.equal(perfectCandidate.tierTamilLabel, 'தகுதியான ஆள் • Best Fit');
    assert.ok(perfectCandidate.distanceKm !== undefined && perfectCandidate.distanceKm <= 5);
    assert.ok(perfectCandidate.recommendation.includes('🌟 Highly Recommended'));
  });

  await t.test('8. High, Moderate & Low Tier Classifications', () => {
    // 30 (Proximity) + 40 (Skills) + 5 (1 month notice) = 75 (High)
    const highMatch = computeCandidateMatchScore(
      {
        location: 'Theni',
        skills: ['Driving License'],
        noticePeriod: '1 Month',
      },
      {
        location: 'Theni',
        skills: ['Driving License'],
      }
    );
    assert.equal(highMatch.totalScore, 75);
    assert.equal(highMatch.tier, 'high');

    // 0 (Distant) + 40 (Skills) + 15 (15-day notice) = 55 (Moderate)
    const moderateMatch = computeCandidateMatchScore(
      {
        location: 'Chennai',
        skills: ['Nursing'],
        noticePeriod: '15 Days',
      },
      {
        location: 'Theni',
        skills: ['Nursing'],
      }
    );
    assert.equal(moderateMatch.totalScore, 55);
    assert.equal(moderateMatch.tier, 'moderate');

    // 0 (Distant) + 0 (No skills) + 0 (Long notice) = 0 (Low)
    const lowMatch = computeCandidateMatchScore(
      {
        location: 'Tirunelveli',
        skills: ['Cooking'],
        noticePeriod: '2 Months',
      },
      {
        location: 'Theni',
        skills: ['Software Development'],
      }
    );
    assert.ok(lowMatch.totalScore < 50);
    assert.equal(lowMatch.tier, 'low');
  });
});
