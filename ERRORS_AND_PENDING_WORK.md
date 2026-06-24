# THENIJOBS — COMPLETE ERRORS & PENDING-WORK LIST

**Date:** 2026-06-09 · **Scope:** entire web app (`E:\thenijobs-main`) — public website, admin panel, employer portal, seeker portal, Firebase data/rules layer.
**Companion file:** `AUDIT_REPORT.md` (the 15-phase audit with the deep security fixes). This document is the *exhaustive enumeration* you asked for: every error and every piece of unfinished work, grouped so you can work through it as a checklist.

**How this was produced:** all 99 source files were enumerated; ~30 were read in full (all config, all 3 security-rules files, auth/context/data/hooks, all 3 portal layouts, admin dashboard/users/security, employer messages/post-job/company-profile, seeker resume/profile, public jobs/job-detail/register/login, the type model) and the rest were swept with pattern searches for stubs, mock data, fake handlers, dead links and debug code. There is **no Flutter app and no Node/Express backend** in this repo — it is a Next.js static-export SPA + Firebase. Items that need a running build/deploy to confirm are marked **[verify live]**.

**Legend — Severity:** 🔴 Critical (exploit/data loss/blocks core flow) · 🟠 High · 🟡 Medium · ⚪ Low.
**Status tags:** `BROKEN` (errors out) · `FAKE` (pretends to work) · `INCOMPLETE` (half-built) · `DEAD` (does nothing) · `RISK` (latent).

---

## SECTION A — THE 4 ROOT CAUSES BEHIND MOST ERRORS

Most individual errors below trace back to four systemic problems. Fix these and dozens of symptoms disappear.

1. **No server tier / all logic in the browser.** Every privileged action runs client-side; security depends entirely on Firebase rules. *(see AUDIT_REPORT Phase 4/6)*
2. **Security rules don't cover the collections the app uses.** At least **11** collections are read/written with **no matching rule** → Firestore denies them → features silently break. *(Section C)*
3. **Privilege escalation + unguarded admin.** A user can self-promote to `super_admin`; `/admin/*` has no guard. *(AUDIT_REPORT 6.1/6.2 — BUG‑001/002)*
4. **Static export fights a dynamic app.** Real job/company detail pages aren't generated; SEO/deep-links break. *(AUDIT_REPORT 2.1 — BUG‑005)*

---

## SECTION B — CRITICAL ERRORS (must fix before launch)

| # | 🔴 Error | File / Evidence | Effect |
|---|---|---|---|
| C‑1 | User can set own `role: 'super_admin'` | `firestore.rules:28-33` (`users` update allowed by owner, no field lock) | Full platform takeover |
| C‑2 | Admin panel has **no access guard**; admin "logout" never signs out | `src/app/admin/layout.tsx` (no `useRequireAuth`; `handleLogout:50-52` only routes) | Anyone reaches `/admin/*`; sessions persist |
| C‑3 | 11+ collections have **no security rules** → denied in prod | `firestore.rules` vs code usage (Section C) | Notifications, leads, saved jobs, messaging, settings, etc. all fail |
| C‑4 | Any logged-in user can read **any** résumé & **any** GST/verification doc; overwrite any company's images | `storage.rules:41-65` | PII leak, defacement |
| C‑5 | Privileged creates unvalidated — user can self-publish/feature jobs & self-verify companies | `firestore.rules:40-55` | Approval + paid-placement bypass |
| C‑6 | Real job/company detail pages not generated (static export) | `jobs/[id]/page.tsx:3`, `company/[slug]/page.tsx:3-14`, `next.config.ts:3` | Deep links/refresh/SEO broken |
| C‑7 | Password reset is **FAKE** — no email sent, UI claims success | `forgot-password/page.tsx:12-18` (`setTimeout`, no `sendPasswordResetEmail`) | Users can never recover accounts |

---

## SECTION C — COLLECTIONS USED BUT NOT PROTECTED (the "silent breakage" matrix)

Firestore denies any collection with no `match` rule. These collections are used in code but **absent from `firestore.rules`**, so every screen that touches them throws `permission-denied` in production. This is the single biggest source of "it doesn't work" errors.

