import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Load .env.local for standalone test execution
try {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
} catch (e) {
  console.warn('Could not load .env.local:', e);
}

import { 
  verifyRazorpaySignature, 
  recordVerifiedPayment, 
  getOrReconcilePaymentStatus,
  buildReceiptDataFromPayment
} from '../src/lib/firebase/paymentAdminService';
import { ALL_VALID_PLAN_PRICES } from '../src/lib/constants';
import { generatePaymentReceiptPDF } from '../src/lib/pdf/receiptGenerator';

async function runTests() {
  console.log('====================================================');
  console.log('  RUNNING RAZORPAY PAYMENT & RECEIPT TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // TEST 1: Plan Price Matrix
  console.log('--- TEST GROUP 1: Plan Price Verification ---');
  assert(ALL_VALID_PLAN_PRICES['basic'] === 999, 'Basic plan is ₹999');
  assert(ALL_VALID_PLAN_PRICES['standard'] === 1800, 'Standard plan is ₹1800');
  assert(ALL_VALID_PLAN_PRICES['premium'] === 3500, 'Premium plan is ₹3500');
  assert(ALL_VALID_PLAN_PRICES['enterprise'] === 5000, 'Enterprise plan is ₹5000');
  assert(ALL_VALID_PLAN_PRICES['seeker_pro'] === 199, 'Seeker Pro plan is ₹199');
  assert(ALL_VALID_PLAN_PRICES['non_existent_plan'] === undefined, 'Unknown plan is rejected (undefined)');

  // TEST 2: Razorpay Signature Verification
  console.log('\n--- TEST GROUP 2: Razorpay HMAC Signature Verification ---');
  const testSecret = 'test_secret_key_12345';
  process.env.RAZORPAY_KEY_SECRET = testSecret;

  const testOrderId = `order_test_${Date.now()}`;
  const testPaymentId = `pay_test_${Date.now()}`;

  const validSignature = crypto
    .createHmac('sha256', testSecret)
    .update(`${testOrderId}|${testPaymentId}`)
    .digest('hex');

  const invalidSignature = 'bad_tampered_signature_hex_value';

  assert(
    verifyRazorpaySignature(testOrderId, testPaymentId, validSignature) === true,
    'Valid HMAC SHA256 signature passes verification'
  );
  assert(
    verifyRazorpaySignature(testOrderId, testPaymentId, invalidSignature) === false,
    'Tampered signature is strictly rejected'
  );
  assert(
    verifyRazorpaySignature(testOrderId, 'pay_different', validSignature) === false,
    'Signature with mismatched paymentId is rejected'
  );

  // TEST 3: Safe Database Writing & Idempotency
  console.log('\n--- TEST GROUP 3: Idempotent Payment Record & Safe Updates ---');
  const dummyUserId = `test_user_${Date.now()}`;
  const dummyCompanyId = `test_comp_${Date.now()}`;

  try {
    const record1 = await recordVerifiedPayment({
      orderId: testOrderId,
      paymentId: testPaymentId,
      signature: validSignature,
      planSlug: 'standard',
      planName: 'Standard Plan',
      amount: 480,
      userId: dummyUserId,
      companyId: dummyCompanyId,
      companyName: 'Test Automation Corp',
      companyAddress: 'Theni Bazaar, Theni District, Tamil Nadu',
      companyPhone: '9360519460',
      companyGst: '33AAAAA0000A1Z5',
      userEmail: 'test@thenijobs.com',
      source: 'client_verify',
    });

    assert(record1.success === true, 'First payment recording succeeds without throwing NOT_FOUND');
    assert(record1.receiptNo.startsWith('THENI-REC-'), 'Generates valid THENI-REC-* receipt number');
    assert(record1.receiptData.amount === 480, 'Receipt data contains correct verified amount');
    assert(record1.receiptData.status === 'PAID / ACTIVE', 'Receipt data reflects PAID / ACTIVE status');

    // Calling again with same paymentId (Idempotency test)
    const record2 = await recordVerifiedPayment({
      orderId: testOrderId,
      paymentId: testPaymentId,
      planSlug: 'standard',
      amount: 480,
      userId: dummyUserId,
      source: 'client_verify',
    });

    assert(record2.alreadyProcessed === true, 'Idempotency guard prevents duplicate payment doc');
    assert(record2.receiptNo === record1.receiptNo, 'Receipt number is consistent across duplicate callbacks');
  } catch (err: any) {
    assert(false, 'Safe database write failed', err?.message || err);
  }

  // TEST 4: Reconciliation Query
  console.log('\n--- TEST GROUP 4: Reconciliation Query ---');
  try {
    const reconResult = await getOrReconcilePaymentStatus(testOrderId, testPaymentId);
    assert(reconResult.exists === true, 'Reconciliation locates recorded payment in Firestore');
    assert(reconResult.isPaid === true, 'Reconciliation confirms status is paid');
    assert(reconResult.receiptData?.paymentId === testPaymentId, 'Reconciliation returns verified receipt data');
  } catch (err: any) {
    assert(false, 'Reconciliation check threw error', err?.message || err);
  }

  // TEST 5: PDF Receipt Generation
  console.log('\n--- TEST GROUP 5: PDF Receipt Vector Generator ---');
  try {
    const sampleReceipt = buildReceiptDataFromPayment({
      receiptNo: 'THENI-REC-PROD01',
      paymentId: 'pay_prod_verified',
      orderId: 'order_prod_123',
      amount: 480,
      plan: 'standard',
      planName: 'Standard Annual Plan',
      companyName: 'Theni Valley Tech',
      companyAddress: 'Periyakulam Road, Theni - 625531',
      companyPhone: '9360519460',
      userEmail: 'support@thenijobs.com',
      status: 'PAID / ACTIVE',
      sloganText: 'வணிக வளர்ச்சிக்கு நம்பகமான களம்',
      sloganLanguage: 'ta',
      sloganId: 'SLOGAN-TJ-01',
    });

    const pdf = await generatePaymentReceiptPDF(sampleReceipt);
    const pdfBlob = pdf.output('arraybuffer');
    assert(pdfBlob.byteLength > 1000, `PDF generated successfully (size: ${pdfBlob.byteLength} bytes)`);
  } catch (err: any) {
    assert(false, 'PDF receipt generator threw error', err?.message || err);
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
