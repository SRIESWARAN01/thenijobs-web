# THENIJOBS Product Audit, Mobile Redesign, and Delivery Report

Date: 2026-06-10
Scope: canonical Next.js website in `thenijobs-main/` and Flutter mobile app in `thenijobs-flutter/`.

## Executive Summary

The website is production-buildable and should not be redesigned. It has broad feature coverage across public jobs, businesses, services, seeker portal, employer portal, admin portal, Firebase data access, SEO metadata, robots, sitemap, and one authenticated AI coach API route.

The mobile app had the core stack needed for a native product - Flutter, Riverpod, GoRouter, Firebase, Firestore, Dio, file upload, and portal routes - but the public experience still felt too much like a converted website. The mobile work in this pass focuses on native discovery, search, job detail, guest authentication, startup performance, token refresh, and voice-search platform readiness.

## Version and Architecture Notes

- Flutter latest stable reference checked on 2026-06-10: Flutter docs list 3.44.0 as the newest stable release family.
- Next.js latest package reference checked on 2026-06-10: npm lists `next` latest as 16.2.9.
- `speech_to_text` latest package reference checked on 2026-06-10: pub.dev lists 7.4.0.
- Canonical website currently builds with Next.js 15.5.19 in `thenijobs-main/`.
- Root package delegates web scripts to `thenijobs-main/` through `scripts/run-canonical-app.mjs`.
- Flutter app uses Riverpod, GoRouter, Firebase, Firestore, Dio, Hive, SharedPreferences, file picker, URL launcher, and now speech-to-text.

References:
- https://docs.flutter.dev/release/release-notes
- https://www.npmjs.com/package/next
- https://pub.dev/packages/speech_to_text

## Phase 1 - Complete Audit

### Website Audit

Pages and routes:
- Public routes exist for home, jobs, job detail, businesses, business category, company profile, company registration, services, pricing, terms, privacy, public profile, public ID, login, register, and forgot password.
- Seeker routes exist for dashboard, applications, saved jobs, profile, resume, resume builder, job alerts, interviews, messages, notifications, AI coach, rewards, skills, subscription, and settings.
- Employer routes exist for dashboard, company profile, post job, jobs, candidates, talent search, interviews, leads, reviews, messages, billing, subscription, reports, and settings.
- Admin routes exist for dashboard, businesses, jobs, users, leads, services, subscriptions, ads, reviews, notifications, reports, security, settings, and admin login.

APIs:
- One App Router API route exists: `src/app/api/ai/coach/route.ts`.
- AI coach verifies Firebase ID tokens with Admin SDK, validates mode and prompt length, enforces plan/monthly usage through Firestore transactions, and releases usage on upstream AI failure.
- Most platform CRUD runs client-side through Firebase SDK and callable functions, so Firestore/Storage rules are critical.

Authentication:
- Website uses Firebase Auth through `AuthContext`.
- Google, email/password, phone verification, role-based routing, and protected layouts are present.
- Role names align with app notes: `job_seeker`, `employer`, `business_owner`, `admin`, `super_admin`.

SEO:
- Root metadata, Open Graph, manifest, robots, and sitemap are present.
- Dynamic job/company SEO exists but is limited by client-heavy fetching for many pages.

Performance:
- Production build succeeds.
- First Load JS is heavy on most app routes: many routes are around 247-311 kB.
- `images.unoptimized: true` is enabled in the canonical Next config, reducing image optimization benefits.
- Many pages/components are client components because Firebase client SDK is the primary data layer.

Database connections:
- Firestore is the canonical database.
- Firebase Admin SDK is used for server API/Cloud Functions.
- Client-side Firestore access is widespread and must remain protected by rules.

Forms and user flows:
- Login, registration, company registration, post job, profile, resume, application, admin moderation, employer candidate management, and AI coach flows exist.
- Uploads use Firebase Storage and rules.

Navigation:
- Website has public navigation, portal layouts, and bottom/mobile nav components.
- Flutter now has a shell bottom navigation for Home, Search, Saved, Profile, and More.

### Website Issues Found

- Lint warnings remain: unused imports and one hook dependency warning.
- First Load JS is large for an app that depends heavily on Firebase client SDK.
- `images.unoptimized: true` prevents Next image optimization.
- CSP allows `unsafe-inline` and `unsafe-eval`; likely needed for Firebase/Next in current setup, but it increases XSS blast radius.
- No broad server-side API validation layer for client Firestore writes; rules and callable functions carry most enforcement.
- AI coach has plan/monthly usage limiting, but no explicit IP/device rate limiter at the route edge.

## Flutter Audit

UI design:
- Existing mobile screens had a mix of website-like sections, drawers, footer-style blocks, and broad web constraints.
- A newer shell existed, but public discovery still needed a more native product surface.

