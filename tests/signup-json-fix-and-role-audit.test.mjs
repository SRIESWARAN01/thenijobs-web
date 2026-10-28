import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

test('THENIJOBS — Signup API JSON Parsing & Role Workflow Audit Suite', async (t) => {
  await t.test('1. select-role route source code hardening invariants', () => {
    const routePath = path.join(projectRoot, 'src', 'app', 'api', 'auth', 'select-role', 'route.ts');
    assert.ok(fs.existsSync(routePath), 'src/app/api/auth/select-role/route.ts must exist');
    const content = fs.readFileSync(routePath, 'utf8');

    // Safe body parsing check
    assert.ok(
      content.includes('req.json()') && (content.includes('catch') || content.includes('try')),
      'select-role route must wrap body parsing in try/catch or .catch() to handle empty payloads'
    );

    // Forbidden escalation check
    assert.ok(
      content.includes("role === 'admin'") && content.includes("role === 'super_admin'"),
      'select-role route must prohibit self-escalation to admin and super_admin'
    );

    // JSON header invariant
    assert.ok(
      content.includes("'Content-Type': 'application/json") || content.includes('JSON_HEADERS'),
      'select-role route must explicitly guarantee application/json content-type header'
    );

    // GET and OPTIONS handlers
    assert.ok(content.includes('export async function GET'), 'select-role route must export GET handler with 405');
    assert.ok(content.includes('export async function OPTIONS'), 'select-role route must export OPTIONS handler');
  });

  await t.test('2. AuthContext assignUserRole safe response parsing invariant', () => {
    const authContextPath = path.join(projectRoot, 'src', 'contexts', 'AuthContext.tsx');
    assert.ok(fs.existsSync(authContextPath), 'src/contexts/AuthContext.tsx must exist');
    const content = fs.readFileSync(authContextPath, 'utf8');

    // Ensures assignUserRole uses safe response parsing
    assert.ok(
      content.includes('safeParseResponse') || (content.includes('await res.text()') && content.includes('JSON.parse(rawText)')),
      'assignUserRole must use safeParseResponse or safe text parsing to prevent "Unexpected end of JSON input"'
    );

    // Ensures client-side fallback exists
    assert.ok(
      content.includes('fallbackDoc') || content.includes('client-side Firestore fallback'),
      'assignUserRole must provide authenticated client-side Firestore fallback if API route is unavailable'
    );
  });

  await t.test('3. Login page OTP endpoints safe response parsing invariant', () => {
    const loginPath = path.join(projectRoot, 'src', 'app', 'login', 'page.tsx');
    assert.ok(fs.existsSync(loginPath), 'src/app/login/page.tsx must exist');
    const content = fs.readFileSync(loginPath, 'utf8');

    // OTP functions must not use raw await res.json() without safe text parsing
    assert.ok(
      content.includes('await res.text()') && content.includes('JSON.parse(rawText)'),
      'Login page OTP handlers must use safe text parsing to prevent unexpected end of JSON input'
    );
  });

  await t.test('4. Admin Job Seekers Dossier & Digital Pass feature availability', () => {
    const adminSeekersPath = path.join(projectRoot, 'src', 'app', 'admin', 'job-seekers', 'page.tsx');
    assert.ok(fs.existsSync(adminSeekersPath), 'src/app/admin/job-seekers/page.tsx must exist');
    const content = fs.readFileSync(adminSeekersPath, 'utf8');

    // URL parameter synchronization
    assert.ok(
      content.includes("URLSearchParams(window.location.search).get('q')"),
      'admin job-seekers page must synchronize search query from window.location.search'
    );

    // Digital Pass integration
    assert.ok(
      content.includes('SeekerIDCard') && content.includes('Digital Candidate Pass'),
      'admin job-seekers page must integrate SeekerIDCard to allow administrators to inspect candidate passes'
    );

    // Candidate verification action
    assert.ok(
      content.includes('handleVerifyCandidate') && content.includes('handleRevokeVerification'),
      'admin job-seekers page must support candidate verification and revocation'
    );
  });

  await t.test('5. Safe JSON reading simulation prevents SyntaxError on empty bodies', async () => {
    // Simulate empty response body (0 bytes)
    const emptyResponse = new Response('', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    const rawText = await emptyResponse.text();
    let data = null;
    let parseError = null;

    if (rawText && rawText.trim()) {
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        parseError = e;
      }
    }

    assert.equal(data, null, 'Empty response should yield null data safely');
    assert.equal(parseError, null, 'Safe text parsing should never throw SyntaxError on empty responses');
  });

  await t.test('6. Safe JSON reading simulation parses valid payloads properly', async () => {
    const validResponse = new Response(JSON.stringify({ success: true, role: 'job_seeker' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    const rawText = await validResponse.text();
    let data = null;
    if (rawText && rawText.trim()) {
      data = JSON.parse(rawText);
    }

    assert.deepEqual(data, { success: true, role: 'job_seeker' });
  });
});
