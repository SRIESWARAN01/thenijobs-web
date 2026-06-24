# THENIJOBS — FEATURE IMPLEMENTATION STATUS (Feature → Function → Status)

**Date:** 2026-06-09 · **Scope:** whole web app (`E:\thenijobs-main`) — public website, job-seeker portal, employer portal, admin panel, and the Firebase data layer that backs them. (No Flutter app / no Node backend exist in this repo.)

**How to read the Status column:**

- ✅ **Done** — implemented and works.
- 🟡 **Partial** — works but has a bug, gap, or missing validation.
- 🔴 **Broken** — errors out in production. Reason tagged: *(rules)* = collection has no security rule → denied; *(index)* = needs a composite index; *(static)* = static-export limitation.
- ⏳ **Pending** — stub / placeholder / not built.

"Backing function" names the actual code that powers the feature (`functionName()` in a file). Generic writes use `createDocument` / `updateDocument` / `deleteDocument` and reads use `useCollection` / `fetchCollection` from the data layer.

**One-line summary:** the UI for nearly every feature is built and most are wired to real Firestore, but a large share are **Broken in production** because ~11 collections have no security rules, plus a handful of features are **fake/placeholder** (password reset, payments, AI coach, admin 2FA). Implemented-and-actually-working features are the minority until the rules gate is fixed.

---

## 1. AUTHENTICATION & ONBOARDING

| Feature | Status | Backing function / file | Pending work |
|---|---|---|---|
| Email + password login | ✅ Done | `signInWithEmail()` — `contexts/AuthContext.tsx:146` | — |
| Google login | ✅ Done | `signInWithGoogle()` — `AuthContext.tsx:161` | seeds `users` doc on first login |
| Phone OTP login | ✅ Done | `sendPhoneOTP()` / `verifyPhoneOTP()` — `AuthContext.tsx:194,214` | needs authorized domains/reCAPTCHA in console |
| Email/password registration | 🟡 Partial | `createAccount()` — `AuthContext.tsx:249`; `register/page.tsx` | **phone number silently dropped** (stale `user`, `register:104`); no email-verify; not a `<form>` |
| Role selection at signup | 🟡 Partial | `register/page.tsx:16-22` | `supplier`/`service_provider` dead-end → routed to seeker portal (`AuthContext:300-302`) |
| Forgot / reset password | ⏳ Pending (FAKE) | `forgot-password/page.tsx:12-18` | **no email sent** — `setTimeout` then fake success; needs `sendPasswordResetEmail()` |
| Logout (seeker/employer) | ✅ Done | `signOut(auth)` — `employer/layout.tsx:66`, seeker layout | — |
| Logout (admin) | 🔴 Broken | `admin/layout.tsx:50-52` | only `router.push('/login')`; **never calls `signOut`** |
| Route protection (seeker/employer) | ✅ Done | `useRequireAuth()` — `hooks/useAuth.ts:34` | — |
| Route protection (admin) | 🔴 Broken | `admin/layout.tsx` | **no guard at all** — anyone can open `/admin/*` |
| Admin login role-check | ✅ Done | `admin/login/page.tsx:26-40` | UX gate only; real control must be in rules |

---

## 2. PUBLIC WEBSITE

