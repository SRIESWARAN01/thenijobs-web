# THENIJOBS Web vs Flutter End-to-End Audit

Date: 2026-06-10

Scope audited:
- Canonical Next.js web app: `thenijobs-main/`
- Flutter app: `thenijobs-flutter/`
- Firebase backend: Firestore rules, Storage rules, indexes, Cloud Functions, Hosting config
- Root workspace routing/deploy context

Evidence sources:
- Source inspection across `thenijobs-main/src`, `thenijobs-main/functions/src`, `thenijobs-main/firestore.rules`, `thenijobs-main/storage.rules`, `thenijobs-flutter/lib`, Android/iOS/web manifests.
- Route inventory generated from actual files and `GoRouter` declarations.
- Validation commands run from `E:\thenijobs-main`:
  - `npm.cmd run lint`: passed, delegates to `thenijobs-main`
  - `npm.cmd run typecheck`: passed, delegates to `thenijobs-main`
  - `npm.cmd run build`: passed, Next.js 15.5.19, 70 generated static pages, `/api/ai/coach` dynamic route
  - `npm.cmd run functions:build`: passed
  - `flutter --version`: failed because `flutter` is not available on PATH in this environment

## 1. Executive Summary

The web app is the more complete production surface. It has a broad public site, seeker portal, employer portal, admin portal, Firebase Cloud Functions for privileged workflows, and a passing production build.

The Flutter app has near route-name parity, but not feature-depth parity. It declares 58 routes, yet 42 portal screens are wrappers around `_buildStubScreen(...)`, which renders a generic `_PortalFeatureScreen` rather than a native workflow. Public browsing and job application are substantially better implemented than the portal areas.

Highest-risk gaps:

1. Flutter employer talent search is blocked by Firestore rules. The Flutter route reads `seekerProfiles` directly, but rules allow only owner/admin reads. Web correctly calls the `searchTalent` Cloud Function.
2. Flutter public stats read the private `users` collection, which rules deny to public users.
3. Flutter public ID/profile resolution does not use sanitized `publicProfiles`, while the web `/id/[id]` flow does.
4. Flutter admin/employer/seeker portal screens mostly show generic Firestore lists and direct document update buttons, not the complete web workflows.
5. App store readiness is incomplete: Android/iOS manifests are mostly template-like, deep links are absent, push/upload/analytics services are present but not wired, and Flutter web manifest still says "A new Flutter project."
6. Testing coverage is minimal: web has lint/typecheck/build coverage only; Flutter has one login widget test; no Firestore rules tests or function tests were found.

Overall readiness:

| Area | Web | Flutter | Backend |
|---|---:|---:|---:|
| Public browsing | High | Medium-high | High |
| Job apply pipeline | High | Medium-high | High |
| Seeker portal | Medium-high | Low-medium | Medium-high |
| Employer portal | Medium-high | Low | Medium-high |
| Admin portal | Medium-high | Low | Medium-high |
| Security rules | Medium-high | Depends on client fixes | Medium-high |
| Testing | Low | Low | Low |
| Release readiness | Medium-high web | Low mobile | Medium-high |

## 2. Inventory Counts

| Item | Count | Evidence |
|---|---:|---|
| Canonical web pages | 59 | `thenijobs-main/src/app/**/page.tsx` |
| Canonical web API routes | 1 | `thenijobs-main/src/app/api/ai/coach/route.ts` |
| Canonical app layouts | 4 | root, admin, employer, seeker layouts |
| Cloud Functions callables | 19 | `thenijobs-main/functions/src/index.ts:214` through `:1218` |
| Flutter routes | 58 | `thenijobs-flutter/lib/core/routes/app_router.dart:113-376` |
| Flutter portal stub/generic screens | 42 | `thenijobs-flutter/lib/core/routes/route_screens.dart:3163-3420` |
| Flutter shared models | 16 | `thenijobs-flutter/lib/shared/data/models/*.dart` |
| Flutter public/auth feature files | 24 | `thenijobs-flutter/lib/features/**/*.dart` |

## 3. Architecture Findings

### 3.1 Canonical app location is nested

The root app delegates normal npm scripts into `thenijobs-main/`:
- Root scripts: `package.json:6-13`
- Delegation script: `scripts/run-canonical-app.mjs:16-26`
- Canonical deploy note: `README.md:5-23`, `thenijobs-main/README.md:28-35`

Risk:
- A legacy root `src/` app still exists and has many modified files. Developers can still run `legacy:*` scripts. This is manageable, but only if CI/deploys always target `thenijobs-main/`.

Recommendation:
- Keep root delegation.
- Add a CI check that fails if Firebase deploy or build is run from the legacy root app accidentally.
- Add `CODEOWNERS` or docs that mark root `src/` as legacy-only.

### 3.2 Web app stack

