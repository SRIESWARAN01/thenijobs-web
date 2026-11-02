import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  COURSE_LAUNCH_PRESETS,
  calculateDailyTargets,
  generateDefaultSchedule,
  getCoursePreset,
  FALLBACK_CATALOG_COURSES
} from '../src/lib/career/coursePresets.ts';

import { resolveAuthRedirect, isSafeRedirectUrl } from '../src/lib/authRedirect.ts';

describe('THENIJOBS — Admin Course Launch Workflow & Auth Access Audit Suite', () => {

  // ─── 1. Course Launch Milestones & Mathematical Precision ───────────────────
  describe('1. Course Launch Milestones & Mathematical Precision', () => {
    test('calculateDailyTargets computes exact cumulative milestones for 10-day course', () => {
      const targets = calculateDailyTargets(10);
      assert.equal(targets.length, 10);
      assert.deepEqual(targets, [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    });

    test('calculateDailyTargets computes exact cumulative milestones for 5-day course', () => {
      const targets = calculateDailyTargets(5);
      assert.equal(targets.length, 5);
      assert.deepEqual(targets, [20, 40, 60, 80, 100]);
    });

    test('calculateDailyTargets computes exact cumulative milestones for 7-day course', () => {
      const targets = calculateDailyTargets(7);
      assert.equal(targets.length, 7);
      assert.equal(targets[0], 14);
      assert.equal(targets[targets.length - 1], 100);
    });

    test('generateDefaultSchedule creates structured day-by-day milestones', () => {
      const schedule = generateDefaultSchedule(5, 'Office Excel Pro');
      assert.equal(schedule.length, 5);
      assert.equal(schedule[0].dayNumber, 1);
      assert.equal(schedule[0].percentageTarget, 20);
      assert.equal(schedule[4].dayNumber, 5);
      assert.equal(schedule[4].percentageTarget, 100);
      assert.ok(schedule[0].title.includes('Day 1'));
    });
  });

  // ─── 2. 1-Click Launch Presets Verification ────────────────────────────────
  describe('2. 1-Click Launch Presets Verification', () => {
    test('Official Course Launch Presets covers high-demand Theni job sectors', () => {
      assert.ok(COURSE_LAUNCH_PRESETS.length >= 6, 'Must contain at least 6 official presets');

      const expectedSlugs = [
        'tally-prime-gst-billing-mastery',
        'retail-store-operations-customer-service',
        'office-excel-data-entry-typing-pro',
        'field-sales-b2b-whatsapp-marketing',
        'two-wheeler-ev-diagnostic-technician',
        'hospital-front-desk-healthcare-coordination'
      ];

      for (const slug of expectedSlugs) {
        const found = COURSE_LAUNCH_PRESETS.find(p => p.slug === slug);
        assert.ok(found, `Preset ${slug} must exist in COURSE_LAUNCH_PRESETS`);
        assert.ok(found.title.length > 5, 'Title must be descriptive');
        assert.ok(found.titleTamil.length > 5, 'Tamil title must be provided');
        assert.ok(found.totalDays >= 5 && found.totalDays <= 30, 'Total days must be reasonable');
        assert.ok(found.dailyPercentageTarget > 0, 'Daily percentage target must be positive');
        assert.ok(found.dailySchedule.length === found.totalDays, 'Schedule count must equal total days');
        assert.ok(found.learningObjectives.length >= 3, 'Must have at least 3 learning objectives');
      }
    });

    test('getCoursePreset retrieves preset by slug or id correctly', () => {
      const tally = getCoursePreset('tally-prime-gst-billing-mastery');
      assert.ok(tally);
      assert.equal(tally.totalDays, 10);
      assert.equal(tally.dailyPercentageTarget, 10);

      const byId = getCoursePreset('preset-tally-gst');
      assert.ok(byId);
      assert.equal(byId.slug, 'tally-prime-gst-billing-mastery');

      const missing = getCoursePreset('non-existent-course-slug');
      assert.equal(missing, null);
    });

    test('FALLBACK_CATALOG_COURSES generates valid published course objects', () => {
      assert.ok(FALLBACK_CATALOG_COURSES.length >= 6);
      for (const c of FALLBACK_CATALOG_COURSES) {
        assert.equal(c.status, 'published');
        assert.equal(c.visibility, 'public');
        assert.ok(c.totalDays && c.totalDays > 0);
        assert.ok(c.dailyPercentageTarget && c.dailyPercentageTarget > 0);
        assert.ok(c.dailySchedule && c.dailySchedule.length > 0);
      }
    });
  });

  // ─── 3. Admin Access & Redirection Security ────────────────────────────────
  describe('3. Admin Access & Redirection Security', () => {
    test('resolveAuthRedirect routes admin to specific admin customRedirectUrl if safe', () => {
      const adminUser = { uid: 'adm_1', role: 'admin' };
      const superAdminUser = { uid: 'adm_2', role: 'super_admin' };

      const careerRoute = resolveAuthRedirect(adminUser, '/admin/career-growth');
      assert.equal(careerRoute, '/admin/career-growth', 'Admin should be redirected to requested /admin route');

      const jobsRoute = resolveAuthRedirect(superAdminUser, '/admin/jobs/create');
      assert.equal(jobsRoute, '/admin/jobs/create', 'Super Admin should be redirected to requested /admin route');

      const defaultRoute = resolveAuthRedirect(adminUser, null);
      assert.equal(defaultRoute, '/admin/dashboard', 'Fallback must be /admin/dashboard');

      const maliciousRoute = resolveAuthRedirect(adminUser, '//evil.com');
      assert.equal(maliciousRoute, '/admin/dashboard', 'Malicious open redirect must be blocked');
    });

    test('isSafeRedirectUrl strictly rejects protocols, doubleslashes and javascript', () => {
      assert.equal(isSafeRedirectUrl('/admin/career-growth'), true);
      assert.equal(isSafeRedirectUrl('/courses'), true);
      assert.equal(isSafeRedirectUrl('https://evil.com'), false);
      assert.equal(isSafeRedirectUrl('//evil.com'), false);
      assert.equal(isSafeRedirectUrl('javascript:alert(1)'), false);
      assert.equal(isSafeRedirectUrl(null), false);
    });

    test('Admin Layout navigation contains Career & Skills Academy subitems', () => {
      const layoutPath = path.resolve('src/app/admin/layout.tsx');
      const content = fs.readFileSync(layoutPath, 'utf-8');

      assert.ok(content.includes('Career & Skills Academy'), 'Layout must include Career & Skills Academy');
      assert.ok(content.includes('/admin/career-growth?tab=courses'), 'Must include All Courses link');
      assert.ok(content.includes('/admin/career-growth?action=launch'), 'Must include 1-Click Launch Course link');
      assert.ok(content.includes('isLoginPage'), 'Must support isLoginPage check to prevent redirect loops');
    });

    test('Admin Login Page handles redirect query param and avoids hardcoded kickouts', () => {
      const loginPath = path.resolve('src/app/admin/login/page.tsx');
      const content = fs.readFileSync(loginPath, 'utf-8');

      assert.ok(content.includes('useSearchParams'), 'Must use useSearchParams to parse redirect');
      assert.ok(content.includes('targetRedirect'), 'Must resolve targetRedirect');
      assert.ok(content.includes('router.push(targetRedirect)'), 'Must redirect to targetRedirect after auth');
    });
  });

  // ─── 4. Employer Staff Training Portal Integration ─────────────────────────
  describe('4. Employer Staff Training Portal Integration', () => {
    test('Employer layout navigation includes Staff Training & Academy', () => {
      const employerLayoutPath = path.resolve('src/app/employer/layout.tsx');
      const content = fs.readFileSync(employerLayoutPath, 'utf-8');

      assert.ok(content.includes('Staff Training & Academy'), 'Employer layout must include Staff Training');
      assert.ok(content.includes('/employer/training'), 'Must link to /employer/training');
      assert.ok(content.includes('GraduationCap'), 'Must import GraduationCap icon');
    });

    test('Employer Training Page exists and implements staff assignment & talent search', () => {
      const trainingPagePath = path.resolve('src/app/employer/training/page.tsx');
      assert.ok(fs.existsSync(trainingPagePath), 'Employer training page must exist');
      const content = fs.readFileSync(trainingPagePath, 'utf-8');

      assert.ok(content.includes('Assign to Staff'), 'Must include Assign to Staff action');
      assert.ok(content.includes('Staff Learning Progress'), 'Must include staff progress tracker');
      assert.ok(content.includes('Hire Certified Theni Candidates'), 'Must include certified talent hiring');
      assert.ok(content.includes('dailyPercentageTarget'), 'Must show daily percentage targets');
    });
  });

  // ─── 5. Admin Career Growth Modal & Presets Integration ─────────────────────
  describe('5. Admin Career Growth Modal & Presets Integration', () => {
    test('Admin Career Growth page implements 1-Click Presets and instant publish', () => {
      const pagePath = path.resolve('src/app/admin/career-growth/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf-8');

      assert.ok(content.includes('COURSE_LAUNCH_PRESETS'), 'Must import COURSE_LAUNCH_PRESETS');
      assert.ok(content.includes('applyPresetToForm'), 'Must implement applyPresetToForm');
      assert.ok(content.includes('handleSeedPresets'), 'Must implement handleSeedPresets');
      assert.ok(content.includes('dailyPercentageTarget'), 'Must support dailyPercentageTarget');
      assert.ok(content.includes('totalDays'), 'Must support totalDays');
      assert.ok(content.includes('Launch & Publish Instantly'), 'Must offer 1-click Launch & Publish Instantly button');
    });

    test('Public Courses Catalog & Detail render daily percentage milestones', () => {
      const catalogPath = path.resolve('src/app/courses/CoursesCatalogClient.tsx');
      const catalogContent = fs.readFileSync(catalogPath, 'utf-8');

      assert.ok(catalogContent.includes('FALLBACK_CATALOG_COURSES'), 'Catalog must fallback safely');
      assert.ok(catalogContent.includes('dailyPercentageTarget'), 'Catalog must show daily percentage');
      assert.ok(catalogContent.includes('totalDays'), 'Catalog must show total days');

      const detailPath = path.resolve('src/app/courses/[slug]/page.tsx');
      const detailContent = fs.readFileSync(detailPath, 'utf-8');
      assert.ok(detailContent.includes('dailySchedule'), 'Detail page must render daily schedule roadmap');
      assert.ok(detailContent.includes('hoursPerDay'), 'Detail page must render hours per day commitment');
    });
  });
});
