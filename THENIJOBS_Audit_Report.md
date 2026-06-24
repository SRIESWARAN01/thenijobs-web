# THENIJOBS — End-to-End Application Audit Report

**Project:** `thenijobs` (Theni / Tamil Nadu jobs + business directory platform)
**Audited build:** Next.js 16.2.7, React 19.2.4, Firebase 12.x, Tailwind CSS v4
**Audit date:** 9 June 2026
**Audit type:** Static source-code analysis (read-only). No code was modified.

---

## 0. Important scope note — read first

Your brief repeatedly refers to a **Flutter mobile application**, a separate **Node.js backend**, and roles **"Admin, Employee, Farmer."** None of these exist in this repository. What is actually present is:

- A single **Next.js 16 web application** (`thenijobs`) using the App Router.
- **Firebase** as the entire backend: Auth, Cloud Firestore (primary DB), Cloud Storage, Realtime Database (configured), and Analytics. There is **no separate Node.js server** — the app is a **static export** (`output: 'export'`) hosted on Firebase Hosting that talks directly to Firestore from the browser.
- Roles are **`job_seeker`, `employer`, `business_owner`, `supplier`, `service_provider`, `admin`, `super_admin`** — there is no "Farmer" role.

Because there is no Flutter codebase, the "audit/redesign the Flutter app," "premium splash screen," and "Website vs App parity" items cannot be performed against existing code. Instead, **Section 11 provides a Flutter parity & build plan** (architecture, screen map, splash/login design direction) so a mobile app can be built to match the web product. Everything else in this report audits the real web application.

The Linux build sandbox was unavailable during this session (disk space), so this is **static analysis** — every finding is traced to specific files and lines, but the app was not executed, built, or lint-checked live. Findings marked *(verify at runtime)* should be confirmed against a running build.

---

## 1. Executive Summary

THENIJOBS is a **surprisingly mature and well-architected** web application — considerably more complete than the brief implies. The data layer is clean, the Firestore **security rules and Storage rules are genuinely well-designed** (role checks, ownership checks, privilege-escalation protection, a default-deny catch-all), composite **indexes are defined**, and Firebase Hosting ships **real security headers (CSP, X-Frame-Options, nosniff)**. The UI is consistent and polished inside the three authenticated portals (admin / employer / seeker), with skeleton loaders, empty states, and real-time data.

It is **not** riddled with broken features. The issues that exist are concentrated in a few areas:

1. **One genuinely critical item:** the public login page ships **one-click "Demo Admin" login** with hardcoded credentials. If those demo accounts exist in the production Firebase project, this is a full admin takeover path.
2. **One important architectural mismatch:** the app is a **static export**, but job and company **detail pages are not actually pre-rendered** (they only generate placeholder params). This hurts deep-linking, refresh behaviour, and SEO — which matters enormously for a job board.
3. **A cluster of medium UX/quality issues:** a non-functional sort control, a job-type filter that never matches `Work From Home`, inconsistent timestamp handling that can render "Invalid Date," dynamic Tailwind classes that get purged (so some colors never show), `alert()` used everywhere for feedback, and a light-themed public header clashing with the dark app.

The headline conclusion: this is a **strong foundation that needs hardening and polish, not a rebuild.** Fixing the Critical and High items plus the top Medium items would get it to a credible production state.

| Severity | Count | Examples |
|---|---|---|
| 🔴 Critical | 1 | Demo Admin one-click login in production |
| 🟠 High | 3 | Detail pages not pre-rendered under static export; fetch-all job search; hardcoded Firebase config fallback |
| 🟡 Medium | 10 | Non-functional sort, WFH filter bug, timestamp inconsistency, dynamic Tailwind purge, `alert()` UX, light/dark header clash, weak validation, fragile query-memo keys, misleading "boost" toggles, CSP `unsafe-eval` |
| 🟢 Low | 8 | Stale nav constants, dead "Resend OTP" button, duplicate types, `any` overuse, AI-coach placeholder, company-slug fallback |

---

## 2. Architecture Report

### 2.1 Technology stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.7 (App Router), React 19.2.4, TypeScript 5 |
| Styling | Tailwind CSS v4, custom dark "glassmorphism" theme, framer-motion |
| UI primitives | Radix UI (avatar, dialog, dropdown, select, tabs, toast, etc.), lucide-react icons |
| Data/Auth | Firebase 12 — Auth, Firestore, Storage, Realtime DB, Analytics |
| Forms/validation | `react-hook-form` + `zod` are **installed but appear largely unused** (login/register/post-job use manual `useState`) |
| Data fetching | `@tanstack/react-query` is **installed but appears unused**; data flows through custom `onSnapshot` hooks instead |
| Charts | `recharts` (installed); admin dashboard uses a hand-rolled bar chart |
| Deployment | Static export (`output: 'export'`) → Firebase Hosting (`public: "out"`, SPA rewrite to `/index.html`) |

