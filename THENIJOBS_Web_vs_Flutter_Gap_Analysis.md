# THENIJOBS — Web (Next.js) vs Mobile (Flutter) End-to-End Gap Analysis

**Prepared for:** Siddhu (saaisiddharth2004@gmail.com)
**Date:** 10 June 2026
**Scope:** Source-level comparison of the Next.js web app (`E:\thenijobs-main\src`) against the Flutter mobile app (`E:\thenijobs-main\thenijobs-flutter`), both sharing one Firebase backend (Firestore, Auth, Storage).
**Method:** Static inspection of actual source — routers, screens, providers, services, models, and security rules. No generic feedback; every finding cites real files.

> **Format note:** This was requested as a Word document. The code-execution sandbox that assembles `.docx` files is currently unavailable ("not enough disk space"), so the report is delivered as Markdown (fully editable, convertible). I will generate the `.docx` as soon as the sandbox is available.

---

## THE HEADLINE FINDING (read this first)

The Flutter app is **not** a port of the web app. It is a **public-browsing + auth shell** with a **placeholder scaffold** standing in for every logged-in portal.

The file `thenijobs-flutter/lib/core/routes/route_screens.dart` is literally titled *"Screens Stub/Placeholders for Router Setup."* All **43 seeker/employer/admin screens** are declared as one-line stubs, e.g.:

```dart
class EmployerPostJobScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) => _buildStubScreen('Employer Post Job');
}
```

Every one of those routes renders a **single generic widget** (`_PortalFeatureScreen`) driven by a config object (`_featureConfigFor`). That widget can only: show a header, show Firestore **count** tiles, show **navigation buttons**, render **read-only lists** of documents, and fire **one-tap status updates** (e.g. `{'status':'shortlisted'}`). There are **no real forms or workflows** behind login.

What this means in practice:

- A job-seeker **cannot edit their profile, build/upload a resume, manage job alerts, or open a message thread** in the app.
- An employer **cannot post a job, schedule an interview, search talent, message a candidate, or edit the company profile** in the app.
- An admin gets read-only lists with approve/reject toggles — **no real dashboards, charts, broadcast composer, or settings editor**.

The **public** experience (home, job/business/service browse, job detail **with a working Apply flow**, company registration) and **authentication** (email, Google, phone OTP, password reset) **are genuinely implemented**.

Net: the mobile app delivers roughly **15–20% of the web app's functionality** by capability, even though the router *declares* 100% of the routes.

---

## PHASE 1 — Project Discovery / Architecture

### 1.1 Web (Next.js) — recap from prior audit
Static export SPA; client-only Firebase; 3 portals; no API tier; security via `firestore.rules` + `storage.rules`.

### 1.2 Mobile (Flutter) architecture

| Concern | Implementation | Location |
|---|---|---|
| Language/SDK | Dart, Flutter SDK ^3.11 | `pubspec.yaml` |
| State management | **Riverpod** (`flutter_riverpod`) | `core/providers/`, `features/**/providers/` |
| Routing | **go_router** with auth-aware `redirect` | `core/routes/app_router.dart` |
| Auth | `firebase_auth` + `google_sign_in` | `features/auth/data/repositories/auth_repository_impl.dart` |
| Data | `cloud_firestore` direct (mirrors web) | `core/services/firestore_service.dart` |
| Storage | `firebase_storage` | `core/services/storage_service.dart` |
| Local cache / offline | **Hive** + `shared_preferences`; `connectivity_plus` present | `main.dart`, `core/services/local_storage_service.dart` |
| Charts | `fl_chart` (declared; used only in stub metric tiles) | — |
| File/image upload | `image_picker`, `file_picker` (declared; **not used** in any real form) | — |
| Push | `firebase_messaging` + `flutter_local_notifications` (**declared, not wired**) | `core/services/push_notification_service.dart` |
| Analytics | `firebase_analytics` (**declared, not wired**) | `core/services/analytics_service.dart` |
| HTTP | `dio`, `cloud_functions` (**no usages found** — no REST/functions exist) | `core/network/dio_client.dart` |

**App initialization** (`main.dart`): initializes Firebase + Hive only. **Does not** initialize push notifications, analytics, or connectivity listeners. `PushNotificationService` and `AnalyticsService` are **never instantiated anywhere** (confirmed by code search — only their own definitions match).

**Architecture verdict:** clean feature-first structure and correct plumbing choices, but the authenticated layer is scaffolding, and two declared integrations (push, analytics) are dead.

