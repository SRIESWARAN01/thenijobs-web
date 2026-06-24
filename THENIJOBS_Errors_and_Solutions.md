# THENIJOBS — Errors & Solutions (Website + Application + Workflows)

**Prepared for:** Siddhu (saaisiddharth2004@gmail.com)
**Date:** 11 June 2026
**Covers:** Web app (Next.js 16 / React 19 / Firebase) and Mobile app (Flutter / Riverpod / Firebase), sharing one Firebase backend.
**Source:** Distilled and consolidated from `THENIJOBS_Enterprise_Audit_Report.md` and `THENIJOBS_Web_vs_Flutter_Gap_Analysis.md`. Every item cites a real file/location.

This document is a practical, fix-oriented companion to the two full audit reports. It lists each defect as **Error → Cause → Solution → Location → Priority**, grouped by **Website**, **Application**, and **Shared (both platforms)**, then shows the **current vs. fixed workflows** and a single prioritized **action checklist**.

---

## How to read this document — severity legend

| Level | Meaning | Target |
|---|---|---|
| 🔴 Critical | Breaks a core feature, exposes data, or enables abuse. | Fix immediately |
| 🟠 High | Significant correctness, security, scalability, or SEO impact. | Fix within 30 days |
| 🟡 Medium | Quality, maintainability, or moderate UX/SEO issue. | Fix within 60–90 days |
| 🟢 Low | Cosmetic, cleanup, or nice-to-have. | Backlog |

**Status icons (workflow tables):** ✅ works · ⚠ partial/read-only · 🔴 broken · ❌ missing · 🟡 needs improvement

---

# PART A — WEBSITE (Next.js) ERRORS & SOLUTIONS

## A1. Critical & High — feature-breaking and security

| ID | Error | Cause | Solution | Location | Priority |
|---|---|---|---|---|---|
| C1 | **Talent Search / Resume Bank returns nothing** for every employer. | Page reads the entire `seekerProfiles` collection, but security rules allow read only to the profile owner/admin. | Add a Cloud Function / callable that returns a **redacted** candidate list (no contact info until seeker opts in / employer is premium + consent); wire Talent Search to it. Don't relax the rule. | `employer/talent-search/page.tsx:27`; `firestore.rules:186-191` | 🔴 |
| C2 | **HR candidate-detail panel shows "N/A"/empty** contact, experience, education. | Panel queries `seekerProfiles` + `users` for the candidate, which employers are (correctly) forbidden to read. | Render from the **application document** instead — `applyToJob` already denormalizes `seekerName/seekerEmail/seekerPhone/resumeUrl` onto it, and employers *can* read application docs. Only query `seekerProfiles` when viewer is owner/admin. | `employer/candidates/page.tsx:60-61`; `firestoreService.ts:357-414`; `firestore.rules:154-158` | 🔴 |
| C3 | **Public Firestore/Storage API open to scraping & abuse.** | No Firebase **App Check** initialized. | Enable App Check (reCAPTCHA Enterprise for web) on Firestore + Storage. | `lib/firebase/config.ts` (no App Check init) | 🔴 |
| H1 | **Business PII world-readable** (GST number, registration number, owner email/phone). | `companies` docs use `allow read: if true` and hold sensitive fields. | Split sensitive fields into an owner/admin-only subdocument; tighten public `companies` read to non-sensitive fields. | `firestore.rules:108-109`; `lib/types/index.ts:101-157` | 🟠 |
| H2 | **Firebase config (API key, project IDs) hardcoded** as fallback in source. | Secrets committed as literal fallback values. | Move config to **env vars**, remove hardcoded fallback, rotate keys. | `lib/firebase/config.ts:12-21` | 🟠 |
| H3 | **Admin "Activity Log" permanently empty** (no audit trail). | `logActivity()` is a no-op stub; `activityLogs` create rule is `false` with no Admin SDK to write them. | Implement audit writes via a Cloud Function (Admin SDK) writing `activityLogs`; build the Admin log view on top. | `firestoreService.ts:865-875`; `firestore.rules:324-329` | 🟠 |
| H4 | **No pagination anywhere** — full collections downloaded and filtered in browser. | Lists fetch whole collections (`jobs`, `seekerProfiles`, admin stats) with no `limit`/cursor. | Server-side `where` + `limit` + cursor pagination; debounce search. | `jobs/page.tsx:87`; `talent-search/page.tsx:27` | 🟠 |
| H5 | **Dynamic job/company pages not indexed / can 404 on deep link.** | Client-rendered under `output:'export'`; `generateStaticParams` returns only `[{id:'demo'}]`; sitemap omits real content. | Pre-generate per-job/company pages at build (DB fetch in `generateStaticParams`) or move those routes to SSR/ISR; generate sitemap from Firestore. | `jobs/[id]/page.tsx:3-5`; `app/sitemap.ts:31-42` | 🟠 |
| H6 | **Broken social-share previews & PWA install icons.** | `metadata`/manifest reference `/og-image.jpg`, `/icon-192.png`, `/icon-512.png` which don't exist in `public/`. | Add the missing assets; align names and theme-color. | `app/layout.tsx:34,61`; `public/manifest.json:12-15` | 🟠 |
| H7 | **Spam-prone open writes** for `leads`, `reviews`, `conversations`. | Create rules allow any authenticated user with no dedup, field validation, or eligibility check. | Gate creation: dedup, rate-limit, eligibility (e.g., review only after a real interaction); add rule-level field validation. | `firestore.rules:209,172-174,365-369` | 🟠 |