### 2.2 Folder structure (`src/`)

```
src/
  app/                       # App Router routes
    (public)  page.tsx, jobs/, businesses/[category]/, company/[slug]/,
              services/, pricing/, login/, register/, forgot-password/,
              company/register/, jobs/[id]/
    seeker/   dashboard, profile, resume, resume/builder, applications,
              saved-jobs, job-alerts, interviews, messages, skills,
              ai-coach, notifications, subscription, settings  (+ layout.tsx)
    employer/ dashboard, post-job, jobs, candidates, talent-search,
              interviews, leads, messages, reports, reviews, billing,
              subscription, company-profile, settings             (+ layout.tsx)
    admin/    dashboard, users, businesses, jobs, leads, services,
              subscriptions, ads, reviews, reports, notifications,
              security, settings, login                           (+ layout.tsx)
  components/  home/*, navigation/(Header,BottomNav), portal/WorkflowPage,
               ui/* (DataTable, Modal, Chart, StatsCard, FileUpload, …)
  contexts/    AuthContext.tsx, NotificationContext.tsx
  hooks/       useAuth.ts, useFirestore.ts, useRealtimeStats.ts, useStorage.ts
  lib/         constants.ts, types/index.ts, firebase/(config, firestoreService)
```

Configuration & security files at repo root: `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `database.rules.json`, `next.config.ts`.

### 2.3 Data flow

```
Browser (React client components)
   │
   ├── AuthContext  ── Firebase Auth (email/pwd, Google, phone OTP)
   │        └── on login → fetch users/{uid} profile → role helpers
   │
   ├── useCollection / useDocument  ── Firestore onSnapshot (real-time)
   ├── useRealtimeStats             ── getCountFromServer aggregates
   └── firestoreService.*           ── one-shot reads/writes + side-effects
                                        (notifications, activity logs)
   ▼