| Feature | Status | Backing function / file | Pending work |
|---|---|---|---|
| Home page (hero, categories, trending, stats, testimonials) | ✅ Done | `components/home/*`, `app/page.tsx` | mostly presentational |
| Global search (jobs/business) | 🟡 Partial | `components/home/SearchHub.tsx` → `jobs/page.tsx` query params | depends on job list below |
| Job listings + filters + sort | 🟡 Partial | `getDocs(jobs)` inline — `jobs/page.tsx:82-124` | loads once + filters client-side (OK); **`status` vs `isActive` mismatch**; job "verified" badge always false |
| Save job (from list) | 🔴 Broken *(rules)* | `saveJob()`/`unsaveJob()` — `firestoreService:381/389`; `jobs/page.tsx:149` | `savedJobs` has no rule → denied; no dedupe |
| Job detail page | 🔴 Broken *(static)* | `jobs/[id]/page.tsx:3` (`generateStaticParams` → only `demo`) | real IDs 404/mis-render; SEO broken |
| Apply to job (from detail) | 🔴 Broken | inline write — `JobDetailPageClient.tsx:185-201` | 2nd inconsistent path; counter increment **commented out** |
| Business directory (list) | ✅ Done | `getCompanies()` — `firestoreService:219`; `businesses/page.tsx` | companies are public-readable (rule OK) |
| Business category page | 🟡 Partial | `businesses/[category]/page.tsx` | fixed category list (8) only |
| Company profile page | 🔴 Broken *(static)* | `getCompanyBySlug()` — `firestoreService:248`; `company/[slug]/page.tsx:3` | only 6 demo slugs pre-rendered |
| Company registration (public) | 🟡 Partial | `createDocument('companies')` — `company/register/page.tsx` | works but rules don't validate `ownerId`/status; alert()-based |
| Services directory | 🔴 Broken *(rules)* | `getServices()` — `firestoreService:706`; `services/page.tsx` | `services` collection has no rule |
| Pricing page | ✅ Done | `app/pricing/page.tsx` (static plans) | display only; not linked to real billing |
| SEO (sitemap/robots/metadata) | 🟡 Partial | `app/sitemap.ts`, `app/robots.ts`, `layout.tsx` metadata | static routes only; dynamic pages lack per-page metadata *(static export)* |
| Footer links | ⚪ Dead | `components/home/HomeFooter.tsx:45,58` | several `href="#"` placeholders |

---

## 3. JOB SEEKER PORTAL

| Feature | Status | Backing function / file | Pending work |
|---|---|---|---|
| Seeker dashboard + stats | 🟡 Partial | `useSeekerStats()` — `useRealtimeStats:257` | `savedJobs`/`interviews` counts denied *(rules)*; `seekerProfiles` views always 0 |
| My applications | ✅ Done | `getApplications({seekerId})` — `firestoreService:305` | own-application read allowed by rules |
| Saved jobs | 🔴 Broken *(rules)* | `getSavedJobs()` — `firestoreService:399` | `savedJobs` no rule |
| Profile (view/edit) | 🟡 Partial | `updateDocument('users'/profile)` — `seeker/profile/page.tsx` | writes `users`; `seekerProfiles` doc never created; alert()-based |
| Resume upload / list | 🟡 Partial | `useStorage` upload — `seeker/resume/page.tsx` | résumé read rule too open (any authed user) — see Storage |
| Resume builder | 🟡 Partial | `seeker/resume/builder/page.tsx` | auto-fill depends on profile; saves to profile |
| Job alerts | 🔴 Broken *(rules)* | `seeker/job-alerts/page.tsx` | alerts collection has no rule; no alert-matching engine |
| Interviews (seeker) | 🔴 Broken *(rules)* | `getInterviews({seekerId})` — `firestoreService:447` | `interviews` no rule |
| Messages (seeker) | 🔴 Broken *(rules)* | `conversations`/`messages` — `seeker/messages/page.tsx` | no rule; no "start chat"; names unresolved |
| Notifications | 🔴 Broken *(rules+index)* | `NotificationContext.tsx:50`; `getNotifications()` | `notifications` no rule + needs composite index |
| Settings | 🟡 Partial | `seeker/settings/page.tsx` | persistence/validation to verify *(verify live)* |
| Subscription / upgrade | ⏳ Pending | `seeker/subscription/page.tsx:122` | "Coming Soon"; no payment |
| Skills + assessments | 🟡 Partial | `seeker/skills/page.tsx:60` | "Mock test" is a placeholder state |
| AI Coach | ⏳ Pending | `seeker/ai-coach/page.tsx:54` | "in development" placeholder only |

---

## 4. EMPLOYER PORTAL

