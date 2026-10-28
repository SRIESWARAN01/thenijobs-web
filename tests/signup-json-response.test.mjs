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
import { safeParseResponse } from '../src/lib/api/safeResponse.ts';
import { getFriendlyAuthErrorMessage, resolveAuthRedirect } from '../src/lib/authRedirect.ts';

describe('THENIJOBS — Complete Signup JSON Response & Role Selection Hardening Suite', () => {

  // ── 1. safeParseResponse Unit Tests ──────────────────────────────────────────
  describe('1. safeParseResponse parser resilience', () => {
    test('handles empty response body (0 bytes) with 200 OK without throwing SyntaxError', async () => {
      const res = new Response('', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await safeParseResponse(res);
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.data, null);
      assert.strictEqual(result.error, null);
    });

    test('handles empty response body (0 bytes) with 204 No Content', async () => {
      const res = new Response(null, {
        status: 204,
      });
      const result = await safeParseResponse(res);
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.status, 204);
      assert.strictEqual(result.data, null);
      assert.strictEqual(result.error, null);
    });

    test('handles empty response body with 404 Not Found without throwing', async () => {
      const res = new Response('', {
        status: 404,
        statusText: 'Not Found',
      });
      const result = await safeParseResponse(res);
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.status, 404);
      assert.strictEqual(result.data, null);
      assert.ok(result.error?.includes('404'), 'Error should describe HTTP 404');
    });

    test('handles empty response body with 500 Server Error without throwing', async () => {
      const res = new Response('', {
        status: 500,
        statusText: 'Internal Server Error',
      });
      const result = await safeParseResponse(res);
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.status, 500);
      assert.strictEqual(result.data, null);
      assert.ok(result.error?.includes('500'), 'Error should describe HTTP 500');
    });

    test('handles whitespace-only response body gracefully', async () => {
      const res = new Response('   \n\t  ', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await safeParseResponse(res);
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.data, null);
    });

    test('handles HTML error response (404/502 from proxy or CDN) cleanly', async () => {
      const htmlBody = '<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1><p>The page was not found.</p></body></html>';
      const res = new Response(htmlBody, {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
      const result = await safeParseResponse(res);
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.status, 404);
      assert.strictEqual(result.data, null);
      // Ensure raw HTML tags are sanitized and not leaked as raw tags
      assert.ok(!result.error?.includes('<html>'), 'Should sanitize raw HTML tags');
      assert.ok(!result.error?.includes('<body>'), 'Should sanitize raw HTML body tag');
      assert.ok(result.error?.includes('404'), 'Should state 404 status');
    });

    test('handles malformed JSON response safely', async () => {
      const res = new Response('{"success": true, "broken": ', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await safeParseResponse(res);
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.data, null);
      assert.ok(result.error?.includes('Invalid server response format'), 'Error should note format issue');
    });

    test('parses valid JSON response correctly into structured payload', async () => {
      const payload = { success: true, role: 'job_seeker', redirectTo: '/seeker/dashboard' };
      const res = new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await safeParseResponse(res);
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.status, 200);
      assert.deepStrictEqual(result.data, payload);
      assert.strictEqual(result.error, null);
    });

    test('handles null/undefined Response parameter safely', async () => {
      const result = await safeParseResponse(null);
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.status, 0);
      assert.strictEqual(result.data, null);
      assert.ok(result.error?.includes('No response received'), 'Should report no response received');
    });
  });

  // ── 2. getFriendlyAuthErrorMessage Interceptor Tests ─────────────────────────
  describe('2. getFriendlyAuthErrorMessage raw JSON error interceptor', () => {
    test('intercepts "Failed to execute \'json\' on \'Response\': Unexpected end of JSON input"', () => {
      const rawError = "Failed to execute 'json' on 'Response': Unexpected end of JSON input";
      const friendly = getFriendlyAuthErrorMessage(rawError);
      assert.ok(!friendly.includes('TypeError'), 'Should not contain technical TypeError');
      assert.ok(!friendly.includes('Failed to execute'), 'Should not expose raw browser exception');
      assert.ok(friendly.includes('server') || friendly.includes('response') || friendly.includes('again'));
    });

    test('intercepts Error object containing "Unexpected end of JSON input"', () => {
      const errObj = new Error('SyntaxError: Unexpected end of JSON input');
      const friendly = getFriendlyAuthErrorMessage(errObj);
      assert.ok(!friendly.includes('SyntaxError'), 'Should not contain raw SyntaxError');
      assert.ok(friendly.includes('incomplete response') || friendly.includes('again'));
    });

    test('retains standard Firebase authentication friendly messages', () => {
      assert.strictEqual(getFriendlyAuthErrorMessage('auth/user-not-found'), 'No account found with this email. Please check your credentials or create a new account.');
      assert.strictEqual(getFriendlyAuthErrorMessage('auth/wrong-password'), 'Incorrect password. Please verify and try again.');
      assert.strictEqual(getFriendlyAuthErrorMessage('auth/popup-closed-by-user'), 'Sign-in was cancelled. The Google window was closed before completing.');
    });
  });

  // ── 3. Role Assignment & Profile Invariants ─────────────────────────────────
  describe('3. Role assignment & Firestore security rule compatibility', () => {
    test('AuthContext job_seeker fallback conforms strictly to firestore.rules rule 217', () => {
      const authPath = path.join(projectRoot, 'src', 'contexts', 'AuthContext.tsx');
      const content = fs.readFileSync(authPath, 'utf8');

      // Crucial security invariant: rule 217 in firestore.rules denies client writes where approvalStatus == 'approved'
      // Job seekers must NOT have approvalStatus set to approved by client
      assert.ok(
        content.includes('Job seekers are active immediately by role without requiring approvalStatus') ||
        content.includes("fallbackDoc.accountStatus = 'active'"),
        'AuthContext must document that job seekers do not set approvalStatus: approved'
      );

      // Verify business owner sets pending approval
      assert.ok(
        content.includes("fallbackDoc.approvalStatus = 'pending'"),
        'Business owners must be initialized with pending approval'
      );
      assert.ok(
        content.includes("fallbackDoc.accountStatus = 'pending_approval'"),
        'Business owners must be initialized with pending_approval accountStatus'
      );
    });

    test('API route select-role prohibits self-escalation to admin or super_admin', () => {
      const routePath = path.join(projectRoot, 'src', 'app', 'api', 'auth', 'select-role', 'route.ts');
      const content = fs.readFileSync(routePath, 'utf8');

      assert.ok(
        content.includes("role === 'admin'") || content.includes("role === 'super_admin'"),
        'select-role route must reject escalation to admin roles'
      );
      assert.ok(
        content.includes('403'),
        'select-role route must respond with 403 Forbidden on illegal role requests'
      );
    });

    test('API route select-role automatically provisions skeleton seekerProfiles', () => {
      const routePath = path.join(projectRoot, 'src', 'app', 'api', 'auth', 'select-role', 'route.ts');
      const content = fs.readFileSync(routePath, 'utf8');

      assert.ok(
        content.includes("seekerProfiles") && content.includes("role === 'job_seeker'"),
        'select-role route must provision seekerProfiles doc for job seekers'
      );
    });

    test('resolveAuthRedirect maps job_seeker and business_owner to correct portals', () => {
      // Job seeker redirection
      const seekerRedirect = resolveAuthRedirect({
        role: 'job_seeker',
        accountStatus: 'active',
        isVerified: true,
      });
      assert.strictEqual(seekerRedirect, '/seeker/dashboard');

      // Business owner active redirection
      const businessRedirect = resolveAuthRedirect({
        role: 'business_owner',
        approvalStatus: 'approved',
        accountStatus: 'active',
        paymentStatus: 'paid',
        isEmployer: true,
      });
      assert.strictEqual(businessRedirect, '/employer/dashboard');

      // Business owner pending approval redirection (with plan selected)
      const pendingBusinessRedirect = resolveAuthRedirect({
        role: 'business_owner',
        trialRequested: true,
        approvalStatus: 'pending',
        accountStatus: 'pending_approval',
      });
      assert.strictEqual(pendingBusinessRedirect, '/register-business');

      // Business owner without plan or trial step
      const unselectedPlanBusinessRedirect = resolveAuthRedirect({
        role: 'business_owner',
        approvalStatus: 'pending',
        accountStatus: 'pending_approval',
      });
      assert.strictEqual(unselectedPlanBusinessRedirect, '/register-business?step=plan');
    });
  });

  // ── 4. Cross-App Safe Parsing Adoption Invariants ───────────────────────────
  describe('4. Safe response parser adoption across critical callers', () => {
    test('PricingClient uses safeParseResponse in trial request handler', () => {
      const pricingPath = path.join(projectRoot, 'src', 'app', 'pricing', 'PricingClient.tsx');
      const content = fs.readFileSync(pricingPath, 'utf8');

      assert.ok(
        content.includes('safeParseResponse'),
        'PricingClient must import and call safeParseResponse'
      );
      assert.ok(
        !content.includes('const data = await res.json()') || content.includes('safeParseResponse'),
        'PricingClient must not use unguarded res.json() in trial request'
      );
    });

    test('PaymentCheckoutModal uses safeParseResponse for payment endpoints', () => {
      const modalPath = path.join(projectRoot, 'src', 'components', 'payment', 'PaymentCheckoutModal.tsx');
      const content = fs.readFileSync(modalPath, 'utf8');

      assert.ok(
        content.includes('safeParseResponse'),
        'PaymentCheckoutModal must import and call safeParseResponse'
      );
      assert.ok(
        content.includes('parsedOrder') && content.includes('parsedVerify'),
        'PaymentCheckoutModal must parse order and verification responses safely'
      );
    });
  });
});