Evidence:
- Next.js 15.5.19 in `thenijobs-main/package.json:24`
- React 19.2.4 in `thenijobs-main/package.json:26-27`
- Firebase client setup in `thenijobs-main/src/lib/firebase/config.ts:1-63`
- Firebase Admin setup for server API in `thenijobs-main/src/lib/firebase/admin.ts:1-17`
- Dynamic AI API route uses Node runtime in `thenijobs-main/src/app/api/ai/coach/route.ts:6`
- Firebase Hosting/App Hosting config and CSP headers in `thenijobs-main/firebase.json`

### 3.3 Flutter stack

Evidence:
- Flutter SDK constraint `^3.11.0`: `thenijobs-flutter/pubspec.yaml:20`
- Riverpod, GoRouter, Firebase Auth/Firestore/Functions/Storage/Analytics/Messaging dependencies: `thenijobs-flutter/pubspec.yaml:28-50`
- App bootstraps Firebase and Hive: `thenijobs-flutter/lib/main.dart:13-30`
- GoRouter route map and guards: `thenijobs-flutter/lib/core/routes/app_router.dart:53-108`

Risk:
- Firebase options are hardcoded in Dart in `thenijobs-flutter/lib/core/config/firebase_config.dart:8-42`. Firebase client config is not a secret, but this makes environment switching and store-release validation harder.

## 4. Web Feature Inventory

### 4.1 Public web

Routes:
- `/`
- `/jobs`
- `/jobs/[id]`
- `/businesses`
- `/businesses/[category]`
- `/company/[slug]`
- `/company/register`
- `/id/[id]`
- `/pricing`
- `/services`
- `/login`
- `/register`
- `/forgot-password`
- `/privacy`
- `/terms`

Key implementation notes:
- Job detail apply uses callable-backed service: `thenijobs-main/src/app/jobs/[id]/JobDetailPageClient.tsx:182` -> `thenijobs-main/src/lib/firebase/firestoreService.ts:373-389` -> `applyToJob` function.
- Public ID prefers sanitized `publicProfiles`: `thenijobs-main/src/app/id/[id]/IdCardPageClient.tsx:31-58`.
- Company pages load company, jobs, reviews by slug/id: `thenijobs-main/src/app/company/[slug]/CompanyProfilePageClient.tsx:37-119`.
- SEO metadata exists globally and for privacy/terms/home: `thenijobs-main/src/app/layout.tsx:7-49`, `thenijobs-main/src/app/page.tsx:16-18`, `thenijobs-main/src/app/privacy/page.tsx:7-9`, `thenijobs-main/src/app/terms/page.tsx:7-9`.

### 4.2 Seeker web

Routes:
- `/seeker/dashboard`
- `/seeker/profile`
- `/seeker/resume`
- `/seeker/resume/builder`
- `/seeker/applications`
- `/seeker/saved-jobs`
- `/seeker/job-alerts`
- `/seeker/interviews`
- `/seeker/messages`
- `/seeker/notifications`
- `/seeker/rewards`
- `/seeker/ai-coach`
- `/seeker/skills`
- `/seeker/subscription`
- `/seeker/settings`

Strengths:
- Profile/resume writes maintain private `seekerProfiles` and public `publicProfiles`: `thenijobs-main/src/app/seeker/profile/page.tsx:257-258`, `:386-387`, `thenijobs-main/src/app/seeker/resume/page.tsx:74-75`.
- AI coach has authenticated server-side route with Gemini usage limits: `thenijobs-main/src/app/api/ai/coach/route.ts:35-128`.
- Applications/interviews/notifications use owner-scoped Firestore queries.

Partial/static:
- Skills page is hardcoded learning-path data: `thenijobs-main/src/app/seeker/skills/page.tsx:15-45`.
- Seeker subscription is an email activation request, not a payment checkout: `thenijobs-main/src/app/seeker/subscription/page.tsx:118-128`.

### 4.3 Employer web

Routes:
- `/employer/dashboard`
- `/employer/company-profile`
- `/employer/post-job`
- `/employer/jobs`
- `/employer/candidates`
- `/employer/talent-search`
- `/employer/interviews`
- `/employer/leads`
- `/employer/messages`
- `/employer/reviews`
- `/employer/reports`
- `/employer/billing`
- `/employer/subscription`
- `/employer/settings`

Strengths:
- Job posting uses a 4-step form and `createJobPosting` callable: `thenijobs-main/src/app/employer/post-job/page.tsx:15-16`, `:112-149`.
- Candidates page reads denormalized `applications`, not private `seekerProfiles`, and uses callables for candidate invites/status updates: `thenijobs-main/src/app/employer/candidates/page.tsx:532-548`, `:595-616`.
- Talent search uses the `searchTalent` callable: `thenijobs-main/src/app/employer/talent-search/page.tsx:9`, `:47-64`.

