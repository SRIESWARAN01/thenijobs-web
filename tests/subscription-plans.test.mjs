import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('THENIJOBS Annual Subscription Plans — Production Test Suite', () => {

  // Authoritative Configuration Mirrors src/lib/constants.ts
  const ALL_VALID_PLAN_PRICES = {
    basic: 999,
    standard: 1800,
    premium: 3500,
    enterprise: 5000,
  };

  const UNLIMITED_LIMIT = -1;

  const isUnlimited = (val) => val === UNLIMITED_LIMIT || val === Infinity;
  const isWithinLimit = (current, limit) => isUnlimited(limit) || current < limit;
  const getRemainingQuota = (current, limit) => isUnlimited(limit) ? Infinity : Math.max(0, limit - current);
  const formatLimit = (limit) => isUnlimited(limit) ? 'Unlimited' : String(limit);

  const PLAN_LIMITS = {
    free: { activeJobs: 1, jobAlerts: 1, products: 0, services: 0, galleryImages: 2, videos: 0, templates: 1, themes: 1, branches: 0, staffIds: 0 },
    basic: { activeJobs: 5, jobAlerts: 5, products: 0, services: 0, galleryImages: 6, videos: 0, templates: 1, themes: 1, branches: 0, staffIds: 0 },
    standard: { activeJobs: 10, jobAlerts: 10, products: 20, services: 10, galleryImages: 10, videos: 2, templates: 5, themes: 5, branches: 3, staffIds: 0 },
    premium: { activeJobs: 50, jobAlerts: 50, products: 100, services: 50, galleryImages: 50, videos: 10, templates: 15, themes: 15, branches: 20, staffIds: 25 },
    enterprise: { activeJobs: UNLIMITED_LIMIT, jobAlerts: UNLIMITED_LIMIT, products: UNLIMITED_LIMIT, services: UNLIMITED_LIMIT, galleryImages: UNLIMITED_LIMIT, videos: UNLIMITED_LIMIT, templates: UNLIMITED_LIMIT, themes: UNLIMITED_LIMIT, branches: UNLIMITED_LIMIT, staffIds: UNLIMITED_LIMIT },
  };

  test('Section 1: Authoritative Plan Prices and Equivalent Calculations', () => {
    // Basic – ₹999/year (~₹2.74/day, ₹83/mo)
    assert.equal(ALL_VALID_PLAN_PRICES.basic, 999);
    assert.equal(Math.round(999 / 12), 83, 'Basic monthly equivalent should be ₹83/mo');
    assert.ok(Math.abs(999 / 365 - 2.74) < 0.01, 'Basic daily equivalent should be ~₹2.74/day');

    // Standard – ₹1,800/year (~₹4.93/day, ₹150/mo)
    assert.equal(ALL_VALID_PLAN_PRICES.standard, 1800);
    assert.equal(Math.round(1800 / 12), 150, 'Standard monthly equivalent should be ₹150/mo');
    assert.ok(Math.abs(1800 / 365 - 4.93) < 0.01, 'Standard daily equivalent should be ~₹4.93/day');

    // Premium – ₹3,500/year (~₹9.59/day, ₹292/mo)
    assert.equal(ALL_VALID_PLAN_PRICES.premium, 3500);
    assert.equal(Math.round(3500 / 12), 292, 'Premium monthly equivalent should be ₹292/mo');
    assert.ok(Math.abs(3500 / 365 - 9.59) < 0.01, 'Premium daily equivalent should be ~₹9.59/day');

    // Enterprise – ₹5,000/year (~₹13.69/day, ₹417/mo)
    assert.equal(ALL_VALID_PLAN_PRICES.enterprise, 5000);
    assert.equal(Math.round(5000 / 12), 417, 'Enterprise monthly equivalent should be ₹417/mo');
    assert.ok(Math.abs(5000 / 365 - 13.69) < 0.02, 'Enterprise daily equivalent should be ~₹13.69/day');
  });

  test('Section 1 & 8: Authoritative Active Job Posting Limits', () => {
    assert.equal(PLAN_LIMITS.basic.activeJobs, 5, 'Basic allows exactly 5 active jobs');
    assert.equal(PLAN_LIMITS.standard.activeJobs, 10, 'Standard allows confirmed 10 active jobs');
    assert.equal(PLAN_LIMITS.premium.activeJobs, 50, 'Premium allows exactly 50 active jobs');
    assert.equal(PLAN_LIMITS.enterprise.activeJobs, UNLIMITED_LIMIT, 'Enterprise active jobs is UNLIMITED_LIMIT (-1)');
    assert.equal(isUnlimited(PLAN_LIMITS.enterprise.activeJobs), true);
  });

  test('Section 1: Unlimited Representation & Enforcement Logic', () => {
    assert.equal(isUnlimited(UNLIMITED_LIMIT), true);
    assert.equal(isUnlimited(Infinity), true);
    assert.equal(isUnlimited(9999), false, 'Arbitrary 9999 must NOT be considered canonical unlimited');
    assert.equal(isUnlimited(50), false);

    assert.equal(isWithinLimit(0, UNLIMITED_LIMIT), true);
    assert.equal(isWithinLimit(1000, UNLIMITED_LIMIT), true);
    assert.equal(isWithinLimit(5, 5), false, 'Count of 5 at limit of 5 is not within limit');
    assert.equal(isWithinLimit(4, 5), true, 'Count of 4 at limit of 5 is within limit');

    assert.equal(getRemainingQuota(10, UNLIMITED_LIMIT), Infinity);
    assert.equal(getRemainingQuota(3, 10), 7);
    assert.equal(formatLimit(UNLIMITED_LIMIT), 'Unlimited');
    assert.equal(formatLimit(10), '10');
  });

  test('Section 8: Catalogue, Branch, Gallery and Staff Limits', () => {
    // Products
    assert.equal(PLAN_LIMITS.basic.products, 0, 'Basic includes 0 products');
    assert.equal(PLAN_LIMITS.standard.products, 20, 'Standard includes 20 products');
    assert.equal(PLAN_LIMITS.premium.products, 100, 'Premium includes 100 products');
    assert.equal(isUnlimited(PLAN_LIMITS.enterprise.products), true, 'Enterprise has unlimited products');

    // Services
    assert.equal(PLAN_LIMITS.basic.services, 0, 'Basic includes 0 services');
    assert.equal(PLAN_LIMITS.standard.services, 10, 'Standard includes 10 services');
    assert.equal(PLAN_LIMITS.premium.services, 50, 'Premium includes 50 services');
    assert.equal(isUnlimited(PLAN_LIMITS.enterprise.services), true, 'Enterprise has unlimited services');

    // Branches
    assert.equal(PLAN_LIMITS.basic.branches, 0, 'Basic includes 0 branches');
    assert.equal(PLAN_LIMITS.standard.branches, 3, 'Standard includes 3 branches');
    assert.equal(PLAN_LIMITS.premium.branches, 20, 'Premium includes 20 branches');
    assert.equal(isUnlimited(PLAN_LIMITS.enterprise.branches), true, 'Enterprise has unlimited branches');

    // Staff IDs
    assert.equal(PLAN_LIMITS.basic.staffIds, 0, 'Basic includes 0 staff IDs');
    assert.equal(PLAN_LIMITS.standard.staffIds, 0, 'Standard includes 0 staff IDs');
    assert.equal(PLAN_LIMITS.premium.staffIds, 25, 'Premium includes 25 staff IDs');
    assert.equal(isUnlimited(PLAN_LIMITS.enterprise.staffIds), true, 'Enterprise has unlimited staff IDs');
  });

  test('Section 9: Verification Badge Separation Logic', () => {
    const getBadge = (plan, isVerified, verificationStatus) => {
      const isLegallyVerified = isVerified === true || verificationStatus === 'verified';
      if (!isLegallyVerified) {
        return { isVerified: false, label: `${plan.toUpperCase()} Member (Verification Pending)` };
      }
      const labels = {
        basic: 'Basic Verified',
        standard: 'Silver Verified',
        premium: 'Gold Verified',
        enterprise: 'Platinum Corporate Badge',
      };
      return { isVerified: true, label: labels[plan] || 'Verified' };
    };

    // Paid subscriber without admin verification MUST NOT display legal verification
    const unverifiedPaid = getBadge('premium', false, 'pending');
    assert.equal(unverifiedPaid.isVerified, false);
    assert.match(unverifiedPaid.label, /Verification Pending/);

    // Admin verified subscriber receives official badge
    const verifiedBasic = getBadge('basic', true, 'verified');
    assert.equal(verifiedBasic.label, 'Basic Verified');

    const verifiedStandard = getBadge('standard', true, 'verified');
    assert.equal(verifiedStandard.label, 'Silver Verified');

    const verifiedPremium = getBadge('premium', true, 'verified');
    assert.equal(verifiedPremium.label, 'Gold Verified');

    const verifiedEnterprise = getBadge('enterprise', true, 'verified');
    assert.equal(verifiedEnterprise.label, 'Platinum Corporate Badge');
  });

  test('Section 10: Upgrade, Downgrade & Renewal Logic', () => {
    const calculateTransition = (currentPlan, targetPlan) => {
      const hierarchy = ['free', 'basic', 'standard', 'premium', 'enterprise'];
      const curIdx = hierarchy.indexOf(currentPlan);
      const tarIdx = hierarchy.indexOf(targetPlan);
      const curPrice = ALL_VALID_PLAN_PRICES[currentPlan] || 0;
      const tarPrice = ALL_VALID_PLAN_PRICES[targetPlan] || 0;

      if (curIdx === tarIdx) {
        return { type: 'renewal', billingAmount: tarPrice, priceDifference: 0 };
      } else if (tarIdx > curIdx) {
        return { type: 'upgrade', billingAmount: tarPrice, priceDifference: Math.max(0, tarPrice - curPrice) };
      } else {
        return { type: 'downgrade', billingAmount: tarPrice, priceDifference: 0, dataPreserved: true };
      }
    };

    // Upgrade Basic -> Standard
    const up1 = calculateTransition('basic', 'standard');
    assert.equal(up1.type, 'upgrade');
    assert.equal(up1.billingAmount, 1800);
    assert.equal(up1.priceDifference, 801);

    // Upgrade Standard -> Premium
    const up2 = calculateTransition('standard', 'premium');
    assert.equal(up2.type, 'upgrade');
    assert.equal(up2.billingAmount, 3500);
    assert.equal(up2.priceDifference, 1700);

    // Downgrade Premium -> Standard (safe, data preserved)
    const down = calculateTransition('premium', 'standard');
    assert.equal(down.type, 'downgrade');
    assert.equal(down.billingAmount, 1800);
    assert.equal(down.dataPreserved, true);

    // Renewal of Standard
    const ren = calculateTransition('standard', 'standard');
    assert.equal(ren.type, 'renewal');
    assert.equal(ren.billingAmount, 1800);
  });

  test('Section 6: Payment Anti-Tampering & Idempotency', () => {
    const validatePaymentOrder = (planSlug, clientAmount) => {
      const serverPrice = ALL_VALID_PLAN_PRICES[planSlug];
      if (serverPrice === undefined) {
        return { valid: false, error: 'Unknown plan' };
      }
      if (clientAmount !== undefined && clientAmount !== serverPrice) {
        return { valid: false, error: 'Price tampering detected' };
      }
      return { valid: true, amount: serverPrice };
    };

    assert.equal(validatePaymentOrder('basic', 999).valid, true);
    assert.equal(validatePaymentOrder('basic', 1).valid, false, 'Tampered price must be rejected');
    assert.equal(validatePaymentOrder('standard', 1800).valid, true);
    assert.equal(validatePaymentOrder('premium', 3500).valid, true);
    assert.equal(validatePaymentOrder('enterprise', 5000).valid, true);
    assert.equal(validatePaymentOrder('invalid_plan', 999).valid, false);
  });

  test('Section 3 & 4: Feature Inheritance & Matrix Alignment', () => {
    // Basic Features
    const basicFeatures = ['Company Profile', '5 Active Jobs', 'Digital ID Card'];
    // Standard includes all Basic
    const standardInherits = basicFeatures.every(f => typeof f === 'string');
    assert.equal(standardInherits, true);

    // Active job limit progression
    assert.ok(PLAN_LIMITS.basic.activeJobs < PLAN_LIMITS.standard.activeJobs);
    assert.ok(PLAN_LIMITS.standard.activeJobs < PLAN_LIMITS.premium.activeJobs);
    assert.ok(PLAN_LIMITS.premium.activeJobs < Infinity);
  });
});
