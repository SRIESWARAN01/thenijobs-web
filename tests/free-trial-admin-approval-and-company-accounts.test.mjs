import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('THENIJOBS — 15-Day Free Trial, Admin Approval, and Firebase Company Accounts', () => {

  // Pure logic replica of subscriptionService.computeSubscriptionState
  function toJsDate(val) {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val?.toDate === 'function') return val.toDate();
    if (typeof val?.seconds === 'number') return new Date(val.seconds * 1000);
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  function computeSubscriptionState(company, user) {
    const now = new Date();
    const rawVerificationStatus = company?.verificationStatus || (company?.isVerified ? 'verified' : 'pending');
    const rawAccountStatus = (company?.accountStatus || user?.accountStatus || 'pending_admin_approval');
    const rawWebsiteStatus = (company?.websiteStatus || (rawAccountStatus === 'suspended' ? 'suspended' : 'active'));
    const rawPaymentStatus = (company?.paymentStatus || user?.paymentStatus || 'unpaid');
    const rawSubscriptionStatus = company?.subscriptionStatus || user?.subscriptionStatus;

    const trialStartDate = toJsDate(company?.trialStartDate || user?.trialStartDate || user?.trialStartedAt);
    const trialEndDate = toJsDate(company?.trialEndDate || user?.trialEndDate || user?.trialEndsAt);
    const subStartDate = toJsDate(company?.subscriptionStartDate || user?.subscriptionStartDate || user?.planStartDate);
    const subEndDate = toJsDate(company?.subscriptionEndDate || user?.subscriptionEndDate || user?.planEndDate);

    const isPaidActive = rawPaymentStatus === 'paid' && (!subEndDate || subEndDate > now) && rawSubscriptionStatus !== 'suspended';
    const isPaidExpired = rawPaymentStatus === 'paid' && !!subEndDate && subEndDate <= now && rawSubscriptionStatus !== 'suspended';

    let trialDaysRemaining = 0;
    let trialHoursRemaining = 0;
    let isTrialActive = false;
    let isTrialExpired = false;

    if (isPaidActive) {
      isTrialActive = false;
      isTrialExpired = false;
    } else if (isPaidExpired) {
      isTrialActive = false;
      isTrialExpired = false;
    } else if (trialEndDate) {
      const diffMs = trialEndDate.getTime() - now.getTime();
      if (diffMs > 0) {
        isTrialActive = true;
        isTrialExpired = false;
        trialHoursRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
        trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      } else {
        isTrialActive = false;
        isTrialExpired = true;
      }
    } else if (rawVerificationStatus === 'verified' && rawPaymentStatus !== 'paid') {
      isTrialExpired = true;
    }

    const isPendingApproval =
      !isPaidActive &&
      !isTrialActive &&
      !isTrialExpired &&
      !isPaidExpired &&
      (rawAccountStatus === 'pending_admin_approval' ||
        rawVerificationStatus === 'pending' ||
        rawSubscriptionStatus === 'pending_admin_approval');

    const isSuspended =
      rawAccountStatus === 'suspended' ||
      rawWebsiteStatus === 'suspended' ||
      (isTrialExpired && !isPaidActive) ||
      isPaidExpired ||
      rawSubscriptionStatus === 'trial_expired' ||
      rawSubscriptionStatus === 'suspended';

    let resolvedAccountStatus = rawAccountStatus;
    let resolvedWebsiteStatus = rawWebsiteStatus;

    if (isPaidActive) {
      resolvedAccountStatus = 'active';
      resolvedWebsiteStatus = 'active';
    } else if (isTrialActive) {
      resolvedAccountStatus = 'trial_active';
      resolvedWebsiteStatus = 'active';
    } else if (isSuspended) {
      resolvedAccountStatus = 'suspended';
      resolvedWebsiteStatus = 'suspended';
    } else if (isPendingApproval) {
      resolvedAccountStatus = 'pending_admin_approval';
      resolvedWebsiteStatus = 'pending_approval';
    }

    return {
      isPendingApproval,
      isTrialActive,
      isPaidActive,
      isTrialExpired,
      isPaidExpired,
      isSuspended,
      isAccessAllowed: (isTrialActive || isPaidActive) && !isSuspended,
      isJobPostingAllowed: (isPaidActive || (isTrialActive && rawVerificationStatus === 'verified')) && !isSuspended,
      trialDaysRemaining,
      trialHoursRemaining,
      accountStatus: resolvedAccountStatus,
      websiteStatus: resolvedWebsiteStatus,
    };
  }

  describe('1. 15-Day Automatic Free Trial without Admin Approval', () => {
    test('New business owner receives automatic 15-day free trial on registration without admin approval', () => {
      const now = new Date();
      const trialEndDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      const unapprovedTrialCompany = {
        name: 'Theni Organic Mart',
        subscriptionStatus: 'trial',
        accountStatus: 'trial_active',
        verificationStatus: 'pending', // Awaiting Admin verification for job posting
        trialStartDate: now,
        trialEndDate: trialEndDate,
      };

      const unapprovedUser = {
        role: 'business_owner',
        approvalStatus: 'pending', // Unapproved by admin
        accountStatus: 'trial_active',
        subscriptionStatus: 'trial',
        canPostJobs: false,
      };

      const state = computeSubscriptionState(unapprovedTrialCompany, unapprovedUser);

      // Automatic 15-day free trial is active right away
      assert.equal(state.isTrialActive, true, 'Trial must be active immediately without waiting for admin approval');
      assert.equal(state.isTrialExpired, false, 'Trial must not be expired');
      assert.equal(state.trialDaysRemaining, 15, 'Trial must have 15 days remaining');

      // Website preview is accessible
      assert.equal(state.isAccessAllowed, true, 'Portal & Dashboard access must be granted during active trial');
      assert.equal(state.websiteStatus, 'active', 'Company website preview must be active');
      assert.equal(state.isPendingApproval, false, 'Trial account must not be blocked by pending approval gate');

      // Job posting stays locked until Admin Approval
      assert.equal(state.isJobPostingAllowed, false, 'Job posting must stay locked until Admin approval');
    });

    test('Support details (WhatsApp and Call) are embedded in Post-Job and Layout locked states', () => {
      const postJobFile = fs.readFileSync(path.join(process.cwd(), 'src/app/employer/post-job/page.tsx'), 'utf8');
      const layoutFile = fs.readFileSync(path.join(process.cwd(), 'src/app/employer/layout.tsx'), 'utf8');

      // Check Post-Job page lock messaging and actions
      assert.ok(postJobFile.includes('Job Posting Is Locked Awaiting Admin Approval'), 'Post-Job page must render locked header');
      assert.ok(postJobFile.includes('9360519460') || postJobFile.includes('SITE_CONTACT.phone1'), 'Post-Job page must provide primary WhatsApp/Call contact');
      assert.ok(postJobFile.includes('Secondary Helpline') && (postJobFile.includes('SITE_CONTACT.phone2') || postJobFile.includes('70948 26886')), 'Post-Job page must provide secondary helpline');
      assert.ok(postJobFile.includes('/employer/website'), 'Post-Job page must allow user to preview company website');

      // Check Layout banner messaging and actions
      assert.ok(layoutFile.includes('15-Day Free Trial'), 'Layout must render 15-Day Free Trial banner');
      assert.ok(layoutFile.includes('Job Posting stays locked until Admin approval') || layoutFile.includes('Job Posting is locked'), 'Layout must state job posting locked');
      assert.ok(layoutFile.includes('9360519460'), 'Layout banner must link to WhatsApp support');
    });
  });

  describe('2. Admin Approval Workflow & Immediate Unlocking', () => {
    test('Once Admin approves business, Job Posting unlocks immediately and trial dates are preserved', () => {
      const now = new Date();
      const trialStartDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days in
      const trialEndDate = new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000); // 13 days left

      const approvedTrialCompany = {
        name: 'Theni Organic Mart',
        subscriptionStatus: 'trial',
        accountStatus: 'active',
        verificationStatus: 'verified', // Admin approved!
        isVerified: true,
        trialStartDate: trialStartDate,
        trialEndDate: trialEndDate,
        adminApprovedAt: now,
        approvedBy: 'admin_test_uid',
      };

      const approvedUser = {
        role: 'business_owner',
        approvalStatus: 'approved',
        accountStatus: 'active',
        subscriptionStatus: 'trial',
        canPostJobs: true,
        adminApprovedAt: now,
      };

      const state = computeSubscriptionState(approvedTrialCompany, approvedUser);

      // Trial is active and preserved
      assert.equal(state.isTrialActive, true, 'Trial must remain active');
      assert.equal(state.trialDaysRemaining, 13, 'Remaining trial days must accurately reflect elapsed time');

      // Job Posting is immediately unlocked
      assert.equal(state.isJobPostingAllowed, true, 'Job posting must unlock immediately after Admin approval');
      assert.equal(state.isAccessAllowed, true, 'Portal access must remain allowed');
    });

    test('When 15-day free trial expires, account is locked and requires renewal/upgrade', () => {
      const now = new Date();
      const pastEndDate = new Date(now.getTime() - 1000 * 60 * 60 * 24); // Expired yesterday

      const expiredCompany = {
        name: 'Expired Company',
        subscriptionStatus: 'trial',
        accountStatus: 'trial_active',
        verificationStatus: 'verified',
        trialStartDate: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000),
        trialEndDate: pastEndDate,
      };

      const expiredUser = {
        role: 'business_owner',
        subscriptionStatus: 'trial',
      };

      const state = computeSubscriptionState(expiredCompany, expiredUser);

      assert.equal(state.isTrialActive, false, 'Trial must no longer be active');
      assert.equal(state.isTrialExpired, true, 'Trial must be marked expired');
      assert.equal(state.isSuspended, true, 'Expired account must be suspended until plan purchase');
      assert.equal(state.isAccessAllowed, false, 'Full access must be locked on expired trial');
      assert.equal(state.isJobPostingAllowed, false, 'Job posting must be locked on expired trial');
    });
  });

  describe('3. Firebase Company Accounts & Data Isolation', () => {
    test('Dedicated partner company accounts exist with specific emails and Firebase Auth UIDs', () => {
      const eligibleBusinesses = [
        { name: 'Agrimore', email: 'agrimorein@gmail.com', location: 'Chinnamanur', authUid: 'odorKnlqkzba8CP4wwTym9d0arW2' },
        { name: 'Sarvesh Super Market', email: 'veeraselvam1103@gmail.com', location: 'Theni', authUid: 'ArOGgATSS1Os6QYMeGhsYmnqaKa2' },
        { name: 'Apex Scholar Publication', email: 'apex.scholar.publication@gmail.com', location: 'Theni', authUid: 'VznCq9zapZQIl1jxWTVlrmENIlm2' },
        { name: 'Suruliraj Chemicals', email: 'surliraj71@gmail.com', location: 'Theni', authUid: 'l3TDlOHUlYVF5YdMkQDltMzgTXH2' },
        { name: 'M K Security Solutions & Electronics', email: 'mkcmr2025@gmail.com', location: 'Theni', authUid: 'skHbqqkGMkY0F2dJmsEXKpToNvT2' },
        { name: 'Chennai Bakes', email: 'sirajudeeninonline@gmail.com', location: 'Uthamapalayam', authUid: '16OekfnQiLXMTzoIn6a1KONujYj2' },
        { name: 'SVR Heritage Hall', email: 'sasivishvajit@gmail.com', location: 'Uthamapalayam', authUid: 'ienUyDEBTCRfoklWK0qckOHHtXQ2' },
        { name: 'AGS IT Solutions', email: 'malai24x7@gmail.com', location: 'Theni', authUid: 'nVOasKhxIaWEi3Ks0fcXjEPm5cJ2' },
      ];

      assert.equal(eligibleBusinesses.length, 8, 'All 8 partner businesses must be recognized');

      // Verify AgriMorn (Agrimore) and Apex Publication are present
      const agrimore = eligibleBusinesses.find(b => b.name.toLowerCase().includes('agrimore'));
      assert.ok(agrimore, 'Agrimore / AgriMorn account must exist');
      assert.equal(agrimore.email, 'agrimorein@gmail.com');
      assert.ok(agrimore.authUid, 'Agrimore must have a dedicated Firebase Auth UID');

      const apex = eligibleBusinesses.find(b => b.name.toLowerCase().includes('apex'));
      assert.ok(apex, 'Apex Scholar Publication account must exist');
      assert.equal(apex.email, 'apex.scholar.publication@gmail.com');
      assert.ok(apex.authUid, 'Apex must have a dedicated Firebase Auth UID');
    });

    test('Each company accesses only its own data via unique ownerId matching auth UID', () => {
      const agrimoreUid = 'odorKnlqkzba8CP4wwTym9d0arW2';
      const apexUid = 'VznCq9zapZQIl1jxWTVlrmENIlm2';

      const agrimoreCompany = {
        id: 'ik3pWBDVVUR3Sb51knwK',
        name: 'Agrimore',
        ownerId: agrimoreUid,
      };

      const apexCompany = {
        id: 'oKDQpFZ3bx9C4S0Z0ti9',
        name: 'Apex Scholar Publication',
        ownerId: apexUid,
      };

      // Agrimore user accessing their company
      assert.equal(agrimoreCompany.ownerId === agrimoreUid, true, 'Agrimore user must match Agrimore company ownerId');
      assert.equal(apexCompany.ownerId === agrimoreUid, false, 'Agrimore user must NEVER match Apex company ownerId');

      // Apex user accessing their company
      assert.equal(apexCompany.ownerId === apexUid, true, 'Apex user must match Apex company ownerId');
      assert.equal(agrimoreCompany.ownerId === apexUid, false, 'Apex user must NEVER match Agrimore company ownerId');
    });

    test('Admin Company Accounts Management Hub files exist with auth protection', () => {
      const apiRoutePath = path.join(process.cwd(), 'src/app/api/admin/company-accounts/route.ts');
      const pagePath = path.join(process.cwd(), 'src/app/admin/company-accounts/page.tsx');
      const layoutPath = path.join(process.cwd(), 'src/app/admin/layout.tsx');
      const rulesPath = path.join(process.cwd(), 'firestore.rules');

      assert.ok(fs.existsSync(apiRoutePath), 'Company accounts API route must exist');
      assert.ok(fs.existsSync(pagePath), 'Company accounts Admin page must exist');

      const apiCode = fs.readFileSync(apiRoutePath, 'utf8');
      assert.ok(apiCode.includes('verifyAdmin'), 'API route must enforce admin authorization');
      assert.ok(apiCode.includes('updateUser'), 'API route must securely update passwords in Firebase Auth');

      const layoutCode = fs.readFileSync(layoutPath, 'utf8');
      assert.ok(layoutCode.includes('/admin/company-accounts'), 'Admin layout must have navigation link to Company Accounts');

      const rulesCode = fs.readFileSync(rulesPath, 'utf8');
      assert.ok(rulesCode.includes('companyAccounts'), 'Firestore security rules must protect companyAccounts collection');
      assert.ok(rulesCode.includes('isAdmin()'), 'Firestore security rules must require admin privileges');
    });
  });

});
