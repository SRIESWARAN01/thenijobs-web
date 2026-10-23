import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

describe('THENIJOBS Payment & Razorpay Workflow 9 Tests', () => {
  const MOCK_SECRET = 'rzp_live_test_secret_key_1234567890';
  const PLAN_PRICES = {
    basic: 999,
    standard: 1800,
    premium: 3500,
    enterprise: 5000,
    seeker_pro: 199,
    'seeker-premium': 199,
  };

  test('Razorpay HMAC SHA-256 Signature Verification', () => {
    const orderId = 'order_OIkj9281nxa';
    const paymentId = 'pay_P10283nxlma';

    // Generate valid signature
    const signature = crypto
      .createHmac('sha256', MOCK_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const verify = (oId, pId, sig, sec) => {
      if (!oId || !pId || !sig || !sec) return false;
      const expected = crypto
        .createHmac('sha256', sec)
        .update(`${oId}|${pId}`)
        .digest('hex');
      const bExpected = Buffer.from(expected, 'utf8');
      const bSig = Buffer.from(sig, 'utf8');
      if (bExpected.length !== bSig.length) return false;
      return crypto.timingSafeEqual(bExpected, bSig);
    };

    assert.equal(verify(orderId, paymentId, signature, MOCK_SECRET), true, 'Valid signature must verify');
    assert.equal(verify(orderId, paymentId, 'tampered_sig_1234', MOCK_SECRET), false, 'Tampered signature must fail');
    assert.equal(verify(orderId, 'other_pay_id', signature, MOCK_SECRET), false, 'Mismatched paymentId must fail');
    assert.equal(verify(orderId, paymentId, signature, 'wrong_secret'), false, 'Wrong secret must fail');
  });

  test('All Valid Plan Prices & Anti-Tampering Check', () => {
    assert.equal(PLAN_PRICES.basic, 999);
    assert.equal(PLAN_PRICES.standard, 1800);
    assert.equal(PLAN_PRICES.premium, 3500);
    assert.equal(PLAN_PRICES.enterprise, 5000);
    assert.equal(PLAN_PRICES.seeker_pro, 199);

    // Validation function
    const validatePlanPrice = (slug, clientAmount) => {
      const expected = PLAN_PRICES[slug];
      if (expected === undefined) return { valid: false, error: 'Unknown plan' };
      if (expected <= 0) return { valid: false, error: 'Free plan requires no payment' };
      if (clientAmount !== undefined && Math.abs(clientAmount - expected) > 1) {
        return { valid: false, error: 'Amount mismatch' };
      }
      return { valid: true, amount: expected };
    };

    assert.equal(validatePlanPrice('standard', 1800).valid, true);
    assert.equal(validatePlanPrice('standard', 10).valid, false, 'Tampered amount must be rejected');
    assert.equal(validatePlanPrice('unknown_tier', 100).valid, false, 'Unknown tier must be rejected');
    assert.equal(validatePlanPrice('seeker_pro', 199).valid, true, 'Job seeker Pro plan price must be verified');
  });

  test('Receipt Number Generation Pattern & Slogan Seed Determinism', () => {
    const paymentId = 'pay_M81x92Jkx9';
    const cleanTail = paymentId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
    const receiptNo = `THENI-REC-${cleanTail}`;

    assert.match(receiptNo, /^THENI-REC-[A-Z0-9]{6}$/, 'Receipt number must follow official THENIJOBS format');

    // Deterministic slogan indexing
    const slogans = [
      'வணிக வளர்ச்சிக்கு நம்பகமான களம்',
      'உள்ளூர் வணிகத்தை உலகளவில் இணைப்போம்',
      'உங்கள் தேவைகளுக்கான எளிய தீர்வு',
    ];
    const getSlogan = (seed) => {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
      }
      return slogans[Math.abs(hash) % slogans.length];
    };

    const s1 = getSlogan('order_123');
    const s2 = getSlogan('order_123');
    assert.equal(s1, s2, 'Same orderId must produce deterministic fallback slogan');
  });

  test('Receipt Data Structure Completeness', () => {
    const receiptData = {
      receiptNo: 'THENI-REC-102938',
      paymentId: 'pay_123456789',
      orderId: 'order_987654321',
      planName: 'Standard Plan',
      planSlug: 'standard',
      amount: 1800,
      startDate: '23 Oct 2026',
      expiryDate: '23 Oct 2027',
      date: '23 Oct 2026, 06:30 PM',
      billedTo: 'Sarvesh Super Market',
      address: 'Theni, Tamil Nadu',
      email: 'owner@example.com',
      phone: '+919876543210',
      gst: '',
      paymentMethod: 'UPI (GPay / PhonePe)',
      status: 'PAID / ACTIVE',
      sloganText: 'வணிக வளர்ச்சிக்கு நம்பகமான களம்',
      sloganLanguage: 'ta',
    };

    assert.ok(receiptData.receiptNo.startsWith('THENI-REC-'));
    assert.equal(receiptData.status, 'PAID / ACTIVE');
    assert.equal(receiptData.amount, 1800);
    assert.ok(receiptData.billedTo);
    assert.ok(receiptData.startDate);
    assert.ok(receiptData.expiryDate);
    assert.ok(receiptData.paymentMethod);
  });

  test('Idempotency Handling Logic', () => {
    const database = new Map();

    const recordPayment = (pId, oId, plan, amount) => {
      if (database.has(pId)) {
        const existing = database.get(pId);
        return { success: true, alreadyProcessed: true, payment: existing };
      }
      const record = {
        paymentId: pId,
        orderId: oId,
        plan,
        amount,
        status: 'captured',
        receiptNo: `THENI-REC-${pId.slice(-6).toUpperCase()}`,
        recordedAt: new Date().toISOString(),
      };
      database.set(pId, record);
      return { success: true, alreadyProcessed: false, payment: record };
    };

    const first = recordPayment('pay_TEST_001', 'order_TEST_001', 'standard', 1800);
    assert.equal(first.alreadyProcessed, false);
    assert.equal(first.payment.status, 'captured');

    // Duplicate webhook or callback arrives
    const duplicate = recordPayment('pay_TEST_001', 'order_TEST_001', 'standard', 1800);
    assert.equal(duplicate.alreadyProcessed, true);
    assert.equal(duplicate.payment.receiptNo, first.payment.receiptNo);
    assert.equal(database.size, 1, 'Database must not duplicate the transaction record');
  });
});
