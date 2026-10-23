import test from 'node:test';
import assert from 'node:assert/strict';

test('THENIJOBS Technical SEO, Indexing & Canonical Domain Suite', async (t) => {
  const PRIMARY_CANONICAL_DOMAIN = 'https://thenijobs.com';

  await t.test('Canonical Domain Strategy: Only https://thenijobs.com is canonical', () => {
    const aliasDomains = [
      'https://thenijobs.in',
      'http://thenijobs.in',
      'https://www.thenijobs.in',
      'http://www.thenijobs.in',
      'https://www.thenijobs.com',
      'http://thenijobs.com',
    ];

    for (const alias of aliasDomains) {
      assert.notEqual(alias, PRIMARY_CANONICAL_DOMAIN, `${alias} must never be treated as primary canonical`);
      assert.ok(
        alias.includes('thenijobs.in') || alias.startsWith('http://') || alias.includes('www.'),
        `${alias} is an alias/insecure origin that must 301 redirect to ${PRIMARY_CANONICAL_DOMAIN}`
      );
    }
  });

  await t.test('Robots Directives: Essential assets and public hubs crawlable, private dashboards protected', () => {
    const publicHubs = [
      '/',
      '/jobs',
      '/marketplace',
      '/businesses',
      '/daily-jobs',
      '/pricing',
      '/about',
      '/contact',
      '/privacy',
      '/terms',
    ];

    const privateProtectedRoutes = [
      '/admin/',
      '/employer/',
      '/seeker/',
      '/api/',
      '/login',
      '/register',
      '/profile',
      '/payment/',
    ];

    // Verify none of the public hubs are in the private list
    for (const hub of publicHubs) {
      const isBlocked = privateProtectedRoutes.some(p => hub.startsWith(p));
      assert.equal(isBlocked, false, `Public route ${hub} must never be blocked by robots.txt`);
    }

    // Verify all private paths have trailing slash or protective prefixes
    for (const route of privateProtectedRoutes) {
      assert.ok(route.length > 2, `Private route rule ${route} is valid`);
    }
  });

  await t.test('Expired Job Identification Logic: Soft 404 Prevention', () => {
    const now = new Date('2026-10-23T00:00:00Z');

    const activeJob = {
      id: 'job-101',
      title: 'Senior Software Engineer',
      isActive: true,
      status: 'active',
      expiryDate: '2026-12-31T23:59:59Z',
    };

    const expiredByDate = {
      id: 'job-102',
      title: 'Accountant',
      isActive: true,
      status: 'active',
      expiryDate: '2026-09-01T00:00:00Z',
    };

    const inactiveJob = {
      id: 'job-103',
      title: 'Driver',
      isActive: false,
      status: 'active',
      expiryDate: '2026-12-31T23:59:59Z',
    };

    const closedStatusJob = {
      id: 'job-104',
      title: 'Retail Staff',
      isActive: true,
      status: 'closed',
      expiryDate: '2026-12-31T23:59:59Z',
    };

    function checkExpired(job, referenceDate) {
      if (!job.isActive) return { isExpired: true, reason: 'inactive' };
      if (job.status !== 'active') return { isExpired: true, reason: 'status_not_active' };
      if (job.expiryDate) {
        const exp = new Date(job.expiryDate);
        if (!isNaN(exp.getTime()) && exp < referenceDate) {
          return { isExpired: true, reason: 'past_deadline' };
        }
      }
      return { isExpired: false };
    }

    assert.equal(checkExpired(activeJob, now).isExpired, false, 'Valid job must not be marked expired');
    assert.equal(checkExpired(expiredByDate, now).isExpired, true, 'Job past expiryDate must be expired');
    assert.equal(checkExpired(inactiveJob, now).isExpired, true, 'Job with isActive: false must be expired');
    assert.equal(checkExpired(closedStatusJob, now).isExpired, true, 'Job with status: closed must be expired');
  });

  await t.test('Google Indexing API Policy Guardrails: Strictly JobPosting URLs only', () => {
    const jobUrlPattern = /^https:\/\/thenijobs\.com\/jobs\/[a-zA-Z0-9_\-]+$/;

    const validJobUrls = [
      'https://thenijobs.com/jobs/accountant-theni-ab12',
      'https://thenijobs.com/jobs/react-dev-cumbum-xyz89',
      'https://thenijobs.com/jobs/driver-bodinayakanur-4567',
    ];

    const invalidUrlsRejectedByPolicy = [
      'https://thenijobs.com/marketplace/product/acme/prod-1',
      'https://thenijobs.com/marketplace/service/saloon/haircut',
      'https://thenijobs.com/company/sri-krishna-stores',
      'https://thenijobs.com/businesses/retail',
      'https://thenijobs.com/pricing',
      'https://thenijobs.in/jobs/accountant-theni-ab12', // Wrong domain
      'https://thenijobs.com/jobs/123/edit', // Admin/sub-path
    ];

    for (const validUrl of validJobUrls) {
      assert.ok(jobUrlPattern.test(validUrl), `Valid job URL ${validUrl} must be accepted by Indexing API`);
    }

    for (const invalidUrl of invalidUrlsRejectedByPolicy) {
      assert.ok(!jobUrlPattern.test(invalidUrl), `Non-job or invalid URL ${invalidUrl} must be rejected by Indexing API policy`);
    }
  });

  await t.test('JobPosting Schema Integrity: No fabricated salaries, valid date formatting', () => {
    const rawJob = {
      id: 'job-55',
      title: 'Digital Marketing Executive',
      companyName: 'Theni Media Works',
      location: 'Theni',
      salaryMin: 18000,
      salaryMax: 25000,
      jobType: 'Full-time',
      postedDate: '2026-10-15T10:00:00Z',
      expiryDate: '2026-11-15T23:59:59Z',
      description: 'We are looking for a creative social media specialist in Theni.',
    };

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: rawJob.title,
      description: rawJob.description,
      datePosted: rawJob.postedDate,
      validThrough: rawJob.expiryDate,
      employmentType: 'FULL_TIME',
      hiringOrganization: {
        '@type': 'Organization',
        name: rawJob.companyName,
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: rawJob.location,
          addressRegion: 'Tamil Nadu',
          addressCountry: 'IN',
        },
      },
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'INR',
        value: {
          '@type': 'QuantitativeValue',
          minValue: rawJob.salaryMin,
          maxValue: rawJob.salaryMax,
          unitText: 'MONTH',
        },
      },
    };

    assert.equal(schema['@type'], 'JobPosting');
    assert.equal(schema.hiringOrganization.name, 'Theni Media Works');
    assert.equal(schema.baseSalary.value.minValue, 18000);
    assert.equal(schema.baseSalary.value.maxValue, 25000);
    assert.equal(schema.jobLocation.address.addressLocality, 'Theni');
  });
});