Partial/static:
- Billing upgrades use `mailto:` rather than a payment gateway: `thenijobs-main/src/app/employer/billing/page.tsx:192-203`.
- Employer reports are live but export button has no export implementation in the inspected code: `thenijobs-main/src/app/employer/reports/page.tsx:72-78`.

### 4.4 Admin web

Routes:
- `/admin/login`
- `/admin/dashboard`
- `/admin/users`
- `/admin/businesses`
- `/admin/jobs`
- `/admin/leads`
- `/admin/services`
- `/admin/subscriptions`
- `/admin/ads`
- `/admin/reviews`
- `/admin/notifications`
- `/admin/reports`
- `/admin/security`
- `/admin/settings`

Strengths:
- Layout role guard: `thenijobs-main/src/app/admin/layout.tsx:36`
- Admin moderation uses callable wrappers for high-risk state changes: `thenijobs-main/src/app/admin/businesses/page.tsx:98-111`, `thenijobs-main/src/app/admin/jobs/page.tsx:111-122`, `thenijobs-main/src/app/admin/users/page.tsx:105-129`.
- Broadcast notifications call `sendBroadcast`: `thenijobs-main/src/app/admin/notifications/page.tsx:63-70`.

Partial/static:
- Security permission matrix is static UI data and not an enforced RBAC policy: `thenijobs-main/src/app/admin/security/page.tsx:12-20`.
- Settings include static franchise data and toggles that save settings but are not clearly enforced elsewhere: `thenijobs-main/src/app/admin/settings/page.tsx:15-33`, `:309-333`.

## 5. Flutter Feature Inventory

### 5.1 Public/auth screens are the strongest mobile area

Implemented feature files exist for:
- Home: `thenijobs-flutter/lib/features/public/presentation/screens/home_screen.dart`
- Jobs list/detail: `jobs_screen.dart`, `job_detail_screen.dart`
- Businesses/company detail: `businesses_screen.dart`, `company_detail_screen.dart`
- Pricing/services: `pricing_screen.dart`, `services_screen.dart`
- Login/register/forgot password: `thenijobs-flutter/lib/features/auth/presentation/screens/*.dart`

Notable working path:
- Mobile job detail applies through FirestoreService, which calls the `applyToJob` callable: `thenijobs-flutter/lib/features/public/presentation/screens/job_detail_screen.dart:124-145`, `thenijobs-flutter/lib/core/services/firestore_service.dart:1187-1194`.

### 5.2 Flutter portal routes are mostly generic

The file explicitly labels itself as router stubs:
- `thenijobs-flutter/lib/core/routes/route_screens.dart:1-20`

The generic portal renderer is:
- `_PortalFeatureScreen`: `thenijobs-flutter/lib/core/routes/route_screens.dart:1102-1188`

42 route-backed classes call `_buildStubScreen(...)`:
- Seeker classes: `thenijobs-flutter/lib/core/routes/route_screens.dart:3170-3253`
- Employer classes: `thenijobs-flutter/lib/core/routes/route_screens.dart:3257-3341`
- Admin classes: `thenijobs-flutter/lib/core/routes/route_screens.dart:3345-3420`

This means many Flutter routes exist, but feature behavior is generic Firestore list rendering, not web parity.

### 5.3 Flutter callable coverage is incomplete

Flutter has a small `PlatformActionsService`:
- `createJobPosting`: `thenijobs-flutter/lib/core/services/platform_actions_service.dart:125-132`
- `syncMobileVerification`: `thenijobs-flutter/lib/core/services/platform_actions_service.dart:135-141`

Flutter `FirestoreService` calls some functions:
- `applyToJob`: `thenijobs-flutter/lib/core/services/firestore_service.dart:1187-1194`
- `updateApplicationStatus`: `thenijobs-flutter/lib/core/services/firestore_service.dart:1196-1205`
- `approveCompany`/`rejectCompany`: `thenijobs-flutter/lib/core/services/firestore_service.dart:1450-1462`
- `approveJob`/`rejectJob`: `thenijobs-flutter/lib/core/services/firestore_service.dart:1475-1480`
- `updateUserRole`/`verifyUser`: `thenijobs-flutter/lib/core/services/firestore_service.dart:1483-1488`

Missing or not wired in Flutter compared with web/platform functions:
- `searchTalent`
- `sendCandidateInvite`
- `updateInterviewStatus`
- `sendInterviewReminder`
- `sendBroadcast`
- `updateSubscriptionPlan`
- `setUserStatus`
- `deleteUserRecord`
- `healthCheck`

## 6. Web vs Flutter Feature Gap Matrix

