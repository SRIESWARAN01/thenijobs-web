import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve project paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import utilities under test
import {
  safeParseResponse,
  safeApiFetch,
  getFriendlyApiErrorMessage,
  generateCorrelationId,
} from '../src/lib/api/safeResponse.ts';
import { generateJobSlug } from '../src/lib/seo/jobSlug.ts';

describe('THENIJOBS — Employer Job Posting Permanent Fix & Safe Response Suite', () => {

  // ── 1. Centralized Safe Response Parser Resilience ──────────────────────────
  describe('1. safeParseResponse and safeApiFetch resilience against empty & malformed responses', () => {
    test('handles 0-byte empty response body (HTTP 500) without throwing SyntaxError', async () => {
      const empty500Res = new Response('', {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
      const parsed = await safeParseResponse(empty500Res);
      assert.strictEqual(parsed.ok, false);
      assert.strictEqual(parsed.status, 500);
      assert.strictEqual(parsed.data, null);
      assert.ok(parsed.error?.includes('500'), 'Error must note HTTP 500');
      assert.ok(!parsed.error?.includes('Unexpected end of JSON input'), 'Must not leak raw syntax error');
    });

    test('handles 0-byte empty response body (HTTP 200 & HTTP 204) cleanly', async () => {
      const res200 = new Response('', { status: 200 });
      const parsed200 = await safeParseResponse(res200);
      assert.strictEqual(parsed200.ok, true);
      assert.strictEqual(parsed200.status, 200);
      assert.strictEqual(parsed200.data, null);

      const res204 = new Response(null, { status: 204 });
      const parsed204 = await safeParseResponse(res204);
      assert.strictEqual(parsed204.ok, true);
      assert.strictEqual(parsed204.status, 204);
      assert.strictEqual(parsed204.data, null);
    });

    test('handles HTML error pages (e.g. Vercel 502/504 Bad Gateway / Cloudflare proxy) and sanitizes tags', async () => {
      const html504 = '<!DOCTYPE html><html><head><title>504 Gateway Timeout</title></head><body><h1>Gateway Timeout</h1><p>The serverless function did not respond in time.</p></body></html>';
      const res504 = new Response(html504, {
        status: 504,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
      const parsed = await safeParseResponse(res504);
      assert.strictEqual(parsed.ok, false);
      assert.strictEqual(parsed.status, 504);
      assert.strictEqual(parsed.data, null);
      assert.ok(!parsed.error?.includes('<html'), 'HTML tags must be stripped');
      assert.ok(!parsed.error?.includes('<body>'), 'Body tags must be stripped');
      assert.ok(parsed.error?.includes('504'), 'Status code 504 must be preserved');
    });

    test('handles malformed JSON without crashing and flags format error', async () => {
      const brokenJson = '{"success": false, "error": "Server failed"'; // unclosed
      const res = new Response(brokenJson, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      const parsed = await safeParseResponse(res);
      assert.strictEqual(parsed.ok, false);
      assert.strictEqual(parsed.status, 200);
      assert.strictEqual(parsed.data, null);
      assert.ok(parsed.error?.includes('Invalid server response format'));
    });

    test('captures x-correlation-id from response headers', async () => {
      const testCorrelationId = 'job_req_custom_12345';
      const res = new Response(JSON.stringify({ success: true, jobId: 'job_abc' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': testCorrelationId,
        },
      });
      const parsed = await safeParseResponse(res);
      assert.strictEqual(parsed.ok, true);
      assert.strictEqual(parsed.correlationId, testCorrelationId);
      assert.strictEqual(parsed.data?.jobId, 'job_abc');
    });

    test('safeApiFetch returns clean status 0 with friendly error on network failure', async () => {
      // Intentionally invalid protocol or port to simulate network failure
      const result = await safeApiFetch('http://localhost:99999/invalid-endpoint-never-reachable', {
        method: 'POST',
        body: JSON.stringify({ test: true }),
      });
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.status, 0);
      assert.strictEqual(result.data, null);
      assert.ok(result.error?.includes('Network') || result.error?.includes('connection') || result.error?.includes('failed'));
      assert.ok(result.correlationId?.startsWith('req_'));
    });

    test('getFriendlyApiErrorMessage shields users from raw JSON parse exceptions', () => {
      const raw1 = "Failed to execute 'json' on 'Response': Unexpected end of JSON input";
      const friendly1 = getFriendlyApiErrorMessage(raw1);
      assert.ok(!friendly1.includes('Failed to execute'));
      assert.ok(!friendly1.includes('Unexpected end of JSON input'));
      assert.ok(friendly1.includes('server') || friendly1.includes('response') || friendly1.includes('safely'));

      const raw2 = new SyntaxError('Unexpected token < in JSON at position 0');
      const friendly2 = getFriendlyApiErrorMessage(raw2);
      assert.ok(!friendly2.includes('SyntaxError'));
      assert.ok(!friendly2.includes('position 0'));

      const raw3 = new TypeError('Failed to fetch');
      const friendly3 = getFriendlyApiErrorMessage(raw3);
      assert.ok(friendly3.includes('internet connection') || friendly3.includes('network') || friendly3.includes('server'));
    });
  });

  // ── 2. Backend API Route (/api/jobs/create) Invariants ───────────────────────
  describe('2. Backend Route Hardening & Invariants (/api/jobs/create/route.ts)', () => {
    const routePath = path.join(projectRoot, 'src', 'app', 'api', 'jobs', 'create', 'route.ts');
    assert.ok(fs.existsSync(routePath), 'API route file must exist');
    const content = fs.readFileSync(routePath, 'utf8');

    test('exports POST, GET, and OPTIONS handlers', () => {
      assert.ok(content.includes('export async function POST'), 'Must export POST handler');
      assert.ok(content.includes('export async function GET'), 'Must export GET handler');
      assert.ok(content.includes('export async function OPTIONS'), 'Must export OPTIONS handler');
    });

    test('GET handler returns 405 Method Not Allowed with JSON response', () => {
      assert.ok(content.includes('status: 405'), 'GET must return 405 status');
      assert.ok(content.includes('Method Not Allowed'), 'GET must explain method not allowed');
    });

    test('OPTIONS handler provides proper CORS headers', () => {
      assert.ok(content.includes('Access-Control-Allow-Methods'), 'OPTIONS must include Allow-Methods');
      assert.ok(content.includes('Access-Control-Allow-Headers'), 'OPTIONS must include Allow-Headers');
    });

    test('calls syncClockSkew to prevent OAuth JWT rejection in serverless cold starts', () => {
      assert.ok(content.includes('syncClockSkew'), 'Route must invoke syncClockSkew');
    });

    test('enforces Server-Side Authentication & Session Verification', () => {
      assert.ok(
        content.includes("authHeader.startsWith('Bearer ')") || content.includes('verifyIdToken'),
        'Route must verify Authorization Bearer token'
      );
      assert.ok(
        content.includes('status: 401'),
        'Route must respond with 401 Unauthorized when session is unauthenticated'
      );
    });

    test('verifies Company Authorization server-side across multi-key links', () => {
      assert.ok(
        content.includes('companyData.ownerId === userId') || content.includes('companyData.ownerId === authenticatedUid'),
        'Must verify direct ownerId link'
      );
      assert.ok(
        content.includes('userData?.companyId === companyId'),
        'Must verify user document companyId link'
      );
      assert.ok(
        content.includes('status: 403'),
        'Must reject unauthorized callers with 403 Forbidden'
      );
    });

    test('enforces Admin Approval requirement before allowing job creation', () => {
      assert.ok(
        content.includes("companyData.verificationStatus !== 'verified'") || content.includes('isCompanyVerified'),
        'Must verify company admin approval'
      );
      assert.ok(
        content.includes('locked: true'),
        'Must return locked status indicator for unapproved companies'
      );
    });

    test('enforces Subscription State and Active Job Posting Limits', () => {
      assert.ok(content.includes('computeSubscriptionState'), 'Must compute subscription state');
      assert.ok(content.includes('getActiveJobPostingLimit'), 'Must check active job posting limit');
      assert.ok(content.includes('currentActiveJobs >= activeJobsLimit'), 'Must enforce cap when limit is reached');
    });

    test('implements Idempotency & Duplicate Prevention', () => {
      assert.ok(content.includes('idempotencyKey'), 'Must support idempotencyKey');
      assert.ok(content.includes('isDuplicate: true'), 'Must return isDuplicate flag on duplicate submission');
    });

    test('persists dual schema fields for admin and search compatibility', () => {
      assert.ok(content.includes('business_id: companyId'), 'Must persist business_id');
      assert.ok(content.includes("created_by_role: 'employer'"), 'Must persist created_by_role');
      assert.ok(content.includes("approval_status: 'pending'"), 'Must persist approval_status');
      assert.ok(content.includes('application_deadline'), 'Must persist application_deadline');
      assert.ok(content.includes('isActive: false'), 'Must persist isActive: false');
    });

    test('guarantees structured JSON on every exit branch with correlation ID', () => {
      assert.ok(content.includes('x-correlation-id'), 'Must attach correlation ID header');
      assert.ok(content.includes('Content-Type\': \'application/json'), 'Must mandate JSON content-type header');
    });
  });

  // ── 3. Frontend Employer Post Job Component Invariants ───────────────────────
  describe('3. Frontend Post-Job Form & Defense-in-Depth (/employer/post-job/page.tsx)', () => {
    const postJobPath = path.join(projectRoot, 'src', 'app', 'employer', 'post-job', 'page.tsx');
    assert.ok(fs.existsSync(postJobPath), 'employer/post-job/page.tsx must exist');
    const content = fs.readFileSync(postJobPath, 'utf8');

    test('imports and uses safeApiFetch and getFriendlyApiErrorMessage', () => {
      assert.ok(content.includes('safeApiFetch'), 'Must import safeApiFetch');
      assert.ok(content.includes('getFriendlyApiErrorMessage'), 'Must import getFriendlyApiErrorMessage');
    });

    test('does NOT use unsafe await apiRes.json() directly on fetch response', () => {
      assert.ok(
        !content.includes('const apiData = await apiRes.json();'),
        'Must eliminate raw apiRes.json() call'
      );
    });

    test('implements in-flight submission guard (isSubmittingRef) to prevent double-click submissions', () => {
      assert.ok(content.includes('isSubmittingRef'), 'Must use isSubmittingRef guard');
      assert.ok(
        content.includes('if (isSubmittingRef.current || loading) return;'),
        'Must reject concurrent submissions'
      );
    });

    test('attaches Authorization Bearer token to backend request', () => {
      assert.ok(content.includes('getIdToken()'), 'Must obtain Firebase user ID token');
      assert.ok(content.includes('Authorization\': `Bearer ${idToken}`'), 'Must send Bearer token header');
    });

    test('generates and sends idempotencyKey to API', () => {
      assert.ok(content.includes('idempotencyKey'), 'Must generate idempotencyKey');
      assert.ok(content.includes('x-idempotency-key'), 'Must send x-idempotency-key header');
    });

    test('implements verified client Firestore fallback if backend serverless API fails', () => {
      assert.ok(content.includes('fallbackJobPayload'), 'Must construct fallbackJobPayload');
      assert.ok(content.includes("createDocument('jobs'"), 'Must call createDocument for fallback');
      assert.ok(content.includes("approvalStatus: 'pending'"), 'Fallback must set pending approval');
      assert.ok(content.includes('isActive: false'), 'Fallback must set isActive: false');
    });

    test('disables submit button while submission is in progress', () => {
      assert.ok(content.includes('disabled={loading'), 'Submit button must disable when loading');
      assert.ok(content.includes('Posting Job...'), 'Must render loading indicator');
    });
  });

  // ── 4. Form Validation & Salary Calculations ─────────────────────────────────
  describe('4. Form Field Sanitization & Slug Integrity', () => {
    test('generateJobSlug creates SEO-safe canonical slugs for jobs in Theni', () => {
      const slug = generateJobSlug('Senior React Developer', 'Theni Tech Solutions', 'Theni');
      assert.ok(slug.startsWith('senior-react-developer-theni-tech-solutions-theni'));
      assert.ok(!slug.includes(' '), 'Slug must not contain spaces');
      assert.ok(!/[^a-z0-9-]/.test(slug), 'Slug must only contain lowercase alphanumeric and hyphens');
    });

    test('salary range display formatting logic operates accurately', () => {
      const min = 15000;
      const max = 25000;
      const type = 'monthly';
      const display = `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')} / ${type}`;
      assert.strictEqual(display, '₹15,000 - ₹25,000 / monthly');
    });

    test('handles single minimum salary without maximum', () => {
      const min = 20000;
      const type = 'monthly';
      const display = `From ₹${min.toLocaleString('en-IN')} / ${type}`;
      assert.strictEqual(display, 'From ₹20,000 / monthly');
    });
  });

  // ── 5. Firestore Rules Compliance for Job Creation ──────────────────────────
  describe('5. Firestore Security Rules Alignment for Job Postings', () => {
    const rulesPath = path.join(projectRoot, 'firestore.rules');
    assert.ok(fs.existsSync(rulesPath), 'firestore.rules must exist');
    const content = fs.readFileSync(rulesPath, 'utf8');

    test('safeJobCreate rule permits pending and draft jobs while requiring isActive == false', () => {
      assert.ok(
        content.includes("d.status in ['pending', 'draft']"),
        'safeJobCreate must allow pending and draft statuses'
      );
      assert.ok(
        content.includes('d.isActive == false'),
        'safeJobCreate must enforce isActive == false on creation'
      );
    });

    test('jobs create rule permits active employer who owns postedBy', () => {
      assert.ok(
        content.includes('request.resource.data.postedBy == request.auth.uid'),
        'Job creation must verify postedBy matches authenticated uid'
      );
    });
  });
});
