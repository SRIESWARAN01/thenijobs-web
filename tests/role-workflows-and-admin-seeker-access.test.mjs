import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Import helper functions under test
import { resolveAuthRedirect, isSafeRedirectUrl } from '../src/lib/authRedirect.ts';
import { safeExternalUrl } from '../src/lib/safeUrl.ts';
import { sanitizeWhatsAppPhone } from '../src/lib/constants.ts';

describe('THENIJOBS — Full Role Workflow & Admin-to-Seeker Access Suite', () => {

  // ─── 1. Role Definitions & Redirection Matrix ───────────────────────────────
  describe('Role Definitions & Redirection Matrix', () => {
    test('resolveAuthRedirect correctly maps Admin and Super Admin to /admin/dashboard', () => {
      assert.strictEqual(resolveAuthRedirect({ role: 'admin' }), '/admin/dashboard');
      assert.strictEqual(resolveAuthRedirect({ role: 'super_admin' }), '/admin/dashboard');
    });

    test('resolveAuthRedirect correctly maps Job Seeker to /seeker/dashboard or safe custom URL', () => {
      assert.strictEqual(resolveAuthRedirect({ role: 'job_seeker' }), '/seeker/dashboard');
      assert.strictEqual(
        resolveAuthRedirect({ role: 'job_seeker' }, '/seeker/jobs'),
        '/seeker/jobs'
      );
      assert.strictEqual(
        resolveAuthRedirect({ role: 'job_seeker' }, 'https://malicious.com'),
        '/seeker/dashboard'
      );
    });

    test('resolveAuthRedirect correctly maps Employee to /employer/dashboard', () => {
      assert.strictEqual(resolveAuthRedirect({ role: 'employee' }), '/employer/dashboard');
      assert.strictEqual(
        resolveAuthRedirect({ role: 'employee' }, '/employer/candidates'),
        '/employer/candidates'
      );
    });

    test('resolveAuthRedirect blocks unapproved Business Owners from dashboard', () => {
      const pendingOwner = {
        role: 'business_owner',
        approvalStatus: 'pending',
        selectedPlan: 'standard',
      };
      assert.strictEqual(resolveAuthRedirect(pendingOwner), '/register-business');

      const rejectedOwner = {
        role: 'business_owner',
        approvalStatus: 'rejected',
      };
      assert.strictEqual(resolveAuthRedirect(rejectedOwner), '/register-business');
    });

    test('resolveAuthRedirect allows approved Business Owners to /employer/dashboard', () => {
      const approvedOwner = {
        role: 'business_owner',
        approvalStatus: 'approved',
        accountStatus: 'active',
        selectedPlan: 'standard',
      };
      assert.strictEqual(resolveAuthRedirect(approvedOwner), '/employer/dashboard');
    });

    test('resolveAuthRedirect sends unassigned or null user to /login or /register', () => {
      assert.strictEqual(resolveAuthRedirect(null), '/login');
      assert.strictEqual(resolveAuthRedirect({ role: undefined }), '/register');
    });
  });

  // ─── 2. Firestore Security Rules for Career Growth & Employee Access ─────────
  describe('Firestore Security Rules Inspection', () => {
    const rulesPath = path.resolve('firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

    test('isEmployerOrOwner helper includes employee role', () => {
      assert.ok(
        rulesContent.includes("'employee'"),
        "isEmployerOrOwner() must include 'employee' role"
      );
      assert.ok(
        /isEmployerOrOwner\(\)[\s\S]*?'employee'/.test(rulesContent),
        "isEmployerOrOwner() function definition must contain 'employee'"
      );
    });

    test('firestore.rules contains Career Growth collections rules', () => {
      const requiredCollections = [
        'skillCategories',
        'skillCourses',
        'learningPaths',
        'lessons',
        'quizzes',
        'quizAttempts',
        'enrollments',
        'certificates',
        'certificateTemplates',
        'aiContentRequests',
        'settings',
      ];

      for (const col of requiredCollections) {
        assert.ok(
          rulesContent.includes(`match /${col}/`),
          `firestore.rules must contain rule definition for collection: ${col}`
        );
      }
    });

    test('Career Growth rules grant admin write permissions and learner access', () => {
      // Admin should be able to create/update/delete courses
      assert.ok(
        /match \/skillCourses\/[\s\S]*?allow create, update, delete: if isAdmin\(\)/.test(rulesContent),
        'Admin must have write access to skillCourses'
      );
      // Learners should be able to enroll and take quizzes
      assert.ok(
        /match \/enrollments\/[\s\S]*?request\.resource\.data\.userId == request\.auth\.uid/.test(rulesContent),
        'Learners must be able to create their own enrollment'
      );
      assert.ok(
        /match \/quizAttempts\/[\s\S]*?request\.resource\.data\.userId == request\.auth\.uid/.test(rulesContent),
        'Learners must be able to submit their own quiz attempts'
      );
      // Certificates must be publicly readable for verification
      assert.ok(
        /match \/certificates\/[\s\S]*?allow read: if true;/.test(rulesContent),
        'Certificates must be publicly readable for instant verification'
      );
    });
  });

  // ─── 3. Admin Job Seekers Management Feature ───────────────────────────────
  describe('Admin Job Seekers Management Page & Dossier', () => {
    const pagePath = path.resolve('src/app/admin/job-seekers/page.tsx');

    test('admin/job-seekers/page.tsx exists and is populated', () => {
      assert.ok(fs.existsSync(pagePath), 'admin/job-seekers/page.tsx must exist');
      const content = fs.readFileSync(pagePath, 'utf-8');
      assert.ok(content.length > 500, 'Page file must contain implementation');
    });

    test('admin/job-seekers connects to both users and seekerProfiles collections', () => {
      const content = fs.readFileSync(pagePath, 'utf-8');
      assert.ok(content.includes("'users'"), "Must query 'users' collection");
      assert.ok(content.includes("'seekerProfiles'"), "Must query 'seekerProfiles' collection");
      assert.ok(content.includes('handleVerifyCandidate'), 'Must contain candidate verification handler');
      assert.ok(content.includes('handleRevokeVerification'), 'Must contain candidate revocation handler');
    });

    test('Admin Navigation in layout.tsx links to /admin/job-seekers', () => {
      const layoutPath = path.resolve('src/app/admin/layout.tsx');
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      assert.ok(
        layoutContent.includes('/admin/job-seekers'),
        "ADMIN_NAV in src/app/admin/layout.tsx must contain '/admin/job-seekers'"
      );
      assert.ok(
        layoutContent.includes('Job Seekers'),
        "ADMIN_NAV must label the route 'Job Seekers'"
      );
    });

    test('admin/users/page.tsx contains quick link to View Seeker Dossier & Resume', () => {
      const usersPagePath = path.resolve('src/app/admin/users/page.tsx');
      const usersContent = fs.readFileSync(usersPagePath, 'utf-8');
      assert.ok(
        usersContent.includes('/admin/job-seekers?q='),
        'Users page must link job seeker rows to /admin/job-seekers with query parameter'
      );
    });
  });

  // ─── 4. Candidate Dossier Data Merging & Resume Security ────────────────────
  describe('Candidate Dossier Merging & Resume URL Sanitization', () => {
    function mergeCandidateData(user, profile) {
      return {
        id: user.id,
        name: profile?.name || user.displayName || user.name || 'Job Seeker',
        email: profile?.email || user.email || 'N/A',
        phone: profile?.phone || user.phone || '',
        district: profile?.district || user.district || 'Theni',
        isVerified: Boolean(profile?.isVerified || user.isVerified),
        status: user.status || 'active',
        resumeUrl: profile?.resumeUrl,
        skills: profile?.skills || [],
        currentRole: profile?.currentRole || profile?.designation || profile?.headline || '',
        isPortfolioPublic: Boolean(profile?.isPortfolioPublic),
      };
    }

    test('Merges user identity with rich seeker profile details', () => {
      const mockUser = {
        id: 'usr_101',
        displayName: 'Anand Kumar',
        email: 'anand@example.com',
        phone: '9842100000',
        role: 'job_seeker',
        isVerified: false,
      };

      const mockProfile = {
        id: 'usr_101',
        name: 'Anand Kumar, M.Com',
        email: 'anand@example.com',
        district: 'Periyakulam',
        skills: ['Tally Prime', 'GST Filing', 'MS Excel'],
        currentRole: 'Senior Accounts Executive',
        resumeUrl: 'https://firebasestorage.googleapis.com/v0/b/thenijobs/resume_101.pdf',
        isVerified: true,
        isPortfolioPublic: true,
      };

      const merged = mergeCandidateData(mockUser, mockProfile);
      assert.strictEqual(merged.id, 'usr_101');
      assert.strictEqual(merged.name, 'Anand Kumar, M.Com');
      assert.strictEqual(merged.district, 'Periyakulam');
      assert.strictEqual(merged.isVerified, true);
      assert.strictEqual(merged.skills.length, 3);
      assert.strictEqual(merged.currentRole, 'Senior Accounts Executive');
      assert.strictEqual(merged.isPortfolioPublic, true);
      assert.ok(merged.resumeUrl.endsWith('.pdf'));
    });

    test('Gracefully handles job seekers without an explicit seekerProfiles document', () => {
      const mockUser = {
        id: 'usr_fresher',
        displayName: 'Kavitha S',
        email: 'kavitha@example.com',
        role: 'job_seeker',
        district: 'Cumbum',
        isVerified: false,
      };

      const merged = mergeCandidateData(mockUser, null);
      assert.strictEqual(merged.id, 'usr_fresher');
      assert.strictEqual(merged.name, 'Kavitha S');
      assert.strictEqual(merged.district, 'Cumbum');
      assert.strictEqual(merged.isVerified, false);
      assert.strictEqual(merged.skills.length, 0);
      assert.strictEqual(merged.resumeUrl, undefined);
    });

    test('safeExternalUrl sanitizes dangerous JavaScript URLs in candidate resumes', () => {
      assert.strictEqual(safeExternalUrl('javascript:alert(1)'), undefined);
      assert.strictEqual(safeExternalUrl('data:text/html,<script>alert(1)</script>'), undefined);
      assert.strictEqual(
        safeExternalUrl('https://firebasestorage.googleapis.com/resumes/my_resume.pdf'),
        'https://firebasestorage.googleapis.com/resumes/my_resume.pdf'
      );
    });
  });

  // ─── 5. Candidate Subscription Integration in Admin Portal ──────────────────
  describe('Admin Subscriptions Seeker Pro Plan Support', () => {
    const adminSubsPath = path.resolve('src/app/admin/subscriptions/page.tsx');
    const adminSubsContent = fs.readFileSync(adminSubsPath, 'utf-8');

    test('Admin subscriptions page supports seeker_pro plan config', () => {
      assert.ok(
        adminSubsContent.includes('seeker_pro:'),
        "PLAN_CONFIG must contain 'seeker_pro' mapping"
      );
      assert.ok(
        adminSubsContent.includes('Pro Candidate'),
        "PLAN_CONFIG must label seeker_pro as 'Pro Candidate'"
      );
    });

    test('Admin subscriptions filter includes Candidate Pro (₹199) option', () => {
      assert.ok(
        adminSubsContent.includes("value: 'seeker_pro'"),
        "FilterSelect must include option with value 'seeker_pro'"
      );
    });

    test('Subscription search checks userName and displayName for individual candidates', () => {
      assert.ok(
        adminSubsContent.includes('sub.userName') || adminSubsContent.includes('sub.displayName'),
        'Filtered subscriptions must inspect candidate userName / displayName'
      );
    });
  });

  // ─── 6. Employer Layout & Employee Access Guard ─────────────────────────────
  describe('Employer Layout Employee Role Access', () => {
    const employerLayoutPath = path.resolve('src/app/employer/layout.tsx');
    const layoutContent = fs.readFileSync(employerLayoutPath, 'utf-8');

    test('EmployerLayout permits employee role in useRequireAuth', () => {
      assert.ok(
        layoutContent.includes("'employee'"),
        "EmployerLayout must include 'employee' in allowedRoles whitelist"
      );
    });
  });
});
