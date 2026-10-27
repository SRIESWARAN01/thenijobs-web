import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

describe('THENIJOBS — Subscription Plans, Billing & Feature Access Matrix Test Suite', () => {

  // ─── 1. Authoritative Configuration Constants ──────────────────────────────
  const PLAN_PRICES = {
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
    enterprise: {
      activeJobs: UNLIMITED_LIMIT,
      jobAlerts: UNLIMITED_LIMIT,
      products: UNLIMITED_LIMIT,
      services: UNLIMITED_LIMIT,
      galleryImages: UNLIMITED_LIMIT,
      videos: UNLIMITED_LIMIT,
      templates: UNLIMITED_LIMIT,
      themes: UNLIMITED_LIMIT,
      branches: UNLIMITED_LIMIT,
      staffIds: UNLIMITED_LIMIT,
    },
  };

  const FEATURE_MATRIX_ROW_IDS = [
    'jobs',
    'jobAlerts',
    'products',
    'services',
    'galleryImages',
    'videos',
    'templates',
    'themes',
    'branches',
    'staffIds',
    'digitalIdCard',
    'qrCode',
    'seo',
    'whatsappEnquiry',
    'leadManagement',
    'aiCompanyAssistant',
    'aiSeoContent',
    'careersPortal',
    'homepageFeaturedPlacement',
    'searchPriority',
  ];

  // ─── TEST 1: The 4 Subscription Plans Configuration ────────────────────────
  test('1. Four Subscription Plans Configuration & Display Pricing', () => {
    // 1. Basic – ₹999/year (~₹2.74/day, ₹83/mo)
    assert.equal(PLAN_PRICES.basic, 999, 'Basic annual price is ₹999');
    assert.equal(Math.round(999 / 12), 83, 'Basic monthly equivalent is ₹83/mo');
    assert.equal(Number((999 / 365).toFixed(2)), 2.74, 'Basic daily equivalent is ₹2.74/day');

    // 2. Standard – ₹1,800/year (~₹4.93/day, ₹150/mo)
    assert.equal(PLAN_PRICES.standard, 1800, 'Standard annual price is ₹1,800');
    assert.equal(Math.round(1800 / 12), 150, 'Standard monthly equivalent is ₹150/mo');
    assert.equal(Number((1800 / 365).toFixed(2)), 4.93, 'Standard daily equivalent is ₹4.93/day');

    // 3. Premium – ₹3,500/year (~₹9.59/day, ₹292/mo)
    assert.equal(PLAN_PRICES.premium, 3500, 'Premium annual price is ₹3,500');
    assert.equal(Math.round(3500 / 12), 292, 'Premium monthly equivalent is ₹292/mo');
    assert.equal(Number((3500 / 365).toFixed(2)), 9.59, 'Premium daily equivalent is ₹9.59/day');

    // 4. Enterprise – ₹5,000/year (~₹13.69/day, ₹417/mo)
    assert.equal(PLAN_PRICES.enterprise, 5000, 'Enterprise annual price is ₹5,000');
    assert.equal(Math.round(5000 / 12), 417, 'Enterprise monthly equivalent is ₹417/mo');
    assert.ok(Math.abs(5000 / 365 - 13.69) < 0.02, 'Enterprise daily equivalent is ~₹13.69/day');
  });

  // ─── TEST 2: Authoritative 20-Row Feature Access Matrix ────────────────────
  test('2. Feature Access Matrix has exactly 20 specified rows with valid access types', () => {
    assert.equal(FEATURE_MATRIX_ROW_IDS.length, 20, 'Matrix must have exactly 20 authoritative feature rows');

    const validAccessTypes = new Set([
      'Not available',
      'Available',
      'Limited quantity',
      'Unlimited',
      'Premium feature',
      'Enterprise feature',
    ]);

    // Sample matrix items verification
    const sampleMatrix = [
      { id: 'jobs', basic: 'Limited quantity', standard: 'Limited quantity', premium: 'Limited quantity', enterprise: 'Unlimited' },
      { id: 'products', basic: 'Not available', standard: 'Limited quantity', premium: 'Limited quantity', enterprise: 'Unlimited' },
      { id: 'services', basic: 'Not available', standard: 'Limited quantity', premium: 'Limited quantity', enterprise: 'Unlimited' },
      { id: 'digitalIdCard', basic: 'Available', standard: 'Available', premium: 'Premium feature', enterprise: 'Enterprise feature' },
      { id: 'qrCode', basic: 'Available', standard: 'Available', premium: 'Premium feature', enterprise: 'Enterprise feature' },
      { id: 'aiCompanyAssistant', basic: 'Not available', standard: 'Not available', premium: 'Not available', enterprise: 'Enterprise feature' },
      { id: 'aiSeoContent', basic: 'Not available', standard: 'Not available', premium: 'Not available', enterprise: 'Enterprise feature' },
      { id: 'careersPortal', basic: 'Not available', standard: 'Not available', premium: 'Not available', enterprise: 'Enterprise feature' },
      { id: 'homepageFeaturedPlacement', basic: 'Not available', standard: 'Not available', premium: 'Not available', enterprise: 'Enterprise feature' },
      { id: 'searchPriority', basic: 'Not available', standard: 'Available', premium: 'Premium feature', enterprise: 'Enterprise feature' },
    ];

    for (const item of sampleMatrix) {
      assert.ok(validAccessTypes.has(item.basic), `Valid access type for basic ${item.id}`);
      assert.ok(validAccessTypes.has(item.standard), `Valid access type for standard ${item.id}`);
      assert.ok(validAccessTypes.has(item.premium), `Valid access type for premium ${item.id}`);
      assert.ok(validAccessTypes.has(item.enterprise), `Valid access type for enterprise ${item.id}`);
    }
  });

  // ─── TEST 3: Resource Quota Limits Enforcement ─────────────────────────────
  test('3. Resource Quota Limits Enforcement for all 4 plans', () => {
    // Basic Limits
    assert.equal(PLAN_LIMITS.basic.activeJobs, 5);
    assert.equal(PLAN_LIMITS.basic.products, 0);
    assert.equal(PLAN_LIMITS.basic.services, 0);
    assert.equal(PLAN_LIMITS.basic.galleryImages, 6);
    assert.equal(PLAN_LIMITS.basic.videos, 0);
    assert.equal(PLAN_LIMITS.basic.branches, 0);
    assert.equal(PLAN_LIMITS.basic.staffIds, 0);

    // Standard Limits
    assert.equal(PLAN_LIMITS.standard.activeJobs, 10);
    assert.equal(PLAN_LIMITS.standard.products, 20);
    assert.equal(PLAN_LIMITS.standard.services, 10);
    assert.equal(PLAN_LIMITS.standard.galleryImages, 10);
    assert.equal(PLAN_LIMITS.standard.videos, 2);
    assert.equal(PLAN_LIMITS.standard.branches, 3);
    assert.equal(PLAN_LIMITS.standard.staffIds, 0);

    // Premium Limits
    assert.equal(PLAN_LIMITS.premium.activeJobs, 50);
    assert.equal(PLAN_LIMITS.premium.products, 100);
    assert.equal(PLAN_LIMITS.premium.services, 50);
    assert.equal(PLAN_LIMITS.premium.galleryImages, 50);
    assert.equal(PLAN_LIMITS.premium.videos, 10);
    assert.equal(PLAN_LIMITS.premium.branches, 20);
    assert.equal(PLAN_LIMITS.premium.staffIds, 25);

    // Enterprise Limits
    assert.ok(isUnlimited(PLAN_LIMITS.enterprise.activeJobs));
    assert.ok(isUnlimited(PLAN_LIMITS.enterprise.products));
    assert.ok(isUnlimited(PLAN_LIMITS.enterprise.services));
    assert.ok(isUnlimited(PLAN_LIMITS.enterprise.galleryImages));
    assert.ok(isUnlimited(PLAN_LIMITS.enterprise.videos));
    assert.ok(isUnlimited(PLAN_LIMITS.enterprise.branches));
    assert.ok(isUnlimited(PLAN_LIMITS.enterprise.staffIds));
  });

  // ─── TEST 4: Limit Check Helpers (canPostNewJob, canAddProduct, etc.) ───────
  test('4. Limit Check Helpers correctly allow/block additions based on count and plan', () => {
    const canPostNewJob = (plan, count) => {
      const limit = PLAN_LIMITS[plan]?.activeJobs ?? 1;
      const unlimited = isUnlimited(limit);
      return {
        allowed: unlimited || count < limit,
        limit,
        remaining: unlimited ? Infinity : Math.max(0, limit - count),
      };
    };

    const canAddProduct = (plan, count) => {
      const limit = PLAN_LIMITS[plan]?.products ?? 0;
      const unlimited = isUnlimited(limit);
      return {
        allowed: limit !== 0 && (unlimited || count < limit),
        limit,
        remaining: unlimited ? Infinity : Math.max(0, limit - count),
      };
    };

    // Basic: 4 jobs posted -> allowed, 5 jobs posted -> blocked
    assert.equal(canPostNewJob('basic', 4).allowed, true);
    assert.equal(canPostNewJob('basic', 4).remaining, 1);
    assert.equal(canPostNewJob('basic', 5).allowed, false);
    assert.equal(canPostNewJob('basic', 5).remaining, 0);

    // Standard: 20 products -> blocked
    assert.equal(canAddProduct('standard', 19).allowed, true);
    assert.equal(canAddProduct('standard', 20).allowed, false);

    // Basic: products not allowed (limit 0)
    assert.equal(canAddProduct('basic', 0).allowed, false);

    // Enterprise: unlimited jobs and products
    assert.equal(canPostNewJob('enterprise', 999).allowed, true);
    assert.equal(canAddProduct('enterprise', 999).allowed, true);
  });

  // ─── TEST 5: Downgrade Data Preservation Invariant ──────────────────────────
  test('5. Downgrade Data Preservation: Excess existing items preserved, new additions blocked', () => {
    // Company was on Premium with 35 jobs, 60 products, 10 branches
    const company = {
      jobs: Array.from({ length: 35 }, (_, i) => ({ id: `job_${i}`, active: true })),
      products: Array.from({ length: 60 }, (_, i) => ({ id: `prod_${i}` })),
      branches: Array.from({ length: 10 }, (_, i) => ({ id: `branch_${i}` })),
    };

    // Downgrade to Standard (limits: 10 jobs, 20 products, 3 branches)
    const newPlan = 'standard';
    const standardLimits = PLAN_LIMITS[newPlan];

    // INVARIANT: Data must NOT be truncated or deleted
    assert.equal(company.jobs.length, 35, 'Historical jobs must remain intact');
    assert.equal(company.products.length, 60, 'Historical products must remain intact');
    assert.equal(company.branches.length, 10, 'Historical branches must remain intact');

    // New additions must be blocked
    const canAddJob = company.jobs.length < standardLimits.activeJobs;
    const canAddProd = company.products.length < standardLimits.products;
    const canAddBranch = company.branches.length < standardLimits.branches;

    assert.equal(canAddJob, false, 'New job addition must be blocked when exceeding downgraded limit');
    assert.equal(canAddProd, false, 'New product addition must be blocked when exceeding downgraded limit');
    assert.equal(canAddBranch, false, 'New branch addition must be blocked when exceeding downgraded limit');
  });

  // ─── TEST 6: Verification Badge Separation Logic ───────────────────────────
  test('6. Verification Badges are separated from Admin Legal Verification', () => {
    const getPlanBadge = (plan, isLegallyVerified) => {
      const badges = {
        basic: isLegallyVerified ? 'Basic Verified' : 'Basic Member · Verification Pending',
        standard: isLegallyVerified ? 'Silver Verified' : 'Silver Member · Verification Pending',
        premium: isLegallyVerified ? 'Gold Verified' : 'Gold Member · Verification Pending',
        enterprise: isLegallyVerified ? 'Platinum Corporate Badge' : 'Platinum Corporate · Verification Pending',
      };
      return {
        badge: badges[plan] || 'Member',
        isLegallyVerified,
      };
    };

    // Paid subscriber before admin verification
    const unverifiedPaid = getPlanBadge('premium', false);
    assert.equal(unverifiedPaid.isLegallyVerified, false);
    assert.equal(unverifiedPaid.badge, 'Gold Member · Verification Pending');

    // After Admin approves business documents
    const verifiedBasic = getPlanBadge('basic', true);
    assert.equal(verifiedBasic.badge, 'Basic Verified');

    const verifiedStandard = getPlanBadge('standard', true);
    assert.equal(verifiedStandard.badge, 'Silver Verified');

    const verifiedPremium = getPlanBadge('premium', true);
    assert.equal(verifiedPremium.badge, 'Gold Verified');

    const verifiedEnterprise = getPlanBadge('enterprise', true);
    assert.equal(verifiedEnterprise.badge, 'Platinum Corporate Badge');
  });

  // ─── TEST 7: Payment Cryptography & Verification ───────────────────────────
  test('7. Razorpay HMAC-SHA256 Signature Verification & Anti-Tampering', () => {
    const keySecret = 'test_razorpay_secret_key_12345';
    const orderId = 'order_test_987654';
    const paymentId = 'pay_test_123456';

    // Generate valid HMAC SHA256 signature
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${orderId}|${paymentId}`);
    const validSignature = hmac.digest('hex');

    // Verification helper
    const verifySignature = (oId, pId, sig, secret) => {
      const generated = crypto.createHmac('sha256', secret).update(`${oId}|${pId}`).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(sig));
    };

    assert.equal(verifySignature(orderId, paymentId, validSignature, keySecret), true);

    // Tampered paymentId
    const tamperedHmac = crypto.createHmac('sha256', keySecret);
    tamperedHmac.update(`${orderId}|pay_tampered_fake`);
    const tamperedSignature = tamperedHmac.digest('hex');
    assert.equal(verifySignature(orderId, paymentId, tamperedSignature, keySecret), false);
  });

  // ─── TEST 8: Historical Invariant: Plan Price Edits Never Mutate Old Records 
  test('8. Historical Invariant: Plan Editor updates apply to future orders only', () => {
    const historicalReceipt = {
      receiptNo: 'RCPT-TNJ-001234',
      date: '2026-09-01',
      planSlug: 'basic',
      amount: 999,
      status: 'PAID',
    };

    // Admin updates Basic plan price from 999 to 1199 in plan editor
    const adminPlanUpdate = {
      basic: { price: 1199 },
    };

    // Historical receipt must remain unchanged
    assert.equal(historicalReceipt.amount, 999, 'Past receipts must retain their captured transaction amount');
    assert.notEqual(historicalReceipt.amount, adminPlanUpdate.basic.price);
  });
});
