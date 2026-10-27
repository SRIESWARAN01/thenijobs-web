import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  EARNING_TIERS_DATA,
  SPOTLIGHT_BADGE_COMMISSION,
  SPOTLIGHT_BADGE_PRICE,
  PRESET_MODELS,
  calculateEstimates,
  getEffortPace,
  formatINR,
} from '../src/lib/ambassador/earningCalculator.ts';
import { AMBASSADOR_COMMISSIONS, ALL_VALID_PLAN_PRICES } from '../src/lib/constants.ts';

describe('THENIJOBS Monthly Earning Estimator • வருமான கணக்கீடு — Test Suite', () => {

  test('1. All 4 Employer Subscription Plans are Configured in Earning Tiers', () => {
    assert.equal(EARNING_TIERS_DATA.length, 4, 'Must have exactly 4 official employer subscription tiers');
    
    const ids = EARNING_TIERS_DATA.map(t => t.id);
    assert.deepEqual(ids, ['basic', 'standard', 'premium', 'enterprise']);

    // Check plan prices match authoritative constants
    const basicTier = EARNING_TIERS_DATA.find(t => t.id === 'basic');
    const standardTier = EARNING_TIERS_DATA.find(t => t.id === 'standard');
    const premiumTier = EARNING_TIERS_DATA.find(t => t.id === 'premium');
    const enterpriseTier = EARNING_TIERS_DATA.find(t => t.id === 'enterprise');

    assert.equal(basicTier.price, ALL_VALID_PLAN_PRICES.basic, 'Basic plan price must be ₹999');
    assert.equal(standardTier.price, ALL_VALID_PLAN_PRICES.standard, 'Standard plan price must be ₹1,800');
    assert.equal(premiumTier.price, ALL_VALID_PLAN_PRICES.premium, 'Premium plan price must be ₹3,500');
    assert.equal(enterpriseTier.price, ALL_VALID_PLAN_PRICES.enterprise, 'Enterprise plan price must be ₹5,000');
  });

  test('2. Ambassador Commission Rates Match Official Business Ledger Across ALL Plans', () => {
    const basicTier = EARNING_TIERS_DATA.find(t => t.id === 'basic');
    const standardTier = EARNING_TIERS_DATA.find(t => t.id === 'standard');
    const premiumTier = EARNING_TIERS_DATA.find(t => t.id === 'premium');
    const enterpriseTier = EARNING_TIERS_DATA.find(t => t.id === 'enterprise');

    // Basic: ₹150 commission
    assert.equal(basicTier.commission, 150);
    assert.equal(basicTier.commission, AMBASSADOR_COMMISSIONS.basic);
    assert.equal(basicTier.commissionFormatted, '₹150/shop');

    // Standard: ₹350 commission
    assert.equal(standardTier.commission, 350);
    assert.equal(standardTier.commission, AMBASSADOR_COMMISSIONS.standard);
    assert.equal(standardTier.commissionFormatted, '₹350/shop');

    // Premium: ₹700 commission
    assert.equal(premiumTier.commission, 700);
    assert.equal(premiumTier.commission, AMBASSADOR_COMMISSIONS.premium);
    assert.equal(premiumTier.commissionFormatted, '₹700/shop');

    // Enterprise: ₹1,000 commission
    assert.equal(enterpriseTier.commission, 1000);
    assert.equal(enterpriseTier.commission, AMBASSADOR_COMMISSIONS.enterprise);
    assert.equal(enterpriseTier.commissionFormatted, '₹1,000/shop');

    // Micro-upsell Urgent 48h Spotlight Badge: ₹35 commission
    assert.equal(SPOTLIGHT_BADGE_COMMISSION, 35, 'Urgent badge commission must be ₹35');
    assert.equal(SPOTLIGHT_BADGE_PRICE, 99, 'Spotlight base price must be ₹99');
  });

  test('3. Mathematical Correctness of Commission Calculations & Annual Projections', () => {
    // Test case: 2 basic + 3 standard + 1 premium + 1 enterprise + 5 spotlights
    // Basic: 2 * 150 = 300
    // Standard: 3 * 350 = 1050
    // Premium: 1 * 700 = 700
    // Enterprise: 1 * 1000 = 1000
    // Shop Total: 300 + 1050 + 700 + 1000 = 3050
    // Spotlight: 5 * 35 = 175
    // Monthly Total: 3050 + 175 = 3225
    // Annual Projected: 3225 * 12 = 38700

    const result = calculateEstimates({
      basic: 2,
      standard: 3,
      premium: 1,
      enterprise: 1,
      spotlight: 5,
    }, true);

    assert.equal(result.subtotals.basic, 300);
    assert.equal(result.subtotals.standard, 1050);
    assert.equal(result.subtotals.premium, 700);
    assert.equal(result.subtotals.enterprise, 1000);
    assert.equal(result.subtotals.spotlight, 175);

    assert.equal(result.shopCommissionTotal, 3050);
    assert.equal(result.totalMonthlyIncome, 3225);
    assert.equal(result.totalAnnualProjected, 38700);
    assert.equal(result.totalShops, 7);
  });

  test('4. Calculation when Spotlight Bonus is Excluded or Zero', () => {
    const resultNoSpotlight = calculateEstimates({
      basic: 4,
      standard: 4,
      premium: 2,
      enterprise: 1,
      spotlight: 10,
    }, false); // includeSpotlight = false

    // Basic: 4 * 150 = 600
    // Standard: 4 * 350 = 1400
    // Premium: 2 * 700 = 1400
    // Enterprise: 1 * 1000 = 1000
    // Total = 4400
    assert.equal(resultNoSpotlight.subtotals.spotlight, 0);
    assert.equal(resultNoSpotlight.shopCommissionTotal, 4400);
    assert.equal(resultNoSpotlight.totalMonthlyIncome, 4400);
    assert.equal(resultNoSpotlight.totalAnnualProjected, 4400 * 12);
  });

  test('5. Preset Models Verification (Part-time, Active, Superstar, Reset)', () => {
    // 5a. Part-time
    const ptPreset = PRESET_MODELS.part_time;
    assert.ok(ptPreset, 'Part-time preset must exist');
    const ptResult = calculateEstimates(ptPreset.counts, true);
    // basic: 4*150=600, standard: 4*350=1400, premium: 3*700=2100, enterprise: 0*1000=0 -> Shop total: 4100
    // spotlight: 4*35=140 -> Total: 4240
    assert.equal(ptResult.shopCommissionTotal, 4100);
    assert.equal(ptResult.totalMonthlyIncome, 4240);
    assert.equal(ptResult.totalAnnualProjected, 4240 * 12);
    assert.equal(ptResult.totalShops, 11);

    // 5b. Active Ambassador
    const activePreset = PRESET_MODELS.active;
    assert.ok(activePreset, 'Active preset must exist');
    const activeResult = calculateEstimates(activePreset.counts, true);
    // basic: 5*150=750, standard: 6*350=2100, premium: 4*700=2800, enterprise: 2*1000=2000 -> Shop total: 7650
    // spotlight: 10*35=350 -> Total: 8000
    assert.equal(activeResult.shopCommissionTotal, 7650);
    assert.equal(activeResult.totalMonthlyIncome, 8000);
    assert.equal(activeResult.totalAnnualProjected, 96000);
    assert.equal(activeResult.totalShops, 17);

    // 5c. Town Champion / Superstar
    const superstarPreset = PRESET_MODELS.superstar;
    assert.ok(superstarPreset, 'Superstar preset must exist');
    const superstarResult = calculateEstimates(superstarPreset.counts, true);
    // basic: 10*150=1500, standard: 12*350=4200, premium: 8*700=5600, enterprise: 4*1000=4000 -> Shop total: 15300
    // spotlight: 20*35=700 -> Total: 16000
    assert.equal(superstarResult.shopCommissionTotal, 15300);
    assert.equal(superstarResult.totalMonthlyIncome, 16000);
    assert.equal(superstarResult.totalAnnualProjected, 192000);
    assert.equal(superstarResult.totalShops, 34);

    // 5d. Reset
    const resetPreset = PRESET_MODELS.reset;
    assert.ok(resetPreset, 'Reset preset must exist');
    const resetResult = calculateEstimates(resetPreset.counts, true);
    assert.equal(resetResult.shopCommissionTotal, 0);
    assert.equal(resetResult.totalMonthlyIncome, 0);
    assert.equal(resetResult.totalAnnualProjected, 0);
    assert.equal(resetResult.totalShops, 0);
  });

  test('6. Effort Pace Descriptions Match Workload Horizons', () => {
    // 0 shops
    const zeroPace = getEffortPace(0);
    assert.ok(zeroPace.pace.includes('Get started'));
    assert.ok(zeroPace.paceTa.length > 0);

    // 1-6 shops
    const casualPace = getEffortPace(4);
    assert.ok(casualPace.pace.includes('Casual Part-Time'));
    assert.ok(casualPace.paceTa.includes('பகுதி நேரம்'));

    // 7-15 shops
    const steadyPace = getEffortPace(12);
    assert.ok(steadyPace.pace.includes('Steady Part-Time'));

    // 16-25 shops
    const activePace = getEffortPace(20);
    assert.ok(activePace.pace.includes('Active Full-Time'));

    // 26+ shops
    const champPace = getEffortPace(35);
    assert.ok(champPace.pace.includes('Taluk Champion'));
  });

  test('7. Indian Currency Formatter (₹)', () => {
    assert.equal(formatINR(0), '₹0');
    assert.equal(formatINR(350), '₹350');
    assert.equal(formatINR(1800), '₹1,800');
    assert.equal(formatINR(24500), '₹24,500');
    assert.equal(formatINR(192000), '₹1,92,000');
  });

  test('8. Bilingual Tamil Content is Present for ALL 4 Plans', () => {
    EARNING_TIERS_DATA.forEach(tier => {
      assert.ok(tier.name && tier.name.length > 0, `Plan ${tier.id} must have an English title`);
      assert.ok(tier.nameTa && tier.nameTa.length > 0, `Plan ${tier.id} must have a Tamil title`);
      assert.ok(tier.targetBiz && tier.targetBiz.length > 0, `Plan ${tier.id} must have English target businesses`);
      assert.ok(tier.targetBizTa && tier.targetBizTa.length > 0, `Plan ${tier.id} must have Tamil target businesses`);
      assert.ok(tier.maxVal > 0, `Plan ${tier.id} must have a positive slider max range`);
      assert.ok(tier.defaultVal >= 0, `Plan ${tier.id} must have a non-negative default value`);
      assert.ok(tier.sliderAccent.startsWith('accent-'), `Plan ${tier.id} sliderAccent must be valid Tailwind`);
      assert.ok(tier.badgeColor.includes('text-'), `Plan ${tier.id} badgeColor must contain text styling`);
    });
  });

});
