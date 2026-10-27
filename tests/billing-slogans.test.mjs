import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Import from sloganLibrary
import {
  MASTER_SLOGANS_LIBRARY,
  SLOGAN_CATEGORIES,
  BILLING_MODELS,
  resolveBillingSlogan,
  getDeterministicBillingSlogan,
  getDefaultModelMappings,
} from '../src/lib/billing/sloganLibrary.ts';

describe('THENIJOBS Dynamic Billing Slogans & Tagline Library Test Suite', () => {

  // ── TEST 1: AUTHORITATIVE 100 SLOGAN LIBRARY COMPLETENESS ───────────────────
  test('1. Master Slogan Library has exactly 100 slogans with 50 Tamil & 50 English', () => {
    assert.equal(MASTER_SLOGANS_LIBRARY.length, 100, 'Master library must contain exactly 100 slogans');

    const tamilSlogans = MASTER_SLOGANS_LIBRARY.filter((s) => s.language === 'ta');
    const englishSlogans = MASTER_SLOGANS_LIBRARY.filter((s) => s.language === 'en');

    assert.equal(tamilSlogans.length, 50, 'There must be exactly 50 Tamil slogans (1-50)');
    assert.equal(englishSlogans.length, 50, 'There must be exactly 50 English slogans (51-100)');

    // Verify IDs and numbers
    for (let i = 1; i <= 50; i++) {
      const slogan = MASTER_SLOGANS_LIBRARY.find((s) => s.sloganNumber === i);
      assert.ok(slogan, `Slogan #${i} must exist`);
      assert.equal(slogan.id, `slogan_${i}`);
      assert.equal(slogan.language, 'ta');
      assert.ok(slogan.text.trim().length > 0, `Slogan #${i} text must not be empty`);
      assert.equal(slogan.isActive, true, `Slogan #${i} must be active by default`);
    }

    for (let i = 51; i <= 100; i++) {
      const slogan = MASTER_SLOGANS_LIBRARY.find((s) => s.sloganNumber === i);
      assert.ok(slogan, `Slogan #${i} must exist`);
      assert.equal(slogan.id, `slogan_${i}`);
      assert.equal(slogan.language, 'en');
      assert.ok(slogan.text.trim().length > 0, `Slogan #${i} text must not be empty`);
      assert.equal(slogan.isActive, true, `Slogan #${i} must be active by default`);
    }

    // Ensure zero duplicated texts
    const textSet = new Set(MASTER_SLOGANS_LIBRARY.map((s) => s.text.trim()));
    assert.equal(textSet.size, 100, 'All 100 slogans must have unique texts');
  });

  // ── TEST 2: CATEGORY TAXONOMY & DISTRIBUTION ───────────────────────────────
  test('2. Slogans partition into 5 categories with 10 Tamil & 10 English each', () => {
    const categories = ['business_growth', 'recruitment', 'trust_quality', 'theni_pride', 'custom'];

    assert.equal(SLOGAN_CATEGORIES.length, 5, 'Must have exactly 5 categories defined');

    for (const cat of categories) {
      const catMeta = SLOGAN_CATEGORIES.find((c) => c.id === cat);
      assert.ok(catMeta, `Category meta for ${cat} must exist`);
      assert.ok(catMeta.label, `Category ${cat} must have label`);
      assert.ok(catMeta.labelTa, `Category ${cat} must have Tamil label`);
      assert.ok(catMeta.defaultSloganTaId, `Category ${cat} must have default Tamil slogan ID`);
      assert.ok(catMeta.defaultSloganEnId, `Category ${cat} must have default English slogan ID`);

      const taCount = MASTER_SLOGANS_LIBRARY.filter((s) => s.language === 'ta' && s.category === cat).length;
      const enCount = MASTER_SLOGANS_LIBRARY.filter((s) => s.language === 'en' && s.category === cat).length;

      assert.equal(taCount, 10, `Category ${cat} must have exactly 10 Tamil slogans`);
      assert.equal(enCount, 10, `Category ${cat} must have exactly 10 English slogans`);
    }
  });

  // ── TEST 3: 14 SUPPORTED BILLING MODELS ──────────────────────────────────────
  test('3. Exactly 14 Billing Models are defined with default Tamil & English slogan pairings', () => {
    const EXPECTED_MODELS = [
      'job_posting',
      'company_registration',
      'website_development',
      'website_hosting',
      'digital_marketing',
      'social_media_management',
      'recruitment_subscription',
      'company_verification',
      'digital_id_card',
      'custom_service',
      'subscription_basic',
      'subscription_standard',
      'subscription_premium',
      'subscription_enterprise',
    ];

    assert.equal(BILLING_MODELS.length, 14, 'Must define exactly 14 billing models');

    for (const modelId of EXPECTED_MODELS) {
      const model = BILLING_MODELS.find((m) => m.id === modelId);
      assert.ok(model, `Billing model "${modelId}" must be defined`);
      assert.ok(model.label, `Model "${modelId}" must have a human-readable label`);
      assert.ok(model.suggestedCategory, `Model "${modelId}" must have a suggested category`);

      // Verify that default IDs point to existing slogans
      const taSlogan = MASTER_SLOGANS_LIBRARY.find((s) => s.id === model.defaultSloganIdTa);
      assert.ok(taSlogan, `Model "${modelId}" default Tamil slogan "${model.defaultSloganIdTa}" must exist`);
      assert.equal(taSlogan.language, 'ta', `Model "${modelId}" default Tamil slogan must be 'ta'`);

      const enSlogan = MASTER_SLOGANS_LIBRARY.find((s) => s.id === model.defaultSloganIdEn);
      assert.ok(enSlogan, `Model "${modelId}" default English slogan "${model.defaultSloganIdEn}" must exist`);
      assert.equal(enSlogan.language, 'en', `Model "${modelId}" default English slogan must be 'en'`);
    }

    const defaultMappings = getDefaultModelMappings();
    assert.equal(Object.keys(defaultMappings).length, 14, 'Default mappings dictionary must contain 14 entries');
  });

  // ── TEST 4: LANGUAGE MATCHING INVARIANT ─────────────────────────────────────
  test('4. Language Matching Invariant: Invoices never receive slogans in the wrong language', () => {
    // Tamil invoices must ONLY receive Tamil slogans
    for (const model of BILLING_MODELS) {
      const resolvedTa = resolveBillingSlogan({
        language: 'ta',
        billingModel: model.id,
      });
      assert.equal(resolvedTa.sloganLanguage, 'ta', `Tamil invoice for model "${model.id}" must receive Tamil slogan`);

      // Verify resolved slogan text contains Tamil characters (Unicode block U+0B80 - U+0BFF)
      const hasTamilChar = /[\u0B80-\u0BFF]/.test(resolvedTa.sloganText);
      assert.ok(hasTamilChar, `Tamil slogan "${resolvedTa.sloganText}" must contain Tamil Unicode characters`);
    }

    // English invoices must ONLY receive English slogans
    for (const model of BILLING_MODELS) {
      const resolvedEn = resolveBillingSlogan({
        language: 'en',
        billingModel: model.id,
      });
      assert.equal(resolvedEn.sloganLanguage, 'en', `English invoice for model "${model.id}" must receive English slogan`);

      // English slogans should NOT contain Tamil Unicode characters
      const hasTamilChar = /[\u0B80-\u0BFF]/.test(resolvedEn.sloganText);
      assert.equal(hasTamilChar, false, `English slogan "${resolvedEn.sloganText}" must not contain Tamil characters`);
    }
  });

  // ── TEST 5: 4-TIER RESOLUTION HIERARCHY ────────────────────────────────────
  describe('5. 4-Tier Resolution Hierarchy', () => {
    test('Tier 1: Historical Invoice Snapshot is strictly preserved', () => {
      const historicalSlogan = {
        sloganId: 'slogan_custom_past_123',
        sloganText: 'வரலாற்று பில் வாசகம் — எப்போதும் மாறாது!',
        sloganLanguage: 'ta',
        sloganCategory: 'business_growth',
        sloganCycle: 3,
      };

      // Even if model is enterprise and requested language is english, historical snapshot must NOT be overwritten!
      const resolved = resolveBillingSlogan({
        language: 'en',
        billingModel: 'subscription_enterprise',
        existingSlogan: historicalSlogan,
      });

      assert.equal(resolved.sloganText, historicalSlogan.sloganText, 'Historical text must be preserved');
      assert.equal(resolved.sloganId, historicalSlogan.sloganId, 'Historical ID must be preserved');
      assert.equal(resolved.sloganCycle, historicalSlogan.sloganCycle, 'Historical cycle must be preserved');
    });

    test('Tier 2: Billing Model custom mapping takes precedence', () => {
      const customMappings = {
        website_development: {
          sloganIdTa: 'slogan_6', // "உங்கள் தொழிலுக்கு டிஜிட்டல் துணை!"
          sloganIdEn: 'slogan_56', // "Digital empowerment for your business!"
        },
      };

      const resolvedTa = resolveBillingSlogan(
        { language: 'ta', billingModel: 'website_development' },
        MASTER_SLOGANS_LIBRARY,
        customMappings
      );
      assert.equal(resolvedTa.sloganId, 'slogan_6');
      assert.equal(resolvedTa.sloganText, 'உங்கள் தொழிலுக்கு டிஜிட்டல் துணை!');

      const resolvedEn = resolveBillingSlogan(
        { language: 'en', billingModel: 'website_development' },
        MASTER_SLOGANS_LIBRARY,
        customMappings
      );
      assert.equal(resolvedEn.sloganId, 'slogan_56');
      assert.equal(resolvedEn.sloganText, 'Building Better Business Opportunities.');
    });

    test('Tier 3: Category default fallback when no billing model provided', () => {
      const resolvedRecruitmentTa = resolveBillingSlogan({
        language: 'ta',
        category: 'recruitment',
      });
      assert.equal(resolvedRecruitmentTa.sloganLanguage, 'ta');
      assert.equal(resolvedRecruitmentTa.sloganCategory, 'recruitment');

      const resolvedPrideEn = resolveBillingSlogan({
        language: 'en',
        category: 'theni_pride',
      });
      assert.equal(resolvedPrideEn.sloganLanguage, 'en');
      assert.equal(resolvedPrideEn.sloganCategory, 'theni_pride');
    });

    test('Tier 4: Global default fallback when no parameters or invalid inputs given', () => {
      const resolvedDefaultTa = resolveBillingSlogan({ language: 'ta' });
      assert.equal(resolvedDefaultTa.sloganLanguage, 'ta');
      assert.ok(resolvedDefaultTa.sloganText.length > 0);

      const resolvedDefaultEn = resolveBillingSlogan({ language: 'en' });
      assert.equal(resolvedDefaultEn.sloganLanguage, 'en');
      assert.ok(resolvedDefaultEn.sloganText.length > 0);
    });
  });

  // ── TEST 6: DETERMINISTIC SEED RESOLUTION CONSISTENCY ───────────────────────
  test('6. getDeterministicBillingSlogan produces stable results for identical seeds', () => {
    const seed = 'THENI-REC-INV-2026-9921';

    const firstTa = getDeterministicBillingSlogan(seed, 'ta');
    const secondTa = getDeterministicBillingSlogan(seed, 'ta');

    assert.equal(firstTa.sloganId, secondTa.sloganId, 'Same seed must yield same Tamil slogan ID');
    assert.equal(firstTa.sloganText, secondTa.sloganText, 'Same seed must yield same Tamil slogan text');
    assert.equal(firstTa.sloganLanguage, 'ta');

    const firstEn = getDeterministicBillingSlogan(seed, 'en');
    const secondEn = getDeterministicBillingSlogan(seed, 'en');

    assert.equal(firstEn.sloganId, secondEn.sloganId, 'Same seed must yield same English slogan ID');
    assert.equal(firstEn.sloganText, secondEn.sloganText, 'Same seed must yield same English slogan text');
    assert.equal(firstEn.sloganLanguage, 'en');
  });

  // ── TEST 7: ADMIN API & ROUTE SECURITY ──────────────────────────────────────
  test('7. Admin Slogans API endpoints exist and enforce admin authentication', () => {
    const apiRoutePath = resolve('src/app/api/admin/slogans/route.ts');
    const idRoutePath = resolve('src/app/api/admin/slogans/[id]/route.ts');
    const modelsRoutePath = resolve('src/app/api/admin/slogans/models/route.ts');
    const resetRoutePath = resolve('src/app/api/admin/slogans/reset/route.ts');

    assert.ok(existsSync(apiRoutePath), 'Main slogans API route file must exist');
    assert.ok(existsSync(idRoutePath), 'Single slogan [id] API route file must exist');
    assert.ok(existsSync(modelsRoutePath), 'Billing models API route file must exist');
    assert.ok(existsSync(resetRoutePath), 'Slogan reset cycle API route file must exist');

    const apiCode = readFileSync(apiRoutePath, 'utf8');
    const idCode = readFileSync(idRoutePath, 'utf8');
    const modelsCode = readFileSync(modelsRoutePath, 'utf8');
    const resetCode = readFileSync(resetRoutePath, 'utf8');

    assert.ok(apiCode.includes('verifyAdminAuth'), 'Main API route must check verifyAdminAuth');
    assert.ok(idCode.includes('verifyAdminAuth'), '[id] route must check verifyAdminAuth');
    assert.ok(modelsCode.includes('verifyAdminAuth'), 'models route must check verifyAdminAuth');
    assert.ok(resetCode.includes('verifyAdminAuth'), 'reset route must check verifyAdminAuth');
  });

  // ── TEST 8: PDF GENERATOR & CANVAS INTEGRATION ─────────────────────────────
  test('8. Receipt Generator and PDF integration supports slogans and document types', () => {
    const pdfPath = resolve('src/lib/pdf/receiptGenerator.ts');
    assert.ok(existsSync(pdfPath), 'receiptGenerator.ts must exist');

    const pdfCode = readFileSync(pdfPath, 'utf8');

    // Slogan fields in ReceiptData
    assert.ok(pdfCode.includes('sloganText?: string'), 'ReceiptData must have sloganText');
    assert.ok(pdfCode.includes("sloganLanguage?: 'ta' | 'en'"), 'ReceiptData must have sloganLanguage');
    assert.ok(pdfCode.includes('renderSloganBadgeCanvas'), 'receiptGenerator must have renderSloganBadgeCanvas');

    // Unicode Tamil font support
    assert.ok(pdfCode.includes('Mukta Malar'), 'Canvas font stack must include Mukta Malar for Tamil');
    assert.ok(pdfCode.includes('Noto Sans Tamil'), 'Canvas font stack must include Noto Sans Tamil');

    // Document types
    assert.ok(pdfCode.includes('documentType?:'), 'ReceiptData must support documentType');
    assert.ok(pdfCode.includes('TAX INVOICE'), 'Must handle TAX INVOICE title');
    assert.ok(pdfCode.includes('QUOTATION / ESTIMATE'), 'Must handle QUOTATION / ESTIMATE title');
  });
});
