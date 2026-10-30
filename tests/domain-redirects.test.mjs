import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Mirror of the logic implemented in src/proxy.ts (formerly src/middleware.ts)
function resolveCanonicalRedirect(requestUrl, headers = {}) {
  const rawHost = headers['x-forwarded-host'] || headers['host'] || '';
  const hostname = rawHost.split(':')[0].toLowerCase();

  // If already on the authoritative canonical domain, do not redirect
  if (hostname === 'www.thenijobs.com') {
    return null;
  }

  // Alias and apex domains that must permanently 301-redirect to canonical https://www.thenijobs.com
  const isAliasHost =
    hostname === 'thenijobs.com' ||
    hostname === 'thenijobs.in' ||
    hostname === 'www.thenijobs.in';

  if (isAliasHost) {
    const url = new URL(requestUrl);
    url.protocol = 'https:';
    url.host = 'www.thenijobs.com';
    url.port = '';
    return {
      status: 301,
      location: url.toString(),
    };
  }

  return null;
}

test('THENIJOBS Production Domain Redirect Loop Prevention Suite', async (t) => {
  await t.test('1. Authoritative canonical domain (www.thenijobs.com) passes through without redirect', () => {
    const res = resolveCanonicalRedirect('https://www.thenijobs.com/jobs', {
      host: 'www.thenijobs.com',
    });
    assert.equal(res, null, 'Must not issue redirect for canonical domain');
  });

  await t.test('2. Apex domain (thenijobs.com) permanently redirects (301) to www.thenijobs.com preserving path & query', () => {
    const res = resolveCanonicalRedirect('https://thenijobs.com/marketplace?type=services&district=Theni', {
      host: 'thenijobs.com',
    });
    assert.ok(res, 'Must return redirect result');
    assert.equal(res.status, 301, 'Must return HTTP 301 Moved Permanently');
    assert.equal(res.location, 'https://www.thenijobs.com/marketplace?type=services&district=Theni');
  });

  await t.test('3. Apex .in domain (thenijobs.in) permanently redirects (301) to www.thenijobs.com', () => {
    const res = resolveCanonicalRedirect('https://thenijobs.in/pricing', {
      host: 'thenijobs.in',
    });
    assert.ok(res, 'Must return redirect result');
    assert.equal(res.status, 301, 'Must return HTTP 301 Moved Permanently');
    assert.equal(res.location, 'https://www.thenijobs.com/pricing');
  });

  await t.test('4. www .in domain (www.thenijobs.in) permanently redirects (301) to www.thenijobs.com', () => {
    const res = resolveCanonicalRedirect('https://www.thenijobs.in/daily-jobs', {
      host: 'www.thenijobs.in',
    });
    assert.ok(res, 'Must return redirect result');
    assert.equal(res.status, 301, 'Must return HTTP 301 Moved Permanently');
    assert.equal(res.location, 'https://www.thenijobs.com/daily-jobs');
  });

  await t.test('5. Respects x-forwarded-host header from Vercel edge reverse proxy', () => {
    const res = resolveCanonicalRedirect('https://some-internal-router/about', {
      host: 'some-internal-router',
      'x-forwarded-host': 'thenijobs.com',
    });
    assert.ok(res, 'Must return redirect result based on x-forwarded-host');
    assert.equal(res.status, 301);
    assert.equal(res.location, 'https://www.thenijobs.com/about');
  });

  await t.test('6. Canonical domain with port (e.g. www.thenijobs.com:443) does not self-redirect', () => {
    const res = resolveCanonicalRedirect('https://www.thenijobs.com:443/', {
      host: 'www.thenijobs.com:443',
    });
    assert.equal(res, null, 'Must never redirect canonical domain with port');
  });

  await t.test('7. Localhost and Vercel preview URLs pass through without redirection', () => {
    const localRes = resolveCanonicalRedirect('http://localhost:3000/jobs', {
      host: 'localhost:3000',
    });
    assert.equal(localRes, null, 'Localhost must pass through');

    const previewRes = resolveCanonicalRedirect('https://thenijobs-web-preview.vercel.app/jobs', {
      host: 'thenijobs-web-preview.vercel.app',
    });
    assert.equal(previewRes, null, 'Vercel preview URL must pass through');
  });

  await t.test('8. Multi-Hop Redirect Loop Simulation: Output of redirect terminates at canonical', () => {
    const initialUrl = 'https://thenijobs.com/jobs/accounts-assistant?ref=whatsapp';
    const hop1 = resolveCanonicalRedirect(initialUrl, { host: 'thenijobs.com' });
    assert.ok(hop1);
    assert.equal(hop1.status, 301);
    assert.equal(hop1.location, 'https://www.thenijobs.com/jobs/accounts-assistant?ref=whatsapp');

    // Simulate browser following hop 1 to canonical
    const hop2 = resolveCanonicalRedirect(hop1.location, { host: 'www.thenijobs.com' });
    assert.equal(hop2, null, 'Hop 2 must NOT redirect; loop terminates cleanly at canonical');
  });

  await t.test('9. Proxy source code static invariants audit', () => {
    const proxySource = fs.readFileSync(path.join(process.cwd(), 'src', 'proxy.ts'), 'utf8');

    // Invariant A: Must set host to www.thenijobs.com
    assert.ok(
      proxySource.includes("url.host = 'www.thenijobs.com'"),
      'Proxy must redirect to www.thenijobs.com'
    );

    // Invariant B: Must NEVER redirect to thenijobs.com (apex)
    assert.ok(
      !proxySource.includes("url.host = 'thenijobs.com'"),
      'Proxy must NEVER set destination host to apex thenijobs.com'
    );

    // Invariant C: Must contain canonical domain check to prevent self-redirect
    assert.ok(
      proxySource.includes("hostname === 'www.thenijobs.com'"),
      'Proxy must check for canonical hostname and return next()'
    );

    // Invariant D: Must alias thenijobs.com, thenijobs.in, www.thenijobs.in
    assert.ok(proxySource.includes("hostname === 'thenijobs.com'"), 'Must alias thenijobs.com');
    assert.ok(proxySource.includes("hostname === 'thenijobs.in'"), 'Must alias thenijobs.in');
    assert.ok(proxySource.includes("hostname === 'www.thenijobs.in'"), 'Must alias www.thenijobs.in');
  });
});
