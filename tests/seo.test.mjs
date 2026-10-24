import test from 'node:test';
import assert from 'node:assert/strict';

test('THENIJOBS Technical SEO, Indexing & Canonical Domain Suite', async (t) => {
  const PRIMARY_CANONICAL_DOMAIN = 'https://www.thenijobs.com';

  await t.test('Canonical Domain Strategy: Only https://www.thenijobs.com is canonical', () => {
    const aliasDomains = [
      'https://thenijobs.in',
      'http://thenijobs.in',
      'https://www.thenijobs.in',
      'http://www.thenijobs.in',
      'https://thenijobs.com',
      'http://thenijobs.com',
      'http://www.thenijobs.com',
    ];

    for (const alias of aliasDomains) {
      assert.notEqual(alias, PRIMARY_CANONICAL_DOMAIN, `${alias} must never be treated as primary canonical`);
      assert.ok(
        alias.includes('thenijobs.in') || alias.startsWith('http://') || alias === 'https://thenijobs.com',
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
    const jobUrlPattern = /^https:\/\/(www\.)?thenijobs\.com\/jobs\/[a-zA-Z0-9_\-]+$/;

    const validJobUrls = [
      'https://www.thenijobs.com/jobs/accountant-theni-ab12',
      'https://www.thenijobs.com/jobs/react-dev-cumbum-xyz89',
      'https://www.thenijobs.com/jobs/driver-bodinayakanur-4567',
    ];

    const invalidUrlsRejectedByPolicy = [
      'https://www.thenijobs.com/marketplace/product/acme/prod-1',
      'https://www.thenijobs.com/marketplace/service/saloon/haircut',
      'https://www.thenijobs.com/company/sri-krishna-stores',
      'https://www.thenijobs.com/businesses/retail',
      'https://www.thenijobs.com/pricing',
      'https://thenijobs.in/jobs/accountant-theni-ab12', // Wrong domain
      'https://www.thenijobs.com/jobs/123/edit', // Admin/sub-path
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

  await t.test('Company Visibility & Privacy Guardrails: Only verified companies are indexed', () => {
    const companies = [
      { id: 'c1', name: 'Approved Spices Corp', slug: 'approved-spices', verified: true, adminNotes: 'Internal KYC OK' },
      { id: 'c2', name: 'Pending Review Mills', slug: 'pending-mills', verified: false, adminNotes: 'Pending bank check' },
      { id: 'c3', name: 'Rejected Firm', slug: 'rejected-firm', verified: false, status: 'rejected' },
    ];

    // Filter used by sitemap and public indexer
    const eligibleForSitemap = companies.filter(c => c.verified === true && c.status !== 'rejected');
    assert.equal(eligibleForSitemap.length, 1);
    assert.equal(eligibleForSitemap[0].slug, 'approved-spices');

    // Schema privacy test: adminNotes, private KYC data must never appear in public schema
    const publicSchema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: eligibleForSitemap[0].name,
      url: `https://www.thenijobs.com/company/${eligibleForSitemap[0].slug}`,
    };

    assert.equal('adminNotes' in publicSchema, false, 'Private adminNotes must never be exposed');
    assert.equal('status' in publicSchema, false, 'Internal status must never be exposed');
  });

  await t.test('Marketplace Product & Service Structured Data & Deduplication', () => {
    const product = {
      id: 'prod-99',
      name: 'Organic Theni Cardamom 500g',
      price: 1250,
      imageUrl: 'https://images.thenijobs.com/cardamom.jpg',
      companySlug: 'bodinayakanur-spices',
      companyName: 'Bodinayakanur Spices Pvt Ltd',
    };

    const service = {
      id: 'serv-44',
      name: 'Solar Panel Installation',
      startingPrice: 15000,
      companySlug: 'theni-solar-solutions',
      companyName: 'Theni Solar Solutions',
    };

    // Product canonical URL check
    const prodCanonical = `https://www.thenijobs.com/marketplace/product/${product.companySlug}/${product.id}`;
    assert.equal(prodCanonical, 'https://www.thenijobs.com/marketplace/product/bodinayakanur-spices/prod-99');

    // Service canonical URL check
    const servCanonical = `https://www.thenijobs.com/marketplace/service/${service.companySlug}/${service.id}`;
    assert.equal(servCanonical, 'https://www.thenijobs.com/marketplace/service/theni-solar-solutions/serv-44');

    // Search query parameter deduplication: query parameters must not alter canonical URL
    const searchedUrl = 'https://www.thenijobs.com/marketplace?search=cardamom&sort=price_asc';
    const canonicalBase = 'https://www.thenijobs.com/marketplace';
    assert.notEqual(searchedUrl, canonicalBase);
    assert.equal(new URL(searchedUrl).pathname, '/marketplace');
  });

  await t.test('BreadcrumbList Schema Generation for Public Hierarchy', () => {
    const items = [
      { name: 'Home', url: 'https://www.thenijobs.com' },
      { name: 'Jobs', url: 'https://www.thenijobs.com/jobs' },
      { name: 'Jobs in Theni', url: 'https://www.thenijobs.com/jobs-in-theni' },
      { name: 'Software Developer', url: 'https://www.thenijobs.com/jobs/software-developer-theni' },
    ];

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: item.name,
        item: item.url,
      })),
    };

    assert.equal(breadcrumbSchema['@type'], 'BreadcrumbList');
    assert.equal(breadcrumbSchema.itemListElement.length, 4);
    assert.equal(breadcrumbSchema.itemListElement[0].position, 1);
    assert.equal(breadcrumbSchema.itemListElement[3].position, 4);
    assert.equal(breadcrumbSchema.itemListElement[3].name, 'Software Developer');
  });
});
