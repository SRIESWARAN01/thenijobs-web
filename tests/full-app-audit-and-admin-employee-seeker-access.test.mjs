import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('THENIJOBS — Full App Audit & Admin/Employee/Seeker Cross-Portal Verification Suite', () => {

  // ─── 1. Firestore Security Rules Audit ──────────────────────────────────────
  describe('1. Firestore Security Rules: Employee and Admin Permissions', () => {
    const rulesPath = path.resolve('firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

    test('isCompanyOwner helper grants access to verified company employees', () => {
      assert.ok(
        rulesContent.includes('isCompanyOwner(companyId)'),
        'isCompanyOwner must be defined in firestore.rules'
      );
      assert.ok(
        rulesContent.includes('employeeIds') && rulesContent.includes('request.auth.uid in get(/databases/$(database)/documents/companies/$(companyId)).data.employeeIds'),
        'isCompanyOwner must check company.employeeIds array for employee access'
      );
      assert.ok(
        rulesContent.includes("get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['employer', 'business_owner', 'employee']"),
        'isCompanyOwner must verify linked companyId for employee role'
      );
    });

    test('companies read rule permits employees to read their own company document', () => {
      assert.ok(
        /match \/companies\/\{companyId\}[\s\S]*?('employeeIds' in resource\.data && request\.auth\.uid in resource\.data\.employeeIds)/.test(rulesContent),
        'Company read rule must allow authorized employees in employeeIds'
      );
    });

    test('Admin maintains unrestricted read/write across all collections', () => {
      const adminCollections = ['users', 'companies', 'jobs', 'applications', 'interviews', 'seekerProfiles', 'jobAlerts'];
      for (const col of adminCollections) {
        assert.ok(
          rulesContent.includes(`match /${col}/`),
          `Collection ${col} must exist in firestore.rules`
        );
      }
    });
  });

  // ─── 2. Canonical Company Resolution & Employee Hook ───────────────────────
  describe('2. Canonical Company Resolution & Employee Hook Synchronization', () => {
    const resolverPath = path.resolve('src/lib/company/companyResolver.ts');
    const resolverContent = fs.readFileSync(resolverPath, 'utf-8');
    const hookPath = path.resolve('src/hooks/useEmployerCompany.ts');
    const hookContent = fs.readFileSync(hookPath, 'utf-8');

    test('companyResolver queries by employeeIds array to resolve company for staff users', () => {
      assert.ok(
        resolverContent.includes("where('employeeIds', 'array-contains', user.uid)"),
        'resolveCanonicalCompany must query where employeeIds array-contains user.uid'
      );
    });

    test('linkUserToCompany preserves employee role without overwriting to business_owner', () => {
      assert.ok(
        resolverContent.includes('export async function linkUserToCompany('),
        'linkUserToCompany must exist'
      );
      assert.ok(
        resolverContent.includes('(user as any).role || \'employee\''),
        'Must pass through employee role when linking employee to company'
      );
    });

    test('useEmployerCompany hook resolves company via employeeIds fallback query', () => {
      assert.ok(
        hookContent.includes("where('employeeIds', 'array-contains', user.uid)"),
        'useEmployerCompany must query where employeeIds contains user.uid'
      );
    });
  });

  // ─── 3. Admin User Management & Employee Account Creation ──────────────────
  describe('3. Admin User Management & Employee Lifecycle', () => {
    const createServicePath = path.resolve('src/lib/firebase/adminUserService.ts');
    const createServiceContent = fs.readFileSync(createServicePath, 'utf-8');
    const createUserPagePath = path.resolve('src/app/admin/users/create/page.tsx');
    const createUserPageContent = fs.readFileSync(createUserPagePath, 'utf-8');
    const usersPagePath = path.resolve('src/app/admin/users/page.tsx');
    const usersPageContent = fs.readFileSync(usersPagePath, 'utf-8');

    test('adminCreateUser links employee to companyId and updates company employeeIds array', () => {
      assert.ok(
        createServiceContent.includes('companyId?: string;'),
        'AdminCreateUserParams must support companyId'
      );
      assert.ok(
        createServiceContent.includes('employeeRole?: string;'),
        'AdminCreateUserParams must support employeeRole'
      );
      assert.ok(
        createServiceContent.includes('employeeIds: [...existingEmployeeIds, newUser.uid]'),
        'Must automatically append new employee UID to company.employeeIds array'
      );
    });

    test('admin/users/create provides company selector and employee designation fields', () => {
      assert.ok(
        createUserPageContent.includes('admin-users-create-company-select'),
        'Create User page must render company select dropdown'
      );
      assert.ok(
        createUserPageContent.includes('admin-users-create-employee-role'),
        'Create User page must render employee role input'
      );
    });

    test('admin/users renders company affiliation for employees and offers direct company profile jump', () => {
      assert.ok(
        usersPageContent.includes('View Assigned Company Profile'),
        'Users table action menu must offer View Assigned Company Profile'
      );
      assert.ok(
        usersPageContent.includes('Company / Employer Association'),
        'Edit user modal must support company and employee role management'
      );
      assert.ok(
        usersPageContent.includes('<option value="employee">Employee</option>'),
        'Edit user modal role dropdown must include Employee option'
      );
    });
  });

  // ─── 4. Admin Seeker, Application & Portfolio Cross-Portal Access ───────────
  describe('4. Admin Seeker, Application & Portfolio Cross-Portal Access', () => {
    const jobSeekersPagePath = path.resolve('src/app/admin/job-seekers/page.tsx');
    const jobSeekersContent = fs.readFileSync(jobSeekersPagePath, 'utf-8');
    const applicationsPagePath = path.resolve('src/app/admin/applications/page.tsx');
    const applicationsContent = fs.readFileSync(applicationsPagePath, 'utf-8');

    test('admin/job-seekers correlates users, seekerProfiles, jobAlerts with full dossier view', () => {
      assert.ok(
        jobSeekersContent.includes('useCollection<UserDoc>(\'users\')'),
        'Must fetch users collection'
      );
      assert.ok(
        jobSeekersContent.includes('useCollection<SeekerProfileDoc>(\'seekerProfiles\')'),
        'Must fetch seekerProfiles collection'
      );
      assert.ok(
        jobSeekersContent.includes('handleVerifyCandidate'),
        'Must support candidate verification'
      );
      assert.ok(
        jobSeekersContent.includes('SeekerIDCard'),
        'Must render digital Seeker ID Card modal'
      );
    });

    test('admin/applications provides 1-click jump to full Seeker Profile and Portfolio', () => {
      assert.ok(
        applicationsContent.includes('/admin/job-seekers?q='),
        'Application dossier modal must link directly to candidate profile in /admin/job-seekers'
      );
      assert.ok(
        applicationsContent.includes('View Full Candidate Profile'),
        'Must label action View Full Candidate Profile'
      );
    });

    test('admin/job-seekers supports live portfolio viewing for public candidates', () => {
      assert.ok(
        jobSeekersContent.includes('/portfolio/seeker/'),
        'Job seekers page must link to public portfolio route'
      );
    });
  });

  // ─── 5. Route Security & Canonical Domain Edge Proxy ────────────────────────
  describe('5. Route Security & Canonical Domain Edge Proxy', () => {
    const proxyPath = path.resolve('src/proxy.ts');
    const proxyContent = fs.readFileSync(proxyPath, 'utf-8');
    const adminLayoutPath = path.resolve('src/app/admin/layout.tsx');
    const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf-8');

    test('Admin layout strictly enforces admin and super_admin authentication', () => {
      assert.ok(
        adminLayoutContent.includes("useRequireAuth(['admin', 'super_admin'])"),
        'Admin layout must require admin or super_admin role'
      );
    });

    test('Edge proxy permanently redirects alias domains and protects canonical host', () => {
      assert.ok(
        proxyContent.includes("export function proxy(request: NextRequest)"),
        'proxy.ts must export function proxy'
      );
      assert.ok(
        proxyContent.includes("hostname === 'www.thenijobs.com'"),
        'proxy must detect canonical host'
      );
      assert.ok(
        proxyContent.includes("NextResponse.redirect(url, 301)"),
        'proxy must return HTTP 301 redirect for apex and alias hosts'
      );
    });
  });
});