Cloud Firestore  ◄── firestore.rules enforce all authz (no server tier)
Cloud Storage    ◄── storage.rules (size/type/owner checks)
```

There is **no API/server tier and no middleware**. All authorization is enforced by **Firestore/Storage security rules**, and route-level access is a **client-side guard** (`useRequireAuth`). This is a valid architecture for Firebase SPAs, but it means: (a) all gating is client-side + rules — there is no server to trust; (b) SEO and deep-linking depend entirely on the static-export configuration (see Finding H1).

### 2.4 Authentication & authorization flow

- **Sign-in methods:** email/password, Google popup, phone OTP (`AuthContext.tsx`). New Google/phone users are seeded as `job_seeker`.
- **Registration** (`register/page.tsx`) lets users pick an end-user role; `createAccount` writes it to `users/{uid}`. **Admin is correctly not offerable**, and `firestore.rules` blocks self-assigning admin (`isEndUserRole(role)` on create, `unchanged('role')` on self-update).
- **Route guards:** `useRequireAuth(allowedRoles, redirectTo)` redirects unauthenticated users and bounces wrong-role users to their home portal. Each portal `layout.tsx` calls it.
- **Data authz:** `firestore.rules` defines `isOwner`, `isAdmin` (custom claim **or** stored role), `isSuperAdmin`, `isCompanyOwner`, and per-collection create/update/delete rules with a default-deny catch-all. This is the strongest part of the codebase.

---

## 3. Functional Audit (Bug Report)

Each issue: ID · Severity · Location · Description · Root cause · Recommended fix · Effort.

### 🔴 BUG-01 — One-click "Demo Admin" login on the public sign-in page
- **Severity:** Critical (conditional on demo accounts existing in production)
- **Location:** `src/app/login/page.tsx:165-182` and the rendered buttons at `:317-330`
- **Description:** The login screen renders "Quick Demo Access" buttons for Seeker / Employer / **Admin** that call `handleDemoLogin('admin')`, which signs in with hardcoded `admin@demo.com` / `demopassword`.
- **Root cause:** Development convenience left in the production page.
- **Impact:** If `admin@demo.com` (password `demopassword`) exists in the live Firebase Auth project, **anyone** can click one button and obtain full admin access (the Firestore rules trust the stored admin role). Even if the account doesn't exist, exposing valid-looking admin credentials and the demo flow is unacceptable for production.
- **Fix:** Remove the demo buttons entirely, or gate them behind `process.env.NODE_ENV !== 'production'`. Confirm the demo accounts do not exist in prod, or strip their admin role. Rotate credentials.
- **Effort:** 0.5 hr.

### 🟠 BUG-02 — Job/company/category detail pages are not pre-rendered under static export
- **Severity:** High
- **Location:** `next.config.ts:4` (`output: 'export'`); `src/app/jobs/[id]/page.tsx:3-5` (`generateStaticParams → [{id:'demo'}]`); `src/app/company/[slug]/page.tsx:3-14` (6 hardcoded demo slugs); `src/app/businesses/[category]/page.tsx:14`; `firebase.json` `rewrites` (`** → /index.html`).
- **Description:** With static export, only the params returned by `generateStaticParams` get an HTML file. Job detail only generates `/jobs/demo`; company only generates 6 fixed slugs. Real, dynamically-created jobs/companies have **no pre-rendered page**. The Hosting catch-all rewrite serves `/index.html` (the homepage shell) for any unknown path, masking 404s.
- **Impact:** (1) **SEO:** individual job and company pages — the most valuable indexable content for a job board — are not pre-rendered/indexable. (2) **Deep links & refresh:** sharing or refreshing a `/jobs/<realId>` URL is unreliable. (3) Social/OG previews for shared jobs won't be correct.
- **Root cause:** `output: 'export'` is incompatible with on-demand dynamic detail pages backed by a live database.
- **Fix options:** (a) Drop static export and deploy on a Node/SSR-capable host (Firebase App Hosting / Vercel) so detail routes render on demand; **or** (b) keep static export but move detail pages to query-param client routes (e.g. `/jobs?id=...`) so a single generated page handles all IDs client-side; **or** (c) generate params from Firestore at build time + scheduled rebuilds (only viable for slow-changing catalogs). Verify the exact behaviour against the Next.js 16 export docs (this Next version differs from older releases).
- **Effort:** 1–3 days depending on option.

### 🟠 BUG-03 — Job search downloads the entire active-jobs collection and filters in the browser
- **Severity:** High (performance / Firestore cost / scalability)
- **Location:** `src/app/jobs/page.tsx:84-127` (query has no `limit`) and `:180-187` (client-side `.filter`).
- **Description:** The page runs `where('isActive','==',true) orderBy createdAt desc` with **no pagination**, pulls every active job into memory, then filters by text/type/category/location on the client.
- **Impact:** Every visitor downloads all active jobs; read cost and load time grow linearly with the catalog. Fine at dozens of jobs, painful at thousands.
- **Fix:** Add Firestore pagination (`limit` + `startAfter`), push category/district/type filters into the query (indexes already exist for several), and add an "infinite scroll / load more." For full-text search, consider Algolia/Typesense or a denormalized search field.
- **Effort:** 1–2 days.

### 🟡 BUG-04 — Sort control on the jobs page does nothing
- **Severity:** Medium (functional)
- **Location:** `src/app/jobs/page.tsx:68` (`sortBy` state), `:278-283` (the `<select>`), `:180-187` (`filtered` is never sorted by `sortBy`).
- **Description:** The Latest / Salary / Relevance dropdown updates state but the results array is never re-sorted; ordering is always whatever the query returned.
- **Fix:** Apply a sort to `filtered` based on `sortBy` (e.g., by `salaryMax`, by `createdAt`, or a relevance score on the search term).
- **Effort:** 1 hr.

### 🟡 BUG-05 — "Work From Home" job type never matches the filter and renders mis-formatted
- **Severity:** Medium (functional)
- **Location:** `src/app/jobs/page.tsx:96` & `:184`; same pattern in `components/home/TrendingJobs.tsx:77`, `company/[slug]/CompanyProfilePageClient.tsx:77`, `jobs/[id]/JobDetailPageClient.tsx:226`, `seeker/dashboard/page.tsx:196`, `employer/reports/page.tsx:161`.
- **Description:** `d.jobType.replace('_', ' ')` replaces only the **first** underscore. `work_from_home` becomes `work from_home` → titlecased "Work From_home". Meanwhile the filter button label is "WFH", so it can never equal the computed type and the filter silently returns nothing.
- **Root cause:** `String.replace` with a string argument replaces one occurrence; needs a global regex.
- **Fix:** Use `.replace(/_/g, ' ')`, and define a canonical job-type label map shared across pages; make the filter compare against the canonical id (`work_from_home`) rather than a display label.
- **Effort:** 2 hr (centralize the mapping).

### 🟡 BUG-06 — Inconsistent timestamp handling → "Invalid Date" in places
- **Severity:** Medium
- **Location:** `src/hooks/useFirestore.ts:169-171, 222-223` (returns raw `d.data()` — Firestore `Timestamp` objects) vs `src/lib/firebase/firestoreService.ts:32-40` (`normaliseTimestamps` → JS `Date`). Symptom example: `src/app/admin/dashboard/page.tsx:125,133` calls `new Date(c.createdAt)` on a `Timestamp` from `useCollection`.
- **Description:** Components fed by the real-time hooks receive Firestore `Timestamp`s; components fed by `firestoreService` receive `Date`s. Code that assumes one or the other (`new Date(timestamp)`, `.toLocaleDateString()`) produces "Invalid Date" for the wrong type.
- **Fix:** Normalize timestamps inside `useCollection`/`useDocument` (reuse `normaliseTimestamps`), or add a single `toDate(value)` helper and use it everywhere dates are formatted.
- **Effort:** 0.5–1 day.

### 🟡 BUG-07 — Dynamic Tailwind class names are purged (selected-state colors don't render)
- **Severity:** Medium (UI)
- **Location:** `src/app/register/page.tsx:163` (`bg-${r.color}-500/20`); `src/app/employer/post-job/page.tsx:476` (`border-${color}-500/30`); `src/app/company/[slug]/CompanyProfileClient.tsx:489-490` (`bg-${color}-500/10`, `text-${color}-400`).
- **Description:** Tailwind v4 only ships classes it can see as complete strings at build time. Interpolated class names like `bg-${color}-500/20` are not generated, so those backgrounds/borders/text colors are missing at runtime.
- **Fix:** Map to full static class strings (the codebase already does this correctly via `colorMap`/`iconColorMap` elsewhere — apply the same pattern), or add a Tailwind safelist.
- **Effort:** 2 hr.

### 🟡 BUG-08 — "Boost" toggles on Post-Job imply an effect they don't have
- **Severity:** Medium (incomplete feature / misleading UX)
- **Location:** `src/app/employer/post-job/page.tsx:111-118` (saved as `requestedBoosts`, while `isPremium/isUrgent/isFeatured` are forced to `false`), preview badge at `:508-513`.
- **Description:** Employers toggle "Urgent / Featured / Premium" with copy like "Get 3× more visibility," and the preview shows the URGENT badge — but the values are only stored as `requestedBoosts` (correctly, since rules forbid self-promotion). There is **no visible payment or admin-grant flow** that ever converts a request into an active boost.
- **Fix:** Either wire `requestedBoosts` into the subscription/payment + admin approval flow, or relabel the toggles as "Request (paid)" with clear pending state; don't show the active badge in preview.
- **Effort:** 0.5 day (UX clarity) / 2–3 days (full boost workflow).

### 🟡 BUG-09 — Weak / missing form validation
- **Severity:** Medium
- **Location:** `src/app/employer/post-job/page.tsx:173` (only Step 1 validated; no `salaryMin ≤ salaryMax`, no past-deadline check, skills/salary optional with no guidance); `src/app/register/page.tsx:101` (password only `length ≥ 6`, phone unvalidated, email only via `type="email"`).
- **Fix:** Adopt the already-installed `react-hook-form` + `zod` to validate each step and the registration form (salary ordering, deadline ≥ today, phone = 10 digits, password strength).
- **Effort:** 1–2 days across the main forms.

### 🟡 BUG-10 — `alert()` used pervasively for user feedback
- **Severity:** Medium (UX consistency)
- **Location:** **55 occurrences across 19 files** (e.g., `jobs/page.tsx:154,176`, `employer/post-job/page.tsx:90,141,145`, `employer/candidates/page.tsx`, `seeker/job-alerts/page.tsx`, etc.).
- **Description:** Native blocking `alert()` dialogs are used for success/error feedback. Radix Toast is already a dependency.
- **Fix:** Replace with a toast/notification system (Radix Toast is installed) for non-blocking, on-brand feedback.
- **Effort:** 1–2 days.

### 🟢 BUG-11 — Stale navigation constants point to non-existent routes
- **Severity:** Low (latent — currently dead code)
- **Location:** `src/lib/constants.ts:221-266` (`ADMIN_NAV_ITEMS`, `EMPLOYER_NAV_ITEMS`, `SEEKER_NAV_ITEMS`).
- **Description:** These arrays reference routes that don't exist (`/admin/companies`, `/admin/applications`, `/admin/franchises`, `/admin/support`, `/admin/analytics`, `/admin/activity`, `/employer/company`, `/employer/analytics`, `/seeker/saved`). The portal layouts define their **own correct** nav inline and don't import these, so nothing is broken today — but the constants are a trap if reused.
- **Fix:** Delete the unused constants, or fix them and make the layouts consume a single source of truth.
- **Effort:** 1 hr.

### 🟢 BUG-12 — "Resend OTP" button is dead; OTP inputs lack paste/backspace nav
- **Severity:** Low (UX)
- **Location:** `src/app/login/page.tsx:305` (button with no `onClick`); `:84-92` (no paste handling, no backspace-to-previous).
- **Fix:** Wire Resend to re-trigger `sendPhoneOTP` with a cooldown timer; support paste-to-fill and backspace navigation in the 6-box OTP input.
- **Effort:** 2–3 hr.

### 🟢 BUG-13 — Company link falls back to job ID as a slug
- **Severity:** Low/Medium
- **Location:** `src/app/jobs/page.tsx:323,374` (`/company/${job.companySlug || job.id}`).
- **Description:** When `companySlug` is absent, the link uses the **job** id as a company slug, which won't resolve (`getCompanyBySlug` looks up by `slug`).
- **Fix:** Fall back to `companyId`-based routing or hide the company link when no slug exists; ensure jobs store `companySlug` at write time.
- **Effort:** 2 hr.

---

## 4. Website Audit

- **Public routes present & linked correctly:** `/`, `/jobs`, `/businesses`, `/businesses/[category]`, `/company/[slug]`, `/services`, `/pricing`, `/login`, `/register`, `/company/register`, `/forgot-password`. The public `Header` (`components/navigation/Header.tsx`) links to `/jobs`, `/businesses`, `/services`, `/pricing`, `/login`, `/employer/post-job`, `/company/register` — all valid. No broken public links found.
- **SEO:** Root metadata is strong (`app/layout.tsx` — title template, OpenGraph, Twitter, robots, manifest); the homepage overrides metadata (`app/page.tsx:15-19`); `robots.ts` and `sitemap.ts` exist. **However**, see BUG-02 — dynamic detail pages aren't pre-rendered, undercutting SEO for the job/company content that matters most.
- **Performance:** `next.config.ts` uses `images.unoptimized: true` (required by static export) — images aren't optimized/resized, so large company logos/covers ship at full weight. Hosting sets long-lived immutable caching for static assets and a sensible CSP (good). The jobs page fetch-all (BUG-03) is the main runtime performance risk. Homepage sections (`TrendingJobs`, `FeaturedBusinesses`, `BusinessUpdates`) each fetch from Firestore on mount — verify these are bounded with `limit` to avoid over-fetching on the landing page.
- **Accessibility:** Many controls use `aria-label` (good), but the dark theme uses very low-contrast greys (`text-gray-500/600` on `#0a0a1a`) for body copy that may fail WCAG AA; OTP and some icon-only buttons need labels; verify focus-visible styles. Recommend an automated axe/Lighthouse pass once running.