| Collection | Used by (examples) | Result |
|---|---|---|
| `notifications` | `NotificationContext.tsx:50`, every portal bell, `admin/notifications` | 🔴 BROKEN — no notifications anywhere (also needs composite index) |
| `savedJobs` | `jobs/page.tsx:135`, `seeker/saved-jobs`, `useSeekerStats` | 🔴 BROKEN — save/unsave fails |
| `leads` | `usePlatformStats:141`, `admin/leads`, `employer/leads` | 🔴 BROKEN — admin dashboard `Promise.all` also rejects |
| `interviews` | `employer/interviews`, `seeker/interviews`, stats | 🔴 BROKEN |
| `subscriptions` | `usePlatformStats:149`, `admin/subscriptions`, billing | 🔴 BROKEN — revenue always 0 |
| `services` | `admin/services`, `services/page` | 🔴 BROKEN |
| `advertisements` | `admin/ads`, `getAdvertisements()` | 🔴 BROKEN |
| `activityLogs` | `logActivity()` (every admin action + apply), `admin/security` | 🔴 BROKEN — audit log writes denied; also makes `applyToJob`/admin actions throw (BUG‑007) |
| `conversations` (+ `messages` subcollection) | `employer/messages`, `seeker/messages` | 🔴 BROKEN — messaging denied |
| `platformSettings` | `admin/security:57,76,88` (2FA, session timeout) | 🔴 BROKEN — settings writes denied |
| Job-alerts collection | `seeker/job-alerts` | 🔴 BROKEN **[verify collection name]** |

**Fix (one task):** add least-privilege rules for every collection above + a final `match /{document=**} { allow read, write: if false; }`. Add the composite indexes (`notifications: userId+createdAt`, etc.).

---

## SECTION D — FUNCTIONAL BUGS BY AREA (with file evidence)

### D1. Authentication & Registration
- 🟠 `BROKEN` **Phone number dropped at signup** — saved using async-stale `user?.uid` which is still null. `register/page.tsx:104-109`.
- 🟠 `BROKEN` **Password reset is fake** (C‑7). `forgot-password/page.tsx:12-18`.
- 🟡 `INCOMPLETE` **`supplier` & `service_provider` roles dead-end** — chosen at signup (`register/page.tsx:16-22`) but auth helpers ignore them (`AuthContext.tsx:300-302`); they're routed to the seeker portal.
- 🟡 **No email-verification enforcement** — `isVerified:false` written, never checked.
- ⚪ **Register form isn't a `<form>`** — Enter doesn't submit; no inline validation. `register/page.tsx`.
- ⚪ **Weak validation** — only "≥6 chars"/"fields present"; no email/phone format or password-confirm.

### D2. Website (public pages)
- 🟠 `RISK` **Two conflicting "is this job live?" signals** — public list filters `where status in ['active','approved']` (`jobs/page.tsx:85`) while admin/stats/`getJobs()` filter `isActive == true`. `approveJob` sets both, but the value `'approved'` is never actually produced (approve sets `status:'active'`), and any job missing one field disappears or leaks. Normalize to one field.
- 🟡 `BROKEN` **Saved-jobs load fails on public list** — reads `savedJobs` (no rule). `jobs/page.tsx:135`.
- 🟡 **Job "verified" badge always false** — maps `d.isVerified` but jobs have no such field. `jobs/page.tsx:110`.
- ⚪ `DEAD` **Footer links go nowhere** — `href="#"`. `components/home/HomeFooter.tsx:45,58`.
- 🟠 **Job/company detail deep-links broken** (C‑6).

### D3. Admin panel
- 🟠 `RISK` **Spoofable admin identity** — actions pass `user?.uid || 'admin'` (literal `'admin'` string fallback). `admin/dashboard:142,157`, `admin/users:109,146`.
- 🟡 `DEAD` **"Export" button** has no handler. `admin/users:202-205`.
- 🟡 `INCOMPLETE` **Pagination declared but missing** — `currentPage/setCurrentPage` state + `ChevronLeft/Right` imports exist, but no pagination UI; the whole `users` collection is loaded and filtered client-side. `admin/users:68,5-8`.
- 🟡 `DEAD` **"View Details" (eye) button** on pending approvals has no handler. `admin/dashboard:330-332`.
- 🟡 **"Revenue Overview" chart is mislabeled** — it plots Users/Business/Jobs/Apps/Leads *counts*, not revenue or a time series. `admin/dashboard:422-443`.
- 🟠 `FAKE` **Security settings don't do anything** — 2FA toggle & session-timeout write to `platformSettings` (no rule → denied) **and are never enforced** (admin login has no 2FA; there's no idle-logout). `admin/security:71-94`.
- 🟡 `DEAD/FAKE` **"Verify Connection" button** has no handler. `admin/security:197`.
- 🟡 `INCOMPLETE` **Permission matrix is hardcoded decoration** — `PERMISSIONS` const (`admin/security:12-21`); the granular roles (moderator/support/sales/franchise) are **not enforced** anywhere in code or rules. RBAC unimplemented.
- 🟡 **Admin dashboard stats partially fail** — `leads` denied makes the platform-stats `Promise.all` reject (`firestoreService.getPlatformStats:90`); the hook version logs errors and shows 0 (`usePlatformStats`).