---

## PHASE 2 — Feature Inventory (web master list) & PHASE 3 — Web↔App Comparison

Legend: ✅ Fully available · ⚠ Partial (read-only / limited) · ❌ Missing · 🔴 Broken · 🟡 Needs improvement

### 2.1 Public & Auth

| Feature | Web page | Mobile screen | Status | Notes / code |
|---|---|---|---|---|
| Home / landing | `src/app/page.tsx` | `features/public/.../home_screen.dart` | ✅ | Real, with sections + FloatingWhatsApp. |
| Job search/list | `app/jobs/page.tsx` | `public/.../jobs_screen.dart` | ✅ | Real; both lack pagination. |
| Job detail + **Apply** | `app/jobs/[id]/JobDetailPageClient.tsx` | `public/.../job_detail_screen.dart` | ⚠ | Apply works (`_applyToJob`, `_showApplyBottomSheet`) **but** see 🔴 below. |
| Business directory | `app/businesses` | `businesses_screen.dart` | ✅ | Real. |
| Company profile | `app/company/[slug]` | `company_detail_screen.dart` | ✅ | Real. |
| Company register | `app/company/register` | `route_screens.dart` `CompanyRegisterScreen` | ✅ | **Real form** (writes `companies`, status `pending`). |
| Services | `app/services` | `services_screen.dart` | ✅ | Real. |
| Pricing | `app/pricing` | `pricing_screen.dart` | ✅ | Real. |
| Email login | `app/login` | `auth/.../login_screen.dart` | ✅ | `signInWithEmail`. |
| Google login | `app/login` | same | ✅ | `signInWithGoogle`. |
| Phone OTP | `app/login` | same | ✅ | `sendOtp`/`verifyOtp`. |
| Register (role pick) | `app/register` | `register_screen.dart` | ✅ | `register(... role ...)`. |
| Password reset | `app/forgot-password` | `forgot_password_screen.dart` | ✅ | `sendPasswordResetEmail`. |
| Admin login | `app/admin/login` | `AdminLoginScreen` (bridge) | ⚠ | Mobile shows a "use common sign-in" bridge, not a real admin form. |
| Public profile / Smart ID | *(no web equivalent)* | `/id/:id`, `/profile` | 🟡 | Mobile-only bonus screens. |

### 2.2 Seeker portal (web has 14 functional pages; mobile = stub viewer)

| Feature | Web | Mobile | Status | Evidence |
|---|---|---|---|---|
| Dashboard | real stats + lists | stub metrics + lists | ⚠ | `_seekerDashboardConfig` (read-only). |
| Profile **edit** | full editor | read-only doc view | 🔴 | `case 'Seeker Profile'` shows fields only; no edit. |
| Resume **upload/builder** | builder + Storage upload | read-only doc view | 🔴 | `SeekerResumeScreen` stub; **cannot create a resume on mobile**. |
| Applications | list + detail | list (read-only) | ⚠ | `case 'Seeker Applications'`. |
| Saved jobs | manage | list (read-only) | ⚠ | save/unsave only via public job detail. |
| Job alerts | create/edit | activate/pause toggle only | 🔴 | cannot **create** an alert (`Seeker Job Alerts`). |
| Interviews | view | list (read-only) | ⚠ | `Seeker Interviews`. |
| Messages | chat threads | conversation list only, **no thread/compose** | 🔴 | `_messagesConfig` lists docs; no message UI. |
| Notifications | list + read | list + mark-read | ✅/⚠ | `_notificationsConfig` (works, read-only otherwise). |
| Skills | edit | read-only | 🔴 | `Seeker Skills`. |
| Subscription | plans/checkout | read-only list | ⚠ | `_subscriptionConfig`; no purchase. |
| Settings | edit prefs | read-only | 🔴 | `Seeker Settings`. |
| AI Coach | page | links + profile view | ⚠ | `Seeker AI Coach`. |
| Rewards/Gamification | **none on web** | read-only `gamification` doc | 🟡 | Mobile-only; web has no rewards. |

### 2.3 Employer / HR portal (web has 14; mobile = stub viewer)