---

## 5. Feature Gap Report — Website vs Mobile App

There is **no mobile app**, so every web capability is, by definition, missing on mobile. The table frames parity targets for the planned Flutter app (Section 11). "Web" = exists in this repo; "App" = to be built.

| Feature area | Web | App | Parity action |
|---|---|---|---|
| Email / Google / Phone-OTP auth | ✅ | ❌ | Build with `firebase_auth` |
| Role-based portals (seeker/employer/admin) | ✅ | ❌ | Mirror role routing |
| Job search + filters | ✅ (needs fixes) | ❌ | Build with server-side pagination from day one |
| Job detail + Apply | ✅ | ❌ | Native job detail + apply sheet |
| Saved jobs / job alerts | ✅ | ❌ | Build; add push notifications |
| Resume / resume builder | ✅ | ❌ | Build (file upload to Storage) |
| Employer dashboard / post job | ✅ | ❌ | Build multi-step post-job form |
| Candidates / talent search / interviews | ✅ | ❌ | Build |
| Company profile + directory | ✅ | ❌ | Build |
| Messaging (conversations) | ✅ | ❌ | Build (Firestore subcollection already modeled) |
| Notifications (in-app) | ✅ | ❌ | Build + FCM push |
| Subscriptions / billing / payment requests | ✅ | ❌ | Build |
| Admin moderation (approve/reject) | ✅ | ❌ | Optional on mobile |
| Offline support | ❌ | ➕ opportunity | Firestore offline persistence is free on mobile |