## A2. Authentication errors

| ID | Error | Cause | Solution | Location | Priority |
|---|---|---|---|---|---|
| W-A1 | **Password reset may be non-functional.** | `/forgot-password` page exists but `AuthContext` exposes no `sendPasswordResetEmail` action. | Verify the page is wired to Firebase `sendPasswordResetEmail`; add the action if missing. | `contexts/AuthContext.tsx`; `app/forgot-password` | 🟠 |
| W-A2 | **Email verification not enforced.** | `createAccount` never calls `sendEmailVerification`; custom `isVerified` flag is separate from Firebase `emailVerified` and not gated. | Send verification on signup; gate sensitive actions on verified email. | `contexts/AuthContext.tsx` (`createAccount`) | 🟠 |
| W-A3 | **No app-side rate limiting.** | Relies on Firebase defaults; compounded by missing App Check (C3). | Add App Check + sensible throttling on auth-heavy paths. | app-wide | 🟠 |
| W-A4 | **"reCAPTCHA already rendered" on OTP retry.** | New `RecaptchaVerifier` created per `sendPhoneOTP` call, never cleared. | Reuse/`clear()` the verifier before re-creating. | `AuthContext.tsx:234` | 🟡 |
| W-A5 | **Admin status lives in user-editable-shaped data + extra reads.** | `isAdmin()` accepts a Firestore `role` field or custom claim; Firestore path costs a `get()` per op. | Prefer **custom claims** as the source of truth for admin. | `firestore.rules:15-28` | 🟡 |
| W-A6 | **No session timeout / re-auth for sensitive admin actions.** | Default Firebase local persistence, indefinite. | Add re-auth prompt for sensitive admin operations; consider session timeout. | auth layer | 🟡 |

## A3. Website UI / forms / functionality errors

| ID | Error | Cause | Solution | Location | Priority |
|---|---|---|---|---|---|
| W-U1 | **Sort dropdown does nothing.** | `sortBy` state is set but never applied to the list before render. | Sort `filtered` by `sortBy` (Latest/Salary/Relevance) before rendering. | `jobs/page.tsx:278-284` | 🟡 |
| W-U2 | **Broken "Company" links** for jobs without a slug. | Link uses `/company/${companySlug || job.id}` but the company page resolves by **slug**. | Always store/propagate `companySlug`; guard the link when slug is absent. | `jobs/page.tsx:323,374` | 🟡 |
| W-U3 | **Applicants routed to a bogus WhatsApp number.** | `whatsapp` defaults to hardcoded `'919876543210'`. | Hide the WhatsApp CTA when no real number exists. | `JobDetailPageClient.tsx:91` | 🟡 |
| W-U4 | **"Share" button is dead.** | No `onClick` handler. | Implement Web Share API / copy-link. | `JobDetailPageClient.tsx:276` | 🟢 |
| W-U5 | **Accessibility failures** (screen readers, WCAG). | `<label>` not associated to inputs (`htmlFor`/`id`); icon-only buttons lack `aria-label`; weak focus styles. | Add `id`+`htmlFor`, `aria-label`s, visible focus rings; check contrast. | `login/page.tsx`, `register/page.tsx`, `post-job/page.tsx` | 🟡 |
| W-U6 | **Jarring `alert()` dialogs** inconsistent with the polished UI. | User feedback uses native `alert()`. | Replace with the existing **Radix Toast** (already a dependency) / `Modal` pattern. | `candidates`, `post-job`, `JobDetailPageClient`, `jobs` | 🟡 |
| W-U7 | **Weak form validation.** | Ad-hoc `useState` validation; no schema; no confirm-password; password min only 6; no terms/consent. | Adopt installed `zod` (+ optionally `react-hook-form`); add confirm-password, stronger policy, consent checkbox. | register / post-job wizards | 🟡 |
| W-U8 | **Typo'd CSS class renders no style.** | `text-gray-655` (invalid Tailwind class). | Fix to a valid class (e.g., `text-gray-600`). | `JobDetailPageClient.tsx:424` | 🟢 |
| W-U9 | **Theme-color mismatch.** | `layout.tsx` uses `#0a0a1a`; `manifest.json` uses `#7c3aed`. | Pick one brand theme-color and align both. | `app/layout.tsx`; `manifest.json` | 🟢 |