| Workflow | Web status | Flutter status | Gap |
|---|---|---|---|
| Home/public landing | Implemented with dynamic jobs/companies/stats | Implemented public home widgets | Flutter public stats read private `users`; see section 8.2 |
| Jobs list | Implemented | Implemented | Flutter uses unbounded stream for all active jobs |
| Job detail/apply | Implemented with callable | Implemented with callable | Good parity for apply path |
| Saved jobs | Implemented | Implemented from public job screens | Portal saved-jobs screen is generic |
| Businesses list | Implemented | Implemented | Reasonable parity |
| Company detail | Implemented with leads/reviews | Implemented with reviews/contact actions | Lead creation should be verified against rules and mobile UX |
| Company registration | Implemented | Implemented in `CompanyRegisterScreen` | Mobile path is simpler; upload/verification document flow incomplete |
| Public ID/profile | Uses `publicProfiles` first | Does not use `publicProfiles`; reads users/seekerProfiles | Mobile can miss sanitized profile data |
| Auth email/password | Implemented | Implemented | Good |
| Auth phone OTP | Implemented | Implemented | Good, but store Firebase/native setup needs validation |
| Auth Google | Implemented | Implemented in repository | iOS/Android native config needs validation |
| Seeker dashboard | Full dashboard | Generic portal screen | Missing mobile workflow |
| Seeker profile edit | Full edit/write/public sync | Generic read/list | Missing native edit/upload |
| Resume upload/builder | Full upload/builder | Generic read/list | Missing native builder/upload integration |
| Applications | Full application tracking | Generic list | Missing status detail UX |
| Job alerts | CRUD UI | Generic list | Missing native create/edit flow |
| Interviews | Full list | Generic list | Missing native detail/actions |
| Messages | Web chat UI | Generic conversations list | Missing native chat UX |
| Notifications | Web notification center | Generic list | FCM service not wired |
| Rewards/gamification | Web gamification view | Generic list | Missing native reward interactions |
| AI coach | Server API route | Generic portal screen | Missing mobile AI client |
| Skills | Static/hardcoded web content | Generic list | Both need real learning backend |
| Seeker subscription | Mailto activation | Generic subscription list | Missing payment/update flow |
| Employer dashboard | Full dashboard | Generic portal screen | Missing native dashboard |
| Company profile management | Full edit/upload/public sync | Generic list | Missing native management flow |
| Post job | Full 4-step callable flow | Generic list/action route | Missing native post-job form |
| Jobs management | Full list/actions | Generic list | Missing native management depth |
| Candidates/HR review | Uses denormalized applications | Generic applications list | Missing candidate detail, invite, notes, schedule UX |
| Talent search | Cloud Function redacted search | Direct `seekerProfiles` read | Blocked by rules |
| Interviews management | Function-backed status/reminders | Generic direct doc update | Missing callables/reminders |
| Leads/reviews/messages | Implemented | Generic lists | Missing native workflow depth |
| Reports | Implemented, partial export | Generic/static analytics | Mobile analytics includes constants |
| Billing/subscriptions | Mailto/manual activation | Generic list | No payment flow |
| Admin dashboard | Implemented | Generic portal | Missing native admin console |
| Admin approvals | Function-backed web actions | Some generic direct doc updates | Risk of denied/bypassed behavior |
| Admin users | Function-backed verify/status/delete | Partial callables, no status/delete | Missing parity |
| Admin notifications | `sendBroadcast` | Generic list | Missing broadcast composer |
| Admin settings/security | Partial web settings | Generic list | Missing native controls; web controls need enforcement |

## 7. Critical and High-Priority Issues

### Critical 1: Flutter employer talent search is blocked by Firestore rules

Evidence:
- Flutter direct read: `thenijobs-flutter/lib/core/routes/route_screens.dart:2219-2238`
- Firestore rule denies employer reads: `thenijobs-main/firestore.rules:239-242`
- Web uses callable: `thenijobs-main/src/app/employer/talent-search/page.tsx:47-64`
- Backend callable exists: `thenijobs-main/functions/src/index.ts:614-680`

Impact:
- Employer proactive sourcing is empty or permission-denied in mobile.
- This matches the highlighted C1 issue in the provided workflow image.

Fix:
- Add `searchTalent` to Flutter `PlatformActionsService`.
- Replace the direct `seekerProfiles` `_ListSectionConfig` for Employer Talent Search with a real screen using the callable response.
- Keep `seekerProfiles` private; do not loosen Firestore rules for employers.

Effort: 1-2 days.

### Critical 2: Flutter public stats read private `users`

Evidence:
- `totalUsersCountProvider`: `thenijobs-flutter/lib/features/public/presentation/providers/stats_provider.dart:27-29`
- `totalSeekersCountProvider`: `thenijobs-flutter/lib/features/public/presentation/providers/stats_provider.dart:32-36`
- Users are owner/admin-only: `thenijobs-main/firestore.rules:154-180`

Impact:
- Public home stats can error for signed-out and non-admin users.

Fix:
- Create public aggregate documents, for example `settings/publicStats` or `publicStats/global`, maintained by Cloud Functions/scheduled jobs/admin writes.
- Read that public aggregate on web and Flutter.

Effort: 0.5-1 day.

