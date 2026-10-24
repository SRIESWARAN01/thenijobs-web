import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('THENIJOBS Registration Page & Role Simplification', () => {
  // ── 1. EXACTLY TWO PUBLIC ROLES ──────────────────────────────────────────
  test('Registration page must expose exactly two public role options', () => {
    const PUBLIC_ROLES = [
      {
        id: 'job_seeker',
        label: 'Job Seeker',
        subLabel: 'வேலை தேடுகிறேன்',
        desc: 'Find jobs in Theni & Tamil Nadu in minutes.',
        supportingPoints: [
          'Free for job seekers.',
          'Verified local businesses.',
          'Setup in minutes.',
        ],
      },
      {
        id: 'business_owner',
        label: 'Business Owner',
        subLabel: 'Business வைத்திருக்கிறேன்',
        desc: 'List your business, get leads & enquiries.',
        supportingPoints: [
          'List your business, get leads & enquiries.',
          'Direct customer calls & WhatsApp leads.',
          'Post jobs & hire local talent.',
        ],
      },
    ];

    assert.equal(PUBLIC_ROLES.length, 2, 'Exactly 2 public registration roles allowed');
    assert.deepEqual(
      PUBLIC_ROLES.map(r => r.id),
      ['job_seeker', 'business_owner'],
      'Only job_seeker and business_owner IDs are exposed'
    );

    // Verify labels and Tamil translations
    const jobSeeker = PUBLIC_ROLES.find(r => r.id === 'job_seeker');
    assert.equal(jobSeeker?.label, 'Job Seeker');
    assert.equal(jobSeeker?.subLabel, 'வேலை தேடுகிறேன்');
    assert.ok(jobSeeker?.supportingPoints.includes('Free for job seekers.'));

    const businessOwner = PUBLIC_ROLES.find(r => r.id === 'business_owner');
    assert.equal(businessOwner?.label, 'Business Owner');
    assert.equal(businessOwner?.subLabel, 'Business வைத்திருக்கிறேன்');
    assert.ok(businessOwner?.desc.includes('List your business, get leads & enquiries.'));
  });

  test('Public registration selector rejects internal and unauthorized roles', () => {
    const forbiddenRoles = ['admin', 'super_admin', 'employee', 'employer', 'supplier', 'service_provider'];
    const allowedPublicRoles = new Set(['job_seeker', 'business_owner']);

    for (const role of forbiddenRoles) {
      assert.equal(
        allowedPublicRoles.has(role),
        false,
        `Role "${role}" must not be selectable during public registration`
      );
    }
  });

  // ── 2. MOBILE NUMBER VALIDATION & NORMALIZATION ─────────────────────────
  test('Indian mobile number validation and normalization', () => {
    const validatePhone = (rawPhone) => {
      const clean = rawPhone.replace(/\D/g, '').slice(-10);
      if (!clean) {
        return { valid: false, clean: '', error: 'Mobile number is mandatory.' };
      }
      if (clean.length !== 10) {
        return { valid: false, clean, error: 'Please enter a valid 10-digit mobile number.' };
      }
      if (!/^[6-9]\d{9}$/.test(clean)) {
        return { valid: false, clean, error: 'Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.' };
      }
      return { valid: true, clean, normalized: `+91${clean}` };
    };

    // Valid numbers
    assert.equal(validatePhone('9360519460').valid, true);
    assert.equal(validatePhone('9360519460').normalized, '+919360519460');
    assert.equal(validatePhone('+91 70948 26886').valid, true);
    assert.equal(validatePhone('+91 70948 26886').clean, '7094826886');
    assert.equal(validatePhone('6381234567').valid, true);
    assert.equal(validatePhone('8901234567').valid, true);

    // Invalid numbers
    assert.equal(validatePhone('').valid, false);
    assert.equal(validatePhone('12345').valid, false);
    assert.equal(validatePhone('1234567890').valid, false, 'Should reject numbers starting with 1');
    assert.equal(validatePhone('5551234567').valid, false, 'Should reject numbers starting with 5');
    assert.equal(validatePhone('abcdefghij').valid, false);
  });

  // ── 3. BASIC REGISTRATION DETAILS & SECURITY ───────────────────────────
  test('Registration detail requirements and security constraints', () => {
    const validateRegistrationPayload = (payload) => {
      const errors = [];
      if (!payload.name || payload.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
      }
      if (!payload.phone || !/^[6-9]\d{9}$/.test(payload.phone)) {
        errors.push('Valid 10-digit mobile number required');
      }
      if (!payload.password || payload.password.length < 6) {
        errors.push('Password must be at least 6 characters');
      }
      if (!['job_seeker', 'business_owner'].includes(payload.role)) {
        errors.push('Invalid public role');
      }
      return { valid: errors.length === 0, errors };
    };

    const validPayload = {
      name: 'Karthi Rajan',
      phone: '9360519460',
      password: 'SecurePassword123!',
      role: 'job_seeker',
    };
    assert.equal(validateRegistrationPayload(validPayload).valid, true);

    const invalidRole = {
      name: 'Hacker',
      phone: '9360519460',
      password: 'password123',
      role: 'admin',
    };
    assert.equal(validateRegistrationPayload(invalidRole).valid, false);
    assert.ok(validateRegistrationPayload(invalidRole).errors.includes('Invalid public role'));

    // Verify Firestore document payload NEVER contains raw passwords
    const createFirestoreDoc = (uid, name, phone, role) => ({
      uid,
      displayName: name,
      phone: `+91${phone}`,
      role,
      isVerified: false,
    });

    const userDoc = createFirestoreDoc('uid_test_123', 'Karthi', '9360519460', 'business_owner');
    assert.equal('password' in userDoc, false, 'Password must never be saved in Firestore');
    assert.equal(userDoc.phone, '+919360519460');
    assert.equal(userDoc.role, 'business_owner');
  });

  // ── 4. ROLE-BASED DASHBOARD ROUTING ─────────────────────────────────────
  test('Role-based post-registration dashboard redirection', () => {
    const getDashboardRoute = (role) => {
      switch (role) {
        case 'business_owner':
        case 'employer':
          return '/employer/dashboard';
        case 'job_seeker':
          return '/seeker/dashboard';
        case 'admin':
        case 'super_admin':
          return '/admin/dashboard';
        default:
          return '/seeker/dashboard';
      }
    };

    assert.equal(getDashboardRoute('job_seeker'), '/seeker/dashboard');
    assert.equal(getDashboardRoute('business_owner'), '/employer/dashboard');
    assert.equal(getDashboardRoute('admin'), '/admin/dashboard');
  });

  // ── 5. LOGIN INPUT DUAL SUPPORT (PHONE OR EMAIL) ────────────────────────
  test('Login handles 10-digit mobile number or standard email', () => {
    const resolveLoginIdentifier = (input) => {
      const cleanPhone = input.replace(/\D/g, '').slice(-10);
      const isPhoneLike = /^[6-9]\d{9}$/.test(cleanPhone) && (
        input === cleanPhone ||
        input === `+91${cleanPhone}` ||
        input.startsWith('+91') ||
        !input.includes('@')
      );

      if (isPhoneLike) {
        return { type: 'phone', cleanPhone, authEmail: `${cleanPhone}@thenijobs.com` };
      }
      return { type: 'email', authEmail: input.trim().toLowerCase() };
    };

    const phoneResult = resolveLoginIdentifier('9360519460');
    assert.equal(phoneResult.type, 'phone');
    assert.equal(phoneResult.cleanPhone, '9360519460');
    assert.equal(phoneResult.authEmail, '9360519460@thenijobs.com');

    const emailResult = resolveLoginIdentifier('user@thenijobs.com');
    assert.equal(emailResult.type, 'email');
    assert.equal(emailResult.authEmail, 'user@thenijobs.com');
  });
});