## A4. Website SEO errors

| ID | Error | Cause | Solution | Location | Priority |
|---|---|---|---|---|---|
| W-S1 | **No `JobPosting` JSON-LD** (not eligible for Google Jobs). | Structured data missing on job pages. | Emit `JobPosting` JSON-LD per job; add `Organization`/`BreadcrumbList`. | `jobs/[id]` | 🔴 |
| W-S2 | **Sitemap omits all real jobs/companies.** | `app/sitemap.ts` is static/hardcoded (4 demo slugs). | Generate the sitemap from Firestore at build. | `app/sitemap.ts:31-42` | 🟠 |
| W-S3 | **Dynamic pages lack unique titles/meta.** | Detail pages are `'use client'`, can't export `metadata`; only home gets a unique title. | Pre-render per-route (SSR/ISR or build-time static params) so each job/company has its own `<title>`/meta. | `jobs/[id]/page.tsx:3-5` | 🟠 |
| W-S4 | **Broken Open Graph image.** | `/og-image.jpg` referenced but missing (same as H6). | Add the asset. | `app/layout.tsx` | 🟠 |

## A5. Website performance / database errors

| ID | Error | Cause | Solution | Location | Priority |
|---|---|---|---|---|---|
| W-P1 | **Full-collection reads** (O(N) reads per page view). | `jobs`, `seekerProfiles` fetched whole and filtered client-side. | `where`+`limit`+cursor pagination. | `jobs/page.tsx:87`; `talent-search/page.tsx:27` | 🟠 |
| W-P2 | **Revenue calc loads all subscriptions** to sum client-side. | `getCount` revenue path reads all active `subscriptions`. | Maintain an aggregated counter doc (Cloud Function/transaction). | `useRealtimeStats.ts:214-221` | 🟠 |
| W-P3 | **`markAllNotificationsRead` does N individual writes.** | One `updateDoc` per notification. | Use a `writeBatch` (≤500/batch). | `firestoreService.ts:566-579` | 🟡 |
| W-P4 | **`unsaveJob` runs a query + N deletes every unsave.** | Legacy cleanup on each call. | Remove legacy scan; rely on deterministic IDs. | `firestoreService.ts:452-464` | 🟡 |
| W-P5 | **"Real-time" stats aren't real-time.** | `useRealtimeCount`/`usePlatformStats` use one-shot `getCountFromServer`, no `onSnapshot`, despite naming. | Either make them live (`onSnapshot`/counters) or rename + add manual refresh. | `useRealtimeStats.ts:106-146` | 🟡 |
| W-P6 | **Missing composite indexes** (runtime query failures). | No `firestore.indexes.json`; queries combine `where`+`orderBy`. | Commit `firestore.indexes.json` (notifications, applications, jobs). | project root | 🟠 |
| W-P7 | **`leads` "read own" likely broken.** | Rule references `resource.data.userId` but the `Lead` type has no `userId`. | Add `userId` to leads on create, or fix the rule field. | `firestore.rules:207`; `types:238-252` | 🟡 |
| W-P8 | **Schema drift on companies status.** | Both `verificationStatus` and legacy `status` exist, reconciled at read time. | Migrate to one field; drop the legacy one. | `firestoreService.ts:251-274` | 🟡 |
| W-P9 | **Unoptimized images** (worse LCP). | `images.unoptimized: true` (forced by static export). | Serve pre-sized/WebP from Storage via a loader, or move off pure export. | `next.config.ts:6-7` | 🟠 |

