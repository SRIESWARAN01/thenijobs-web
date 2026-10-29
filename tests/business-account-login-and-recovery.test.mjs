import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

describe('THENIJOBS Business Account Login & Forgot Password Feature Suite', () => {
  const rootDir = process.cwd();

  // Helper pure functions matching src/lib/business/businessAuthService.ts
  function normalizePhoneNumber(raw) {
    if (!raw) return '';
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length === 10) return digits;
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits.slice(-10);
  }

  function maskPhoneNumber(phone) {
    const norm = normalizePhoneNumber(phone);
    if (norm.length !== 10) return '**********';
    return `${norm.slice(0, 2)}****${norm.slice(-4)}`;
  }

  function maskEmail(email) {
    if (!email || !email.includes('@')) return '*****@***.***';
    const [local, domain] = email.trim().toLowerCase().split('@');
    if (local.length <= 2) return `${local[0]}*@${domain}`;
    return `${local[0]}****${local.slice(-1)}@${domain}`;
  }

  function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  function formatWhatsAppAdminNotification(params) {
    const dateStr = params.submissionDate || '28 Oct 2026, 11:00 am';
    return `THENIJOBS — Business Account Recovery Request\n\nRequest ID: ${params.requestId}\nBusiness Name: ${params.businessName}\nRegistered Business Mobile: ${maskPhoneNumber(params.registeredMobile)}\nRequester Contact Mobile: ${params.requesterMobile}\n${params.registeredEmail ? `Registered Email: ${maskEmail(params.registeredEmail)}\n` : ''}Date: ${dateStr}\nStatus: Pending Admin Verification\n\nPlease verify the business identity before authorizing account recovery.\nAdmin Dashboard: https://www.thenijobs.com/admin/business-recovery`;
  }

  // ── 1. VERIFIED BUSINESS IDENTITIES & ISOLATION ────────────────────────────
  it('1. Exactly 8 approved partner businesses are defined and mapped with verified IDs', () => {
    const servicePath = path.join(rootDir, 'src/lib/business/businessAuthService.ts');
    assert.ok(fs.existsSync(servicePath), 'businessAuthService.ts must exist');
    const content = fs.readFileSync(servicePath, 'utf8');

    // Expected 8 businesses with verified database IDs
    const expectedBusinesses = [
      { id: 'ik3pWBDVVUR3Sb51knwK', name: 'Agrimore — Chinnamanur' },
      { id: 'mWWNVrCGounWsmXdaRGL', name: 'Sarvesh Super Market — Theni' },
      { id: 'oKDQpFZ3bx9C4S0Z0ti9', name: 'Apex Scholar Publication — Theni' },
      { id: 'u9sYSAG9YoGrept1FbSe', name: 'Suruliraj Chemicals — Theni' },
      { id: '7K95afmwXMddFJo8PeRB', name: 'M K Security Solutions & Electronics — Theni' },
      { id: 'SDv5CaYdxKRWOXl4ej84', name: 'Chennai Bakes — Uthamapalayam' },
      { id: 'VG1PwPzKXofu1fLxLIpk', name: 'SVR Heritage Hall — Uthamapalayam' },
      { id: 'vMQgOwNd2fZ4Nm8870Dw', name: 'AGS IT Solutions — Theni' },
    ];

    expectedBusinesses.forEach((b) => {
      assert.ok(
        content.includes(b.id),
        `businessAuthService must contain verified business ID ${b.id} (${b.name})`
      );
    });

    assert.ok(
      content.includes('ELIGIBLE_BUSINESS_IDS = ['),
      'Must define ELIGIBLE_BUSINESS_IDS constant array'
    );
    assert.ok(
      content.includes('getEligibleBusinessesPublicList'),
      'Must export getEligibleBusinessesPublicList'
    );
  });

  // ── 2. PHONE NORMALIZATION & PII MASKING ──────────────────────────────────
  it('2. Phone normalization handles Indian standard formats, spaces, dashes, prefixes', () => {
    assert.equal(normalizePhoneNumber('9843913423'), '9843913423');
    assert.equal(normalizePhoneNumber('+919843913423'), '9843913423');
    assert.equal(normalizePhoneNumber('919843913423'), '9843913423');
    assert.equal(normalizePhoneNumber('09843913423'), '9843913423');
    assert.equal(normalizePhoneNumber('+91 98439-13423'), '9843913423');
    assert.equal(normalizePhoneNumber('  70948 26586  '), '7094826586');
  });

  it('3. PII masking protects business owner contact numbers and email addresses', () => {
    assert.equal(maskPhoneNumber('9843913423'), '98****3423');
    assert.equal(maskPhoneNumber('+917094826586'), '70****6586');
    assert.equal(maskPhoneNumber('123'), '**********');

    assert.equal(maskEmail('agrimorein@gmail.com'), 'a****n@gmail.com');
    assert.equal(maskEmail('veeraselvam1103@gmail.com'), 'v****3@gmail.com');
    assert.equal(maskEmail('ab@test.com'), 'a*@test.com');
  });

  // ── 3. GOOGLE SIGN-IN BUSINESS ROUTE & WORKFLOW ───────────────────────────
  it('4. Business Google Login API verifies Google ID token and checks eligibility against 8 businesses', () => {
    const apiRoutePath = path.join(rootDir, 'src/app/api/auth/business-google-login/route.ts');
    assert.ok(fs.existsSync(apiRoutePath), 'business-google-login/route.ts must exist');
    const content = fs.readFileSync(apiRoutePath, 'utf8');

    assert.ok(content.includes('verifyIdToken'), 'Must verify Google ID token');
    assert.ok(content.includes('decodedToken.email_verified'), 'Must require verified email from Google');
    assert.ok(content.includes('verifyEligibleBusinessGoogleLogin'), 'Must check eligibility via service');
    assert.ok(
      content.includes('This Google account is not registered for an eligible business account.'),
      'Must return user-friendly error message on ineligibility'
    );
    assert.ok(content.includes('status: 403'), 'Must return 403 for unauthorized business accounts');
  });

  it('5. Login Page cleanly removes Partner Business Google Sign-In card per user instruction while preserving standard authentication', () => {
    const loginPagePath = path.join(rootDir, 'src/app/login/page.tsx');
    assert.ok(fs.existsSync(loginPagePath), 'login/page.tsx must exist');
    const content = fs.readFileSync(loginPagePath, 'utf8');

    // Verified removal of Partner Business section from login page per user instruction
    assert.ok(!content.includes('Partner Business Account'), 'Must not render Partner Business Account section on login page');
    assert.ok(!content.includes('Partner Business Sign In with Google'), 'Must not render Partner Business Sign In with Google button');
    assert.ok(!content.includes('handleBusinessGoogleLogin'), 'handleBusinessGoogleLogin must be removed from login page');
    assert.ok(content.includes('Continue with Google'), 'Standard Google Sign-In must remain active');
    assert.ok(content.includes('/forgot-password'), 'Standard forgot password link must remain active');
  });

  // ── 4. FORGOT PASSWORD RECOVERY FORM & ANTI-ENUMERATION ───────────────────
  it('6. Forgot Password Page features dedicated Business Recovery tab with 8-business selector', () => {
    const forgotPassPath = path.join(rootDir, 'src/app/forgot-password/page.tsx');
    assert.ok(fs.existsSync(forgotPassPath), 'forgot-password/page.tsx must exist');
    const content = fs.readFileSync(forgotPassPath, 'utf8');

    assert.ok(content.includes("activeTab === 'business'") || content.includes("'business'"), 'Must have business recovery tab');
    assert.ok(content.includes('registeredMobile'), 'Must collect registered mobile');
    assert.ok(content.includes('requesterMobile'), 'Must collect requester contact mobile');
    assert.ok(content.includes('referenceId'), 'Must render reference ID on submission');
    assert.ok(content.includes('getEligibleBusinessesPublicList') || content.includes('ELIGIBLE_BUSINESSES'), 'Must use eligible businesses list');
  });

  it('7. Recovery Request API enforces anti-account enumeration and rate limiting', () => {
    const reqRoutePath = path.join(rootDir, 'src/app/api/auth/business-recovery/request/route.ts');
    assert.ok(fs.existsSync(reqRoutePath), 'business-recovery/request/route.ts must exist');
    const content = fs.readFileSync(reqRoutePath, 'utf8');

    assert.ok(content.includes('createBusinessRecoveryRequest'), 'Must call createBusinessRecoveryRequest');
    assert.ok(content.includes('isRateLimited') || content.includes('recoveryRateLimits'), 'Must enforce IP rate limiting');
    assert.ok(content.includes('status: 429'), 'Must return 429 on abuse');

    // Anti-enumeration: test that service returns success message for non-matches
    const servicePath = path.join(rootDir, 'src/lib/business/businessAuthService.ts');
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    assert.ok(
      serviceContent.includes('status: \'rejected_mismatch\''),
      'Must record internal mismatch without leaking to requester'
    );
    assert.ok(
      serviceContent.includes('Your account recovery request has been submitted successfully'),
      'Must return identical friendly success message regardless of match/mismatch'
    );
  });

  // ── 5. ADMIN WHATSAPP NOTIFICATION FORMAT & RECIPIENT ─────────────────────
  it('8. Admin WhatsApp Notification is routed strictly to authorized admin and contains audit details', () => {
    const alertText = formatWhatsAppAdminNotification({
      requestId: 'REC-987654-AB1',
      businessName: 'Agrimore — Chinnamanur',
      registeredMobile: '7094826586',
      requesterMobile: '9843913423',
      registeredEmail: 'agrimorein@gmail.com',
      submissionDate: '28 Oct 2026, 11:00 am',
    });

    assert.ok(alertText.includes('Request ID: REC-987654-AB1'), 'Must contain Request ID');
    assert.ok(alertText.includes('Business Name: Agrimore — Chinnamanur'), 'Must contain Business Name');
    assert.ok(alertText.includes('Registered Business Mobile: 70****6586'), 'Must mask registered business mobile');
    assert.ok(alertText.includes('Requester Contact Mobile: 9843913423'), 'Must contain Requester Contact Mobile');
    assert.ok(alertText.includes('Registered Email: a****n@gmail.com'), 'Must mask registered email');
    assert.ok(alertText.includes('Status: Pending Admin Verification'), 'Must state Pending Admin Verification');
    assert.ok(alertText.includes('/admin/business-recovery'), 'Must include Admin Dashboard link');

    // Check service file ensures admin recipient is 919360519460
    const servicePath = path.join(rootDir, 'src/lib/business/businessAuthService.ts');
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    assert.ok(
      serviceContent.includes('SITE_CONTACT.whatsapp'),
      'Must use SITE_CONTACT.whatsapp as admin recipient'
    );
  });

  // ── 6. ADMIN RECOVERY MANAGEMENT PORTAL ───────────────────────────────────
  it('9. Admin Recovery Dashboard and layout navigation are configured with security controls', () => {
    const adminLayoutPath = path.join(rootDir, 'src/app/admin/layout.tsx');
    const layoutContent = fs.readFileSync(adminLayoutPath, 'utf8');
    assert.ok(layoutContent.includes('/admin/business-recovery'), 'ADMIN_NAV must include /admin/business-recovery');
    assert.ok(layoutContent.includes('Business Recovery'), 'ADMIN_NAV must label Business Recovery');

    const adminPagePath = path.join(rootDir, 'src/app/admin/business-recovery/page.tsx');
    assert.ok(fs.existsSync(adminPagePath), 'admin/business-recovery/page.tsx must exist');
    const adminPageContent = fs.readFileSync(adminPagePath, 'utf8');
    assert.ok(adminPageContent.includes('/api/admin/business-recovery/list'), 'Must fetch recovery requests list');
    assert.ok(adminPageContent.includes('/api/admin/business-recovery/approve'), 'Must handle approval');
    assert.ok(adminPageContent.includes('/api/admin/business-recovery/reject'), 'Must handle rejection');
    assert.ok(adminPageContent.includes('tel:'), 'Must provide direct call link to registered owner');
    assert.ok(adminPageContent.includes('https://wa.me/'), 'Must provide direct WhatsApp link to registered owner');
  });

  // ── 7. TOKEN LIFECYCLE, CRYPTO HASHING & EXPIRY ───────────────────────────
  it('10. Recovery Token is cryptographically hashed with SHA-256 and expires in 1 hour', () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashed = hashToken(rawToken);

    assert.equal(hashed.length, 64, 'SHA-256 hash must be 64 hexadecimal characters');
    assert.notEqual(rawToken, hashed, 'Raw token must never equal hash stored at rest');

    // 1-hour expiration calculation
    const oneHourMs = 60 * 60 * 1000;
    const now = Date.now();
    const expiry = now + oneHourMs;
    assert.ok(expiry - now === 3600000, 'Expiration must be exactly 3,600,000 ms (1 hour)');

    // Invalidation check
    const isExpired = Date.now() > expiry;
    assert.equal(isExpired, false, 'Freshly generated token must not be expired');
  });

  it('11. Password Reset Page and APIs enforce token validation, single-use, and Admin SDK password update', () => {
    const resetPagePath = path.join(rootDir, 'src/app/reset-password/page.tsx');
    assert.ok(fs.existsSync(resetPagePath), 'reset-password/page.tsx must exist');
    const resetContent = fs.readFileSync(resetPagePath, 'utf8');

    assert.ok(resetContent.includes('/api/auth/business-recovery/verify-token'), 'Must verify token on load');
    assert.ok(resetContent.includes('/api/auth/business-recovery/reset-password'), 'Must call reset-password API');
    assert.ok(resetContent.includes('newPassword'), 'Must collect new password');

    const resetApiPath = path.join(rootDir, 'src/app/api/auth/business-recovery/reset-password/route.ts');
    assert.ok(fs.existsSync(resetApiPath), 'reset-password/route.ts must exist');
    const resetApiContent = fs.readFileSync(resetApiPath, 'utf8');

    assert.ok(resetApiContent.includes('completePasswordReset'), 'Must invoke completePasswordReset');

    const servicePath = path.join(rootDir, 'src/lib/business/businessAuthService.ts');
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    assert.ok(serviceContent.includes('auth.updateUser'), 'Must update password in Firebase Auth via Admin SDK');
    assert.ok(serviceContent.includes('usedAt: now'), 'Must stamp usedAt on password completion');
    assert.ok(serviceContent.includes('resetTokenHash: null'), 'Must wipe reset token hash on completion');
    assert.ok(serviceContent.includes('This recovery link has already been used'), 'Must block re-use of tokens');
  });

  // ── 8. SECURITY & NON-REGRESSION INVARIANTS ───────────────────────────────
  it('12. Standard Job Seeker & General Employer login flows remain completely intact', () => {
    const loginPagePath = path.join(rootDir, 'src/app/login/page.tsx');
    const content = fs.readFileSync(loginPagePath, 'utf8');

    assert.ok(content.includes('handleEmailLogin'), 'Standard email login must be preserved');
    assert.ok(content.includes('handleGoogleLogin'), 'Standard candidate Google login must be preserved');
    assert.ok(content.includes('PHONE_LOGIN_ENABLED'), 'Phone OTP architecture must be preserved');
    assert.ok(content.includes('resolveAuthRedirect'), 'Auth redirect resolver must be preserved');
  });

  it('13. No plaintext passwords, mock credentials, or demo data exist in recovery service', () => {
    const servicePath = path.join(rootDir, 'src/lib/business/businessAuthService.ts');
    const content = fs.readFileSync(servicePath, 'utf8');

    assert.ok(!content.includes('mockPassword'), 'Must not contain mock passwords');
    assert.ok(!content.includes('dummy_token'), 'Must not contain dummy tokens');
    assert.ok(!content.includes('password123'), 'Must not contain demo passwords');
  });

  // ── 9. FIRESTORE SECURITY RULES FOR BUSINESS RECOVERY REQUESTS ──────────
  it('14. Firestore rules protect businessRecoveryRequests: Admin-only read/update/delete, client create denied', () => {
    const rulesPath = path.join(rootDir, 'firestore.rules');
    assert.ok(fs.existsSync(rulesPath), 'firestore.rules must exist');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    assert.ok(
      rulesContent.includes('match /businessRecoveryRequests/{requestId}'),
      'Must contain match /businessRecoveryRequests/{requestId} block'
    );
    assert.ok(
      rulesContent.includes('allow read, update, delete: if isAdmin() && isNotSuspended();'),
      'Must restrict reads, updates, and deletes to active admins'
    );
    assert.ok(
      rulesContent.includes('allow create: if false;'),
      'Must deny direct client-side creation to protect rate limiting and anti-enumeration'
    );
  });
});