### Critical 3: Flutter public profile resolver misses sanitized `publicProfiles`

Evidence:
- Web first reads `publicProfiles`: `thenijobs-main/src/app/id/[id]/IdCardPageClient.tsx:31-58`
- Firestore allows public reads: `thenijobs-main/firestore.rules:388-390`
- Flutter resolver reads `companies`, then private `users`, then private `seekerProfiles`: `thenijobs-flutter/lib/core/routes/route_screens.dart:586-655`
- Flutter comment says seeker profiles are visible to employers/admins, but rules do not allow that: `thenijobs-flutter/lib/core/routes/route_screens.dart:661`

Impact:
- Mobile `/id/:id` can show incomplete data for seeker profiles.
- It may produce permission errors hidden by catches.

Fix:
- Make Flutter public ID resolver mirror web:
  1. Read `publicProfiles/{identifier}`.
  2. Query `publicProfiles where theniJobsId == identifier`.
  3. Only then fall back to companies.
  4. Remove private `users`/`seekerProfiles` reads from public profile resolution.

Effort: 0.5-1 day.

### High 1: Flutter portal screens are route parity, not workflow parity

Evidence:
- `_buildStubScreen`: `thenijobs-flutter/lib/core/routes/route_screens.dart:16-20`
- `_PortalFeatureScreen`: `thenijobs-flutter/lib/core/routes/route_screens.dart:1102-1188`
- 42 stub classes: `thenijobs-flutter/lib/core/routes/route_screens.dart:3163-3420`

Impact:
- Users can navigate to portal URLs, but cannot complete core workflows like editing seeker profile, building resumes, posting jobs, composing broadcasts, full candidate review, payments, or AI coach.

Fix:
- Replace generic screens in priority order:
  1. Seeker profile/resume/applications/alerts/notifications.
  2. Employer company profile/post job/jobs/candidates/talent search.
  3. Admin approvals/users/notifications/subscriptions.

Effort: 4-8 weeks depending on desired web parity.

### High 2: Generic mobile document actions can conflict with security model

Evidence:
- Generic `_updateDoc` updates whatever `doc.reference` points to: `thenijobs-flutter/lib/core/routes/route_screens.dart:1652-1667`
- Firestore rules require function/admin paths for many privileged changes: e.g. applications `thenijobs-main/firestore.rules:260-277`, jobs `:211-216`, companies `:184-208`.

Impact:
- Some actions will fail under rules.
- Other actions may bypass intended domain logic if rules permit them.

Fix:
- Remove generic doc mutation buttons from production portal screens.
- Use typed callable/service actions per workflow.

Effort: 2-4 days for cleanup, more for replacement workflows.

### High 3: App store native configuration is incomplete

Evidence:
- Android main manifest has only launcher intent filter and no main release network/notification/deep-link permissions: `thenijobs-flutter/android/app/src/main/AndroidManifest.xml:1-45`
- Debug/profile manifests have development-only INTERNET permission: `thenijobs-flutter/android/app/src/debug/AndroidManifest.xml:2-6`, `thenijobs-flutter/android/app/src/profile/AndroidManifest.xml:2-6`
- iOS Info.plist has no privacy usage descriptions or URL schemes: `thenijobs-flutter/ios/Runner/Info.plist`
- Flutter web manifest is generic: `thenijobs-flutter/web/manifest.json`
- Release signing check exists: `thenijobs-flutter/android/app/build.gradle.kts:44-65`

Impact:
- Release networking, Google sign-in, file/image selection, notifications, and deep links may fail or be rejected in store review.

Fix:
- Add and verify release manifest permissions and iOS privacy keys for the exact features used.
- Add Android App Links and iOS Universal Links for `thenijobs.com`.
- Replace generic manifest names/descriptions/icons.
- Generate and validate release builds on a machine with Flutter.

Effort: 2-5 days.

### High 4: Push, analytics, and upload services exist but are not wired into flows

Evidence:
- Push service only defined: `thenijobs-flutter/lib/core/services/push_notification_service.dart:3-13`
- Analytics service only defined: `thenijobs-flutter/lib/core/services/analytics_service.dart:3-11`
- Storage service only defined: `thenijobs-flutter/lib/core/services/storage_service.dart:13-39`
- `rg` found no app-wide initialization/use except definitions.

Impact:
- Mobile notification tokens are not saved.
- Upload-dependent workflows remain incomplete.
- Product analytics are not captured.

Fix:
- Initialize push in `main.dart` or an app bootstrap provider.
- Persist FCM token on `users/{uid}`.
- Wire StorageService into profile/resume/company upload screens.
- Add analytics route/screen events in GoRouter or top-level observer.

Effort: 3-6 days.

## 8. Backend and Database Audit

### 8.1 Callable Functions