## A6. Website dead code / cleanup

| ID | Error | Cause | Solution | Location | Priority |
|---|---|---|---|---|---|
| W-D1 | **267-line dead constants file with wrong routes.** | `src/lib/constants.ts` unused; its nav arrays hold stale routes (`/admin/companies`, `/employer/company`, `/seeker/saved`). | Delete the file (a maintenance trap); keep live nav in layouts. | `src/lib/constants.ts` | 🟢 |
| W-D2 | **Unused UI components shipped.** | `Sidebar.tsx`, `Chart.tsx`, `DataTable.tsx`, `Modal.tsx`, `Breadcrumb.tsx` not imported. | Remove, or adopt `Modal`/`Breadcrumb`/`Sidebar` instead of hand-rolling. | `src/components/ui/*` | 🟢 |
| W-D3 | **Unused npm dependencies inflate bundle.** | `@tanstack/react-query` (+devtools), `react-hook-form`, `date-fns`, `recharts` (via dead `Chart`), `framer-motion` (only dead `Sidebar`). | Remove unused; **adopt `zod`** for validation. | `package.json` | 🟡 |
| W-D4 | **Three near-identical portal layouts** (~330 lines each, ~80% shared). | Each layout re-implements sidebar+header+notifications. | Refactor to one shared `Sidebar` + `PortalHeader`. | `app/{admin,employer,seeker}/layout.tsx` | 🟡 |
| W-D5 | **Starter boilerplate & backup assets.** | `public/{file,globe,next,vercel,window}.svg`, `logo_backup.png` unused. | Delete. | `public/` | 🟢 |
| W-D6 | **Admin gaps — no pages** for Applications, Interviews, Support, Franchises. | Types/rules defined but no admin UI. | Build `/admin/{applications,support,franchises,interviews}`. | `app/admin/*` | 🟠 |

---

# PART B — APPLICATION (Flutter) ERRORS & SOLUTIONS

> **Headline:** The Flutter app is **not** a port of the web app. It is a **public-browsing + auth shell** with a **placeholder scaffold** behind login. `lib/core/routes/route_screens.dart` declares all **43 seeker/employer/admin screens as one-line stubs**, each rendering one generic `_PortalFeatureScreen` (header + count tiles + nav buttons + read-only lists + one-tap status toggles). It declares 100% of routes but delivers ~15–20% of capability.

## B1. Missing / broken real workflows (behind login)

| ID | Error | Cause | Solution | Location | Priority |
|---|---|---|---|---|---|
| M1 | **Seeker can't edit profile.** | `Seeker Profile` stub shows read-only doc view. | Build a real profile editor screen + Firestore write. | `route_screens.dart` (`Seeker Profile`) | 🔴 |
| M2 | **Seeker can't build/upload a resume.** | `SeekerResumeScreen` is a stub; no Storage upload. | Build resume builder + `firebase_storage` upload (or allow upload in apply sheet). | `route_screens.dart` (`Seeker Resume`) | 🔴 |
| M3 | **Seeker can't create a job alert.** | Only activate/pause toggle exists. | Add alert-creation form writing `jobAlerts`. | `route_screens.dart` (`Seeker Job Alerts`) | 🟠 |
| M4 | **Seeker can't edit skills/settings.** | Read-only stubs. | Build skills + settings editors. | `route_screens.dart` (`Seeker Skills`, `Seeker Settings`) | 🟠 |
| M5 | **No message threads / compose** (seeker & employer). | Stubs list conversation docs only; no thread UI. | Build conversation thread + compose (read `messages` subcollection, write new messages). | `_messagesConfig` (seeker & employer) | 🔴 |
| M6 | **Employer can't post a job.** | `Employer Post Job` renders a recent-jobs list, no form. | Build the post-job wizard writing `jobs` (`status:'pending'`, `isActive:false`). | `route_screens.dart` (`Employer Post Job`) | 🔴 |
| M7 | **Employer can't edit company profile / gallery.** | Read-only stub. | Build company-profile editor + gallery upload. | `route_screens.dart` (`Employer Company Profile`) | 🟠 |
| M8 | **Employer can't schedule an interview.** | Only complete/cancel toggles; no create form. | Build interview scheduler (date/time/mode) writing `interviews` + notification. | `route_screens.dart` (`Employer Interviews`) | 🟠 |
| M9 | **Candidate pipeline is toggle-only.** | Shortlist/select/reject toggles but no notes, no notify, no detail panel. | Add notes, detail panel (from application doc), and fire `createNotification` on status change. | `_applicationActions` | 🟠 |
| M10 | **Employer Talent Search returns nothing.** | Same rules block as web C1 (`seekerProfiles` owner/admin only). | Share the redacted Cloud Function from C1; wire mobile to it. | `route_screens.dart` (employer talent search) | 🔴 |
| M11 | **Admin can't manage user roles.** | `Admin Users` is a read-only list with no actions. | Add role-management actions (via Admin SDK / claims). | `route_screens.dart` (`Admin Users`) | 🟠 |
| M12 | **Admin can't broadcast notifications.** | No compose UI. | Build broadcast composer writing `broadcasts`/`notifications`. | `route_screens.dart` (`Admin Notifications`) | 🟠 |
| M13 | **Admin Settings list always empty.** | Reads wrong collection `settings`; web uses `platformSettings`. | Point Admin Settings at `platformSettings` (see D4). | `route_screens.dart:2581` | 🔴 |