Navigation:
- GoRouter and ShellRoute are present.
- Protected seeker/employer/admin routes redirect to login.
- This pass adds return-to-destination redirects for protected flows.

Screens:
- Public jobs, job detail, businesses, company detail, services, pricing, auth, seeker portal, employer portal, and admin portal screens exist.
- Some portal screens are dense and functional, but not all have premium native UX polish yet.

Authentication:
- Firebase email/password, Google, phone OTP, demo-login toggle, and auth stream providers exist.
- This pass adds job-specific auth return behavior and login mode selection.

State management:
- Riverpod is used for auth, routing, stats, jobs, saved jobs, seeker profile, and detail streams.

API integrations:
- Firestore streams are used for jobs, companies, services, reviews, notifications, saved jobs, profiles, and detail records.
- Cloud Functions are used for approval, role changes, AI/apply operations, and platform actions.
- Dio exists for authenticated HTTP calls.

Performance:
- Startup previously awaited push notification and analytics initialization before rendering.
- This pass moves optional integrations after `runApp`.
- Firestore offline persistence is explicitly enabled.

Security:
- Firebase ID token attachment existed in Dio.
- This pass adds forced token refresh and one retry on 401.
- Firebase public config is hardcoded in Flutter; public Firebase keys are not secrets, but project separation should still be environment-driven for release discipline.
- `flutter_secure_storage` is in the dependency list, but secure storage is not yet wired for custom secrets because Firebase Auth handles its own token persistence.

Responsiveness:
- The new Home, Jobs, and Job Detail screens use Material 3 components, stable card dimensions, wrap chips, scroll views, bottom sheets, and responsive constraints.

### Flutter Issues Found

- Flutter SDK is not installed or discoverable in this shell, so `flutter analyze`, `flutter test`, APK, and AAB builds could not be executed here.
- `pubspec.lock` must be refreshed with `flutter pub get` after the new speech dependency.
- Existing portal screens still need a second UX pass for fully premium seeker/employer/admin dashboards.
- Freezed/build_runner architecture requested by the objective is not fully implemented in the existing codebase.
- Location map is implemented as a lightweight map preview plus Google Maps deep link; a full embedded map SDK is still pending.

## Phase 2 - Mobile UI Redesign

Implemented:
- Replaced the old web-section public home with a native job discovery surface.
- Added reusable native job cards, signal chips, company marks, job sections, and skeleton loaders.
- Jobs and home now use app-level shell navigation instead of drawer/footer patterns.
- Kept all job browsing available to guests.

Files:
- `thenijobs-flutter/lib/features/public/presentation/screens/home_screen.dart`
- `thenijobs-flutter/lib/features/public/presentation/screens/jobs_screen.dart`
- `thenijobs-flutter/lib/features/public/presentation/screens/job_detail_screen.dart`
- `thenijobs-flutter/lib/features/public/presentation/widgets/mobile_job_widgets.dart`

## Phase 3 - Home Screen Redesign

Implemented:
- Featured Jobs
- Latest Jobs
- Trending Jobs
- Recommended Jobs
- Categories
- Search bar
- Guest browsing without login
- Job cards show title, company, location, salary, job type, experience, skills, openings, and posted signal.

## Phase 4 - Authentication Flow

Implemented:
- App no longer forces login on open.
- Guest users can browse, search, and view details.
- Save/apply actions show a native auth sheet with:
  - Continue with Google
  - Continue with Email
  - Continue with Phone
- Email/phone choices open the login screen in the matching mode.
- After login, users return to the selected job through `redirect`, `apply=1`, and `save=1` query flags.

Files:
- `thenijobs-flutter/lib/core/routes/app_router.dart`
- `thenijobs-flutter/lib/features/auth/presentation/screens/login_screen.dart`
- `thenijobs-flutter/lib/features/public/presentation/screens/job_detail_screen.dart`

## Phase 5 - Job Detail Page

Implemented:
- Premium company banner
- Company logo mark
- Job title
- Salary
- Experience
- Skills
- Description
- Responsibilities
- Benefits
- Location preview and Google Maps deep link
- Similar jobs
- Sticky bottom Apply Now bar
- Resume upload and application submission retained
- WhatsApp and call recruiter retained

## Phase 6 - Search Experience

Implemented:
- Instant search
- Voice search button using `speech_to_text`
- Filter sheet
- Categories
- Salary filter
- Experience filter
- Location filter
- Job type filter
- Sort by latest, relevance, salary, trending, featured
- Pull to refresh
- Skeleton loading

Platform updates:
- Android: `INTERNET`, `RECORD_AUDIO`, `POST_NOTIFICATIONS`
- iOS: microphone and speech recognition usage descriptions

## Phase 7 - Profile Section

