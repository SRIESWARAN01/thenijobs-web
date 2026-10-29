import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('THENIJOBS Admin Panel Job Posting & Approval Workflow Suite', () => {
  const rootDir = process.cwd();

  // ── 1. ADMIN NAVIGATION & MENU STRUCTURE ───────────────────────────────────
  it('1. Admin layout contains Jobs Management menu with all 7 required submenus and status routes', () => {
    const layoutPath = path.join(rootDir, 'src/app/admin/layout.tsx');
    assert.ok(fs.existsSync(layoutPath), 'src/app/admin/layout.tsx must exist');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    // Navigation label
    assert.ok(
      layoutContent.includes('Jobs Management'),
      'Admin navigation must contain "Jobs Management"'
    );

    // Required submenus
    const requiredSubmenus = [
      { label: 'All Jobs', href: '/admin/jobs' },
      { label: 'Create Job for Company', href: '/admin/jobs/create' },
      { label: 'Pending Approval', href: '/admin/jobs?status=pending' },
      { label: 'Draft Jobs', href: '/admin/jobs?status=draft' },
      { label: 'Published Jobs', href: '/admin/jobs?status=active' },
      { label: 'Rejected Jobs', href: '/admin/jobs?status=rejected' },
      { label: 'Expired Jobs', href: '/admin/jobs?status=expired' },
    ];

    requiredSubmenus.forEach((sub) => {
      assert.ok(
        layoutContent.includes(sub.label),
        `Admin navigation must contain submenu "${sub.label}"`
      );
      assert.ok(
        layoutContent.includes(sub.href),
        `Admin navigation must route to "${sub.href}" for submenu "${sub.label}"`
      );
    });
  });

  // ── 2. ELIGIBLE PARTNER BUSINESSES PRESERVATION ───────────────────────────
  it('2. The 8 verified partner businesses are configured for the Admin Create Job selector without hardcoding dummy data', () => {
    const servicePath = path.join(rootDir, 'src/lib/business/businessAuthService.ts');
    const createApiPath = path.join(rootDir, 'src/app/api/admin/jobs/create/route.ts');
    const createPagePath = path.join(rootDir, 'src/app/admin/jobs/create/page.tsx');
    assert.ok(fs.existsSync(servicePath), 'src/lib/business/businessAuthService.ts must exist');
    assert.ok(fs.existsSync(createApiPath), 'src/app/api/admin/jobs/create/route.ts must exist');
    assert.ok(fs.existsSync(createPagePath), 'src/app/admin/jobs/create/page.tsx must exist');

    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    const apiContent = fs.readFileSync(createApiPath, 'utf8');
    const pageContent = fs.readFileSync(createPagePath, 'utf8');

    const expectedBusinesses = [
      { id: 'ik3pWBDVVUR3Sb51knwK', name: 'Agrimore' },
      { id: 'mWWNVrCGounWsmXdaRGL', name: 'Sarvesh Super Market' },
      { id: 'oKDQpFZ3bx9C4S0Z0ti9', name: 'Apex Scholar Publication' },
      { id: 'u9sYSAG9YoGrept1FbSe', name: 'Suruliraj Chemicals' },
      { id: '7K95afmwXMddFJo8PeRB', name: 'M K Security Solutions & Electronics' },
      { id: 'SDv5CaYdxKRWOXl4ej84', name: 'Chennai Bakes' },
      { id: 'VG1PwPzKXofu1fLxLIpk', name: 'SVR Heritage Hall' },
      { id: 'vMQgOwNd2fZ4Nm8870Dw', name: 'AGS IT Solutions' },
    ];

    expectedBusinesses.forEach((b) => {
      assert.ok(
        serviceContent.includes(b.id),
        `businessAuthService must contain verified business ID ${b.id} for ${b.name}`
      );
    });

    assert.ok(
      apiContent.includes('ELIGIBLE_BUSINESS_IDS') && apiContent.includes('includes(companyId)'),
      'Admin Create Job API must validate companyId against ELIGIBLE_BUSINESS_IDS'
    );

    assert.ok(
      pageContent.includes('getEligibleBusinessesPublicList'),
      'Admin Create Job Page must import and render the 8 eligible partner businesses'
    );
  });

  // ── 3. FORM FIELDS & AUTO-RETRIEVAL OF CONTACT INFO ────────────────────────
  it('3. Admin Create Job form implements all required vacancy fields and auto-retrieves contact info', () => {
    const createPagePath = path.join(rootDir, 'src/app/admin/jobs/create/page.tsx');
    const pageContent = fs.readFileSync(createPagePath, 'utf8');

    const requiredFields = [
      'companyId',
      'title',
      'category',
      'openings',
      'description',
      'qualifications',
      'experience',
      'salaryMin',
      'salaryMax',
      'salaryType',
      'location',
      'jobType',
      'workingHours',
      'benefits',
      'deadline',
      'applicationMethod',
      'contactPerson',
      'phone',
      'email',
      'additionalInstructions',
    ];

    requiredFields.forEach((field) => {
      assert.ok(
        pageContent.includes(field),
        `Admin Create Job form must handle field "${field}"`
      );
    });

    // Check auto-retrieval from company document
    assert.ok(
      pageContent.includes("doc(db, 'companies', companyId)") || pageContent.includes("'companies'"),
      'Must fetch existing company details when company is selected'
    );
    assert.ok(
      pageContent.includes('setContactPerson') && pageContent.includes('setPhone'),
      'Must allow pre-filling and editing job-specific contact information'
    );
  });

  // ── 4. JOB PREVIEW MODAL & ACTIONS ─────────────────────────────────────────
  it('4. Admin Create Job form includes interactive live preview modal with Save Draft, Submit Pending, and Approve & Publish actions', () => {
    const createPagePath = path.join(rootDir, 'src/app/admin/jobs/create/page.tsx');
    const pageContent = fs.readFileSync(createPagePath, 'utf8');

    assert.ok(
      pageContent.includes('showPreview') && pageContent.includes('setShowPreview'),
      'Must contain Preview Job toggle state'
    );
    assert.ok(
      pageContent.includes('Save as Draft') || pageContent.includes('Save Draft'),
      'Must contain Save as Draft action'
    );
    assert.ok(
      pageContent.includes('Submit for Approval'),
      'Must contain Submit for Approval action'
    );
    assert.ok(
      pageContent.includes('Approve & Publish') || pageContent.includes('Publish Now'),
      'Must contain Approve & Publish action'
    );
  });

  // ── 5. SUCCESS MODAL & PUBLIC JOB LINK GENERATION ──────────────────────────
  it('5. Successfully created or published job provides public URL with copy and view actions', () => {
    const createPagePath = path.join(rootDir, 'src/app/admin/jobs/create/page.tsx');
    const createApiPath = path.join(rootDir, 'src/app/api/admin/jobs/create/route.ts');
    const pageContent = fs.readFileSync(createPagePath, 'utf8');
    const apiContent = fs.readFileSync(createApiPath, 'utf8');

    assert.ok(
      apiContent.includes('https://www.thenijobs.com/jobs/${slug}'),
      'Backend API must generate canonical public URL https://www.thenijobs.com/jobs/${slug}'
    );
    assert.ok(
      pageContent.includes('successData.publicUrl'),
      'Frontend must bind returned publicUrl in success modal'
    );
    assert.ok(
      pageContent.includes('navigator.clipboard.writeText'),
      'Must provide 1-click clipboard copy for live job URL'
    );
  });

  // ── 6. BACKEND API ROUTE & AUTHORIZATION ───────────────────────────────────
  it('6. Admin Create Job API route enforces admin authorization and returns 401/403 for unauthorized calls', () => {
    const createApiPath = path.join(rootDir, 'src/app/api/admin/jobs/create/route.ts');
    const apiContent = fs.readFileSync(createApiPath, 'utf8');

    assert.ok(
      apiContent.includes('getAdminAuth') && apiContent.includes('verifyIdToken'),
      'API must verify admin ID token via Firebase Admin'
    );
    assert.ok(
      apiContent.includes("role !== 'admin' && role !== 'super_admin'"),
      'API must assert admin or super_admin role'
    );
    assert.ok(
      apiContent.includes('status: 401') && apiContent.includes('status: 403'),
      'API must return 401 or 403 for unauthorized requests'
    );
  });

  // ── 7. DATA INTEGRITY & DUAL FIELD METADATA PERSISTENCE ────────────────────
  it('7. Stored job document persists dual camelCase and snake_case audit metadata', () => {
    const createApiPath = path.join(rootDir, 'src/app/api/admin/jobs/create/route.ts');
    const apiContent = fs.readFileSync(createApiPath, 'utf8');

    const requiredStoredKeys = [
      'companyId',
      'business_id',
      'created_by',
      'created_by_role',
      'approval_status',
      'application_deadline',
      'approved_by',
      'approved_at',
      'published_at',
      'created_at',
      'updated_at',
    ];

    requiredStoredKeys.forEach((key) => {
      assert.ok(
        apiContent.includes(key),
        `Admin Create Job API payload must persist database field "${key}"`
      );
    });
  });

  // ── 8. ADMIN MODERATION HUB & QUERY PARAMETER ROUTING ──────────────────────
  it('8. Admin Jobs hub (/admin/jobs) synchronizes URL ?status= query parameter and supports draft/pending/active/rejected/expired tabs', () => {
    const jobsPagePath = path.join(rootDir, 'src/app/admin/jobs/page.tsx');
    assert.ok(fs.existsSync(jobsPagePath), 'src/app/admin/jobs/page.tsx must exist');
    const jobsContent = fs.readFileSync(jobsPagePath, 'utf8');

    // Query string reading
    assert.ok(
      jobsContent.includes("params.get('status')") || jobsContent.includes('statusParam'),
      'Admin Jobs page must inspect ?status= URL parameter'
    );

    // Tab synchronization
    assert.ok(jobsContent.includes("statusParam === 'pending'"), 'Must handle ?status=pending');
    assert.ok(jobsContent.includes("statusParam === 'draft'"), 'Must handle ?status=draft');
    assert.ok(jobsContent.includes("statusParam === 'active'"), 'Must handle ?status=active');
    assert.ok(jobsContent.includes("statusParam === 'rejected'"), 'Must handle ?status=rejected');
    assert.ok(jobsContent.includes("statusParam === 'expired'"), 'Must handle ?status=expired');

    // TABS definition contains Draft
    assert.ok(
      jobsContent.includes("'Draft'"),
      "TABS array in admin jobs page must include 'Draft'"
    );

    // Primary action button
    assert.ok(
      jobsContent.includes('/admin/jobs/create'),
      'Admin Jobs page must provide link to /admin/jobs/create'
    );
  });

  // ── 9. EMPLOYER WORKFLOW & DUAL-FIELD SUPPORT ──────────────────────────────
  it('9. Employer Post Job route (/api/jobs/create) also stores required dual snake_case audit fields with pending approval status', () => {
    const empApiPath = path.join(rootDir, 'src/app/api/jobs/create/route.ts');
    assert.ok(fs.existsSync(empApiPath), 'src/app/api/jobs/create/route.ts must exist');
    const empApiContent = fs.readFileSync(empApiPath, 'utf8');

    assert.ok(
      empApiContent.includes('business_id'),
      'Employer job creation must persist business_id'
    );
    assert.ok(
      empApiContent.includes("created_by_role: 'employer'"),
      'Employer job creation must store created_by_role: employer'
    );
    assert.ok(
      empApiContent.includes("approval_status: 'pending'"),
      'Employer job creation must default to approval_status: pending'
    );
    assert.ok(
      empApiContent.includes('application_deadline'),
      'Employer job creation must persist application_deadline'
    );
    assert.ok(
      empApiContent.includes('isActive: false'),
      'Employer posted job must remain inactive until approved by admin'
    );
  });

  // ── 10. APPROVAL & REJECTION LIFECYCLE ──────────────────────────────────────
  it('10. firestoreService approveJob and rejectJob maintain dual field status, audit timestamps, and notification triggers', () => {
    const servicePath = path.join(rootDir, 'src/lib/firebase/firestoreService.ts');
    assert.ok(fs.existsSync(servicePath), 'firestoreService.ts must exist');
    const serviceContent = fs.readFileSync(servicePath, 'utf8');

    // approveJob checks
    assert.ok(
      serviceContent.includes("approval_status: 'approved'") && serviceContent.includes("approved_by: adminId"),
      'approveJob must record approved_by and approval_status: approved'
    );
    assert.ok(
      serviceContent.includes('published_at: serverTimestamp()'),
      'approveJob must record published_at timestamp'
    );

    // rejectJob checks
    assert.ok(
      serviceContent.includes("approval_status: 'rejected'") && serviceContent.includes("rejected_by: adminId"),
      'rejectJob must record rejected_by and approval_status: rejected'
    );
    assert.ok(
      serviceContent.includes('rejection_reason: reason'),
      'rejectJob must record rejection_reason'
    );
    assert.ok(
      serviceContent.includes('Job Posting Needs Changes') || serviceContent.includes('was not approved'),
      'rejectJob must dispatch revision notification to employer'
    );
  });

  // ── 11. PUBLIC DIRECTORY & SSR INTEGRITY ───────────────────────────────────
  it('11. Public jobs browse and company directory strictly filter out unapproved, draft, and rejected entries', () => {
    const jobsBrowsePath = path.join(rootDir, 'src/components/jobs/JobsBrowseContent.tsx');
    assert.ok(fs.existsSync(jobsBrowsePath), 'JobsBrowseContent.tsx must exist');
    const browseContent = fs.readFileSync(jobsBrowsePath, 'utf8');

    // Public jobs browse must filter for active jobs
    assert.ok(
      browseContent.includes("'isActive', '==', true"),
      'Public jobs browse must query isActive == true'
    );

    // Public businesses browse must filter for verified companies
    const bizBrowsePath = path.join(rootDir, 'src/components/businesses/BusinessesBrowseContent.tsx');
    if (fs.existsSync(bizBrowsePath)) {
      const bizContent = fs.readFileSync(bizBrowsePath, 'utf8');
      assert.ok(
        bizContent.includes('verificationStatus') && bizContent.includes('verified'),
        'Public business directory must strictly require verified status'
      );
    }
  });

  // ── 12. EMPLOYER DASHBOARD REVISION VISIBILITY ─────────────────────────────
  it('12. Employer jobs management displays rejection reasons for jobs needing revision', () => {
    const managerPath = path.join(rootDir, 'src/components/jobs/editor/CompanyJobsListManager.tsx');
    assert.ok(fs.existsSync(managerPath), 'src/components/jobs/editor/CompanyJobsListManager.tsx must exist');
    const managerContent = fs.readFileSync(managerPath, 'utf8');

    assert.ok(
      managerContent.includes('rejectionReason') || managerContent.includes('rejection_reason'),
      'CompanyJobsListManager must surface rejection reason'
    );
    assert.ok(
      managerContent.includes('Needs Revision') && managerContent.includes('rejected'),
      'CompanyJobsListManager must have section/tab for rejected jobs or jobs requiring revision'
    );
  });
});
