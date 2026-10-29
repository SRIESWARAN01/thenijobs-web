import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Login Page Cleanup & Partner Business UI Removal', () => {
  const loginPath = path.resolve('src/app/login/page.tsx');
  const loginContent = fs.readFileSync(loginPath, 'utf-8');

  it('verifies Partner Business Account section is completely removed from login page', () => {
    assert.strictEqual(
      loginContent.includes('Partner Business Account'),
      false,
      'Partner Business Account header must not exist in login/page.tsx'
    );
    assert.strictEqual(
      loginContent.includes('Partner Business Sign In with Google'),
      false,
      'Partner Business Sign In with Google button must not exist in login/page.tsx'
    );
    assert.strictEqual(
      loginContent.includes('For registered THENIJOBS partner businesses'),
      false,
      'Partner business description text must not exist in login/page.tsx'
    );
    assert.strictEqual(
      loginContent.includes('Business Recovery →'),
      false,
      'Business Recovery link must not exist in login/page.tsx'
    );
    assert.strictEqual(
      loginContent.includes('handleBusinessGoogleLogin'),
      false,
      'handleBusinessGoogleLogin function must not exist in login/page.tsx'
    );
  });

  it('verifies standard Google sign-in and regular login functionality remains intact', () => {
    assert.strictEqual(
      loginContent.includes('Continue with Google'),
      true,
      'Standard Google sign-in button must exist in login/page.tsx'
    );
    assert.strictEqual(
      loginContent.includes('handleGoogleLogin'),
      true,
      'handleGoogleLogin handler must exist in login/page.tsx'
    );
    assert.strictEqual(
      loginContent.includes('handleEmailLogin'),
      true,
      'Email login handler must exist in login/page.tsx'
    );
  });
});

describe('Canonical Company Resolution & Duplicate Prevention Architecture', () => {
  const resolverPath = path.resolve('src/lib/company/companyResolver.ts');
  const resolverContent = fs.readFileSync(resolverPath, 'utf-8');

  it('verifies companyResolver exports required canonical resolution helpers', () => {
    assert.strictEqual(
      resolverContent.includes('export async function getUniqueCompanySlug'),
      true,
      'getUniqueCompanySlug must be exported'
    );
    assert.strictEqual(
      resolverContent.includes('export async function resolveCanonicalCompany'),
      true,
      'resolveCanonicalCompany must be exported'
    );
    assert.strictEqual(
      resolverContent.includes('export async function linkUserToCompany'),
      true,
      'linkUserToCompany must be exported'
    );
    assert.strictEqual(
      resolverContent.includes('export async function reserveCompanySlug'),
      true,
      'reserveCompanySlug must be exported'
    );
  });

  it('verifies hook useEmployerCompany is implemented with self-healing link', () => {
    const hookPath = path.resolve('src/hooks/useEmployerCompany.ts');
    const hookContent = fs.readFileSync(hookPath, 'utf-8');

    assert.strictEqual(
      hookContent.includes('export function useEmployerCompany'),
      true,
      'useEmployerCompany must be exported'
    );
    assert.strictEqual(
      hookContent.includes('setDoc(doc(db, \'users\', user.uid), { companyId: compId }'),
      true,
      'useEmployerCompany must self-heal user document companyId'
    );
    assert.strictEqual(
      hookContent.includes('where(\'ownerEmail\', \'==\','),
      true,
      'useEmployerCompany must query ownerEmail as fallback'
    );
  });
});