Note: even on web, several modules look UI-complete but their **backing workflows are partial** — e.g., `requestedBoosts` (BUG-08), and `paymentRequests` (created client-side but the admin grant path was not observed). Confirm these end-to-end before claiming parity.

---

## 6. UI/UX Report

**Strengths:** Consistent dark "glass" aesthetic inside the portals, tasteful framer-motion transitions in the shared `Sidebar`, skeleton loaders and empty states on data-heavy pages, bilingual (English + Tamil) nav labels, sensible responsive sidebar/drawer behaviour.

**Issues:**

| # | Issue | Location | Severity | Fix |
|---|---|---|---|---|
| UX-1 | Public `Header` is **light themed** (white bg, slate/teal) while the entire app is **dark** (`#0a0a1a`, violet/cyan) — a white fixed header floats over a dark page. | `Header.tsx` vs `app/page.tsx`, `jobs/page.tsx`, all portals | Medium | Pick one system. Either make the public header dark to match, or commit to a light marketing site + dark app with an intentional handoff. |
| UX-2 | Dynamic Tailwind colors don't render (selected role/boost/badge states look unstyled). | BUG-07 locations | Medium | Static class map / safelist. |
| UX-3 | `alert()` dialogs for all feedback feel unfinished and block the UI. | BUG-10 (19 files) | Medium | Radix Toast. |
| UX-4 | Low-contrast grey text on near-black backgrounds. | global (`text-gray-500/600`) | Medium | Raise body text to `text-gray-300/400`; verify AA. |
| UX-5 | Two sidebar implementations coexist: a generic animated `components/ui/Sidebar.tsx` and bespoke inline sidebars in each portal `layout.tsx`. Divergent behaviour & maintenance cost. | `Sidebar.tsx` vs `*/layout.tsx` | Low | Consolidate on one. |
| UX-6 | Multi-step forms have no inline field validation/feedback until submit. | post-job, register | Medium | RHF + zod inline errors. |
| UX-7 | Emoji used as UI affordances (📧/📱/🔍/👤) instead of the lucide icon set used elsewhere. | login/jobs | Low | Use consistent icons. |