| Feature | Web | Mobile | Status | Evidence |
|---|---|---|---|---|
| Dashboard | stats + lists | stub metrics + lists | ⚠ | `_employerDashboardConfig`. |
| Company profile **edit** | full editor + gallery upload | read-only doc | 🔴 | `Employer Company Profile`. |
| **Post a job** | 4-step wizard | **list of jobs only, no form** | 🔴 | `case 'Employer Post Job'` renders recent-jobs list; **no posting form**. |
| My jobs | manage/edit | list + status toggles | ⚠ | `_employerCollectionConfig('jobs')`. |
| Candidates pipeline | full pipeline, notes, schedule | list + shortlist/select/reject toggles | ⚠ | `_applicationActions`; **no notes, no notify, no detail panel**. |
| Talent search | (web exists, rules-blocked) | read-only `seekerProfiles` list | 🔴 | Same rules block as web — returns nothing for employers. |
| Interviews **schedule** | create w/ date/time/mode | complete/cancel toggle only | 🔴 | cannot **create** an interview on mobile. |
| Leads | manage | list + status toggles | ⚠ | `_leadActions`. |
| Reviews | reply | read-only list | ⚠ | `Employer Reviews`. |
| Messages | chat | conversation list only | 🔴 | no thread/compose. |
| Billing / Subscription | plans | read-only list | ⚠ | no payment flow. |
| Reports | charts | metric tiles + lists | ⚠ | `fl_chart` not used. |
| Settings | edit | read-only | 🔴 | `Employer Settings`. |

### 2.4 Admin portal (web has 13 + login; mobile = stub viewer with toggles)

| Feature | Web | Mobile | Status | Evidence |
|---|---|---|---|---|
| Dashboard | stats + approvals | metrics + approval lists | ⚠ | `_adminDashboardConfig`. |
| Businesses approve/reject/feature | full | list + `_businessActions` toggles | ⚠ | works via generic doc update. |
| Jobs approve/reject | full | list + `_jobAdminActions` | ⚠ | works. |
| Users manage/role | full | read-only list (no role edit) | 🔴 | `Admin Users` has no actions. |
| Leads, Services, Ads, Reviews | manage | list + toggles | ⚠ | works for status toggles. |
| Subscriptions/Payments | view | read-only lists | ⚠ | — |
| Notifications **broadcast** | composer | read-only lists | 🔴 | no compose UI. |
| Reports/Analytics | charts | reuse of dashboard config | ⚠ | no charts. |
| Security / Activity log | view | reads `activityLogs` (empty on web too) | ⚠ | always empty (web `logActivity` is a no-op). |
| Settings | edit | reads wrong collection `settings` | 🔴 | web uses `platformSettings` → mobile list empty. |

---

## PHASE 4 — Database Audit (shared Firestore) & mismatch report

Both apps share Firestore. The mobile stubs query the same collections, but several **field/collection names diverge**, so mobile reads will silently render blank even where the web works:

| # | Mobile expects | Web actually writes | Effect | Location |
|---|---|---|---|---|
| D1 | `applicationCount` (jobs) | `applicationsCount` (plural) | Employer job cards show blank count | `route_screens.dart:2208,2914` vs `src/lib/firebase/firestoreService.ts` `applyToJob` (`applicationsCount: increment(1)`) |
| D2 | `profileCompletion` (seekerProfiles) | `profileStrength` | Profile-readiness meta always empty | `route_screens.dart` seeker configs vs `src/lib/types/index.ts` `JobSeekerProfile.profileStrength` |
| D3 | `resumeUrl` / `resumeTitle` | `resumes[]` array (web builder) | Resume section blank for web-built resumes | `route_screens.dart` `Seeker Resume` vs `JobDetailPageClient.tsx` (`resumes` array) |
| D4 | collection `settings` (Admin Settings) | `platformSettings` | Admin settings list always empty | `route_screens.dart:2581` vs `firestore.rules` `platformSettings` |
| D5 | application doc missing `seekerEmail`/`seekerPhone` when created on mobile | web `applyToJob` includes both | Web employer sees blank contact for **mobile-originated** applications | `job_detail_screen.dart` `ApplyToJobData` vs `firestoreService.ts applyToJob` |
| D6 | job status vocabulary `approved`/`paused` | web uses `active`/`rejected` | Inconsistent status across platforms | `_jobAdminActions` vs `approveJob` |

**Reads/writes coverage:** Mobile **reads** most collections via the generic viewer. Mobile **writes** are limited to: company registration, job apply, save/unsave, and single-field status toggles. It does **not** write: jobs (post), interviews (create), messages, profile/resume edits, job alerts (create), reviews, subscriptions/payments.