Callable functions present:
- `healthCheck`: `thenijobs-main/functions/src/index.ts:214`
- `syncMobileVerification`: `:222`
- `createJobPosting`: `:265`
- `applyToJob`: `:382`
- `updateApplicationStatus`: `:514`
- `sendCandidateInvite`: `:570`
- `searchTalent`: `:614`
- `updateInterviewStatus`: `:689`
- `sendInterviewReminder`: `:741`
- `approveCompany`: `:785`
- `rejectCompany`: `:837`
- `approveJob`: `:890`
- `rejectJob`: `:940`
- `updateUserRole`: `:991`
- `verifyUser`: `:1030`
- `setUserStatus`: `:1073`
- `deleteUserRecord`: `:1107`
- `sendBroadcast`: `:1147`
- `updateSubscriptionPlan`: `:1218`

Strength:
- High-risk writes are designed to run through Functions.
- Functions enforce role/mobile checks, e.g. job posting at `thenijobs-main/functions/src/index.ts:273-294`, applying at `:406-421`, talent search at `:621-635`.

Gap:
- Flutter does not expose all callables needed for parity.

### 8.2 Collections observed

Core collections:
- `users`
- `companies`
- `jobs`
- `applications`
- `seekerProfiles`
- `publicProfiles`
- `savedJobs`
- `jobAlerts`
- `interviews`
- `notifications`
- `broadcasts`
- `conversations`
- `leads`
- `reviews`
- `services`
- `advertisements`
- `subscriptions`
- `payments`
- `paymentRequests`
- `supportTickets`
- `activityLogs`
- `settings`
- `platformSettings`
- `gamification`
- `aiUsage`

Rules are explicit and mostly deny by default:
- Catch-all deny: `thenijobs-main/firestore.rules:417-418`
- Storage catch-all deny: `thenijobs-main/storage.rules:114-115`

### 8.3 Rules strengths

Positive findings:
- Mobile verification helper gates writes: `thenijobs-main/firestore.rules:30-37`
- Company creation blocks client-set approval/premium fields: `thenijobs-main/firestore.rules:72-105`
- Job create is admin/function-only through direct Firestore rules: `thenijobs-main/firestore.rules:107-109`, `:211-214`
- Applications cannot be client-created directly except admin: `thenijobs-main/firestore.rules:260-267`
- `publicProfiles` is the correct public-read surface: `thenijobs-main/firestore.rules:388-400`
- Storage restricts type and size for profile photos, resumes, verification docs: `thenijobs-main/storage.rules:60-110`

### 8.4 Schema mismatches and compatibility notes

Handled compatibility:
- Web and Flutter models tolerate `applicationCount`/`applicationsCount` fallbacks:
  - Web: `thenijobs-main/src/app/admin/jobs/page.tsx:62-63`, `thenijobs-main/src/app/employer/dashboard/page.tsx:20`
  - Flutter: `thenijobs-flutter/lib/shared/data/models/job_model.dart:146-147`
- Flutter models tolerate `resumeUrl`/`resumeURL`: `thenijobs-flutter/lib/shared/data/models/seeker_profile_model.dart:206-207`, `job_application_model.dart:85-86`

Remaining issue:
- The canonical function writes `applicationCount`: `thenijobs-main/functions/src/index.ts:481`. Keep this as canonical and remove old `applicationsCount` dependencies over time.

## 9. API Audit

### 9.1 Web API route

`/api/ai/coach`:
- Requires auth bearer token: `thenijobs-main/src/app/api/ai/coach/route.ts:41-58`
- Requires mobile verification: `:84-90`
- Enforces plan/month usage limit through `aiUsage`: `:94-128`
- Calls Gemini with server key: `:149-170`

Strength:
- Good server-side enforcement.

Gaps:
- No Flutter AI client.
- No visible tests for quota rollback or failure handling.
- No explicit App Check enforcement found.

### 9.2 Cloud Function API parity

Web has typed wrappers for all major functions in `thenijobs-main/src/lib/firebase/platformActions.ts:177-345`.

Flutter has only partial wrappers. Add wrappers for all function contracts and stop using direct document updates for privileged workflows.

## 10. Auth and Security Audit

Strengths:
- Web portal layouts guard roles:
  - Admin: `thenijobs-main/src/app/admin/layout.tsx:36`
  - Employer: `thenijobs-main/src/app/employer/layout.tsx:35`
  - Seeker layout uses `useRequireAuth` in the same pattern.
- Flutter GoRouter guards role namespaces: `thenijobs-flutter/lib/core/routes/app_router.dart:60-108`
- Functions enforce role checks server-side.
- Hosting has security headers and CSP: `thenijobs-main/firebase.json`