### D4. Employer portal
- 🟠 `BROKEN` **Post-job throws "Failed" after success** — `logActivity`→`activityLogs` (denied) runs after the job is created, so the catch fires though the job saved. `post-job/page.tsx:124-143`.
- 🟠 `FAKE/INCOMPLETE` **Paid "Boost" options are free** — Featured/Urgent/Premium are plain toggles with no payment. `post-job/page.tsx:455-485`.
- 🟠 `BROKEN/INCOMPLETE` **Messaging** — real `conversations`/`messages` code exists, but: (a) `conversations` has no rule → denied; (b) **no UI to start a conversation** (read/reply only); (c) other participant's name **never resolved** → shows `User(abcd)`. `employer/messages/page.tsx:46,53-66`.
- 🟠 `FAKE` **Employer Settings "save" is a timer** — `await new Promise(r=>setTimeout(r,800)); alert('Settings updated')`; nothing is persisted. `employer/settings/page.tsx:34-35`.
- 🟠 `BROKEN/FAKE` **Billing has no payments** — "Upgrade" buttons `alert('Payment gateway integration coming soon!')`; subscription reads hit denied `subscriptions`. `employer/billing/page.tsx:198`.
- 🟡 **Leads/Interviews screens** depend on `leads`/`interviews` (no rules) → BROKEN until rules added. `employer/leads`, `employer/interviews`.
- 🟡 **Company name/logo denormalized onto jobs** → stale on rename. `post-job:115-116`.

### D5. Seeker portal
- 🟠 `INCOMPLETE` **AI Coach is a placeholder** — "currently in development"; `setTimeout` stub. `seeker/ai-coach/page.tsx:15,54`.
- 🟠 `INCOMPLETE` **Subscription upgrade is "Coming Soon"** (non-functional). `seeker/subscription/page.tsx:122`.
- 🟡 `INCOMPLETE` **Skills "Mock test"** is a placeholder state. `seeker/skills/page.tsx:60`.
- 🟠 `BROKEN` **Seeker profile views always 0 / profile reads null** — code reads `seekerProfiles/{uid}` but nothing ever creates it (signup writes only `users/{uid}`). `firestoreService.getSeekerStats:203`, vs `AuthContext.createAccount`.
- 🟠 `BROKEN` **Apply-from-detail uses a second, inconsistent path** — inline write with different field names (`resumeURL`, `jobTitle`…) than `applyToJob`, and the job counter increment is **commented out/skipped**. `JobDetailPageClient.tsx:185-201`.
- 🟡 `BROKEN` **Saved jobs / job alerts / interviews** depend on no-rule collections → fail. `seeker/saved-jobs`, `seeker/job-alerts`, `seeker/interviews`.
- 🟡 **Duplicate saves/applies possible** — `saveJob` blind `addDoc`, no dedupe. `firestoreService.saveJob:381`.

### D6. Shared data/hooks (affect many screens)
- 🟠 `RISK` **`useCollection` / `useRealtimeCount` ignore query constraints in effect deps** — `useFirestore.ts:108`, `useRealtimeStats.ts:70`. Pages that change a Firestore constraint at runtime won't re-subscribe (stale results). Currently masked because most pages use static constraints or filter client-side, but it's a live trap for any dynamic-filter screen.
- 🟠 `PERF` **Counts download whole collections** — `snapshot.size` over full collections; `getCountFromServer` imported but unused. `useRealtimeStats.ts:57,127,211`.
- 🟡 **Counter field drift** — type `applicationCount` vs data `applicationsCount`; `appliedAt` vs `createdAt`. `types/index.ts:198,216` vs `post-job:121`, `firestoreService:340`.
- 🟡 **Side-effect writes not isolated** — one denied `createNotification`/`logActivity` rejects the whole operation. `firestoreService.ts:344-360,533`.