Existing:
- Seeker profile, resume, resume builder, saved jobs, applications, notifications, settings, skills, job alerts, interviews, messages, rewards, and subscription screens exist.

Remaining:
- Full premium native redesign for all seeker portal screens.
- Stronger profile completion nudges and consolidated resume/skills/education/certification editing.

## Phase 8 - Employer Dashboard

Existing:
- Employer dashboard, post job, edit/manage jobs, candidates, applications, interviews, talent search, leads, reports, settings, billing, messages, subscription, and company profile screens exist.

Remaining:
- Full premium native redesign for employer portal.
- Candidate pipeline interactions should get a mobile UX pass for dense recruiter workflows.

## Phase 9 - Performance Optimization

Implemented:
- Startup no longer awaits FCM and analytics.
- Firestore persistence explicitly enabled.
- Public mobile home/search use lazy lists and skeletons.
- Job sections use bounded horizontal cards.
- Dio timeouts reduced to 10 seconds.

Targets:
- Startup target under 2 seconds is now more realistic, but must be measured on device.
- API response under 1 second depends on Firestore indexes, Cloud Functions cold starts, and network conditions.

## Phase 10 - Security

Implemented:
- Firebase JWT bearer token attachment already existed.
- Added forced token refresh and one retry on 401 in Dio.
- Login redirect safety prevents external redirects and auth-loop redirects.
- File upload still limits resumes to PDF and 5 MB.
- Android/iOS permissions are explicit for voice search.

Remaining:
- Add route/API IP rate limiting for AI coach and callable functions.
- Wire App Check consistently across web, mobile, Firestore, Storage, and Functions.
- Use secure storage only for custom app secrets/session artifacts; do not duplicate Firebase Auth token storage unnecessarily.
- Add server-side validation for high-risk writes and audit-worthy actions.

## Phase 11 - Flutter Architecture

Current:
- Uses Riverpod, GoRouter, Dio, Firebase, feature folders, shared models, core services, and shared widgets.

Implemented in this pass:
- Feature-level native public widgets and screens.
- Auth redirect and action continuation.
- Token refresh in Dio.
- Startup integration deferral.

Remaining:
- Freezed and build_runner are not yet adopted for models.
- Repository/data/domain boundaries are partial; public providers still directly stream Firestore service results.
- Add feature-specific repositories for jobs/search/applications before larger scaling.

## Phase 12 - Next.js Architecture

Current:
- Canonical app uses Next.js App Router, TypeScript, Firebase client services, Server/API route for AI coach, SEO metadata, robots, and sitemap.

Verification:
- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed with warnings.
- `npm.cmd run build`: passed.

Recommendations:
- Do not redesign the website in this mobile pass.
- Plan a separate Next 16 upgrade branch after reading `node_modules/next/dist/docs/` for the target version.
- Convert select high-SEO pages to more server-rendered data fetching where possible.
- Re-enable optimized images if deployment target supports it.

## Phase 13 - QA Testing

Executed:
- Web typecheck: passed.
- Web lint: passed with warnings.
- Web production build: passed.

Blocked:
- Flutter analyze: blocked because `flutter` is not installed or on PATH.
- Flutter tests: blocked because `flutter` is not installed or on PATH.
- APK/AAB builds: blocked because `flutter` is not installed or on PATH.

Manual source review:
- Checked route wiring, guest apply/save redirects, login mode selection, search filters, startup deferral, Dio token refresh, voice permissions, and reusable mobile widgets.

## Issues Fixed

- Mobile home no longer looks like a converted website page.
- Jobs search is now mobile-first with bottom-sheet filters.
- Voice search dependency and permissions added.
- Apply/save no longer dead-end guests with a snackbar.
- Successful login can return to selected job and continue apply/save.
- Job detail page now has sticky Apply Now and richer native layout.
- Optional startup integrations no longer block initial render.
- Dio now refreshes ID tokens on 401.
- Web app verified as production-buildable.

## Remaining Issues

- Flutter SDK must be installed to run analyzer/tests/builds.
- Run `flutter pub get` to refresh `pubspec.lock`.
- Full profile and employer portal premium redesign remains as the next block.
- Embedded map SDK is not yet added.
- Freezed/build_runner migration remains pending.
- Website lint warnings remain.
- Website bundle sizes are still high.

## Production Build Instructions

Website:

```powershell
cd E:\thenijobs-main
npm.cmd install
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run start
```

Flutter setup:

```powershell
cd E:\thenijobs-main\thenijobs-flutter
flutter pub get
flutter analyze
flutter test
```

APK build command:

```powershell
flutter build apk --release
```

AAB build command:

```powershell
flutter build appbundle --release
```

Release signing note:
- Configure Android release signing before Play Store upload.
- Confirm Firebase `google-services.json`, bundle IDs, SHA keys, App Check, and notification permissions before production release.