**Security-rule parity issues (inherited from web):** Talent Search reads `seekerProfiles` which rules restrict to owner/admin → blocked on mobile too. Generic admin toggles depend on admin custom-claim/role; they will work for real admins, fail silently otherwise (caught and shown as a SnackBar error).

---

## PHASE 5 — API Audit

There is **no REST/GraphQL API** on either side — both talk to Firebase directly. The mobile `dio` and `cloud_functions` dependencies have **no usages** in the reviewed code (dead deps). The de-facto "API" is the Firestore SDK + security rules.

| Check | Finding |
|---|---|
| Endpoints exist in web / used in app | Same Firestore collections; mobile uses a **subset** of operations. |
| Request/response structure | Diverges on field names (D1–D6). |
| Error handling | Mobile shows SnackBars on failure; many stub lists swallow permission errors to "no records". |
| Auth/authorization | Same rules layer; adequate for what mobile does. |
| Missing operations on mobile | postJob, scheduleInterview, sendMessage, updateProfile, uploadResume, createJobAlert, createReview, createPaymentRequest, admin role/broadcast writes. |
| Notifications on status change | Web sends `createNotification` on shortlist/select/reject/interview; **mobile generic toggles do not** → candidates aren't notified for mobile-driven actions. |

---

## PHASE 6 — UI/UX Audit

| Area | Web | Mobile |
|---|---|---|
| Navigation | Sidebar per portal | go_router; public bottom flows; **portal screens are generic scaffolds** |
| Forms | Rich multi-step wizards | Only company-register + apply bottom-sheet are real |
| Tables/lists | Custom | Generic `_FirestoreListSection` (title + chips) |
| Search/filters | Client-side filters | Public screens accept query params; portal viewers have **no search/filter** |
| Charts/dashboards | (web charts dead too) | `fl_chart` unused; metric tiles only |
| Missing screens/actions | — | post-job form, resume builder, profile editor, interview scheduler, message thread, talent results, settings editors, admin broadcast/role tools |

**UX positives on mobile:** consistent theming (`app_theme.dart`), shimmer/cached images available, OS text-scale clamped (`main.dart`), glass UI parity with web styling.

---

## PHASE 7 — Authentication & Security

| Capability | Web | Mobile | Status |
|---|---|---|---|
| Email/password | ✅ | ✅ `signInWithEmail` | parity |
| Google | ✅ | ✅ `signInWithGoogle` | parity |
| Phone OTP | ✅ | ✅ `sendOtp`/`verifyOtp` | parity |
| Password reset | page (verify wiring) | ✅ `sendPasswordResetEmail` | **mobile better** |
| Register + role | ✅ | ✅ | parity |
| Session/token | Firebase default | Firebase default | parity |
| Role guards | client-side | client-side `redirect` in `app_router.dart` | parity |
| Demo login | — | `demoLoginEnabled` flag in `auth_repository_impl.dart` | 🟡 ensure disabled in prod |

**Shared security gaps (both platforms):** no Firebase **App Check**; hardcoded Firebase config; world-readable company PII (GST/registration/email/phone); email verification not enforced. (Full detail in the web audit report.) Mobile adds risk only via the **demo login flag** — verify it is off for store builds.

---

## PHASE 8 — Testing (simulated flows)

| Flow | Mobile result |
|---|---|
| Register | ✅ works |
| Login (email/Google/OTP) | ✅ works |
| Browse jobs/businesses/services | ✅ works |
| **Apply to job** | ⚠ works **only if** the seeker already has a resume in `resumes[]` (built on web). Mobile "Manage Resumes" → **stub**, so mobile-only users hit a dead end. 🔴 |
| Save/unsave job | ✅ works |
| Create job (employer) | 🔴 **not possible** (no form) |
| Schedule interview | 🔴 not possible (toggle-only) |
| Message candidate/employer | 🔴 not possible (no thread) |
| Edit profile / upload resume | 🔴 not possible |
| Admin approve business/job | ✅ works (toggle) |
| Admin broadcast / edit settings | 🔴 not possible / reads wrong collection |
| Notifications | ⚠ view + mark-read works; **no push delivery** (not wired) |
| Payments | 🔴 none (no gateway on either platform) |

---

## PHASE 9 — Performance

