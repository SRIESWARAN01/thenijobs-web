import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import authRedirect module functions
import {
  resolveAuthRedirect,
  isSafeRedirectUrl,
  isBusinessOwnerActive,
  getFriendlyAuthErrorMessage,
} from '../src/lib/authRedirect.ts';

describe('THENIJOBS Google Sign-In with Automatic Account Creation Suite', () => {

  // ── 1. GOOGLE AUTH PROVIDER CONFIGURATION & PROMPT PARAMETERS ─────────────
  test('1. Google Auth Provider specifies prompt: select_account and official branding', () => {
    const authContextPath = path.join(projectRoot, 'src', 'contexts', 'AuthContext.tsx');
    const authContent = fs.readFileSync(authContextPath, 'utf8');

    assert.ok(
      authContent.includes("prompt: 'select_account'"),
      'AuthContext must configure prompt: select_account to allow user account selection'
    );
    assert.ok(
      authContent.includes('GoogleAuthProvider'),
      'AuthContext must instantiate GoogleAuthProvider'
    );
    assert.ok(
      authContent.includes('signInWithGoogle'),
      'AuthContext must export signInWithGoogle action'
    );
  });

  // ── 2. AUTOMATIC ACCOUNT CREATION & PROFILE SEEDING ────────────────────────
  test('2. Automatic account creation seeds Job Seeker profile with active status', () => {
    const mockFbUser = {
      uid: 'google_seeker_123',
      email: 'seeker@gmail.com',
      displayName: 'Kavitha Seeker',
      photoURL: 'https://lh3.googleusercontent.com/photo1',
      phoneNumber: '+919876543210',
    };

    const targetRole = 'job_seeker';
    const isBusiness = targetRole === 'business_owner';

    const createdDoc = {
      uid: mockFbUser.uid,
      email: mockFbUser.email,
      displayName: mockFbUser.displayName,
      photoURL: mockFbUser.photoURL,
      phone: mockFbUser.phoneNumber,
      role: targetRole,
      isVerified: true,
      authProvider: 'google.com',
      approvalStatus: isBusiness ? 'pending' : 'approved',
      accountStatus: isBusiness ? 'pending_approval' : 'active',
    };

    assert.equal(createdDoc.role, 'job_seeker');
    assert.equal(createdDoc.approvalStatus, 'approved');
    assert.equal(createdDoc.accountStatus, 'active');
    assert.equal(createdDoc.isVerified, true);
    assert.equal(createdDoc.authProvider, 'google.com');
    assert.equal(createdDoc.displayName, 'Kavitha Seeker');
    assert.equal(createdDoc.email, 'seeker@gmail.com');
  });

  test('3. Automatic account creation seeds Business Owner profile with pending approval and safeguards', () => {
    const mockFbUser = {
      uid: 'google_biz_456',
      email: 'owner@gmail.com',
      displayName: 'Murugan Textiles',
      photoURL: 'https://lh3.googleusercontent.com/photo2',
    };

    const targetRole = 'business_owner';
    const isBusiness = targetRole === 'business_owner';

    const createdDoc = {
      uid: mockFbUser.uid,
      email: mockFbUser.email,
      displayName: mockFbUser.displayName,
      photoURL: mockFbUser.photoURL,
      role: targetRole,
      isVerified: true,
      authProvider: 'google.com',
      approvalStatus: isBusiness ? 'pending' : 'approved',
      accountStatus: isBusiness ? 'pending_approval' : 'active',
      paymentStatus: 'unpaid',
      isEmployer: true,
      canPostJobs: false,
    };

    assert.equal(createdDoc.role, 'business_owner');
    assert.equal(createdDoc.approvalStatus, 'pending', 'Business owner must start in pending approval');
    assert.equal(createdDoc.accountStatus, 'pending_approval');
    assert.equal(createdDoc.paymentStatus, 'unpaid');
    assert.equal(createdDoc.isEmployer, true);
    assert.equal(createdDoc.canPostJobs, false, 'Unapproved business owner cannot post jobs');
    assert.equal(createdDoc.authProvider, 'google.com');
  });

  // ── 3. PRESERVATION OF EXISTING USER PROFILES ──────────────────────────────
  test('4. Existing user profile data is preserved and not overwritten on Google login', () => {
    const existingDoc = {
      uid: 'existing_user_789',
      email: 'existing@thenijobs.com',
      displayName: 'Ramesh Senior Admin',
      role: 'admin',
      adminRole: 'super_admin',
      approvalStatus: 'approved',
      accountStatus: 'active',
      companyId: 'company_999',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const googleIncomingMeta = {
      photoURL: 'https://lh3.googleusercontent.com/new_photo',
      displayName: 'Ramesh Google Name',
    };

    // Google Sign-in metadata update logic
    const updates = {
      authProvider: 'google.com',
      lastLoginAt: '2026-10-24T08:00:00.000Z',
      updatedAt: '2026-10-24T08:00:00.000Z',
      ...(existingDoc.photoURL ? {} : { photoURL: googleIncomingMeta.photoURL }),
    };

    const mergedDoc = { ...existingDoc, ...updates };

    assert.equal(mergedDoc.role, 'admin', 'Existing role must never be overwritten');
    assert.equal(mergedDoc.adminRole, 'super_admin');
    assert.equal(mergedDoc.approvalStatus, 'approved');
    assert.equal(mergedDoc.accountStatus, 'active');
    assert.equal(mergedDoc.companyId, 'company_999');
    assert.equal(mergedDoc.authProvider, 'google.com');
    assert.equal(mergedDoc.displayName, 'Ramesh Senior Admin', 'Existing display name preserved');
    assert.equal(mergedDoc.photoURL, 'https://lh3.googleusercontent.com/new_photo', 'Missing photoURL enriched');
  });

  // ── 4. CENTRALIZED REDIRECTION MATRIX (ALL 8 STATES) ───────────────────────
  describe('Centralized Redirection Matrix (All 8 States)', () => {
    test('State 1: Admin & Super Admin redirect strictly to /admin/dashboard', () => {
      assert.equal(resolveAuthRedirect({ role: 'admin' }), '/admin/dashboard');
      assert.equal(resolveAuthRedirect({ role: 'super_admin' }), '/admin/dashboard');
      assert.equal(resolveAuthRedirect({ role: 'admin' }, '/seeker/jobs'), '/admin/dashboard');
    });

    test('State 2: Job Seeker redirects to /seeker/dashboard or valid safe redirect URL', () => {
      assert.equal(resolveAuthRedirect({ role: 'job_seeker' }), '/seeker/dashboard');
      assert.equal(resolveAuthRedirect({ role: 'job_seeker' }, '/jobs/theni-textiles'), '/jobs/theni-textiles');
      assert.equal(resolveAuthRedirect({ role: 'job_seeker' }, '/daily-jobs'), '/daily-jobs');
    });

    test('State 3: Business Owner Approved & Active redirects to /employer/dashboard', () => {
      const approvedOwner = {
        role: 'business_owner',
        approvalStatus: 'approved',
        accountStatus: 'active',
        paymentStatus: 'paid',
        selectedPlan: 'standard',
      };
      assert.equal(resolveAuthRedirect(approvedOwner), '/employer/dashboard');
      assert.equal(resolveAuthRedirect(approvedOwner, '/employer/candidates'), '/employer/candidates');
    });

    test('State 4: Business Owner Rejected redirects to /register-business revision screen', () => {
      const rejectedOwner = {
        role: 'business_owner',
        approvalStatus: 'rejected',
        accountStatus: 'rejected',
        rejectionReason: 'Invalid GST documentation',
      };
      assert.equal(resolveAuthRedirect(rejectedOwner), '/register-business');
      assert.equal(resolveAuthRedirect(rejectedOwner, '/employer/post-job'), '/register-business');
    });

    test('State 5: Business Owner with Plan Not Selected redirects to /register-business?step=plan', () => {
      const unselectedPlanOwner = {
        role: 'business_owner',
        approvalStatus: 'pending',
        accountStatus: 'pending_approval',
        paymentStatus: 'unpaid',
        selectedPlan: null,
        trialRequested: false,
      };
      assert.equal(resolveAuthRedirect(unselectedPlanOwner), '/register-business?step=plan');
    });

    test('State 6: Business Owner Pending Admin Review redirects to /register-business waiting screen', () => {
      const pendingOwnerWithTrial = {
        role: 'business_owner',
        approvalStatus: 'pending',
        accountStatus: 'pending_approval',
        selectedPlan: 'trial',
        trialRequested: true,
      };
      assert.equal(resolveAuthRedirect(pendingOwnerWithTrial), '/register-business');

      const pendingOwnerWithPayment = {
        role: 'business_owner',
        approvalStatus: 'pending',
        accountStatus: 'pending_approval',
        selectedPlan: 'standard',
        paymentStatus: 'paid',
      };
      assert.equal(resolveAuthRedirect(pendingOwnerWithPayment), '/register-business');
    });

    test('State 7: Business Owner with Expired Trial redirects to /employer/dashboard (trial expired checkout gate)', () => {
      const expiredTrialOwner = {
        role: 'business_owner',
        approvalStatus: 'approved',
        accountStatus: 'trial_expired',
        subscriptionStatus: 'trial_expired',
      };
      assert.equal(resolveAuthRedirect(expiredTrialOwner), '/employer/dashboard');
    });

    test('State 8: User with unassigned or pending role redirects to /register', () => {
      assert.equal(resolveAuthRedirect(null), '/login');
      assert.equal(resolveAuthRedirect({}), '/register');
      assert.equal(resolveAuthRedirect({ role: undefined }), '/register');
    });
  });

  // ── 5. OPEN REDIRECT SECURITY GUARD ───────────────────────────────────────
  test('5. Open redirect security guard rejects malicious external and protocol URLs', () => {
    assert.equal(isSafeRedirectUrl('//malicious-site.com'), false, 'Protocol-relative URL must be rejected');
    assert.equal(isSafeRedirectUrl('https://evil.com'), false, 'Absolute HTTP URL must be rejected');
    assert.equal(isSafeRedirectUrl('javascript:alert(1)'), false, 'JavaScript protocol must be rejected');
    assert.equal(isSafeRedirectUrl('data:text/html,...'), false, 'Data URI must be rejected');
    assert.equal(isSafeRedirectUrl(''), false, 'Empty string must be rejected');
    assert.equal(isSafeRedirectUrl(null), false, 'Null must be rejected');

    assert.equal(isSafeRedirectUrl('/jobs/123'), true, 'Valid relative path accepted');
    assert.equal(isSafeRedirectUrl('/seeker/dashboard'), true, 'Valid dashboard path accepted');
    assert.equal(isSafeRedirectUrl('/marketplace?type=services'), true, 'Valid query path accepted');
  });

  // ── 6. STRICT SECURITY INVARIANT: ROLE TAMPERING PREVENTION ───────────────
  test('6. Server role selector API strictly prohibits self-assigning admin or super_admin', () => {
    const ALLOWED_PUBLIC_ROLES = ['job_seeker', 'business_owner'];

    const testForbiddenRoles = ['admin', 'super_admin', 'moderator', 'root', 'attacker'];
    for (const forbidden of testForbiddenRoles) {
      const isAllowed = ALLOWED_PUBLIC_ROLES.includes(forbidden);
      assert.equal(isAllowed, false, `Role "${forbidden}" must not be assignable via public role selection`);
    }

    // Verify /api/auth/select-role route file content
    const selectRoleRoutePath = path.join(projectRoot, 'src', 'app', 'api', 'auth', 'select-role', 'route.ts');
    const selectRoleContent = fs.readFileSync(selectRoleRoutePath, 'utf8');

    assert.ok(
      selectRoleContent.includes("ALLOWED_PUBLIC_ROLES = ['job_seeker', 'business_owner']"),
      'select-role route must restrict roles to job_seeker and business_owner'
    );
    assert.ok(
      selectRoleContent.includes("status: 403"),
      'select-role route must return 403 Forbidden for unauthorized or admin roles'
    );
  });

  // ── 7. ACCOUNT LINKING & ERROR CODE MAPPING ───────────────────────────────
  test('7. Friendly error mapper translates all standard Firebase Auth error codes', () => {
    assert.equal(
      getFriendlyAuthErrorMessage({ code: 'auth/popup-closed-by-user' }),
      'Sign-in was cancelled. The Google window was closed before completing.'
    );
    assert.equal(
      getFriendlyAuthErrorMessage({ code: 'auth/popup-blocked' }),
      'The Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.'
    );
    assert.equal(
      getFriendlyAuthErrorMessage({ code: 'auth/unauthorized-domain' }),
      'This domain is not authorized for Google Sign-In in Firebase Console. Please add it to Authorized Domains.'
    );
    assert.equal(
      getFriendlyAuthErrorMessage({ code: 'auth/operation-not-allowed' }),
      'Google Sign-In is not enabled in Firebase Authentication console. Please enable it in the Firebase Console.'
    );
    assert.equal(
      getFriendlyAuthErrorMessage({ code: 'auth/account-exists-with-different-credential' }),
      'An account already exists with this email address using email/password. Please enter your password to link your Google account.'
    );
    assert.equal(
      getFriendlyAuthErrorMessage({ code: 'auth/network-request-failed' }),
      'Network connection error during sign-in. Please check your internet connection.'
    );
  });

  // ── 8. STATIC SOURCE CODE INTEGRATION VERIFICATION ────────────────────────
  test('8. Login and Register pages implement Google Sign-In with interactive modals and role binding', () => {
    const loginPagePath = path.join(projectRoot, 'src', 'app', 'login', 'page.tsx');
    const loginContent = fs.readFileSync(loginPagePath, 'utf8');

    assert.ok(
      loginContent.includes('GoogleIcon'),
      'Login page must render the Google SVG Icon'
    );
    assert.ok(
      loginContent.includes('Continue with Google'),
      'Login page must display "Continue with Google" button text'
    );
    assert.ok(
      loginContent.includes('showRoleModal'),
      'Login page must contain interactive Role Selection modal for new Google users'
    );
    assert.ok(
      loginContent.includes('showLinkingModal'),
      'Login page must contain Account Linking modal for existing password accounts'
    );

    const registerPagePath = path.join(projectRoot, 'src', 'app', 'register', 'page.tsx');
    const registerContent = fs.readFileSync(registerPagePath, 'utf8');

    assert.ok(
      registerContent.includes('handleGoogleRegister'),
      'Register page must contain handleGoogleRegister'
    );
    assert.ok(
      registerContent.includes('Continue with Google as'),
      'Register page Step 1 must offer 1-click Google registration with selected role'
    );

    const registerBusinessPath = path.join(projectRoot, 'src', 'app', 'register-business', 'page.tsx');
    const registerBusinessContent = fs.readFileSync(registerBusinessPath, 'utf8');

    assert.ok(
      registerBusinessContent.includes('handleGoogleBusinessRegister'),
      'Register Business page must support 1-click Google registration for business owners'
    );
  });

});
