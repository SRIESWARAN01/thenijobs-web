import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

describe('THENIJOBS API Security, Authentication & Cryptography Tests', () => {
  test('Timing-Safe CRON_SECRET Verification Logic', () => {
    const serverSecret = 'test_cron_secret_32_bytes_long_value_123';
    const validHeader = 'Bearer test_cron_secret_32_bytes_long_value_123';
    const invalidHeader = 'Bearer wrong_secret';

    const verifyToken = (header) => {
      if (!header || !header.startsWith('Bearer ')) return false;
      const token = header.slice(7);
      if (token.length !== serverSecret.length) return false;
      return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(serverSecret));
    };

    assert.equal(verifyToken(validHeader), true, 'Valid Bearer token must pass timing-safe check');
    assert.equal(verifyToken(invalidHeader), false, 'Invalid Bearer token must be rejected');
    assert.equal(verifyToken(''), false, 'Empty header must be rejected');
    assert.equal(verifyToken(null), false, 'Null header must be rejected');
  });

  test('Razorpay HMAC-SHA256 Signature Verification', () => {
    const orderId = 'order_DA291038102';
    const paymentId = 'pay_9821381203';
    const secret = 'rzp_test_secret_12345';

    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Verification check
    const verifySignature = (oId, pId, sig, sec) => {
      const generated = crypto.createHmac('sha256', sec).update(`${oId}|${pId}`).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(sig));
    };

    assert.equal(
      verifySignature(orderId, paymentId, expectedSignature, secret),
      true,
      'Valid HMAC-SHA256 signature must be accepted'
    );

    assert.throws(() => {
      // Tampered signature
      verifySignature(orderId, paymentId, 'tampered_signature_12345678901234567890', secret);
    }, 'Mismatched buffer lengths or tampered signature must fail safe');
  });

  test('Admin Bearer Token Authorization Structure', () => {
    const validateAdminHeader = (authHeader) => {
      if (!authHeader) return { authorized: false, error: 'Unauthorized: Missing Authorization header' };
      if (!authHeader.startsWith('Bearer ')) return { authorized: false, error: 'Unauthorized: Invalid format' };
      const token = authHeader.split('Bearer ')[1]?.trim();
      if (!token) return { authorized: false, error: 'Unauthorized: Empty token' };
      return { authorized: true, token };
    };

    assert.equal(validateAdminHeader(null).authorized, false);
    assert.equal(validateAdminHeader('Basic abc123').authorized, false);
    assert.equal(validateAdminHeader('Bearer ').authorized, false);
    assert.equal(validateAdminHeader('Bearer valid_token_xyz').authorized, true);
  });

  test('Seeker Privacy Masking Rules', () => {
    const rawSeekerProfile = {
      fullName: 'Anbarasan S',
      phone: '+91 93605 19460',
      email: 'anbu@example.com',
      address: 'North Street, Theni',
      resumeUrl: 'https://storage.googleapis.com/resumes/123.pdf',
      isPortfolioPublic: true,
      privacySettings: {
        hidePhone: true,
        hideEmail: true,
        hideAddress: true,
        hideResume: true,
      },
    };

    const maskProfileForPublic = (profile) => {
      if (!profile.isPortfolioPublic) return null;
      return {
        fullName: profile.fullName,
        phone: profile.privacySettings?.hidePhone ? undefined : profile.phone,
        email: profile.privacySettings?.hideEmail ? undefined : profile.email,
        address: profile.privacySettings?.hideAddress ? undefined : profile.address,
        resumeUrl: profile.privacySettings?.hideResume ? undefined : profile.resumeUrl,
      };
    };

    const publicView = maskProfileForPublic(rawSeekerProfile);
    assert.equal(publicView.fullName, 'Anbarasan S');
    assert.equal(publicView.phone, undefined, 'Phone must be masked when hidePhone is true');
    assert.equal(publicView.email, undefined, 'Email must be masked when hideEmail is true');
    assert.equal(publicView.address, undefined, 'Address must be masked when hideAddress is true');
    assert.equal(publicView.resumeUrl, undefined, 'Resume must be masked when hideResume is true');
  });
});