Risks:
- Admin Security UI `twoFa` is a setting flag, not actual MFA enforcement: `thenijobs-main/src/app/admin/security/page.tsx:59-88`.
- Settings feature toggles are saved but not clearly enforced by auth/rules/functions: `thenijobs-main/src/app/admin/settings/page.tsx:321-333`.
- Flutter demo login exists and is dev-only unless compiled with `THENIJOBS_ENABLE_DEMO_LOGIN`: `thenijobs-flutter/lib/features/auth/data/repositories/auth_repository_impl.dart:15-18`. Confirm release build never enables this define.
- No Firestore rules unit tests found.
- No App Check enforcement found in inspected client/functions code.

## 11. UI/UX Audit

Web:
- Rich, role-specific navigation and views.
- Many complete workflows exist, especially job apply, post job, candidates, notifications, profile/resume, business pages.
- Some pages are polished but shallow/static:
  - Skills: `thenijobs-main/src/app/seeker/skills/page.tsx:15-45`
  - Seeker subscription mailto: `thenijobs-main/src/app/seeker/subscription/page.tsx:118-128`
  - Employer billing mailto: `thenijobs-main/src/app/employer/billing/page.tsx:192-203`
  - Admin security/settings partial enforcement: `thenijobs-main/src/app/admin/security/page.tsx:12-20`, `thenijobs-main/src/app/admin/settings/page.tsx:15-33`

Flutter:
- Public screens are mobile-oriented and visually richer than the portal stubs.
- Portal screens are generic list/detail cards, which is not enough for a production native app.
- No app-wide push notification UX is wired.
- No native upload UX is wired to `StorageService`.

## 12. Testing Audit

Found:
- One Flutter widget test for login email/mobile OTP UI: `thenijobs-flutter/test/widget_test.dart:52-74`
- Web lint/typecheck/build pass.
- Functions TypeScript build passes.

Missing:
- Web component/page tests.
- E2E tests for public apply, seeker profile, employer post job, admin approval.
- Firestore rules tests for critical allow/deny paths.
- Cloud Functions unit/integration tests.
- Flutter route/portal tests.
- Flutter Firebase mock tests.
- Mobile build/analyze/test validation in this environment because Flutter is not installed.

Recommendation:
- Add a minimum regression pack:
  1. Firestore rules tests for `users`, `seekerProfiles`, `applications`, `jobs`, `publicProfiles`.
  2. Function tests for `applyToJob`, `searchTalent`, `createJobPosting`, approvals.
  3. Playwright happy paths for web.
  4. Flutter widget tests for job detail/apply, public ID, auth redirects.

## 13. Performance Audit

Web build:
- Shared first-load JS: 102 kB.
- Largest inspected first loads include employer/candidates at 305 kB and seeker/dashboard at 297 kB in the Next build output.

Risks:
- `useCollection` subscribes to whole collections when no constraints/limits are passed: `thenijobs-main/src/hooks/useFirestore.ts:59-109`.
- Several admin pages read whole collections:
  - Users: `thenijobs-main/src/app/admin/users/page.tsx:59`
  - Reports: `thenijobs-main/src/app/admin/reports/page.tsx:46-48`
  - Businesses/jobs/reviews/leads/ads all use unbounded collections in several pages.
- `useRealtimeCount` uses `onSnapshot` and counts `snapshot.size`, despite comments mentioning `getCountFromServer`: `thenijobs-main/src/hooks/useRealtimeStats.ts:43-59`.
- Flutter `streamCollection` and `fetchCollection` support limits but many public providers do not use them:
  - All jobs: `thenijobs-flutter/lib/features/public/presentation/providers/stats_provider.dart:99-103`
  - All companies: `:107-111`
  - All services: `:115-119`
  - Company reviews stream all reviews then filters client-side: `:184-190`

Recommendations:
- Add cursor pagination to admin tables and mobile list screens.
- Use aggregate counters for public stats.
- Prefer `getCountFromServer` or maintained counters for counts.
- Add limits/order to public streams and search pages.
- Add indexes for any new compound filters introduced by mobile parity work.

## 14. SEO Audit

Strengths:
- Global metadata/OpenGraph/Twitter manifest: `thenijobs-main/src/app/layout.tsx:7-49`
- Sitemap and robots exist: `thenijobs-main/src/app/sitemap.ts:5-52`, `thenijobs-main/src/app/robots.ts:5-15`
- Privacy and terms pages exist with metadata.

Gaps:
- Dynamic job/company pages do not define `generateMetadata`.
- Sitemap company pages are static hardcoded examples, not DB-driven: `thenijobs-main/src/app/sitemap.ts:35-46`.
- No structured data found for jobs, organizations, local businesses, breadcrumbs, or reviews.
- Flutter web manifest is still generic: `thenijobs-flutter/web/manifest.json`.

Recommendations:
- Add `generateMetadata` for `/jobs/[id]`, `/company/[slug]`, `/businesses/[category]`.
- Add JSON-LD for JobPosting, LocalBusiness, Organization, BreadcrumbList, Review where applicable.
- Generate sitemap entries from approved jobs/companies, or maintain an export/ISR strategy.
- Update Flutter web manifest name, colors, icons, and description.