---

## 7. Performance Report

| Area | Finding | Recommendation |
|---|---|---|
| Data fetching | Jobs page fetches all active jobs, no pagination (BUG-03). Homepage sections fetch on mount. | Paginate; bound homepage queries with `limit`; cache with the already-installed React Query. |
| Images | `images.unoptimized: true` (forced by static export) | Pre-resize/compress on upload to Storage; serve `webp`; constrain dimensions. |
| Real-time listeners | `onSnapshot` listeners in layouts/contexts (notifications limited to 50 — good). Verify listeners are unsubscribed and not duplicated across navigation. | Audit listener lifecycles; prefer one-shot reads where real-time isn't needed. |
| Query-key memoization | `useFirestore`/`useRealtimeStats` build memo keys from **Firestore SDK internal fields** (`_field/_op/_value`, `canonicalString`). Fragile across SDK upgrades/minification → stale or churning listeners. | Pass explicit `deps` (the hook supports it) or derive keys from your own filter inputs, not SDK internals. |
| Bundle | `react-query`, `react-hook-form`, `zod`, `recharts` appear installed but under-/un-used. | Remove unused deps or actually adopt them; run a bundle analysis. |
| Aggregations | Admin/employer/seeker stats use `getCountFromServer` (efficient) and `Promise.all` (good). | Keep; consider caching counts that don't need to be live. |

---

## 8. Security Report

**Overall: the security posture is good for a Firebase SPA** — the rules do the heavy lifting and are well-written.

| ID | Risk | Severity | Detail & Fix |
|---|---|---|---|
| SEC-1 | Demo Admin login (BUG-01) | 🔴 Critical | Public one-click admin sign-in with hardcoded creds. Remove/gate; verify prod accounts. |
| SEC-2 | Hardcoded Firebase config fallback | 🟠 Medium-High | `firebase/config.ts:13-20` hardcodes apiKey/project/RTDB URL as fallbacks. Firebase web API keys are **not secrets** (they identify the project; security is enforced by rules), so this is **not** a credential leak — but committing them and relying on fallbacks is poor hygiene. Move to env-only, and **enable Firebase App Check** to stop API abuse from outside your app. |
| SEC-3 | Firestore rules | 🟢 Strong | `firestore.rules` enforces ownership, admin (claim or stored role), super-admin, company-owner; blocks self-promotion (`isEndUserRole`, `unchanged('role')`); restricts notification updates to `read/isRead` only; default-deny catch-all. Recommend migrating admin to **custom claims** so rules don't pay a `get()` per check, and add server-set claims. |
| SEC-4 | Storage rules | 🟢 Strong | Type + size + owner checks per path; resumes readable only by owner/admin; default-deny. Solid. |
| SEC-5 | CSP allows `'unsafe-inline'` + `'unsafe-eval'` in `script-src` | 🟡 Medium | `firebase.json:34`. Weakens XSS defense (often needed by Firebase/recaptcha). Tighten with nonces/hashes where feasible. |
| SEC-6 | No server-side route protection | 🟡 Medium (by design) | Client-only guards + rules. Acceptable for this architecture; just don't add any "trust the client" logic. Sensitive operations (role changes, approvals) are already rule-gated. |
| SEC-7 | App Check / abuse protection | 🟡 Medium | Not evident. Enable App Check (reCAPTCHA v3 / Play Integrity for mobile) to prevent direct SDK abuse of your Firestore. |
| SEC-8 | Activity-log integrity | 🟢 Note | `activityLogs` create requires `userId == auth.uid`; update/delete denied. Good. |

**OWASP Top-10 quick read:** Access control — enforced by rules (good), but SEC-1 is a direct broken-access-control hole. Injection — N/A for Firestore SDK queries (parameterized). Crypto — Firebase-managed. Misconfig — SEC-2/5/7. Vulnerable components — verify `npm audit` on the dependency set once the sandbox is available.

---

## 9. Database Report (Cloud Firestore)

**Collections (inferred from `firestoreService.ts`, rules, indexes, types):** `users`, `seekerProfiles`, `companies`, `jobs`, `applications`, `savedJobs`, `leads`, `reviews`, `interviews`, `notifications`, `jobAlerts`, `subscriptions`, `payments`, `paymentRequests`, `services`, `serviceRequests`, `advertisements`, `activityLogs`, `broadcasts`, `platformSettings`, `employerSettings`, `franchises`, `supportTickets`, `aiCoachWaitlist`, `conversations/{id}/messages`.