- **Stub list sections** stream collections with `limit(20)` (better than web's unbounded job list) — but **no pagination beyond 20** and no search.
- **Count tiles** use `.snapshots().map(len)` (downloads docs to count) instead of `getCountFromServer` aggregation → unnecessary reads/cost.
- Offline cache (Hive) initialized but **not used** for Firestore data.
- Unused heavy deps inflate build: `dio`, `cloud_functions`, `fl_chart`, `image_picker`, `file_picker` (declared, unused in real flows).
- Push/analytics init absent → no startup cost, but also no telemetry.

---

## PHASE 10 — SEO & Web Audit

SEO applies to the **web** app only (Flutter is a native app). Findings carry over from the web audit: good root metadata; `robots.ts`/`sitemap.ts` exist but the **sitemap omits real jobs/companies**, dynamic job pages aren't pre-rendered (`generateStaticParams` → `'demo'`), no `JobPosting` JSON-LD, and OG/PWA images are missing. (See `THENIJOBS_Enterprise_Audit_Report.md` §11.)

---

## PHASE 11 — App-Store Readiness

| Requirement | Status |
|---|---|
| Android build config | Present (`thenijobs-flutter/android`) — verify signing, applicationId, min/target SDK. |
| iOS build config | Present (`ios`) — verify bundle id, capabilities, Info.plist usage strings for camera/photos (image/file pickers). |
| Permissions | image/file pickers declared but unused; ensure Info.plist/AndroidManifest strings exist if you wire uploads. |
| **Push notifications** | 🔴 **Not wired** — `PushNotificationService` never called; no FCM token registration, no permission request, no handlers, no `firebase_messaging` background isolate. Not store-ready as a feature. |
| Deep linking | go_router paths exist; **no Android App Links / iOS Universal Links** config verified. |
| Error handling | SnackBars on failures; no global crash reporting (no Crashlytics dep). |
| Analytics | 🔴 declared, not initialized. |
| Verdict | **Not ready** to ship as a feature-complete app; shippable only as a "browse + apply + auth" lite app after fixing the resume dead-end and wiring push. |

---

## FINAL REPORT

### 1. Executive Summary
The Flutter app shares the web's Firebase backend and faithfully implements the **public** marketplace (browse + job detail + apply) and **authentication**. Everything behind login — all 43 seeker/employer/admin screens — is a **generic placeholder viewer** (`route_screens.dart`), not the real feature set. Push notifications and analytics are declared but **not wired**. Several **field/collection name mismatches** cause silent blanks, and a **resume dead-end** prevents mobile-only users from applying. The app declares 100% of routes but delivers ~15–20% of capability.

### 2–6. Counts (approximate, by capability)

| Metric | Count |
|---|---|
| Distinct web feature-screens | ~55 |
| Fully available in app (✅) | ~13 (public + auth) |
| Partially available (⚠ read-only/limited) | ~25 (portal viewers + toggles) |
| Missing/Broken real workflows (❌/🔴) | ~17 (post-job, resume builder, profile/skills/settings edit, interview scheduling, messaging, talent results, alert creation, broadcasts, payments, push) |

### 7. Security Issues
Shared: no App Check, hardcoded keys, public company PII, email-verification not enforced. Mobile-specific: **demo-login flag** must be disabled for production; generic doc-update toggles bypass the web's validation/notification side-effects.

### 8. Performance Issues
Count tiles download docs instead of aggregating; lists capped at 20 with no pagination/search; unused heavy deps inflate bundle; Hive offline cache unused.

### 9. Database Issues
D1–D6 field/collection mismatches (`applicationCount`/`applicationsCount`, `profileCompletion`/`profileStrength`, `resumeUrl`/`resumes[]`, `settings`/`platformSettings`, missing `seekerEmail`/`seekerPhone`, status vocabulary).

### 10. API Issues
No real API tier; mobile uses a subset of Firestore ops; status changes don't fire notifications; `dio`/`cloud_functions` dead.

### 11. UI/UX Issues
Portal screens are generic scaffolds; no real forms, search, filters, charts, or message threads behind login.

### 12. SEO Issues
Web-only; sitemap omits real content; no `JobPosting` structured data; missing OG/PWA assets (see web report).

### 13. Recommended Fixes (by area)
Build real Flutter screens for: post-job, resume builder + Storage upload, profile/skills/settings editors, interview scheduler, message threads, job-alert creation, admin broadcast/role tools. Fix field mismatches D1–D6. Wire push (FCM token + permission + handlers) and analytics in `main.dart`. Remove the resume dead-end (or allow upload from the apply sheet). Include `seekerEmail`/`seekerPhone` in mobile apply. Disable demo login for prod. Add Crashlytics + deep-link config for store readiness.

### 14. Priority Matrix

| Priority | Items |
|---|---|
| 🔴 Critical | Resume dead-end blocks mobile apply (D3 + stub); post-job missing; messaging missing; push not wired; field mismatches D1/D4/D5; disable demo login. |
| 🟠 High | Profile/resume/settings editors; interview scheduler; job-alert creation; admin broadcast + user-role tools; notify-on-status-change; talent-search backend (shared with web C1). |
| 🟡 Medium | Reports/charts (`fl_chart`); aggregation counts; pagination/search in portal lists; offline caching via Hive; status-vocabulary unification (D6). |
| 🟢 Low | Remove dead deps (`dio`, `cloud_functions`); analytics events; polish bonus `/id` `/profile` screens. |

### 15. Development Effort Estimate

| Workstream | Complexity | Estimate |
|---|---|---|
| Fix field mismatches D1–D6 | Low | 1–2 days (8–16h) |
| Wire push + analytics in `main.dart` (+FCM handlers) | Medium | 3–4 days (24–32h) |
| Resume builder + Storage upload (Flutter) | High | 5–7 days |
| Post-job wizard (Flutter) | High | 4–6 days |
| Profile/skills/settings editors | Medium | 4–6 days |
| Interview scheduler form | Medium | 2–3 days |
| Messaging threads (list + thread + send) | High | 5–8 days |
| Job-alert creation + admin broadcast/role tools | Medium | 3–5 days |
| Talent-search backend (Cloud Function, shared) | Medium | 3–5 days |
| Store readiness (deep links, Crashlytics, permissions, disable demo) | Medium | 3–4 days |
| **Total to reach feature parity** | — | **~6–9 developer-weeks** |

### 16. Exact Code Locations (anchors)
- Stub engine: `thenijobs-flutter/lib/core/routes/route_screens.dart` — `_buildStubScreen`, `_PortalFeatureScreen`, `_featureConfigFor`, plus the 43 `*Screen` stub classes (lines ~3163–3421).
- Router: `thenijobs-flutter/lib/core/routes/app_router.dart`.
- Apply flow: `thenijobs-flutter/lib/features/public/presentation/screens/job_detail_screen.dart` — `_applyToJob`, `_showApplyBottomSheet`.
- Auth: `thenijobs-flutter/lib/features/auth/presentation/providers/auth_provider.dart`; `.../data/repositories/auth_repository_impl.dart`.
- App init: `thenijobs-flutter/lib/main.dart`.
- Unwired services: `thenijobs-flutter/lib/core/services/push_notification_service.dart`, `analytics_service.dart`.
- Field mismatches: `route_screens.dart` (`applicationCount` ~2208/2914; `profileCompletion`; `settings` ~2581) vs web `src/lib/firebase/firestoreService.ts`, `src/lib/types/index.ts`, `firestore.rules`.
- Company register (real): `route_screens.dart` `CompanyRegisterScreen` (~184–537).

### 17. Action Plan (step-by-step)

1. **Stabilize parity data (week 1):** fix D1–D6; add `seekerEmail`/`seekerPhone` to mobile apply; point Admin Settings at `platformSettings`; unify status vocabulary.
2. **Unblock mobile apply (week 1):** implement resume upload in the apply sheet (or a minimal resume screen) so mobile-only users can apply.
3. **Wire integrations (week 2):** initialize push (FCM token, permission, foreground/background handlers) and analytics in `main.dart`; disable demo login for release; add Crashlytics.
4. **Build core seeker forms (weeks 2–3):** profile/skills/settings editors; job-alert creation.
5. **Build employer workflows (weeks 3–5):** post-job wizard; interview scheduler; candidate notes + notify-on-status; company-profile editor.
6. **Messaging (weeks 5–6):** conversation thread + compose for seeker & employer.
7. **Talent search backend (shared, week 6):** Cloud Function returning redacted candidates; wire both web and mobile.
8. **Admin tools (week 7):** broadcast composer, user-role management, real reports/charts.
9. **Store readiness (week 8):** deep links, permission strings, icon/splash, final QA on Android + iOS.
10. **Regression pass:** verify every mobile write matches web field names and triggers the same notifications/side-effects.

---

*This analysis is static (source-level). A runtime pass on a device/emulator and a Firestore-rules simulation are recommended to confirm the per-screen behaviors above. Companion document: `THENIJOBS_Enterprise_Audit_Report.md` (web + security + DB deep dive).*