| Feature | Status | Backing function / file | Pending work |
|---|---|---|---|
| Employer dashboard + stats | 🟡 Partial | `useEmployerStats()` — `useRealtimeStats:190` | needs composite indexes (`companyId`+`status`); `interviews` denied |
| Company profile (create/edit) | ✅ Done | `createDocument`/`updateDocument('companies')` — `employer/company-profile/page.tsx` | image upload via Storage; rules don't validate ownership on create |
| Post a job | 🟡 Partial | `createDocument('jobs')` + `logActivity()` — `post-job/page.tsx:124` | throws "Failed" after success (`activityLogs` denied); **paid boosts are free** |
| Manage jobs | ✅ Done | `getJobs({companyId})` — `firestoreService:260`; `employer/jobs/page.tsx` | `applicationsCount` field drift |
| Candidates (view applicants) | 🟡 Partial | `getApplications({companyId})`, `updateApplicationStatus()` — `firestoreService:305/365` | scheduling writes `interviews` (denied) |
| Schedule interview | 🔴 Broken *(rules)* | `createDocument('interviews')` — `employer/candidates/page.tsx:89-121` | `interviews` no rule |
| Interviews list | 🔴 Broken *(rules)* | `getInterviews({companyId})` — `firestoreService:447` | `interviews` no rule |
| Talent search (find candidates) | 🔴 Broken *(rules)* | reads `seekerProfiles`/`users` — `employer/talent-search/page.tsx` | `seekerProfiles` readable only by owner/admin → employers can't read candidates |
| Leads (enquiries) | 🔴 Broken *(rules)* | `getLeads()`, `updateLeadStatus()` — `firestoreService:409/423` | `leads` no rule |
| Messages (employer) | 🔴 Broken *(rules)* | `conversations`/`messages` — `employer/messages/page.tsx` | no rule; no "start chat"; names show `User(abcd)` |
| Reports / analytics | 🟡 Partial | reads `jobs`/`applications` — `employer/reports/page.tsx` | depends on counters (drift) |
| Reviews (view/reply) | 🟡 Partial | `getReviews()` + reply update — `employer/reviews/page.tsx` | reviews public-readable (OK) |
| Billing / subscription | 🔴/⏳ Broken + Pending | `getSubscriptions()` — `firestoreService:732`; `employer/billing/page.tsx:198` | `subscriptions` no rule; **"payment gateway coming soon" alert** |
| Settings | ⏳ Pending (FAKE) | `employer/settings/page.tsx:34` | fake `setTimeout` save; **nothing persisted** |

---

## 5. ADMIN PANEL

| Feature | Status | Backing function / file | Pending work |
|---|---|---|---|
| Admin dashboard (stats, approvals, activity) | 🟡 Partial | `usePlatformStats()` — `useRealtimeStats:95`; `getActivityLogs()` | `leads`/`activityLogs` denied; "View Details" button dead; "Revenue" chart mislabeled; spoofable `adminId` fallback `'admin'` |
| User management (list/verify/suspend/delete/bulk) | ✅ Done | `useCollection('users')`, `verifyUser`, `updateDocument`, `deleteDocument`, `updateUserRole` — `admin/users/page.tsx` | **Export button dead**; no pagination (loads all); whole-collection read |
| Business approvals (approve/reject/feature/verify) | ✅ Done | `approveCompany`/`rejectCompany`/`featureCompany`/`verifyCompany` — `firestoreService:511-590` | side-effect notification denied (throws after update) |
| Job approvals (approve/reject) | ✅ Done | `approveJob`/`rejectJob` — `firestoreService:592/623` | side-effect notify/log denied |
| Leads management | 🔴 Broken *(rules)* | `getLeads()` — `firestoreService:409` | `leads` no rule |
| Services management | 🔴 Broken *(rules)* | `getServices()` — `firestoreService:706` | `services` no rule |
| Subscriptions management | 🔴 Broken *(rules)* | `getSubscriptions()` — `firestoreService:732` | `subscriptions` no rule |
| Advertisements | 🔴 Broken *(rules)* | `getAdvertisements()` — `firestoreService:750` | `advertisements` no rule; no serving/impressions |
| Reviews moderation | 🟡 Partial | `getReviews()` — `firestoreService:435` | reviews public-readable (OK) |
| Reports | 🟡 Partial | reads `jobs`/`applications`/`users` — `admin/reports/page.tsx` | counter drift |
| Notifications broadcast | 🔴 Broken *(rules)* | `createNotification()` loop — `admin/notifications/page.tsx:108` | `notifications` no rule |
| Security (logs, admin staff, settings, RBAC matrix) | 🟡/🔴 Mixed | `useCollection('activityLogs')`, `platformSettings` — `admin/security/page.tsx` | logs denied; 2FA/timeout write denied **and not enforced**; permission matrix hardcoded; "Verify Connection" dead |
| Platform settings | 🟡 Partial | `admin/settings/page.tsx` → `platformSettings` | `platformSettings` no rule *(verify live)* |