| Topic | Finding |
|---|---|
| Indexes | `firestore.indexes.json` defines composite indexes that match the app's queries (notifications userId+createdAt, jobs companyId/isActive, applications by seeker/company/status, savedJobs, reviews, subscriptions, paymentRequests, etc.). Good coverage. **Verify** every multi-field `where`+`orderBy` in code has a matching index or it will throw at runtime. |
| Deterministic IDs | `applications` and `savedJobs` use `seekerId_jobId` deterministic IDs — clean idempotency and dedupe (`applyToJob`, `saveJob`). |
| Data integrity | `applyToJob` increments `jobs.applicationsCount` via a fenced rule (`isApplicationCounterIncrement`) — nicely constrained. Side-effects (counters, notifications, logs) are wrapped in `runSideEffect` so a failed notification won't fail the apply. |
| Denormalization | Jobs store `companyName`/`companyLogoUrl`; ensure these are updated when a company renames (currently no propagation observed). |
| Type drift | `Notification` is defined twice (`lib/types/index.ts:332` vs `NotificationContext.tsx:13`) with differing fields (`read` vs `read`+`isRead`+`createdAt:any`). The service writes both `read` and `isRead`. Consolidate to one source of truth. |
| Timestamps | Mixed `Date` vs `Timestamp` downstream (BUG-06). Normalize at read. |
| Legacy cleanup | `unsaveJob` performs an extra query+loop to delete pre-deterministic-ID duplicates on every unsave — a small recurring read cost; consider a one-time migration instead. |

---

## 10. Code Quality Report

- **Strengths:** Clear module boundaries; well-documented hooks/services (JSDoc); typed domain model in `lib/types`; consistent component structure; good use of skeletons/empty states; security/infra files are first-class.
- **Type safety:** `: any` / `as any` appears **73 times across 35 files**. Real-time hooks return `as unknown as T` without validation. Recommend tightening (zod-parse Firestore docs at the boundary; type the `useCollection` generics properly).
- **Duplication:** Two `stableValue`/`getConstraintsKey` implementations (`useFirestore.ts` and `useRealtimeStats.ts`) — extract to one util. Two sidebar systems (Section 6, UX-5). Duplicate `Notification` type (Section 9).
- **Dead/unused code:** Stale nav constants (BUG-11); `SALARY_RANGES` in `jobs/page.tsx:21` defined but never rendered; `react-query`/`react-hook-form`/`zod` apparently unused.
- **Fragile coupling:** Query-memo keys depend on Firestore SDK internals (Section 7).
- **Error handling:** Generally good — service side-effects are guarded, listeners have error callbacks that log. User-facing errors over-rely on `alert()`.

---

## 11. Mobile App (Flutter) — Parity & Build Plan

Since no Flutter code exists, this is a build plan to reach feature parity with the web app, plus the splash/login direction you requested.