## B2. Database / field-name mismatches (silent blanks across platforms)

| ID | Error (symptom) | Mobile expects | Web actually writes | Solution | Location |
|---|---|---|---|---|---|
| D1 | Employer job cards show blank application count. | `applicationCount` | `applicationsCount` (plural) | Rename mobile reads to `applicationsCount`. | `route_screens.dart:2208,2914` vs `firestoreService.ts applyToJob` |
| D2 | Profile-readiness meta always empty. | `profileCompletion` | `profileStrength` | Read `profileStrength` on mobile. | `route_screens.dart` seeker configs vs `types/index.ts` |
| D3 | Resume section blank for web-built resumes. | `resumeUrl`/`resumeTitle` | `resumes[]` array | Read the `resumes[]` array on mobile. | `route_screens.dart` (`Seeker Resume`) vs `JobDetailPageClient.tsx` |
| D4 | Admin settings list always empty. | collection `settings` | `platformSettings` | Query `platformSettings` (same as M13). | `route_screens.dart:2581` vs `firestore.rules` |
| D5 | Web employer sees blank contact for mobile-originated applications. | apply doc omits `seekerEmail`/`seekerPhone` | web `applyToJob` includes both | Add `seekerEmail`/`seekerPhone` to mobile `ApplyToJobData`. | `job_detail_screen.dart` vs `firestoreService.ts applyToJob` |
| D6 | Inconsistent job status across platforms. | `approved`/`paused` | `active`/`rejected` | Unify status vocabulary across both apps. | `_jobAdminActions` vs `approveJob` |

## B3. Unwired integrations & store readiness

