import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve('D:/project/thenijobs-web-main/thenijobs-web-main');

describe('THENIJOBS — Defensive API Request Body & Unexpected End of JSON Prevention Suite', () => {

  describe('1. safeResponse helper utility', () => {
    test('safeResponse.ts exposes safeReadRequestBody and safeParseResponse', () => {
      const filePath = path.join(projectRoot, 'src/lib/api/safeResponse.ts');
      assert.ok(fs.existsSync(filePath), 'safeResponse.ts must exist');
      const content = fs.readFileSync(filePath, 'utf8');

      assert.ok(content.includes('export async function safeReadRequestBody'), 'Must export safeReadRequestBody');
      assert.ok(content.includes('export async function safeParseResponse'), 'Must export safeParseResponse');
      assert.ok(content.includes('export function jsonResponse'), 'Must export jsonResponse');
      assert.ok(content.includes('JSON.parse(trimmed)'), 'Must parse trimmed text safely');
    });
  });

  describe('2. OTP Authentication & Registration Endpoints', () => {
    test('/api/otp/send uses safeReadRequestBody and includes OPTIONS handler', () => {
      const filePath = path.join(projectRoot, 'src/app/api/otp/send/route.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('safeReadRequestBody'), '/api/otp/send must use safeReadRequestBody');
      assert.ok(content.includes('export async function OPTIONS'), '/api/otp/send must provide OPTIONS');
      assert.ok(content.includes('export async function GET'), '/api/otp/send must provide 405 GET');
      assert.ok(!content.match(/await\s+request\.json\(\)/), '/api/otp/send must not call raw request.json()');
    });

    test('/api/otp/verify uses safeReadRequestBody and includes OPTIONS handler', () => {
      const filePath = path.join(projectRoot, 'src/app/api/otp/verify/route.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('safeReadRequestBody'), '/api/otp/verify must use safeReadRequestBody');
      assert.ok(content.includes('export async function OPTIONS'), '/api/otp/verify must provide OPTIONS');
      assert.ok(content.includes('export async function GET'), '/api/otp/verify must provide 405 GET');
      assert.ok(!content.match(/await\s+request\.json\(\)/), '/api/otp/verify must not call raw request.json()');
    });

    test('/api/otp/call uses safeReadRequestBody and safeParseResponse with 2Factor.in', () => {
      const filePath = path.join(projectRoot, 'src/app/api/otp/call/route.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('safeReadRequestBody'), '/api/otp/call must use safeReadRequestBody');
      assert.ok(content.includes('safeParseResponse'), '/api/otp/call must use safeParseResponse');
      assert.ok(content.includes('export async function OPTIONS'), '/api/otp/call must provide OPTIONS');
      assert.ok(!content.match(/await\s+request\.json\(\)/), '/api/otp/call must not call raw request.json()');
    });

    test('/api/auth/select-role uses safeReadRequestBody and handles malformed payloads', () => {
      const filePath = path.join(projectRoot, 'src/app/api/auth/select-role/route.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('safeReadRequestBody'), '/api/auth/select-role must use safeReadRequestBody');
      assert.ok(content.includes('export async function OPTIONS'), '/api/auth/select-role must provide OPTIONS');
    });

    test('/api/auth/business-google-login uses safeReadRequestBody', () => {
      const filePath = path.join(projectRoot, 'src/app/api/auth/business-google-login/route.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('safeReadRequestBody'), '/api/auth/business-google-login must use safeReadRequestBody');
      assert.ok(content.includes('export async function OPTIONS'), 'Must have OPTIONS');
    });

    test('/api/auth/business-recovery/* all use safeReadRequestBody', () => {
      const reqPath = path.join(projectRoot, 'src/app/api/auth/business-recovery/request/route.ts');
      const resetPath = path.join(projectRoot, 'src/app/api/auth/business-recovery/reset-password/route.ts');
      const verifyPath = path.join(projectRoot, 'src/app/api/auth/business-recovery/verify-token/route.ts');

      assert.ok(fs.readFileSync(reqPath, 'utf8').includes('safeReadRequestBody'), 'request/route must use safeReadRequestBody');
      assert.ok(fs.readFileSync(resetPath, 'utf8').includes('safeReadRequestBody'), 'reset-password/route must use safeReadRequestBody');
      assert.ok(fs.readFileSync(verifyPath, 'utf8').includes('safeReadRequestBody'), 'verify-token/route must use safeReadRequestBody');
    });
  });

  describe('3. Payment & Gateway Order/Verification Endpoints', () => {
    test('/api/payment/create-order safely reads request body and safely parses Razorpay response', () => {
      const filePath = path.join(projectRoot, 'src/app/api/payment/create-order/route.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('safeReadRequestBody'), 'create-order must use safeReadRequestBody');
      assert.ok(content.includes('safeParseResponse'), 'create-order must use safeParseResponse');
      assert.ok(content.includes('export async function OPTIONS'), 'create-order must provide OPTIONS');
      assert.ok(!content.match(/await\s+request\.json\(\)/), 'create-order must not call raw request.json()');
    });

    test('/api/payment/verify safely reads request body and provides OPTIONS preflight', () => {
      const filePath = path.join(projectRoot, 'src/app/api/payment/verify/route.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('safeReadRequestBody'), 'verify must use safeReadRequestBody');
      assert.ok(content.includes('export async function OPTIONS'), 'verify must provide OPTIONS');
      assert.ok(!content.match(/await\s+request\.json\(\)/), 'verify must not call raw request.json()');
    });

    test('/api/payment/urgent-badge routes safely handle empty and truncated bodies', () => {
      const createPath = path.join(projectRoot, 'src/app/api/payment/urgent-badge/create-order/route.ts');
      const verifyPath = path.join(projectRoot, 'src/app/api/payment/urgent-badge/verify/route.ts');

      const createContent = fs.readFileSync(createPath, 'utf8');
      const verifyContent = fs.readFileSync(verifyPath, 'utf8');

      assert.ok(createContent.includes('safeReadRequestBody'), 'urgent-badge create-order must use safeReadRequestBody');
      assert.ok(createContent.includes('safeParseResponse'), 'urgent-badge create-order must use safeParseResponse');
      assert.ok(verifyContent.includes('safeReadRequestBody'), 'urgent-badge verify must use safeReadRequestBody');
    });

    test('/api/payment/seeker-public-profile routes safely handle empty and truncated bodies', () => {
      const createPath = path.join(projectRoot, 'src/app/api/payment/seeker-public-profile/create-order/route.ts');
      const verifyPath = path.join(projectRoot, 'src/app/api/payment/seeker-public-profile/verify/route.ts');

      const createContent = fs.readFileSync(createPath, 'utf8');
      const verifyContent = fs.readFileSync(verifyPath, 'utf8');

      assert.ok(createContent.includes('safeReadRequestBody'), 'seeker-public-profile create must use safeReadRequestBody');
      assert.ok(verifyContent.includes('safeReadRequestBody'), 'seeker-public-profile verify must use safeReadRequestBody');
    });

    test('/api/payment/reconcile and /api/subscription/reconcile safely parse incoming payloads', () => {
      const pReconcile = path.join(projectRoot, 'src/app/api/payment/reconcile/route.ts');
      const sReconcile = path.join(projectRoot, 'src/app/api/subscription/reconcile/route.ts');

      assert.ok(fs.readFileSync(pReconcile, 'utf8').includes('safeReadRequestBody'), 'payment reconcile must use safeReadRequestBody');
      assert.ok(fs.readFileSync(sReconcile, 'utf8').includes('safeReadRequestBody'), 'subscription reconcile must use safeReadRequestBody');
    });
  });

  describe('4. Job Posting & Admin Operations', () => {
    test('/api/jobs/create uses safeReadRequestBody and returns standardized JSON headers', () => {
      const filePath = path.join(projectRoot, 'src/app/api/jobs/create/route.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('safeReadRequestBody'), 'jobs/create must use safeReadRequestBody');
      assert.ok(content.includes('x-correlation-id'), 'jobs/create must pass correlation ID');
      assert.ok(!content.match(/await\s+request\.json\(\)/), 'jobs/create must not call raw request.json()');
    });

    test('/api/admin/jobs/create uses safeReadRequestBody and OPTIONS handler', () => {
      const filePath = path.join(projectRoot, 'src/app/api/admin/jobs/create/route.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('safeReadRequestBody'), 'admin/jobs/create must use safeReadRequestBody');
      assert.ok(content.includes('export async function OPTIONS'), 'admin/jobs/create must provide OPTIONS');
      assert.ok(!content.match(/await\s+req\.json\(\)/), 'admin/jobs/create must not call raw req.json()');
    });

    test('/api/admin/company-accounts uses safeReadRequestBody', () => {
      const filePath = path.join(projectRoot, 'src/app/api/admin/company-accounts/route.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('safeReadRequestBody'), 'company-accounts must use safeReadRequestBody');
      assert.ok(content.includes('export async function OPTIONS'), 'Must have OPTIONS');
    });

    test('/api/admin/plans uses safeReadRequestBody and maintains defaults fallback', () => {
      const filePath = path.join(projectRoot, 'src/app/api/admin/plans/route.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('safeReadRequestBody'), 'admin/plans must use safeReadRequestBody');
      assert.ok(content.includes('export async function OPTIONS'), 'admin/plans must have OPTIONS');
    });

    test('/api/admin/subscriptions uses safeReadRequestBody for renewals and patches', () => {
      const filePath = path.join(projectRoot, 'src/app/api/admin/subscriptions/route.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('safeReadRequestBody'), 'admin/subscriptions must use safeReadRequestBody');
      assert.ok(content.includes('export async function OPTIONS'), 'admin/subscriptions must have OPTIONS');
    });
  });

  describe('5. Zero Raw await request.json() in API Routes Check', () => {
    test('No unprotected await (req|request).json() calls remain in any src/app/api routes', () => {
      const apiDir = path.join(projectRoot, 'src/app/api');
      const files = [];

      function scanDir(dir) {
        for (const item of fs.readdirSync(dir)) {
          const full = path.join(dir, item);
          if (fs.statSync(full).isDirectory()) {
            scanDir(full);
          } else if (item.endsWith('.ts')) {
            files.push(full);
          }
        }
      }

      scanDir(apiDir);
      const violations = [];

      for (const file of files) {
        const text = fs.readFileSync(file, 'utf8');
        const lines = text.split('\n');
        lines.forEach((line, index) => {
          if (/await\s+(req|request)\.json\(\)/.test(line)) {
            violations.push(`${file}:${index + 1}: ${line.trim()}`);
          }
        });
      }

      assert.deepEqual(violations, [], `Found unprotected await req.json() calls in:\n${violations.join('\n')}`);
    });
  });
});
