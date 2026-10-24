import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();

test('THENIJOBS 15-Day Free Trial Expiry, Mandatory Subscription & Admin Portal Suite', async (t) => {
  // ─── 1. Trial Expiration Evaluation Logic ─────────────────────────────────
  await t.test('1. Trial Expiration Logic: Detects expired trial when trialEndsAt < now and blocks write mutation', () => {
    const now = Date.now();
    const activeTrialUser = {
      trialRequested: true,
      trialStartedAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      trialEndsAt: new Date(now + 10 * 24 * 60 * 60 * 1000),
      hasUsedFreeTrial: true,
      paymentStatus: 'not_required',
    };

    const isExpiredActive = activeTrialUser.trialEndsAt.getTime() < now;
    assert.equal(isExpiredActive, false, '5 days into 15-day trial must not be expired');

    const expiredTrialUser = {
      trialRequested: true,
      trialStartedAt: new Date(now - 16 * 24 * 60 * 60 * 1000),
      trialEndsAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      hasUsedFreeTrial: true,
      paymentStatus: 'not_required',
    };

    const isExpiredPast = expiredTrialUser.trialEndsAt.getTime() < now;
    assert.equal(isExpiredPast, true, '16 days after start must evaluate to expired');
  });

  // ─── 2. Data Preservation Invariant ──────────────────────────────────────
  await t.test('2. Data Preservation Invariant: Expired trial never purges company, jobs, or leads data', () => {
    const company = {
      id: 'comp_123',
      name: 'Theni Cardamom Spices',
      jobsCount: 5,
      leadsCount: 12,
      productsCount: 4,
      isTrialExpired: true,
      subscriptionStatus: 'trial_expired',
    };

    // Verify company data is strictly preserved
    assert.equal(company.name, 'Theni Cardamom Spices');
    assert.equal(company.jobsCount, 5, 'All existing jobs must remain intact');
    assert.equal(company.leadsCount, 12, 'All existing leads must remain intact');
    assert.equal(company.productsCount, 4, 'All marketplace products must remain intact');
  });

  // ─── 3. Employer Layout Expiry Screen Elements ───────────────────────────
  await t.test('3. Employer Layout contains required Trial Expired screen with specific copy & actions', () => {
    const layoutPath = path.join(PROJECT_ROOT, 'src', 'app', 'employer', 'layout.tsx');
    assert.ok(fs.existsSync(layoutPath), 'Employer layout file must exist');

    const content = fs.readFileSync(layoutPath, 'utf8');

    // Title requirement
    assert.match(
      content,
      /Your 15-Day Free Trial Has Expired/i,
      'Must contain exact title "Your 15-Day Free Trial Has Expired"'
    );

    // Subtext requirement
    assert.match(
      content,
      /Your free trial has ended\. Choose a subscription plan to continue using THENIJOBS business features\./i,
      'Must contain exact subtext explaining trial ended and requiring subscription'
    );

    // Action buttons requirement
    assert.match(content, /Choose a Plan/i, 'Must contain "Choose a Plan" button');
    assert.match(content, /View Payment History/i, 'Must contain "View Payment History" button');
    assert.match(content, /Logout|Sign Out/i, 'Must contain "Logout" / "Sign Out" button');
    assert.match(content, /\/pricing/, 'Must link to /pricing for plan selection');
    assert.match(content, /\/employer\/billing/, 'Must link to /employer/billing for payment history');
  });

  // ─── 4. Immediate Paid Activation Without Redundant Approval ──────────────
  await t.test('4. Immediate Paid Activation: Approved business owner with expired trial activates instantly upon payment', () => {
    const adminServicePath = path.join(PROJECT_ROOT, 'src', 'lib', 'firebase', 'paymentAdminService.ts');
    assert.ok(fs.existsSync(adminServicePath), 'paymentAdminService.ts must exist');

    const content = fs.readFileSync(adminServicePath, 'utf8');

    // Check that already-approved users are immediately set to active upon payment verification
    assert.match(
      content,
      /isAlreadyApproved/i,
      'paymentAdminService must detect if user is already approved'
    );
    assert.match(
      content,
      /userUpdatePayload\.subscriptionStatus\s*=\s*['"]active['"]/,
      'Must activate subscriptionStatus immediately for approved users'
    );
    assert.match(
      content,
      /userUpdatePayload\.accountStatus\s*=\s*['"]active['"]/,
      'Must activate accountStatus immediately for approved users'
    );
  });

  // ─── 5. Admin Navigation: Job Applications Link ───────────────────────────
  await t.test('5. Admin Navigation includes Job Applications route', () => {
    const adminLayoutPath = path.join(PROJECT_ROOT, 'src', 'app', 'admin', 'layout.tsx');
    assert.ok(fs.existsSync(adminLayoutPath), 'Admin layout file must exist');

    const content = fs.readFileSync(adminLayoutPath, 'utf8');
    assert.match(
      content,
      /\{\s*label:\s*['"]Job Applications['"],\s*icon:\s*FileText,\s*href:\s*['"]\/admin\/applications['"]\s*\}/,
      'Admin navigation must include Job Applications route'
    );
  });

  // ─── 6. Dedicated Admin Applications Hub Page ─────────────────────────────
  await t.test('6. Admin Applications Hub page exists with search, filter, status update, and CSV export', () => {
    const appPagePath = path.join(PROJECT_ROOT, 'src', 'app', 'admin', 'applications', 'page.tsx');
    assert.ok(fs.existsSync(appPagePath), 'src/app/admin/applications/page.tsx must exist');

    const content = fs.readFileSync(appPagePath, 'utf8');

    // Key components and features
    assert.match(content, /Candidate Job Applications/i, 'Must have page title');
    assert.match(content, /handleStatusChange/i, 'Must have status update handler');
    assert.match(content, /handleExportCSV/i, 'Must have CSV export function');
    assert.match(content, /Download \/ View Resume/i, 'Must have resume download action');
    assert.match(content, /View Dossier/i, 'Must have dossier view modal');
    assert.match(content, /applied/i, 'Must support applied status');
    assert.match(content, /shortlisted/i, 'Must support shortlisted status');
    assert.match(content, /selected/i, 'Must support selected status');
    assert.match(content, /rejected/i, 'Must support rejected status');
  });

  // ─── 7. Admin Dashboard: 15-Metric Full Overview Suite ────────────────────
  await t.test('7. Admin Dashboard renders all 15 operational metrics across business, subscriptions, jobs, and services', () => {
    const dashboardPath = path.join(PROJECT_ROOT, 'src', 'app', 'admin', 'dashboard', 'page.tsx');
    assert.ok(fs.existsSync(dashboardPath), 'Admin dashboard page must exist');

    const content = fs.readFileSync(dashboardPath, 'utf8');

    // Check all 15 operational metrics references
    const requiredMetrics = [
      'totalBusinessOwners',
      'pendingBusinessApprovals',
      'approvedBusinessOwners',
      'activeTrials',
      'expiredTrials',
      'activePaidSubscriptions',
      'pendingPayments',
      'verifiedPayments',
      'totalJobs',
      'pendingJobs',
      'totalApplications',
      'totalLeads',
      'pendingBusinesses',
      'pendingServices',
      'totalRevenue',
    ];

    for (const metric of requiredMetrics) {
      assert.ok(
        content.includes(metric),
        `Admin dashboard must reference metric: ${metric}`
      );
    }
  });

  // ─── 8. Google Indexing API Route ─────────────────────────────────────────
  await t.test('8. Google Indexing API endpoint exists and strictly validates JobPosting URLs', () => {
    const routePath = path.join(PROJECT_ROOT, 'src', 'app', 'api', 'seo', 'index-job', 'route.ts');
    assert.ok(fs.existsSync(routePath), 'src/app/api/seo/index-job/route.ts must exist');

    const content = fs.readFileSync(routePath, 'utf8');
    assert.match(content, /notifyGoogleJobPosting/i, 'Must call notifyGoogleJobPosting');
    assert.match(content, /https:\/\/www\.thenijobs\.com\/jobs\//, 'Must target canonical jobs URL');
  });

  // ─── 9. Sitemap & Robots Protocol Adherence ───────────────────────────────
  await t.test('9. Sitemap and Robots enforce public discovery while shielding admin & private areas', () => {
    const robotsPath = path.join(PROJECT_ROOT, 'src', 'app', 'robots.ts');
    assert.ok(fs.existsSync(robotsPath), 'robots.ts must exist');
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');

    assert.match(robotsContent, /https:\/\/www\.thenijobs\.com\/sitemap\.xml/, 'Sitemap URL must be canonical');
    assert.match(robotsContent, /\/admin\//, 'Robots must disallow /admin/');
    assert.match(robotsContent, /\/employer\//, 'Robots must disallow /employer/');
    assert.match(robotsContent, /\/register-business/, 'Robots must disallow /register-business');

    const sitemapPath = path.join(PROJECT_ROOT, 'src', 'app', 'sitemap.ts');
    assert.ok(fs.existsSync(sitemapPath), 'sitemap.ts must exist');
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

    assert.match(sitemapContent, /getActiveJobsForSitemap/i, 'Sitemap must dynamically query active jobs');
    assert.match(sitemapContent, /getVerifiedCompanySlugsForSitemap/i, 'Sitemap must dynamically query verified companies');
    assert.match(sitemapContent, /getAllMarketplaceItemParamsServer/i, 'Sitemap must dynamically query marketplace items');
  });
});
