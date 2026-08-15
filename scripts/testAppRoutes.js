/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

const allRoutes = [
  // Public Core
  '/',
  '/jobs',
  '/businesses',
  '/businesses/all',
  '/pricing',
  '/services',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/daily-jobs',
  '/sitemap.xml',
  '/robots.txt',

  // SEO Locations & Categories
  '/jobs-in-theni',
  '/jobs-in-cumbum',
  '/jobs-in-periyakulam',
  '/jobs-in-bodinayakanur',
  '/jobs-in-uthamapalayam',
  '/jobs-in-andipatti',
  '/jobs-in-chinnamanur',
  '/jobs-in-madurai',
  '/jobs-in-dindigul',
  '/jobs-in-theni/freshers',
  '/jobs-in-theni/sales',
  '/jobs-in-theni/it',
  '/jobs-in-theni/accounts',
  '/jobs-in-cumbum/freshers',
  '/jobs-in-cumbum/sales',

  // Auth
  '/login',
  '/register',
  '/forgot-password',
  '/admin/login',

  // Seeker Portal
  '/seeker/dashboard',
  '/seeker/profile',
  '/seeker/applications',
  '/seeker/saved-jobs',
  '/seeker/job-alerts',
  '/seeker/id-card',
  '/seeker/resume',
  '/seeker/resume/builder',
  '/seeker/ai-coach',
  '/seeker/skills',
  '/seeker/subscription',
  '/seeker/settings',

  // Employer Portal
  '/employer/dashboard',
  '/employer/post-job',
  '/employer/jobs',
  '/employer/candidates',
  '/employer/talent-search',
  '/employer/id-card',
  '/employer/company-profile',
  '/employer/billing',
  '/employer/subscription',
  '/employer/settings',
  '/employer/website',
  '/employer/website/templates',

  // Admin Portal
  '/admin/dashboard',
  '/admin/jobs',
  '/admin/users',
  '/admin/businesses',
  '/admin/ai-settings',
  '/admin/ai-analytics',
  '/admin/reports',
  '/admin/reviews',
  '/admin/security',
  '/admin/settings',

  // Brand Assets
  '/logo.png',
  '/favicon.ico',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.jpg',
];

function testUrl(urlPath) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(`${BASE_URL}${urlPath}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          path: urlPath,
          statusCode: res.statusCode,
          durationMs: duration,
          bodyLength: data.length,
          success: res.statusCode >= 200 && res.statusCode < 400,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        path: urlPath,
        statusCode: 0,
        error: err.message,
        success: false,
      });
    });

    req.setTimeout(30000, () => {
      req.destroy();
      resolve({
        path: urlPath,
        statusCode: 408,
        error: 'Timeout after 30s',
        success: false,
      });
    });
  });
}

async function runAllTests() {
  console.log(`\n🚀 Testing all ${allRoutes.length} routes across THENIJOBS...\n`);
  
  let passedCount = 0;
  const failedList = [];

  for (const route of allRoutes) {
    const res = await testUrl(route);
    if (res.success) {
      passedCount++;
      console.log(`  ✓ [${res.statusCode}] ${res.path.padEnd(36)} (${res.durationMs}ms)`);
    } else {
      failedList.push(res);
      console.log(`  ✗ [${res.statusCode}] ${res.path.padEnd(36)} ERROR: ${res.error || 'Failed'}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Total Routes Tested : ${allRoutes.length}`);
  console.log(`Passed Routes       : ${passedCount}`);
  console.log(`Failed Routes       : ${failedList.length}`);
  console.log(`Success Rate        : ${((passedCount / allRoutes.length) * 100).toFixed(1)}%`);
  console.log(`========================================\n`);

  if (failedList.length > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
