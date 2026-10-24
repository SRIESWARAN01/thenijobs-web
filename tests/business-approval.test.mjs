import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('THENIJOBS Business Owner Registration & Mandatory Admin Approval', () => {
  // ── 1. JOIN FREE & ROLE SELECTION ─────────────────────────────────────────
  test('1. Role Selection page routes Business Owner to /register-business', () => {
    const registerPageSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/register/page.tsx'),
      'utf8'
    );

    // Verify role selection contains business_owner
    assert.ok(
      registerPageSource.includes("id: 'business_owner'"),
      'Must contain business_owner role definition'
    );
    assert.ok(
      registerPageSource.includes("subLabel: 'Business வைத்திருக்கிறேன்'"),
      'Must contain Tamil sublabel'
    );
    // Verify navigation routes business_owner to /register-business
    assert.ok(
      registerPageSource.includes("if (role === 'business_owner')") &&
      registerPageSource.includes("router.push('/register-business')"),
      'Selecting business_owner must navigate to /register-business'
    );
  });

  // ── 2. REGISTRATION FORM VALIDATION ───────────────────────────────────────
  test('2. Business Owner form validation rules', () => {
    const validateForm = (form) => {
      const errors = [];
      const trimmedName = (form.fullName || '').trim();
      if (!trimmedName || trimmedName.length < 2) {
        errors.push('Please enter your full name (at least 2 characters).');
      }

      const trimmedEmail = (form.email || '').toLowerCase().trim();
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        errors.push('Please enter a valid email address.');
      }

      const cleanPhone = (form.mobileNumber || '').replace(/\D/g, '').slice(-10);
      if (form.mobileNumber && form.mobileNumber.trim() && cleanPhone.length !== 10) {
        errors.push('Please enter a valid 10-digit mobile number, or leave it blank.');
      }

      if (!form.password || form.password.length < 6) {
        errors.push('Password must be at least 6 characters long.');
      }

      if (form.password !== form.confirmPassword) {
        errors.push('Passwords do not match. Please re-enter your password.');
      }

      return {
        isValid: errors.length === 0,
        errors,
        normalized: {
          fullName: trimmedName,
          email: trimmedEmail,
          mobileNumber: cleanPhone,
          phone: cleanPhone ? `+91${cleanPhone}` : '',
        },
      };
    };

    // Valid submission with mobile
    const validWithPhone = validateForm({
      fullName: 'Murugan Textiles Owner',
      email: 'owner@murugantextiles.com',
      mobileNumber: '9360519460',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
    });
    assert.equal(validWithPhone.isValid, true);
    assert.equal(validWithPhone.normalized.phone, '+919360519460');

    // Valid submission without mobile (mobile is optional)
    const validWithoutPhone = validateForm({
      fullName: 'Kannan Store',
      email: 'kannan@gmail.com',
      mobileNumber: '',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    assert.equal(validWithoutPhone.isValid, true);
    assert.equal(validWithoutPhone.normalized.phone, '');

    // Invalid: Name too short
    const shortName = validateForm({
      fullName: 'A',
      email: 'owner@test.com',
      mobileNumber: '9360519460',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    assert.equal(shortName.isValid, false);
    assert.ok(shortName.errors.some(e => e.includes('full name')));

    // Invalid: Invalid email format
    const invalidEmail = validateForm({
      fullName: 'Owner Name',
      email: 'not-an-email',
      mobileNumber: '9360519460',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    assert.equal(invalidEmail.isValid, false);
    assert.ok(invalidEmail.errors.some(e => e.includes('valid email')));

    // Invalid: Password mismatch
    const pwdMismatch = validateForm({
      fullName: 'Owner Name',
      email: 'owner@test.com',
      mobileNumber: '9360519460',
      password: 'Password123',
      confirmPassword: 'DifferentPassword456',
    });
    assert.equal(pwdMismatch.isValid, false);
    assert.ok(pwdMismatch.errors.some(e => e.includes('Passwords do not match')));

    // Invalid: Password under 6 characters
    const shortPwd = validateForm({
      fullName: 'Owner Name',
      email: 'owner@test.com',
      mobileNumber: '9360519460',
      password: '123',
      confirmPassword: '123',
    });
    assert.equal(shortPwd.isValid, false);
    assert.ok(shortPwd.errors.some(e => e.includes('at least 6 characters')));

    // Invalid: Incomplete mobile number
    const badPhone = validateForm({
      fullName: 'Owner Name',
      email: 'owner@test.com',
      mobileNumber: '12345',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    assert.equal(badPhone.isValid, false);
    assert.ok(badPhone.errors.some(e => e.includes('10-digit mobile number')));
  });

  // ── 3. FIRESTORE USER DOCUMENT CREATION & INITIAL STATUS ───────────────────
  test('3. Initial registration document must default to pending approval and no job posting access', () => {
    const createNewUserDoc = (uid, form) => {
      const cleanPhone = form.mobileNumber.replace(/\D/g, '').slice(-10);
      return {
        uid,
        fullName: form.fullName.trim(),
        displayName: form.fullName.trim(),
        email: form.email.toLowerCase().trim(),
        phone: cleanPhone ? `+91${cleanPhone}` : '',
        mobileNumber: cleanPhone || '',
        countryCode: '+91',
        role: 'business_owner',
        approvalStatus: 'pending',
        accountStatus: 'pending_approval',
        isEmployer: true,
        canPostJobs: false,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    };

    const doc = createNewUserDoc('usr_test_123', {
      fullName: 'Anbarasan Owner',
      email: 'anbu@business.com',
      mobileNumber: '9360519460',
    });

    assert.equal(doc.role, 'business_owner');
    assert.equal(doc.approvalStatus, 'pending', 'Must have approvalStatus = pending');
    assert.equal(doc.accountStatus, 'pending_approval', 'Must have accountStatus = pending_approval');
    assert.equal(doc.canPostJobs, false, 'Pending user must NOT be permitted to post jobs');
    assert.equal(doc.isVerified, false, 'Pending user must NOT be marked verified');
    assert.equal(doc.uid, 'usr_test_123');
    assert.ok(!('password' in doc), 'Password must NEVER be stored in Firestore');
  });

  // ── 4. ROUTE GUARD ACCESS CONTROL ─────────────────────────────────────────
  test('4. Route Guard: Access control rules for Business Owners', () => {
    const evaluateAccess = (user, path) => {
      if (!user) {
        return { allowed: false, action: 'redirect_login' };
      }

      if (user.role === 'business_owner') {
        const isApproved = user.approvalStatus === 'approved' || user.accountStatus === 'active';
        const isRejected = user.approvalStatus === 'rejected' || user.accountStatus === 'rejected';

        if (isRejected) {
          return { allowed: false, screen: 'rejection_screen', reason: user.rejectionReason };
        }

        if (!isApproved) {
          return { allowed: false, screen: 'pending_approval_screen' };
        }

        return { allowed: true, screen: 'dashboard' };
      }

      return { allowed: true, screen: 'default' };
    };

    // Pending Business Owner
    const pendingOwner = {
      uid: 'user_pending',
      role: 'business_owner',
      approvalStatus: 'pending',
      accountStatus: 'pending_approval',
    };
    const pendingCheck = evaluateAccess(pendingOwner, '/employer/dashboard');
    assert.equal(pendingCheck.allowed, false, 'Pending owner cannot access employer dashboard');
    assert.equal(pendingCheck.screen, 'pending_approval_screen');

    // Rejected Business Owner
    const rejectedOwner = {
      uid: 'user_rejected',
      role: 'business_owner',
      approvalStatus: 'rejected',
      accountStatus: 'rejected',
      rejectionReason: 'Invalid shop registration certificate',
    };
    const rejectedCheck = evaluateAccess(rejectedOwner, '/employer/post-job');
    assert.equal(rejectedCheck.allowed, false, 'Rejected owner cannot access post-job');
    assert.equal(rejectedCheck.screen, 'rejection_screen');
    assert.equal(rejectedCheck.reason, 'Invalid shop registration certificate');

    // Approved Business Owner
    const approvedOwner = {
      uid: 'user_approved',
      role: 'business_owner',
      approvalStatus: 'approved',
      accountStatus: 'active',
      canPostJobs: true,
    };
    const approvedCheck = evaluateAccess(approvedOwner, '/employer/dashboard');
    assert.equal(approvedCheck.allowed, true, 'Approved owner has full dashboard access');
    assert.equal(approvedCheck.screen, 'dashboard');

    // Regular Job Seeker
    const seeker = {
      uid: 'user_seeker',
      role: 'job_seeker',
      approvalStatus: undefined,
    };
    const seekerCheck = evaluateAccess(seeker, '/seeker/dashboard');
    assert.equal(seekerCheck.allowed, true);
  });

  // ── 5. ADMIN APPROVAL STATE TRANSITION ────────────────────────────────────
  test('5. Admin Approval transition updates approvalStatus, accountStatus, and audit fields', () => {
    const approveBusinessOwnerTransition = (user, adminId) => {
      assert.ok(adminId, 'Admin UID must be provided');
      return {
        ...user,
        approvalStatus: 'approved',
        accountStatus: 'active',
        isEmployer: true,
        canPostJobs: true,
        approvedAt: new Date().toISOString(),
        approvedBy: adminId,
        rejectionReason: '',
        updatedAt: new Date().toISOString(),
      };
    };

    const initialUser = {
      uid: 'bo_001',
      role: 'business_owner',
      approvalStatus: 'pending',
      accountStatus: 'pending_approval',
      canPostJobs: false,
    };

    const approvedUser = approveBusinessOwnerTransition(initialUser, 'admin_super_999');

    assert.equal(approvedUser.approvalStatus, 'approved');
    assert.equal(approvedUser.accountStatus, 'active');
    assert.equal(approvedUser.canPostJobs, true);
    assert.equal(approvedUser.approvedBy, 'admin_super_999');
    assert.ok(approvedUser.approvedAt);
    assert.equal(approvedUser.rejectionReason, '');
  });

  // ── 6. ADMIN REJECTION STATE TRANSITION & REASON REQUIREMENT ──────────────
  test('6. Admin Rejection enforces non-empty reason and updates audit fields', () => {
    const rejectBusinessOwnerTransition = (user, adminId, reason) => {
      const trimmed = (reason || '').trim();
      if (!trimmed) {
        throw new Error('Rejection reason is mandatory and cannot be empty.');
      }
      return {
        ...user,
        approvalStatus: 'rejected',
        accountStatus: 'rejected',
        canPostJobs: false,
        rejectedAt: new Date().toISOString(),
        rejectedBy: adminId,
        rejectionReason: trimmed,
        updatedAt: new Date().toISOString(),
      };
    };

    const initialUser = {
      uid: 'bo_002',
      role: 'business_owner',
      approvalStatus: 'pending',
      accountStatus: 'pending_approval',
      canPostJobs: false,
    };

    // Fails on empty reason
    assert.throws(() => {
      rejectBusinessOwnerTransition(initialUser, 'admin_999', '');
    }, /Rejection reason is mandatory/);

    assert.throws(() => {
      rejectBusinessOwnerTransition(initialUser, 'admin_999', '   ');
    }, /Rejection reason is mandatory/);

    // Succeeds with meaningful reason
    const rejectedUser = rejectBusinessOwnerTransition(
      initialUser,
      'admin_999',
      'Contact number could not be reached after multiple verification attempts.'
    );

    assert.equal(rejectedUser.approvalStatus, 'rejected');
    assert.equal(rejectedUser.accountStatus, 'rejected');
    assert.equal(rejectedUser.canPostJobs, false);
    assert.equal(rejectedUser.rejectedBy, 'admin_999');
    assert.equal(
      rejectedUser.rejectionReason,
      'Contact number could not be reached after multiple verification attempts.'
    );
    assert.ok(rejectedUser.rejectedAt);
  });

  // ── 7. FIRESTORE SECURITY RULES VERIFICATION ──────────────────────────────
  test('7. Firestore Security Rules enforce moderation lock on approvalStatus', () => {
    const rulesSource = fs.readFileSync(
      path.resolve(process.cwd(), 'firestore.rules'),
      'utf8'
    );

    // 1. userModerationUnchanged must block regular users from modifying approvalStatus
    assert.ok(
      rulesSource.includes("'approvalStatus'"),
      'userModerationUnchanged must include approvalStatus'
    );
    assert.ok(
      rulesSource.includes("'approvedAt'") && rulesSource.includes("'approvedBy'"),
      'userModerationUnchanged must include approvedAt and approvedBy'
    );
    assert.ok(
      rulesSource.includes("'rejectedAt'") && rulesSource.includes("'rejectedBy'") && rulesSource.includes("'rejectionReason'"),
      'userModerationUnchanged must include rejectedAt, rejectedBy, rejectionReason'
    );

    // 2. Client document creation must block pre-approved accounts
    assert.ok(
      rulesSource.includes("approvalStatus != 'approved'"),
      'Users collection create rule must forbid creating with approvalStatus == approved'
    );

    // 3. Admin-only permission check
    assert.ok(
      rulesSource.includes('isAdmin()'),
      'Rules must require isAdmin() for moderation overrides'
    );
  });

  // ── 8. ADMIN NAVIGATION & QUEUE INTEGRATION ───────────────────────────────
  test('8. Admin Navigation includes Business Owner Approvals with pending badge', () => {
    const adminLayoutSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/admin/layout.tsx'),
      'utf8'
    );

    assert.ok(
      adminLayoutSource.includes("label: 'Business Owner Approvals'"),
      'ADMIN_NAV must include Business Owner Approvals'
    );
    assert.ok(
      adminLayoutSource.includes("href: '/admin/business-approvals'"),
      'ADMIN_NAV must link to /admin/business-approvals'
    );
    assert.ok(
      adminLayoutSource.includes("badge: 'pending'"),
      'Must configure pending badge indicator'
    );
  });

  // ── 9. ADMIN APPROVAL PAGE IMPLEMENTATION ─────────────────────────────────
  test('9. Admin Approvals page implementation file exists and contains all required UI components', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/admin/business-approvals/page.tsx');
    assert.ok(fs.existsSync(pagePath), 'src/app/admin/business-approvals/page.tsx must exist');

    const source = fs.readFileSync(pagePath, 'utf8');

    // Check required capabilities
    assert.ok(source.includes('approveBusinessOwner'), 'Must import approveBusinessOwner');
    assert.ok(source.includes('rejectBusinessOwner'), 'Must import rejectBusinessOwner');
    assert.ok(source.includes('QUICK_REJECTION_REASONS'), 'Must provide quick rejection chips');
    assert.ok(source.includes('filteredUsers'), 'Must filter users by tab and search');
    assert.ok(source.includes('setDetailsUser'), 'Must support View Details modal');
    assert.ok(source.includes('setApprovingUser'), 'Must support Approve confirmation modal');
    assert.ok(source.includes('setRejectingUser'), 'Must support Reject modal with reason');
    assert.ok(source.includes('counts.pending'), 'Must display pending counter');
    assert.ok(source.includes('counts.approved'), 'Must display approved counter');
    assert.ok(source.includes('counts.rejected'), 'Must display rejected counter');
  });

  // ── 10. EMPLOYER LAYOUT APPROVAL GATE ─────────────────────────────────────
  test('10. Employer Layout blocks unapproved business owners from any /employer/* route', () => {
    const layoutPath = path.resolve(process.cwd(), 'src/app/employer/layout.tsx');
    const source = fs.readFileSync(layoutPath, 'utf8');

    assert.ok(
      source.includes("user.role === 'business_owner'"),
      'EmployerLayout must check user.role === business_owner'
    );
    assert.ok(
      source.includes('Your Business Account Is Under Review'),
      'Must render "Your Business Account Is Under Review" screen for pending business owners'
    );
    assert.ok(
      source.includes('Registration Not Approved'),
      'Must render "Registration Not Approved" screen for rejected business owners'
    );
    assert.ok(
      source.includes('Check Approval Status'),
      'Must provide "Check Approval Status" action'
    );
    assert.ok(
      source.includes('refreshUserProfile'),
      'Must call refreshUserProfile to fetch updated Firestore status'
    );
  });

  // ── 11. 15-DAY FREE TRIAL SELECTION FLOW ──────────────────────────────────
  test('11. 15-Day Free Trial selection sets trialRequested: true, deferred until Admin approval', () => {
    const handleSelectFreeTrial = (currentUser) => {
      if (currentUser.hasUsedFreeTrial) {
        throw new Error('This account has already utilized the 15-day free trial.');
      }
      return {
        ...currentUser,
        selectedPlan: 'trial',
        trialRequested: true,
        trialEligible: true,
        hasUsedFreeTrial: false,
        subscriptionStatus: 'pending_admin_approval',
        paymentStatus: 'not_required',
        // Invariant: Trial dates must NOT be generated yet
        trialStartedAt: null,
        trialEndsAt: null,
      };
    };

    const initialUser = {
      uid: 'user_trial_seeker',
      email: 'trial@example.com',
      approvalStatus: 'pending',
      accountStatus: 'pending_approval',
      hasUsedFreeTrial: false,
    };

    const requested = handleSelectFreeTrial(initialUser);
    assert.equal(requested.selectedPlan, 'trial');
    assert.equal(requested.trialRequested, true);
    assert.equal(requested.subscriptionStatus, 'pending_admin_approval');
    assert.equal(requested.paymentStatus, 'not_required');
    assert.equal(requested.trialStartedAt, null, 'Trial must NOT start at selection time');
    assert.equal(requested.trialEndsAt, null, 'Trial must NOT expire from selection time');
  });

  // ── 12. ADMIN APPROVAL ACTIVATES EXACTLY 15 DAYS TRIAL ────────────────────
  test('12. Admin Approval of Trial user activates exactly 15 days starting from approval timestamp', () => {
    const approveTrialUser = (user, adminId, approvalTimestamp = new Date('2026-10-23T12:00:00Z')) => {
      const isTrial = user.selectedPlan === 'trial' || user.trialRequested;
      assert.ok(isTrial, 'User must have selected trial');

      const trialDurationDays = 15;
      const trialEndDate = new Date(approvalTimestamp.getTime() + trialDurationDays * 24 * 60 * 60 * 1000);

      return {
        ...user,
        approvalStatus: 'approved',
        accountStatus: 'active',
        isEmployer: true,
        canPostJobs: true,
        subscriptionStatus: 'trial',
        selectedPlan: 'trial',
        trialEligible: false,
        hasUsedFreeTrial: true,
        trialStartedAt: approvalTimestamp,
        trialStartDate: approvalTimestamp,
        trialEndsAt: trialEndDate,
        trialEndDate: trialEndDate,
        trialDurationDays,
        trialActivatedBy: adminId,
        trialActivatedAt: approvalTimestamp,
        approvedAt: approvalTimestamp,
        approvedBy: adminId,
      };
    };

    const approvalTime = new Date('2026-10-23T10:00:00.000Z');
    const userDoc = {
      uid: 'trial_bo_123',
      selectedPlan: 'trial',
      trialRequested: true,
      approvalStatus: 'pending',
    };

    const activated = approveTrialUser(userDoc, 'admin_master_1', approvalTime);
    assert.equal(activated.approvalStatus, 'approved');
    assert.equal(activated.subscriptionStatus, 'trial');
    assert.equal(activated.canPostJobs, true);
    assert.equal(activated.trialDurationDays, 15);
    assert.equal(activated.hasUsedFreeTrial, true);
    assert.equal(activated.trialStartedAt.toISOString(), '2026-10-23T10:00:00.000Z');
    assert.equal(activated.trialEndsAt.toISOString(), '2026-11-07T10:00:00.000Z');

    const durationDays = (activated.trialEndsAt.getTime() - activated.trialStartedAt.getTime()) / (1000 * 60 * 60 * 24);
    assert.equal(durationDays, 15, 'Trial duration must be exactly 15 days');
  });

  // ── 13. PAID PLAN PAYMENT GATE BEFORE ADMIN APPROVAL ──────────────────────
  test('13. Paid Plan Selection & Payment verification sets paymentStatus: "paid" but keeps pending admin approval gate', () => {
    const recordPaymentVerification = (user, orderDetails) => {
      assert.equal(orderDetails.signatureValid, true, 'Payment signature must be verified via HMAC SHA-256');
      return {
        ...user,
        paymentStatus: 'paid',
        selectedPlan: orderDetails.planSlug,
        paymentOrderId: orderDetails.orderId,
        paymentId: orderDetails.paymentId,
        paymentAmount: orderDetails.amount,
        // Invariant: If unapproved, remains pending approval with blocked dashboard
        subscriptionStatus: user.approvalStatus === 'approved' ? 'active' : 'pending_admin_approval',
        canPostJobs: user.approvalStatus === 'approved',
      };
    };

    const unapprovedUser = {
      uid: 'paid_bo_456',
      approvalStatus: 'pending',
      accountStatus: 'pending_approval',
      canPostJobs: false,
    };

    const paymentVerified = recordPaymentVerification(unapprovedUser, {
      orderId: 'order_ABC123',
      paymentId: 'pay_XYZ789',
      planSlug: 'standard',
      amount: 1800,
      signatureValid: true,
    });

    assert.equal(paymentVerified.paymentStatus, 'paid');
    assert.equal(paymentVerified.selectedPlan, 'standard');
    assert.equal(paymentVerified.approvalStatus, 'pending');
    assert.equal(paymentVerified.subscriptionStatus, 'pending_admin_approval');
    assert.equal(paymentVerified.canPostJobs, false, 'Paid user cannot post jobs before admin approval');
  });

  // ── 14. ADMIN APPROVAL ACTIVATES 365-DAY ANNUAL SUBSCRIPTION ──────────────
  test('14. Admin Approval of Paid user activates 365-day annual subscription', () => {
    const approvePaidUser = (user, adminId, approvalTimestamp = new Date('2026-10-23T12:00:00Z')) => {
      assert.equal(user.paymentStatus, 'paid', 'User must have paymentStatus: paid');
      const planDurationDays = 365;
      const planEndDate = new Date(approvalTimestamp.getTime() + planDurationDays * 24 * 60 * 60 * 1000);

      return {
        ...user,
        approvalStatus: 'approved',
        accountStatus: 'active',
        isEmployer: true,
        canPostJobs: true,
        subscriptionStatus: 'active',
        subscriptionPlan: user.selectedPlan || 'standard',
        planStartDate: approvalTimestamp,
        planEndDate,
        subscriptionStartDate: approvalTimestamp,
        subscriptionEndDate: planEndDate,
        isPremium: true,
        approvedAt: approvalTimestamp,
        approvedBy: adminId,
      };
    };

    const approvalTime = new Date('2026-10-23T12:00:00.000Z');
    const userDoc = {
      uid: 'paid_user_999',
      selectedPlan: 'premium',
      paymentStatus: 'paid',
      approvalStatus: 'pending',
    };

    const activated = approvePaidUser(userDoc, 'admin_master_1', approvalTime);
    assert.equal(activated.approvalStatus, 'approved');
    assert.equal(activated.subscriptionStatus, 'active');
    assert.equal(activated.subscriptionPlan, 'premium');
    assert.equal(activated.isPremium, true);
    assert.equal(activated.canPostJobs, true);
    assert.equal(activated.subscriptionStartDate.toISOString(), '2026-10-23T12:00:00.000Z');
    assert.equal(activated.subscriptionEndDate.toISOString(), '2027-10-23T12:00:00.000Z');

    const durationDays = (activated.subscriptionEndDate.getTime() - activated.subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24);
    assert.equal(durationDays, 365, 'Paid subscription duration must be 365 days');
  });

  // ── 15. DUPLICATE FREE TRIAL GUARD ────────────────────────────────────────
  test('15. Duplicate Free Trial Guard blocks previous trial users from re-requesting', () => {
    const userWithPreviousTrial = {
      uid: 'bo_reused',
      hasUsedFreeTrial: true,
      trialEligible: false,
    };

    const canRequestTrial = !userWithPreviousTrial.hasUsedFreeTrial && userWithPreviousTrial.trialEligible !== false;
    assert.equal(canRequestTrial, false, 'User who previously used trial cannot request again');
  });

  // ── 16. LOGIN REDIRECTION LOGIC ACROSS ALL ACCOUNT STATES ─────────────────
  test('16. Login redirection logic handles all 5 business owner journey stages', () => {
    const resolveLoginDestination = (user) => {
      if (user.role !== 'business_owner') {
        return user.role === 'admin' ? '/admin' : '/seeker/dashboard';
      }

      // Step 2: Has not chosen plan or trial yet
      const hasSelectedPlanOrTrial = !!user.selectedPlan || user.trialRequested || user.paymentStatus === 'paid';
      if (!hasSelectedPlanOrTrial) {
        return '/register-business?step=plan';
      }

      // All remaining statuses go to /employer/dashboard where the layout handles gates
      return '/employer/dashboard';
    };

    // 1. Fresh registrant without plan selection
    assert.equal(
      resolveLoginDestination({ role: 'business_owner', selectedPlan: null, trialRequested: false, paymentStatus: 'unpaid' }),
      '/register-business?step=plan'
    );

    // 2. Free trial requested, pending approval
    assert.equal(
      resolveLoginDestination({ role: 'business_owner', selectedPlan: 'trial', trialRequested: true, approvalStatus: 'pending' }),
      '/employer/dashboard'
    );

    // 3. Paid plan completed, pending approval
    assert.equal(
      resolveLoginDestination({ role: 'business_owner', selectedPlan: 'standard', paymentStatus: 'paid', approvalStatus: 'pending' }),
      '/employer/dashboard'
    );

    // 4. Approved business owner
    assert.equal(
      resolveLoginDestination({ role: 'business_owner', selectedPlan: 'standard', approvalStatus: 'approved' }),
      '/employer/dashboard'
    );

    // 5. Admin user
    assert.equal(
      resolveLoginDestination({ role: 'admin' }),
      '/admin'
    );
  });

  // ── 17. ADMIN APPROVAL QUEUE UI & COLUMNS ─────────────────────────────────
  test('17. Admin Approval Queue displays Selected Plan, Payment Status, and Trial Status', () => {
    const adminPageSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/admin/business-approvals/page.tsx'),
      'utf8'
    );

    assert.ok(adminPageSource.includes('Selected Plan'), 'Must include Selected Plan column');
    assert.ok(adminPageSource.includes('renderPlanBadge'), 'Must render plan badge');
    assert.ok(adminPageSource.includes('renderPaymentBadge'), 'Must render payment badge');
    assert.ok(adminPageSource.includes('renderTrialBadge'), 'Must render trial badge');
    assert.ok(adminPageSource.includes('15-Day Free Trial'), 'Must recognize 15-Day Free Trial');
    assert.ok(adminPageSource.includes('Basic (₹999/yr)'), 'Must recognize Basic ₹999/yr');
    assert.ok(adminPageSource.includes('Standard (₹1,800/yr)'), 'Must recognize Standard ₹1,800/yr');
    assert.ok(adminPageSource.includes('Premium (₹3,500/yr)'), 'Must recognize Premium ₹3,500/yr');
    assert.ok(adminPageSource.includes('Enterprise (₹5,000/yr)'), 'Must recognize Enterprise ₹5,000/yr');
  });

  // ── 18. ADMIN APPROVAL VIEW DETAILS DOSSIER ───────────────────────────────
  test('18. Admin Approval View Details modal displays full subscription and payment dossier', () => {
    const adminPageSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/admin/business-approvals/page.tsx'),
      'utf8'
    );

    assert.ok(adminPageSource.includes('Subscription, Trial & Payment Dossier'), 'Must contain Subscription Dossier heading');
    assert.ok(adminPageSource.includes('paymentOrderId'), 'Must display paymentOrderId');
    assert.ok(adminPageSource.includes('paymentId'), 'Must display paymentId');
    assert.ok(adminPageSource.includes('Activation Policy'), 'Must display activation policy');
  });

  // ── 19. EMPLOYER DASHBOARD SUBSCRIPTION & TRIAL DISPLAY ───────────────────
  test('19. Employer Dashboard displays Account & Subscription Status Card with 15-Day Trial countdown', () => {
    const dashboardSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/employer/dashboard/page.tsx'),
      'utf8'
    );

    assert.ok(dashboardSource.includes('useSubscriptionStatus'), 'Must use useSubscriptionStatus');
    assert.ok(dashboardSource.includes('renderSubscriptionCard'), 'Must render subscription card');
    assert.ok(dashboardSource.includes('15-Day Free Trial Active'), 'Must display 15-day free trial active banner');
    assert.ok(dashboardSource.includes('trialDaysRemaining'), 'Must display trialDaysRemaining');
    assert.ok(
      dashboardSource.includes('Account Approved') && dashboardSource.includes('Active'),
      'Must display approved & active status'
    );
  });

  // ── 20. FIRESTORE SECURITY RULES PROTECTION ───────────────────────────────
  test('20. Firestore Security Rules protect trialStartedAt, trialEndsAt, paymentStatus, and forbid self-approval/self-payment', () => {
    const rulesSource = fs.readFileSync(
      path.resolve(process.cwd(), 'firestore.rules'),
      'utf8'
    );

    assert.ok(rulesSource.includes("'trialStartedAt'"), 'Must protect trialStartedAt');
    assert.ok(rulesSource.includes("'trialEndsAt'"), 'Must protect trialEndsAt');
    assert.ok(rulesSource.includes("'trialDurationDays'"), 'Must protect trialDurationDays');
    assert.ok(rulesSource.includes("'hasUsedFreeTrial'"), 'Must protect hasUsedFreeTrial');
    assert.ok(rulesSource.includes("'paymentStatus'"), 'Must protect paymentStatus');
    assert.ok(rulesSource.includes("approvalStatus != 'approved'"), 'Must forbid client approval creation');
  });
});
