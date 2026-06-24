# THENIJOBS — Pending Works (Website + App)

**For:** Siddhu · **Date:** 10 June 2026
Consolidated from the web audit (`THENIJOBS_Enterprise_Audit_Report.md`) and the web↔Flutter gap analysis (`THENIJOBS_Web_vs_Flutter_Gap_Analysis.md` + `THENIJOBS_Flutter_Fix_Prompts.md`).
Priority: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low.

---

## A. SHARED / BACKEND (build once — fixes both web & app)

- [ ] 🔴 **Firebase App Check** on Firestore + Storage (stop API scraping/abuse).
- [ ] 🔴 **Talent Search Cloud Function** returning *redacted* candidates (employers can't read `seekerProfiles` directly). Powers web Talent Search **and** app Talent Search.
- [ ] 🟠 **Audit logging** via Cloud Function writing `activityLogs` (web `logActivity` is a no-op; admin Activity Log is empty on both).
- [ ] 🟠 **Hide company PII** — move GST/registration/owner email/phone out of the world-readable `companies` doc.
- [ ] 🟠 **Remove hardcoded Firebase keys** → env vars, rotate.
- [ ] 🟠 **Lock down spammy writes** (`leads`/`reviews`/`conversations`): validation, dedup, eligibility.
- [ ] 🟠 **Enforce email verification**; confirm password reset is wired.
- [ ] 🟡 **Aggregation/counter docs** for dashboard stats + revenue (used by both dashboards).
- [ ] 🟡 **Payment gateway** (Razorpay) with webhooks → server-verified subscriptions (web + app both lack this).

---

## B. WEBSITE (Next.js) pending works

### 🔴 Critical
- [ ] **C2 — Fix HR candidate detail panel**: render contact/experience from the **application doc** (not the forbidden `seekerProfiles`/`users`). `src/app/employer/candidates/page.tsx`.
- [ ] **C1 — Wire Talent Search** to the shared Cloud Function (see A). `src/app/employer/talent-search/page.tsx`.

### 🟠 High
- [ ] **Pagination + server-side filtering** for jobs, candidates, admin lists (no full-collection fetches). `src/app/jobs/page.tsx` etc.
- [ ] **SEO for dynamic content**: pre-render job/company pages, add `JobPosting` JSON-LD, generate sitemap from Firestore. `jobs/[id]`, `app/sitemap.ts`.
- [ ] **Add missing assets**: `og-image.jpg`, `icon-192.png`, `icon-512.png` (referenced but absent). `app/layout.tsx`, `public/manifest.json`.

### 🟡 Medium
- [ ] **Real dashboard stats** (use counter docs; current "realtime" hooks aren't live). `src/hooks/useRealtimeStats.ts`.
- [ ] **Replace all `alert()`** with the Radix toast; accessibility pass (label/htmlFor, aria, contrast, focus).
- [ ] **De-duplicate the 3 portal sidebars** into one shared component.
- [ ] **Input validation** with `zod` (installed, unused) + rule-level field checks.
- [ ] **Batch writes** (`markAllNotificationsRead`) and converge `status`/`verificationStatus`.
- [ ] **Bug fixes**: Sort dropdown does nothing (`jobs/page.tsx`); Share button no-op; WhatsApp fake-number fallback; company links break when slug missing.

### 🟢 Low / cleanup
- [ ] Delete dead code: `src/lib/constants.ts`, `components/ui/{Sidebar,Chart,DataTable,Modal,Breadcrumb}.tsx`.
- [ ] Remove unused deps: `@tanstack/react-query` (+devtools), `date-fns`, `recharts`, `react-hook-form` (or adopt).
- [ ] Delete starter assets: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`, `logo_backup.png`.

---

## C. APP (Flutter) pending works

> Reality: **all 43 seeker/employer/admin screens are placeholder stubs** (`lib/core/routes/route_screens.dart`). Public browse + apply + auth are real. Items below = build the real screens.

### 🔴 Critical / P0–P2
- [ ] **Data parity D1–D6**: `applicationCount`→`applicationsCount`, `profileCompletion`→`profileStrength`, resumes as `resumes[]`, `settings`→`platformSettings`, job status `active`/`rejected`. `route_screens.dart`.
- [ ] **Apply contact**: add `seekerEmail`/`seekerPhone` to mobile applications. `job_detail_screen.dart`.
- [ ] **Resume screen** (upload PDF + builder → `resumes[]`) — *unblocks applying for mobile-only users*. `/seeker/resume`.
- [ ] **Post-Job wizard** — employers currently **can't create jobs** on mobile. `/employer/post-job`.
- [ ] **Candidates pipeline** (real screen) + **notify candidate on shortlist/select/reject**. `/employer/candidates`.
- [ ] **Interview scheduling** form (create interview + notify seeker). `/employer/interviews`.

### 🟠 High / P1–P3
- [ ] **Seeker Profile editor** (+ photo upload). `/seeker/profile`.
- [ ] **Seeker Skills editor** & **Settings save** (today read-only). `/seeker/skills`, `/seeker/settings`.
- [ ] **Job Alert creation** (today only activate/pause). `/seeker/job-alerts`.
- [ ] **Employer Company Profile editor** (+ logo/gallery upload). `/employer/company-profile`.
- [ ] **Talent Search** wired to the shared Cloud Function. `/employer/talent-search`.
- [ ] **Admin user-role management** + **broadcast composer**. `/admin/users`, `/admin/notifications`.

### 🟡 Medium / P4–P5
- [ ] **Messaging threads** (list → thread → send) for seeker & employer. `/seeker/messages`, `/employer/messages`.
- [ ] **Reports with charts** (`fl_chart`) + aggregation counts (stop downloading docs to count). `/employer/reports`, `/admin/reports`.
- [ ] **Settings editors** (employer) + detail views for leads/reviews/services/ads.
- [ ] **Offline cache** via Hive + `connectivity_plus` banner.

### 🔴/🟠 Integrations & store readiness / P6
- [ ] **Wire push notifications** (FCM token, permission, handlers, deep-link taps). `main.dart`, `push_notification_service.dart`.
- [ ] **Wire analytics** + add **Crashlytics**. `analytics_service.dart`.
- [ ] **Disable demo login** for release; add **deep links** (App/Universal Links) + iOS/Android **permission strings** for pickers.
- [ ] **Remove/wire dead deps** (`dio`; keep `cloud_functions` only after Talent Search).

---

## D. Suggested do-first order

1. **Shared:** App Check + start the Talent Search Cloud Function.
2. **Web:** C2 (candidate panel) — 1–2 days, immediate value.
3. **App P0:** data parity + apply contact — 1–2 days.
4. **App P1:** resume screen, then profile/skills/alerts.
5. **App P2:** post-job wizard, candidates pipeline, interview scheduling.
6. **Web high:** pagination, SEO, missing assets.
7. **App P3–P6:** talent search, messaging, admin tools, push/analytics, store readiness.
8. **Cleanup** (web dead code/deps) anytime — fast, low-risk.

**Rough effort:** web fixes ≈ 4–6 weeks; Flutter to parity ≈ 6–9 weeks (overlap on the shared backend items).

---

*Detailed per-item guidance: web → `THENIJOBS_Enterprise_Audit_Report.md`; app → `THENIJOBS_Flutter_Fix_Prompts.md` (copy-paste prompts) and `THENIJOBS_Flutter_App_Walkthrough.md` (target behavior).*