describe('Company Registration & Profile Creation Workflows', () => {
  const registerPath = path.resolve('src/app/company/register/page.tsx');
  const registerContent = fs.readFileSync(registerPath, 'utf-8');

  it('verifies company/register allows legitimate update of own slug instead of failing with duplicate error', () => {
    assert.strictEqual(
      registerContent.includes('isSameOwner = user && (slugData?.ownerId === user.uid'),
      true,
      'Registration must recognize owner ownership of existing slug'
    );
    assert.strictEqual(
      registerContent.includes('getUniqueCompanySlug(form.name, form.district)'),
      true,
      'Registration must use unique slug generator if slug is taken by someone else'
    );
    assert.strictEqual(
      registerContent.includes('companyId: created.id,'),
      true,
      'Registration must link companyId to user doc upon creation'
    );
  });

  it('verifies employer/company-profile uses canonical company resolver and reserves slug on creation', () => {
    const profilePath = path.resolve('src/app/employer/company-profile/page.tsx');
    const profileContent = fs.readFileSync(profilePath, 'utf-8');

    assert.strictEqual(
      profileContent.includes('useEmployerCompany'),
      true,
      'employer/company-profile must use useEmployerCompany'
    );
    assert.strictEqual(
      profileContent.includes('getUniqueCompanySlug'),
      true,
      'employer/company-profile must getUniqueCompanySlug when creating new profile'
    );
    assert.strictEqual(
      profileContent.includes('reserveCompanySlug'),
      true,
      'employer/company-profile must reserve slug in companySlugs'
    );
    assert.strictEqual(
      profileContent.includes('linkUserToCompany'),
      true,
      'employer/company-profile must link created company to user doc'
    );
  });

  it('verifies seeker/become-employer links companyId and reserves slug', () => {
    const becomeEmployerPath = path.resolve('src/app/seeker/become-employer/page.tsx');
    const becomeEmployerContent = fs.readFileSync(becomeEmployerPath, 'utf-8');

    assert.strictEqual(
      becomeEmployerContent.includes('reserveCompanySlug(companyPayload.slug'),
      true,
      'seeker/become-employer must reserve slug in companySlugs'
    );
    assert.strictEqual(
      becomeEmployerContent.includes('companyId: companyDocId'),
      true,
      'seeker/become-employer must link companyId to user doc'
    );
  });
});

describe('API Job Creation Authorization & Multi-Key Linking', () => {
  const jobCreateApiPath = path.resolve('src/app/api/jobs/create/route.ts');
  const jobCreateApiContent = fs.readFileSync(jobCreateApiPath, 'utf-8').replace(/\r\n/g, '\n');

  it('verifies jobs/create authorizes via ownerId, user.companyId, ownerEmail, or employeeIds', () => {
    assert.strictEqual(
      jobCreateApiContent.includes('isOwner') && jobCreateApiContent.includes('authenticatedUid'),
      true,
      'Must check direct ownerId'
    );
    assert.strictEqual(
      jobCreateApiContent.includes('userData?.companyId === companyId'),
      true,
      'Must check user document companyId link'
    );
    assert.strictEqual(
      jobCreateApiContent.includes('companyData.ownerEmail.toLowerCase() === userData.email.toLowerCase()'),
      true,
      'Must check verified ownerEmail match'
    );
    assert.strictEqual(
      jobCreateApiContent.includes('companyData.employeeIds.includes(authenticatedUid)'),
      true,
      'Must check employeeIds array'
    );
    assert.strictEqual(
      jobCreateApiContent.includes('!isOwner && !isLinkedUser && !isOwnerEmail && !isEmployee'),
      true,
      'Must only reject when none of the authorization criteria are met'
    );
  });
});

describe('Employer Pages Harmonization to Canonical Company Resolution', () => {
  const pages = [
    'src/app/employer/dashboard/page.tsx',
    'src/app/employer/post-job/page.tsx',
    'src/app/employer/billing/page.tsx',
    'src/app/employer/candidates/page.tsx',
    'src/app/employer/jobs/page.tsx',
    'src/app/employer/settings/page.tsx',
    'src/app/employer/interviews/page.tsx',
    'src/app/employer/leads/page.tsx',
    'src/app/employer/reviews/page.tsx',
    'src/app/employer/reports/page.tsx',
    'src/app/employer/messages/page.tsx',
    'src/app/employer/id-card/page.tsx',
    'src/app/employer/standee/page.tsx',
    'src/app/employer/talent-search/page.tsx',
    'src/app/employer/website/page.tsx',
  ];

  for (const pagePath of pages) {
    it(`verifies ${pagePath} uses useEmployerCompany`, () => {
      const fullPath = path.resolve(pagePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      assert.strictEqual(
        content.includes('useEmployerCompany'),
        true,
        `${pagePath} must import and use useEmployerCompany`
      );
    });
  }
});