## 15. App Store Readiness

Current status: not ready for store submission without another native pass.

Findings:
- Android release manifest lacks visible production permissions for networking/notifications/uploads: `thenijobs-flutter/android/app/src/main/AndroidManifest.xml:1-45`.
- Debug/profile INTERNET exists, but main release manifest does not show it: `thenijobs-flutter/android/app/src/debug/AndroidManifest.xml:2-6`, `thenijobs-flutter/android/app/src/profile/AndroidManifest.xml:2-6`.
- No Android app links for `thenijobs.com`.
- iOS Info.plist has no URL scheme for Google Sign-In and no privacy descriptions for photos/files/notifications: `thenijobs-flutter/ios/Runner/Info.plist`.
- Firebase config is manual Dart options, no `google-services.json` or `GoogleService-Info.plist` files found.
- Release signing guard exists and will fail release build without `android/key.properties`: `thenijobs-flutter/android/app/build.gradle.kts:44-65`.

Checklist before store:
- Run `flutter analyze`, `flutter test`, `flutter build apk --release`, `flutter build appbundle`, and iOS archive on a configured machine.
- Add release `INTERNET` permission if not injected by merged manifest.
- Add notification permission for Android 13+ if using push.
- Add file/photo/camera permissions only if feature UX uses them.
- Add Universal Links/App Links for `thenijobs.com/jobs/*`, `/company/*`, `/id/*`.
- Configure Google Sign-In for Android SHA and iOS URL scheme.
- Wire FCM token registration and foreground/background notification UX.
- Replace generic app metadata.

## 16. Priority Matrix

| Priority | Issue | Impact | Effort |
|---|---|---|---|
| Critical | Flutter talent search uses direct `seekerProfiles` read | Employer sourcing blocked | 1-2 days |
| Critical | Flutter public stats read private `users` | Public home errors | 0.5-1 day |
| Critical | Flutter public ID ignores `publicProfiles` | Public seeker profiles incomplete | 0.5-1 day |
| Critical | Portal route parity without workflow parity | App cannot replace web | 4-8 weeks |
| High | Generic mobile direct updates | Security/rules failures | 2-4 days cleanup |
| High | App store manifest/deep-link/privacy gaps | Store/runtime failures | 2-5 days |
| High | Push/upload/analytics not wired | Missing mobile platform features | 3-6 days |
| High | Missing tests for rules/functions/E2E | Regression risk | 1-3 weeks |
| Medium | Web subscription/billing are manual mailto | Revenue operations manual | 1-3 weeks |
| Medium | Web/mobile analytics use constants/static values | Misleading dashboards | 3-7 days |
| Medium | Unbounded realtime listeners | Cost/performance risk | 3-7 days |
| Medium | SEO lacks dynamic metadata/schema | Search growth limited | 2-5 days |
| Low | Root legacy app remains dirty/large | Developer confusion | 1 day docs/CI |

## 17. Recommended Roadmap

### Phase 0: Stabilize blocked flows, 2-4 days

1. Add Flutter `searchTalent` callable and replace direct `seekerProfiles` mobile talent search.
2. Move public stats to a public aggregate document.
3. Update Flutter public ID/profile resolver to use `publicProfiles`.
4. Remove production use of generic direct update buttons for privileged portal actions.

### Phase 1: Mobile MVP parity, 2-4 weeks

1. Build real seeker profile edit and resume upload/builder screens.
2. Build real employer company profile and post-job screens using callables.
3. Build employer jobs/candidates screens around `applications` and function actions.
4. Build notifications/messages screens with real conversation UX.
5. Wire StorageService, PushNotificationService, and AnalyticsService.

### Phase 2: Admin and monetization parity, 2-4 weeks

1. Build mobile admin approval queues using callables.
2. Add admin broadcast composer using `sendBroadcast`.
3. Add subscription/payment request workflows using `updateSubscriptionPlan`.
4. Replace web/mobile mailto billing with payment request/payment provider flow.
5. Enforce settings toggles in functions/rules, not only UI.

### Phase 3: Quality, scale, release, 2-3 weeks

1. Add Firestore rules tests.
2. Add Cloud Functions tests.
3. Add Playwright web E2E tests.
4. Add Flutter widget/integration tests.
5. Add pagination/cursors and public aggregate counters.
6. Add dynamic metadata and structured data.
7. Complete Android/iOS store configuration and build validation.

## 18. Final Assessment

The backend and web app are close to a coherent production architecture. The strongest backend pattern is: keep private collections private, use Cloud Functions for cross-user or privileged workflows, and denormalize safe application data for employers. The web app follows that pattern in key places.

The Flutter app should not be considered feature-complete yet. It has valuable route scaffolding and public browsing screens, but core portal workflows are generic and several routes conflict with the security model. The fastest path is not to loosen rules; it is to move Flutter onto the same callable/public-document architecture already used by the web app.