| ID | Error | Cause | Solution | Location | Priority |
|---|---|---|---|---|---|
| M14 | **Push notifications never work.** | `PushNotificationService` defined but never instantiated; no FCM token, permission, or handlers. | Initialize in `main.dart`: request permission, register FCM token, add foreground/background handlers. | `core/services/push_notification_service.dart`; `main.dart` | 🔴 |
| M15 | **No analytics / telemetry.** | `AnalyticsService` declared, never initialized. | Wire `firebase_analytics` in `main.dart`; log key events. | `core/services/analytics_service.dart`; `main.dart` | 🟡 |
| M16 | **Mobile-only users hit a resume dead-end on Apply.** | Apply needs `resumes[]` (built on web); mobile resume screen is a stub (D3 + M2). | Allow resume upload from the apply bottom-sheet (or a minimal resume screen). | `job_detail_screen.dart` `_applyToJob`/`_showApplyBottomSheet` | 🔴 |
| M17 | **Mobile status changes don't notify candidates.** | Generic doc-update toggles skip the web's `createNotification` side-effect. | Fire `createNotification` on shortlist/select/reject/interview from mobile. | `_applicationActions` | 🟠 |
| M18 | **Demo login flag risk in production.** | `demoLoginEnabled` flag in auth repository. | Disable for release/store builds. | `auth_repository_impl.dart` | 🔴 |
| M19 | **No crash reporting.** | No Crashlytics dependency. | Add Firebase Crashlytics. | `pubspec.yaml`; `main.dart` | 🟠 |
| M20 | **Deep links unverified.** | go_router paths exist but no Android App Links / iOS Universal Links config. | Configure App Links / Universal Links. | `android/`, `ios/` | 🟡 |
| M21 | **Count tiles download docs to count.** | `.snapshots().map(len)` instead of aggregation. | Use `getCountFromServer`. | stub metric tiles | 🟡 |
| M22 | **Portal lists capped at 20, no pagination/search.** | `limit(20)` with no cursor or search. | Add pagination + search to portal viewers. | `_FirestoreListSection` | 🟡 |
| M23 | **Offline cache unused.** | Hive initialized but not used for Firestore data. | Use Hive to cache Firestore reads for offline. | `local_storage_service.dart` | 🟡 |
| M24 | **Dead heavy dependencies.** | `dio`, `cloud_functions`, `fl_chart`, `image_picker`, `file_picker` declared, unused in real flows. | Remove unused, or wire them when building real features. | `pubspec.yaml` | 🟢 |
| M25 | **iOS/Android permission strings missing** if uploads are wired. | image/file pickers declared but unused; no Info.plist/Manifest strings. | Add camera/photos usage strings before shipping upload features. | `ios/Info.plist`, `android/AndroidManifest.xml` | 🟡 |

---

# PART C — SHARED ERRORS (both platforms, one Firebase backend)

| ID | Error | Cause | Solution | Priority |
|---|---|---|---|---|
| S1 | **No Firebase App Check** on either app. | Not initialized anywhere. | Enable App Check on Firestore + Storage; both clients send tokens. | 🔴 |
| S2 | **Hardcoded Firebase config.** | Committed in both web and mobile. | Move to env/secure config; rotate keys. | 🟠 |
| S3 | **World-readable company PII** (GST/registration/email/phone). | Public `companies` read rule. | Segregate sensitive fields to owner/admin-only subdoc. | 🟠 |
| S4 | **Email verification not enforced.** | Neither app gates on verified email. | Send + require verification. | 🟠 |
| S5 | **Talent Search blocked on both** (no legitimate client path to all `seekerProfiles`). | Rules correctly restrict to owner/admin. | One shared Cloud Function returning redacted candidates (fixes C1 + M10). | 🔴 |
| S6 | **No input validation at any layer.** | `zod` unused on web; rules don't constrain field types/lengths/enums. | Add rule-level validation + `zod` schemas; mirror constraints on mobile. | 🟠 |
| S7 | **Denormalization staleness risk.** | Company name/logo copied onto jobs/applications; renamed company won't propagate. | Periodic reconciliation or update fan-out (Cloud Function). | 🟡 |

---

# PART D — WORKFLOWS (current vs. fixed)

## D1. Seeker journey (web)

```
Expected:  Register → Profile → Resume → Skills → Search → Apply
           → HR Review → Shortlist → Interview → Select/Reject → Notify

Current:   Register ✅ → Profile ✅ → Resume ✅ → Skills ✅ → Search ✅ → Apply ✅
           → HR Review ⚠ (detail panel broken, C2) → Shortlist ✅
           → Interview ✅ → Select/Reject ✅ → Notify ✅
           [Proactive sourcing via Talent Search ❌ broken, C1]

After fix: every step ✅ once C2 (read from application doc) and C1
           (redacted candidate Cloud Function, S5) are done.
```

## D2. Employer journey (web)

```
Current:   Post job ✅ → Approval ✅ → Applicants ⚠ (C2 detail blank)
           → Shortlist/Interview/Reject ✅ → Notify ✅
           Talent Search ❌ (C1)  ·  Messaging ✅

After fix: Applicants ✅ (C2) and Talent Search ✅ (C1/S5).
```

## D3. Job approval sub-flow (web — already correct)

```
Post job → created status:'pending', isActive:false (rules force isActive==false)
        → Admin approveJob flips isActive:true → job goes live.
Same pattern for company registration/approval. Keep as-is.
```

## D4. Mobile apply flow (the critical dead-end)