### 11.1 Recommended stack
- **Flutter 3.x + Dart**, **Riverpod** (or Bloc) for state, **go_router** for navigation.
- **Firebase:** `firebase_core`, `firebase_auth`, `cloud_firestore`, `firebase_storage`, `firebase_messaging` (push), `firebase_app_check`. Reuse the **same Firebase project, the same Firestore data model, and the same security rules** — that guarantees backend/business-rule consistency across web and mobile (your requirement #6).
- Enable **Firestore offline persistence** (on by default on mobile) for free offline support (your requirement #9).

### 11.2 Screen map (mirrors web)
- **Onboarding/Auth:** Splash → role-aware login (email / Google / phone OTP) → register (role picker) → forgot password.
- **Seeker:** dashboard, job search + filters (server-paginated), job detail + apply, saved jobs, job alerts (push), applications, interviews, resume/profile, messages, notifications, subscription, settings.
- **Employer:** dashboard, post job (multi-step), my jobs, candidates, talent search, interviews, leads, messages, reports, company profile, billing/subscription, settings.
- **Admin (optional on mobile):** moderation queue (approve/reject companies & jobs), users.

### 11.3 Splash & login experience (your requirements #7, #8)
- **Splash:** use the existing brand logo (`public/logo.png` on web → bundle as the app asset and the official launcher icon via `flutter_native_splash` + `flutter_launcher_icons`). Animation direction: logo fade/scale-in over the brand gradient (the app already uses violet→indigo / cyan→emerald gradients and `#0a0a1a` base), a subtle progress shimmer, then a smooth route transition into auth. Keep it under ~1.5s and resolve auth state during the animation.
- **Login:** segmented Email / Mobile-OTP control (mirrors web), Google button, role-based redirect after sign-in. **Do not port the demo-login buttons.**
- **Roles:** support the real roles — `job_seeker`, `employer`, `business_owner`, `supplier`, `service_provider`, `admin`. (There is no "Farmer" role; if you want an agriculture vertical, add it as a job/business category — Agriculture already exists in `BUSINESS_CATEGORIES`.)

### 11.4 Parity guardrails
- Build job search **server-paginated from day one** (don't replicate BUG-03).
- Centralize the job-type/status label map (avoid BUG-05).
- Add FCM push for job alerts, application updates, interview scheduling, and messages (the `notifications` model already supports types).

---

## 12. Pending / Incomplete Work

| Module | State | To finish | Effort |
|---|---|---|---|
| AI Coach | Placeholder — "Beta Coming soon" badge (`seeker/ai-coach/page.tsx:125`); `aiCoachWaitlist` collection exists | Decide: ship waitlist capture now, or build the coach | 0.5–N days |
| Job "boosts" | Toggles save `requestedBoosts` but no grant/payment path observed (BUG-08) | Wire to payments + admin approval, or relabel | 2–3 days |
| Payments | `paymentRequests` created client-side; admin grant flow not observed | Confirm/admin-side fulfillment + payment gateway | Project |
| Sorting/filtering | Sort is a no-op; salary-range filter unused (BUG-04) | Implement | 0.5 day |
| Realtime DB | Configured (`database.rules.json`, `rtdb` exported) but usage unclear | Confirm whether used (presence/typing?) or remove | 0.5 day |

*(This list covers what static analysis surfaced; a full pass over all ~90 page/component files plus a running build may reveal more.)*

---

## 13. Product Enhancement Recommendations

- **Search:** server-side pagination + Algolia/Typesense for typo-tolerant full-text and faceted filters (location, salary band, category, freshness).
- **Engagement:** push notifications (web push + FCM mobile) for job alerts, application status, interviews, new messages; saved-search alerts.
- **Employer analytics:** funnel (views → applies → shortlists → hires), time-to-fill, source breakdown — `recharts` is already installed.
- **Trust:** verified-employer badges (rules already model `verificationBadges`), review moderation, report-abuse on listings.
- **Automation:** auto-expire jobs past `deadline`; scheduled digest emails; auto-flag duplicate/spam postings.
- **AI:** finish AI Coach (resume tips, JD matching, interview prep); JD ↔ candidate skill matching using the `skills` arrays already stored.
- **Offline (mobile):** Firestore offline persistence + queued applies.
- **Localization:** the bilingual labels suggest a full Tamil/English i18n layer would resonate with the Theni audience.

---

## 14. Priority Roadmap

### 🔴 Critical — fix immediately (before any production exposure)
1. **BUG-01 / SEC-1** — Remove or dev-gate the Demo Admin login; verify/disable demo accounts in prod.

### 🟠 High — fix before production launch
2. **BUG-02** — Resolve dynamic-route rendering (choose SSR host, query-param routes, or build-time params) so job/company pages are deep-linkable and SEO-indexable.
3. **BUG-03** — Paginate + server-filter job search.
4. **SEC-2 / SEC-7** — Move Firebase config to env-only and enable App Check.

### 🟡 Medium — fix soon (quality & polish)
5. BUG-04 (sort), BUG-05 (WFH filter + label map), BUG-06 (timestamps), BUG-07 (Tailwind classes), BUG-08 (boosts), BUG-09 (validation via RHF+zod), BUG-10 (toasts), UX-1 (header theme), SEC-5 (CSP hardening).

### 🟢 Low — improvement backlog
6. BUG-11 (nav constants), BUG-12 (OTP), BUG-13 (company slug), type-safety cleanup, remove unused deps, consolidate sidebars/utilities/types, finish AI Coach.

### Cross-cutting (parallel track)
7. Build the **Flutter app** per Section 11 once the High web items are resolved (so the mobile client inherits the fixed search/routing patterns).

---

## Appendix A — Files reviewed in depth
`next.config.ts`, `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `package.json`, `README.md`, `AGENTS.md`; `src/lib/firebase/config.ts`, `src/lib/firebase/firestoreService.ts`, `src/lib/types/index.ts`, `src/lib/constants.ts`; `src/contexts/AuthContext.tsx`, `src/contexts/NotificationContext.tsx`; `src/hooks/useAuth.ts`, `src/hooks/useFirestore.ts`, `src/hooks/useRealtimeStats.ts`; `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/app/jobs/page.tsx`, `src/app/jobs/[id]/page.tsx`, `src/app/company/[slug]/page.tsx`, `src/app/admin/dashboard/page.tsx`, `src/app/admin/layout.tsx`, `src/app/employer/layout.tsx`, `src/app/employer/post-job/page.tsx`, `src/app/seeker/layout.tsx`, `src/components/ui/Sidebar.tsx`, `src/components/navigation/Header.tsx`; plus repo-wide pattern scans (`alert(`, dynamic Tailwind classes, `replace('_',' ')`, `: any`).

## Appendix B — Method & limitations
Static (read-only) analysis. The app was **not built, run, or lint-checked** this session (build sandbox unavailable). Findings tied to runtime behaviour (BUG-02 export behaviour, BUG-06 "Invalid Date," index coverage) should be confirmed against a running build and the Next.js 16 documentation, since this Next version intentionally differs from older releases. No source files were modified.