---

## 6. CROSS-CUTTING / INFRASTRUCTURE

| Capability | Status | Backing / file | Pending work |
|---|---|---|---|
| Auth context & role helpers | ✅ Done | `AuthContext.tsx` | doesn't cover supplier/service_provider |
| Notification context | 🔴 Broken *(rules+index)* | `NotificationContext.tsx` | `notifications` rule + index |
| Real-time data hooks | 🟡 Partial | `useCollection`/`useDocument` — `hooks/useFirestore.ts` | constraints excluded from deps → not reactive to dynamic filters |
| Stats hooks | 🟡 Partial | `useRealtimeStats.ts` | counts via whole-collection scans (perf/cost) |
| File storage | 🟡 Partial | `hooks/useStorage.ts`, `storage.rules` | résumés/GST docs over-readable; company assets writable by anyone |
| Firestore security rules | 🔴 Broken | `firestore.rules` | privilege escalation + 11 missing collections + unvalidated creates |
| Realtime DB rules | 🟡 Risk | `database.rules.json` | duplicate model; same weaknesses — consider removing |
| Hosting / headers | ✅ Done | `firebase.json` | add CSP; fix SPA-fallback SEO |
| Composite indexes | 🔴 Missing | (no `firestore.indexes.json`) | declare & deploy |
| App Check / abuse protection | ⏳ Pending | — | not configured |
| Payments | ⏳ Pending | — | no gateway anywhere |
| Email/SMS delivery | ⏳ Pending | — | only in-app docs (which are blocked) |
| Tests / CI | ⏳ Pending | — | none |

---

## 7. DATA-LAYER FUNCTION INVENTORY (what exists vs what's safe)

All of these exist in `src/lib/firebase/firestoreService.ts` and run **client-side**. "Exists" = code is written; "Works in prod" = passes security rules / indexes today.

| Function | Exists | Works in prod | Note |
|---|---|---|---|
| `getPlatformStats` | ✅ | 🔴 | `getCount('leads')` denied → whole call rejects |
| `getEmployerStats` | ✅ | 🟡 | needs composite indexes |
| `getSeekerStats` | ✅ | 🟡 | `savedJobs`/`interviews` denied |
| `getCompanies` / `getCompanyBySlug` | ✅ | ✅ | companies public-readable |
| `getJobs` / `getJobById` | ✅ | ✅ | jobs public-readable |
| `getApplications` | ✅ | 🟡 | works for owner/employer/admin per rules |
| `applyToJob` | ✅ | 🟡 | create OK; side-effects (`activityLogs`,`notifications`) denied → throws |
| `updateApplicationStatus` | ✅ | 🟡 | no transition validation |
| `saveJob`/`unsaveJob`/`getSavedJobs` | ✅ | 🔴 | `savedJobs` no rule |
| `getLeads`/`updateLeadStatus` | ✅ | 🔴 | `leads` no rule |
| `getReviews` | ✅ | ✅ | reviews public-readable |
| `getInterviews` | ✅ | 🔴 | `interviews` no rule |
| `createNotification`/`getNotifications`/`mark…Read` | ✅ | 🔴 | `notifications` no rule + index |
| `approveCompany`/`rejectCompany`/`featureCompany`/`verifyCompany` | ✅ | 🟡 | update OK; notify/log denied; `adminId` spoofable |
| `approveJob`/`rejectJob` | ✅ | 🟡 | same |
| `updateUserRole` | ✅ | ⚠️ | dangerous — client-callable role change |
| `verifyUser`/`getUsers` | ✅ | 🟡 | admin-gated; whole-collection read |
| `getServices` | ✅ | 🔴 | `services` no rule |
| `getSubscriptions` | ✅ | 🔴 | `subscriptions` no rule |
| `getAdvertisements` | ✅ | 🔴 | `advertisements` no rule |
| `logActivity`/`getActivityLogs` | ✅ | 🔴 | `activityLogs` no rule |
| `createDocument`/`updateDocument`/`deleteDocument` | ✅ | 🟡 | generic; only rules constrain |