```
Current:   Browse ✅ → Job detail ✅ → Apply ⚠
           Apply works ONLY if seeker already has resumes[] built on web.
           Mobile "Manage Resumes" → stub (M2/D3) ⇒ mobile-only users dead-end 🔴

After fix: Add resume upload in the apply sheet (M16) + read resumes[] (D3)
           + include seekerEmail/seekerPhone (D5)
           ⇒ Browse ✅ → Job detail ✅ → Upload/select resume ✅ → Apply ✅ → employer sees contact ✅
```

## D5. Mobile capability map (per portal)

```
Public + Auth ........... ✅ real (home, jobs, businesses, services, pricing,
                            job detail+apply, company register, login/Google/OTP/reset)
Seeker portal ........... ⚠/🔴 read-only viewer; no profile/resume/skills/settings/alert/message editing
Employer portal ......... ⚠/🔴 read-only viewer + status toggles; no post-job/interview/message/company editing
Admin portal ............ ⚠/🔴 approval toggles work; no role mgmt/broadcast; settings reads wrong collection

Target: replace _PortalFeatureScreen stubs with real forms per Part B.
```

---

# PART E — CONSOLIDATED ACTION CHECKLIST (do in this order)

### 🔴 Critical (fix immediately)
1. **C2** — Render HR candidate detail from the application doc (web). *(1–2 d)*
2. **S5/C1/M10** — Cloud Function returning **redacted** Talent Search results; wire web + mobile. *(3–5 d)*
3. **S1/C3** — Enable **App Check** (Firestore + Storage). *(1–2 d)*
4. **M16/D3** — Remove the **mobile resume dead-end** (upload in apply sheet) so mobile-only users can apply. *(part of resume work)*
5. **D1/D4/D5** — Fix field/collection mismatches that silently blank data. *(1–2 d total for D1–D6)*
6. **M6** — Build the **post-job** form (Flutter). *(4–6 d)*
7. **M5** — Build **messaging** threads (Flutter). *(5–8 d)*
8. **M14** — Wire **push notifications** in `main.dart`. *(3–4 d)*
9. **M18** — Disable **demo login** for production.
10. **W-S1** — Add **`JobPosting` JSON-LD** (web).

### 🟠 High (within 30 days)
11. **H1/S3** — Segregate sensitive company fields; tighten public read.
12. **H2/S2** — Env-based config + key rotation.
13. **H3** — Implement `activityLogs` via Cloud Function; build Admin log + missing admin pages (**W-D6**).
14. **H4/W-P1** — Cursor pagination + server-side filtering (web).
15. **H5/W-S2/W-S3** — Per-job static/ISR pages + DB-generated sitemap.
16. **H6/W-S4** — Add missing OG/PWA assets.
17. **H7/S6** — Gate + validate `leads`/`reviews`/`conversations`; adopt `zod` + rule validation.
18. **W-A1/W-A2/S4** — Wire password reset; enforce email verification.
19. **W-P2/W-P6** — Aggregation/counter docs for stats/revenue; commit `firestore.indexes.json`.
20. **M7/M8/M9/M17/M3/M4/M11/M12** — Build employer/seeker/admin Flutter forms + notify-on-status.
21. **M19** — Add Crashlytics.

### 🟡 Medium (60–90 days)
22. **W-U1/W-U2/W-U3/W-U5/W-U6/W-U7** — UI/UX + forms pass (sort, links, WhatsApp, a11y, toasts, validation).
23. **W-D3/W-D4** — Remove unused deps; refactor 3 layouts to shared components.
24. **W-P3/W-P4/W-P5/W-P9** — Batch writes; remove legacy scans; true aggregation; image pipeline.
25. **M15/M20/M21/M22/M23/M25** — Analytics, deep links, aggregation counts, pagination/search, offline cache, permission strings.
26. **W-P7/W-P8/S7/D6** — Fix `leads.userId`; converge company status field; reconcile denormalized fields; unify status vocabulary.

### 🟢 Low (backlog)
27. **W-U4/W-U8/W-U9** — Share button, CSS typo, theme-color.
28. **W-D1/W-D2/W-D5/M24** — Delete dead constants/components/assets/deps.

---

*Static (source-level) findings. A runtime pass on web (Lighthouse/field perf) and on a device/emulator (Flutter) plus a Firestore-rules simulation are recommended to confirm behavior. Full context in `THENIJOBS_Enterprise_Audit_Report.md` and `THENIJOBS_Web_vs_Flutter_Gap_Analysis.md`.*
