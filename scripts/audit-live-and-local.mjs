import https from 'node:https';
import http from 'node:http';

async function traceRedirectChain(initialUrl, maxHops = 15) {
  const chain = [];
  let currentUrl = initialUrl;
  
  for (let hop = 0; hop < maxHops; hop++) {
    try {
      const parsed = new URL(currentUrl);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const res = await new Promise((resolve, reject) => {
        const req = client.request(currentUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          rejectUnauthorized: false
        }, (res) => {
          resolve(res);
        });
        req.on('error', reject);
        req.setTimeout(8000, () => {
          req.destroy(new Error('Request timed out'));
        });
        req.end();
      });

      const statusCode = res.statusCode;
      const location = res.headers.location;
      const server = res.headers.server || 'unknown';
      const xVercelId = res.headers['x-vercel-id'] || 'none';

      chain.push({
        hop: hop + 1,
        url: currentUrl,
        statusCode,
        location: location || null,
        server,
        xVercelId
      });

      if (statusCode >= 300 && statusCode < 400 && location) {
        const nextUrl = new URL(location, currentUrl).href;
        if (chain.some(item => item.url === nextUrl)) {
          chain.push({
            hop: hop + 2,
            url: nextUrl,
            error: 'LOOP_DETECTED_REPEAT_URL',
            note: `Redirect points back to already visited URL: ${nextUrl}`
          });
          break;
        }
        currentUrl = nextUrl;
      } else {
        break; // terminal response reached
      }
    } catch (err) {
      chain.push({
        hop: hop + 1,
        url: currentUrl,
        error: err.message
      });
      break;
    }
  }

  return {
    initialUrl,
    finalUrl: chain[chain.length - 1]?.url || currentUrl,
    totalHops: chain.length,
    chain
  };
}

async function testLocalPages() {
  const localBase = 'http://localhost:3000';
  const routes = [
    '/',
    '/jobs',
    '/marketplace',
    '/marketplace?type=services',
    '/daily-jobs',
    '/login',
    '/register',
    '/pricing',
    '/businesses',
    '/robots.txt',
    '/sitemap.xml'
  ];

  console.log('\n--- TESTING LOCAL APPLICATION ROUTES (http://localhost:3000) ---');
  for (const route of routes) {
    try {
      const res = await fetch(`${localBase}${route}`);
      console.log(`[LOCAL] ${route.padEnd(30)} => HTTP ${res.status} ${res.statusText}`);
    } catch (err) {
      console.log(`[LOCAL] ${route.padEnd(30)} => ERROR: ${err.message}`);
    }
  }
}

async function run() {
  const targets = [
    'https://thenijobs-web-main.vercel.app',
    'https://thenijobs.com',
    'https://www.thenijobs.com',
    'https://thenijobs.in',
    'https://www.thenijobs.in'
  ];

  console.log('====================================================');
  console.log('THENIJOBS PRODUCTION REDIRECT CHAIN & LIVE DIAGNOSTICS');
  console.log('====================================================\n');

  for (const target of targets) {
    console.log(`\nTesting Target: ${target}`);
    const result = await traceRedirectChain(target);
    console.log(`Result: ${result.chain.length} hop(s), Final URL: ${result.finalUrl}`);
    for (const step of result.chain) {
      if (step.error) {
        console.log(`  Hop ${step.hop}: ${step.url} => ERROR: ${step.error} (${step.note || ''})`);
      } else {
        console.log(`  Hop ${step.hop}: ${step.url} => HTTP ${step.statusCode} (Server: ${step.server}) ${step.location ? '-> Location: ' + step.location : '[Terminal]'}`);
      }
    }
  }

  await testLocalPages();
}

run();