**Functions that DON'T exist yet (need to be written):** password reset, payment/checkout, subscription enforcement, conversation-create + participant-name resolution, interview/lead/notification rules-safe wrappers, seekerProfile bootstrap, cascade-delete cleanup, counter maintenance, email/SMS senders, RBAC checks, App Check init.

---

## 8. PENDING WORK — CONSOLIDATED LIST

**A. Pending because of missing security rules (build rules → these light up):** save jobs, job alerts, interviews (seeker+employer), leads (admin+employer), services directory + admin, subscriptions + revenue, advertisements, notifications (all portals) + broadcast, messaging, activity log/audit, platform/security settings, talent search. *(one rules file fixes most of these)*

**B. Pending because not built / fake (need new code):**
1. Real password reset (`sendPasswordResetEmail`).
2. Payment gateway + checkout + subscription enforcement (replaces "coming soon" + free boosts).
3. Employer Settings real persistence (remove fake timer).
4. Admin 2FA enforcement + session-timeout enforcement (currently cosmetic).
5. RBAC for granular admin/employer roles (matrix is decoration).
6. Messaging: start-conversation flow + participant-name resolution.
7. AI Coach feature.
8. Seeker Subscription upgrade flow.
9. Skills assessment / "Mock test".
10. Email/SMS delivery for notifications.
11. seekerProfiles creation on first login.
12. Pagination on all list screens.
13. Cascade-delete / data-integrity jobs (Cloud Functions).
14. Counter maintenance (atomic `increment()` / aggregation).
15. Tests + CI.

**C. Pending fixes to already-built features (bugs):** admin route guard, admin real logout, signup phone-save, supplier/provider routing, unify apply-to-job + counter, isolate side-effect writes, `status`/`isActive` normalization, `applicationsCount`/`appliedAt` field fix, reactive `useCollection`, dead buttons (Export/View Details/Verify Connection), footer links, Storage rule tightening, App Check, CSP, composite indexes, dynamic-route/SEO via SSR, remove unused deps.

---

## 9. STATUS TALLY (by feature, ~70 tracked)

| Status | Count (approx) | Examples |
|---|---|---|
| ✅ Done | ~14 | logins, home, business directory, user/business/job admin, manage jobs, my applications, company profile |
| 🟡 Partial | ~22 | registration, dashboards, post-job, candidates, reports, reviews, profile, resume |
| 🔴 Broken | ~24 | saved jobs, interviews, leads, services, subscriptions, ads, notifications, messaging, talent search, job/company detail pages, admin logout/guard |
| ⏳ Pending | ~10 | password reset, payments, AI coach, seeker subscription, skills test, employer settings persistence, 2FA, RBAC, email/SMS, App Check |

**Reality check:** ~⅓ of features are Broken in production today, and the dominant cause is a single fixable problem — the security-rules gap. Fixing the rules (Section A item in `AUDIT_REPORT.md` / `ERRORS_AND_PENDING_WORK.md` Phase 1) flips most of the 🔴 rows toward working, after which the remaining work is the "not built / fake" list in Section 8B.

*Coverage note: feature statuses come from reading ~30 files in full and pattern-sweeping the rest; rows tagged 🔴 *(rules)*/*(index)* are predicted from concrete root causes and should be confirmed on a deployed instance with the Firebase Emulator. Items marked* **(verify live)** *need a running build/deploy to confirm.*