---

## SECTION E — STUBS / FAKE / NON-FUNCTIONAL (looks done, isn't)

These render convincingly but do nothing real. Each needs implementation.

1. **Password reset** — fake success, no email. `forgot-password/page.tsx`.
2. **Employer Settings** — fake save timer, no persistence. `employer/settings/page.tsx:34`.
3. **Billing / payments** — "coming soon" alert; no gateway. `employer/billing/page.tsx:198`.
4. **Admin 2FA + session timeout** — toggles persist nowhere (denied) and aren't enforced. `admin/security:71-94`.
5. **Admin permission matrix / RBAC** — hardcoded display, not enforced. `admin/security:12-21`.
6. **Seeker AI Coach** — "in development" placeholder. `seeker/ai-coach`.
7. **Seeker subscription upgrade** — "Coming Soon". `seeker/subscription`.
8. **"Verify Connection" / "Export" / "View Details" buttons** — no handlers (Section D).
9. **Revenue Overview chart** — not revenue; counts bar chart. `admin/dashboard:422`.

---

## SECTION F — INCOMPLETE FEATURES (half-built; have types but no working backend)

- **Messaging/Chat** — partial (no rules, no "new chat", no name resolution).
- **Support tickets** — `SupportTicket` type only (`types/index.ts:406`), no UI/flow.
- **Franchise management** — `Franchise` type only.
- **Advertisements** — type + `getAdvertisements()` + `/admin/ads`, no rules, no serving/impressions.
- **Service requests / RFQ** — `ServiceRequest` type only.
- **Seeker profile (`seekerProfiles`)** — read path only, no create.
- **Email/SMS delivery** — only in-app notification docs are written (and those are blocked); nothing actually emails/SMSes users.
- **Pagination** everywhere (lists load whole collections).
- **Offline support** — none (no Firestore persistence).
- **Granular admin/employer team roles** (`AdminRole`, `EmployerRole` types) — defined, never enforced.

---

## SECTION G — DEAD CODE / UNUSED / HYGIENE

- **Unused dependencies:** `@tanstack/react-query`, `@tanstack/react-query-devtools`, `zod`, `react-hook-form` — installed, never imported in `src`. (`package.json:24-25,36,39`.)
- **Suspicious version:** `lucide-react ^1.17.0` — **[verify install/build]** (`package.json:31`).
- **`getCountFromServer`** imported but unused in `useRealtimeStats.ts`.
- **Dead buttons / links:** admin Export, admin View Details, security Verify Connection, footer `href="#"`.
- **Unused pagination state/imports** in `admin/users`.
- **Duplicate stats logic** — `firestoreService.ts` vs `useRealtimeStats.ts`.
- **Dual data planes** — Firestore + Realtime DB model the same entities (`database.rules.json`).
- **Debug `console.error`** scattered (acceptable, but no real logging/monitoring).
- **No tests / no CI** — zero `*.test.*`/`*.spec.*`.

---

## SECTION H — PENDING WORK CHECKLIST (work through top-to-bottom)

### 🔴 Phase 1 — Security & "won't work in prod" gate (do first)
- [ ] Lock `users` rules so non-admins can't change `role`/`isVerified`; move role changes to a Cloud Function with custom claims. *(C‑1)*
- [ ] Add `useRequireAuth(['admin','super_admin'])` to `admin/layout.tsx`; make admin logout call `signOut(auth)`; show the real user. *(C‑2)*
- [ ] Add Firestore rules for all 11 unprotected collections + catch-all deny. *(Section C)*
- [ ] Add composite indexes (`firestore.indexes.json`) and wire into `firebase.json`. *(notifications, employer stats, etc.)*
- [ ] Tighten Storage rules — résumés & verification docs to owner/admin only; company-asset writes ownership-checked. *(C‑4)*
- [ ] Validate privileged creates in rules — force `postedBy/ownerId == auth.uid`, `isActive=false`, `verificationStatus='pending'`, block self-set `isFeatured/isPremium/isUrgent`. *(C‑5)*
- [ ] Enable Firebase App Check; add a CSP header.

### 🟠 Phase 2 — Fix broken core flows
- [ ] Implement real password reset (`sendPasswordResetEmail`). *(C‑7)*
- [ ] Fix signup phone save (use returned `uid`, not context). *(D1)*
- [ ] Fix supplier/service_provider role handling + routing. *(D1)*
- [ ] Unify the two "apply to job" paths into one `applyToJob`; increment counter atomically with `increment()`. *(D5)*
- [ ] Isolate `logActivity`/`createNotification` side-effects so they can't fail the primary action. *(D6, BUG‑007)*
- [ ] Create `seekerProfiles/{uid}` on first seeker login. *(D5)*
- [ ] Normalize job "live" state to one field (`isActive` *or* `status`) across public list, stats, and rules. *(D2)*
- [ ] Canonicalize field names (`applicationsCount`, `appliedAt`) everywhere + data migration. *(D6)*
- [ ] Make `useCollection`/`useRealtimeCount` reactive to constraints. *(D6)*
- [ ] Move off `output:'export'` to SSR; generate real detail-page params + per-page metadata. *(C‑6)*

### 🟠 Phase 3 — Finish the half-built features
- [ ] Messaging: add rules for `conversations`/`messages`, a "start conversation" flow, and real participant-name resolution. *(D4)*
- [ ] Payments: integrate a gateway (Razorpay/Stripe) via Cloud Functions; gate Boosts & subscriptions on a verified payment; replace the "coming soon" alert. *(D4)*
- [ ] Employer Settings: persist to Firestore (remove the fake timer). *(D4)*
- [ ] Admin Security: make 2FA + session-timeout actually enforced (or remove); implement RBAC for the granular roles or drop the matrix. *(D3)*
- [ ] AI Coach, Seeker Subscription, Skills "Mock test": build or clearly mark as roadmap. *(D5)*
- [ ] Email/SMS delivery for notifications (Cloud Functions + provider).
- [ ] Add list pagination (`limit`+`startAfter`) to all collection views.

### 🟡 Phase 4 — Counters, performance, integrity
- [ ] Replace whole-collection counts with `getCountFromServer()`/counter docs. *(D6)*
- [ ] Cascade-delete / referential cleanup via Cloud Functions; stop denormalizing company name/logo (or fan-out updates). *(D4/D5)*
- [ ] Dedupe saves/applies (deterministic IDs `userId_jobId`). *(D5)*
- [ ] Consolidate on Firestore; remove Realtime DB + its rules. *(G)*

### ⚪ Phase 5 — UX, dead code, quality
- [ ] Replace all `alert()` with the Radix Toast already installed (56 occurrences).
- [ ] Wire up dead buttons (Export, View Details, Verify Connection) or remove them; fix footer `href="#"`.
- [ ] Fix the mislabeled "Revenue Overview" chart (use `recharts` + real series).
- [ ] Accessibility pass — replace clickable `<div>`s with buttons/inputs, add ARIA/keyboard, fix contrast.
- [ ] Remove or adopt unused deps (`zod` for validation, react-query for fetching); verify clean `next build`; confirm `lucide-react` version.
- [ ] Add tests (Vitest + RTL), e2e (Playwright), rules tests (Firebase Emulator), and a CI gate.

---

## SECTION I — TALLY & ORDER

**Counts (this enumeration):**
- 🔴 Critical: **7** (Section B, C‑1…C‑7) + the 11-collection rules gap.
- 🟠 High: **~16** functional (Sections D/E).
- 🟡 Medium: **~14**.
- ⚪ Low / hygiene: **~10**.
- **Incomplete/stub features:** **~15** (Sections E/F).

**Recommended order:** Phase 1 (security/rules) → Phase 2 (broken flows) → Phase 3 (finish features + payments) → Phase 4 (scale/integrity) → Phase 5 (UX/quality). Phases 1–2 are the gate to any real-user launch.

**Cross-reference:** the deep "how to fix" steps, rule snippets, and the AI-executable roadmap are in `AUDIT_REPORT.md` (Phases 6, 12, 14, 15). This file is the breadth (every error + every pending item); that file is the depth.

*Coverage note: ~30 of 99 files were read in full and the remainder pattern-swept; predicted `BROKEN` statuses (those caused by missing rules/indexes) should be confirmed on a deployed instance with the Firebase Emulator Suite. Build/version items are marked **[verify live]** because a clean `next build` could not be run in this environment.*

